// Blaze Roulette Collector using Puppeteer - Simplified Version
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { broadcastToAll } = require('../websockets');

// Configuration
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Roulettes to monitor (reduced for testing)
const ROULETTES = [
  { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
  { id: 'roulette', name: 'European Roulette' }
];

// Global browser and page references
let browser;
let page;

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
function saveResult(roulette, result) {
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
      JSON.stringify(result.patterns || {})
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

// Calculate patterns (simplified for testing)
function calculatePatterns() {
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
    // Calculate patterns
    const patterns = calculatePatterns();
    result.patterns = patterns;
    
    // Save to database
    await saveResult(roulette, result);
    
    // Broadcast update to connected clients
    broadcastToAll('roulette_update', {
      rouletteId: roulette.id,
      rouletteName: roulette.name,
      result: result,
      patterns: patterns,
      timestamp: new Date().toISOString()
    });
    
    return result;
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
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 // 60 seconds timeout
    });
    
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Page loaded`);
    
    // Wait for the roulette container to be visible
    await page.waitForSelector('.roulette-wrapper', { 
      visible: true,
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Roulette container found`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: `screenshot-${roulette.id}.png` });
    console.log(`[${new Date().toISOString()}] [${roulette.name}] Screenshot saved`);
    
    // Set up an interval to check for new results
    setInterval(async () => {
      try {
        // This is a simplified example - you'll need to adjust selectors based on the actual page structure
        const result = await page.evaluate(() => {
          const resultElement = document.querySelector('.last-number');
          if (!resultElement) return null;
          
          const number = parseInt(resultElement.textContent.trim()) || 0;
          const color = resultElement.className.includes('red') ? 'red' : 
                       resultElement.className.includes('black') ? 'black' : 'green';
          
          return { number, color };
        });
        
        if (result) {
          console.log(`[${new Date().toISOString()}] [${roulette.name}] New result:`, result);
          await processResult(roulette, result);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [${roulette.name}] Error checking result:`, error);
      }
    }, 3000); // Check every 3 seconds
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [${roulette.name}] Error in monitoring:`, error);
    throw error;
  }
}

// Initialize the collector
async function initializeCollector() {
  console.log(`[${new Date().toISOString()}] Initializing Blaze Roulette Collector`);
  
  try {
    // Initialize database
    await initializeDatabase();
    
    // Launch browser
    console.log(`[${new Date().toISOString()}] Launching browser...`);
    browser = await puppeteer.launch({
      headless: false, // Set to false for debugging, true in production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--remote-debugging-port=9222',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1366,
        height: 768
      }
    });
    
    console.log(`[${new Date().toISOString()}] Browser launched`);
    
    // Create a new page
    page = await browser.newPage();
    console.log(`[${new Date().toISOString()}] New page created`);
    
    // Set user agent
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
