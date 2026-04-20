import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import db from '../db.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [user, credits] = await Promise.all([
      db.get('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id]),
      db.get('SELECT balance FROM credits WHERE user_id = ?', [req.user.id])
    ]);
    
    res.json({
      ...user,
      balance: credits ? credits.balance : 0
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    // Get current user data
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    // If changing password, verify current password
    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    }
    
    // Update email if provided
    if (email) {
      await db.run('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user betting history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const [bets, totalRow] = await Promise.all([
      db.all(
        'SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [req.user.id, parseInt(limit), parseInt(offset)]
      ),
      db.get('SELECT COUNT(*) as count FROM bets WHERE user_id = ?', [req.user.id])
    ]);
    
    const total = totalRow ? totalRow.count : 0;
    
    res.json({
      data: bets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
