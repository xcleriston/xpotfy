// Script para coleta em tempo real das roletas da Blaze
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');
const { broadcastToAll } = require('../websockets');
const fetch = require('node-fetch');

// Configuração do banco de dados
const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

// Lista das roletas a serem monitoradas (priorizando as mais ativas)
const ROULETTES = [
  { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
  { id: 'roulette', name: 'European Roulette' },
  { id: 'speed-roulette', name: 'Speed Roulette' },
  { id: 'french-roulette', name: 'French Roulette' },
  { id: 'american-roulette', name: 'American Roulette' }
];

// Headers para simular um navegador real
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Origin': 'https://blaze.bet.br',
  'Referer': 'https://blaze.bet.br/games/roulette',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
};

// Cache para armazenar cookies de sessão
let sessionCookies = '';

// Cache para armazenar os últimos resultados de cada roleta
const lastResults = new Map();

// Cache para armazenar os contadores de rodadas desde a última sequência
const sequenceCounters = new Map();

// Inicializar contadores para uma roleta
function initializeCounters(rouletteId) {
  sequenceCounters.set(rouletteId, {
    red: 0,      // Rodadas desde 2 vermelhos seguidos
    black: 0,    // Rodadas desde 2 pretos seguidos
    even: 0,     // Rodadas desde 2 pares seguidos
    odd: 0,      // Rodadas desde 2 ímpares seguidos
    low: 0,      // Rodadas desde 2 baixos (1-18) seguidos
    high: 0      // Rodadas desde 2 altos (19-36) seguidos
  });
}

