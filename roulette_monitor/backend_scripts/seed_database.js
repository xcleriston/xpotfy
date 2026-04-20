const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Configurações
const DB_PATH = path.join(__dirname, '..', 'data', 'roulette.db');
const NUM_RECORDS_PER_GAME = 100; // Número de registros por roleta

// Lista de roletas
const ROULETTES = [
  { id: 'mega-roulette---brazilian', name: 'Brazilian Mega Roulette', provider: 'pragmatic' },
  { id: 'roleta-brasileira', name: 'Roleta Brasileira', provider: 'playtech' },
  { id: 'roulette', name: 'European Roulette', provider: 'evolution' },
  { id: 'speed-roulette', name: 'Speed Roulette', provider: 'evolution' },
  { id: 'french-roulette', name: 'French Roulette', provider: 'evolution' },
  { id: 'american-roulette', name: 'American Roulette', provider: 'evolution' },
  { id: 'azure-roulette', name: 'Azure Roulette', provider: 'pragmatic' },
  { id: 'immersive-roulette-deluxe', name: 'Immersive Roulette', provider: 'evolution' },
  { id: 'roulette-local-br', name: 'Roleta Localizada BR', provider: 'pragmatic' },
  { id: 'private-roulette', name: 'Private Roulette', provider: 'evolution' }
];

// Cores possíveis
const COLORS = ['red', 'black'];

// Função para gerar um número aleatório de roleta (0-36)
function generateRouletteNumber() {
  return Math.floor(Math.random() * 37);
}

// Função para determinar a cor com base no número
function getColor(number) {
  if (number === 0) return 'green'; // Zero é verde
  
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number) ? 'red' : 'black';
}

// Função para gerar um timestamp aleatório nos últimos 7 dias
function generateRandomTimestamp(daysAgo = 7) {
  const now = new Date();
  const past = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

// Função para criar registros de exemplo para uma roleta
function generateRecordsForGame(game, count) {
  const records = [];
  const now = new Date();
  
  // Garantir que o último resultado seja diferente para cada tipo
  const lastResults = {
    even: null,
    odd: null,
    red: null,
    black: null,
    low: null,
    high: null
  };
  
  for (let i = 0; i < count; i++) {
    // Gerar um número aleatório
    const number = generateRouletteNumber();
    const color = getColor(number);
    
    // Criar um timestamp sequencial (mais recente primeiro)
    const timestamp = new Date(now.getTime() - (count - i) * 1000 * 60); // 1 minuto entre cada rodada
    
    // Determinar características do número
    const isEven = number !== 0 && number % 2 === 0;
    const isLow = number >= 1 && number <= 18;
    
    // Atualizar os últimos resultados para cada tipo
    if (isEven) lastResults.even = number;
    else if (number !== 0) lastResults.odd = number;
    
    if (color === 'red') lastResults.red = number;
    else if (color === 'black') lastResults.black = number;
    
    if (isLow) lastResults.low = number;
    else if (number > 0) lastResults.high = number;
    
    // Criar o registro
    const record = {
      provider: game.provider,
      game_id: game.id,
      game_name: game.name,
      result_number: number,
      result_color: color,
      round_id: `R${1000000 + i}-${Date.now()}`,
      timestamp: timestamp.toISOString(),
      raw_data: JSON.stringify({
        number,
        color,
        isEven,
        isLow,
        timestamp: timestamp.toISOString()
      }),
      created_at: timestamp.toISOString()
    };
    
    records.push(record);
  }
  
  return records;
}

// Função para inserir registros no banco de dados
function insertRecords(db, records) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          return reject(beginErr);
        }
        
        const stmt = db.prepare(`
          INSERT INTO roulette_history 
          (provider, game_id, game_name, result_number, result_color, round_id, timestamp, raw_data, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let inserted = 0;
        const total = records.length;
        let hasError = false;
        
        const finalize = (err) => {
          stmt.finalize(() => {
            if (err) {
              return db.run('ROLLBACK', () => reject(err));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return reject(commitErr);
              }
              console.log(`Inseridos ${inserted} registros com sucesso!`);
              resolve(inserted);
            });
          });
        };
        
        if (total === 0) {
          return finalize();
        }
        
        records.forEach((record, index) => {
          if (hasError) return;
          
          stmt.run(
            record.provider,
            record.game_id,
            record.game_name,
            record.result_number,
            record.result_color,
            record.round_id,
            record.timestamp,
            record.raw_data,
            record.created_at,
            (err) => {
              if (hasError) return;
              
              if (err) {
                hasError = true;
                console.error('Erro ao inserir registro:', err);
                return finalize(err);
              }
              
              inserted++;
              
              if (inserted % 50 === 0 || inserted === total) {
                console.log(`Inseridos ${inserted} de ${total} registros...`);
              }
              
              if (inserted === total) {
                finalize();
              }
            }
          );
        });
      });
    });
  });
}

// Função principal
async function main() {
  console.log('Iniciando a geração de dados de exemplo...');
  
  // Verificar se o diretório de dados existe
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    console.log(`Criando diretório de dados: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Conectar ao banco de dados
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    // Criar a tabela se não existir
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS roulette_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          provider TEXT NOT NULL,
          game_id TEXT NOT NULL,
          game_name TEXT,
          result_number INTEGER,
          result_color TEXT,
          round_id TEXT NOT NULL,
          timestamp DATETIME,
          raw_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(game_id, round_id) ON CONFLICT IGNORE
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Tabela roulette_history verificada/criada com sucesso!');
    
    // Limpar dados existentes
    console.log('Limpando dados existentes...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM roulette_history', (err) => {
        if (err) reject(err);
        else {
          console.log('Dados existentes removidos.');
          resolve();
        }
      });
    });
    
    // Gerar e inserir dados para cada roleta
    for (const game of ROULETTES) {
      console.log(`\nGerando ${NUM_RECORDS_PER_GAME} registros para ${game.name}...`);
      const records = generateRecordsForGame(game, NUM_RECORDS_PER_GAME);
      console.log(`Inserindo registros no banco de dados...`);
      await insertRecords(db, records);
      console.log(`Dados para ${game.name} inseridos com sucesso!`);
    }
    
    console.log('\nTodos os dados foram inseridos com sucesso!');
    
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    db.close();
  }
}

// Executar o script
main().catch(console.error);
