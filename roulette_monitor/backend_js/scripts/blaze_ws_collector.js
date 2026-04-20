const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Configuration
const BLAZE_URL = 'https://blaze.bet.br/games/roleta-brasileira';
const OUTPUT_DIR = path.join(__dirname, '../../logs');
const DB_PATH = path.join(__dirname, '../../data/roulette.db');

// Ensure logs directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create a writable stream for logging
const logStream = fs.createWriteStream(path.join(OUTPUT_DIR, 'blaze_ws_collector.log'), { flags: 'a' });

// Function to log with timestamp to both console and file
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Ensure the log directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Append to log file
  fs.appendFileSync(path.join(OUTPUT_DIR, 'blaze_ws_collector.log'), logMessage);
}

// Connect to SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    log('Error connecting to SQLite database:', err.message);
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

// Main function to initialize the collector
async function initializeCollector() {
  let browser;
  
  try {
    // Launch browser with stealth plugin
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    log('Browser launched');
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Enable network tracking
    await page.setRequestInterception(true);
    
    // Listen for all network requests
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('blaze') || url.includes('ws') || url.includes('wss')) {
        log(`Request URL: ${url}`);
      }
      request.continue();
    });
    
    // Listen for WebSocket connections
    log('Creating CDP session for WebSocket monitoring...');
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    
    // Log all WebSocket events
    cdp.on('*', (event, data) => {
      if (event.includes('Network.webSocket')) {
        log(`CDP Event: ${event}`, data);
      }
    });
    
    // Track WebSocket connections
    const wsConnections = new Map();
    
    // Handle WebSocket frames
    cdp.on('Network.webSocketFrameSent', ({ requestId, response }) => {
      const connection = wsConnections.get(requestId);
      if (connection) {
        log(`[WS ${connection.url}] Sent:`, response.payloadData);
      }
    });
    
    cdp.on('Network.webSocketFrameReceived', async ({ requestId, response }) => {
      const connection = wsConnections.get(requestId);
      if (connection) {
        const data = response.payloadData;
        log(`[WS ${connection.url}] Received:`, data);
        
        try {
          // Try to parse as JSON
          const jsonData = JSON.parse(data);
          
          // Check if this is a roulette result
          if (jsonData && jsonData.data && jsonData.data.kind === 'roulette') {
            const gameData = jsonData.data;
            log('Roulette result detected:', gameData);
            
            // Save to database
            saveGameResult({
              game_id: 'roleta-brasileira',
              round_id: gameData.id || String(Date.now()),
              result_number: gameData.number,
              result_color: gameData.color
            });
          }
        } catch (e) {
          // Not JSON or invalid JSON, ignore
        }
      }
    });
    
    // Track WebSocket connections
    cdp.on('Network.webSocketCreated', ({ requestId, url }) => {
      log(`WebSocket connection created: ${url}`);
      wsConnections.set(requestId, { url });
    });
    
    // Handle WebSocket closed events
    cdp.on('Network.webSocketClosed', ({ requestId }) => {
      const connection = wsConnections.get(requestId);
      if (connection) {
        log(`WebSocket connection closed: ${connection.url}`);
        wsConnections.delete(requestId);
      }
    });
    
    // Navigate to the Blaze roulette page
    log(`Navigating to ${BLAZE_URL}...`);
    
    // Set viewport to look more like a real user
    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
    
    // Add a random delay to appear more human-like
    await page.waitForTimeout(2000 + Math.random() * 3000);
    
    // Navigate with more detailed logging
    const response = await page.goto(BLAZE_URL, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 120000, // 2 minutes timeout
    });
    
    log(`Page loaded with status: ${response.status()}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'blaze_page.png') });
    log('Screenshot saved to blaze_page.png');
    
    // Wait for WebSocket connections to be established
    await page.waitForTimeout(5000);
    log('Page load complete, monitoring WebSocket connections...');
    
    log('Page loaded, waiting for WebSocket connections...');
    
    // Keep the browser open
    await new Promise(() => {});
    
  } catch (error) {
    log('Error in collector:', error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('Shutting down gracefully...');
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

// Start the collector
initializeCollector().catch(error => {
  log('Fatal error in collector:', error);
  process.exit(1);
});
