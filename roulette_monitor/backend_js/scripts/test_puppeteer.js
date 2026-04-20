// Simple Puppeteer test script
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Starting Puppeteer test...');
  let browser;
  
  try {
    // Launch browser
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show the browser for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('Browser launched successfully');
    
    // Create a new page
    const page = await browser.newPage();
    console.log('New page created');
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to a test page
    console.log('Navigating to test page...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    
    // Take a screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved as test-screenshot.png');
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    console.log('Puppeteer test completed successfully!');
    
  } catch (error) {
    console.error('Error in Puppeteer test:', error);
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

// Run the test
testPuppeteer().catch(console.error);
