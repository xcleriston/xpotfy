import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { MarketData, Position, Trade, PerformanceMetrics, StrategySignal, ExecutionRequest, ExecutionResult } from '@/types';
interface BacktestConfig {
    startDate: Date;
    endDate: Date;
    initialCapital: ethers.BigNumber;
    commissionRate: number;
    slippageModel: 'FIXED' | 'PERCENTAGE' | 'DYNAMIC';
    latencyModel: 'ZERO' | 'FIXED' | 'REALISTIC';
    marketImpactModel: 'NONE' | 'LINEAR' | 'SQUARE_ROOT';
}
interface BacktestResult {
    metrics: PerformanceMetrics;
    trades: Trade[];
    positions: Position[];
    equityCurve: {
        timestamp: number;
        equity: ethers.BigNumber;
    }[];
    drawdowns: {
        timestamp: number;
        drawdown: ethers.BigNumber;
        percentage: number;
    }[];
    dailyReturns: {
        date: string;
        return: number;
    }[];
    opportunityAnalysis: {
        totalOpportunities: number;
        capturedOpportunities: number;
        averageProfit: ethers.BigNumber;
        averageInefficiency: number;
    };
}
export declare class Backtester extends EventEmitter {
    private config;
    private markets;
    private currentPosition;
    private trades;
    private equity;
    private peakEquity;
    private equityCurve;
    private drawdowns;
    constructor(config: BacktestConfig);
    /**
     * Load historical market data
     */
    loadMarketData(marketId: string, data: MarketData[]): Promise<void>;
    /**
     * Run backtest simulation
     */
    runBacktest(strategy: (marketData: MarketData) => StrategySignal[], execution: (request: ExecutionRequest) => Promise<ExecutionResult>): Promise<BacktestResult>;
    /**
     * Run Monte Carlo simulation
     */
    runMonteCarlo(iterations: number | undefined, strategy: (marketData: MarketData) => StrategySignal[], execution: (request: ExecutionRequest) => Promise<ExecutionResult>): Promise<{
        averageMetrics: PerformanceMetrics;
        confidenceIntervals: {
            totalPnL: {
                lower: number;
                upper: number;
            };
            sharpeRatio: {
                lower: number;
                upper: number;
            };
            maxDrawdown: {
                lower: number;
                upper: number;
            };
            winRate: {
                lower: number;
                upper: number;
            };
        };
    }>;
    /**
     * Analyze market opportunities
     */
    analyzeOpportunities(): {
        totalOpportunities: number;
        capturedOpportunities: number;
        averageProfit: ethers.BigNumber;
        averageInefficiency: number;
        distribution: {
            threshold: number;
            count: number;
            avgProfit: ethers.BigNumber;
        }[];
    };
    /**
     * Get all market data sorted by timestamp
     */
    private getAllMarketDataSorted;
    /**
     * Update positions with new market data
     */
    private updatePositions;
    /**
     * Execute strategy signal
     */
    private executeSignal;
    /**
     * Create execution request from signal
     */
    private createExecutionRequest;
    /**
     * Calculate position size based on signal and current equity
     */
    private calculatePositionSize;
    /**
     * Calculate slippage based on size and market conditions
     */
    private calculateSlippage;
    /**
     * Update position from trade
     */
    private updatePositionFromTrade;
    /**
     * Update equity curve
     */
    private updateEquityCurve;
    /**
     * Update drawdowns
     */
    private updateDrawdowns;
    /**
     * Close all positions at the end
     */
    private closeAllPositions;
    /**
     * Generate backtest results
     */
    private generateResults;
    /**
     * Calculate performance metrics
     */
    private calculatePerformanceMetrics;
    /**
     * Calculate daily returns
     */
    private calculateDailyReturns;
    /**
     * Calculate maximum consecutive losses
     */
    private calculateMaxConsecutiveLosses;
    /**
     * Calculate Sharpe ratio
     */
    private calculateSharpeRatio;
    /**
     * Calculate Sortino ratio
     */
    private calculateSortinoRatio;
    /**
     * Calculate Calmar ratio
     */
    private calculateCalmarRatio;
    /**
     * Calculate Monte Carlo statistics
     */
    private calculateMonteCarloStatistics;
    /**
     * Simulate liquidity based on price and volume
     */
    private simulateLiquidity;
    /**
     * Add market noise for Monte Carlo simulation
     */
    private addMarketNoise;
    /**
     * Reset state for new iteration
     */
    private resetState;
    /**
     * Generate unique trade ID
     */
    private generateTradeId;
    /**
     * Generate unique position ID
     */
    private generatePositionId;
}
export {};
//# sourceMappingURL=Backtester.d.ts.map