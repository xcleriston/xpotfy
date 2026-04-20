// WebSocket-based collector for Blaze roulette results
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Database setup
const DB_PATH = path.join(__dirname, '../../data/roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Configuration
const BLAZE_URL = 'https://blaze.bet.br/games/roleta-brasileira';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Track WebSocket connections and messages
let wsUrl = null;
let wsConnection = null;
let browser = null;
let page = null;

// Function to log with timestamp
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

// Function to save result to database
async function saveResult(rouletteId, result) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO roulette_history 
      (roulette_id, result_number, result_color, patterns, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;
    
    const params = [
      rouletteId,
      result.number,
      result.color,
      JSON.stringify(result.patterns || {})
    ];
    
    db.run(query, params, function(err) {
      if (err) {
        log(`Error saving result: ${err.message}`);
        reject(err);
      } else {
        log(`Result saved with ID: ${this.lastID}`);
        resolve(this.lastID);
      }
    });
  });
}

// Function to process WebSocket messages
function processWebSocketMessage(message) {
  try {
    log('Raw WebSocket message:', message);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      log('Message is not valid JSON, checking for base64:', e.message);
      // Try to decode as base64 if not valid JSON
      try {
        const decoded = Buffer.from(message, 'base64').toString('utf-8');
        log('Base64 decoded message:', decoded);
        data = JSON.parse(decoded);
      } catch (e2) {
        log('Could not parse message as JSON or base64:', e2.message);
        return;
      }
    }
    
    // Log the full message structure for analysis
    log('Parsed WebSocket message structure:', JSON.stringify(data, null, 2));
    
    // Look for roulette result messages in different possible formats
    let result = null;
    
    // Format 1: Direct roulette result
    if (data && data.type === 'roulette_result') {
      result = {
        number: data.number,
        color: data.color,
        timestamp: new Date().toISOString(),
        source: 'direct_result',
        raw: data
      };
    } 
    // Format 2: Nested in data property
    else if (data && data.data && data.data.number) {
      result = {
        number: data.data.number,
        color: data.data.color,
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'nested_result',
        raw: data
      };
    }
    // Format 3: Check for common roulette fields
    else if (data && (data.hasOwnProperty('number') || data.hasOwnProperty('color'))) {
      result = {
        number: data.number,
        color: data.color,
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'direct_fields',
        raw: data
      };
    }
    
    // If we found a result, process it
    if (result) {
      // Add pattern analysis
      if (typeof result.number === 'number') {
        result.patterns = {
          even: result.number % 2 === 0,
          odd: result.number % 2 !== 0,
          red: result.color === 'red' || (result.number >= 1 && result.number <= 10 && result.number % 2 === 1) || 
                                (result.number >= 11 && result.number <= 18 && result.number % 2 === 0) ||
                                (result.number >= 19 && result.number <= 28 && result.number % 2 === 1) ||
                                (result.number >= 29 && result.number <= 36 && result.number % 2 === 0),
          black: result.color === 'black' || (result.number >= 1 && result.number <= 10 && result.number % 2 === 0) || 
                                  (result.number >= 11 && result.number <= 18 && result.number % 2 === 1) ||
                                  (result.number >= 19 && result.number <= 28 && result.number % 2 === 0) ||
                                  (result.number >= 29 && result.number <= 36 && result.number % 2 === 1),
          low: result.number >= 1 && result.number <= 18,
          high: result.number >= 19 && result.number <= 36,
          dozen1: result.number >= 1 && result.number <= 12,
          dozen2: result.number >= 13 && result.number <= 24,
          dozen3: result.number >= 25 && result.number <= 36,
          column1: result.number % 3 === 1,
          column2: result.number % 3 === 2,
          column3: result.number % 3 === 0 && result.number !== 0
        };
      }
      
      log('Processing roulette result:', JSON.stringify(result, null, 2));
      
      // Save to database if we have a valid number
      if (result.number !== undefined && result.number !== null) {
        saveResult('roleta-brasileira', result).catch(error => {
          log('Error saving result to database:', error.message);
        });
      }
    }
  } catch (error) {
    log('Error processing WebSocket message:', error.message);
    log('Stack trace:', error.stack);
  }
}

