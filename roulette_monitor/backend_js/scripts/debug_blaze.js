// Debug script to analyze Blaze roulette page structure
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function debugBlaze() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the roulette page
    const url = 'https://blaze.bet.br/games/roleta-brasileira';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take a screenshot
    const screenshotPath = path.join(__dirname, 'blaze_debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Get page HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, 'blaze_page.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`Page HTML saved to: ${htmlPath}`);
    
    // Find all elements with numbers or colors
    console.log('\nSearching for roulette elements...');
    const elements = await page.evaluate(() => {
      const results = [];
      // Look for elements that might contain roulette numbers or colors
      const possibleElements = document.querySelectorAll('*');
      
      possibleElements.forEach(el => {
        try {
          const text = el.textContent ? el.textContent.trim() : '';
          const className = (el.className && typeof el.className === 'string') ? el.className : '';
          const id = el.id || '';
          const tagName = el.tagName || '';
          
          // Check if element might be related to roulette numbers
          const isPotentialMatch = 
            (/\d+/.test(text) && text.length <= 3) || 
            className.toLowerCase().includes('roulet') || 
            className.toLowerCase().includes('number') ||
            className.toLowerCase().includes('result') ||
            className.toLowerCase().includes('ball') ||
            className.toLowerCase().includes('last') ||
            id.toLowerCase().includes('roulet') ||
            id.toLowerCase().includes('number') ||
            id.toLowerCase().includes('result') ||
            id.toLowerCase().includes('ball') ||
            id.toLowerCase().includes('last') ||
            tagName.toLowerCase() === 'canvas';
          
          if (isPotentialMatch) {
            // Get element position and size
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            
            results.push({
              tag: tagName,
              id: id,
              class: className,
              text: text,
              innerHTML: el.innerHTML ? 
                (el.innerHTML.length > 100 ? el.innerHTML.substring(0, 100) + '...' : el.innerHTML) : '',
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
        }
      });
      
      // Sort by position (top to bottom, left to right)
      return results
        .filter(el => el.position.width > 0 && el.position.height > 0) // Only visible elements
        .sort((a, b) => {
          if (Math.abs(a.position.y - b.position.y) < 10) {
            return a.position.x - b.position.x;
          }
          return a.position.y - b.position.y;
        });
    });
    
    console.log('\nPotential roulette elements found:', elements.length);
    
    // Log elements in a more readable format
    elements.forEach((el, index) => {
      console.log(`\n--- Element ${index + 1} ---`);
      console.log(`Tag: ${el.tag}`);
      if (el.id) console.log(`ID: ${el.id}`);
      if (el.class) console.log(`Class: ${el.class}`);
      if (el.text) console.log(`Text: ${el.text}`);
      console.log(`Position: x=${el.position.x}, y=${el.position.y}, width=${el.position.width}, height=${el.position.height}`);
      if (el.styles.backgroundColor !== 'rgba(0, 0, 0, 0)') console.log(`Background: ${el.styles.backgroundColor}`);
      if (el.styles.color !== 'rgba(0, 0, 0, 0)') console.log(`Color: ${el.styles.color}`);
      if (el.styles.fontSize !== '0px') console.log(`Font size: ${el.styles.fontSize}`);
    });
    
    // Look for WebSocket connections
    console.log('\nLooking for WebSocket connections...');
    const wsUrls = await page.evaluate(() => {
      return Array.from(document.scripts)
        .map(script => script.src)
        .filter(src => src && (src.includes('socket') || src.includes('ws') || src.includes('wss')));
    });
    
    console.log('\nPotential WebSocket connections:');
    console.log(wsUrls);
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    console.log('\nDebugging complete. Browser will remain open for inspection.');
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Run the debugger
debugBlaze().catch(console.error);
