const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn('JWT verification failed:', err.message);
        return res.sendStatus(403);
      }
      
      // Verify user exists in database
      db.get('SELECT * FROM users WHERE id = ?', [user.id], (err, dbUser) => {
        if (err || !dbUser) {
          logger.warn('User not found in database:', user.id);
          return res.sendStatus(403);
        }
        
        req.user = dbUser;
        next();
      });
    });
  } else {
    res.sendStatus(401);
  }
};

// Middleware to check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn('Unauthorized admin access attempt by user:', req.user?.id);
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticateJWT,
  isAdmin,
  generateToken
};
