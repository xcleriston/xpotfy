import { EventEmitter } from 'events';
import client from 'prom-client';
import { PerformanceMetrics, MarketData, Position, Trade } from '@/types';
interface MetricSnapshot {
    timestamp: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalPnL: string;
    unrealizedPnL: string;
    openPositions: number;
    totalExposure: string;
    averageLatency: number;
    errorRate: number;
}
export declare class MetricsCollector extends EventEmitter {
    private registry;
    private metrics;
    private snapshots;
    private latencyMeasurements;
    private errorCount;
    private totalOperations;
    constructor();
    /**
     * Initialize Prometheus metrics
     */
    private initializeMetrics;
    /**
     * Record trade execution
     */
    recordTrade(trade: Trade): void;
    /**
     * Record position update
     */
    recordPosition(position: Position): void;
    /**
     * Record market data update
     */
    recordMarketData(marketData: MarketData): void;
    /**
     * Record arbitrage opportunity
     */
    recordArbitrageOpportunity(marketId: string, threshold: number): void;
    /**
     * Record execution latency
     */
    recordExecutionLatency(operation: string, marketId: string, duration: number): void;
    /**
     * Record strategy latency
     */
    recordStrategyLatency(strategy: string, duration: number): void;
    /**
     * Record risk check latency
     */
    recordRiskCheckLatency(checkType: string, duration: number): void;
    /**
     * Record error
     */
    recordError(type: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): void;
    /**
     * Record warning
     */
    recordWarning(type: string): void;
    /**
     * Record RPC latency
     */
    recordRpcLatency(method: string, provider: string, duration: number): void;
    /**
     * Record WebSocket reconnection
     */
    recordWebsocketReconnection(marketId: string): void;
    /**
     * Record transaction failure
     */
    recordTransactionFailure(reason: string, marketId: string): void;
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(metrics: PerformanceMetrics): void;
    /**
     * Update system metrics
     */
    updateSystemMetrics(): void;
    /**
     * Get metrics for Prometheus
     */
    getMetrics(): string;
    /**
     * Get performance snapshot
     */
    getSnapshot(): MetricSnapshot;
    /**
     * Get historical snapshots
     */
    getSnapshots(limit?: number): MetricSnapshot[];
    /**
     * Start periodic collection
     */
    private startPeriodicCollection;
    /**
     * Take performance snapshot
     */
    private takeSnapshot;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    /**
     * Get registry for external use
     */
    getRegistry(): client.Registry;
}
export declare const metricsCollector: MetricsCollector;
export {};
//# sourceMappingURL=MetricsCollector.d.ts.map