import { EventEmitter } from 'events';
import { MarketData, OrderBook } from '@/types';
export declare class MarketDataEngine extends EventEmitter {
    private provider;
    private wsConnections;
    private marketData;
    private orderBooks;
    private subscriptions;
    private reconnectAttempts;
    private lastUpdate;
    private readonly CTF_EXCHANGE;
    private readonly USDC_TOKEN;
    constructor();
    /**
     * Subscribe to real-time market data for specific markets
     */
    subscribeToMarket(marketId: string): Promise<void>;
    /**
     * Unsubscribe from market data
     */
    unsubscribeFromMarket(marketId: string): void;
    /**
     * Get current market data
     */
    getMarketData(marketId: string): MarketData | undefined;
    /**
     * Get current order book
     */
    getOrderBook(marketId: string): OrderBook | undefined;
    /**
     * Get all subscribed markets data
     */
    getAllMarketData(): Map<string, MarketData>;
    /**
     * Fetch initial market data via RPC
     */
    private fetchInitialMarketData;
    /**
     * Setup WebSocket connection for real-time updates
     */
    private setupWebSocketConnection;
    /**
     * Subscribe to blockchain logs for the market
     */
    private subscribeToLogs;
    /**
     * Handle WebSocket messages
     */
    private handleWebSocketMessage;
    /**
     * Process blockchain events and update market data
     */
    private processBlockchainEvent;
    /**
     * Check for arbitrage opportunities
     */
    private checkArbitrageOpportunity;
    /**
     * Handle WebSocket reconnection with exponential backoff
     */
    private handleReconnection;
    /**
     * Setup heartbeat to monitor connection health
     */
    private setupHeartbeat;
    /**
     * Fetch market information from Polymarket API
     */
    private fetchMarketInfo;
    /**
     * Get token price from Uniswap/quickswap pools
     */
    private getTokenPrice;
    /**
     * Get token liquidity from pools
     */
    private getTokenLiquidity;
    /**
     * Parse trade log from blockchain event
     */
    private parseTradeLog;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=MarketDataEngine.d.ts.map