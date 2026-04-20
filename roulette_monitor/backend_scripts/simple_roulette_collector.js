const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const userAgents = require('user-agents');

// Configurações
const BLAZE_URL = 'https://blaze.bet.br/games/roleta-brasileira';
const DB_PATH = path.join(__dirname, '../data/roulette.db');
const LOG_DIR = path.join(__dirname, '../logs');

// Configurações de navegador para evitar detecção
const BROWSER_SETTINGS = {
  headless: false, // Alterar para true em produção
  args: [
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
    '--disable-blink-features=AutomationControlled'
  ],
  defaultViewport: null,
  ignoreHTTPSErrors: true,
  timeout: 120000 // 2 minutos de timeout
};

// Garantir que o diretório de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Configurar logger simples
const logStream = fs.createWriteStream(path.join(LOG_DIR, 'simple_roulette_collector.log'), { flags: 'a' });

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  logStream.write(logMessage);
}

// Configurar o Puppeteer com o plugin Stealth
puppeteer.use(StealthPlugin());

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    log('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  log('Conectado ao banco de dados SQLite com sucesso!');
});

// Função para salvar o resultado da roleta no banco de dados
function saveRouletteResult(result) {
  return new Promise((resolve, reject) => {
    const { gameId, roundId, number, color, rawData } = result;
    
    const sql = `
      INSERT INTO roulette_history 
      (provider, game_id, game_name, result_number, result_color, round_id, timestamp, raw_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
    `;
    
    const params = [
      'blaze',           // provider
      gameId || 'roleta-brasileira',  // game_id
      'Roleta Brasileira',            // game_name
      number,            // result_number
      color,             // result_color
      roundId || `round-${Date.now()}`, // round_id
      JSON.stringify(rawData || {})    // raw_data
    ];
    
    db.run(sql, params, function(err) {
      if (err) {
        log('Erro ao salvar resultado da roleta:', err.message);
        reject(err);
      } else {
        log(`Resultado salvo com sucesso! ID: ${this.lastID}`);
        resolve(this.lastID);
      }
    });
  });
}

// Função para gerar um atraso aleatório
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Função para configurar a página com configurações de stealth
async function setupPage(page) {
  try {
    // Gerar um user agent aleatório
    const userAgent = new userAgents({ deviceCategory: 'desktop' });
    const userAgentString = userAgent.toString();
    
    log(`Configurando user agent: ${userAgentString}`);
    
    // Configurar o user agent e cabeçalhos
    await page.setUserAgent(userAgentString);
    await page.setExtraHTTPHeaders({
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    });
    
    log('Headers configurados com sucesso');
    
    // Configurar viewport
    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
    
    // Sobrescrever propriedades do navegador para evitar detecção
    await page.evaluateOnNewDocument(() => {
      // Esconder WebDriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Sobrescrever a propriedade languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en-US', 'en'],
      });
      
      // Sobrescrever a propriedade plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });
    
    log('Configurações de stealth aplicadas com sucesso');
    return page;
  } catch (error) {
    log('Erro ao configurar a página:', error);
    throw error;
  }
}

