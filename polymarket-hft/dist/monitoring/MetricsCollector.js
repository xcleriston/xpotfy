"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsCollector = exports.MetricsCollector = void 0;
const events_1 = require("events");
const prom_client_1 = __importDefault(require("prom-client"));
class MetricsCollector extends events_1.EventEmitter {
    registry;
    metrics;
    snapshots = [];
    latencyMeasurements = [];
    errorCount = 0;
    totalOperations = 0;
    constructor() {
        super();
        this.registry = new prom_client_1.default.Registry();
        this.initializeMetrics();
        this.startPeriodicCollection();
    }
    /**
     * Initialize Prometheus metrics
     */
    initializeMetrics() {
        // Trading metrics
        this.metrics = {
            totalTrades: new prom_client_1.default.Counter({
                name: 'polymarket_trades_total',
                help: 'Total number of trades executed',
                labelNames: ['market', 'type', 'outcome'],
                registers: [this.registry],
            }),
            winningTrades: new prom_client_1.default.Counter({
                name: 'polymarket_winning_trades_total',
                help: 'Total number of winning trades',
                labelNames: ['market'],
                registers: [this.registry],
            }),
            losingTrades: new prom_client_1.default.Counter({
                name: 'polymarket_losing_trades_total',
                help: 'Total number of losing trades',
                labelNames: ['market'],
                registers: [this.registry],
            }),
            totalPnL: new prom_client_1.default.Gauge({
                name: 'polymarket_total_pnl',
                help: 'Total profit and loss',
                labelNames: ['currency'],
                registers: [this.registry],
            }),
            unrealizedPnL: new prom_client_1.default.Gauge({
                name: 'polymarket_unrealized_pnl',
                help: 'Total unrealized profit and loss',
                labelNames: ['currency'],
                registers: [this.registry],
            }),
            realizedPnL: new prom_client_1.default.Gauge({
                name: 'polymarket_realized_pnl',
                help: 'Total realized profit and loss',
                labelNames: ['currency'],
                registers: [this.registry],
            }),
            // Position metrics
            openPositions: new prom_client_1.default.Gauge({
                name: 'polymarket_open_positions',
                help: 'Number of open positions',
                labelNames: ['market'],
                registers: [this.registry],
            }),
            totalExposure: new prom_client_1.default.Gauge({
                name: 'polymarket_total_exposure',
                help: 'Total exposure across all positions',
                labelNames: ['currency'],
                registers: [this.registry],
            }),
            positionSize: new prom_client_1.default.Histogram({
                name: 'polymarket_position_size',
                help: 'Distribution of position sizes',
                labelNames: ['market', 'type'],
                buckets: [100, 500, 1000, 5000, 10000, 25000, 50000, 100000],
                registers: [this.registry],
            }),
            // Performance metrics
            executionLatency: new prom_client_1.default.Histogram({
                name: 'polymarket_execution_latency_seconds',
                help: 'Time taken to execute trades',
                labelNames: ['operation', 'market'],
                buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
                registers: [this.registry],
            }),
            strategyLatency: new prom_client_1.default.Histogram({
                name: 'polymarket_strategy_latency_seconds',
                help: 'Time taken for strategy calculations',
                labelNames: ['strategy'],
                buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
                registers: [this.registry],
            }),
            riskCheckLatency: new prom_client_1.default.Histogram({
                name: 'polymarket_risk_check_latency_seconds',
                help: 'Time taken for risk checks',
                labelNames: ['check_type'],
                buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
                registers: [this.registry],
            }),
            // Market metrics
            marketPrice: new prom_client_1.default.Gauge({
                name: 'polymarket_market_price',
                help: 'Current market prices',
                labelNames: ['market', 'outcome'],
                registers: [this.registry],
            }),
            marketSpread: new prom_client_1.default.Gauge({
                name: 'polymarket_market_spread',
                help: 'Current market spreads',
                labelNames: ['market'],
                registers: [this.registry],
            }),
            marketLiquidity: new prom_client_1.default.Gauge({
                name: 'polymarket_market_liquidity',
                help: 'Current market liquidity',
                labelNames: ['market', 'outcome'],
                registers: [this.registry],
            }),
            arbitrageOpportunities: new prom_client_1.default.Counter({
                name: 'polymarket_arbitrage_opportunities_total',
                help: 'Number of arbitrage opportunities detected',
                labelNames: ['market', 'threshold'],
                registers: [this.registry],
            }),
            // System metrics
            errors: new prom_client_1.default.Counter({
                name: 'polymarket_errors_total',
                help: 'Total number of errors',
                labelNames: ['type', 'severity'],
                registers: [this.registry],
            }),
            warnings: new prom_client_1.default.Counter({
                name: 'polymarket_warnings_total',
                help: 'Total number of warnings',
                labelNames: ['type'],
                registers: [this.registry],
            }),
            memoryUsage: new prom_client_1.default.Gauge({
                name: 'polymarket_memory_usage_bytes',
                help: 'Memory usage in bytes',
                registers: [this.registry],
            }),
            cpuUsage: new prom_client_1.default.Gauge({
                name: 'polymarket_cpu_usage_percent',
                help: 'CPU usage percentage',
                registers: [this.registry],
            }),
            // Network metrics
            rpcLatency: new prom_client_1.default.Histogram({
                name: 'polymarket_rpc_latency_seconds',
                help: 'RPC call latency',
                labelNames: ['method', 'provider'],
                buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
                registers: [this.registry],
            }),
            websocketReconnections: new prom_client_1.default.Counter({
                name: 'polymarket_websocket_reconnections_total',
                help: 'Number of WebSocket reconnections',
                labelNames: ['market'],
                registers: [this.registry],
            }),
            transactionFailures: new prom_client_1.default.Counter({
                name: 'polymarket_transaction_failures_total',
                help: 'Number of failed transactions',
                labelNames: ['reason', 'market'],
                registers: [this.registry],
            }),
        };
    }
    /**
     * Record trade execution
     */
    recordTrade(trade) {
        this.metrics.totalTrades.inc({
            market: trade.marketId,
            type: trade.type,
            outcome: trade.outcome,
        });
        this.totalOperations++;
        // Determine if trade is winning or losing (simplified)
        if (trade.status === 'CONFIRMED') {
            // This would need proper P&L calculation
            this.metrics.winningTrades.inc({ market: trade.marketId });
        }
    }
    /**
     * Record position update
     */
    recordPosition(position) {
        if (position.status === 'OPEN') {
            this.metrics.openPositions.inc({ market: position.marketId });
            this.metrics.positionSize.observe({
                market: position.marketId,
                type: position.type,
            }, position.size.toNumber());
        }
        else {
            this.metrics.openPositions.dec({ market: position.marketId });
        }
    }
    /**
     * Record market data update
     */
    recordMarketData(marketData) {
        this.metrics.marketPrice.set({ market: marketData.marketId, outcome: 'UP' }, marketData.upPrice.toNumber() / 1e18);
        this.metrics.marketPrice.set({ market: marketData.marketId, outcome: 'DOWN' }, marketData.downPrice.toNumber() / 1e18);
        this.metrics.marketSpread.set({ market: marketData.marketId }, marketData.spread.toNumber() / 1e18);
        this.metrics.marketLiquidity.set({ market: marketData.marketId, outcome: 'UP' }, marketData.liquidity.up.toNumber() / 1e18);
        this.metrics.marketLiquidity.set({ market: marketData.marketId, outcome: 'DOWN' }, marketData.liquidity.down.toNumber() / 1e18);
    }
    /**
     * Record arbitrage opportunity
     */
    recordArbitrageOpportunity(marketId, threshold) {
        this.metrics.arbitrageOpportunities.inc({
            market: marketId,
            threshold: threshold.toString(),
        });
    }
    /**
     * Record execution latency
     */
    recordExecutionLatency(operation, marketId, duration) {
        this.metrics.executionLatency.observe({
            operation,
            market: marketId,
        }, duration / 1000); // Convert to seconds
        this.latencyMeasurements.push(duration);
        if (this.latencyMeasurements.length > 1000) {
            this.latencyMeasurements.shift();
        }
    }
    /**
     * Record strategy latency
     */
    recordStrategyLatency(strategy, duration) {
        this.metrics.strategyLatency.observe({ strategy }, duration / 1000);
    }
    /**
     * Record risk check latency
     */
    recordRiskCheckLatency(checkType, duration) {
        this.metrics.riskCheckLatency.observe({ check_type: checkType }, duration / 1000);
    }
    /**
     * Record error
     */
    recordError(type, severity) {
        this.metrics.errors.inc({ type, severity });
        this.errorCount++;
    }
    /**
     * Record warning
     */
    recordWarning(type) {
        this.metrics.warnings.inc({ type });
    }
    /**
     * Record RPC latency
     */
    recordRpcLatency(method, provider, duration) {
        this.metrics.rpcLatency.observe({ method, provider }, duration / 1000);
    }
    /**
     * Record WebSocket reconnection
     */
    recordWebsocketReconnection(marketId) {
        this.metrics.websocketReconnections.inc({ market: marketId });
    }
    /**
     * Record transaction failure
     */
    recordTransactionFailure(reason, marketId) {
        this.metrics.transactionFailures.inc({ reason, market: marketId });
    }
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(metrics) {
        this.metrics.totalPnL.set({ currency: 'USD' }, metrics.totalPnL.toNumber() / 1e18);
        this.metrics.realizedPnL.set({ currency: 'USD' }, metrics.totalPnL.toNumber() / 1e18);
    }
    /**
     * Update system metrics
     */
    updateSystemMetrics() {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage.set(memUsage.heapUsed);
        // CPU usage would need more complex monitoring
        // this.metrics.cpuUsage.set(cpuUsage);
    }
    /**
     * Get metrics for Prometheus
     */
    getMetrics() {
        return this.registry.metrics();
    }
    /**
     * Get performance snapshot
     */
    getSnapshot() {
        const avgLatency = this.latencyMeasurements.length > 0
            ? this.latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / this.latencyMeasurements.length
            : 0;
        const errorRate = this.totalOperations > 0 ? this.errorCount / this.totalOperations : 0;
        return {
            timestamp: Date.now(),
            totalTrades: this.metrics.totalTrades.get(),
            winningTrades: this.metrics.winningTrades.get(),
            losingTrades: this.metrics.losingTrades.get(),
            totalPnL: this.metrics.totalPnL.get(),
            unrealizedPnL: this.metrics.unrealizedPnL.get(),
            openPositions: this.metrics.openPositions.get(),
            totalExposure: this.metrics.totalExposure.get(),
            averageLatency: avgLatency,
            errorRate,
        };
    }
    /**
     * Get historical snapshots
     */
    getSnapshots(limit) {
        if (limit) {
            return this.snapshots.slice(-limit);
        }
        return this.snapshots;
    }
    /**
     * Start periodic collection
     */
    startPeriodicCollection() {
        setInterval(() => {
            this.updateSystemMetrics();
            this.takeSnapshot();
        }, 10000); // Every 10 seconds
    }
    /**
     * Take performance snapshot
     */
    takeSnapshot() {
        const snapshot = this.getSnapshot();
        this.snapshots.push(snapshot);
        // Keep only last 1000 snapshots
        if (this.snapshots.length > 1000) {
            this.snapshots.shift();
        }
        this.emit('snapshot', snapshot);
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.registry.clear();
        this.initializeMetrics();
        this.snapshots = [];
        this.latencyMeasurements = [];
        this.errorCount = 0;
        this.totalOperations = 0;
    }
    /**
     * Get registry for external use
     */
    getRegistry() {
        return this.registry;
    }
}
exports.MetricsCollector = MetricsCollector;
// Singleton instance
exports.metricsCollector = new MetricsCollector();
//# sourceMappingURL=MetricsCollector.js.map