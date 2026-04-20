const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const { db } = require('../config/database');
const { broadcastToUser } = require('../websockets');
const logger = require('../utils/logger');

// Add credits to a user's account
router.post('/users/:userId/credits', authenticateJWT, isAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    
    // Validate input
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Update user's credits
      db.run(
        'UPDATE tickets SET credits = credits + ?, updated_at = ? WHERE user_id = ?',
        [amount, new Date().toISOString(), userId],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            logger.error('Error updating user credits:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
          }
          
          // Record the credit transaction
          db.run(
            `INSERT INTO admin_transactions (
              id, user_id, amount, type, reason, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), userId, amount, 'credit_adjustment', reason || 'Admin adjustment', new Date().toISOString()],
            function(transErr) {
              if (transErr) {
                db.run('ROLLBACK');
                logger.error('Error recording admin transaction:', transErr);
                return res.status(500).json({ error: 'Internal server error' });
              }
              
              // Get updated user info
              db.get(
                'SELECT u.id, u.username, t.credits FROM users u JOIN tickets t ON u.id = t.user_id WHERE u.id = ?',
                [userId],
                (userErr, user) => {
                  if (userErr) {
                    db.run('ROLLBACK');
                    logger.error('Error fetching updated user info:', userErr);
                    return res.status(500).json({ error: 'Internal server error' });
                  }
                  
                  // Commit transaction
                  db.run('COMMIT');
                  
                  // Notify user via WebSocket if connected
                  broadcastToUser(userId, {
                    type: 'CREDITS_UPDATED',
                    userId,
                    newBalance: user.credits,
                    amount,
                    reason: reason || 'Admin adjustment'
                  });
                  
                  res.json({
                    message: 'Credits added successfully',
                    userId: user.id,
                    username: user.username,
                    newBalance: user.credits,
                    amountAdded: amount
                  });
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    logger.error('Error in POST /admin/users/:userId/credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with pagination
router.get('/users', authenticateJWT, isAdmin, (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    const searchTerm = `%${search}%`;
    
    // Get total count with search
    db.get(
      'SELECT COUNT(*) as total FROM users WHERE username LIKE ?',
      [searchTerm],
      (countErr, countResult) => {
        if (countErr) {
          logger.error('Error counting users:', countErr);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get paginated results with search
        db.all(
          `SELECT u.id, u.username, u.role, u.created_at, t.credits 
           FROM users u 
           LEFT JOIN tickets t ON u.id = t.user_id 
           WHERE u.username LIKE ? 
           ORDER BY u.created_at DESC 
           LIMIT ? OFFSET ?`,
          [searchTerm, parseInt(limit), parseInt(offset)],
          (err, rows) => {
            if (err) {
              logger.error('Error fetching users:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            res.json({
              total: countResult.total,
              limit: parseInt(limit),
              offset: parseInt(offset),
              data: rows.map(user => ({
                ...user,
                credits: user.credits || 0
              }))
            });
          }
        );
      }
    );
  } catch (error) {
    logger.error('Error in GET /admin/users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user details with full history
router.get('/users/:userId', authenticateJWT, isAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user info
    db.get(
      'SELECT id, username, role, created_at FROM users WHERE id = ?',
      [userId],
      (userErr, user) => {
        if (userErr) {
          logger.error('Error fetching user:', userErr);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's ticket info
        db.get(
          'SELECT credits, cost_per_interaction, created_at FROM tickets WHERE user_id = ?',
          [userId],
          (ticketErr, ticket) => {
            if (ticketErr) {
              logger.error('Error fetching user ticket:', ticketErr);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Get user's bet history (last 10)
            db.all(
              `SELECT * FROM bet_rounds 
               WHERE user_id = ? 
               ORDER BY timestamp DESC 
               LIMIT 10`,
              [userId],
              (betsErr, bets) => {
                if (betsErr) {
                  logger.error('Error fetching user bets:', betsErr);
                  return res.status(500).json({ error: 'Internal server error' });
                }
                
                // Get admin transactions for this user
                db.all(
                  `SELECT * FROM admin_transactions 
                   WHERE user_id = ? 
                   ORDER BY created_at DESC 
                   LIMIT 10`,
                  [userId],
                  (transErr, transactions) => {
                    if (transErr) {
                      logger.error('Error fetching admin transactions:', transErr);
                      return res.status(500).json({ error: 'Internal server error' });
                    }
                    
                    res.json({
                      ...user,
                      ticket: ticket || { credits: 0, cost_per_interaction: 1 },
                      recentBets: bets || [],
                      recentTransactions: transactions || []
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    logger.error('Error in GET /admin/users/:userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system statistics
router.get('/stats', authenticateJWT, isAdmin, (req, res) => {
  try {
    // Get total users
    db.get('SELECT COUNT(*) as totalUsers FROM users', [], (usersErr, usersCount) => {
      if (usersErr) {
        logger.error('Error counting users:', usersErr);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Get total bets
      db.get('SELECT COUNT(*) as totalBets, SUM(bet_amount) as totalWagered FROM bet_rounds', [], (betsErr, betsCount) => {
        if (betsErr) {
          logger.error('Error counting bets:', betsErr);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get total credits in circulation
        db.get('SELECT SUM(credits) as totalCredits FROM tickets', [], (creditsErr, credits) => {
          if (creditsErr) {
            logger.error('Error calculating total credits:', creditsErr);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Get recent activity
          db.all(
            `SELECT * FROM bet_rounds 
             ORDER BY timestamp DESC 
             LIMIT 10`,
            [],
            (activityErr, recentActivity) => {
              if (activityErr) {
                logger.error('Error fetching recent activity:', activityErr);
                return res.status(500).json({ error: 'Internal server error' });
              }
              
              res.json({
                totalUsers: usersCount.totalUsers || 0,
                totalBets: betsCount.totalBets || 0,
                totalWagered: betsCount.totalWagered || 0,
                totalCredits: credits.totalCredits || 0,
                recentActivity: recentActivity || []
              });
            }
          );
        });
      });
    });
  } catch (error) {
    logger.error('Error in GET /admin/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
