const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuração do banco de dados
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'roulette.db');
const dbLive = new sqlite3.Database(DB_PATH);

// Lista das roletas a serem monitoradas
const ROULETTES = [
  { id: 'mega-roulette---brazilian', name: 'Brazilian Mega Roulette' },
  { id: 'roleta-brasileira', name: 'Roleta Brasileira' },
  { id: 'roulette', name: 'European Roulette' },
  { id: 'speed-roulette', name: 'Speed Roulette' },
  { id: 'french-roulette', name: 'French Roulette' },
  { id: 'american-roulette', name: 'American Roulette' },
  { id: 'azure-roulette', name: 'Azure Roulette' },
  { id: 'immersive-roulette-deluxe', name: 'Immersive Roulette' },
  { id: 'roulette-local-br', name: 'Roleta Localizada BR' },
  { id: 'private-roulette', name: 'Private Roulette' }
];

// Função para calcular padrões de sequência
function calculatePatterns(results) {
  if (!results || results.length < 2) {
    return {
      even: 0,    // Par
      odd: 0,      // Ímpar
      red: 0,      // Vermelho
      black: 0,    // Preto
      low: 0,      // 1-18
      high: 0      // 19-36
    };
  }
  
  const patterns = {
    even: 0,
    odd: 0,
    red: 0,
    black: 0,
    low: 0,
    high: 0
  };
  
  // Encontrar a última ocorrência de cada padrão
  for (let i = 1; i < results.length; i++) {
    const prev = results[i-1];
    const curr = results[i];
    
    // Verificar se os números são válidos
    if (prev.result_number === null || curr.result_number === null) continue;
    
    // Verificar pares/ímpares
    if (prev.result_number % 2 === 0 && curr.result_number % 2 === 0) {
      patterns.even = i;
    } else if (prev.result_number % 2 === 1 && curr.result_number % 2 === 1) {
      patterns.odd = i;
    }
    
    // Verificar cores
    if (prev.result_color === 'red' && curr.result_color === 'red') {
      patterns.red = i;
    } else if (prev.result_color === 'black' && curr.result_color === 'black') {
      patterns.black = i;
    }
    
    // Verificar faixas de números
    if (prev.result_number >= 1 && prev.result_number <= 18 && 
        curr.result_number >= 1 && curr.result_number <= 18) {
      patterns.low = i;
    } else if (prev.result_number >= 19 && prev.result_number <= 36 && 
               curr.result_number >= 19 && curr.result_number <= 36) {
      patterns.high = i;
    }
  }
  
  return patterns;
}

// Função auxiliar para obter o timestamp do último resultado de uma roleta
function getLastResultTimestamp(rouletteId) {
  return new Promise((resolve) => {
    dbLive.get(
      'SELECT created_at FROM roulette_history WHERE game_id = ? ORDER BY created_at DESC LIMIT 1',
      [rouletteId],
      (err, row) => {
        if (err) {
          console.error(`Erro ao buscar último timestamp para ${rouletteId}:`, err.message);
          resolve(0);
        } else {
          resolve(row ? new Date(row.created_at).getTime() : 0);
        }
      }
    );
  });
}

