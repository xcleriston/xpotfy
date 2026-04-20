"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolymarketHFTBot = void 0;
const events_1 = require("events");
const ethers_1 = require("ethers");
const MarketDataEngine_1 = require("@/engines/MarketDataEngine");
const ExecutionEngine_1 = require("@/engines/ExecutionEngine");
const StrategyEngine_1 = require("@/engines/StrategyEngine");
const RiskManager_1 = require("@/managers/RiskManager");
const PositionManager_1 = require("@/managers/PositionManager");
const Backtester_1 = require("@/backtesting/Backtester");
const Logger_1 = require("@/monitoring/Logger");
const MetricsCollector_1 = require("@/monitoring/MetricsCollector");
const config_1 = require("@/config");
class PolymarketHFTBot extends events_1.EventEmitter {
    state;
    marketDataEngine;
    executionEngine;
    strategyEngine;
    riskManager;
    positionManager;
    backtester;
    constructor(privateKey) {
        super();
        this.state = {
            isRunning: false,
            isPaused: false,
            startTime: 0,
            lastActivity: 0,
            totalTrades: 0,
            totalPnL: ethers_1.ethers.BigNumber.from(0),
            errors: 0,
        };
        // Initialize components
        this.marketDataEngine = new MarketDataEngine_1.MarketDataEngine();
        this.executionEngine = new ExecutionEngine_1.ExecutionEngine(privateKey);
        this.strategyEngine = new StrategyEngine_1.StrategyEngine();
        this.riskManager = new RiskManager_1.RiskManager();
        this.positionManager = new PositionManager_1.PositionManager();
        // Setup event handlers
        this.setupEventHandlers();
        Logger_1.logger.info('Polymarket HFT Bot initialized', {
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        });
    }
    /**
     * Start the trading bot
     */
    async start() {
        if (this.state.isRunning) {
            Logger_1.logger.warn('Bot is already running');
            return;
        }
        try {
            Logger_1.logger.info('Starting Polymarket HFT Bot...');
            // Start strategy engine
            this.strategyEngine.start();
            // Subscribe to markets
            for (const marketId of config_1.config.markets.monitoredMarkets) {
                await this.marketDataEngine.subscribeToMarket(marketId);
                Logger_1.logger.info('Subscribed to market', { marketId });
            }
            this.state.isRunning = true;
            this.state.startTime = Date.now();
            this.state.lastActivity = Date.now();
            this.emit('started');
            Logger_1.logger.info('Bot started successfully', {
                markets: config_1.config.markets.monitoredMarkets.length,
                strategy: config_1.config.strategy.positionSizing,
                riskLimits: config_1.config.risk,
            });
        }
        catch (error) {
            this.state.errors++;
            Logger_1.logger.logError(error, { context: 'bot_start' });
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Stop the trading bot
     */
    async stop() {
        if (!this.state.isRunning) {
            return;
        }
        try {
            Logger_1.logger.info('Stopping Polymarket HFT Bot...');
            // Stop strategy engine
            this.strategyEngine.stop();
            // Unsubscribe from all markets
            for (const marketId of config_1.config.markets.monitoredMarkets) {
                this.marketDataEngine.unsubscribeFromMarket(marketId);
            }
            // Close all open positions
            await this.closeAllPositions();
            this.state.isRunning = false;
            this.emit('stopped');
            Logger_1.logger.info('Bot stopped successfully', {
                runtime: Date.now() - this.state.startTime,
                totalTrades: this.state.totalTrades,
                totalPnL: this.state.totalPnL.toString(),
                errors: this.state.errors,
            });
        }
        catch (error) {
            this.state.errors++;
            Logger_1.logger.logError(error, { context: 'bot_stop' });
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Pause trading (keep monitoring)
     */
    pause() {
        if (!this.state.isRunning || this.state.isPaused) {
            return;
        }
        this.state.isPaused = true;
        this.emit('paused');
        Logger_1.logger.info('Bot paused');
    }
    /**
     * Resume trading
     */
    resume() {
        if (!this.state.isRunning || !this.state.isPaused) {
            return;
        }
        this.state.isPaused = false;
        this.emit('resumed');
        Logger_1.logger.info('Bot resumed');
    }
    /**
     * Get current bot state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get performance metrics
     */
    getMetrics() {
        const strategyMetrics = this.strategyEngine.getMetrics();
        const riskMetrics = this.riskManager.getRiskMetrics();
        const positionMetrics = this.positionManager.getPerformanceMetrics();
        return {
            bot: this.state,
            strategy: strategyMetrics,
            risk: riskMetrics,
            positions: positionMetrics,
            system: MetricsCollector_1.metricsCollector.getSnapshot(),
        };
    }
    /**
     * Run backtest
     */
    async runBacktest(startDate, endDate, initialCapital) {
        Logger_1.logger.info('Starting backtest', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            initialCapital: initialCapital.toString(),
        });
        const backtester = new Backtester_1.Backtester({
            startDate,
            endDate,
            initialCapital,
            commissionRate: 0.001, // 0.1%
            slippageModel: 'DYNAMIC',
            latencyModel: 'REALISTIC',
            marketImpactModel: 'SQUARE_ROOT',
        });
        // Load historical data (this would need to be implemented)
        // await backtester.loadMarketData('market_1', historicalData);
        const strategy = (marketData) => {
            return this.strategyEngine.generateSignals(marketData);
        };
        const execution = async (request) => {
            return this.executionEngine.execute(request);
        };
        const results = await backtester.runBacktest(strategy, execution);
        Logger_1.logger.info('Backtest completed', {
            totalTrades: results.metrics.totalTrades,
            totalPnL: results.metrics.totalPnL.toString(),
            sharpeRatio: results.metrics.sharpeRatio,
            maxDrawdown: results.metrics.maxDrawdown.toString(),
        });
        return results;
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Market data events
        this.marketDataEngine.on('marketData', (marketData) => {
            this.state.lastActivity = Date.now();
            MetricsCollector_1.metricsCollector.recordMarketData(marketData);
            Logger_1.logger.logMarketData(marketData);
            if (!this.state.isPaused) {
                this.strategyEngine.processMarketData(marketData);
                this.positionManager.updateAllPositions(marketData);
            }
        });
        this.marketDataEngine.on('opportunity', (opportunity) => {
            MetricsCollector_1.metricsCollector.recordArbitrageOpportunity(opportunity.marketId, opportunity.threshold);
            Logger_1.logger.logArbitrageOpportunity(opportunity);
            if (!this.state.isPaused) {
                this.strategyEngine.processOpportunity(opportunity);
            }
        });
        this.marketDataEngine.on('staleData', (data) => {
            Logger_1.logger.logNetworkIssue(`Stale market data for ${data.marketId}`, data);
            MetricsCollector_1.metricsCollector.recordWarning('stale_data');
        });
        // Strategy events
        this.strategyEngine.on('signal', async (signal) => {
            Logger_1.logger.logStrategySignal(signal);
            if (!this.state.isPaused) {
                await this.executeSignal(signal);
            }
        });
        this.strategyEngine.on('positionUpdate', (data) => {
            this.emit('positionUpdate', data);
        });
        // Risk events
        this.riskManager.on('riskAlert', (alert) => {
            Logger_1.logger.logRiskAlert(alert);
            MetricsCollector_1.metricsCollector.recordError(alert.type, alert.severity);
            if (alert.severity === 'CRITICAL') {
                this.pause();
                this.emit('criticalRisk', alert);
            }
        });
        this.riskManager.on('stopLoss', async (data) => {
            Logger_1.logger.warn('Stop loss triggered', data);
            await this.closePosition(data.positionId);
        });
        this.riskManager.on('hedgeTimeout', async (data) => {
            Logger_1.logger.warn('Hedge timeout', data);
            await this.handleHedgeTimeout(data);
        });
        // Position events
        this.positionManager.on('positionOpened', (position) => {
            this.riskManager.addPosition(position);
            Logger_1.logger.logPosition(position, 'OPENED');
            this.emit('positionOpened', position);
        });
        this.positionManager.on('positionClosed', (data) => {
            this.riskManager.removePosition(data.position.id, data.realizedPnL);
            Logger_1.logger.logPosition(data.position, 'CLOSED');
            this.emit('positionClosed', data);
        });
        // Error handling
        this.on('error', (error) => {
            this.state.errors++;
            Logger_1.logger.logError(error);
            MetricsCollector_1.metricsCollector.recordError('system', 'HIGH');
        });
    }
    /**
     * Execute strategy signal
     */
    async executeSignal(signal) {
        try {
            const startTime = Date.now();
            // Create execution request
            const request = {
                marketId: signal.marketId,
                outcome: signal.signal.includes('UP') ? 'UP' : 'DOWN',
                type: signal.signal.includes('BUY') ? 'BUY' : 'SELL',
                size: signal.expectedProfit, // This should be calculated properly
                deadline: Date.now() + 30000, // 30 seconds
            };
            // Validate with risk manager
            await this.riskManager.validateTrade({
                id: 'temp',
                marketId: request.marketId,
                type: request.type,
                outcome: request.outcome,
                size: request.size,
                price: ethers_1.ethers.BigNumber.from(0), // Will be set by execution
                fee: ethers_1.ethers.BigNumber.from(0), // Will be set by execution
                timestamp: Date.now(),
                status: 'PENDING',
            });
            // Execute trade
            const result = await this.executionEngine.execute(request);
            if (result.success) {
                this.state.totalTrades++;
                this.state.lastActivity = Date.now();
                // Create trade record
                const trade = {
                    id: result.tradeId || 'unknown',
                    marketId: request.marketId,
                    type: request.type,
                    outcome: request.outcome,
                    size: result.executedSize || request.size,
                    price: result.executedPrice || ethers_1.ethers.BigNumber.from(0),
                    fee: result.fee || ethers_1.ethers.BigNumber.from(0),
                    timestamp: Date.now(),
                    txHash: result.txHash,
                    status: 'CONFIRMED',
                };
                // Update position manager
                const marketData = this.marketDataEngine.getMarketData(request.marketId);
                if (marketData) {
                    const existingPosition = this.positionManager.getMarketPositions(request.marketId)
                        .find(p => p.type === request.outcome && p.status === 'OPEN');
                    if (existingPosition) {
                        this.positionManager.updatePosition(existingPosition.id, trade, marketData);
                    }
                    else {
                        this.positionManager.createPosition(trade, marketData);
                    }
                }
                Logger_1.logger.logTrade(trade);
                MetricsCollector_1.metricsCollector.recordTrade(trade);
                MetricsCollector_1.metricsCollector.recordExecutionLatency('trade_execution', request.marketId, Date.now() - startTime);
                // Update risk manager
                this.riskManager.updateRiskMetrics(trade, marketData);
            }
            else {
                Logger_1.logger.logTradingError(result.error || 'Unknown error');
                MetricsCollector_1.metricsCollector.recordTransactionFailure(result.error || 'unknown', request.marketId);
            }
        }
        catch (error) {
            this.state.errors++;
            Logger_1.logger.logTradingError(error);
            MetricsCollector_1.metricsCollector.recordError('trade_execution', 'HIGH');
        }
    }
    /**
     * Close specific position
     */
    async closePosition(positionId) {
        try {
            const position = this.positionManager.getPosition(positionId);
            if (!position) {
                return;
            }
            const marketData = this.marketDataEngine.getMarketData(position.marketId);
            if (!marketData) {
                return;
            }
            const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
            const request = {
                marketId: position.marketId,
                outcome: position.type,
                type: 'SELL',
                size: position.size,
                deadline: Date.now() + 30000,
            };
            const result = await this.executionEngine.execute(request);
            if (result.success && result.executedSize && result.executedPrice) {
                this.positionManager.closePosition(positionId, result.executedSize, result.executedPrice, marketData);
            }
        }
        catch (error) {
            Logger_1.logger.logError(error, { positionId });
        }
    }
    /**
     * Close all positions
     */
    async closeAllPositions() {
        const openPositions = this.positionManager.getOpenPositions();
        for (const position of openPositions) {
            await this.closePosition(position.id);
        }
    }
    /**
     * Handle hedge timeout
     */
    async handleHedgeTimeout(data) {
        Logger_1.logger.warn('Handling hedge timeout', data);
        // Emergency close all positions in the market
        const marketPositions = this.positionManager.getMarketPositions(data.marketId);
        for (const position of marketPositions) {
            if (position.status === 'OPEN') {
                await this.closePosition(position.id);
            }
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await this.stop();
            this.marketDataEngine.cleanup();
            this.riskManager.cleanup();
            this.positionManager.cleanup();
            Logger_1.logger.info('Bot cleanup completed');
        }
        catch (error) {
            Logger_1.logger.logError(error, { context: 'cleanup' });
        }
    }
}
exports.PolymarketHFTBot = PolymarketHFTBot;
// Main execution function
async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error('PRIVATE_KEY environment variable is required');
        process.exit(1);
    }
    const bot = new PolymarketHFTBot(privateKey);
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Received SIGINT, shutting down gracefully...');
        await bot.cleanup();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        await bot.cleanup();
        process.exit(0);
    });
    try {
        await bot.start();
        // Keep the process running
        console.log('Bot is running. Press Ctrl+C to stop.');
    }
    catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}
// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=index.js.map