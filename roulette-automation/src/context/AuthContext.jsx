import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Configuração base do axios
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Verifica se o usuário está autenticado no carregamento inicial
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Falha na verificação de autenticação:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (username, password, rememberMe = false) => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.post('/api/auth/login', { 
        username, 
        password,
        rememberMe 
      });
      
      const { token, user: userData } = response.data;
      
      // Armazena o token apenas se rememberMe for true
      if (rememberMe) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        // Usa sessionStorage para armazenamento temporário
        sessionStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      setUser(userData);
      
      // Redireciona com base no papel do usuário
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Função de registro
  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      
      const response = await axios.post('/api/auth/register', {
        username: userData.username,
        email: userData.email,
        password: userData.password
      });
      
      return { 
        success: true,
        message: response.data.message || 'Conta criada com sucesso!'
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Falha ao criar a conta. Por favor, tente novamente.';
      setError(message);
      return { 
        success: false, 
        error: message 
      };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  // Atualiza os dados do usuário
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  // Valor do contexto
  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    setError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
