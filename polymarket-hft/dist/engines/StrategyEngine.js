"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyEngine = void 0;
const events_1 = require("events");
const ethers_1 = require("ethers");
const types_1 = require("@/types");
const config_1 = require("@/config");
class StrategyEngine extends events_1.EventEmitter {
    state;
    isRunning = false;
    strategyLoop = null;
    constructor() {
        super();
        this.state = {
            positions: new Map(),
            opportunities: new Map(),
            metrics: this.initializeMetrics(),
            lastHedgeTime: new Map(),
            hedgeAttempts: new Map(),
        };
    }
    /**
     * Start the strategy engine
     */
    start() {
        if (this.isRunning) {
            console.warn('Strategy engine is already running');
            return;
        }
        this.isRunning = true;
        this.startStrategyLoop();
        console.log('🚀 Strategy engine started');
    }
    /**
     * Stop the strategy engine
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.strategyLoop) {
            clearTimeout(this.strategyLoop);
            this.strategyLoop = null;
        }
        console.log('🛑 Strategy engine stopped');
    }
    /**
     * Process new market data and generate signals
     */
    processMarketData(marketData) {
        if (!this.isRunning) {
            return;
        }
        try {
            // Update internal state
            this.updateMarketState(marketData);
            // Generate trading signals
            const signals = this.generateSignals(marketData);
            // Emit signals for execution
            signals.forEach(signal => {
                this.emit('signal', signal);
            });
            // Check for hedge opportunities
            this.checkHedgeOpportunities(marketData);
            // Update performance metrics
            this.updateMetrics(marketData);
        }
        catch (error) {
            console.error('❌ Error processing market data:', error);
            this.emit('error', new types_1.TradingError(`Strategy processing failed: ${error.message}`, 'STRATEGY_ERROR'));
        }
    }
    /**
     * Process opportunity detected by market data engine
     */
    processOpportunity(opportunity) {
        if (!this.isRunning) {
            return;
        }
        try {
            // Store opportunity
            this.state.opportunities.set(opportunity.marketId, opportunity);
            // Generate signal if conditions are met
            const signal = this.generateOpportunitySignal(opportunity);
            if (signal) {
                this.emit('signal', signal);
            }
        }
        catch (error) {
            console.error('❌ Error processing opportunity:', error);
        }
    }
    /**
     * Update positions after trade execution
     */
    updatePositions(marketId, newPosition) {
        const positions = this.state.positions.get(marketId) || [];
        // Add or update position
        const existingIndex = positions.findIndex(p => p.id === newPosition.id);
        if (existingIndex >= 0) {
            positions[existingIndex] = newPosition;
        }
        else {
            positions.push(newPosition);
        }
        // Remove closed positions
        const activePositions = positions.filter(p => p.status === 'OPEN');
        this.state.positions.set(marketId, activePositions);
        // Emit position update
        this.emit('positionUpdate', { marketId, positions: activePositions });
    }
    /**
     * Generate trading signals based on market data
     */
    generateSignals(marketData) {
        const signals = [];
        const marketId = marketData.marketId;
        // Check for arbitrage opportunities
        const sum = marketData.sum.toNumber() / 1e18;
        for (const threshold of config_1.config.strategy.thresholds) {
            if (sum < threshold) {
                const signal = this.createArbitrageSignal(marketData, threshold);
                if (signal) {
                    signals.push(signal);
                }
                break; // Only take the best opportunity
            }
        }
        // Check for momentum-based signals
        const momentumSignal = this.generateMomentumSignal(marketData);
        if (momentumSignal) {
            signals.push(momentumSignal);
        }
        // Check for mean reversion signals
        const meanReversionSignal = this.generateMeanReversionSignal(marketData);
        if (meanReversionSignal) {
            signals.push(meanReversionSignal);
        }
        return signals;
    }
    /**
     * Create arbitrage signal
     */
    createArbitrageSignal(marketData, threshold) {
        const marketId = marketData.marketId;
        const positions = this.state.positions.get(marketId) || [];
        // Check if we already have a position in this market
        if (positions.length > 0) {
            return null;
        }
        const sum = marketData.sum.toNumber() / 1e18;
        const inefficiency = 1 - sum;
        const expectedProfit = ethers_1.ethers.BigNumber.from(Math.floor(inefficiency * 1e18));
        // Calculate position size based on Kelly criterion
        const positionSize = this.calculatePositionSize(expectedProfit, marketData);
        // Determine which side to buy first (cheaper side)
        const upPrice = marketData.upPrice.toNumber() / 1e18;
        const downPrice = marketData.downPrice.toNumber() / 1e18;
        const signal = {
            marketId,
            signal: upPrice < downPrice ? 'BUY_UP' : 'BUY_DOWN',
            confidence: Math.min((threshold - sum) / threshold * 2, 1),
            expectedProfit: expectedProfit.mul(positionSize).div(ethers_1.ethers.BigNumber.from(10).pow(18)),
            risk: marketData.spread,
            timestamp: Date.now(),
            reason: `Arbitrage opportunity: sum=${sum.toFixed(4)} < ${threshold}`,
            metadata: {
                threshold,
                inefficiency,
                positionSize,
            }
        };
        return signal;
    }
    /**
     * Generate momentum-based signal
     */
    generateMomentumSignal(marketData) {
        // This would analyze price momentum and volume trends
        // For now, returning null as placeholder
        return null;
    }
    /**
     * Generate mean reversion signal
     */
    generateMeanReversionSignal(marketData) {
        // This would identify when prices deviate significantly from historical means
        // For now, returning null as placeholder
        return null;
    }
    /**
     * Generate signal from detected opportunity
     */
    generateOpportunitySignal(opportunity) {
        const positions = this.state.positions.get(opportunity.marketId) || [];
        // Skip if we already have a position
        if (positions.length > 0) {
            return null;
        }
        const positionSize = this.calculatePositionSize(opportunity.expectedProfit, {
            marketId: opportunity.marketId,
            timestamp: opportunity.timestamp,
            upPrice: opportunity.upPrice,
            downPrice: opportunity.downPrice,
            sum: opportunity.sum,
            spread: opportunity.risk,
            volume: ethers_1.ethers.BigNumber.from(0),
            liquidity: opportunity.liquidity,
        });
        const upPrice = opportunity.upPrice.toNumber() / 1e18;
        const downPrice = opportunity.downPrice.toNumber() / 1e18;
        return {
            marketId: opportunity.marketId,
            signal: upPrice < downPrice ? 'BUY_UP' : 'BUY_DOWN',
            confidence: opportunity.inefficiency.toNumber() / 1e18,
            expectedProfit: opportunity.expectedProfit.mul(positionSize).div(ethers_1.ethers.BigNumber.from(10).pow(18)),
            risk: opportunity.risk,
            timestamp: opportunity.timestamp,
            reason: `Direct arbitrage: inefficiency=${opportunity.inefficiency.toNumber() / 1e18}`,
            metadata: {
                positionSize,
                threshold: opportunity.threshold,
            }
        };
    }
    /**
     * Check for hedge opportunities
     */
    checkHedgeOpportunities(marketData) {
        const marketId = marketData.marketId;
        const positions = this.state.positions.get(marketId) || [];
        if (positions.length === 0) {
            return;
        }
        // Check if we need to hedge
        const needsHedge = this.needsHedging(marketId, marketData);
        if (needsHedge) {
            const hedgeSignal = this.generateHedgeSignal(marketId, marketData, positions);
            if (hedgeSignal) {
                this.emit('signal', hedgeSignal);
            }
        }
        // Check for stop-loss conditions
        const stopLossSignal = this.checkStopLoss(marketId, marketData, positions);
        if (stopLossSignal) {
            this.emit('signal', stopLossSignal);
        }
    }
    /**
     * Check if position needs hedging
     */
    needsHedging(marketId, marketData) {
        const positions = this.state.positions.get(marketId) || [];
        const lastHedgeTime = this.state.lastHedgeTime.get(marketId) || 0;
        const now = Date.now();
        // Check timeout
        if (now - lastHedgeTime > config_1.config.risk.hedgeTimeout) {
            return true;
        }
        // Check if we have incomplete hedge
        const upPositions = positions.filter(p => p.type === 'UP');
        const downPositions = positions.filter(p => p.type === 'DOWN');
        if (upPositions.length > 0 && downPositions.length === 0) {
            return true;
        }
        if (downPositions.length > 0 && upPositions.length === 0) {
            return true;
        }
        // Check if hedge is unbalanced
        if (upPositions.length > 0 && downPositions.length > 0) {
            const upExposure = upPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
            const downExposure = downPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
            const imbalance = upExposure.sub(downExposure).abs().mul(100).div(upExposure.add(downExposure));
            return imbalance.gt(20); // 20% imbalance threshold
        }
        return false;
    }
    /**
     * Generate hedge signal
     */
    generateHedgeSignal(marketId, marketData, positions) {
        const upPositions = positions.filter(p => p.type === 'UP');
        const downPositions = positions.filter(p => p.type === 'DOWN');
        let signal;
        let hedgeSize;
        if (upPositions.length > 0 && downPositions.length === 0) {
            // Need to hedge UP with DOWN
            signal = 'HEDGE_DOWN';
            hedgeSize = upPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
        }
        else if (downPositions.length > 0 && upPositions.length === 0) {
            // Need to hedge DOWN with UP
            signal = 'HEDGE_UP';
            hedgeSize = downPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
        }
        else {
            // Rebalance existing hedge
            const upExposure = upPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
            const downExposure = downPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
            if (upExposure.gt(downExposure)) {
                signal = 'HEDGE_DOWN';
                hedgeSize = upExposure.sub(downExposure);
            }
            else {
                signal = 'HEDGE_UP';
                hedgeSize = downExposure.sub(upExposure);
            }
        }
        return {
            marketId,
            signal,
            confidence: 0.8, // High confidence for hedges
            expectedProfit: ethers_1.ethers.BigNumber.from(0), // Hedges are for risk management
            risk: marketData.spread,
            timestamp: Date.now(),
            reason: 'Risk management: hedge required',
            metadata: {
                hedgeSize,
                currentPositions: positions.length,
            }
        };
    }
    /**
     * Check stop-loss conditions
     */
    checkStopLoss(marketId, marketData, positions) {
        for (const position of positions) {
            const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
            const priceChange = currentPrice.sub(position.averagePrice).abs()
                .mul(100).div(position.averagePrice);
            if (priceChange.gt(config_1.config.risk.stopLossPercentage * 10000)) {
                return {
                    marketId,
                    signal: 'CLOSE_ALL',
                    confidence: 1.0,
                    expectedProfit: ethers_1.ethers.BigNumber.from(0),
                    risk: ethers_1.ethers.BigNumber.from(0),
                    timestamp: Date.now(),
                    reason: `Stop loss triggered: price change ${priceChange.toNumber() / 100}%`,
                    metadata: {
                        positionId: position.id,
                        priceChange: priceChange.toNumber() / 100,
                    }
                };
            }
        }
        return null;
    }
    /**
     * Calculate optimal position size using Kelly criterion
     */
    calculatePositionSize(expectedProfit, marketData) {
        if (config_1.config.strategy.positionSizing === 'FIXED') {
            return config_1.config.strategy.baseSize;
        }
        if (config_1.config.strategy.positionSizing === 'KELLY') {
            // Kelly criterion: f* = (bp - q) / b
            // where b = odds, p = probability of winning, q = probability of losing
            const profitRatio = expectedProfit.toNumber() / 1e18;
            const riskRatio = marketData.spread.toNumber() / 1e18;
            if (riskRatio === 0) {
                return config_1.config.strategy.baseSize;
            }
            const odds = profitRatio / riskRatio;
            const winProb = 0.5 + (profitRatio / 2); // Simplified win probability
            const loseProb = 1 - winProb;
            const kellyFraction = (odds * winProb - loseProb) / odds;
            const safeKelly = Math.max(0, Math.min(kellyFraction, 0.25)); // Cap at 25%
            return config_1.config.strategy.baseSize.mul(Math.floor(safeKelly * 10000)).div(10000);
        }
        // VOLATILITY sizing would use historical volatility data
        return config_1.config.strategy.baseSize;
    }
    /**
     * Update market state
     */
    updateMarketState(marketData) {
        // Clean up old opportunities
        const now = Date.now();
        for (const [marketId, opportunity] of this.state.opportunities) {
            if (now - opportunity.timestamp > 60000) { // 1 minute expiry
                this.state.opportunities.delete(marketId);
            }
        }
    }
    /**
     * Update performance metrics
     */
    updateMetrics(marketData) {
        // This would calculate real-time performance metrics
        // For now, updating basic counters
        this.state.metrics.timestamp = Date.now();
    }
    /**
     * Initialize performance metrics
     */
    initializeMetrics() {
        return {
            timestamp: Date.now(),
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: ethers_1.ethers.BigNumber.from(0),
            averageWin: ethers_1.ethers.BigNumber.from(0),
            averageLoss: ethers_1.ethers.BigNumber.from(0),
            profitFactor: 0,
            maxConsecutiveLosses: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
        };
    }
    /**
     * Start strategy execution loop
     */
    startStrategyLoop() {
        const strategyLoop = () => {
            if (!this.isRunning) {
                return;
            }
            try {
                // Perform periodic strategy checks
                this.performPeriodicChecks();
                // Schedule next loop
                this.strategyLoop = setTimeout(strategyLoop, 1000); // 1 second interval
            }
            catch (error) {
                console.error('❌ Strategy loop error:', error);
                this.strategyLoop = setTimeout(strategyLoop, 5000); // 5 second retry on error
            }
        };
        strategyLoop();
    }
    /**
     * Perform periodic strategy checks
     */
    performPeriodicChecks() {
        const now = Date.now();
        // Check for stale positions
        for (const [marketId, positions] of this.state.positions) {
            for (const position of positions) {
                if (now - position.timestamp > 300000) { // 5 minutes
                    console.warn(`⚠️ Stale position detected: ${position.id}`);
                    this.emit('stalePosition', { marketId, position });
                }
            }
        }
        // Check hedge timeouts
        for (const [marketId, lastHedgeTime] of this.state.lastHedgeTime) {
            if (now - lastHedgeTime > config_1.config.risk.hedgeTimeout) {
                const positions = this.state.positions.get(marketId) || [];
                if (positions.length > 0) {
                    console.warn(`⚠️ Hedge timeout for market: ${marketId}`);
                    this.emit('hedgeTimeout', { marketId, positions });
                }
            }
        }
    }
    /**
     * Get current strategy state
     */
    getState() {
        return {
            positions: new Map(this.state.positions),
            opportunities: new Map(this.state.opportunities),
            metrics: { ...this.state.metrics },
            lastHedgeTime: new Map(this.state.lastHedgeTime),
            hedgeAttempts: new Map(this.state.hedgeAttempts),
        };
    }
    /**
     * Get performance metrics
     */
    getMetrics() {
        return { ...this.state.metrics };
    }
    /**
     * Reset strategy state
     */
    reset() {
        this.state = {
            positions: new Map(),
            opportunities: new Map(),
            metrics: this.initializeMetrics(),
            lastHedgeTime: new Map(),
            hedgeAttempts: new Map(),
        };
        console.log('🔄 Strategy engine state reset');
    }
}
exports.StrategyEngine = StrategyEngine;
//# sourceMappingURL=StrategyEngine.js.map