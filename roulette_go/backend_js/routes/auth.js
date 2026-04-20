const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { generateToken, authenticateJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        logger.error('Database error during user check:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (user) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userId = uuidv4();
        const now = new Date().toISOString();
        
        // Start transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          // Create user
          db.run(
            'INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
            [userId, username, hashedPassword, 'user', now],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                logger.error('Error creating user:', err);
                return res.status(500).json({ error: 'Error creating user' });
              }
              
              // Create user ticket
              db.run(
                'INSERT INTO tickets (id, user_id, credits, cost_per_interaction, created_at) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), userId, 100, 1, now],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    logger.error('Error creating user ticket:', err);
                    return res.status(500).json({ error: 'Error creating user ticket' });
                  }
                  
                  // Commit transaction
                  db.run('COMMIT');
                  
                  // Generate token
                  const token = generateToken({
                    id: userId,
                    username,
                    role: 'user'
                  });
                  
                  res.status(201).json({
                    message: 'User registered successfully',
                    token,
                    user: {
                      id: userId,
                      username,
                      role: 'user'
                    }
                  });
                }
              );
            }
          );
        });
      } catch (error) {
        logger.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    logger.error('Error in register route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', (req, res) => {
  try {
    console.log('Requisição de login recebida:', { 
      body: req.body,
      headers: req.headers 
    });
    
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      console.log('Falha na validação: usuário ou senha ausentes');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    console.log(`Buscando usuário no banco de dados: ${username}`);
    
    // Find user by username
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário no banco de dados:', err);
        logger.error('Database error during login:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Check if user exists
      if (!user) {
        console.log(`Usuário não encontrado: ${username}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log('Usuário encontrado no banco de dados:', { 
        id: user.id, 
        username: user.username,
        role: user.role 
      });
      
      try {
        console.log('Verificando senha...');
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Resultado da comparação de senha:', isMatch);
        
        if (!isMatch) {
          console.log('Senha incorreta para o usuário:', username);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log('Gerando token JWT...');
        // Generate token
        const tokenPayload = {
          id: user.id,
          username: user.username,
          role: user.role
        };
        
        console.log('Payload do token:', tokenPayload);
        const token = generateToken(tokenPayload);
        console.log('Token gerado:', token.substring(0, 20) + '...');
        
        // Get user ticket info
        console.log('Buscando informações do ticket do usuário...');
        db.get('SELECT credits, cost_per_interaction FROM tickets WHERE user_id = ?', [user.id], (err, ticket) => {
          if (err) {
            console.error('Erro ao buscar ticket do usuário:', err);
            logger.error('Error fetching user ticket:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          res.json({
            message: 'Login successful',
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              credits: ticket ? ticket.credits : 0,
              costPerInteraction: ticket ? ticket.cost_per_interaction : 1
            }
          });
        });
      } catch (error) {
        logger.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    logger.error('Error in login route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user data
router.get('/me', authenticateJWT, (req, res) => {
  try {
    // Remove sensitive data before sending user info
    const { password, reset_token, ...userData } = req.user;
    res.json({ user: userData });
  } catch (error) {
    logger.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
