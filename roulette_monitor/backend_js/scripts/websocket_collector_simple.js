// WebSocket-based collector for Blaze roulette results - ENHANCED VERSION
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const BLAZE_URL = 'https://blaze.bet.br/games/roleta-brasileira';
const OUTPUT_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create a writable stream for logging
const logStream = fs.createWriteStream(path.join(OUTPUT_DIR, 'websocket_debug.log'), { flags: 'a' });

// Function to log with timestamp to both console and file
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  
  // Log to console
  console.log(logMessage);
  
  // Log to file
  logStream.write(logMessage);
}

// Main function to initialize the collector
async function initializeCollector() {
  let browser = null;
  
  try {
    log('Initializing Blaze Roulette Collector');
    
    // Launch browser with more detailed settings
    log('Launching browser with enhanced settings...');
    
    const browser = await puppeteer.launch({
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
        '--v=1'
      ],
      ignoreHTTPSErrors: true,
      dumpio: true // Enable verbose logging
    });
    
    log('Browser launched successfully');
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Log all requests and responses with more details
    page.on('request', request => {
      const url = request.url();
      const method = request.method();
      const headers = request.headers();
      
      if (url.includes('blaze') || url.includes('socket') || url.includes('ws') || url.includes('wss')) {
        log(`\n=== Request ===`);
        log(`URL: ${url}`);
        log(`Method: ${method}`);
        log('Headers:', headers);
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
        
        // Log response body for non-binary responses
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const text = await response.text();
            log('Response body:', text);
          }
        } catch (e) {
          // Ignore errors when reading response body
        }
      }
    });
    
    // Handle WebSocket connections with more detailed logging
    page.on('websocket', ws => {
      const wsUrl = ws.url();
      const wsId = Math.random().toString(36).substring(2, 8);
      
      log(`\n=== WebSocket Connection [${wsId}] ===`);
      log(`URL: ${wsUrl}`);
      log(`Ready state: ${ws._ws._readyState}`);
      
      // Create a file for this WebSocket connection
      const wsLogFile = path.join(OUTPUT_DIR, `websocket_${wsId}.log`);
      const wsLogStream = fs.createWriteStream(wsLogFile, { flags: 'a' });
      
      const logWsMessage = (type, data) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${wsId}] ${type}: ${data}\n`;
        console.log(logEntry);
        wsLogStream.write(logEntry);
      };
      
      logWsMessage('WEBSOCKET', `Connection established to ${wsUrl}`);
      
      ws.on('framereceived', frame => {
        try {
          const data = JSON.parse(frame.payload);
          logWsMessage('MESSAGE', 'Received JSON:');
          logWsMessage('DATA', JSON.stringify(data, null, 2));
        } catch (e) {
          logWsMessage('MESSAGE', `Received raw data (${frame.payload.length} bytes):`);
          logWsMessage('DATA', frame.payload);
        }
      });
      
      ws.on('framesent', frame => {
        logWsMessage('SENT', `Sent data (${frame.payload.length} bytes)`);
      });
      
      ws.on('error', error => {
        logWsMessage('ERROR', error.message);
        if (error.stack) {
          logWsMessage('STACK', error.stack);
        }
      });
      
      ws.on('close', () => {
        logWsMessage('CLOSE', 'Connection closed');
        wsLogStream.end();
      });
    });
    
    // Set user agent and extra headers
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
      'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="91"',
      'sec-ch-ua-mobile': '?0',
      'upgrade-insecure-requests': '1'
    });
    
    // Navigate to the page with multiple wait conditions
    log(`Navigating to ${BLAZE_URL}...`);
    
    try {
      const response = await page.goto(BLAZE_URL, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 120000, // 2 minutes timeout
        referer: 'https://www.google.com/'
      });
      
      log(`Navigation completed with status: ${response.status()}`);
      
      // Wait for WebSocket connections to be established
      log('Waiting for WebSocket connections (up to 30 seconds)...');
      await page.waitForFunction(
        'window.WebSocket && document.readyState === "complete"',
        { timeout: 30000 }
      );
      
      // Take a screenshot for debugging
      const screenshotPath = path.join(OUTPUT_DIR, 'blaze_page.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot saved to: ${screenshotPath}`);
      
      // Get page content for debugging
      const pageContent = await page.content();
      const contentPath = path.join(OUTPUT_DIR, 'page_content.html');
      fs.writeFileSync(contentPath, pageContent);
      log(`Page content saved to: ${contentPath}`);
      
      log('Page loaded and ready, monitoring WebSocket traffic...');
      
      // Keep the browser open and log active WebSockets periodically
      let counter = 0;
      while (true) {
        const wsCount = await page.evaluate(() => {
          return Object.keys(window).filter(key => key.startsWith('__puppeteer_ws_')).length;
        });
        
        log(`Active WebSockets: ${wsCount}`);
        
        // Take periodic screenshots
        if (counter % 10 === 0) {
          const periodicScreenshot = path.join(OUTPUT_DIR, `periodic_${Date.now()}.png`);
          await page.screenshot({ path: periodicScreenshot });
          log(`Periodic screenshot saved to: ${periodicScreenshot}`);
        }
        
        counter++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
      }
      
    } catch (error) {
      log('Error during page navigation or WebSocket monitoring:', error);
      throw error;
    }
    
  } catch (error) {
    log('Error in collector:', error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Handle process termination
async function cleanup() {
  log('\nShutting down gracefully...');
  
  try {
    // Close the log file
    if (logStream) {
      logStream.end('\n=== Collector stopped ===\n');
    }
    
    // Close the browser if it's still open
    if (browser) {
      log('Closing browser...');
      await browser.close();
    }
    
    log('Cleanup complete. Exiting...');
    process.exit(0);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Handle various termination signals
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
  // Cleanup if needed, but don't exit the process
});

// Start the collector
initializeCollector().catch(error => {
  log('Fatal error:', error);
  process.exit(1);
});
