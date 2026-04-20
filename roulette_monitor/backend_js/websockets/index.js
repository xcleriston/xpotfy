const WebSocket = require('ws');
const logger = require('../utils/logger');
const { authenticateWebSocket } = require('../middleware/wsAuth');

// Store connected clients
const clients = new Map();

// WebSocket server setup
const setupWebSocket = (wss) => {
  wss.on('connection', (ws, req) => {
    // Authenticate the WebSocket connection
    const user = authenticateWebSocket(req);
    
    if (!user) {
      logger.warn('Unauthorized WebSocket connection attempt');
      return ws.close(1008, 'Unauthorized');
    }
    
    const clientId = user.id;
    logger.info(`Client connected: ${clientId}`);
    
    // Store the WebSocket connection with user info
    clients.set(clientId, { ws, user });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'WebSocket connection established',
      userId: clientId,
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, clientId, data);
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      logger.info(`Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      clients.delete(clientId);
    });
  });
  
  logger.info('WebSocket server is running');
};

// Handle different types of WebSocket messages
const handleWebSocketMessage = (ws, clientId, data) => {
  const { type, payload } = data;
  
  switch (type) {
    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      break;
      
    case 'SUBSCRIBE':
      // Handle subscription to different channels (e.g., game updates, notifications)
      handleSubscription(ws, clientId, payload);
      break;
      
    case 'BET_PLACED':
      // Handle bet placement from client
      handleBetPlaced(clientId, payload);
      break;
      
    default:
      logger.warn(`Unknown WebSocket message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        timestamp: new Date().toISOString()
      }));
  }
};

// Handle client subscriptions
const handleSubscription = (ws, clientId, payload) => {
  const { channel } = payload;
  const client = clients.get(clientId);
  
  if (!client) {
    logger.warn(`Client not found: ${clientId}`);
    return;
  }
  
  // Store subscription
  client.subscriptions = client.subscriptions || new Set();
  client.subscriptions.add(channel);
  
  logger.info(`Client ${clientId} subscribed to channel: ${channel}`);
  
  ws.send(JSON.stringify({
    type: 'SUBSCRIPTION_ADDED',
    channel,
    timestamp: new Date().toISOString()
  }));
};

// Handle bet placement
const handleBetPlaced = async (clientId, betData) => {
  const client = clients.get(clientId);
  
  if (!client) {
    logger.warn(`Client not found: ${clientId}`);
    return;
  }
  
  // Here you would typically:
  // 1. Validate the bet
  // 2. Check user balance
  // 3. Process the bet
  // 4. Update user balance
  // 5. Broadcast the result
  
  // For now, just echo back the bet
  broadcastToUser(clientId, {
    type: 'BET_RECEIVED',
    bet: betData,
    timestamp: new Date().toISOString()
  });
};

// Broadcast message to all connected clients
const broadcast = (message) => {
  const messageString = typeof message === 'string' ? message : JSON.stringify(message);
  
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageString);
    }
  });
};

// Send message to a specific user
const broadcastToUser = (userId, message) => {
  const client = clients.get(userId);
  
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
};

// Send message to all users with a specific role
const broadcastToRole = (role, message) => {
  const messageString = typeof message === 'string' ? message : JSON.stringify(message);
  
  clients.forEach(({ ws, user }) => {
    if (user.role === role && ws.readyState === WebSocket.OPEN) {
      ws.send(messageString);
    }
  });
};

module.exports = {
  setupWebSocket,
  broadcast,
  broadcastToUser,
  broadcastToRole,
  clients
};
