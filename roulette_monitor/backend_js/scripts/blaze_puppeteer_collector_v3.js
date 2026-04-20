// Blaze Roulette Collector using Puppeteer - Enhanced Debugging Version
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

// Function to log with timestamp
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

// Function to save result to database
function saveResult(roulette, result) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO roulette_history 
      (roulette_id, result_number, result_color, patterns)
      VALUES (?, ?, ?, ?)
    `;
    
    const params = [
      roulette.id,
      result.number,
      result.color,
      JSON.stringify(result.patterns || {})
    ];
    
    log(`[${roulette.name}] Saving result to database:`, params);
    
    db.run(query, params, function(err) {
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

// Function to calculate patterns (simplified for testing)
function calculatePatterns() {
  const patterns = {
    red: Math.floor(Math.random() * 10) + 1,
    black: Math.floor(Math.random() * 10) + 1,
    even: Math.floor(Math.random() * 10) + 1,
    odd: Math.floor(Math.random() * 10) + 1,
    low: Math.floor(Math.random() * 10) + 1,
    high: Math.floor(Math.random() * 10) + 1
  };
  
  log('Generated patterns:', patterns);
  return patterns;
}

// Process a new roulette result
async function processResult(roulette, result) {
  try {
    log(`[${roulette.name}] Processing result:`, result);
    
    // Calculate patterns
    const patterns = calculatePatterns();
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
    
    log(`[${roulette.name}] Broadcasting update:`, updateData);
    broadcastToAll('roulette_update', updateData);
    
    return resultId;
  } catch (error) {
    log(`[${roulette.name}] Error in processResult:`, error.message);
    return null;
  }
}

// Monitor a single roulette
async function monitorRoulette(roulette) {
  try {
    log(`[${roulette.name}] Starting monitoring`);
    
    // Navigate to the roulette page
    const url = `https://blaze.bet.br/games/${roulette.id}`;
    log(`[${roulette.name}] Navigating to ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 // 60 seconds timeout
    });
    
    log(`[${roulette.name}] Page loaded`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: `screenshot-${roulette.id}-${Date.now()}.png` });
    log(`[${roulette.name}] Screenshot saved`);
    
    // Set up an interval to check for new results
    setInterval(async () => {
      try {
        log(`[${roulette.name}] Checking for new results...`);
        
        // This is a simplified example - you'll need to adjust selectors based on the actual page structure
        const result = await page.evaluate((rouletteName) => {
          console.log(`[${rouletteName}] Looking for result elements...`);
          
          // Try different selectors to find the result
          const resultElement = document.querySelector('.last-number') || 
                              document.querySelector('.number') ||
                              document.querySelector('.roulette-last-number');
          
          if (!resultElement) {
            console.log(`[${rouletteName}] No result element found`);
            return null;
          }
          
          const number = parseInt(resultElement.textContent.trim()) || 0;
          const className = resultElement.className.toLowerCase();
          
          let color = 'green'; // Default to green (0)
          if (number > 0) {
            color = className.includes('red') ? 'red' : 
                   className.includes('black') ? 'black' : 'green';
          }
          
          console.log(`[${rouletteName}] Found result:`, { number, color });
          return { number, color };
        }, roulette.name);
        
        if (result && result.number !== undefined) {
          log(`[${roulette.name}] New result found:`, result);
          await processResult(roulette, result);
        } else {
          log(`[${roulette.name}] No valid result found`);
        }
      } catch (error) {
        log(`[${roulette.name}] Error in result check:`, error.message);
      }
    }, 10000); // Check every 10 seconds
    
  } catch (error) {
    log(`[${roulette.name}] Error in monitoring:`, error.message);
    throw error;
  }
}

// Initialize the collector
async function initializeCollector() {
  log('Initializing Blaze Roulette Collector');
  
  try {
    log('Launching browser...');
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
      },
      dumpio: true // Enable browser process logging
    });
    
    log('Browser launched');
    
    // Create a new page
    page = await browser.newPage();
    log('New page created');
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request/response logging
    page.on('request', request => {
      log(`Request: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        log(`Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Log console messages from the page
    page.on('console', msg => {
      const args = msg.args();
      let values = [];
      for (let i = 0; i < args.length; i++) {
        values.push(args[i].toString());
      }
      log(`[Browser Console] ${msg.type().toUpperCase()}: ${values.join(' ')}`);
    });
    
    // Start monitoring each roulette
    for (const roulette of ROULETTES) {
      try {
        log(`Starting monitoring for ${roulette.name}...`);
        await monitorRoulette(roulette);
        await page.waitForTimeout(5000); // Wait 5 seconds between roulettes
      } catch (error) {
        log(`Error monitoring ${roulette.name}:`, error.message);
      }
    }
    
    log('Blaze Roulette Collector initialized');
    
  } catch (error) {
    log('Fatal error initializing collector:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\nShutting down gracefully...');
  
  if (browser) {
    await browser.close();
    log('Browser closed');
  }
  
  // Close database connection
  db.close(err => {
    if (err) {
      log('Error closing database:', err.message);
      process.exit(1);
    } else {
      log('Database connection closed');
      process.exit(0);
    }
  });
});

// Start the collector
initializeCollector().catch(error => {
  log('Unhandled error in collector:', error.message);
  process.exit(1);
});
