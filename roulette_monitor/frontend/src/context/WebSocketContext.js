import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if we have a user
    if (!user) return;

    // WebSocket server URL - adjust the port if needed
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Send authentication token if available
      if (user.token) {
        ws.send(JSON.stringify({
          type: 'auth',
          token: user.token
        }));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        setSocket(new WebSocket(wsUrl));
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    // Cleanup function
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