// Novo endpoint para obter dados dos cards
router.get('/cards', async (req, res) => {
  try {
    // Obter os timestamps dos últimos resultados de todas as roletas
    const rouletteTimestamps = await Promise.all(
      ROULETTES.map(async (roulette) => ({
        ...roulette,
        lastTimestamp: await getLastResultTimestamp(roulette.id).catch(() => 0)
      }))
    );
    
    // Encontrar a roleta com o resultado mais recente
    const mostRecentRoulette = rouletteTimestamps.reduce((prev, current) => 
      (prev.lastTimestamp > current.lastTimestamp) ? prev : current
    );
    
    // Calcular a diferença de tempo em relação a agora
    const now = Date.now();
    const timeDiff = now - mostRecentRoulette.lastTimestamp;
    
    // Considerar como "AGORA" apenas se o último resultado for nos últimos 60 segundos
    const activeRouletteId = timeDiff <= 60000 ? mostRecentRoulette.id : null;
    
    const promises = ROULETTES.map(roulette => {
      return new Promise((resolve) => {
        // Buscar os últimos 100 resultados da roleta
        dbLive.all(
          'SELECT result_number, result_color, created_at FROM roulette_history WHERE game_id = ? AND result_number IS NOT NULL ORDER BY created_at DESC LIMIT 100',
          [roulette.id],
          (err, results) => {
            if (err) {
              console.error(`Erro ao buscar histórico da ${roulette.name}:`, err);
              resolve({
                ...roulette,
                error: 'Erro ao carregar dados',
                isActive: false
              });
              return;
            }
            
            if (results.length === 0) {
              // Se não houver resultados ou ocorrer um erro, retornar dados padrão
              const defaultStats = {
                pair: 0,
                odd: 0,
                black: 0,
                red: 0,
                low: 0,
                high: 0
              };
              
              resolve({
                id: roulette.id,
                name: roulette.name,
                stats: defaultStats,
                lastUpdate: null,
                isActive: false,
                lastResults: []
              });
              return;
            }
            
            try {
              // Calcular padrões de sequência
              const patterns = calculatePatterns(results);
              const lastUpdate = new Date(results[0].created_at);
              
              // Verificar se esta é a roleta ativa (último resultado nos últimos 60 segundos)
              const isActive = roulette.id === activeRouletteId;
              
              // Obter os últimos 10 resultados para exibição
              const lastResults = results.slice(0, 10).map(r => ({
                number: r.result_number,
                color: r.result_color,
                timestamp: r.created_at
              }));
              
              // Formatar dados para o frontend
              resolve({
                id: roulette.id,
                name: roulette.name,
                stats: {
                  pair: patterns.even,     // 2 pares seguidos
                  odd: patterns.odd,       // 2 ímpares seguidos
                  black: patterns.black,   // 2 pretos seguidos
                  red: patterns.red,       // 2 vermelhos seguidos
                  low: patterns.low,       // 2 baixos seguidos (1-18)
                  high: patterns.high      // 2 altos seguidos (19-36)
                },
                lastUpdate: lastUpdate.toISOString(),
                isActive: isActive,
                lastResults: lastResults
              });
            } catch (error) {
              console.error(`Erro ao processar resultados da roleta ${roulette.id}:`, error);
              resolve({
                id: roulette.id,
                name: roulette.name,
                stats: {
                  pair: 0,
                  odd: 0,
                  black: 0,
                  red: 0,
                  low: 0,
                  high: 0
                },
                lastUpdate: null,
                isActive: false,
                lastResults: []
              });
            }
          }
        );
      });
    });
    
    // Retornar dados de todas as roletas
    const cards = await Promise.all(promises);
    
    res.json({
      success: true,
      data: cards,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao processar dados das roletas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar dados das roletas',
      details: error.message
    });
  }
});

// GET /api/roulette/history?game_id=&provider=&limit=&offset=&from=&to=
router.get('/history', async (req, res) => {
  try {
    const {
      game_id,
      provider,
      limit = 50,
      offset = 0,
      from,
      to
    } = req.query;
    let params = [];
    let where = [];
    if (game_id) {
      where.push('game_id = ?');
      params.push(game_id);
    }
    if (provider) {
      where.push('provider = ?');
      params.push(provider);
    }
    if (from) {
      where.push('timestamp >= ?');
      params.push(from);
    }
    if (to) {
      where.push('timestamp <= ?');
      params.push(to);
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const sql = `SELECT * FROM roulette_history ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit));
    params.push(Number(offset));
    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao consultar histórico', details: err.message });
      }
      res.json({ count: rows.length, results: rows });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// Endpoint para obter o status do serviço de coleta
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    roulettes: ROULETTES.map(r => ({
      id: r.id,
      name: r.name,
      lastUpdated: new Date().toISOString()
    }))
  });
});

module.exports = router;
