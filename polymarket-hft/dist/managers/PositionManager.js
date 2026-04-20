"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionManager = void 0;
const events_1 = require("events");
const ethers_1 = require("ethers");
const types_1 = require("@/types");
const config_1 = require("@/config");
class PositionManager extends events_1.EventEmitter {
    state;
    priceUpdateInterval = null;
    constructor() {
        super();
        this.state = {
            positions: new Map(),
            marketPositions: new Map(),
            trades: new Map(),
            averagePrices: new Map(),
            unrealizedPnL: new Map(),
        };
        this.startPriceUpdates();
    }
    /**
     * Create new position from trade
     */
    createPosition(trade, marketData) {
        const position = {
            id: this.generatePositionId(),
            marketId: trade.marketId,
            type: trade.outcome,
            size: trade.size,
            averagePrice: trade.price,
            unrealizedPnL: ethers_1.ethers.BigNumber.from(0),
            realizedPnL: ethers_1.ethers.BigNumber.from(0),
            timestamp: Date.now(),
            status: 'OPEN',
        };
        // Store position
        this.state.positions.set(position.id, position);
        // Update market positions
        const marketPositions = this.state.marketPositions.get(trade.marketId) || [];
        marketPositions.push(position);
        this.state.marketPositions.set(trade.marketId, marketPositions);
        // Store trade
        this.state.trades.set(trade.id, trade);
        // Calculate initial unrealized P&L
        this.updateUnrealizedPnL(position, marketData);
        // Emit events
        this.emit('positionOpened', position);
        this.emit('positionUpdate', { marketId: trade.marketId, positions: marketPositions });
        return position;
    }
    /**
     * Update existing position with new trade
     */
    updatePosition(positionId, trade, marketData) {
        const position = this.state.positions.get(positionId);
        if (!position) {
            throw new types_1.TradingError(`Position ${positionId} not found`, 'POSITION_NOT_FOUND');
        }
        if (position.status !== 'OPEN') {
            throw new types_1.TradingError(`Position ${positionId} is not open`, 'POSITION_NOT_OPEN');
        }
        // Calculate new average price
        const totalCost = position.averagePrice.mul(position.size).add(trade.price.mul(trade.size));
        const totalSize = position.size.add(trade.size);
        const newAveragePrice = totalCost.div(totalSize);
        // Update position
        position.size = totalSize;
        position.averagePrice = newAveragePrice;
        position.timestamp = Date.now();
        // Store trade
        this.state.trades.set(trade.id, trade);
        // Update unrealized P&L
        this.updateUnrealizedPnL(position, marketData);
        // Emit events
        this.emit('positionUpdated', position);
        this.emit('positionUpdate', {
            marketId: position.marketId,
            positions: this.state.marketPositions.get(position.marketId) || []
        });
        return position;
    }
    /**
     * Close position (full or partial)
     */
    closePosition(positionId, closeSize, closePrice, marketData) {
        const position = this.state.positions.get(positionId);
        if (!position) {
            throw new types_1.TradingError(`Position ${positionId} not found`, 'POSITION_NOT_FOUND');
        }
        if (closeSize.gt(position.size)) {
            throw new types_1.TradingError(`Close size ${closeSize.toString()} exceeds position size ${position.size.toString()}`, 'INVALID_SIZE');
        }
        // Calculate realized P&L
        const closeValue = closeSize.mul(closePrice);
        const costBasis = closeSize.mul(position.averagePrice);
        const realizedPnL = closeValue.sub(costBasis);
        // Update position
        position.size = position.size.sub(closeSize);
        position.realizedPnL = position.realizedPnL.add(realizedPnL);
        if (position.size.eq(0)) {
            position.status = 'CLOSED';
            this.updateUnrealizedPnL(position, marketData);
        }
        else {
            this.updateUnrealizedPnL(position, marketData);
        }
        // Emit events
        if (position.status === 'CLOSED') {
            this.emit('positionClosed', { position, realizedPnL });
        }
        else {
            this.emit('positionPartiallyClosed', { position, realizedPnL, remainingSize: position.size });
        }
        this.emit('positionUpdate', {
            marketId: position.marketId,
            positions: this.state.marketPositions.get(position.marketId) || []
        });
        return { position, realizedPnL };
    }
    /**
     * Get position by ID
     */
    getPosition(positionId) {
        return this.state.positions.get(positionId);
    }
    /**
     * Get all positions for a market
     */
    getMarketPositions(marketId) {
        return this.state.marketPositions.get(marketId) || [];
    }
    /**
     * Get all open positions
     */
    getOpenPositions() {
        return Array.from(this.state.positions.values()).filter(p => p.status === 'OPEN');
    }
    /**
     * Get position metrics for a market
     */
    getMarketMetrics(marketId) {
        const positions = this.getMarketPositions(marketId);
        const openPositions = positions.filter(p => p.status === 'OPEN');
        const upPositions = openPositions.filter(p => p.type === 'UP');
        const downPositions = openPositions.filter(p => p.type === 'DOWN');
        const upExposure = upPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
        const downExposure = downPositions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
        const averageUpPrice = this.calculateWeightedAveragePrice(upPositions);
        const averageDownPrice = this.calculateWeightedAveragePrice(downPositions);
        const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum.add(p.unrealizedPnL), ethers_1.ethers.BigNumber.from(0));
        const totalRealizedPnL = positions.reduce((sum, p) => sum.add(p.realizedPnL), ethers_1.ethers.BigNumber.from(0));
        return {
            totalExposure: upExposure.add(downExposure),
            upExposure,
            downExposure,
            netExposure: upExposure.sub(downExposure),
            averageUpPrice,
            averageDownPrice,
            totalUnrealizedPnL,
            totalRealizedPnL,
        };
    }
    /**
     * Calculate expected profit for hedged position
     */
    calculateExpectedProfit(marketId, marketData) {
        const metrics = this.getMarketMetrics(marketId);
        if (metrics.upExposure.eq(0) || metrics.downExposure.eq(0)) {
            return ethers_1.ethers.BigNumber.from(0); // Not hedged
        }
        // Expected profit = 1 - (avg_up_price + avg_down_price)
        const sumPrices = metrics.averageUpPrice.add(metrics.averageDownPrice);
        const expectedProfit = ethers_1.ethers.BigNumber.from(10).pow(18).sub(sumPrices);
        // Scale by minimum exposure
        const minExposure = metrics.upExposure.lt(metrics.downExposure) ? metrics.upExposure : metrics.downExposure;
        return expectedProfit.mul(minExposure).div(ethers_1.ethers.BigNumber.from(10).pow(18));
    }
    /**
     * Check if position needs hedging
     */
    needsHedging(marketId, marketData) {
        const metrics = this.getMarketMetrics(marketId);
        if (metrics.upExposure.eq(0) && metrics.downExposure.eq(0)) {
            return { needsHedge: false, hedgeSize: ethers_1.ethers.BigNumber.from(0), hedgeType: 'UP', urgency: 'LOW' };
        }
        if (metrics.upExposure.eq(0) && metrics.downExposure.gt(0)) {
            return {
                needsHedge: true,
                hedgeSize: metrics.downExposure,
                hedgeType: 'UP',
                urgency: this.calculateUrgency(metrics.downExposure, marketData),
            };
        }
        if (metrics.downExposure.eq(0) && metrics.upExposure.gt(0)) {
            return {
                needsHedge: true,
                hedgeSize: metrics.upExposure,
                hedgeType: 'DOWN',
                urgency: this.calculateUrgency(metrics.upExposure, marketData),
            };
        }
        // Check for imbalance
        const imbalance = metrics.netExposure.abs().mul(100).div(metrics.totalExposure);
        if (imbalance.gt(20)) { // 20% imbalance threshold
            const hedgeSize = metrics.netExposure.abs();
            const hedgeType = metrics.netExposure.gt(0) ? 'DOWN' : 'UP';
            return {
                needsHedge: true,
                hedgeSize,
                hedgeType,
                urgency: imbalance.gt(50) ? 'HIGH' : 'MEDIUM',
            };
        }
        return { needsHedge: false, hedgeSize: ethers_1.ethers.BigNumber.from(0), hedgeType: 'UP', urgency: 'LOW' };
    }
    /**
     * Update all positions with new market data
     */
    updateAllPositions(marketData) {
        const positions = this.state.marketPositions.get(marketData.marketId) || [];
        positions.forEach(position => {
            if (position.status === 'OPEN') {
                this.updateUnrealizedPnL(position, marketData);
            }
        });
        this.emit('marketPositionsUpdated', {
            marketId: marketData.marketId,
            positions,
            metrics: this.getMarketMetrics(marketData.marketId)
        });
    }
    /**
     * Get position history
     */
    getPositionHistory(positionId) {
        const trades = [];
        for (const trade of this.state.trades.values()) {
            // This would need to be linked to position IDs in a real implementation
            // For now, returning empty array
        }
        return trades;
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const allPositions = Array.from(this.state.positions.values());
        const openPositions = allPositions.filter(p => p.status === 'OPEN');
        const closedPositions = allPositions.filter(p => p.status === 'CLOSED');
        const totalRealizedPnL = allPositions.reduce((sum, p) => sum.add(p.realizedPnL), ethers_1.ethers.BigNumber.from(0));
        const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum.add(p.unrealizedPnL), ethers_1.ethers.BigNumber.from(0));
        const winningPositions = closedPositions.filter(p => p.realizedPnL.gt(0));
        const losingPositions = closedPositions.filter(p => p.realizedPnL.lt(0));
        const averageWin = winningPositions.length > 0
            ? winningPositions.reduce((sum, p) => sum.add(p.realizedPnL), ethers_1.ethers.BigNumber.from(0)).div(winningPositions.length)
            : ethers_1.ethers.BigNumber.from(0);
        const averageLoss = losingPositions.length > 0
            ? losingPositions.reduce((sum, p) => sum.add(p.realizedPnL.abs()), ethers_1.ethers.BigNumber.from(0)).div(losingPositions.length)
            : ethers_1.ethers.BigNumber.from(0);
        const totalWins = winningPositions.reduce((sum, p) => sum.add(p.realizedPnL), ethers_1.ethers.BigNumber.from(0));
        const totalLosses = losingPositions.reduce((sum, p) => sum.add(p.realizedPnL.abs()), ethers_1.ethers.BigNumber.from(0));
        const profitFactor = totalLosses.gt(0) ? totalWins.mul(10000).div(totalLosses).toNumber() / 10000 : 0;
        return {
            totalPositions: allPositions.length,
            openPositions: openPositions.length,
            closedPositions: closedPositions.length,
            totalRealizedPnL,
            totalUnrealizedPnL,
            winRate: closedPositions.length > 0 ? winningPositions.length / closedPositions.length : 0,
            averageWin,
            averageLoss,
            profitFactor,
        };
    }
    /**
     * Update unrealized P&L for a position
     */
    updateUnrealizedPnL(position, marketData) {
        const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
        const currentValue = position.size.mul(currentPrice);
        const costBasis = position.size.mul(position.averagePrice);
        const unrealizedPnL = currentValue.sub(costBasis);
        position.unrealizedPnL = unrealizedPnL;
        this.state.unrealizedPnL.set(position.id, unrealizedPnL);
    }
    /**
     * Calculate weighted average price for positions
     */
    calculateWeightedAveragePrice(positions) {
        if (positions.length === 0) {
            return ethers_1.ethers.BigNumber.from(0);
        }
        const totalCost = positions.reduce((sum, p) => sum.add(p.averagePrice.mul(p.size)), ethers_1.ethers.BigNumber.from(0));
        const totalSize = positions.reduce((sum, p) => sum.add(p.size), ethers_1.ethers.BigNumber.from(0));
        return totalSize.gt(0) ? totalCost.div(totalSize) : ethers_1.ethers.BigNumber.from(0);
    }
    /**
     * Calculate hedging urgency based on exposure and market conditions
     */
    calculateUrgency(exposure, marketData) {
        const exposureRatio = exposure.mul(100).div(config_1.config.risk.maxExposurePerMarket);
        if (exposureRatio.gt(80)) {
            return 'HIGH';
        }
        else if (exposureRatio.gt(50)) {
            return 'MEDIUM';
        }
        else {
            return 'LOW';
        }
    }
    /**
     * Start periodic price updates
     */
    startPriceUpdates() {
        this.priceUpdateInterval = setInterval(() => {
            // This would trigger price updates for all positions
            // In practice, this would be driven by market data events
        }, 1000); // Update every second
    }
    /**
     * Generate unique position ID
     */
    generatePositionId() {
        return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get current state
     */
    getState() {
        return {
            positions: new Map(this.state.positions),
            marketPositions: new Map(this.state.marketPositions),
            trades: new Map(this.state.trades),
            averagePrices: new Map(this.state.averagePrices),
            unrealizedPnL: new Map(this.state.unrealizedPnL),
        };
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
        }
        console.log('🧹 PositionManager cleaned up');
    }
}
exports.PositionManager = PositionManager;
//# sourceMappingURL=PositionManager.js.map