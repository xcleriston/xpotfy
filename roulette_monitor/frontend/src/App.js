import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import AppRouter from './AppRouter';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AuthProvider>
        <WebSocketProvider>
          <AppRouter />
        </WebSocketProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
