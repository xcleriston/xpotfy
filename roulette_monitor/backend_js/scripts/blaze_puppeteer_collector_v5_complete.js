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
          (provider, game_id, game_name, result_number, result_color, round_id, timestamp, raw_data, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `;
        
        // Generate a unique round_id if not provided
        const roundId = result.roundId || `round-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        db.run(query, [
          'blaze', // provider
          roulette.id, // game_id
          roulette.name, // game_name
          result.number, // result_number
          result.color, // result_color
          roundId, // round_id
          new Date().toISOString(), // timestamp
          JSON.stringify({
            ...result,
            patterns: result.patterns || {}
          }) // raw_data
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
    
    try {
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeouts.navigation,
        referer: 'https://blaze.com/'
      });
      
      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: ${response ? response.status() : 'No response'}`);
      }
      
      log('info', `[${roulette.name}] Page loaded with status ${response.status()}, setting up monitoring...`);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: `debug_${roulette.id}_${Date.now()}.png` });
      log('debug', `[${roulette.name}] Screenshot taken`);
      
      // Log page content for debugging
      const pageContent = await page.content();
      log('debug', `[${roulette.name}] Page content length: ${pageContent.length} bytes`);
      
    } catch (error) {
      log('error', `[${roulette.name}] Error loading page`, error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
    
    // Set up WebSocket connection monitoring
    log('info', `[${roulette.name}] Setting up WebSocket monitoring...`);
    
    // Injetar código para monitorar WebSocket
    await page.evaluateOnNewDocument(() => {
      // Armazenar as últimas atualizações
      window.lastRouletteUpdate = null;
      window.rouletteUpdates = [];
      
      // Função para processar atualizações da roleta
      window.processRouletteUpdate = (data) => {
        try {
          if (data && data[0] === 32) { // 32 é o tipo de mensagem para atualizações da roleta
            const update = data[1];
            console.log('Nova atualização da roleta recebida:', update);
            window.lastRouletteUpdate = update;
            window.rouletteUpdates.push({
              timestamp: new Date().toISOString(),
              data: update
            });
            // Manter apenas as últimas 10 atualizações
            if (window.rouletteUpdates.length > 10) {
              window.rouletteUpdates.shift();
            }
          }
        } catch (e) {
          console.error('Erro ao processar atualização da roleta:', e);
        }
      };
      
      // Sobrescrever o WebSocket para capturar mensagens
      const originalWebSocket = window.WebSocket;
      window.WebSocket = function(...args) {
        const ws = new originalWebSocket(...args);
        
        ws.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            window.processRouletteUpdate(data);
          } catch (e) {
            console.error('Erro ao analisar mensagem WebSocket:', e);
          }
        });
        
        ws.addEventListener('error', (error) => {
          console.error('Erro no WebSocket:', error);
        });
        
        ws.addEventListener('close', (event) => {
          console.log('Conexão WebSocket fechada:', event.code, event.reason);
        });
        
        return ws;
      };
    });
    
    // Aguardar um pouco para o WebSocket ser configurado
    log('info', `[${roulette.name}] Aguardando 5 segundos para configuração do WebSocket...`);
    await new Promise(resolve => setTimeout(() => resolve(), 5000));
    log('info', `[${roulette.name}] WebSocket configurado, iniciando monitoramento...`);
    
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

// Initialize the collector
async function initializeCollector() {
  log('info', 'Initializing Blaze Roulette Collector v5');
  
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
      defaultViewport: CONFIG.viewport
    });
    
    log('info', 'Browser launched, creating new page...');
    page = await browser.newPage();
    
    // Set extra HTTP headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
      'Authorization': `Bearer ${CONFIG.authToken}`
    });
    
    // Set user agent
    await page.setUserAgent(CONFIG.userAgent);
    
    // Enable request interception
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Block unnecessary resources to improve performance
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'script']
          .includes(resourceType) && 
          !request.url().includes('blaze.com')) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Handle page errors
    page.on('pageerror', (error) => {
      log('error', 'Page error', error.message);
    });
    
    // Handle console messages
    page.on('console', (msg) => {
      const args = msg.args();
      const text = args.map(arg => arg.toString()).join(' ');
      log('debug', `Browser console: ${text}`);
    });
    
    log('info', 'Page configured, starting monitoring...');
    
    // Start monitoring all roulettes
    for (const roulette of CONFIG.roulettes) {
      await monitorRoulette(roulette);
      // Add a small delay between starting each monitor
      await wait(2000);
    }
    
  } catch (error) {
    log('error', 'Fatal error in initializeCollector', error);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Initialize database tables
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Criar a tabela roulette_history com a estrutura correta
      db.run(`
        CREATE TABLE IF NOT EXISTS roulette_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          provider TEXT NOT NULL,
          game_id TEXT NOT NULL,
          game_name TEXT NOT NULL,
          result_number INTEGER NOT NULL,
          result_color TEXT,
          round_id TEXT,
          timestamp DATETIME NOT NULL,
          raw_data TEXT
        )
      `, (err) => {
        if (err) {
          log('error', 'Error creating roulette_history table', err);
          return reject(err);
        }
        
        // Criar índice para melhorar consultas por game_id e timestamp
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_roulette_history_game_time 
          ON roulette_history (game_id, timestamp DESC)
        `, (err) => {
          if (err) {
            log('error', 'Error creating index on roulette_history table', err);
            return reject(err);
          }
          
          log('info', 'Database tables and indexes initialized');
          resolve();
        });
      });
    });
  });
}

// Handle process termination
process.on('SIGINT', async () => {
  log('info', '\nShutting down gracefully...');
  
  // Clear all monitoring intervals
  for (const [rouletteId, monitor] of activeMonitors.entries()) {
    if (typeof monitor === 'number') {
      clearInterval(monitor);
      log('info', `Stopped monitoring roulette ${rouletteId}`);
    }
  }
  
  // Close browser and database
  if (browser) await browser.close();
  db.close();
  
  log('info', 'Collector stopped');
  process.exit(0);
});

// Start the collector
async function start() {
  try {
    await initializeDatabase();
    await initializeCollector();
    log('info', 'Collector started successfully');
  } catch (error) {
    log('error', 'Failed to start collector', error);
    process.exit(1);
  }
}

// Start the application
start();
