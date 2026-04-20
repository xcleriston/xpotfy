import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { Position, Trade, MarketData } from '@/types';
interface PositionState {
    positions: Map<string, Position>;
    marketPositions: Map<string, Position[]>;
    trades: Map<string, Trade>;
    averagePrices: Map<string, ethers.BigNumber>;
    unrealizedPnL: Map<string, ethers.BigNumber>;
}
export declare class PositionManager extends EventEmitter {
    private state;
    private priceUpdateInterval;
    constructor();
    /**
     * Create new position from trade
     */
    createPosition(trade: Trade, marketData: MarketData): Position;
    /**
     * Update existing position with new trade
     */
    updatePosition(positionId: string, trade: Trade, marketData: MarketData): Position;
    /**
     * Close position (full or partial)
     */
    closePosition(positionId: string, closeSize: ethers.BigNumber, closePrice: ethers.BigNumber, marketData: MarketData): {
        position: Position;
        realizedPnL: ethers.BigNumber;
    };
    /**
     * Get position by ID
     */
    getPosition(positionId: string): Position | undefined;
    /**
     * Get all positions for a market
     */
    getMarketPositions(marketId: string): Position[];
    /**
     * Get all open positions
     */
    getOpenPositions(): Position[];
    /**
     * Get position metrics for a market
     */
    getMarketMetrics(marketId: string): {
        totalExposure: ethers.BigNumber;
        upExposure: ethers.BigNumber;
        downExposure: ethers.BigNumber;
        netExposure: ethers.BigNumber;
        averageUpPrice: ethers.BigNumber;
        averageDownPrice: ethers.BigNumber;
        totalUnrealizedPnL: ethers.BigNumber;
        totalRealizedPnL: ethers.BigNumber;
    };
    /**
     * Calculate expected profit for hedged position
     */
    calculateExpectedProfit(marketId: string, marketData: MarketData): ethers.BigNumber;
    /**
     * Check if position needs hedging
     */
    needsHedging(marketId: string, marketData: MarketData): {
        needsHedge: boolean;
        hedgeSize: ethers.BigNumber;
        hedgeType: 'UP' | 'DOWN';
        urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    /**
     * Update all positions with new market data
     */
    updateAllPositions(marketData: MarketData): void;
    /**
     * Get position history
     */
    getPositionHistory(positionId: string): Trade[];
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): {
        totalPositions: number;
        openPositions: number;
        closedPositions: number;
        totalRealizedPnL: ethers.BigNumber;
        totalUnrealizedPnL: ethers.BigNumber;
        winRate: number;
        averageWin: ethers.BigNumber;
        averageLoss: ethers.BigNumber;
        profitFactor: number;
    };
    /**
     * Update unrealized P&L for a position
     */
    private updateUnrealizedPnL;
    /**
     * Calculate weighted average price for positions
     */
    private calculateWeightedAveragePrice;
    /**
     * Calculate hedging urgency based on exposure and market conditions
     */
    private calculateUrgency;
    /**
     * Start periodic price updates
     */
    private startPriceUpdates;
    /**
     * Generate unique position ID
     */
    private generatePositionId;
    /**
     * Get current state
     */
    getState(): PositionState;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export {};
//# sourceMappingURL=PositionManager.d.ts.map