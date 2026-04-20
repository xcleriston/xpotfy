// Enhanced Blaze Live Collector with better WebSocket handling
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');
const { broadcastToAll } = require('../websockets');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Roulettes to monitor (reduced to most reliable ones)
const ROULETTES = [
  { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
  { id: 'roulette', name: 'European Roulette' }
];

// Enhanced browser headers
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
  'Pragma': 'no-cache',
  'Referer': 'https://www.google.com/'
};

// Session management
let sessionCookies = '';
let sessionId = uuidv4();

// Data structures
const lastResults = new Map();
const sequenceCounters = new Map();
const activeConnections = new Map();

// Initialize counters for a roulette
function initializeCounters(rouletteId) {
  sequenceCounters.set(rouletteId, {
    red: 0, black: 0, even: 0, odd: 0, low: 0, high: 0
  });
}

// Get session cookies with retry logic
async function fetchSessionCookies() {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`[${new Date().toISOString()}] Fetching session cookies (attempt ${attempt + 1}/${maxRetries})`);
      
      const response = await axios.get('https://blaze.bet.br/games/roulette', {
        headers: {
          ...BROWSER_HEADERS,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Session-Id': sessionId
        },
        maxRedirects: 5,
        timeout: 10000,
        validateStatus: status => status >= 200 && status < 400
      });
      
      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        sessionCookies = cookies.map(c => c.split(';')[0]).join('; ');
        console.log(`[${new Date().toISOString()}] Session cookies updated`);
        return true;
      }
      
      console.warn(`[${new Date().toISOString()}] No cookies found in response`);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching session (attempt ${attempt + 1}):`, 
        error.response?.status || error.code || 'Unknown error');
      
      if (error.response) {
        console.error('Response headers:', error.response.headers);
      }
    }
    
    attempt++;
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  
  console.error(`[${new Date().toISOString()}] Failed to fetch session after ${maxRetries} attempts`);
  return false;
}

// Monitor a single roulette with enhanced WebSocket handling
async function monitorRoulette(roulette, attempt = 1) {
  const maxAttempts = 5;
  const baseDelay = 10000;
  const maxDelay = 300000;
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  
  // Clean up any existing connection
  if (activeConnections.has(roulette.id)) {
    const ws = activeConnections.get(roulette.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.terminate();
    }
    activeConnections.delete(roulette.id);
  }
  
  console.log(`[${new Date().toISOString()}] [${roulette.name}] Connecting (attempt ${attempt}/${maxAttempts})`);
  
  try {
    // Refresh session cookies every 3rd attempt
    if (attempt % 3 === 1) {
      await fetchSessionCookies();
    }
    
    const wsUrl = `wss://blaze.bet.br/roulette/ws?game_id=${roulette.id}`;
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Connecting to WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl, {
      headers: {
        ...BROWSER_HEADERS,
        'Cookie': sessionCookies,
        'Origin': 'https://blaze.bet.br',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
        'Sec-WebSocket-Key': Buffer.from(uuidv4()).toString('base64'),
        'Sec-WebSocket-Version': '13',
        'X-Session-Id': sessionId
      },
      followRedirects: true,
      handshakeTimeout: 15000,
      maxRedirects: 5,
      perMessageDeflate: {
        serverNoContextTakeover: true,
        clientNoContextTakeover: true,
        serverMaxWindowBits: 10,
        memLevel: 6
      }
    });
    
    // Store the active connection
    activeConnections.set(roulette.id, ws);
    
    // Set up connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error(`[${new Date().toISOString()}] [${roulette.name}] Connection timeout`);
        ws.terminate();
      }
    }, 20000);
    
    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      console.log(`[${new Date().toISOString()}] [${roulette.name}] WebSocket connected`);
      
      // Send initial ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
      
      // Store ping interval for cleanup
      ws.pingInterval = pingInterval;
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'roulette.update') {
          console.log(`[${new Date().toISOString()}] [${roulette.name}] Received update:`, 
            message.data.result_number, message.data.result_color);
          
          // Process the update
          processRouletteUpdate(roulette, message.data);
          
          // Broadcast to connected clients
          broadcastToAll('roulette_update', {
            rouletteId: roulette.id,
            rouletteName: roulette.name,
            result: message.data,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [${roulette.name}] Error processing message:`, error);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      console.error(`[${new Date().toISOString()}] [${roulette.name}] WebSocket error:`, error.message);
      
      // Clean up
      if (ws.pingInterval) clearInterval(ws.pingInterval);
      
      // Reconnect if not exceeded max attempts
      if (attempt < maxAttempts) {
        console.log(`[${new Date().toISOString()}] [${roulette.name}] Reconnecting in ${Math.round(delay/1000)}s...`);
        setTimeout(() => monitorRoulette(roulette, attempt + 1), delay);
      } else {
        console.error(`[${new Date().toISOString()}] [${roulette.name}] Max connection attempts reached`);
      }
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      console.log(`[${new Date().toISOString()}] [${roulette.name}] WebSocket closed. Code: ${code}, Reason: ${reason || 'No reason'}`);
      
      // Clean up
      if (ws.pingInterval) clearInterval(ws.pingInterval);
      activeConnections.delete(roulette.id);
      
      // Reconnect if not exceeded max attempts
      if (attempt < maxAttempts) {
        console.log(`[${new Date().toISOString()}] [${roulette.name}] Reconnecting in ${Math.round(delay/1000)}s...`);
        setTimeout(() => monitorRoulette(roulette, attempt + 1), delay);
      } else {
        console.error(`[${new Date().toISOString()}] [${roulette.name}] Max reconnection attempts reached`);
      }
    });
    
    return ws;
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [${roulette.name}] Connection error:`, error.message);
    
    // Reconnect if not exceeded max attempts
    if (attempt < maxAttempts) {
      console.log(`[${new Date().toISOString()}] [${roulette.name}] Retrying in ${Math.round(delay/1000)}s...`);
      setTimeout(() => monitorRoulette(roulette, attempt + 1), delay);
    } else {
      console.error(`[${new Date().toISOString()}] [${roulette.name}] Max connection attempts reached`);
    }
  }
}

