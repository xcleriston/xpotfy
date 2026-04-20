const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authenticate WebSocket connection using JWT token
const authenticateWebSocket = (req) => {
  try {
    // Get token from query parameters or headers
    const token = req.url.split('token=')[1] || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      logger.warn('No token provided for WebSocket connection');
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Return user information
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
  } catch (error) {
    logger.error('WebSocket authentication error:', error.message);
    return null;
  }
};

// Middleware to authorize WebSocket message
const authorizeWebSocket = (requiredRole = null) => {
  return (ws, req, next) => {
    const user = authenticateWebSocket(req);
    
    if (!user) {
      logger.warn('Unauthorized WebSocket message');
      return ws.close(1008, 'Unauthorized');
    }
    
    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      logger.warn(`Insufficient permissions for WebSocket action. Required role: ${requiredRole}`);
      return ws.close(1008, 'Insufficient permissions');
    }
    
    // Attach user to the request object
    req.user = user;
    next();
  };
};

module.exports = {
  authenticateWebSocket,
  authorizeWebSocket
};
