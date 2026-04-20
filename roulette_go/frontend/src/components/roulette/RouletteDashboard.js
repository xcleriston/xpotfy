import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RouletteCard from './RouletteCard';

const ROULETTE_GAMES = [
  { game_id: 'mega-roulette---brazilian', name: 'Brazilian Mega Roulette (Pragmatic)' },
  { game_id: 'roleta-brasileira', name: 'Roleta Brasileira (Playtech)' },
  { game_id: 'roulette', name: 'European Roulette (Pragmatic)' },
  { game_id: 'speed-roulette', name: 'Speed Roulette (Pragmatic)' },
  { game_id: 'french-roulette', name: 'French Roulette (Pragmatic)' },
  { game_id: 'american-roulette', name: 'American Roulette (Pragmatic)' },
  { game_id: 'azure-roulette', name: 'Azure Roulette (Pragmatic)' },
  { game_id: 'immersive-roulette-deluxe', name: 'Immersive Roulette Deluxe (Pragmatic)' },
  { game_id: 'roulette-local-br', name: 'Roleta Brasileira (Mesa Localizada)' },
  { game_id: 'private-roulette', name: 'Private Roulette (Pragmatic)' },
];

const getStats = (history) => {
  // Função para calcular quantas rodadas atrás ocorreu o último par de cada padrão
  const findLastStreak = (predicate) => {
    let streak = 0;
    for (let i = 1; i < history.length; i++) {
      if (predicate(history[i], history[i-1])) {
        return i-1;
      }
    }
    return null;
  };

  const isEven = (n) => n !== null && n % 2 === 0;
  const isOdd = (n) => n !== null && n % 2 === 1;
  const isBlack = (c) => c === 'black';
  const isRed = (c) => c === 'red';
  const isLow = (n) => n !== null && n >= 1 && n <= 18;
  const isHigh = (n) => n !== null && n >= 19 && n <= 36;

  return {
    pair: findLastStreak((a, b) => isEven(a.result_number) && isEven(b.result_number)),
    odd: findLastStreak((a, b) => isOdd(a.result_number) && isOdd(b.result_number)),
    black: findLastStreak((a, b) => isBlack(a.result_color) && isBlack(b.result_color)),
    red: findLastStreak((a, b) => isRed(a.result_color) && isRed(b.result_color)),
    low: findLastStreak((a, b) => isLow(a.result_number) && isLow(b.result_number)),
    high: findLastStreak((a, b) => isHigh(a.result_number) && isHigh(b.result_number)),
  };
};

const RouletteDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.all(
        ROULETTE_GAMES.map(async (game) => {
          try {
            const res = await axios.get(`/api/roulette/history`, {
              params: { game_id: game.game_id, limit: 50 },
            });
            return {
              ...game,
              history: res.data.results || [],
            };
          } catch (err) {
            return { ...game, history: [] };
          }
        })
      );
      setData(results);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-center p-10">Carregando...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-6">
      {data.map((game, idx) => (
        <RouletteCard
          key={game.game_id}
          name={game.name}
          stats={getStats(game.history)}
        />
      ))}
    </div>
  );
};

export default RouletteDashboard;
