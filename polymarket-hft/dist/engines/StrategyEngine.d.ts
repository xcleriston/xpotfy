import { EventEmitter } from 'events';
import { MarketData, Opportunity, Position, PerformanceMetrics } from '@/types';
interface StrategyState {
    positions: Map<string, Position[]>;
    opportunities: Map<string, Opportunity>;
    metrics: PerformanceMetrics;
    lastHedgeTime: Map<string, number>;
    hedgeAttempts: Map<string, number>;
}
export declare class StrategyEngine extends EventEmitter {
    private state;
    private isRunning;
    private strategyLoop;
    constructor();
    /**
     * Start the strategy engine
     */
    start(): void;
    /**
     * Stop the strategy engine
     */
    stop(): void;
    /**
     * Process new market data and generate signals
     */
    processMarketData(marketData: MarketData): void;
    /**
     * Process opportunity detected by market data engine
     */
    processOpportunity(opportunity: Opportunity): void;
    /**
     * Update positions after trade execution
     */
    updatePositions(marketId: string, newPosition: Position): void;
    /**
     * Generate trading signals based on market data
     */
    private generateSignals;
    /**
     * Create arbitrage signal
     */
    private createArbitrageSignal;
    /**
     * Generate momentum-based signal
     */
    private generateMomentumSignal;
    /**
     * Generate mean reversion signal
     */
    private generateMeanReversionSignal;
    /**
     * Generate signal from detected opportunity
     */
    private generateOpportunitySignal;
    /**
     * Check for hedge opportunities
     */
    private checkHedgeOpportunities;
    /**
     * Check if position needs hedging
     */
    private needsHedging;
    /**
     * Generate hedge signal
     */
    private generateHedgeSignal;
    /**
     * Check stop-loss conditions
     */
    private checkStopLoss;
    /**
     * Calculate optimal position size using Kelly criterion
     */
    private calculatePositionSize;
    /**
     * Update market state
     */
    private updateMarketState;
    /**
     * Update performance metrics
     */
    private updateMetrics;
    /**
     * Initialize performance metrics
     */
    private initializeMetrics;
    /**
     * Start strategy execution loop
     */
    private startStrategyLoop;
    /**
     * Perform periodic strategy checks
     */
    private performPeriodicChecks;
    /**
     * Get current strategy state
     */
    getState(): StrategyState;
    /**
     * Get performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Reset strategy state
     */
    reset(): void;
}
export {};
//# sourceMappingURL=StrategyEngine.d.ts.map