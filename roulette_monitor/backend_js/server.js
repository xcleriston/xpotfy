require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const logger = require('./utils/logger');
const database = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const betRoutes = require('./routes/bets');
const adminRoutes = require('./routes/admin');
const rouletteRoutes = require('./routes/roulette');
const { initializeWebSocket } = require('./websockets');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization
database.initialize();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roulette', rouletteRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});


// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = { app, server };
