import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

// Apply admin middleware to all admin routes
router.use(authenticateToken, authorizeRoles('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const [users, totalRow] = await Promise.all([
      db.all(
        `SELECT u.id, u.username, u.role, u.created_at, c.balance 
         FROM users u 
         LEFT JOIN credits c ON u.id = c.user_id 
         ORDER BY u.created_at DESC 
         LIMIT ? OFFSET ?`,
        [parseInt(limit), parseInt(offset)]
      ),
      db.get('SELECT COUNT(*) as count FROM users')
    ]);
    
    const total = totalRow ? totalRow.count : 0;
    
    res.json({
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage user credits
router.post('/users/:userId/credits', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('action').isIn(['add', 'subtract', 'set']).withMessage('Invalid action')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { amount, action } = req.body;
    const { userId } = req.params;
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Check if user exists
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        await db.run('ROLLBACK');
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get current credits
      let credits = await db.get('SELECT * FROM credits WHERE user_id = ?', [userId]);
      
      // If no credits record exists, create one
      if (!credits) {
        await db.run('INSERT INTO credits (user_id, balance) VALUES (?, 0)', [userId]);
        credits = { balance: 0 };
      }
      
      // Update credits based on action
      let newBalance = credits.balance;
      const amountNum = parseFloat(amount);
      
      if (action === 'add') {
        newBalance += amountNum;
      } else if (action === 'subtract') {
        newBalance = Math.max(0, newBalance - amountNum);
      } else if (action === 'set') {
        newBalance = Math.max(0, amountNum);
      }
      
      // Update credits
      await db.run(
        'UPDATE credits SET balance = ? WHERE user_id = ?',
        [newBalance, userId]
      );
      
      // Log admin action
      await db.run(
        `INSERT INTO admin_actions 
         (admin_id, action, target_user_id, details) 
         VALUES (?, ?, ?, ?)`,
        [
          req.user.id,
          'update_credits',
          userId,
          JSON.stringify({
            action,
            amount: amountNum,
            previousBalance: credits.balance,
            newBalance
          })
        ]
      );
      
      // Commit transaction
      await db.run('COMMIT');
      
      res.json({
        userId,
        previousBalance: credits.balance,
        newBalance,
        action,
        amount: amountNum
      });
      
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Credit adjustment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    // Get all stats in parallel
    const [
      usersCount,
      betsCount,
      totalWageredRow,
      totalProfitRow,
      recentActivities
    ] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM users'),
      db.get('SELECT COUNT(*) as count FROM bets'),
      db.get('SELECT SUM(amount) as total FROM bets'),
      db.get('SELECT SUM(CASE WHEN result = ? THEN -amount + payout ELSE 0 END) as profit FROM bets', ['loss']),
      db.all(`
        SELECT a.*, u.username as admin_username, tu.username as target_username 
        FROM admin_actions a
        LEFT JOIN users u ON a.admin_id = u.id
        LEFT JOIN users tu ON a.target_user_id = tu.id
        ORDER BY a.timestamp DESC
        LIMIT 10
      `)
    ]);
    
    const totalUsers = usersCount ? usersCount.count : 0;
    const totalBets = betsCount ? betsCount.count : 0;
    const totalWagered = totalWageredRow ? totalWageredRow.total : 0;
    const totalProfit = totalProfitRow ? totalProfitRow.profit : 0;
    
    res.json({
      totalUsers,
      totalBets,
      totalWagered,
      totalProfit: Math.abs(totalProfit), // Convert to positive
      recentActivities: recentActivities || []
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bet history with filters
router.get('/bets', async (req, res) => {
  try {
    const { userId, type, outcome, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, u.username 
      FROM bets b 
      JOIN users u ON b.user_id = u.id 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (userId) {
      query += ' AND b.user_id = ?';
      params.push(userId);
    }
    
    if (type) {
      query += ' AND b.type = ?';
      params.push(type);
    }
    
    if (outcome) {
      query += ' AND b.result = ?';
      params.push(outcome);
    }
    
    if (startDate) {
      query += ' AND b.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND b.created_at <= ?';
      params.push(endDate);
    }
    
    // Add pagination
    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Get count query
    let countQuery = 'SELECT COUNT(*) as count FROM bets b WHERE 1=1';
    const countParams = [...params.slice(0, -2)]; // Remove limit and offset for count query
    
    const [bets, totalRow] = await Promise.all([
      db.all(query, params),
      db.get(countQuery, countParams.length ? countParams : undefined)
    ]);
    
    const total = totalRow ? totalRow.count : 0;
    
    res.json({
      data: bets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin bets fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
