// Enhanced WebSocket collector for Blaze roulette results
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Database configuration
const DB_PATH = path.join(__dirname, '../../data/roulette.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    log('Connected to SQLite database');
  }
});

// Function to save game result to database
function saveGameResult(gameData) {
  if (!gameData || !gameData.round_id) return;
  
  const { game_id, round_id, result_number, result_color } = gameData;
  
  // Ensure we have required fields
  if (!game_id || !round_id) {
    log('Missing required fields for game result:', { game_id, round_id });
    return;
  }
  
  const query = `
    INSERT OR IGNORE INTO roulette_history 
    (game_id, round_id, result_number, result_color, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `;
  
  db.run(query, [game_id, round_id, result_number, result_color], function(err) {
    if (err) {
      log('Error saving game result to database:', err.message);
    } else if (this.changes > 0) {
      log(`Saved game result: ${game_id} - Round ${round_id} - ${result_number} ${result_color}`);
    }
  });
}

// Configuration
const BLAZE_URL = 'https://blaze.bet.br/games/roleta-brasileira';
const OUTPUT_DIR = path.join(__dirname, '../../logs');
const WS_PATTERNS = [
  'wss://api-v2.blaze.bet.br',
  'wss://*.blaze.bet.br',
  'wss://*.blaze.com',
  'wss://*.blaze-*.com'
];

// Ensure logs directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create a writable stream for logging
const logStream = fs.createWriteStream(path.join(OUTPUT_DIR, 'websocket_enhanced.log'), { flags: 'a' });

// Function to log with timestamp to both console and file
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  logStream.write(logMessage);
}

// Track WebSocket connections and their data
const activeConnections = new Map();
const capturedData = [];

// Function to check if URL matches any WebSocket pattern
function isMatchingWebSocketUrl(url) {
  return WS_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace('.', '\.').replace('*', '.*'));
    return regex.test(url);
  });
}

// Function to process WebSocket messages
function processWebSocketMessage(wsUrl, message) {
  if (!message || typeof message !== 'string') return;
  
  try {
    // Try to parse as JSON first
    try {
      const data = JSON.parse(message);
      if (data && typeof data === 'object') {
        log(`[${wsUrl}] Received JSON message:`, data);
        
        // Look for roulette data patterns
        if (data.data && (data.data.kind === 'roulette' || data.data.kind === 'crash' || data.data.kind === 'doubles')) {
          const gameData = data.data;
          log(`[${wsUrl}] Game data received (${gameData.kind}):`, gameData);
          
          // Save to database
          saveGameResult({
            game_id: gameData.game_id || 'roleta-brasileira', // Default game ID if not provided
            round_id: gameData.id || gameData.round_id || Date.now().toString(),
            result_number: gameData.number,
            result_color: gameData.color
          });
          
          // Store the captured data for logging
          capturedData.push({
            timestamp: new Date().toISOString(),
            type: gameData.kind,
            data: gameData
          });
          
          // Save to file periodically (for debugging)
          if (capturedData.length % 5 === 0) {
            try {
              fs.writeFileSync(
                path.join(OUTPUT_DIR, 'captured_data.json'), 
                JSON.stringify(capturedData, null, 2)
              );
            } catch (writeError) {
              log(`Error saving captured data: ${writeError.message}`);
            }
          }
        }
      }
    } catch (e) {
      // If not JSON, log as raw message if it's not a ping/pong
      if (message.length > 2 && !['ping', 'pong'].includes(message.toLowerCase())) {
        log(`[${wsUrl}] Received raw message:`, message);
      }
    }
  } catch (error) {
    log(`Error processing WebSocket message: ${error.message}`);
  }
}

