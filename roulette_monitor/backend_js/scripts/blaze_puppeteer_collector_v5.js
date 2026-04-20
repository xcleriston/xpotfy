// Blaze Roulette Collector v5 - Enhanced with better error handling and stability
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { broadcastToAll } = require('../websockets');
const { setTimeout } = require('timers/promises');

// Apply stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
  dbPath: path.join(__dirname, '../..', 'data', 'roulette.db'),
  checkInterval: 10000, // 10 seconds between checks
  headless: false, // Set to false for debugging
  roulettes: [
    { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
    { id: 'roulette', name: 'European Roulette' }
  ],
  baseUrl: 'https://blaze.com/pt/games/',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTYxMDU4NiwiaXNSZWZyZXNoVG9rZW4iOmZhbHNlLCJibG9ja3MiOltdLCJ1dWlkIjoiMDMxYjVjZmItMTI3NC00NTg2LWE5MzctYjMxMmNjMjAzOTZmIiwiaWF0IjoxNzU0ODMzMTY4LCJleHAiOjE3NjAwMTcxNjh9.9cCkB0BH_l0mUq5pgEaEunk2x38IQ-f0pyoAExVsZYw',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  viewport: {
    width: 1920,
    height: 1080
  },
  // Timeouts in milliseconds
  timeouts: {
    navigation: 60000,    // 60 seconds for page navigation
    selector: 10000,      // 10 seconds for element selection
    request: 30000       // 30 seconds for requests
  },
  // Retry configuration
  retry: {
    maxAttempts: 3,      // Maximum number of retry attempts
    delay: 5000          // Delay between retries in ms
  }
};

// Global state
let browser;
let page;
const db = new sqlite3.Database(CONFIG.dbPath);
const lastResults = new Map(); // Cache dos últimos resultados
const activeMonitors = new Map(); // To track active monitors

// Logging function with timestamp and log levels
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    if (data instanceof Error) {
      console.error(logMessage, { 
        message: data.message, 
        stack: data.stack 
      });
    } else {
      console.log(logMessage, JSON.stringify(data, null, 2));
    }
  } else {
    console.log(logMessage);
  }
}

// Helper function to wait for a specified time
async function wait(ms) {
  await setTimeout(ms);
}

// Save result to database with retry logic
async function saveResult(roulette, result) {
  let attempts = 0;
  const maxAttempts = CONFIG.retry.maxAttempts;
  
  while (attempts < maxAttempts) {
    try {
      return await new Promise((resolve, reject) => {
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
            log('error', `[${roulette.name}] Error saving result`, err);
            reject(err);
          } else {
            log('info', `[${roulette.name}] Result saved with ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        });
      });
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        log('error', `[${roulette.name}] Failed to save result after ${maxAttempts} attempts`, error);
        throw error;
      }
      log('warn', `[${roulette.name}] Retry ${attempts}/${maxAttempts} saving result...`);
      await wait(CONFIG.retry.delay);
    }
  }
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
    if (patterns.even === 0 && result.number % 2 === 0 && result.number !== 0) patterns.even = history.length - i;
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
    log('info', `[${roulette.name}] Processing result:`, result);
    
    // Calculate patterns
    const patterns = calculatePatterns(roulette.id, result);
    result.patterns = patterns;
    
    // Save to database
    const resultId = await saveResult(roulette, result);
    
    // Broadcast update to connected clients
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
    log('error', `[${roulette.name}] Error processing result`, error);
    return null;
  }
}

// Monitor a single roulette
async function monitorRoulette(roulette) {
  log('info', `[${roulette.name}] Starting monitoring`);
  
  // Skip if already monitoring this roulette
  if (activeMonitors.has(roulette.id)) {
    log('warn', `[${roulette.name}] Already being monitored`);
    return;
  }
  
  // Mark as being monitored
  activeMonitors.set(roulette.id, true);
  
  try {
    // Navigate to the roulette page
    const url = `${CONFIG.baseUrl}${roulette.id}`;
    log('info', `[${roulette.name}] Navigating to ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeouts.navigation,
      referer: 'https://blaze.com/'
    });
    
    log('info', `[${roulette.name}] Page loaded, setting up monitoring...`);
    
    // Set up WebSocket connection monitoring
    await page.evaluate(({ rouletteName }) => {
      // This will be executed in the browser context
      console.log(`[${rouletteName}] Setting up WebSocket monitoring...`);
      
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
    }, { rouletteName: roulette.name });
    
    // Main monitoring loop
    const monitorInterval = setInterval(async () => {
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
          if (!lastResults.get(cacheKey)) {
            lastResults.set(cacheKey, true);
            await processResult(roulette, result);
          }
        }
      } catch (error) {
        log('error', `[${roulette.name}] Error in monitoring loop`, error);
      }
    }, CONFIG.checkInterval);
    
    // Store the interval ID for cleanup
    activeMonitors.set(roulette.id, monitorInterval);
    
  } catch (error) {
    log('error', `[${roulette.name}] Error in monitorRoulette`, error);
    
    // Clean up on error
    const monitorInterval = activeMonitors.get(roulette.id);
    if (monitorInterval && typeof monitorInterval === 'number') {
      clearInterval(monitorInterval);
    }
    activeMonitors.delete(roulette.id);
    
    // Try to recover after a delay
    setTimeout(() => monitorRoulette(roulette), 30000);
  }
}
