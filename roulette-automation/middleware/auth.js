import jwt from 'jsonwebtoken';
import db from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify user exists in database
    const userData = await db.get('SELECT id, username, role FROM users WHERE id = ?', [user.id]);
    if (!userData) return res.sendStatus(403);
    
    req.user = userData;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
  };
};
