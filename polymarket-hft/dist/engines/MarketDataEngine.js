"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataEngine = void 0;
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
const ethers_1 = require("ethers");
const config_1 = require("@/config");
class MarketDataEngine extends events_1.EventEmitter {
    provider;
    wsConnections = new Map();
    marketData = new Map();
    orderBooks = new Map();
    subscriptions = new Set();
    reconnectAttempts = new Map();
    lastUpdate = new Map();
    // Polymarket contract addresses (Polygon mainnet)
    CTF_EXCHANGE = '0x4bFb41d96A3e6460A18d4f3d3F3b8e0B0e0e0e0e';
    USDC_TOKEN = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    constructor() {
        super();
        this.provider = new ethers_1.ethers.providers.JsonRpcProvider(config_1.config.rpc.alchemyUrl);
        this.setupHeartbeat();
    }
    /**
     * Subscribe to real-time market data for specific markets
     */
    async subscribeToMarket(marketId) {
        if (this.subscriptions.has(marketId)) {
            return;
        }
        try {
            // Initial data fetch
            await this.fetchInitialMarketData(marketId);
            // Setup WebSocket connection for real-time updates
            await this.setupWebSocketConnection(marketId);
            this.subscriptions.add(marketId);
            console.log(`✅ Subscribed to market: ${marketId}`);
        }
        catch (error) {
            console.error(`❌ Failed to subscribe to market ${marketId}:`, error);
            throw error;
        }
    }
    /**
     * Unsubscribe from market data
     */
    unsubscribeFromMarket(marketId) {
        const ws = this.wsConnections.get(marketId);
        if (ws) {
            ws.close();
            this.wsConnections.delete(marketId);
        }
        this.subscriptions.delete(marketId);
        this.marketData.delete(marketId);
        this.orderBooks.delete(marketId);
        this.lastUpdate.delete(marketId);
        console.log(`🔌 Unsubscribed from market: ${marketId}`);
    }
    /**
     * Get current market data
     */
    getMarketData(marketId) {
        return this.marketData.get(marketId);
    }
    /**
     * Get current order book
     */
    getOrderBook(marketId) {
        return this.orderBooks.get(marketId);
    }
    /**
     * Get all subscribed markets data
     */
    getAllMarketData() {
        return new Map(this.marketData);
    }
    /**
     * Fetch initial market data via RPC
     */
    async fetchInitialMarketData(marketId) {
        try {
            // Get market info from Polymarket API
            const marketInfo = await this.fetchMarketInfo(marketId);
            // Get current prices from blockchain
            const upPrice = await this.getTokenPrice(marketInfo.outcomeTokens.UP.address);
            const downPrice = await this.getTokenPrice(marketInfo.outcomeTokens.DOWN.address);
            // Calculate market metrics
            const sum = upPrice.add(downPrice);
            const spread = upPrice.sub(downPrice).abs();
            const marketData = {
                marketId,
                timestamp: Date.now(),
                upPrice,
                downPrice,
                sum,
                spread,
                volume: ethers_1.ethers.BigNumber.from(0), // Will be updated via events
                liquidity: {
                    up: await this.getTokenLiquidity(marketInfo.outcomeTokens.UP.address),
                    down: await this.getTokenLiquidity(marketInfo.outcomeTokens.DOWN.address),
                },
            };
            this.marketData.set(marketId, marketData);
            this.lastUpdate.set(marketId, Date.now());
            // Emit initial data
            this.emit('marketData', marketData);
        }
        catch (error) {
            console.error(`❌ Failed to fetch initial data for ${marketId}:`, error);
            throw error;
        }
    }
    /**
     * Setup WebSocket connection for real-time updates
     */
    async setupWebSocketConnection(marketId) {
        const wsUrl = config_1.config.rpc.alchemyUrl.replace('https://', 'wss://').replace('/v2/', '/ws/v2/');
        const ws = new ws_1.default(wsUrl);
        this.wsConnections.set(marketId, ws);
        ws.on('open', () => {
            console.log(`🔌 WebSocket connected for market: ${marketId}`);
            this.subscribeToLogs(marketId);
        });
        ws.on('message', (data) => {
            this.handleWebSocketMessage(marketId, data);
        });
        ws.on('error', (error) => {
            console.error(`❌ WebSocket error for market ${marketId}:`, error);
            this.handleReconnection(marketId);
        });
        ws.on('close', () => {
            console.log(`🔌 WebSocket closed for market: ${marketId}`);
            this.handleReconnection(marketId);
        });
    }
    /**
     * Subscribe to blockchain logs for the market
     */
    subscribeToLogs(marketId) {
        const ws = this.wsConnections.get(marketId);
        if (!ws)
            return;
        const subscription = {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_subscribe',
            params: [
                'logs',
                {
                    address: [this.CTF_EXCHANGE],
                    topics: [
                        ethers_1.ethers.utils.id('Trade(address,uint256,uint256,uint256,uint256)'),
                        ethers_1.ethers.utils.id('OrderFilled(address,uint256,uint256,uint256)')
                    ]
                }
            ]
        };
        ws.send(JSON.stringify(subscription));
    }
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(marketId, data) {
        try {
            const message = JSON.parse(data.toString());
            if (message.method === 'eth_subscription') {
                this.processBlockchainEvent(marketId, message.params.result);
            }
        }
        catch (error) {
            console.error(`❌ Failed to parse WebSocket message for ${marketId}:`, error);
        }
    }
    /**
     * Process blockchain events and update market data
     */
    async processBlockchainEvent(marketId, log) {
        try {
            // Parse the log to extract trade information
            const tradeData = this.parseTradeLog(log);
            if (!tradeData)
                return;
            // Update market data
            const currentData = this.marketData.get(marketId);
            if (!currentData)
                return;
            // Update prices based on trade
            if (tradeData.outcome === 'UP') {
                currentData.upPrice = tradeData.price;
            }
            else {
                currentData.downPrice = tradeData.price;
            }
            // Recalculate metrics
            currentData.sum = currentData.upPrice.add(currentData.downPrice);
            currentData.spread = currentData.upPrice.sub(currentData.downPrice).abs();
            currentData.volume = currentData.volume.add(tradeData.size);
            currentData.timestamp = Date.now();
            this.lastUpdate.set(marketId, Date.now());
            // Emit updated data
            this.emit('marketData', currentData);
            this.emit('trade', {
                marketId,
                ...tradeData,
                timestamp: Date.now(),
            });
            // Check for arbitrage opportunities
            this.checkArbitrageOpportunity(currentData);
        }
        catch (error) {
            console.error(`❌ Failed to process blockchain event for ${marketId}:`, error);
        }
    }
    /**
     * Check for arbitrage opportunities
     */
    checkArbitrageOpportunity(marketData) {
        const sum = marketData.sum.toNumber() / 1e18; // Convert from wei
        for (const threshold of config_1.config.strategy.thresholds) {
            if (sum < threshold) {
                const opportunity = {
                    marketId: marketData.marketId,
                    upPrice: marketData.upPrice,
                    downPrice: marketData.downPrice,
                    sum: marketData.sum,
                    inefficiency: ethers_1.ethers.BigNumber.from(Math.floor((1 - sum) * 1e18)),
                    threshold,
                    timestamp: Date.now(),
                    expectedProfit: ethers_1.ethers.BigNumber.from(Math.floor((1 - sum) * 1e18)),
                    risk: marketData.spread,
                    liquidity: marketData.liquidity,
                };
                this.emit('opportunity', opportunity);
                break; // Only emit the best (lowest) threshold
            }
        }
    }
    /**
     * Handle WebSocket reconnection with exponential backoff
     */
    async handleReconnection(marketId) {
        const attempts = this.reconnectAttempts.get(marketId) || 0;
        const maxAttempts = 10;
        const baseDelay = 1000; // 1 second
        if (attempts >= maxAttempts) {
            console.error(`❌ Max reconnection attempts reached for market ${marketId}`);
            return;
        }
        const delay = baseDelay * Math.pow(2, attempts); // Exponential backoff
        this.reconnectAttempts.set(marketId, attempts + 1);
        console.log(`🔄 Reconnecting to market ${marketId} in ${delay}ms...`);
        setTimeout(async () => {
            try {
                await this.setupWebSocketConnection(marketId);
                this.reconnectAttempts.set(marketId, 0); // Reset counter on success
            }
            catch (error) {
                console.error(`❌ Reconnection failed for market ${marketId}:`, error);
                this.handleReconnection(marketId);
            }
        }, delay);
    }
    /**
     * Setup heartbeat to monitor connection health
     */
    setupHeartbeat() {
        setInterval(() => {
            const now = Date.now();
            for (const [marketId, lastUpdate] of this.lastUpdate) {
                const timeSinceUpdate = now - lastUpdate;
                const staleThreshold = 60000; // 1 minute
                if (timeSinceUpdate > staleThreshold) {
                    console.warn(`⚠️ Market data stale for ${marketId} (${timeSinceUpdate}ms ago)`);
                    this.emit('staleData', { marketId, timeSinceUpdate });
                }
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Fetch market information from Polymarket API
     */
    async fetchMarketInfo(marketId) {
        // This would integrate with Polymarket's API
        // For now, returning mock structure
        const response = await fetch(`https://api.polymarket.com/markets/${marketId}`);
        const data = await response.json();
        return {
            id: marketId,
            question: data.question,
            description: data.description,
            outcomeTokens: {
                UP: {
                    id: `${marketId}_UP`,
                    outcome: 'UP',
                    price: ethers_1.ethers.BigNumber.from(0),
                    supply: ethers_1.ethers.BigNumber.from(0),
                    address: data.outcomeTokens.UP.address,
                },
                DOWN: {
                    id: `${marketId}_DOWN`,
                    outcome: 'DOWN',
                    price: ethers_1.ethers.BigNumber.from(0),
                    supply: ethers_1.ethers.BigNumber.from(0),
                    address: data.outcomeTokens.DOWN.address,
                },
            },
            liquidity: ethers_1.ethers.BigNumber.from(data.liquidity),
            volume24h: ethers_1.ethers.BigNumber.from(data.volume24h),
            resolutionTime: data.resolutionTime,
            isActive: data.isActive,
            timeWindow: data.timeWindow,
            underlyingAsset: data.underlyingAsset,
        };
    }
    /**
     * Get token price from Uniswap/quickswap pools
     */
    async getTokenPrice(tokenAddress) {
        // This would query Uniswap/quickswap pools for current price
        // For now, returning mock price
        return ethers_1.ethers.BigNumber.from(Math.floor(Math.random() * 0.5 * 1e18));
    }
    /**
     * Get token liquidity from pools
     */
    async getTokenLiquidity(tokenAddress) {
        // This would query pool liquidity
        // For now, returning mock liquidity
        return ethers_1.ethers.BigNumber.from(Math.floor(Math.random() * 100000 * 1e18));
    }
    /**
     * Parse trade log from blockchain event
     */
    parseTradeLog(log) {
        // This would parse the actual log data
        // For now, returning mock trade data
        return {
            outcome: Math.random() > 0.5 ? 'UP' : 'DOWN',
            price: ethers_1.ethers.BigNumber.from(Math.floor(Math.random() * 0.5 * 1e18)),
            size: ethers_1.ethers.BigNumber.from(Math.floor(Math.random() * 1000 * 1e18)),
        };
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        for (const [marketId, ws] of this.wsConnections) {
            ws.close();
        }
        this.wsConnections.clear();
        this.marketData.clear();
        this.orderBooks.clear();
        this.subscriptions.clear();
        this.lastUpdate.clear();
        this.reconnectAttempts.clear();
        console.log('🧹 MarketDataEngine cleaned up');
    }
}
exports.MarketDataEngine = MarketDataEngine;
//# sourceMappingURL=MarketDataEngine.js.map