// Function to connect to WebSocket
function connectToWebSocket(url) {
  if (wsConnection) {
    log('Closing existing WebSocket connection');
    wsConnection.removeAllListeners();
    wsConnection.close();
  }
  
  log(`\n=== Attempting to connect to WebSocket ===`);
  log(`URL: ${url}`);
  log(`Current time: ${new Date().toISOString()}`);
  
  try {
    // Add custom headers for the WebSocket connection
    const headers = {
      'User-Agent': USER_AGENT,
      'Origin': 'https://blaze.bet.br',
      'Referer': 'https://blaze.bet.br/games/roleta-brasileira',
      'Sec-WebSocket-Version': '13',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits'
    };
    
    const options = {
      headers: headers,
      rejectUnauthorized: false, // Only for testing, handle with caution in production
      followRedirects: true,
      handshakeTimeout: 10000,
      perMessageDeflate: true
    };
    
    wsConnection = new WebSocket(url, [], options);
    
    wsConnection.on('open', () => {
      log('\n=== WebSocket Connection Established ===');
      log(`URL: ${url}`);
      log(`Protocol: ${wsConnection.protocol}`);
      log(`Extensions: ${wsConnection.extensions}`);
      log(`Ready State: ${wsConnection.readyState}`);
      
      // Send subscription message (format needs to be determined)
      const subscribeMessage = JSON.stringify({
        type: 'subscribe',
        channel: 'roulette',
        id: uuidv4(),
        timestamp: Date.now()
      });
      
      log('\n=== Sending Subscription Message ===');
      log(`Message: ${subscribeMessage}`);
      
      try {
        wsConnection.send(subscribeMessage);
        log('Subscription message sent successfully');
      } catch (error) {
        log('Error sending subscription message:', error.message);
      }
    });
    
    wsConnection.on('message', (data, isBinary) => {
      const message = isBinary ? data : data.toString();
      log('\n=== WebSocket Message Received ===');
      log(`Message type: ${isBinary ? 'binary' : 'text'}`);
      log(`Message length: ${message.length} bytes`);
      log(`First 500 chars: ${message.toString().substring(0, 500)}`);
      
      try {
        processWebSocketMessage(message);
      } catch (error) {
        log('Error processing message:', error.message);
        log('Stack trace:', error.stack);
      }
    });
    
    wsConnection.on('close', (code, reason) => {
      log('\n=== WebSocket Connection Closed ===');
      log(`Code: ${code}`);
      log(`Reason: ${reason}`);
      log(`Timestamp: ${new Date().toISOString()}`);
      log('Attempting to reconnect in 5 seconds...');
      
      // Attempt to reconnect after a delay
      setTimeout(() => connectToWebSocket(url), 5000);
    });
    
    wsConnection.on('error', (error) => {
      log('\n=== WebSocket Error ===');
      log(`Error: ${error.message}`);
      log(`Stack: ${error.stack}`);
      log(`Timestamp: ${new Date().toISOString()}`);
    });
    
    // Add ping/pong handlers
    wsConnection.on('ping', (data) => {
      log(`\n=== WebSocket Ping Received (${data ? data.length : 0} bytes) ===`);
      log(`Data: ${data ? data.toString('hex') : 'none'}`);
    });
    
    wsConnection.on('pong', (data) => {
      log(`\n=== WebSocket Pong Received (${data ? data.length : 0} bytes) ===`);
      log(`Data: ${data ? data.toString('hex') : 'none'}`);
    });
    
    // Send periodic pings to keep connection alive
    setInterval(() => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        try {
          wsConnection.ping('keepalive');
        } catch (error) {
          log('Error sending ping:', error.message);
        }
      }
    }, 30000); // Every 30 seconds
    
  } catch (error) {
    log('\n=== Error Creating WebSocket Connection ===');
    log(`Error: ${error.message}`);
    log(`Stack: ${error.stack}`);
    log(`Timestamp: ${new Date().toISOString()}`);
    
    // Attempt to reconnect after a delay
    setTimeout(() => connectToWebSocket(url), 5000);
  }
}

