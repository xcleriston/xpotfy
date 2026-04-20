import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RouletteCardV2 from './RouletteCardV2';

// Configurações
const API_BASE_URL = 'http://localhost:8001/api';
const UPDATE_INTERVAL = 10000; // 10 segundos

// Dados de exemplo para as roletas (serão substituídos pelos dados reais da API)
const SAMPLE_ROULETTES = [
  {
    id: 1,
    name: 'Roleta 1',
    status: 'Online',
    lastUpdate: new Date().toISOString(),
    stats: {
      red: 0,
      black: 0,
      pair: 0,
      odd: 0,
      low: 0,
      high: 0
    }
  },
  // Adicione mais roletas de exemplo conforme necessário
];

const RouletteDashboard = () => {
  const [roulettes, setRoulettes] = useState(SAMPLE_ROULETTES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Função para buscar dados das roletas
  const fetchRouletteData = useCallback(async () => {
    try {
      // Primeiro tenta buscar da API
      const response = await axios.get(`${API_BASE_URL}/roulette/cards`);
      
      if (response.data && response.data.success) {
        // Se a API retornar dados, usa eles
        setRoulettes(response.data.data || SAMPLE_ROULETTES);
      } else {
        // Se a API não retornar dados, usa os dados de exemplo
        setRoulettes(SAMPLE_ROULETTES);
      }
      
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados das roletas:', err);
      
      // Em caso de erro, usa os dados de exemplo
      setRoulettes(SAMPLE_ROULETTES);
      setError('Usando dados de exemplo. Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito para buscar dados iniciais e configurar atualização periódica
  useEffect(() => {
    // Buscar dados imediatamente
    fetchRouletteData();

    // Configurar atualização periódica
    const intervalId = setInterval(fetchRouletteData, UPDATE_INTERVAL);

    // Limpar intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [fetchRouletteData]);

  // Função para formatar a data/hora da última atualização
  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  // Renderização do componente
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Monitor de Roletas</h1>
            <p className="text-gray-300 mt-1">Acompanhe em tempo real os resultados das roletas</p>
          </div>
          <div className="mt-2 md:mt-0 text-sm text-gray-300 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <span className="font-medium">Atualizado:</span> {formatLastUpdated(lastUpdated)}
            {loading && <span className="ml-2 text-yellow-400">Atualizando...</span>}
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-yellow-900 bg-opacity-20 border-l-4 border-yellow-500 p-4 mb-6 rounded-r">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Roletas */}
        {loading && roulettes.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 animate-pulse h-72">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-6 mx-auto"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="h-4 bg-gray-700 rounded w-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {roulettes.map((roulette) => {
              // Verifica se esta roleta está ativa (tem a propriedade isActive definida como true)
              const isActive = roulette.isActive === true;
              
              return (
                <RouletteCardV2
                  key={roulette.id}
                  name={roulette.name}
                  stats={roulette.stats || roulette} // Compatibilidade com formato antigo
                  isActive={isActive}
                />
              );
            })}
          </div>
        )}
        
        {/* Rodapé */}
        <div className="mt-10 text-center text-gray-400 text-sm">
          <p>Atualização automática a cada 10 segundos</p>
          <p className="mt-1"> {new Date().getFullYear()} Monitor de Roletas - Todos os direitos reservados</p>
        </div>

        {/* Mensagem quando não há roletas */}
        {!loading && roulettes.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma roleta encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">Não foi possível carregar os dados das roletas no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouletteDashboard;
