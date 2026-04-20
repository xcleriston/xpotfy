import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { RiskMetrics, Position, Trade, MarketData } from '@/types';
interface RiskState {
    totalExposure: ethers.BigNumber;
    marketExposure: Map<string, ethers.BigNumber>;
    openPositions: Position[];
    dailyPnL: ethers.BigNumber;
    maxDrawdown: ethers.BigNumber;
    peakEquity: ethers.BigNumber;
    consecutiveLosses: number;
    lastRiskCheck: number;
    riskAlerts: RiskAlert[];
}
interface RiskAlert {
    type: 'EXPOSURE_LIMIT' | 'DRAWDOWN_LIMIT' | 'CONSECUTIVE_LOSSES' | 'LIQUIDITY_RISK';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: number;
    metadata?: any;
}
export declare class RiskManager extends EventEmitter {
    private state;
    private riskCheckInterval;
    private readonly DAILY_PNL_RESET_HOUR;
    constructor();
    /**
     * Validate trade before execution
     */
    validateTrade(trade: Omit<Trade, 'id' | 'timestamp' | 'txHash' | 'status'>): Promise<void>;
    /**
     * Validate position for risk management
     */
    validatePosition(position: Position, marketData: MarketData): void;
    /**
     * Update risk metrics after trade
     */
    updateRiskMetrics(trade: Trade, marketData?: MarketData): void;
    /**
     * Add new position to risk tracking
     */
    addPosition(position: Position): void;
    /**
     * Remove position from risk tracking
     */
    removePosition(positionId: string, realizedPnL?: ethers.BigNumber): void;
    /**
     * Check all risk limits and emit alerts
     */
    private checkRiskLimits;
    /**
     * Get current risk metrics
     */
    getRiskMetrics(): RiskMetrics;
    /**
     * Calculate Sharpe ratio
     */
    private calculateSharpeRatio;
    /**
     * Calculate win rate
     */
    private calculateWinRate;
    /**
     * Check if trading should be paused due to risk limits
     */
    shouldPauseTrading(): boolean;
    /**
     * Get risk limits for a specific trade
     */
    getTradeLimits(marketId: string): {
        maxSize: ethers.BigNumber;
        maxPrice: ethers.BigNumber;
        maxSlippage: number;
    };
    /**
     * Start risk monitoring loop
     */
    private startRiskMonitoring;
    /**
     * Perform comprehensive risk check
     */
    private performRiskCheck;
    /**
     * Reset daily metrics
     */
    private resetDailyMetrics;
    /**
     * Initialize risk state
     */
    private initializeState;
    /**
     * Get current risk state
     */
    getState(): RiskState;
    /**
     * Get recent risk alerts
     */
    getRecentAlerts(limit?: number): RiskAlert[];
    /**
     * Clear risk alerts
     */
    clearAlerts(): void;
    /**
     * Emergency stop - close all positions
     */
    emergencyStop(): void;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export {};
//# sourceMappingURL=RiskManager.d.ts.map