async function initializeCollector() {
  let browser = null;
  
  try {
    log('Initializing Enhanced Blaze Roulette Collector');
    
    // Launch browser with enhanced stealth settings
    log('Launching browser with enhanced stealth settings...');
    
    browser = await puppeteer.launch({
      headless: false, // Set to true for production
      defaultViewport: {
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
        isMobile: false
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1366,768',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--enable-features=NetworkService',
        '--enable-logging',
        '--v=1',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-notifications',
        '--remote-debugging-port=9222',
        '--remote-debugging-address=0.0.0.0'
      ],
      ignoreHTTPSErrors: true,
      dumpio: true
    });
    
    log('Browser launched successfully');
    
    // Get the browser's WebSocket endpoint
    const browserWSEndpoint = browser.wsEndpoint();
    log(`Browser WebSocket endpoint: ${browserWSEndpoint}`);
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Listen to WebSocket events using CDP
    const cdpSession = await page.target().createCDPSession();
    await cdpSession.send('Network.enable');
    
    // Listen to WebSocket creation
    cdpSession.on('Network.webSocketCreated', ({ requestId, url, initiator }) => {
      if (isMatchingWebSocketUrl(url)) {
        const wsId = `ws_${Date.now()}`;
        log(`\n=== WebSocket Created [${wsId}] ===`);
        log(`URL: ${url}`);
        log(`Request ID: ${requestId}`);
        log(`Initiator:`, initiator);
        
        const connectionInfo = {
          id: wsId,
          url: url,
          createdAt: new Date().toISOString(),
          messages: [],
          lastActivity: Date.now()
        };
        
        activeConnections.set(requestId, connectionInfo);
        
        // Listen to WebSocket frames
        const onFrameSent = ({ requestId: frameRequestId, response }) => {
          if (frameRequestId === requestId && response && response.payloadData) {
            const conn = activeConnections.get(requestId);
            if (conn) {
              conn.lastActivity = Date.now();
              log(`[${conn.id}] SENT: ${response.payloadData}`);
              processWebSocketMessage(conn.url, response.payloadData);
            }
          }
        };
        
        const onFrameReceived = ({ requestId: frameRequestId, response }) => {
          if (frameRequestId === requestId && response && response.payloadData) {
            const conn = activeConnections.get(requestId);
            if (conn) {
              conn.lastActivity = Date.now();
              log(`[${conn.id}] RECEIVED: ${response.payloadData}`);
              processWebSocketMessage(conn.url, response.payloadData);
            }
          }
        };
        
        // Add event listeners
        cdpSession.on('Network.webSocketFrameSent', onFrameSent);
        cdpSession.on('Network.webSocketFrameReceived', onFrameReceived);
        
        // Store cleanup functions
        connectionInfo.cleanup = () => {
          cdpSession.off('Network.webSocketFrameSent', onFrameSent);
          cdpSession.off('Network.webSocketFrameReceived', onFrameReceived);
        };
      }
    });
    
    // Handle WebSocket closed events
    cdpSession.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
      const conn = activeConnections.get(requestId);
      if (conn) {
        log(`[${conn.id}] WebSocket connection closed`);
        if (typeof conn.cleanup === 'function') {
          conn.cleanup();
        }
        activeConnections.delete(requestId);
      }
    });
    
    // Handle WebSocket errors
    cdpSession.on('Network.webSocketHandshakeResponseReceived', ({ requestId, response }) => {
      const conn = activeConnections.get(requestId);
      if (conn) {
        log(`[${conn.id}] WebSocket handshake response received:`, response.status);
      }
    });
    
    // Log all requests and responses
    page.on('request', request => {
      const url = request.url();
      const method = request.method();
      
      if (isMatchingWebSocketUrl(url) || url.includes('blaze') || url.includes('socket')) {
        log(`\n=== Request ===`);
        log(`URL: ${url}`);
        log(`Method: ${method}`);
        log('Headers:', request.headers());
      }
      
      request.continue();
    });
    
    page.on('response', async response => {
      const url = response.url();
      const status = response.status();
      
      if (url.includes('blaze') || url.includes('socket') || url.includes('ws') || url.includes('wss')) {
        log(`\n=== Response ===`);
        log(`URL: ${url}`);
        log(`Status: ${status}`);
        
        // Log WebSocket upgrade responses
        if (status === 101) {
          log('WebSocket upgrade detected!');
          log('Response headers:', response.headers());
        }
      }
    });
    
    // Handle WebSocket connections with detailed logging
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    
    cdp.on('Network.webSocketCreated', ({ requestId, url }) => {
      const wsId = `ws_${Date.now()}`;
      log(`\n=== WebSocket Created [${wsId}] ===`);
      log(`URL: ${url}`);
      log(`Request ID: ${requestId}`);
      
      const wsLogFile = path.join(OUTPUT_DIR, `websocket_${wsId}.log`);
      const wsLogStream = fs.createWriteStream(wsLogFile, { flags: 'a' });
      
      const logWsMessage = (type, data) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${wsId}] ${type}: ${data}\n`;
        log(logEntry);
        wsLogStream.write(logEntry);
      };
      
      activeConnections.set(requestId, { wsLogStream, logWsMessage });
      logWsMessage('WEBSOCKET', `Connection created to ${url}`);
    });
    
    cdp.on('Network.webSocketFrameSent', ({ requestId, timestamp, response }) => {
      const connection = activeConnections.get(requestId);
      if (connection) {
        try {
          const data = JSON.parse(response.payloadData);
          connection.logWsMessage('SENT', 'JSON Payload:');
          connection.logWsMessage('SENT_DATA', JSON.stringify(data, null, 2));
        } catch (e) {
          connection.logWsMessage('SENT', `Raw payload (${response.payloadData?.length || 0} bytes)`);
        }
      }
    });
    
    cdp.on('Network.webSocketFrameReceived', ({ requestId, timestamp, response }) => {
      const connection = activeConnections.get(requestId);
      if (connection) {
        try {
          const data = JSON.parse(response.payloadData);
          connection.logWsMessage('RECEIVED', 'JSON Payload:');
          connection.logWsMessage('RECEIVED_DATA', JSON.stringify(data, null, 2));
          
          // Check for roulette data
          if (data && data[0] === 315 && data[1] === 'roulette.update') {
            log('ROULETTE DATA DETECTED!', data[2]);
          }
        } catch (e) {
          connection.logWsMessage('RECEIVED', `Raw payload (${response.payloadData?.length || 0} bytes)`);
        }
      }
    });
    
    cdp.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
      const connection = activeConnections.get(requestId);
      if (connection) {
        connection.logWsMessage('CLOSED', `WebSocket connection closed`);
        connection.wsLogStream.end();
        activeConnections.delete(requestId);
      }
    });
    
    // Navigate to the page
    log(`Navigating to ${BLAZE_URL}...`);
    
    try {
      const response = await page.goto(BLAZE_URL, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 120000
      });
      
      log(`Navigation completed with status: ${response.status()}`);
      
      // Wait for page to be fully interactive
      await page.waitForFunction(
        'document.readyState === "complete"',
        { timeout: 30000 }
      );
      
      // Check for WebSocket connections
      const wsCount = await page.evaluate(() => {
        return Object.keys(window).filter(key => key.startsWith('__puppeteer_ws_')).length;
      });
      
      log(`Initial WebSocket connections detected: ${wsCount}`);
      
      // Take a screenshot
      const screenshotPath = path.join(OUTPUT_DIR, 'blaze_page_enhanced.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot saved to: ${screenshotPath}`);
      
      // Save page content
      const pageContent = await page.content();
      const contentPath = path.join(OUTPUT_DIR, 'page_content_enhanced.html');
      fs.writeFileSync(contentPath, pageContent);
      log(`Page content saved to: ${contentPath}`);
      
      log('Page loaded and ready, monitoring WebSocket traffic...');
      
      // Keep the process alive
      await new Promise(() => {});
      
    } catch (error) {
      log('Error during page navigation or WebSocket monitoring:', error);
      throw error;
    }
    
  } catch (error) {
    log('Error in collector:', error);
    if (browser) {
      await browser.close();
    }
  }

// Handle process termination
function cleanup() {
  log('Cleaning up resources...');
  
  // Close the browser if it's open
  if (browser) {
    browser.close().catch(err => {
      console.error('Error closing browser:', err);
    });
  }
  
  // Close the log stream
  if (logStream) {
    logStream.end('\n=== Collector stopped ===\n');
  }
  
  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database connection:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
}

// Handle termination signals
['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach(signal => {
  process.on(signal, cleanup);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('Uncaught exception:', error);
  cleanup();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the collector
initializeCollector().catch(error => {
  log('Fatal error:', error);
  process.exit(1);
});
