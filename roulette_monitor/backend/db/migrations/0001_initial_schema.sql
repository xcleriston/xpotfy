-- Create roulette_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS roulette_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  result_number INTEGER NOT NULL,
  result_color TEXT,
  round_id TEXT,
  timestamp DATETIME NOT NULL,
  raw_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create pattern tracking table
CREATE TABLE IF NOT EXISTS roulette_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  history_id INTEGER NOT NULL,
  pattern_type TEXT NOT NULL,  -- 'even', 'odd', 'red', 'black', 'high', 'low', 'dozen_1', 'dozen_2', 'dozen_3', 'column_1', 'column_2', 'column_3'
  pattern_count INTEGER NOT NULL,  -- Number of consecutive occurrences
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (history_id) REFERENCES roulette_history(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_roulette_history_game_time ON roulette_history (game_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_roulette_history_number ON roulette_history (result_number);
CREATE INDEX IF NOT EXISTS idx_roulette_patterns_type ON roulette_patterns (pattern_type, pattern_count);
