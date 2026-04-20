/**
 * Polymarket API Integration
 * Connects to Polymarket API to fetch real market data and execute trades
 */

import axios from 'axios';

interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  outcomes: string[];
  tokens: {
    [outcome: string]: {
      token_id: string;
      price: number;
      liquidity: number;
    };
  };
  end_date: string;
  volume: number;
  liquidity: number;
}

interface PolymarketOrderBook {
  market_id: string;
  outcome: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  last_price: number;
  timestamp: number;
}

interface PolymarketTradeRequest {
  market_id: string;
  outcome: string;
  type: 'BUY' | 'SELL';
  size: number;
  price?: number;
  slippage?: number;
}

interface PolymarketTradeResponse {
  success: boolean;
  trade_id?: string;
  transaction_hash?: string;
  executed_price?: number;
  executed_size?: number;
  fee?: number;
  error?: string;
}

class PolymarketAPI {
  private gammaApiUrl: string;
  private clobApiUrl: string;
  private apiKey: string;
  private secret: string;
  private passphrase: string;
  private timeout: number;

  constructor(
    apiKey: string = process.env.POLYMARKET_API_KEY || '',
    secret: string = process.env.POLYMARKET_API_SECRET || '',
    passphrase: string = process.env.POLYMARKET_API_PASSPHRASE || '',
    timeout: number = 10000
  ) {
    this.gammaApiUrl = 'https://gamma-api.polymarket.com';
    this.clobApiUrl = 'https://clob.polymarket.com';
    this.apiKey = apiKey;
    this.secret = secret;
    this.passphrase = passphrase;
    this.timeout = timeout;
  }

  private getHeaders(useAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add authentication for CLOB API (trading endpoints)
    // Gamma API and Data API are public and don't require authentication
    if (useAuth && this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      if (this.secret && this.passphrase) {
        headers['X-API-KEY'] = this.apiKey;
        headers['X-API-SECRET'] = this.secret;
        headers['X-API-PASSPHRASE'] = this.passphrase;
      }
    }

    return headers;
  }

  /**
   * Fetch all active markets
   */
  async getMarkets(): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(
        `${this.gammaApiUrl}/events`,
        {
          headers: this.getHeaders(false), // No auth for public Gamma API
          timeout: this.timeout,
          params: {
            active: true,
            closed: false,
            limit: 100,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  /**
   * Fetch specific market by ID
   */
  async getMarket(marketId: string): Promise<PolymarketMarket> {
    try {
      const response = await axios.get(
        `${this.gammaApiUrl}/markets/${marketId}`,
        {
          headers: this.getHeaders(false), // No auth for public Gamma API
          timeout: this.timeout,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch order book for a market
   */
  async getOrderBook(tokenId: string, outcome: string): Promise<PolymarketOrderBook> {
    try {
      const response = await axios.get(
        `${this.clobApiUrl}/book`,
        {
          headers: this.getHeaders(true), // Use auth for CLOB API
          timeout: this.timeout,
          params: { token_id: tokenId },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching order book for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a trade
   */
  async executeTrade(request: PolymarketTradeRequest): Promise<PolymarketTradeResponse> {
    try {
      const response = await axios.post(
        `${this.clobApiUrl}/trades`,
        request,
        {
          headers: this.getHeaders(),
          timeout: this.timeout,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  /**
   * Fetch market prices for binary markets (UP/DOWN)
   */
  async getBinaryMarketPrices(marketId: string): Promise<{
    upPrice: number;
    downPrice: number;
    sum: number;
    liquidity: {
      up: number;
      down: number;
    };
  }> {
    try {
      // Fetch order books for both outcomes
      const [upOrderBook, downOrderBook] = await Promise.all([
        this.getOrderBook(marketId, 'UP'),
        this.getOrderBook(marketId, 'DOWN'),
      ]);

      const upPrice = upOrderBook.last_price || upOrderBook.bids[0]?.price || 0;
      const downPrice = downOrderBook.last_price || downOrderBook.bids[0]?.price || 0;
      const sum = upPrice + downPrice;

      // Calculate liquidity from order book depth
      const upLiquidity = upOrderBook.bids.reduce((sum, bid) => sum + bid.size, 0);
      const downLiquidity = downOrderBook.bids.reduce((sum, bid) => sum + bid.size, 0);

      return {
        upPrice,
        downPrice,
        sum,
        liquidity: {
          up: upLiquidity,
          down: downLiquidity,
        },
      };
    } catch (error) {
      console.error(`Error fetching binary market prices for ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch historical market data
   */
  async getHistoricalData(
    marketId: string,
    startDate: Date,
    endDate: Date,
    interval: string = '1m'
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.gammaApiUrl}/markets/${marketId}/history`,
        {
          headers: this.getHeaders(false), // No auth for public Gamma API
          timeout: this.timeout,
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            interval,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching historical data for ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch market statistics
   */
  async getMarketStats(marketId: string): Promise<{
    volume24h: number;
    priceChange24h: number;
    high24h: number;
    low24h: number;
  }> {
    try {
      const response = await axios.get(
        `${this.gammaApiUrl}/markets/${marketId}/stats`,
        {
          headers: this.getHeaders(false), // No auth for public Gamma API
          timeout: this.timeout,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching market stats for ${marketId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const polymarketAPI = new PolymarketAPI();
export { PolymarketAPI };
