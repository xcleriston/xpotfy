// Blaze Roulette Collector v4 - Enhanced with better selectors and error handling
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { broadcastToAll } = require('../websockets');

// Apply stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
  dbPath: path.join(__dirname, '../..', 'data', 'roulette.db'),
  checkInterval: 5000, // 5 seconds between checks
  headless: true, // Set to false for debugging
  roulettes: [
    { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
    { id: 'roulette', name: 'European Roulette' }
  ],
  baseUrl: 'https://blaze.com/pt/games/',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTYxMDU4NiwiaXNSZWZyZXNoVG9rZW4iOmZhbHNlLCJibG9ja3MiOltdLCJ1dWlkIjoiMDMxYjVjZmItMTI3NC00NTg2LWE5MzctYjMxMmNjMjAzOTZmIiwiaWF0IjoxNzU0ODMzMTY4LCJleHAiOjE3NjAwMTcxNjh9.9cCkB0BH_l0mUq5pgEaEunk2x38IQ-f0pyoAExVsZYw'
};

// Global state
let browser;
let page;
const db = new sqlite3.Database(CONFIG.dbPath);
const lastResults = new Map(); // Cache dos últimos resultados

// Logging function with timestamp
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

// Save result to database
async function saveResult(roulette, result) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO roulette_history 
      (roulette_id, result_number, result_color, patterns, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;
    
    db.run(query, [
      roulette.id,
      result.number,
      result.color,
      JSON.stringify(result.patterns || {})
    ], function(err) {
      if (err) {
        log(`[${roulette.name}] Error saving result:`, err.message);
        reject(err);
      } else {
        log(`[${roulette.name}] Result saved with ID:`, this.lastID);
        resolve(this.lastID);
      }
    });
  });
}

// Calculate patterns based on previous results
function calculatePatterns(rouletteId, currentResult) {
  const history = lastResults.get(rouletteId) || [];
  const patterns = {
    red: 0,
    black: 0,
    even: 0,
    odd: 0,
    low: 0,
    high: 0
  };

  // Find the last occurrence of each pattern
  for (let i = history.length - 1; i >= 0; i--) {
    const result = history[i];
    
    if (patterns.red === 0 && result.color === 'red') patterns.red = history.length - i;
    if (patterns.black === 0 && result.color === 'black') patterns.black = history.length - i;
    if (patterns.even === 0 && result.number % 2 === 0) patterns.even = history.length - i;
    if (patterns.odd === 0 && result.number % 2 === 1) patterns.odd = history.length - i;
    if (patterns.low === 0 && result.number >= 1 && result.number <= 18) patterns.low = history.length - i;
    if (patterns.high === 0 && result.number >= 19 && result.number <= 36) patterns.high = history.length - i;
    
    // If all patterns are found, break early
    if (Object.values(patterns).every(count => count > 0)) break;
  }

  // Update cache
  history.push(currentResult);
  if (history.length > 100) history.shift(); // Keep last 100 results
  lastResults.set(rouletteId, history);

  return patterns;
}

// Process a new roulette result
async function processResult(roulette, result) {
  try {
    log(`[${roulette.name}] Processing result:`, result);
    
    // Calculate patterns
    const patterns = calculatePatterns(roulette.id, result);
    result.patterns = patterns;
    
    // Save to database
    const resultId = await saveResult(roulette, result);
    
    // Broadcast update
    const updateData = {
      rouletteId: roulette.id,
      rouletteName: roulette.name,
      result: result,
      patterns: patterns,
      timestamp: new Date().toISOString()
    };
    
    broadcastToAll('roulette_update', updateData);
    return resultId;
  } catch (error) {
    log(`[${roulette.name}] Error processing result:`, error);
    return null;
  }
}

// Monitor a single roulette
async function monitorRoulette(roulette) {
  log(`[${roulette.name}] Starting monitoring`);
  
  try {
    // Navigate to the roulette page
    const url = `${CONFIG.baseUrl}${roulette.id}`;
    log(`[${roulette.name}] Navigating to ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000,
      referer: 'https://blaze.com/',
      headers: {
        'Authorization': `Bearer ${CONFIG.authToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    log(`[${roulette.name}] Page loaded, setting up monitoring...`);
    
    // Set up WebSocket connection monitoring
    await page.evaluate(() => {
      // This will be executed in the browser context
      console.log('Setting up WebSocket monitoring...');
      
      // Listen for WebSocket messages
      const originalWebSocket = window.WebSocket;
      window.WebSocket = function(...args) {
        const ws = new originalWebSocket(...args);
        
        ws.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data[0] === 32) { // 32 is the message type for roulette updates
              window.lastRouletteUpdate = data[1];
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        });
        
        return ws;
      };
    });
    
    // Main monitoring loop
    setInterval(async () => {
      try {
        const result = await page.evaluate(({ rouletteId, rouletteName }) => {
          // Try to get result from WebSocket first
          if (window.lastRouletteUpdate) {
            const update = window.lastRouletteUpdate;
            if (update && update.roll) {
              return {
                number: update.roll,
                color: update.color === 'red' ? 'red' : update.color === 'black' ? 'black' : 'green'
              };
            }
          }
          
          // Fallback to DOM scraping if WebSocket data not available
          const resultElement = document.querySelector('.entries.main .entry');
          if (!resultElement) return null;
          
          const number = parseInt(resultElement.textContent.trim()) || 0;
          const className = resultElement.className.toLowerCase();
          
          let color = 'green';
          if (number > 0) {
            color = className.includes('red') ? 'red' : 
                   className.includes('black') ? 'black' : 'green';
          }
          
          return { number, color };
        }, { rouletteId: roulette.id, rouletteName: roulette.name });
        
        if (result && result.number !== undefined) {
          const cacheKey = `${roulette.id}-${result.number}-${result.color}`;
          if (!lastResults.has(cacheKey)) {
            lastResults.set(cacheKey, true);
            await processResult(roulette, result);
          }
        }
      } catch (error) {
        log(`[${roulette.name}] Error in monitoring loop:`, error.message);
      }
    }, CONFIG.checkInterval);
    
  } catch (error) {
    log(`[${roulette.name}] Error in monitorRoulette:`, error);
    // Try to recover by reloading the page
    setTimeout(() => monitorRoulette(roulette), 30000);
  }
}

// Initialize the collector
async function initializeCollector() {
  log('Initializing Blaze Roulette Collector v4');
  
  try {
    // Launch browser with stealth settings
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });
    
    log('Browser launched, creating new page...');
    page = await browser.newPage();
    
    // Set extra HTTP headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Authorization': `Bearer ${CONFIG.authToken}`
    });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request interception
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Block unnecessary resources to improve performance
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    log('Page configured, starting monitoring...');
    
    // Start monitoring all roulettes
    for (const roulette of CONFIG.roulettes) {
      monitorRoulette(roulette);
    }
    
  } catch (error) {
    log('Fatal error in initializeCollector:', error);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\nShutting down gracefully...');
  if (browser) await browser.close();
  db.close();
  process.exit(0);
});

// Initialize database tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS roulette_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          roulette_id TEXT NOT NULL,
          result_number INTEGER NOT NULL,
          result_color TEXT NOT NULL,
          patterns TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          log('Error creating database table:', err);
          reject(err);
        } else {
          log('Database initialized');
          resolve();
        }
      });
    });
  });
}

// Start the collector
async function start() {
  try {
    await initializeDatabase();
    await initializeCollector();
  } catch (error) {
    log('Failed to start collector:', error);
    process.exit(1);
  }
}

start();
