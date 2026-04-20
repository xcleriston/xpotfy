"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskManager = void 0;
const events_1 = require("events");
const ethers_1 = require("ethers");
const types_1 = require("@/types");
const config_1 = require("@/config");
class RiskManager extends events_1.EventEmitter {
    state;
    riskCheckInterval = null;
    DAILY_PNL_RESET_HOUR = 0; // UTC midnight
    constructor() {
        super();
        this.state = this.initializeState();
        this.startRiskMonitoring();
    }
    /**
     * Validate trade before execution
     */
    async validateTrade(trade) {
        // Check position size limits
        if (trade.size.gt(config_1.config.risk.maxPositionSize)) {
            throw new types_1.RiskError(`Trade size ${trade.size.toString()} exceeds maximum ${config_1.config.risk.maxPositionSize.toString()}`);
        }
        // Check market exposure limits
        const currentMarketExposure = this.state.marketExposure.get(trade.marketId) || ethers_1.ethers.BigNumber.from(0);
        const newMarketExposure = trade.type === 'BUY'
            ? currentMarketExposure.add(trade.size)
            : currentMarketExposure.sub(trade.size);
        if (newMarketExposure.gt(config_1.config.risk.maxExposurePerMarket)) {
            throw new types_1.RiskError(`Market exposure ${newMarketExposure.toString()} exceeds maximum ${config_1.config.risk.maxExposurePerMarket.toString()}`);
        }
        // Check total exposure limits
        const newTotalExposure = trade.type === 'BUY'
            ? this.state.totalExposure.add(trade.size)
            : this.state.totalExposure.sub(trade.size);
        if (newTotalExposure.gt(config_1.config.risk.maxTotalExposure)) {
            throw new types_1.RiskError(`Total exposure ${newTotalExposure.toString()} exceeds maximum ${config_1.config.risk.maxTotalExposure.toString()}`);
        }
        // Check position count limits
        if (trade.type === 'BUY' && this.state.openPositions.length >= config_1.config.risk.maxOpenPositions) {
            throw new types_1.RiskError(`Open positions ${this.state.openPositions.length} exceeds maximum ${config_1.config.risk.maxOpenPositions}`);
        }
        // Check slippage limits
        const slippage = trade.price.mul(config_1.config.risk.maxSlippage * 10000).div(10000);
        if (slippage.gt(trade.price)) {
            throw new types_1.RiskError(`Slippage exceeds maximum allowed limit`);
        }
    }
    /**
     * Validate position for risk management
     */
    validatePosition(position, marketData) {
        // Check stop-loss
        const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
        const priceChange = currentPrice.sub(position.averagePrice).abs()
            .mul(100).div(position.averagePrice);
        if (priceChange.gt(config_1.config.risk.stopLossPercentage * 10000)) {
            this.emit('stopLoss', {
                positionId: position.id,
                marketId: position.marketId,
                priceChange: priceChange.toNumber() / 100,
                reason: 'Stop loss triggered'
            });
        }
        // Check position age
        const positionAge = Date.now() - position.timestamp;
        const maxAge = 300000; // 5 minutes
        if (positionAge > maxAge) {
            this.emit('positionTimeout', {
                positionId: position.id,
                marketId: position.marketId,
                age: positionAge,
                reason: 'Position timeout'
            });
        }
        // Check hedge timeout
        const marketPositions = this.state.openPositions.filter(p => p.marketId === position.marketId);
        const upPositions = marketPositions.filter(p => p.type === 'UP');
        const downPositions = marketPositions.filter(p => p.type === 'DOWN');
        if ((upPositions.length > 0 && downPositions.length === 0) ||
            (downPositions.length > 0 && upPositions.length === 0)) {
            const timeSinceHedge = Date.now() - position.timestamp;
            if (timeSinceHedge > config_1.config.risk.hedgeTimeout) {
                this.emit('hedgeTimeout', {
                    marketId: position.marketId,
                    positionId: position.id,
                    timeSinceHedge,
                    reason: 'Hedge timeout exceeded'
                });
            }
        }
    }
    /**
     * Update risk metrics after trade
     */
    updateRiskMetrics(trade, marketData) {
        // Update exposure
        if (trade.type === 'BUY') {
            this.state.totalExposure = this.state.totalExposure.add(trade.size);
            const marketExposure = this.state.marketExposure.get(trade.marketId) || ethers_1.ethers.BigNumber.from(0);
            this.state.marketExposure.set(trade.marketId, marketExposure.add(trade.size));
        }
        else {
            this.state.totalExposure = this.state.totalExposure.sub(trade.size);
            const marketExposure = this.state.marketExposure.get(trade.marketId) || ethers_1.ethers.BigNumber.from(0);
            this.state.marketExposure.set(trade.marketId, marketExposure.sub(trade.size));
        }
        // Update daily P&L
        this.state.dailyPnL = this.state.dailyPnL.add(trade.fee.mul(-1)); // Subtract fees
        // Update drawdown
        const currentEquity = this.state.totalExposure.add(this.state.dailyPnL);
        if (currentEquity.gt(this.state.peakEquity)) {
            this.state.peakEquity = currentEquity;
        }
        else {
            const drawdown = this.state.peakEquity.sub(currentEquity);
            if (drawdown.gt(this.state.maxDrawdown)) {
                this.state.maxDrawdown = drawdown;
            }
        }
        // Check for risk alerts
        this.checkRiskLimits();
    }
    /**
     * Add new position to risk tracking
     */
    addPosition(position) {
        this.state.openPositions.push(position);
        this.state.lastRiskCheck = Date.now();
    }
    /**
     * Remove position from risk tracking
     */
    removePosition(positionId, realizedPnL) {
        const index = this.state.openPositions.findIndex(p => p.id === positionId);
        if (index >= 0) {
            const position = this.state.openPositions[index];
            this.state.openPositions.splice(index, 1);
            // Update consecutive losses
            if (realizedPnL && realizedPnL.lt(0)) {
                this.state.consecutiveLosses++;
            }
            else {
                this.state.consecutiveLosses = 0;
            }
            // Update daily P&L
            if (realizedPnL) {
                this.state.dailyPnL = this.state.dailyPnL.add(realizedPnL);
            }
        }
    }
    /**
     * Check all risk limits and emit alerts
     */
    checkRiskLimits() {
        const alerts = [];
        // Check total exposure
        const exposureRatio = this.state.totalExposure.mul(100).div(config_1.config.risk.maxTotalExposure);
        if (exposureRatio.gt(90)) {
            alerts.push({
                type: 'EXPOSURE_LIMIT',
                severity: exposureRatio.gt(95) ? 'CRITICAL' : 'HIGH',
                message: `Total exposure at ${exposureRatio.toNumber()}% of limit`,
                timestamp: Date.now(),
                metadata: { exposure: this.state.totalExposure, limit: config_1.config.risk.maxTotalExposure }
            });
        }
        // Check drawdown
        const maxDrawdownLimit = config_1.config.risk.maxTotalExposure.mul(10).div(100); // 10% of max exposure
        if (this.state.maxDrawdown.gt(maxDrawdownLimit)) {
            alerts.push({
                type: 'DRAWDOWN_LIMIT',
                severity: 'CRITICAL',
                message: `Max drawdown ${this.state.maxDrawdown.toString()} exceeds limit`,
                timestamp: Date.now(),
                metadata: { drawdown: this.state.maxDrawdown, limit: maxDrawdownLimit }
            });
        }
        // Check consecutive losses
        if (this.state.consecutiveLosses > 5) {
            alerts.push({
                type: 'CONSECUTIVE_LOSSES',
                severity: this.state.consecutiveLosses > 10 ? 'CRITICAL' : 'HIGH',
                message: `${this.state.consecutiveLosses} consecutive losses`,
                timestamp: Date.now(),
                metadata: { consecutiveLosses: this.state.consecutiveLosses }
            });
        }
        // Emit alerts
        alerts.forEach(alert => {
            this.state.riskAlerts.push(alert);
            this.emit('riskAlert', alert);
            if (alert.severity === 'CRITICAL') {
                this.emit('criticalRisk', alert);
            }
        });
        // Clean old alerts (keep last 100)
        if (this.state.riskAlerts.length > 100) {
            this.state.riskAlerts = this.state.riskAlerts.slice(-100);
        }
    }
    /**
     * Get current risk metrics
     */
    getRiskMetrics() {
        const unrealizedPnL = this.state.openPositions.reduce((sum, position) => {
            return sum.add(position.unrealizedPnL);
        }, ethers_1.ethers.BigNumber.from(0));
        const totalPnL = this.state.dailyPnL.add(unrealizedPnL);
        return {
            totalExposure: this.state.totalExposure,
            openPositions: this.state.openPositions.length,
            unrealizedPnL,
            dailyPnL: this.state.dailyPnL,
            maxDrawdown: this.state.maxDrawdown,
            sharpeRatio: this.calculateSharpeRatio(),
            winRate: this.calculateWinRate(),
        };
    }
    /**
     * Calculate Sharpe ratio
     */
    calculateSharpeRatio() {
        // Simplified Sharpe ratio calculation
        // In production, this would use historical returns
        const dailyReturn = this.state.dailyPnL.toNumber();
        const riskFreeRate = 0.02; // 2% annual
        const volatility = 0.15; // Assumed 15% annual volatility
        if (volatility === 0)
            return 0;
        return (dailyReturn / 365 - riskFreeRate / 365) / (volatility / Math.sqrt(365));
    }
    /**
     * Calculate win rate
     */
    calculateWinRate() {
        // Simplified win rate calculation
        // In production, this would track actual trade history
        return 0.55; // Placeholder
    }
    /**
     * Check if trading should be paused due to risk limits
     */
    shouldPauseTrading() {
        const metrics = this.getRiskMetrics();
        // Pause if drawdown exceeds 5% of max exposure
        const drawdownLimit = config_1.config.risk.maxTotalExposure.mul(5).div(100);
        if (metrics.maxDrawdown.gt(drawdownLimit)) {
            return true;
        }
        // Pause if consecutive losses exceed 10
        if (this.state.consecutiveLosses > 10) {
            return true;
        }
        // Pause if total exposure exceeds 95% of limit
        const exposureRatio = metrics.totalExposure.mul(100).div(config_1.config.risk.maxTotalExposure);
        if (exposureRatio.gt(95)) {
            return true;
        }
        return false;
    }
    /**
     * Get risk limits for a specific trade
     */
    getTradeLimits(marketId) {
        const marketExposure = this.state.marketExposure.get(marketId) || ethers_1.ethers.BigNumber.from(0);
        const remainingMarketExposure = config_1.config.risk.maxExposurePerMarket.sub(marketExposure);
        const remainingTotalExposure = config_1.config.risk.maxTotalExposure.sub(this.state.totalExposure);
        const maxSize = remainingMarketExposure.lt(remainingTotalExposure)
            ? remainingMarketExposure
            : remainingTotalExposure;
        return {
            maxSize: size.min(config_1.config.risk.maxPositionSize),
            maxPrice: ethers_1.ethers.constants.MaxUint256, // No price limit for binary markets
            maxSlippage: config_1.config.risk.maxSlippage,
        };
    }
    /**
     * Start risk monitoring loop
     */
    startRiskMonitoring() {
        this.riskCheckInterval = setInterval(() => {
            this.performRiskCheck();
        }, 5000); // Check every 5 seconds
    }
    /**
     * Perform comprehensive risk check
     */
    performRiskCheck() {
        try {
            // Check for stale positions
            const now = Date.now();
            const staleThreshold = 300000; // 5 minutes
            this.state.openPositions.forEach(position => {
                if (now - position.timestamp > staleThreshold) {
                    this.emit('stalePosition', {
                        positionId: position.id,
                        marketId: position.marketId,
                        age: now - position.timestamp,
                    });
                }
            });
            // Reset daily P&L at midnight UTC
            const nowUTC = new Date();
            if (nowUTC.getUTCHours() === this.DAILY_PNL_RESET_HOUR &&
                nowUTC.getUTCMinutes() === 0 &&
                nowUTC.getUTCSeconds() < 5) {
                this.resetDailyMetrics();
            }
            this.state.lastRiskCheck = now;
        }
        catch (error) {
            console.error('❌ Risk check failed:', error);
        }
    }
    /**
     * Reset daily metrics
     */
    resetDailyMetrics() {
        this.state.dailyPnL = ethers_1.ethers.BigNumber.from(0);
        this.state.consecutiveLosses = 0;
        console.log('📊 Daily risk metrics reset');
    }
    /**
     * Initialize risk state
     */
    initializeState() {
        return {
            totalExposure: ethers_1.ethers.BigNumber.from(0),
            marketExposure: new Map(),
            openPositions: [],
            dailyPnL: ethers_1.ethers.BigNumber.from(0),
            maxDrawdown: ethers_1.ethers.BigNumber.from(0),
            peakEquity: ethers_1.ethers.BigNumber.from(0),
            consecutiveLosses: 0,
            lastRiskCheck: Date.now(),
            riskAlerts: [],
        };
    }
    /**
     * Get current risk state
     */
    getState() {
        return {
            totalExposure: this.state.totalExposure,
            marketExposure: new Map(this.state.marketExposure),
            openPositions: [...this.state.openPositions],
            dailyPnL: this.state.dailyPnL,
            maxDrawdown: this.state.maxDrawdown,
            peakEquity: this.state.peakEquity,
            consecutiveLosses: this.state.consecutiveLosses,
            lastRiskCheck: this.state.lastRiskCheck,
            riskAlerts: [...this.state.riskAlerts],
        };
    }
    /**
     * Get recent risk alerts
     */
    getRecentAlerts(limit = 10) {
        return this.state.riskAlerts.slice(-limit);
    }
    /**
     * Clear risk alerts
     */
    clearAlerts() {
        this.state.riskAlerts = [];
    }
    /**
     * Emergency stop - close all positions
     */
    emergencyStop() {
        this.emit('emergencyStop', {
            reason: 'Manual emergency stop triggered',
            positions: this.state.openPositions.length,
            totalExposure: this.state.totalExposure,
            timestamp: Date.now(),
        });
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.riskCheckInterval) {
            clearInterval(this.riskCheckInterval);
            this.riskCheckInterval = null;
        }
        console.log('🧹 RiskManager cleaned up');
    }
}
exports.RiskManager = RiskManager;
//# sourceMappingURL=RiskManager.js.map