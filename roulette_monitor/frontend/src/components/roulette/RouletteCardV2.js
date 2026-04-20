import React, { useEffect, useState, useContext } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

const RouletteCardV2 = ({ name, stats: initialStats, isActive = false, rouletteId }) => {
  const [stats, setStats] = useState(initialStats);
  
  // Função para determinar a cor de fundo com base no risco
  const getRiskColor = (value) => {
    if (value === 0) return 'bg-green-900/30 border-green-500';
    if (value <= 2) return 'bg-gray-800/50 border-gray-600';
    if (value <= 4) return 'bg-blue-900/30 border-blue-600';
    if (value <= 7) return 'bg-yellow-900/30 border-yellow-600';
    if (value <= 10) return 'bg-orange-900/30 border-orange-600';
    if (value <= 15) return 'bg-orange-900/50 border-orange-500';
    return 'bg-red-900/50 border-red-500';
  };

  // Função para determinar a cor do texto com base no valor
  const getTextColor = (value) => {
    if (value === 0) return 'text-green-400';
    if (value <= 2) return 'text-blue-300';
    if (value <= 4) return 'text-blue-400';
    if (value <= 7) return 'text-yellow-400';
    if (value <= 10) return 'text-orange-400';
    if (value <= 15) return 'text-orange-300';
    return 'text-red-400';
  };

  // Get the last 10 results or an empty array if not available
  const lastResults = stats.lastResults || [];
  
  // Function to determine the color of each result number
  const getNumberColor = (number) => {
    if (number === 0) return 'bg-green-600';
    if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)) {
      return 'bg-red-600';
    }
    return 'bg-gray-800';
  };

  const { socket } = useWebSocket();

  // Efeito para escutar atualizações via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleRouletteUpdate = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'roulette_update' && data.data.rouletteId === rouletteId) {
          // Atualizar os contadores de sequência
          setStats(prevStats => ({
            ...prevStats,
            red: data.data.patterns.red || 0,
            black: data.data.patterns.black || 0,
            pair: data.data.patterns.even || 0,
            odd: data.data.patterns.odd || 0,
            low: data.data.patterns.low || 0,
            high: data.data.patterns.high || 0
          }));
          
          // Atualizar os últimos resultados
          if (data.data.result) {
            setLastResults(prev => {
              const newResults = [data.data.result.number, ...prev];
              return newResults.slice(0, 10); // Manter apenas os 10 últimos
            });
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    socket.addEventListener('message', handleRouletteUpdate);
    
    // Limpar ao desmontar
    return () => {
      socket.removeEventListener('message', handleRouletteUpdate);
    };
  }, [socket, rouletteId]);

  return (
    <div className={`bg-gray-900 rounded-lg border ${isActive ? 'border-green-500' : 'border-gray-700'} overflow-hidden w-full max-w-xs mx-auto`}>
      {/* Cabeçalho do Card */}
      <div className={`${isActive ? 'bg-green-900' : 'bg-gray-800'} p-2 text-center`}>
        <h3 className="text-white font-medium">{name}</h3>
        {isActive && (
          <div className="text-green-400 text-xs font-bold mt-1">
            RODADA ATIVA
          </div>
        )}
      </div>
      
      {/* Últimos Resultados */}
      <div className="bg-gray-800 p-2 border-b border-gray-700">
        <div className="flex justify-center space-x-1 overflow-x-auto py-1">
          {lastResults.length > 0 ? (
            lastResults.map((result, index) => (
              <div 
                key={index} 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getNumberColor(result)}`}
                title={`Número ${result}`}
              >
                {result}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-xs">Aguardando dados...</div>
          )}
        </div>
      </div>
      
      {/* Corpo do Card */}
      <div className="p-2 space-y-1">
        {/* 2 Vermelhos seguidos */}
        <div className={`p-2 rounded ${getRiskColor(stats.red || 0)}`}>
          <div className="text-center">
            <span className={`text-sm font-mono font-bold ${getTextColor(stats.red || 0)}`}>
              {stats.red || 0} VERMELHO
            </span>
          </div>
        </div>
        
        {/* 2 Pretos seguidos */}
        <div className={`p-2 rounded ${getRiskColor(stats.black || 0)}`}>
          <div className="text-center">
            <span className={`text-sm font-mono font-bold ${getTextColor(stats.black || 0)}`}>
              {stats.black || 0} PRETO
            </span>
          </div>
        </div>
        
        {/* 2 Pares seguidos */}
        <div className={`p-2 rounded ${getRiskColor(stats.pair || 0)}`}>
          <div className="text-center">
            <span className={`text-sm font-mono font-bold ${getTextColor(stats.pair || 0)}`}>
              {stats.pair || 0} PAR
            </span>
          </div>
        </div>
        
        {/* 2 Ímpares seguidos */}
        <div className={`p-2 rounded ${getRiskColor(stats.odd || 0)}`}>
          <div className="text-center">
            <span className={`text-sm font-mono font-bold ${getTextColor(stats.odd || 0)}`}>
              {stats.odd || 0} ÍMPAR
            </span>
          </div>
        </div>
        
        {/* 2 Baixos (1-18) seguidos */}
        <div className={`p-2 rounded ${getRiskColor(stats.low || 0)}`}>
          <div className="text-center">
            <span className={`text-sm font-mono font-bold ${getTextColor(stats.low || 0)}`}>
              {stats.low || 0} BAIXO
            </span>
          </div>
        </div>
        
        {/* 2 Altos (19-36) seguidos */}
        <div className={`p-2 rounded ${getRiskColor(stats.high || 0)}`}>
          <div className="text-center">
            <span className={`text-sm font-mono font-bold ${getTextColor(stats.high || 0)}`}>
              {stats.high || 0} ALTO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouletteCardV2;
