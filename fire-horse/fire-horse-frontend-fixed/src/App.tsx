import React from 'react';
import { BetfairProvider } from './contexts/BetfairContext';
import BetfairLogin from './components/BetfairLogin';
import BetfairDashboard from './components/BetfairDashboard';

const App: React.FC = () => {
  return (
    <BetfairProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Fire Horse - Betfair Integration
            </h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <BetfairContent />
          </div>
        </main>
      </div>
    </BetfairProvider>
  );
};

const BetfairContent: React.FC = () => {
  const { isAuthenticated } = useBetfair();
  
  if (!isAuthenticated) {
    return <BetfairLogin />;
  }
  
  return <BetfairDashboard />;
};

// This is a workaround to use the hook in a component that's not a direct child of the provider
const useBetfair = (): {
  isAuthenticated: boolean;
  accountDetails: any;
  accountFunds: any;
  events: any[];
  markets: Record<string, any>;
  marketBooks: Record<string, any>;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, appKey: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
} => {
  const context = React.useContext(require('./contexts/BetfairContext').BetfairContext);
  if (context === undefined) {
    throw new Error('useBetfair must be used within a BetfairProvider');
  }
  return context;
};

export default App;
