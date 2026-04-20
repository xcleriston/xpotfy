const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const { db } = require('../config/database');
const logger = require('../utils/logger');

// Get current user profile
router.get('/me', authenticateJWT, (req, res) => {
  try {
    const { id, username, role } = req.user;
    
    // Get user's ticket information
    db.get('SELECT credits, cost_per_interaction FROM tickets WHERE user_id = ?', [id], (err, ticket) => {
      if (err) {
        logger.error('Error fetching user ticket:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({
        id,
        username,
        role,
        credits: ticket ? ticket.credits : 0,
        costPerInteraction: ticket ? ticket.cost_per_interaction : 1
      });
    });
  } catch (error) {
    logger.error('Error in GET /me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateJWT, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    db.get('SELECT id, username, role, created_at FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        logger.error('Error fetching user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get user's ticket information
      db.get('SELECT credits, cost_per_interaction FROM tickets WHERE user_id = ?', [id], (err, ticket) => {
        if (err) {
          logger.error('Error fetching user ticket:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        res.json({
          ...user,
          credits: ticket ? ticket.credits : 0,
          costPerInteraction: ticket ? ticket.cost_per_interaction : 1
        });
      });
    });
  } catch (error) {
    logger.error('Error in GET /:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', authenticateJWT, (req, res) => {
  try {
    const { id } = req.user;
    const { username, password } = req.body;
    const updates = [];
    const params = [];
    
    // Build dynamic update query
    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    
    if (password) {
      // In a real app, you would hash the password here
      updates.push('password = ?');
      params.push(password); // Note: You should hash this password before saving
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    // Add updated_at timestamp
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    
    // Add user ID for WHERE clause
    params.push(id);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, params, function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Username already exists' });
        }
        logger.error('Error updating user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'User updated successfully' });
    });
  } catch (error) {
    logger.error('Error in PUT /me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bet history
router.get('/:id/history', authenticateJWT, (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Check if user is requesting their own data or is an admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM bet_rounds WHERE user_id = ?', [id], (err, countResult) => {
      if (err) {
        logger.error('Error counting bets:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Get paginated results
      db.all(
        'SELECT * FROM bet_rounds WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [id, parseInt(limit), parseInt(offset)],
        (err, rows) => {
          if (err) {
            logger.error('Error fetching bet history:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          res.json({
            total: countResult.total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            data: rows
          });
        }
      );
    });
  } catch (error) {
    logger.error('Error in GET /:id/history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/', authenticateJWT, isAdmin, (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM users', [], (err, countResult) => {
      if (err) {
        logger.error('Error counting users:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Get paginated results
      db.all(
        'SELECT id, username, role, created_at FROM users LIMIT ? OFFSET ?',
        [parseInt(limit), parseInt(offset)],
        (err, rows) => {
          if (err) {
            logger.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          res.json({
            total: countResult.total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            data: rows
          });
        }
      );
    });
  } catch (error) {
    logger.error('Error in GET /:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
