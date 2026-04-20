import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RouletteDashboard from '../roulette/RouletteDashboard';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setUser(response.data.user);
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
        setError('Falha ao carregar os dados do usuário');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="text-xl">Carregando dados do usuário...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-4 text-red-600 bg-red-100 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabeçalho */}
      <header className="bg-white shadow">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Olá, {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação */}
      <nav className="bg-white shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['dashboard', 'estatísticas', 'configurações', 'conta'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="px-4 py-6 bg-white rounded-lg shadow sm:px-6">
          <h2 className="text-lg font-medium leading-6 text-gray-900">
            Bem-vindo ao Painel de Controle
          </h2>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Aqui você pode gerenciar suas configurações e visualizar estatísticas.
            </p>
          </div>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Saldo Atual', value: 'R$ 1.234,56', change: '+12%', trend: 'up' },
            { title: 'Total de Apostas', value: '1.234', change: '+5%', trend: 'up' },
            { title: 'Taxa de Acerto', value: '68%', change: '+2%', trend: 'up' },
            { title: 'Lucro Total', value: 'R$ 8.765,43', change: '+23%', trend: 'up' },
          ].map((card, index) => (
            <div key={index} className="px-4 py-5 overflow-hidden bg-white rounded-lg shadow sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{card.value}</dd>
              <div className={`mt-1 text-sm ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {card.change} em relação ao mês passado
              </div>
            </div>
          ))}
        </div>

        {/* Tabela de transações recentes */}
        <div className="mt-8">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Transações Recentes</h2>
          <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {[
                { id: 1, date: '2023-06-15', description: 'Depósito', amount: 'R$ 1.000,00', status: 'Concluído' },
                { id: 2, date: '2023-06-14', description: 'Saque', amount: '-R$ 500,00', status: 'Pendente' },
                { id: 3, date: '2023-06-13', description: 'Aposta - Roleta', amount: '-R$ 100,00', status: 'Concluído' },
                { id: 4, date: '2023-06-12', description: 'Ganho - Roleta', amount: 'R$ 250,00', status: 'Concluído' },
              ].map((transaction) => (
                <li key={transaction.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {transaction.description}
                      </p>
                      <p className="flex items-center mt-1 text-sm text-gray-500">
                        {transaction.date}
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900">
                      {transaction.amount}
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="bg-white">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-500">
            &copy; {new Date().getFullYear()} Seu Nome. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
