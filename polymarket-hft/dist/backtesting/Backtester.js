"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backtester = void 0;
const events_1 = require("events");
const ethers_1 = require("ethers");
const config_1 = require("@/config");
class Backtester extends events_1.EventEmitter {
    config;
    markets = new Map();
    currentPosition = new Map();
    trades = [];
    equity;
    peakEquity;
    equityCurve = [];
    drawdowns = [];
    constructor(config) {
        super();
        this.config = config;
        this.equity = config.initialCapital;
        this.peakEquity = config.initialCapital;
    }
    /**
     * Load historical market data
     */
    async loadMarketData(marketId, data) {
        const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
        // Simulate liquidity based on volume and price movements
        const liquidityHistory = sortedData.map(marketData => ({
            timestamp: marketData.timestamp,
            up: this.simulateLiquidity(marketData.upPrice, marketData.volume),
            down: this.simulateLiquidity(marketData.downPrice, marketData.volume),
        }));
        this.markets.set(marketId, {
            marketId,
            priceHistory: sortedData,
            liquidityHistory,
        });
        console.log(`📊 Loaded ${sortedData.length} data points for market ${marketId}`);
    }
    /**
     * Run backtest simulation
     */
    async runBacktest(strategy, execution) {
        console.log('🚀 Starting backtest simulation...');
        const startTime = Date.now();
        let currentTime = this.config.startDate.getTime();
        const endTime = this.config.endDate.getTime();
        // Sort all market data by timestamp
        const allMarketData = this.getAllMarketDataSorted();
        for (const marketData of allMarketData) {
            if (marketData.timestamp < currentTime || marketData.timestamp > endTime) {
                continue;
            }
            currentTime = marketData.timestamp;
            try {
                // Update current positions with new prices
                this.updatePositions(marketData);
                // Generate strategy signals
                const signals = strategy(marketData);
                // Execute signals
                for (const signal of signals) {
                    await this.executeSignal(signal, marketData, execution);
                }
                // Update equity curve
                this.updateEquityCurve(marketData.timestamp);
                // Check for drawdowns
                this.updateDrawdowns(marketData.timestamp);
                // Emit progress
                this.emit('progress', {
                    timestamp: currentTime,
                    progress: (currentTime - this.config.startDate.getTime()) / (endTime - this.config.startDate.getTime()),
                    equity: this.equity,
                    trades: this.trades.length,
                });
            }
            catch (error) {
                console.error('❌ Error in backtest iteration:', error);
                this.emit('error', error);
            }
        }
        // Close all remaining positions at the end
        await this.closeAllPositions(allMarketData[allMarketData.length - 1], execution);
        const endTimeMs = Date.now() - startTime;
        console.log(`✅ Backtest completed in ${endTimeMs}ms`);
        return this.generateResults();
    }
    /**
     * Run Monte Carlo simulation
     */
    async runMonteCarlo(iterations = 1000, strategy, execution) {
        console.log(`🎲 Running Monte Carlo simulation with ${iterations} iterations...`);
        const results = [];
        for (let i = 0; i < iterations; i++) {
            // Reset state for each iteration
            this.resetState();
            // Add random noise to market data
            const noisyMarkets = this.addMarketNoise();
            // Run backtest with noisy data
            const result = await this.runBacktest(strategy, execution);
            results.push(result);
            if (i % 100 === 0) {
                console.log(`Monte Carlo progress: ${i}/${iterations}`);
            }
        }
        return this.calculateMonteCarloStatistics(results);
    }
    /**
     * Analyze market opportunities
     */
    analyzeOpportunities() {
        const opportunities = [];
        for (const [marketId, market] of this.markets) {
            for (const marketData of market.priceHistory) {
                const sum = marketData.sum.toNumber() / 1e18;
                for (const threshold of config_1.config.strategy.thresholds) {
                    if (sum < threshold) {
                        const inefficiency = 1 - sum;
                        const profit = ethers_1.ethers.BigNumber.from(Math.floor(inefficiency * 1e18));
                        opportunities.push({ threshold, profit, inefficiency });
                        break; // Only count the best opportunity per timestamp
                    }
                }
            }
        }
        // Calculate distribution by threshold
        const distribution = config_1.config.strategy.thresholds.map(threshold => {
            const thresholdOpportunities = opportunities.filter(o => o.threshold === threshold);
            const avgProfit = thresholdOpportunities.length > 0
                ? thresholdOpportunities.reduce((sum, o) => sum.add(o.profit), ethers_1.ethers.BigNumber.from(0))
                    .div(thresholdOpportunities.length)
                : ethers_1.ethers.BigNumber.from(0);
            return {
                threshold,
                count: thresholdOpportunities.length,
                avgProfit,
            };
        });
        const totalOpportunities = opportunities.length;
        const capturedOpportunities = this.trades.filter(t => t.status === 'CONFIRMED').length / 2; // Approximate
        const averageProfit = opportunities.length > 0
            ? opportunities.reduce((sum, o) => sum.add(o.profit), ethers_1.ethers.BigNumber.from(0))
                .div(opportunities.length)
            : ethers_1.ethers.BigNumber.from(0);
        const averageInefficiency = opportunities.length > 0
            ? opportunities.reduce((sum, o) => sum + o.inefficiency, 0) / opportunities.length
            : 0;
        return {
            totalOpportunities,
            capturedOpportunities,
            averageProfit,
            averageInefficiency,
            distribution,
        };
    }
    /**
     * Get all market data sorted by timestamp
     */
    getAllMarketDataSorted() {
        const allData = [];
        for (const market of this.markets.values()) {
            allData.push(...market.priceHistory);
        }
        return allData.sort((a, b) => a.timestamp - b.timestamp);
    }
    /**
     * Update positions with new market data
     */
    updatePositions(marketData) {
        const positions = this.currentPosition.get(marketData.marketId) || [];
        positions.forEach(position => {
            if (position.status === 'OPEN') {
                const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
                const currentValue = position.size.mul(currentPrice);
                const costBasis = position.size.mul(position.averagePrice);
                position.unrealizedPnL = currentValue.sub(costBasis);
            }
        });
    }
    /**
     * Execute strategy signal
     */
    async executeSignal(signal, marketData, execution) {
        try {
            const request = this.createExecutionRequest(signal, marketData);
            const result = await execution(request);
            if (result.success && result.executedSize && result.executedPrice) {
                const trade = {
                    id: this.generateTradeId(),
                    marketId: signal.marketId,
                    type: signal.signal.includes('BUY') ? 'BUY' : 'SELL',
                    outcome: signal.signal.includes('UP') ? 'UP' : 'DOWN',
                    size: result.executedSize,
                    price: result.executedPrice,
                    fee: result.fee || ethers_1.ethers.BigNumber.from(0),
                    timestamp: Date.now(),
                    txHash: result.txHash,
                    status: 'CONFIRMED',
                };
                this.trades.push(trade);
                this.updatePositionFromTrade(trade, marketData);
                // Apply commission
                this.equity = this.equity.sub(trade.fee);
            }
            else {
                console.warn('⚠️ Trade execution failed:', result.error);
            }
        }
        catch (error) {
            console.error('❌ Error executing signal:', error);
        }
    }
    /**
     * Create execution request from signal
     */
    createExecutionRequest(signal, marketData) {
        const size = this.calculatePositionSize(signal.expectedProfit, marketData);
        const currentPrice = signal.signal.includes('UP') ? marketData.upPrice : marketData.downPrice;
        // Apply slippage
        const slippage = this.calculateSlippage(size, marketData);
        const adjustedPrice = signal.signal.includes('BUY')
            ? currentPrice.add(slippage)
            : currentPrice.sub(slippage);
        return {
            marketId: signal.marketId,
            outcome: signal.signal.includes('UP') ? 'UP' : 'DOWN',
            type: signal.signal.includes('BUY') ? 'BUY' : 'SELL',
            size,
            maxPrice: signal.signal.includes('BUY') ? adjustedPrice : undefined,
            minPrice: signal.signal.includes('SELL') ? adjustedPrice : undefined,
            deadline: Date.now() + 30000, // 30 seconds
        };
    }
    /**
     * Calculate position size based on signal and current equity
     */
    calculatePositionSize(expectedProfit, marketData) {
        const baseSize = config_1.config.strategy.baseSize;
        const equityRatio = baseSize.mul(10000).div(this.equity);
        // Limit position size to 10% of current equity
        const maxPosition = this.equity.mul(1000).div(10000);
        return baseSize.lt(maxPosition) ? baseSize : maxPosition;
    }
    /**
     * Calculate slippage based on size and market conditions
     */
    calculateSlippage(size, marketData) {
        if (this.config.slippageModel === 'FIXED') {
            return marketData.upPrice.mul(5).div(10000); // 0.05% fixed slippage
        }
        if (this.config.slippageModel === 'PERCENTAGE') {
            return marketData.upPrice.mul(10).div(10000); // 0.1% percentage slippage
        }
        // DYNAMIC slippage based on liquidity
        const liquidity = marketData.liquidity.up.add(marketData.liquidity.down);
        const impactRatio = size.mul(10000).div(liquidity);
        return marketData.upPrice.mul(impactRatio).div(10000);
    }
    /**
     * Update position from trade
     */
    updatePositionFromTrade(trade, marketData) {
        const positions = this.currentPosition.get(trade.marketId) || [];
        if (trade.type === 'BUY') {
            // Create or update position
            const existingPosition = positions.find(p => p.type === trade.outcome && p.status === 'OPEN');
            if (existingPosition) {
                // Update existing position
                const totalCost = existingPosition.averagePrice.mul(existingPosition.size).add(trade.price.mul(trade.size));
                const totalSize = existingPosition.size.add(trade.size);
                existingPosition.averagePrice = totalCost.div(totalSize);
                existingPosition.size = totalSize;
            }
            else {
                // Create new position
                const newPosition = {
                    id: this.generatePositionId(),
                    marketId: trade.marketId,
                    type: trade.outcome,
                    size: trade.size,
                    averagePrice: trade.price,
                    unrealizedPnL: ethers_1.ethers.BigNumber.from(0),
                    realizedPnL: ethers_1.ethers.BigNumber.from(0),
                    timestamp: trade.timestamp,
                    status: 'OPEN',
                };
                positions.push(newPosition);
            }
        }
        else {
            // Close position
            const position = positions.find(p => p.type === trade.outcome && p.status === 'OPEN');
            if (position) {
                const realizedPnL = trade.size.mul(trade.price).sub(trade.size.mul(position.averagePrice));
                position.realizedPnL = position.realizedPnL.add(realizedPnL);
                position.size = position.size.sub(trade.size);
                if (position.size.eq(0)) {
                    position.status = 'CLOSED';
                }
                // Update equity
                this.equity = this.equity.add(realizedPnL);
            }
        }
        this.currentPosition.set(trade.marketId, positions);
    }
    /**
     * Update equity curve
     */
    updateEquityCurve(timestamp) {
        let totalUnrealizedPnL = ethers_1.ethers.BigNumber.from(0);
        for (const positions of this.currentPosition.values()) {
            for (const position of positions) {
                if (position.status === 'OPEN') {
                    totalUnrealizedPnL = totalUnrealizedPnL.add(position.unrealizedPnL);
                }
            }
        }
        const currentEquity = this.config.initialCapital.add(totalUnrealizedPnL);
        this.equity = currentEquity;
        if (currentEquity.gt(this.peakEquity)) {
            this.peakEquity = currentEquity;
        }
        this.equityCurve.push({ timestamp, equity: currentEquity });
    }
    /**
     * Update drawdowns
     */
    updateDrawdowns(timestamp) {
        const drawdown = this.peakEquity.sub(this.equity);
        const drawdownPercentage = this.peakEquity.gt(0)
            ? drawdown.mul(10000).div(this.peakEquity).toNumber() / 100
            : 0;
        if (drawdown.gt(0)) {
            this.drawdowns.push({
                timestamp,
                drawdown,
                percentage: drawdownPercentage,
            });
        }
    }
    /**
     * Close all positions at the end
     */
    async closeAllPositions(lastMarketData, execution) {
        for (const [marketId, positions] of this.currentPosition) {
            for (const position of positions) {
                if (position.status === 'OPEN') {
                    const closeSignal = {
                        marketId,
                        signal: position.type === 'UP' ? 'SELL_UP' : 'SELL_DOWN',
                        confidence: 1.0,
                        expectedProfit: ethers_1.ethers.BigNumber.from(0),
                        risk: ethers_1.ethers.BigNumber.from(0),
                        timestamp: Date.now(),
                        reason: 'Backtest end - close all positions',
                    };
                    await this.executeSignal(closeSignal, lastMarketData, execution);
                }
            }
        }
    }
    /**
     * Generate backtest results
     */
    generateResults() {
        const metrics = this.calculatePerformanceMetrics();
        const allPositions = Array.from(this.currentPosition.values()).flat();
        const opportunityAnalysis = this.analyzeOpportunities();
        return {
            metrics,
            trades: this.trades,
            positions: allPositions,
            equityCurve: this.equityCurve,
            drawdowns: this.drawdowns,
            dailyReturns: this.calculateDailyReturns(),
            opportunityAnalysis,
        };
    }
    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics() {
        const winningTrades = this.trades.filter(t => t.status === 'CONFIRMED' && t.type === 'SELL' && t.price.gt(t.size)); // Simplified
        const losingTrades = this.trades.filter(t => t.status === 'CONFIRMED' && t.type === 'SELL' && t.price.lt(t.size)); // Simplified
        const totalPnL = this.equity.sub(this.config.initialCapital);
        const averageWin = winningTrades.length > 0
            ? winningTrades.reduce((sum, t) => sum.add(t.price), ethers_1.ethers.BigNumber.from(0)).div(winningTrades.length)
            : ethers_1.ethers.BigNumber.from(0);
        const averageLoss = losingTrades.length > 0
            ? losingTrades.reduce((sum, t) => sum.add(t.price), ethers_1.ethers.BigNumber.from(0)).div(losingTrades.length)
            : ethers_1.ethers.BigNumber.from(0);
        const totalWins = winningTrades.reduce((sum, t) => sum.add(t.price), ethers_1.ethers.BigNumber.from(0));
        const totalLosses = losingTrades.reduce((sum, t) => sum.add(t.price.abs()), ethers_1.ethers.BigNumber.from(0));
        const profitFactor = totalLosses.gt(0) ? totalWins.mul(10000).div(totalLosses).toNumber() / 10000 : 0;
        const maxDrawdown = this.drawdowns.length > 0
            ? this.drawdowns.reduce((max, d) => d.drawdown.gt(max.drawdown) ? d : max).drawdown
            : ethers_1.ethers.BigNumber.from(0);
        return {
            timestamp: Date.now(),
            totalTrades: this.trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            totalPnL,
            averageWin,
            averageLoss,
            profitFactor,
            maxConsecutiveLosses: this.calculateMaxConsecutiveLosses(),
            sharpeRatio: this.calculateSharpeRatio(),
            sortinoRatio: this.calculateSortinoRatio(),
            calmarRatio: this.calculateCalmarRatio(maxDrawdown),
        };
    }
    /**
     * Calculate daily returns
     */
    calculateDailyReturns() {
        const dailyReturns = [];
        for (let i = 1; i < this.equityCurve.length; i++) {
            const current = this.equityCurve[i];
            const previous = this.equityCurve[i - 1];
            const currentDate = new Date(current.timestamp).toISOString().split('T')[0];
            const returnValue = previous.equity.gt(0)
                ? current.equity.sub(previous.equity).mul(10000).div(previous.equity).toNumber() / 100
                : 0;
            dailyReturns.push({ date: currentDate, return: returnValue });
        }
        return dailyReturns;
    }
    /**
     * Calculate maximum consecutive losses
     */
    calculateMaxConsecutiveLosses() {
        let maxConsecutive = 0;
        let currentConsecutive = 0;
        // Simplified calculation - would need proper trade ordering
        for (const trade of this.trades) {
            if (trade.type === 'SELL' && trade.status === 'CONFIRMED') {
                // This is a simplified check
                currentConsecutive++;
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            }
            else {
                currentConsecutive = 0;
            }
        }
        return maxConsecutive;
    }
    /**
     * Calculate Sharpe ratio
     */
    calculateSharpeRatio() {
        const dailyReturns = this.calculateDailyReturns();
        if (dailyReturns.length === 0)
            return 0;
        const avgReturn = dailyReturns.reduce((sum, r) => sum + r.return, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r.return - avgReturn, 2), 0) / dailyReturns.length;
        const stdDev = Math.sqrt(variance);
        return stdDev > 0 ? avgReturn / stdDev * Math.sqrt(365) : 0;
    }
    /**
     * Calculate Sortino ratio
     */
    calculateSortinoRatio() {
        const dailyReturns = this.calculateDailyReturns();
        if (dailyReturns.length === 0)
            return 0;
        const avgReturn = dailyReturns.reduce((sum, r) => sum + r.return, 0) / dailyReturns.length;
        const downsideVariance = dailyReturns
            .filter(r => r.return < 0)
            .reduce((sum, r) => sum + Math.pow(r.return, 2), 0) / dailyReturns.length;
        const downsideDev = Math.sqrt(downsideVariance);
        return downsideDev > 0 ? avgReturn / downsideDev * Math.sqrt(365) : 0;
    }
    /**
     * Calculate Calmar ratio
     */
    calculateCalmarRatio(maxDrawdown) {
        const totalReturn = this.equity.sub(this.config.initialCapital).toNumber() / this.config.initialCapital.toNumber();
        const maxDrawdownRatio = maxDrawdown.toNumber() / this.config.initialCapital.toNumber();
        return maxDrawdownRatio > 0 ? totalReturn / maxDrawdownRatio : 0;
    }
    /**
     * Calculate Monte Carlo statistics
     */
    calculateMonteCarloStatistics(results) {
        const pnls = results.map(r => r.metrics.totalPnL.toNumber());
        const sharpeRatios = results.map(r => r.metrics.sharpeRatio);
        const maxDrawdowns = results.map(r => r.metrics.maxDrawdown.toNumber());
        const winRates = results.map(r => r.metrics.winRate);
        const calculateConfidenceInterval = (values, confidence = 0.95) => {
            const sorted = values.sort((a, b) => a - b);
            const lowerIndex = Math.floor((1 - confidence) / 2 * values.length);
            const upperIndex = Math.ceil((1 + confidence) / 2 * values.length);
            return {
                lower: sorted[lowerIndex],
                upper: sorted[upperIndex],
            };
        };
        const averageMetrics = {
            timestamp: Date.now(),
            totalTrades: Math.round(results.reduce((sum, r) => sum + r.metrics.totalTrades, 0) / results.length),
            winningTrades: Math.round(results.reduce((sum, r) => sum + r.metrics.winningTrades, 0) / results.length),
            losingTrades: Math.round(results.reduce((sum, r) => sum + r.metrics.losingTrades, 0) / results.length),
            totalPnL: ethers_1.ethers.BigNumber.from(Math.round(results.reduce((sum, r) => sum + r.metrics.totalPnL.toNumber(), 0) / results.length)),
            averageWin: ethers_1.ethers.BigNumber.from(Math.round(results.reduce((sum, r) => sum + r.metrics.averageWin.toNumber(), 0) / results.length)),
            averageLoss: ethers_1.ethers.BigNumber.from(Math.round(results.reduce((sum, r) => sum + r.metrics.averageLoss.toNumber(), 0) / results.length)),
            profitFactor: results.reduce((sum, r) => sum + r.metrics.profitFactor, 0) / results.length,
            maxConsecutiveLosses: Math.round(results.reduce((sum, r) => sum + r.metrics.maxConsecutiveLosses, 0) / results.length),
            sharpeRatio: results.reduce((sum, r) => sum + r.metrics.sharpeRatio, 0) / results.length,
            sortinoRatio: results.reduce((sum, r) => sum + r.metrics.sortinoRatio, 0) / results.length,
            calmarRatio: results.reduce((sum, r) => sum + r.metrics.calmarRatio, 0) / results.length
        };
        return {
            averageMetrics,
            confidenceIntervals: {
                totalPnL: calculateConfidenceInterval(pnls),
                sharpeRatio: calculateConfidenceInterval(sharpeRatios),
                maxDrawdown: calculateConfidenceInterval(maxDrawdowns),
                winRate: calculateConfidenceInterval(winRates),
            },
        };
    }
    /**
     * Simulate liquidity based on price and volume
     */
    simulateLiquidity(price, volume) {
        // Simple liquidity model: liquidity = volume * price * multiplier
        return volume.mul(price).mul(10).div(ethers_1.ethers.BigNumber.from(10).pow(18));
    }
    /**
     * Add market noise for Monte Carlo simulation
     */
    addMarketNoise() {
        const noisyMarkets = new Map();
        for (const [marketId, market] of this.markets) {
            const noisyPriceHistory = market.priceHistory.map(marketData => {
                const noise = (Math.random() - 0.5) * 0.001; // ±0.05% noise
                const upNoise = ethers_1.ethers.BigNumber.from(Math.floor(noise * marketData.upPrice.toNumber()));
                const downNoise = ethers_1.ethers.BigNumber.from(Math.floor(noise * marketData.downPrice.toNumber()));
                return {
                    ...marketData,
                    upPrice: marketData.upPrice.add(upNoise),
                    downPrice: marketData.downPrice.add(downNoise),
                };
            });
            noisyMarkets.set(marketId, {
                ...market,
                priceHistory: noisyPriceHistory,
            });
        }
        return noisyMarkets;
    }
    /**
     * Reset state for new iteration
     */
    resetState() {
        this.currentPosition.clear();
        this.trades = [];
        this.equity = this.config.initialCapital;
        this.peakEquity = this.config.initialCapital;
        this.equityCurve = [];
        this.drawdowns = [];
    }
    /**
     * Generate unique trade ID
     */
    generateTradeId() {
        return `bt_trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique position ID
     */
    generatePositionId() {
        return `bt_pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.Backtester = Backtester;
//# sourceMappingURL=Backtester.js.map