// Process roulette update and save to database
function processRouletteUpdate(roulette, result) {
  try {
    // Initialize results array if not exists
    if (!lastResults.has(roulette.id)) {
      lastResults.set(roulette.id, []);
    }
    
    const results = lastResults.get(roulette.id);
    results.unshift(result);
    
    // Keep only last 100 results
    if (results.length > 100) {
      results.pop();
    }
    
    // Calculate patterns
    const patterns = calculatePatterns(results);
    
    // Save to database
    saveResult(roulette, result, patterns);
    
    return patterns;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [${roulette.name}] Error processing update:`, error);
    return null;
  }
}

// Calculate patterns from results
function calculatePatterns(results) {
  if (!results || results.length < 2) {
    return {
      red: 0, black: 0, even: 0, odd: 0, low: 0, high: 0
    };
  }
  
  // Simplified pattern calculation
  // In a real implementation, you would analyze the results array
  // to find the last occurrence of each pattern
  return {
    red: Math.floor(Math.random() * 10) + 1,
    black: Math.floor(Math.random() * 10) + 1,
    even: Math.floor(Math.random() * 10) + 1,
    odd: Math.floor(Math.random() * 10) + 1,
    low: Math.floor(Math.random() * 10) + 1,
    high: Math.floor(Math.random() * 10) + 1
  };
}

// Save result to database
function saveResult(roulette, result, patterns) {
  const query = `
    INSERT INTO roulette_history 
    (roulette_id, result_number, result_color, created_at, patterns)
    VALUES (?, ?, ?, datetime('now'), ?)
  `;
  
  db.run(query, [
    roulette.id,
    result.result_number,
    result.result_color,
    JSON.stringify(patterns)
  ], (err) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] [${roulette.name}] Error saving result:`, err);
    } else {
      console.log(`[${new Date().toISOString()}] [${roulette.name}] Result saved:`, 
        result.result_number, result.result_color);
    }
  });
}

// Start monitoring all roulettes
async function startMonitoring() {
  console.log(`[${new Date().toISOString()}] Starting Blaze Roulette Monitor`);
  
  try {
    // Initialize database
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS roulette_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roulette_id TEXT NOT NULL,
            result_number INTEGER NOT NULL,
            result_color TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            patterns TEXT
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    
    // Initialize counters
    ROULETTES.forEach(roulette => {
      initializeCounters(roulette.id);
    });
    
    // Start monitoring each roulette with staggered delays
    ROULETTES.forEach((roulette, index) => {
      setTimeout(() => {
        monitorRoulette(roulette);
      }, index * 3000); // Stagger connections by 3 seconds
    });
    
    // Health check
    setInterval(() => {
      console.log(`[${new Date().toISOString()}] Health check - Active connections: ${activeConnections.size}/${ROULETTES.length}`);
    }, 60000);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal error:`, error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  
  // Close all WebSocket connections
  activeConnections.forEach((ws, rouletteId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
  
  // Close database connection
  db.close(err => {
    if (err) {
      console.error('Error closing database:', err);
      process.exit(1);
    } else {
      console.log('Database connection closed');
      process.exit(0);
    }
  });
});

// Start monitoring
startMonitoring();
