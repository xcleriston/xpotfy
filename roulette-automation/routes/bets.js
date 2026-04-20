import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../db.js';
import { io } from '../server.js';

const router = Router();

// Place a bet
router.post('/place', authenticateToken, async (req, res) => {
  try {
    const { amount, type, numbers } = req.body;
    
    // Validate bet amount
    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid bet amount' });
    }
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Check user balance
      const userBalance = await db.get('SELECT balance FROM credits WHERE user_id = ?', [req.user.id]);
      if (!userBalance || userBalance.balance < amount) {
        await db.run('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Deduct bet amount from balance
      await db.run(
        'UPDATE credits SET balance = balance - ? WHERE user_id = ?',
        [amount, req.user.id]
      );
      
      // Simulate a roulette spin
      const result = simulateRouletteSpin();
      const isWin = checkBetResult(result, type, numbers);
      const payout = isWin ? calculatePayout(amount, type) : 0;
      
      // Update balance with winnings
      if (payout > 0) {
        await db.run(
          'UPDATE credits SET balance = balance + ? WHERE user_id = ?',
          [payout, req.user.id]
        );
      }
      
      // Record the bet
      const betRecord = await db.run(
        `INSERT INTO bets 
        (user_id, amount, type, numbers, result, payout, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          req.user.id,
          amount,
          type,
          JSON.stringify(numbers),
          isWin ? 'win' : 'loss',
          payout
        ]
      );
      
      // Commit the transaction
      await db.run('COMMIT');
      
      // Get updated balance
      const updatedBalance = await db.get('SELECT balance FROM credits WHERE user_id = ?', [req.user.id]);
      
      // Emit real-time update
      io.to(`user_${req.user.id}`).emit('balance_update', { 
        balance: updatedBalance ? updatedBalance.balance : 0 
      });
      
      return res.json({
        success: true,
        result,
        isWin,
        payout,
        newBalance: updatedBalance ? updatedBalance.balance : 0
      });
      
    } catch (error) {
      // Rollback in case of error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Bet placement error:', error);
    return res.status(500).json({ message: 'Error placing bet' });
  }
});

// Get current balance
router.get('/balance', authenticateToken, (req, res) => {
  try {
    const balance = db.prepare('SELECT balance FROM credits WHERE user_id = ?')
      .get(req.user.id);
    
    res.json({ balance: balance ? balance.balance : 0 });
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ message: 'Error fetching balance' });
  }
});

// Get current game status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    // In a real app, this would get the current game status from the roulette table
    const status = {
      currentRound: `R${Math.floor(Math.random() * 10000)}`,
      status: 'accepting_bets', // 'accepting_bets', 'no_more_bets', 'spinning', 'payout'
      timeRemaining: 15, // seconds
      lastResults: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34] // Last 10 results
    };
    
    res.json(status);
  } catch (error) {
    console.error('Game status error:', error);
    res.status(500).json({ message: 'Error getting game status' });
  }
});

// Helper functions for roulette simulation
function simulateRouletteSpin() {
  // Returns a number between 0 and 36 (0 = green, 1-36 = red/black)
  return Math.floor(Math.random() * 37);
}

function checkBetResult(result, betType, betNumbers) {
  // Convert betNumbers to array if it's a string
  const numbers = Array.isArray(betNumbers) ? betNumbers : [betNumbers];
  
  switch (betType) {
    case 'straight':
      // Bet on a single number
      return numbers.some(n => parseInt(n) === result);
      
    case 'split':
      // Bet on two adjacent numbers
      return numbers.some(n => {
        const num = parseInt(n);
        return num === result || (num + 1 === result && num % 3 !== 0);
      });
      
    case 'street':
      // Bet on a row of three numbers (e.g., 1-2-3)
      const firstInStreet = Math.floor((result - 1) / 3) * 3 + 1;
      return numbers.some(n => parseInt(n) === firstInStreet);
      
    case 'corner':
      // Bet on four numbers that meet at a corner (e.g., 1-2-4-5)
      return numbers.some(n => {
        const num = parseInt(n);
        return (
          result === num ||
          result === num + 1 ||
          result === num + 3 ||
          result === num + 4
        );
      });
      
    case 'red':
      const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      return redNumbers.includes(result);
      
    case 'black':
      const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
      return blackNumbers.includes(result);
      
    case 'even':
      return result !== 0 && result % 2 === 0;
      
    case 'odd':
      return result % 2 === 1;
      
    case 'low':
      return result >= 1 && result <= 18;
      
    case 'high':
      return result >= 19 && result <= 36;
      
    case 'dozen':
      const dozen = parseInt(numbers[0]);
      if (dozen === 1) return result >= 1 && result <= 12;
      if (dozen === 2) return result >= 13 && result <= 24;
      if (dozen === 3) return result >= 25 && result <= 36;
      return false;
      
    case 'column':
      const column = parseInt(numbers[0]);
      return result % 3 === (column % 3) && result !== 0;
      
    default:
      return false;
  }
}

function calculatePayout(amount, betType) {
  // Payout multipliers
  const payouts = {
    'straight': 35,  // 35:1 for single number
    'split': 17,     // 17:1 for split
    'street': 11,    // 11:1 for street
    'corner': 8,     // 8:1 for corner
    'red': 1,        // 1:1 for red/black
    'black': 1,
    'even': 1,       // 1:1 for even/odd
    'odd': 1,
    'low': 1,        // 1:1 for low/high
    'high': 1,
    'dozen': 2,      // 2:1 for dozen
    'column': 2      // 2:1 for column
  };
  
  return amount * (payouts[betType] || 0) + amount; // Return winnings + original bet
}

export default router;
