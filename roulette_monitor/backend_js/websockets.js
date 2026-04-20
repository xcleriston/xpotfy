const { WebSocketServer } = require('ws');
const logger = require('./utils/logger');

// Store all connected WebSocket clients
const clients = new Set();
let wss = null;

// Initialize WebSocket server
function initializeWebSocket(server) {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    // Add new client to the set
    clients.add(ws);
    logger.info('New WebSocket client connected');
    
    // Handle client disconnection
    ws.on('close', () => {
      clients.delete(ws);
      logger.info('WebSocket client disconnected');
    });
    
    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });
  
  logger.info('WebSocket server initialized');
}

// Broadcast a message to all connected clients
function broadcastToAll(type, data) {
  if (!wss) {
    logger.warn('WebSocket server not initialized');
    return;
  }
  
  const message = JSON.stringify({ type, data });
  let clientCount = 0;
  
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
      clientCount++;
    }
  });
  
  logger.debug(`Broadcasted ${type} to ${clientCount} clients`);
}

// Get the WebSocket server instance
function getWss() {
  return wss;
}

module.exports = {
  initializeWebSocket,
  broadcastToAll,
  getWss
};
