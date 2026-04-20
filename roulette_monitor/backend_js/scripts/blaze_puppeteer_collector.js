// Blaze Roulette Collector using Puppeteer
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { broadcastToAll } = require('../websockets');

// Configuration
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Roulettes to monitor
const ROULETTES = [
  { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
  { id: 'roulette', name: 'European Roulette' },
  { id: 'speed-roulette', name: 'Speed Roulette' },
  { id: 'american-roulette', name: 'American Roulette' }
];

// Browser and page instances
let browser;
let page;

// Data structures
const lastResults = new Map();
const sequenceCounters = new Map();

// Initialize counters for a roulette
function initializeCounters(rouletteId) {
  sequenceCounters.set(rouletteId, {
    red: 0, black: 0, even: 0, odd: 0, low: 0, high: 0
  });
}

// Initialize database
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
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
}

// Save result to database
function saveResult(roulette, result, patterns) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO roulette_history 
      (roulette_id, result_number, result_color, patterns)
      VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [
      roulette.id,
      result.number,
      result.color,
      JSON.stringify(patterns)
    ], function(err) {
      if (err) {
        console.error(`[${new Date().toISOString()}] [${roulette.name}] Error saving result:`, err);
        reject(err);
      } else {
        console.log(`[${new Date().toISOString()}] [${roulette.name}] Result saved:`, 
          result.number, result.color);
        resolve(this.lastID);
      }
    });
  });
}

// Calculate patterns from results
function calculatePatterns(results) {
  if (!results || results.length < 2) {
    return { red: 0, black: 0, even: 0, odd: 0, low: 0, high: 0 };
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

// Process a new roulette result
async function processResult(roulette, result) {
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
    await saveResult(roulette, result, patterns);
    
    // Broadcast update to connected clients
    broadcastToAll('roulette_update', {
      rouletteId: roulette.id,
      rouletteName: roulette.name,
      result: result,
      patterns: patterns,
      timestamp: new Date().toISOString()
    });
    
    return patterns;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [${roulette.name}] Error processing result:`, error);
    return null;
  }
}

// Monitor a single roulette
async function monitorRoulette(roulette) {
  try {
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Starting monitoring`);
    
    // Navigate to the roulette page
    const url = `https://blaze.bet.br/games/${roulette.id}`;
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Navigating to ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the roulette container to be visible
    await page.waitForSelector('.roulette-wrapper', { timeout: 15000 });
    
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Page loaded, setting up listeners`);
    
    // Listen for roulette results
    await page.exposeFunction('onRouletteResult', async (result) => {
      console.log(`[${new Date().toISOString()}] [${roulette.name}] New result:`, result);
      await processResult(roulette, result);
    });
    
    // Inject script to listen for roulette results
    await page.evaluate(() => {
      // This is a simplified example - you'll need to adjust selectors based on the actual page structure
      const observer = new MutationObserver((mutations) => {
        const resultElement = document.querySelector('.last-number');
        if (resultElement) {
          const number = resultElement.textContent.trim();
          const color = resultElement.className.includes('red') ? 'red' : 
                       resultElement.className.includes('black') ? 'black' : 'green';
          
          window.onRouletteResult({
            number: parseInt(number) || 0,
            color: color,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Start observing the roulette container for changes
      const rouletteContainer = document.querySelector('.roulette-wrapper');
      if (rouletteContainer) {
        observer.observe(rouletteContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      }
    });
    
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Monitoring started`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [${roulette.name}] Error in monitoring:`, error);
    throw error;
  }
}

// Initialize the collector
async function initializeCollector() {
  try {
    console.log(`[${new Date().toISOString()}] Initializing Blaze Roulette Collector`);
    
    // Initialize database
    await initializeDatabase();
    
    // Initialize counters
    ROULETTES.forEach(roulette => initializeCounters(roulette.id));
    
    // Launch browser
    console.log(`[${new Date().toISOString()}] Launching browser...`);
    browser = await puppeteer.launch({
      headless: false, // Set to true in production
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
    
    // Create a new page
    const context = await browser.createIncognitoBrowserContext();
    page = await context.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Start monitoring each roulette
    for (const roulette of ROULETTES) {
      try {
        await monitorRoulette(roulette);
        await page.waitForTimeout(5000); // Wait 5 seconds between roulettes
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error monitoring ${roulette.name}:`, error);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Blaze Roulette Collector initialized`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal error initializing collector:`, error);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  
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

// Start the collector
initializeCollector().catch(error => {
  console.error('Unhandled error in collector:', error);
  process.exit(1);
});
