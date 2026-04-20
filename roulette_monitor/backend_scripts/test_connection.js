const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const path = require('path');
const fs = require('fs');

// Configurações
const BLAZE_URL = 'https://blaze.bet.br';
const LOG_DIR = path.join(__dirname, '../logs');

// Garantir que o diretório de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Função para log
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(path.join(LOG_DIR, 'test_connection.log'), logMessage);
}

// Função principal
async function testConnection() {
  let browser;
  
  try {
    log('Iniciando teste de conexão...');
    
    // Configurações do navegador
    const browserOptions = {
      headless: true, // Usar true para evitar problemas de UI
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--window-size=1366,768',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      timeout: 300000, // 5 minutos
      dumpio: true // Habilitar logs de depuração
    };
    
    log('Opções do navegador:');
    log(JSON.stringify({
      ...browserOptions,
      executablePath: browserOptions.executablePath ? 'DEFINIDO' : 'NÃO DEFINIDO'
    }, null, 2));
    
    log('Iniciando navegador...');
    try {
      browser = await puppeteer.launch(browserOptions);
      log('Navegador iniciado com sucesso');
    } catch (error) {
      log('Erro ao iniciar o navegador:');
      log(error.stack || error.message);
      log('Tentando encontrar o Chrome no sistema...');
      
      // Tentar encontrar o Chrome em locais comuns
      const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      ];
      
      for (const chromePath of chromePaths) {
        try {
          log(`Tentando executar o Chrome em: ${chromePath}`);
          browser = await puppeteer.launch({
            ...browserOptions,
            executablePath: chromePath,
            headless: false
          });
          log('Navegador iniciado com sucesso usando o Chrome local');
          break;
        } catch (e) {
          log(`Erro ao iniciar o Chrome em ${chromePath}: ${e.message}`);
        }
      }
      
      if (!browser) {
        throw new Error('Não foi possível iniciar o navegador. Verifique se o Chrome está instalado.');
      }
    }
    
    log('Criando nova página...');
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
    
    // Navegar para o Google primeiro
    log('Navegando para o Google...');
    await page.goto('https://www.google.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Tirar screenshot do Google
    await page.screenshot({ path: path.join(LOG_DIR, 'test_google.png') });
    log('Screenshot do Google salvo em test_google.png');
    
    // Aguardar um pouco
    await page.waitForTimeout(3000);
    
    // Navegar para o site da Blaze
    log(`Navegando para ${BLAZE_URL}...`);
    await page.goto(BLAZE_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 180000 // 3 minutos
    });
    
    // Aguardar mais um pouco
    await page.waitForTimeout(5000);
    
    // Tirar screenshot
    await page.screenshot({ path: path.join(LOG_DIR, 'test_blaze.png') });
    log('Screenshot da Blaze salvo em test_blaze.png');
    
    // Verificar título da página
    const title = await page.title();
    log(`Título da página: ${title}`);
    
    // Verificar se há elementos específicos na página
    const content = await page.content();
    log(`Tamanho do conteúdo HTML: ${content.length} caracteres`);
    
    log('Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    log('Erro no teste de conexão:');
    log(error.stack || error.message);
    
    // Tentar obter mais informações de rede em caso de erro
    if (browser) {
      try {
        const pages = await browser.pages();
        for (const p of pages) {
          try {
            const requests = await p.evaluate(() => {
              return window.performance.getEntriesByType('resource').map(r => ({
                name: r.name,
                type: r.initiatorType,
                duration: r.duration,
                status: r.responseStatus
              }));
            });
            log('Recursos carregados:');
            log(JSON.stringify(requests, null, 2));
          } catch (e) {
            log(`Erro ao obter recursos da página: ${e.message}`);
          }
        }
      } catch (e) {
        log(`Erro ao tentar obter informações de rede: ${e.message}`);
      }
    }
    
    process.exit(1);
  } finally {
    // Fechar o navegador após um tempo para que possamos ver o resultado
    setTimeout(async () => {
      if (browser) {
        await browser.close();
        log('Navegador fechado.');
      }
    }, 30000); // Fechar após 30 segundos
  }
}

// Executar o teste
testConnection();
