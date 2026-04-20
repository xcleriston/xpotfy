import { ethers } from 'ethers';
import { Trade, Position, MarketData, RiskAlert, PerformanceMetrics } from '@/types';
interface LogContext {
    userId?: string;
    sessionId?: string;
    marketId?: string;
    positionId?: string;
    tradeId?: string;
    strategy?: string;
    [key: string]: any;
}
export declare class Logger {
    private logger;
    private performanceLogs;
    constructor();
    /**
     * Log trade execution
     */
    logTrade(trade: Trade, context?: LogContext): void;
    /**
     * Log position changes
     */
    logPosition(position: Position, action: 'OPENED' | 'CLOSED' | 'MODIFIED', context?: LogContext): void;
    /**
     * Log market data updates
     */
    logMarketData(marketData: MarketData, context?: LogContext): void;
    /**
     * Log strategy signals
     */
    logStrategySignal(signal: any, context?: LogContext): void;
    /**
     * Log risk alerts
     */
    logRiskAlert(alert: RiskAlert, context?: LogContext): void;
    /**
     * Log performance metrics
     */
    logPerformanceMetrics(metrics: PerformanceMetrics, context?: LogContext): void;
    /**
     * Log execution performance
     */
    logExecutionPerformance(operation: string, duration: number, context?: LogContext): void;
    /**
     * Log system errors
     */
    logError(error: Error, context?: LogContext): void;
    /**
     * Log trading errors
     */
    logTradingError(error: any, context?: LogContext): void;
    /**
     * Log network issues
     */
    logNetworkIssue(issue: string, context?: LogContext): void;
    /**
     * Log arbitrage opportunities
     */
    logArbitrageOpportunity(opportunity: any, context?: LogContext): void;
    /**
     * Log hedge operations
     */
    logHedgeOperation(marketId: string, hedgeType: string, size: ethers.BigNumber, context?: LogContext): void;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): {
        [operation: string]: {
            avg: number;
            max: number;
            min: number;
            samples: number;
        };
    };
    /**
     * Clear performance logs
     */
    clearPerformanceLogs(): void;
    /**
     * Create child logger with context
     */
    child(context: LogContext): Logger;
    /**
     * Set log level
     */
    setLevel(level: string): void;
    /**
     * Get current log level
     */
    getLevel(): string;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=Logger.d.ts.map