// Função principal
async function startCollector() {
  let browser;
  let page;
  let cdp;
  
  try {
    // Iniciar o navegador
    log('Iniciando o navegador...');
    browser = await puppeteer.launch(BROWSER_SETTINGS);
    
    log('Criando nova página...');
    page = await browser.newPage();
    
    // Configurar a página com configurações de stealth
    await setupPage(page);
    
    // Configurar viewport
    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
    
    // Habilitar logs de rede
    log('Habilitando interceptação de requisições...');
    await page.setRequestInterception(true);
    
    // Configurar timeouts
    page.setDefaultNavigationTimeout(60000); // 60 segundos
    page.setDefaultTimeout(60000); // 60 segundos
    
    // Monitorar requisições WebSocket
    log('Criando sessão CDP para monitorar WebSockets...');
    cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    
    // Rastrear conexões WebSocket
    const wsConnections = new Map();
    
    cdp.on('Network.webSocketCreated', ({ requestId, url }) => {
      log(`Nova conexão WebSocket detectada: ${url}`);
      wsConnections.set(requestId, { url, messages: [] });
    });
    
    cdp.on('Network.webSocketFrameReceived', async ({ requestId, response }) => {
      const connection = wsConnections.get(requestId);
      if (connection) {
        try {
          const data = JSON.parse(response.payloadData);
          
          // Verificar se é uma mensagem de resultado da roleta
          if (data && data.data && data.data.kind === 'roulette') {
            const gameData = data.data;
            log('Resultado da roleta detectado:', gameData);
            
            // Salvar no banco de dados
            try {
              await saveRouletteResult({
                gameId: 'roleta-brasileira',
                roundId: gameData.id || `round-${Date.now()}`,
                number: gameData.number,
                color: gameData.color,
                rawData: gameData
              });
              log('Resultado salvo no banco de dados com sucesso!');
            } catch (saveError) {
              log('Erro ao salvar resultado no banco de dados:', saveError);
            }
          }
        } catch (e) {
          // Ignorar erros de parsing, mas registrar para depuração
          log('Erro ao processar mensagem WebSocket:', e.message);
        }
      }
    });
    
    // Navegar para a página da roleta com mais tolerância
    log(`Navegando para ${BLAZE_URL}...`);
    try {
      // Primeiro, carregar a página inicial
      log('Carregando a página inicial...');
      try {
        await page.goto('https://blaze.bet.br', { 
          waitUntil: 'domcontentloaded', 
          timeout: 180000, // 3 minutos
          referer: 'https://www.google.com/'
        });
        log('Página inicial carregada com sucesso');
      } catch (error) {
        log('Erro ao carregar a página inicial, tentando continuar mesmo assim...', error);
      }
      
      // Aguardar um pouco para o site carregar completamente
      const waitTime = randomDelay(5000, 10000); // 5-10 segundos
      log(`Aguardando ${waitTime}ms para carregamento...`);
      await page.waitForTimeout(waitTime);
      
      // Tirar screenshot para depuração
      try {
        await page.screenshot({ path: path.join(LOG_DIR, 'debug_homepage.png') });
        log('Screenshot da página inicial salvo em debug_homepage.png');
      } catch (e) {
        log('Erro ao tirar screenshot da página inicial:', e.message);
      }
      
      // Navegar para a página da roleta
      log('Acessando a página da roleta...');
      try {
        await page.goto(BLAZE_URL, { 
          waitUntil: 'domcontentloaded', 
          timeout: 180000, // 3 minutos
          referer: 'https://blaze.bet.br/'
        });
        log('Página da roleta carregada com sucesso');
      } catch (error) {
        log('Erro ao carregar a página da roleta:', error);
        throw error;
      }
      
      // Aguardar um pouco mais para garantir que a página foi carregada
      const waitTime2 = randomDelay(5000, 10000); // 5-10 segundos
      log(`Aguardando mais ${waitTime2}ms para carregamento completo...`);
      await page.waitForTimeout(waitTime2);
      
      // Tirar screenshot para depuração
      try {
        await page.screenshot({ path: path.join(LOG_DIR, 'debug_roulette.png') });
        log('Screenshot da roleta salvo em debug_roulette.png');
      } catch (e) {
        log('Erro ao tirar screenshot da roleta:', e.message);
      }
      
      // Verificar se a página foi carregada corretamente
      const pageTitle = await page.title();
      log(`Página carregada: ${pageTitle}`);
      
      // Verificar se há um modal de aceitação de cookies
      try {
        log('Procurando por banner de cookies...');
        const cookieSelectors = [
          'button:has-text("Aceitar")',
          'button:has-text("Aceitar todos")',
          'button:has-text("Aceitar cookies")',
          'button[data-test="accept-cookies"]',
          '.cookie-banner button',
          '#cookie-banner button',
          '.cookie-consent button',
          '#cookie-consent button'
        ];
        
        let cookieButton = null;
        for (const selector of cookieSelectors) {
          try {
            cookieButton = await page.$(selector);
            if (cookieButton) {
              log(`Botão de cookies encontrado com seletor: ${selector}`);
              break;
            }
          } catch (e) {
            // Ignorar erros e tentar o próximo seletor
          }
        }
        
        if (cookieButton) {
          log('Aceitando cookies...');
          await cookieButton.click();
          await page.waitForTimeout(randomDelay(1000, 3000));
          log('Cookies aceitos com sucesso');
        } else {
          log('Nenhum banner de cookies encontrado');
        }
      } catch (e) {
        log('Erro ao processar banner de cookies:', e.message);
      }
    } catch (error) {
      log('Erro ao navegar para a página da roleta:', error);
      throw error; // Relançar o erro para ser capturado pelo bloco catch externo
    }
    
    log('Página carregada com sucesso! Monitorando resultados da roleta...');
    
    // Manter o script em execução
    await new Promise(() => {});
    
  } catch (error) {
    log('Erro no coletor:', error);
    
    if (browser) {
      await browser.close();
    }
    
    process.exit(1);
  }
}

// Manipular encerramento do processo
process.on('SIGINT', async () => {
  log('Encerrando o coletor...');
  
  // Fechar a conexão com o banco de dados
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
    } else {
      console.log('Conexão com o banco de dados fechada com sucesso!');
    }
    process.exit(0);
  });
});

// Iniciar o coletor
log('Iniciando o coletor de dados da roleta...');
startCollector().catch(error => {
  log('Erro ao iniciar o coletor:', error);
  process.exit(1);
});
