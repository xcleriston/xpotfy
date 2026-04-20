import React, { createContext, useContext, useEffect, useState } from 'react';
import { betfairApi } from '../services/betfairApi';
import { BetfairAccountDetails, BetfairAccountFunds, Event, MarketBook, MarketCatalogue } from '../types/betfair';

interface BetfairContextType {
  isAuthenticated: boolean;
  accountDetails: BetfairAccountDetails | null;
  accountFunds: BetfairAccountFunds | null;
  events: Event[];
  markets: Record<string, MarketCatalogue>;
  marketBooks: Record<string, MarketBook>;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, appKey: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const BetfairContext = createContext<BetfairContextType | undefined>(undefined);

export const BetfairProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accountDetails, setAccountDetails] = useState<BetfairAccountDetails | null>(null);
  const [accountFunds, setAccountFunds] = useState<BetfairAccountFunds | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [markets, setMarkets] = useState<Record<string, MarketCatalogue>>({});
  const [marketBooks, setMarketBooks] = useState<Record<string, MarketBook>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string, appKey: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you would validate these values
      // For Vite, we need to restart the dev server to pick up new env vars
      // So we'll store them in localStorage for this demo
      localStorage.setItem('betfair_username', username);
      localStorage.setItem('betfair_password', password);
      localStorage.setItem('betfair_app_key', appKey);
      
      // Test authentication
      await betfairApi.getAccountDetails();
      
      setIsAuthenticated(true);
      await refreshData();
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to authenticate with Betfair API. Please check your credentials.');
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear all state
    setIsAuthenticated(false);
    setAccountDetails(null);
    setAccountFunds(null);
    setEvents([]);
    setMarkets({});
    setMarketBooks({});
    
    // In a real app, you might want to clear any stored tokens
    // and redirect to login
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch account details and funds in parallel
      const [details, funds, marketData] = await Promise.all([
        betfairApi.getAccountDetails(),
        betfairApi.getAccountFunds(),
        betfairApi.getHorseRacingMarkets()
      ]);
      
      setAccountDetails(details);
      setAccountFunds(funds);
      setEvents(marketData.events);
      setMarkets(marketData.markets);
      setMarketBooks(marketData.marketBooks);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to fetch data from Betfair API');
      // On error, we might want to log the user out
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    // In a real app, you might check for existing session/token here
    // and automatically log the user in
  }, []);

  return (
    <BetfairContext.Provider
      value={{
        isAuthenticated,
        accountDetails,
        accountFunds,
        events,
        markets,
        marketBooks,
        loading,
        error,
        login,
        logout,
        refreshData,
      }}
    >
      {children}
    </BetfairContext.Provider>
  );
};

export const useBetfair = (): BetfairContextType => {
  const context = useContext(BetfairContext);
  if (context === undefined) {
    throw new Error('useBetfair must be used within a BetfairProvider');
  }
  return context;
};
