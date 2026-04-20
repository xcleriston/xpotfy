import { BigNumber } from 'ethers';
export interface Market {
    id: string;
    question: string;
    description: string;
    outcomeTokens: {
        [outcomeId: string]: OutcomeToken;
    };
    liquidity: BigNumber;
    volume24h: BigNumber;
    resolutionTime: number;
    isActive: boolean;
}
export interface OutcomeToken {
    id: string;
    outcome: string;
    price: BigNumber;
    supply: BigNumber;
    address: string;
}
export interface BinaryMarket extends Market {
    outcomeTokens: {
        UP: OutcomeToken;
        DOWN: OutcomeToken;
    };
    timeWindow: number;
    underlyingAsset?: string;
}
export interface MarketData {
    marketId: string;
    timestamp: number;
    upPrice: BigNumber;
    downPrice: BigNumber;
    sum: BigNumber;
    spread: BigNumber;
    volume: BigNumber;
    liquidity: {
        up: BigNumber;
        down: BigNumber;
    };
    orderBook?: OrderBook;
}
export interface OrderBook {
    bids: OrderLevel[];
    asks: OrderLevel[];
    timestamp: number;
}
export interface OrderLevel {
    price: BigNumber;
    size: BigNumber;
    timestamp: number;
}
export interface Position {
    id: string;
    marketId: string;
    type: 'UP' | 'DOWN';
    size: BigNumber;
    averagePrice: BigNumber;
    unrealizedPnL: BigNumber;
    realizedPnL: BigNumber;
    timestamp: number;
    status: 'OPEN' | 'CLOSED' | 'CLOSING';
}
export interface Trade {
    id: string;
    marketId: string;
    type: 'BUY' | 'SELL';
    outcome: 'UP' | 'DOWN';
    size: BigNumber;
    price: BigNumber;
    fee: BigNumber;
    timestamp: number;
    txHash?: string;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}
export interface StrategySignal {
    marketId: string;
    signal: 'BUY_UP' | 'BUY_DOWN' | 'HEDGE_UP' | 'HEDGE_DOWN' | 'CLOSE_ALL';
    confidence: number;
    expectedProfit: BigNumber;
    risk: BigNumber;
    timestamp: number;
    reason: string;
    metadata?: Record<string, any>;
}
export interface Opportunity {
    marketId: string;
    upPrice: BigNumber;
    downPrice: BigNumber;
    sum: BigNumber;
    inefficiency: BigNumber;
    threshold: number;
    timestamp: number;
    expectedProfit: BigNumber;
    risk: BigNumber;
    liquidity: {
        up: BigNumber;
        down: BigNumber;
    };
}
export interface RiskLimits {
    maxPositionSize: BigNumber;
    maxExposurePerMarket: BigNumber;
    maxTotalExposure: BigNumber;
    maxSlippage: number;
    stopLossPercentage: number;
    hedgeTimeout: number;
    maxOpenPositions: number;
}
export interface RiskMetrics {
    totalExposure: BigNumber;
    openPositions: number;
    unrealizedPnL: BigNumber;
    dailyPnL: BigNumber;
    maxDrawdown: BigNumber;
    sharpeRatio: number;
    winRate: number;
}
export interface ExecutionRequest {
    marketId: string;
    outcome: 'UP' | 'DOWN';
    type: 'BUY' | 'SELL';
    size: BigNumber;
    maxPrice?: BigNumber;
    minPrice?: BigNumber;
    deadline: number;
    gasLimit?: BigNumber;
    gasPrice?: BigNumber;
}
export interface ExecutionResult {
    success: boolean;
    tradeId?: string;
    txHash?: string;
    executedPrice?: BigNumber;
    executedSize?: BigNumber;
    fee?: BigNumber;
    error?: string;
    executionTime: number;
}
export interface BotConfig {
    rpc: {
        alchemyUrl: string;
        polygonRpcUrl: string;
    };
    markets: {
        monitoredMarkets: string[];
        minLiquidity: BigNumber;
        maxSpread: number;
    };
    strategy: {
        thresholds: number[];
        positionSizing: 'FIXED' | 'KELLY' | 'VOLATILITY';
        baseSize: BigNumber;
        maxLeverage: number;
    };
    risk: RiskLimits;
    execution: {
        maxGasPrice: BigNumber;
        maxSlippage: number;
        confirmationBlocks: number;
    };
}
export interface PerformanceMetrics {
    timestamp: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalPnL: BigNumber;
    averageWin: BigNumber;
    averageLoss: BigNumber;
    profitFactor: number;
    maxConsecutiveLosses: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
}
export interface MarketEvent {
    type: 'PRICE_UPDATE' | 'LIQUIDITY_CHANGE' | 'TRADE' | 'ORDER_BOOK_UPDATE';
    marketId: string;
    timestamp: number;
    data: any;
}
export interface PositionEvent {
    type: 'OPENED' | 'CLOSED' | 'MODIFIED' | 'STOP_LOSS' | 'TAKE_PROFIT';
    positionId: string;
    timestamp: number;
    data: any;
}
export interface DatabasePosition extends Position {
    createdAt: Date;
    updatedAt: Date;
}
export interface DatabaseTrade extends Trade {
    createdAt: Date;
    updatedAt: Date;
}
export interface DatabaseMarketData extends MarketData {
    id: string;
    createdAt: Date;
}
export declare class TradingError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class RiskError extends TradingError {
    constructor(message: string, details?: any);
}
export declare class ExecutionError extends TradingError {
    constructor(message: string, details?: any);
}
//# sourceMappingURL=index.d.ts.map