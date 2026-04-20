const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateJWT } = require('../middleware/auth');
const { db } = require('../config/database');
const { broadcastToUser } = require('../websockets');
const logger = require('../utils/logger');

// Place a bet
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { bet_color: betColor, bet_amount: betAmount, site = 'blaze.bet.br', game = 'mega_fire_blaze' } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!betColor || !betAmount) {
      return res.status(400).json({ error: 'Bet color and amount are required' });
    }
    
    if (!['red', 'black', 'green'].includes(betColor.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid bet color. Must be red, black, or green' });
    }
    
    if (isNaN(betAmount) || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Get user's current credits
      db.get('SELECT credits FROM tickets WHERE user_id = ?', [userId], (err, ticket) => {
        if (err) {
          db.run('ROLLBACK');
          logger.error('Error fetching user ticket:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!ticket || ticket.credits < betAmount) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Insufficient credits' });
        }
        
        // Deduct bet amount from user's credits
        db.run(
          'UPDATE tickets SET credits = credits - ?, updated_at = ? WHERE user_id = ?',
          [betAmount, new Date().toISOString(), userId],
          function(updateErr) {
            if (updateErr) {
              db.run('ROLLBACK');
              logger.error('Error updating user credits:', updateErr);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Simulate roulette result (in a real app, this would come from the game)
            const result = simulateRouletteSpin();
            const isWin = result === betColor.toLowerCase();
            let profit = 0;
            
            // Calculate winnings
            if (isWin) {
              if (result === 'green') {
                profit = betAmount * 14; // 14:1 payout for green
              } else {
                profit = betAmount * 2; // 2:1 payout for red/black
              }
              
              // Add winnings to user's credits
              db.run(
                'UPDATE tickets SET credits = credits + ?, updated_at = ? WHERE user_id = ?',
                [profit, new Date().toISOString(), userId],
                function(winErr) {
                  if (winErr) {
                    db.run('ROLLBACK');
                    logger.error('Error updating user credits with winnings:', winErr);
                    return res.status(500).json({ error: 'Internal server error' });
                  }
                  
                  // Record the bet
                  recordBet(userId, betColor, betAmount, result, profit, 'manual', site, game, res);
                }
              );
            } else {
              // Record the loss
              recordBet(userId, betColor, betAmount, result, -betAmount, 'manual', site, game, res);
            }
          }
        );
      });
    });
  } catch (error) {
    logger.error('Error in POST /bets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to simulate a roulette spin
function simulateRouletteSpin() {
  const random = Math.random();
  if (random < 0.47) return 'red';
  if (random < 0.94) return 'black';
  return 'green'; // 6% chance for green (0)
}

// Helper function to record a bet in the database
function recordBet(userId, betColor, betAmount, result, profit, strategy, site, game, res) {
  const betId = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO bet_rounds (
      id, user_id, timestamp, bet_color, bet_amount, 
      result, profit, strategy, site, game
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [betId, userId, now, betColor, betAmount, result, profit, strategy, site, game],
    function(err) {
      if (err) {
        db.run('ROLLBACK');
        logger.error('Error recording bet:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Get updated user credits
      db.get('SELECT credits FROM tickets WHERE user_id = ?', [userId], (creditsErr, ticket) => {
        if (creditsErr) {
          db.run('ROLLBACK');
          logger.error('Error fetching updated credits:', creditsErr);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Commit transaction
        db.run('COMMIT');
        
        // Prepare response
        const response = {
          message: 'Bet placed successfully',
          bet: {
            id: betId,
            userId,
            betColor,
            betAmount,
            result,
            profit,
            timestamp: now,
            credits: ticket.credits
          }
        };
        
        // Notify user via WebSocket
        broadcastToUser(userId, {
          type: 'BET_RESULT',
          ...response.bet
        });
        
        res.status(201).json(response);
      });
    }
  );
}

// Get bet history
router.get('/', authenticateJWT, (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM bet_rounds WHERE user_id = ?', [userId], (err, countResult) => {
      if (err) {
        logger.error('Error counting bets:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Get paginated results
      db.all(
        `SELECT * FROM bet_rounds 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ? OFFSET ?`,
        [userId, parseInt(limit), parseInt(offset)],
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
    logger.error('Error in GET /bets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bet by ID
router.get('/:id', authenticateJWT, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    db.get(
      'SELECT * FROM bet_rounds WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, row) => {
        if (err) {
          logger.error('Error fetching bet:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Bet not found' });
        }
        
        res.json(row);
      }
    );
  } catch (error) {
    logger.error('Error in GET /bets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
