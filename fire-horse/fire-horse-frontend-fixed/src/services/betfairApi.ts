import axios from 'axios';
import { BetfairAccountDetails, BetfairAccountFunds, Event, MarketBook, MarketCatalogue } from '../types/betfair';

const BETFAIR_API_URL = 'https://api.betfair.com/exchange/betting/rest/v1.0';

class BetfairApiService {
  private sessionToken: string | null = null;



  private async authenticate(): Promise<void> {
    const username = localStorage.getItem('betfair_username');
    const password = localStorage.getItem('betfair_password');
    const appKey = localStorage.getItem('betfair_app_key');
    
    if (!username || !password || !appKey) {
      throw new Error('Missing Betfair API credentials. Please log in again.');
    }

    const response = await axios.post(
      'https://identitysso-cert.betfair.com/api/certlogin',
      `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        headers: {
          'X-Application': appKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent: new (require('https').Agent)({  
          rejectUnauthorized: false
        })
      }
    );

    if (response.data.token) {
      this.sessionToken = response.data.token;
    } else {
      throw new Error('Authentication failed: No token received');
    }
  }

  private getAuthHeaders() {
    const appKey = localStorage.getItem('betfair_app_key');
    return {
      'X-Application': appKey || '',
      'X-Authentication': this.sessionToken || '',
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest<T>(endpoint: string, params: any = {}): Promise<T> {
    if (!this.sessionToken) {
      await this.authenticate();
    }

    try {
      const response = await axios.post<T>(
        `${BETFAIR_API_URL}${endpoint}`,
        params,
        {
          headers: {
            ...this.getAuthHeaders(),
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Account Methods
  public async getAccountDetails(): Promise<BetfairAccountDetails> {
    return this.makeRequest<BetfairAccountDetails>('/account/getAccountDetails');
  }

  public async getAccountFunds(wallet?: string): Promise<BetfairAccountFunds> {
    const params = wallet ? { wallet } : {};
    return this.makeRequest<BetfairAccountFunds>('/account/getAccountFunds', params);
  }

  // Betting Methods
  public async listHorseRacingEvents(): Promise<Event[]> {
    const params = {
      filter: {
        eventTypeIds: ['7'], // 7 is the event type ID for horse racing
        marketStartTime: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next 7 days
        }
      },
      maxResults: 100,
      marketProjection: ['EVENT', 'EVENT_TYPE', 'COMPETITION', 'MARKET_START_TIME']
    };

    const response = await this.makeRequest<any>('/listEvents', params);
    return response.map((item: any) => item.event);
  }

  public async listMarketCatalogue(eventId: string): Promise<MarketCatalogue[]> {
    const params = {
      filter: {
        eventIds: [eventId],
        marketTypeCodes: ['WIN'], // WIN market for horse racing
        marketCountries: ['GB', 'IE', 'FR', 'US', 'AU'], // Major horse racing countries
        marketStartTime: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next 24 hours
        }
      },
      maxResults: '1000',
      marketProjection: [
        'COMPETITION',
        'EVENT',
        'EVENT_TYPE',
        'MARKET_START_TIME',
        'MARKET_DESCRIPTION',
        'RUNNER_DESCRIPTION',
        'RUNNER_METADATA'
      ]
    };

    return this.makeRequest<MarketCatalogue[]>('/listMarketCatalogue', params);
  }

  public async listMarketBook(marketIds: string[]): Promise<MarketBook[]> {
    const params = {
      marketIds,
      priceProjection: {
        priceData: ['EX_BEST_OFFERS', 'EX_TRADED'],
        virtualise: true
      },
      orderProjection: 'ALL',
      matchProjection: 'ROLLED_UP_BY_PRICE',
      includeOverallPosition: true
    };

    return this.makeRequest<MarketBook[]>('/listMarketBook', params);
  }

  // Helper method to get all horse racing markets with prices
  public async getHorseRacingMarkets(): Promise<{
    events: Event[];
    markets: Record<string, MarketCatalogue>;
    marketBooks: Record<string, MarketBook>;
  }> {
    try {
      // Get horse racing events
      const events = await this.makeRequest<Event[]>('/listEvents', {
        filter: {
          eventTypeIds: ['7'], // Horse Racing
          marketStartTime: {
            from: new Date().toISOString(),
            to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      }) as unknown as Event[];

      // Get markets for each event
      const marketPromises = events.map(event => this.listMarketCatalogue(event.event.id));
      const marketResults = await Promise.all(marketPromises);
      
      // Flatten and process markets
      const markets: Record<string, MarketCatalogue> = {};
      const marketBooks: Record<string, MarketBook> = {};
      
      for (const marketList of marketResults) {
        for (const market of marketList) {
          markets[market.marketId] = market;
          
          // Get market book for each market
          const book = await this.listMarketBook([market.marketId]);
          if (book && book.length > 0) {
            marketBooks[market.marketId] = book[0];
          }
        }
      }
      
      return { events, markets, marketBooks };
    } catch (error) {
      console.error('Failed to get horse racing markets:', error);
      throw error;
    }
  }
}

export const betfairApi = new BetfairApiService();
