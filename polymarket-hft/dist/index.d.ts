import { EventEmitter } from 'events';
import { ethers } from 'ethers';
interface BotState {
    isRunning: boolean;
    isPaused: boolean;
    startTime: number;
    lastActivity: number;
    totalTrades: number;
    totalPnL: ethers.BigNumber;
    errors: number;
}
export declare class PolymarketHFTBot extends EventEmitter {
    private state;
    private marketDataEngine;
    private executionEngine;
    private strategyEngine;
    private riskManager;
    private positionManager;
    private backtester;
    constructor(privateKey: string);
    /**
     * Start the trading bot
     */
    start(): Promise<void>;
    /**
     * Stop the trading bot
     */
    stop(): Promise<void>;
    /**
     * Pause trading (keep monitoring)
     */
    pause(): void;
    /**
     * Resume trading
     */
    resume(): void;
    /**
     * Get current bot state
     */
    getState(): BotState;
    /**
     * Get performance metrics
     */
    getMetrics(): any;
    /**
     * Run backtest
     */
    runBacktest(startDate: Date, endDate: Date, initialCapital: ethers.BigNumber): Promise<any>;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Execute strategy signal
     */
    private executeSignal;
    /**
     * Close specific position
     */
    private closePosition;
    /**
     * Close all positions
     */
    private closeAllPositions;
    /**
     * Handle hedge timeout
     */
    private handleHedgeTimeout;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export { PolymarketHFTBot };
//# sourceMappingURL=index.d.ts.map