// Função para obter cookies de sessão
async function fetchSessionCookies() {
  try {
    const response = await fetch('https://blaze.bet.br/games/roulette', {
      headers: {
        ...BROWSER_HEADERS,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      redirect: 'manual'
    });
    
    // Extrair cookies da resposta
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      sessionCookies = cookies.split(';')[0]; // Pega apenas o cookie principal
      console.log(`[${new Date().toISOString()}] Sessão atualizada`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao obter cookies de sessão:`, error.message);
    return false;
  }
}

// Função para conectar ao WebSocket da Blaze e monitorar uma roleta
async function monitorRoulette(roulette, attempt = 1) {
  const maxAttempts = 5;
  const baseDelay = 10000; // 10 seconds base delay
  const maxDelay = 300000; // 5 minutes max delay
  
  // Calculate delay with exponential backoff
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 5000, maxDelay);
  
  console.log(`[${new Date().toISOString()}] Conectando à ${roulette.name} (tentativa ${attempt}/${maxAttempts})...`);
  
  try {
    // Atualizar cookies de sessão a cada 10 tentativas
    if (attempt % 10 === 1) {
      await fetchSessionCookies();
    }
    
    const wsUrl = `wss://blaze.bet.br/roulette/ws?game_id=${roulette.id}`;
    const ws = new WebSocket(wsUrl, {
      headers: {
        ...BROWSER_HEADERS,
        'Cookie': sessionCookies,
        'Sec-WebSocket-Protocol': 'json'
      },
      followRedirects: true,
      rejectUnauthorized: false, // Only for development
      handshakeTimeout: 10000,   // 10 seconds handshake timeout
      maxRedirects: 5,           // Maximum redirects
      perMessageDeflate: {
        serverNoContextTakeover: true,
        clientNoContextTakeover: true,
        serverMaxWindowBits: 10,
        memLevel: 6
      }
    });

    // Set a timeout for the connection
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error(`[${new Date().toISOString()}] Timeout ao conectar à ${roulette.name}.`);
        ws.terminate();
      }
    }, 15000); // 15 seconds timeout

    ws.on('open', () => {
      clearTimeout(connectionTimeout);
      console.log(`[${new Date().toISOString()}] Conectado com sucesso à ${roulette.name}`);
      // Reset attempt counter on successful connection
      attempt = 1;
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        // Processar mensagens de resultado
        if (message.type === 'roulette.update') {
          const result = message.data;
          
          // Atualizar o cache com o último resultado
          if (!lastResults.has(roulette.id)) {
            lastResults.set(roulette.id, []);
          }
          
          const results = lastResults.get(roulette.id);
          results.unshift(result);
          
          // Manter apenas os últimos 100 resultados
          if (results.length > 100) {
            results.pop();
          }
          
          // Calcular padrões de sequência
          const patterns = calculatePatterns(results);
          
          // Salvar no banco de dados
          saveResult(roulette, result, patterns);
          
          // Enviar atualização via WebSocket para todos os clientes conectados
          broadcastToAll('roulette_update', {
            rouletteId: roulette.id,
            result: result,
            patterns: patterns,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao processar mensagem da ${roulette.name}:`, error);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      console.error(`[${new Date().toISOString()}] Erro no WebSocket da ${roulette.name}:`, error.message);
      
      // Tentar reconectar se não excedeu o número máximo de tentativas
      if (attempt < maxAttempts) {
        console.log(`[${new Date().toISOString()}] Tentando reconectar em ${Math.round(delay/1000)} segundos...`);
        setTimeout(() => monitorRoulette(roulette, attempt + 1), delay);
      } else {
        console.error(`[${new Date().toISOString()}] Número máximo de tentativas (${maxAttempts}) atingido para ${roulette.name}.`);
      }
    });

    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      console.log(`[${new Date().toISOString()}] Conexão WebSocket da ${roulette.name} fechada. Código: ${code}, Motivo: ${reason || 'Nenhum motivo fornecido'}`);
      
      // Tentar reconectar se não excedeu o número máximo de tentativas
      if (attempt < maxAttempts) {
        console.log(`[${new Date().toISOString()}] Tentando reconectar em ${Math.round(delay/1000)} segundos...`);
        setTimeout(() => monitorRoulette(roulette, attempt + 1), delay);
      } else {
        console.error(`[${new Date().toISOString()}] Número máximo de tentativas (${maxAttempts}) atingido para ${roulette.name}.`);
      }
    });
    
    return ws;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao configurar WebSocket para ${roulette.name}:`, error.message);
    
    // Tentar novamente se não excedeu o número máximo de tentativas
    if (attempt < maxAttempts) {
      console.log(`[${new Date().toISOString()}] Tentando novamente em ${Math.round(delay/1000)} segundos...`);
      setTimeout(() => monitorRoulette(roulette, attempt + 1), delay);
    } else {
      console.error(`[${new Date().toISOString()}] Número máximo de tentativas (${maxAttempts}) atingido para ${roulette.name}.`);
    }
  }
}

// Função para calcular padrões de sequência
function calculatePatterns(results) {
  if (!results || results.length < 2) {
    return {
      red: 0,
      black: 0,
      even: 0,
      odd: 0,
      low: 0,
      high: 0
    };
  }

  // Implementar lógica de cálculo de padrões
  // Esta é uma implementação simplificada
  const patterns = {
    red: 0,
    black: 0,
    even: 0,
    odd: 0,
    low: 0,
    high: 0
  };

  // Lógica para calcular padrões de sequência
  // (implementação detalhada omitida por brevidade)
  
  return patterns;
}

// Função para salvar resultado no banco de dados
function saveResult(roulette, result, patterns) {
  const query = `
    INSERT INTO roulette_history 
    (roulette_id, result_number, result_color, created_at, patterns)
    VALUES (?, ?, ?, datetime('now'), ?)
  `;
  
  db.run(query, [
    roulette.id,
    result.result_number,
    result.result_color,
    JSON.stringify(patterns)
  ], (err) => {
    if (err) {
      console.error(`Erro ao salvar resultado da ${roulette.name}:`, err);
    } else {
      console.log(`[${new Date().toISOString()}] Resultado salvo para ${roulette.name}:`, 
        result.result_number, result.result_color);
    }
  });
}

// Iniciar monitoramento de todas as roletas
async function startMonitoring() {
  console.log(`[${new Date().toISOString()}] Iniciando monitoramento das roletas...`);
  
  try {
    // Obter cookies de sessão antes de iniciar as conexões WebSocket
    const sessionUpdated = await fetchSessionCookies();
    if (!sessionUpdated) {
      console.warn(`[${new Date().toISOString()}] Não foi possível obter cookies de sessão. Tentando continuar...`);
    }
    
    // Inicializar e conectar a cada roleta com um pequeno atraso entre elas
    ROULETTES.forEach((roulette, index) => {
      initializeCounters(roulette.id);
      
      // Espaçar as conexões para evitar sobrecarga
      setTimeout(() => {
        monitorRoulette(roulette);
      }, index * 2000); // 2 segundos entre cada conexão
    });
    
    // Verificar a conexão periodicamente
    setInterval(() => {
      console.log(`[${new Date().toISOString()}] Status do monitoramento ativo para ${ROULETTES.length} roletas`);
    }, 300000); // A cada 5 minutos
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao iniciar monitoramento:`, error.message);
    // Tentar reiniciar após um minuto em caso de falha
    setTimeout(startMonitoring, 60000);
  }
}

// Iniciar o monitoramento
startMonitoring();

// Lidar com encerramento gracioso
process.on('SIGINT', () => {
  console.log('\nEncerrando monitoramento...');
  process.exit(0);
});
