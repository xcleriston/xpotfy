import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RouletteCard = ({ name, stats, isActive = false }) => {
  // Função para determinar a cor do texto com base no valor
  const getTextColor = (value, isActiveValue = false) => {
    if (isActiveValue) return 'text-green-600 font-bold';
    if (value === 0) return 'text-green-600 font-bold';
    if (value <= 5) return 'text-yellow-600 font-medium';
    return 'text-gray-700';
  };

  // Função para formatar o valor exibido
  const formatValue = (value, isActiveValue = false) => {
    if (isActiveValue) return 'AGORA';
    if (value === 0) return 'Nunca';
    if (value === 1) return '1 vez atrás';
    return `${value} vezes atrás`;
  };

  // Função para formatar a data de atualização
  const formatLastUpdate = (dateString) => {
    if (!dateString) return 'Nunca';
    try {
      return formatDistanceToNow(parseISO(dateString), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (e) {
      return 'Agora';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 w-full max-w-xs mx-auto border-2 ${isActive ? 'border-green-500' : 'border-transparent'}`}>
      {/* Cabeçalho do Card */}
      <div className={`${isActive ? 'bg-gradient-to-r from-green-700 to-green-800' : 'bg-gradient-to-r from-gray-800 to-gray-900'} text-white p-3 text-center relative`}>
        {isActive && (
          <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded-br-md">
            AO VIVO
          </div>
        )}
        <h3 className="text-lg font-bold">{name}</h3>
        <div className="text-xs opacity-80">
          Atualizado: {stats.lastUpdate ? formatLastUpdate(stats.lastUpdate) : 'Agora'}
        </div>
      </div>
      
      {/* Corpo do Card */}
      <div className="p-4">
        <table className="w-full text-sm">
          <tbody>
            {/* 2 Vermelhos seguidos */}
            <tr>
              <td className="py-2 font-medium text-gray-300">2 Vermelhos seguidos</td>
              <td className={`text-right font-mono ${getTextColor(stats.red, isActive && stats.red === 0)}`}>
                {formatValue(stats.red || 0, isActive && stats.red === 0)}
              </td>
            </tr>
            
            {/* 2 Pretos seguidos */}
            <tr>
              <td className="py-2 font-medium text-gray-300">2 Pretos seguidos</td>
              <td className={`text-right font-mono ${getTextColor(stats.black, isActive && stats.black === 0)}`}>
                {formatValue(stats.black || 0, isActive && stats.black === 0)}
              </td>
            </tr>
            
            {/* 2 Pares seguidos */}
            <tr>
              <td className="py-2 font-medium text-gray-300">2 Pares seguidos</td>
              <td className={`text-right font-mono ${getTextColor(stats.pair, isActive && stats.pair === 0)}`}>
                {formatValue(stats.pair || 0, isActive && stats.pair === 0)}
              </td>
            </tr>
            
            {/* 2 Ímpares seguidos */}
            <tr>
              <td className="py-2 font-medium text-gray-300">2 Ímpares seguidos</td>
              <td className={`text-right font-mono ${getTextColor(stats.odd, isActive && stats.odd === 0)}`}>
                {formatValue(stats.odd || 0, isActive && stats.odd === 0)}
              </td>
            </tr>
            
            {/* 2 Baixos (1-18) seguidos */}
            <tr>
              <td className="py-2 font-medium text-gray-300">2 Baixos (1-18)</td>
              <td className={`text-right font-mono ${getTextColor(stats.low, isActive && stats.low === 0)}`}>
                {formatValue(stats.low || 0, isActive && stats.low === 0)}
              </td>
            </tr>
            
            {/* 2 Altos (19-36) seguidos */}
            <tr>
              <td className="py-2 font-medium text-gray-300">2 Altos (19-36)</td>
              <td className={`text-right font-mono ${getTextColor(stats.high, isActive && stats.high === 0)}`}>
                {formatValue(stats.high || 0, isActive && stats.high === 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Rodapé */}
      <div className="bg-gray-900 px-4 py-2 text-xs text-center text-gray-400 border-t border-gray-700">
        Atualização em tempo real • {isActive ? 'Ativo agora' : 'Aguardando'}
      </div>
    </div>
  );
};

export default RouletteCard;
