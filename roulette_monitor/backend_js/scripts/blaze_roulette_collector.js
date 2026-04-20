// Script para coletar histórico das roletas na Blaze
// Prioridade: Brazilian Mega Roulette (Pragmatic) e Roleta Brasileira (Playtech)
// Uso: node scripts/blaze_roulette_collector.js <TOKEN>

const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../..', 'data', 'roulette.db');
const db = new sqlite3.Database(DB_PATH);

const GAMES = [
  {
    provider: 'pragmatic',
    game_id: 'mega-roulette---brazilian',
    game_name: 'Brazilian Mega Roulette',
  },
  {
    provider: 'playtech',
    game_id: 'roleta-brasileira',
    game_name: 'Roleta Brasileira',
  }
];

async function fetchHistory(game, token) {
  // Endpoint padrão da Blaze para histórico pode variar; este é um exemplo comum:
  // https://blaze.bet.br/api/roulette_games/history?game_id=<id>&page=<n>
  // Caso não funcione, adaptar para o endpoint correto identificado via network inspector
  let page = 1;
  let results = [];
  let keepFetching = true;

  while (keepFetching) {
    const url = `https://blaze.bet.br/api/roulette_games/history?game_id=${game.game_id}&page=${page}`;
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      if (response.data && Array.isArray(response.data.records) && response.data.records.length > 0) {
        results = results.concat(response.data.records);
        page++;
        if (response.data.records.length < 50) keepFetching = false; // Última página
      } else {
        keepFetching = false;
      }
    } catch (err) {
      console.error(`Erro ao buscar histórico para ${game.game_name}:`, err.response?.data || err.message);
      keepFetching = false;
    }
  }
  return results;
}

function saveHistory(game, records) {
  const stmt = db.prepare(`
    INSERT INTO roulette_history (provider, game_id, game_name, result_number, result_color, round_id, timestamp, raw_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(game_id, round_id) DO NOTHING
  `);
  for (const record of records) {
    // Adapte os campos conforme o formato real retornado pela Blaze
    stmt.run(
      game.provider,
      game.game_id,
      game.game_name,
      record.result_number || record.result || null,
      record.result_color || record.color || null,
      record.round_id || record.id || null,
      record.timestamp || record.time || new Date().toISOString(),
      JSON.stringify(record)
    );
  }
  stmt.finalize();
}

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('Uso: node scripts/blaze_roulette_collector.js <TOKEN>');
    process.exit(1);
  }

  for (const game of GAMES) {
    console.log(`Buscando histórico para ${game.game_name}...`);
    const records = await fetchHistory(game, token);
    console.log(`Encontrados ${records.length} registros para ${game.game_name}`);
    saveHistory(game, records);
  }
  console.log('Coleta concluída.');
  db.close();
}

main();
