/**
 * Configurações do Coletor de Dados da Roleta
 * 
 * Este arquivo contém as configurações para o coletor de dados da roleta.
 * Todas as configurações podem ser sobrescritas por variáveis de ambiente.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configurações gerais
const config = {
  // Configurações do navegador
  browser: {
    headless: process.env.BROWSER_HEADLESS !== 'false', // Modo headless (true/false)
    slowMo: parseInt(process.env.BROWSER_SLOWMO) || 0, // Desacelerar execução (ms)
    defaultViewport: {
      width: parseInt(process.env.BROWSER_WIDTH) || 1366,
      height: parseInt(process.env.BROWSER_HEIGHT) || 768,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    },
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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  
  // Configurações da roleta
  roulette: {
    url: process.env.ROULETTE_URL || 'https://blaze.bet.br/games/roleta-brasileira',
    gameId: process.env.ROULETTE_GAME_ID || 'roleta-brasileira',
    gameName: process.env.ROULETTE_GAME_NAME || 'Roleta Brasileira',
    provider: process.env.ROULETTE_PROVIDER || 'blaze',
    
    // Intervalo de verificação de novos resultados (em ms)
    checkInterval: parseInt(process.env.ROULETTE_CHECK_INTERVAL) || 10000,
    
    // Número máximo de tentativas de reconexão
    maxReconnectionAttempts: parseInt(process.env.ROULETTE_MAX_RECONNECTION_ATTEMPTS) || 5,
    
    // Tempo de espera entre tentativas de reconexão (em ms)
    reconnectionDelay: parseInt(process.env.ROULETTE_RECONNECTION_DELAY) || 60000
  },
  
  // Configurações do banco de dados
  database: {
    path: process.env.DATABASE_PATH || path.join(__dirname, '../data/roulette.db'),
    
    // Tamanho máximo do banco de dados (em MB)
    maxSize: parseInt(process.env.DATABASE_MAX_SIZE) || 100,
    
    // Número máximo de registros a serem mantidos (0 para ilimitado)
    maxRecords: parseInt(process.env.DATABASE_MAX_RECORDS) || 0
  },
  
  // Configurações de log
  logging: {
    level: process.env.LOG_LEVEL || 'info', // error, warn, info, debug
    console: process.env.LOG_CONSOLE !== 'false', // Habilitar logs no console
    file: process.env.LOG_FILE !== 'false', // Habilitar logs em arquivo
    filePath: process.env.LOG_FILE_PATH || path.join(__dirname, '../logs/roulette_collector.log'),
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },
  
  // Configurações de monitoramento
  monitoring: {
    // Habilitar endpoint de status HTTP
    enableStatusEndpoint: process.env.MONITORING_ENABLE_STATUS !== 'false',
    
    // Porta do servidor de status
    statusPort: parseInt(process.env.MONITORING_STATUS_PORT) || 3001,
    
    // Endpoint de status
    statusEndpoint: process.env.MONITORING_STATUS_ENDPOINT || '/status'
  }
};

module.exports = config;
