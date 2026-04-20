// Enhanced debug script for Blaze roulette page analysis
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

async function debugBlaze() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1366,
      height: 768
    }
  });

  try {
    const page = await browser.newPage();
    
    // Set user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request/response interception
    await page.setRequestInterception(true);
    
    // Block unnecessary resources
    page.on('request', (request) => {
      const url = request.url();
      const resourceType = request.resourceType();
      
      // Block certain resources to speed up page load
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType) ||
          url.includes('google') || 
          url.includes('facebook') ||
          url.includes('doubleclick') ||
          url.includes('adform') ||
          url.includes('googletagmanager')) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Log console messages
    page.on('console', msg => {
      console.log('Browser Console:', msg.text());
    });
    
    // Log WebSocket messages
    page.on('websocket', ws => {
      console.log('WebSocket connected:', ws.url());
      ws.on('framereceived', frame => {
        if (frame.payload) {
          console.log('WebSocket message received:', frame.payload);
        }
      });
    });
    
    // Navigate to the roulette page
    const url = 'https://blaze.bet.br/games/roleta-brasileira';
    console.log(`Navigating to ${url}...`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    console.log('Page loaded, waiting for roulette elements...');
    
    // Wait for potential dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Take a screenshot
    const screenshotPath = path.join(__dirname, 'blaze_enhanced_debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Get page HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, 'blaze_enhanced_page.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`Page HTML saved to: ${htmlPath}`);
    
    // Execute JavaScript in the page context to find roulette elements
    const elements = await page.evaluate(() => {
      const results = [];
      
      // Function to get element's full XPath
      const getXPath = (element) => {
        if (!element) return '';
        if (element.id) return `//*[@id="${element.id}"]`;
        if (element === document.body) return '/html/body';
        
        let ix = 0;
        const siblings = element.parentNode ? element.parentNode.children : [];
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          if (sibling === element) {
            return `${getXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
          }
          if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
          }
        }
        return '';
      };
      
      // Look for potential roulette elements
      const potentialElements = document.querySelectorAll('*');
      
      potentialElements.forEach((el, index) => {
        try {
          if (!el || !el.getBoundingClientRect) return;
          
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          
          const styles = window.getComputedStyle(el);
          if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
            return;
          }
          
          const text = el.textContent ? el.textContent.trim() : '';
          const className = el.className ? el.className.toString() : '';
          const id = el.id || '';
          const tagName = el.tagName ? el.tagName.toLowerCase() : '';
          const xpath = getXPath(el);
          
          // Check if element might be related to roulette
          const isPotentialMatch = 
            (/\d+/.test(text) && text.length <= 3) || 
            /roulet|number|result|ball|last|wheel|spin|bet|game|play|roll|dice|crash|double/i.test(className) ||
            /roulet|number|result|ball|last|wheel|spin|bet|game|play|roll|dice|crash|double/i.test(id) ||
            ['canvas', 'svg', 'iframe'].includes(tagName);
          
          if (isPotentialMatch) {
            results.push({
              index,
              tag: tagName,
              id,
              class: className,
              text,
              xpath,
              position: {
                x: Math.round(rect.left),
                y: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              styles: {
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                fontSize: styles.fontSize,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity
              }
            });
          }
        } catch (e) {
          // Skip elements that cause errors
          console.error('Error processing element:', e);
        }
      });
      
      // Sort by position (top to bottom, left to right)
      return results.sort((a, b) => {
        if (Math.abs(a.position.y - b.position.y) < 10) {
          return a.position.x - b.position.x;
        }
        return a.position.y - b.position.y;
      });
    });
    
    // Save elements to a JSON file
    const elementsPath = path.join(__dirname, 'blaze_elements.json');
    fs.writeFileSync(elementsPath, JSON.stringify(elements, null, 2));
    console.log(`Elements data saved to: ${elementsPath}`);
    
    // Log a summary of found elements
    console.log('\nFound', elements.length, 'potential roulette elements:');
    elements.slice(0, 20).forEach((el, i) => {
      console.log(`\n--- Element ${i + 1} ---`);
      console.log(`Tag: ${el.tag}`);
      if (el.id) console.log(`ID: ${el.id}`);
      if (el.class) console.log(`Class: ${el.class}`);
      if (el.text) console.log(`Text: ${el.text}`);
      console.log(`Position: x=${el.position.x}, y=${el.position.y}, width=${el.position.width}, height=${el.position.height}`);
      if (el.xpath) console.log(`XPath: ${el.xpath}`);
    });
    
    if (elements.length > 20) {
      console.log(`\n... and ${elements.length - 20} more elements`);
    }
    
    console.log('\nDebugging complete. Browser will remain open for inspection.');
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Run the debugger
debugBlaze().catch(console.error);
