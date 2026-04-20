const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

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

module.exports = router;
