import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RouletteDashboard from '../roulette/RouletteDashboard';
import { FiLogOut } from 'react-icons/fi';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Cabeçalho */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Monitor de Roletas</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-300">
                {user?.username || 'Usuário'}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 rounded-md hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Sair"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <RouletteDashboard />
      </main>
    </div>
  );
};

export default Dashboard;