// Main function to initialize the collector
async function initializeCollector() {
  try {
    log('Initializing Blaze Roulette Collector');
    
    // Launch browser with minimal settings for maximum compatibility
    log('Launching browser with minimal settings for maximum compatibility...');
    
    // Try to find Chrome/Chromium in common locations
    const possibleChromePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome Beta\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome Dev\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome SxS\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome SxS\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge Beta\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge Dev\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe',
    ].filter(Boolean);
    
    // Try to find an existing Chrome/Chromium installation
    let chromePath;
    for (const path of possibleChromePaths) {
      try {
        const stats = await require('fs').promises.access(path, require('fs').constants.X_OK)
          .then(() => true)
          .catch(() => false);
        
        if (stats) {
          chromePath = path;
          log(`Found Chrome/Chromium at: ${chromePath}`);
          break;
        }
      } catch (error) {
        // Ignore errors and try the next path
      }
    }
    
    if (!chromePath) {
      log('Could not find Chrome/Chromium installation, using default browser');
    }
    
    const launchOptions = {
      headless: true, // Force headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1366,768',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--no-zygote',
        '--single-process',
        '--disable-software-rasterizer',
        '--disable-features=EnableDrDc'
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: true
      },
      dumpio: true, // Enable verbose logging
      devtools: false, // Disable devtools for stability
      timeout: 60000, // 60 seconds timeout
      protocolTimeout: 60000, // 60 seconds protocol timeout
      handleSIGINT: true,
      handleSIGTERM: true,
      handleSIGHUP: true,
      executablePath: chromePath || undefined, // Use found Chrome/Chromium path or default
      headless: 'new' // Use the new Headless mode if available
    };
    
    log('Using launch options:', JSON.stringify({
      ...launchOptions,
      executablePath: launchOptions.executablePath || 'default',
      args: launchOptions.args
    }, null, 2));
    
    // Try to launch the browser with retry logic
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log(`Browser launch attempt ${attempt} of ${maxRetries}...`);
        browser = await puppeteer.launch(launchOptions);
        log('Browser launched successfully');
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        log(`Browser launch attempt ${attempt} failed: ${error.message}`);
        
        // Add a delay before retrying
        if (attempt < maxRetries) {
          const delay = 2000 * attempt; // Exponential backoff
          log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we couldn't launch the browser after all retries, throw the last error
    if (lastError) {
      throw new Error(`Failed to launch browser after ${maxRetries} attempts: ${lastError.message}`);
    }
    
    log('Browser launched successfully');
    
    // Get browser version for debugging
    const browserVersion = await browser.version();
    log(`Browser version: ${browserVersion}`);
    
    // Get the list of browser contexts
    const browserContexts = await browser.browserContexts();
    log(`Number of browser contexts: ${browserContexts.length}`);
    
    log('Browser launched successfully');
    
    try {
      // Create a new page
      log('Creating new page...');
      page = await browser.newPage();
      
      // Set a realistic user agent
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      log(`Setting user agent: ${userAgent}`);
      await page.setUserAgent(userAgent);
      
      // Set extra HTTP headers
      const headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': userAgent
      };
      
      log('Setting extra HTTP headers...');
      await page.setExtraHTTPHeaders(headers);
      
      // Enable request/response interception
      log('Enabling request interception...');
      await page.setRequestInterception(true);
      
      // Log all requests and responses
      page.on('request', request => {
        const url = request.url();
        // Skip noisy requests
        if (!url.includes('google') && !url.includes('gstatic') && !url.includes('facebook') && !url.includes('hotjar')) {
          log(`Request: ${request.method()} ${url}`);
        }
        request.continue();
      });
      
      page.on('response', response => {
        const url = response.url();
        // Skip noisy responses
        if (!url.includes('google') && !url.includes('gstatic') && !url.includes('facebook') && !url.includes('hotjar')) {
          log(`Response: ${response.status()} ${url}`);
          
          // Log response headers for WebSocket upgrade
          if (response.status() === 101 && response.request().resourceType() === 'websocket') {
            log('WebSocket upgrade response headers:', JSON.stringify(response.headers(), null, 2));
          }
        }
      });
      
      // Listen to console messages
      page.on('console', msg => {
        const text = msg.text();
        // Skip verbose logs
        if (!text.includes('Warning:') && !text.includes('Deprecation') && !text.includes('DevTools')) {
          log(`Console ${msg.type()}: ${text}`);
          
          // Log console arguments if available
          const args = msg.args();
          if (args && args.length > 0) {
            Promise.all(args.map(arg => 
              arg.jsonValue().catch(() => {})
            )).then(values => {
              if (values && values.length > 0) {
                log('Console arguments:', JSON.stringify(values, null, 2));
              }
            });
          }
        }
      });
    
    // Log page errors
    page.on('pageerror', error => {
      log(`\n=== Page Error ===`);
      log(`Error: ${error.message}`);
      log(`Stack: ${error.stack}`);
    });
    
    // Log unhandled promise rejections
    page.on('error', error => {
      log(`\n=== Unhandled Error ===`);
      log(`Error: ${error.message}`);
      log(`Stack: ${error.stack}`);
    });
    
    // Log when the page is closed
    page.on('close', () => {
      log('\n=== Page Closed ===');
    });
    
    // Monitor WebSocket connections
    page.on('websocket', ws => {
      const url = ws.url();
      log(`\n=== New WebSocket Connection ===`);
      log(`WebSocket URL: ${url}`);
      log(`WebSocket readyState: ${ws._ws._readyState}`);
      log(`WebSocket version: ${ws.version()}`);
      log(`WebSocket extensions: ${ws.extensions()}`);
      
      // Store the WebSocket URL for later use
      if (url.includes('blaze') || url.includes('wss')) {
        wsUrl = url;
        log(`✅ Found potential Blaze WebSocket: ${wsUrl}`);
        
        // Connect to the WebSocket
        connectToWebSocket(wsUrl);
      } else {
        log(`⚠️  WebSocket doesn't match expected patterns: ${url}`);
      }
      
      // Listen for WebSocket messages
      ws.on('framereceived', frame => {
        if (frame.payload) {
          log('\n=== New WebSocket Message ===');
          log('Message type:', frame.type);
          log('Message timestamp:', new Date().toISOString());
          log('Message payload length:', frame.payload.length);
          log('First 200 chars of payload:', frame.payload.substring(0, 200));
          
          try {
            processWebSocketMessage(frame.payload);
          } catch (error) {
            log('Error in message handler:', error.message);
          }
        }
      });
      
      ws.on('framesent', frame => {
        log('\n=== WebSocket Frame Sent ===');
        log('Frame type:', frame.type);
        log('Frame payload length:', frame.payload ? frame.payload.length : 0);
        log('First 200 chars of sent payload:', frame.payload ? frame.payload.substring(0, 200) : 'No payload');
      });
      
      ws.on('close', () => {
        log('\n=== WebSocket Closed ===');
        log('Close timestamp:', new Date().toISOString());
      });
      
      ws.on('error', error => {
        log('\n=== WebSocket Error ===');
        log('Error timestamp:', new Date().toISOString());
        log('Error message:', error.message);
        log('Error stack:', error.stack);
      });
    });
    
    // Navigate to the roulette page with retry logic
    const maxNavigationRetries = 3;
    let navigationSuccess = false;
    let lastNavigationError = null;
    
    for (let attempt = 1; attempt <= maxNavigationRetries; attempt++) {
      try {
        log(`Navigation attempt ${attempt} of ${maxNavigationRetries} to ${BLAZE_URL}...`);
        
        // Clear cookies and cache before navigation
        if (attempt > 1) {
          log('Clearing cookies and cache...');
          const client = await page.target().createCDPSession();
          await client.send('Network.clearBrowserCookies');
          await client.send('Network.clearBrowserCache');
          await page.deleteCookie();
        }
        
        // Navigate to Blaze
        await page.goto(BLAZE_URL, {
          waitUntil: 'networkidle2',
          timeout: 60000,
          referer: 'https://www.google.com/'
        });
        
        // Wait for WebSocket connections to be established
        log('Page loaded, waiting for WebSocket connections (30s timeout)...');
        await page.waitForFunction(
          'window.WebSocket && document.readyState === "complete"',
          { timeout: 30000 }
        );
        
        navigationSuccess = true;
        log('Navigation and WebSocket connection successful!');
        break;
        
      } catch (error) {
        lastNavigationError = error;
        log(`Navigation attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxNavigationRetries) {
          const delay = 3000 * attempt; // Exponential backoff
          log(`Retrying navigation in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    if (!navigationSuccess && lastNavigationError) {
      throw new Error(`Failed to navigate to Blaze after ${maxNavigationRetries} attempts: ${lastNavigationError.message}`);
    }
    
    // Take a screenshot for debugging
    log('Taking screenshot for debugging...');
    await page.screenshot({ path: 'blaze-page.png', fullPage: true });
    log('Screenshot saved as blaze-page.png');
    
    log('Page loaded, monitoring WebSocket traffic...');
    
    // Keep the browser open
    // await browser.close();
    
  } catch (error) {
    log('Error initializing collector:', error);
    if (error.stack) log(error.stack);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\nShutting down gracefully...');
  
  if (wsConnection) {
    wsConnection.close();
  }
  
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
  log('Fatal error in collector:', error);
  process.exit(1);
});
