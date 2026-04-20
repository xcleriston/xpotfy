/**
 * Popular Markets Configuration
 * Predefined markets for quick selection
 */

export interface PopularMarket {
  id: string;
  name: string;
  description: string;
  category: string;
  timeframe: string;
  isActive: boolean;
}

export const POPULAR_MARKETS: PopularMarket[] = [
  {
    id: 'btc-5m',
    name: 'BTC 5 min',
    description: 'Bitcoin price in 5 minutes',
    category: 'Crypto',
    timeframe: '5m',
    isActive: true,
  },
  {
    id: 'btc-1h',
    name: 'BTC 1 hour',
    description: 'Bitcoin price in 1 hour',
    category: 'Crypto',
    timeframe: '1h',
    isActive: true,
  },
  {
    id: 'btc-24h',
    name: 'BTC 24 hours',
    description: 'Bitcoin price in 24 hours',
    category: 'Crypto',
    timeframe: '24h',
    isActive: true,
  },
  {
    id: 'eth-5m',
    name: 'ETH 5 min',
    description: 'Ethereum price in 5 minutes',
    category: 'Crypto',
    timeframe: '5m',
    isActive: true,
  },
  {
    id: 'eth-1h',
    name: 'ETH 1 hour',
    description: 'Ethereum price in 1 hour',
    category: 'Crypto',
    timeframe: '1h',
    isActive: true,
  },
  {
    id: 'sol-5m',
    name: 'SOL 5 min',
    description: 'Solana price in 5 minutes',
    category: 'Crypto',
    timeframe: '5m',
    isActive: true,
  },
  {
    id: 'sol-1h',
    name: 'SOL 1 hour',
    description: 'Solana price in 1 hour',
    category: 'Crypto',
    timeframe: '1h',
    isActive: true,
  },
];

export function getMarketById(id: string): PopularMarket | undefined {
  return POPULAR_MARKETS.find(m => m.id === id);
}

export function getMarketsByCategory(category: string): PopularMarket[] {
  return POPULAR_MARKETS.filter(m => m.category === category);
}

export function getActiveMarkets(): PopularMarket[] {
  return POPULAR_MARKETS.filter(m => m.isActive);
}

export function getCategories(): string[] {
  const categories = new Set(POPULAR_MARKETS.map(m => m.category));
  return Array.from(categories);
}
