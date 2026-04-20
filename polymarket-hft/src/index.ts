import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { MarketDataEngine } from '@/engines/MarketDataEngine';
import { ExecutionEngine } from '@/engines/ExecutionEngine';
import { StrategyEngine } from '@/engines/StrategyEngine';
import { RiskManager } from '@/managers/RiskManager';
import { PositionManager } from '@/managers/PositionManager';
import { Backtester } from '@/backtesting/Backtester';
import { logger } from '@/monitoring/Logger';
import { metricsCollector } from '@/monitoring/MetricsCollector';
import { config } from '@/config';
import { 
  StrategySignal, 
  ExecutionRequest, 
  ExecutionResult, 
  MarketData, 
  Position, 
  Trade 
} from '@/types';

interface BotState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number;
  lastActivity: number;
  totalTrades: number;
  totalPnL: ethers.BigNumber;
  errors: number;
}

export class PolymarketHFTBot extends EventEmitter {
  private state: BotState;
  private marketDataEngine: MarketDataEngine;
  private executionEngine: ExecutionEngine;
  private strategyEngine: StrategyEngine;
  private riskManager: RiskManager;
  private positionManager: PositionManager;
  private backtester: Backtester;

  constructor(privateKey: string) {
    super();
    
    this.state = {
      isRunning: false,
      isPaused: false,
      startTime: 0,
      lastActivity: 0,
      totalTrades: 0,
      totalPnL: ethers.BigNumber.from(0),
      errors: 0,
    };

    // Initialize components
    this.marketDataEngine = new MarketDataEngine();
    this.executionEngine = new ExecutionEngine(privateKey);
    this.strategyEngine = new StrategyEngine();
    this.riskManager = new RiskManager();
    this.positionManager = new PositionManager();

    // Setup event handlers
    this.setupEventHandlers();
    
    logger.info('Polymarket HFT Bot initialized', {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  /**
   * Start the trading bot
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    try {
      logger.info('Starting Polymarket HFT Bot...');
      
      // Start strategy engine
      this.strategyEngine.start();
      
      // Subscribe to markets
      for (const marketId of config.markets.monitoredMarkets) {
        await this.marketDataEngine.subscribeToMarket(marketId);
        logger.info('Subscribed to market', { marketId });
      }
      
      this.state.isRunning = true;
      this.state.startTime = Date.now();
      this.state.lastActivity = Date.now();
      
      this.emit('started');
      logger.info('Bot started successfully', {
        markets: config.markets.monitoredMarkets.length,
        strategy: config.strategy.positionSizing,
        riskLimits: config.risk,
      });
      
    } catch (error) {
      this.state.errors++;
      logger.logError(error as Error, { context: 'bot_start' });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the trading bot
   */
  async stop(): Promise<void> {
    if (!this.state.isRunning) {
      return;
    }

    try {
      logger.info('Stopping Polymarket HFT Bot...');
      
      // Stop strategy engine
      this.strategyEngine.stop();
      
      // Unsubscribe from all markets
      for (const marketId of config.markets.monitoredMarkets) {
        this.marketDataEngine.unsubscribeFromMarket(marketId);
      }
      
      // Close all open positions
      await this.closeAllPositions();
      
      this.state.isRunning = false;
      
      this.emit('stopped');
      logger.info('Bot stopped successfully', {
        runtime: Date.now() - this.state.startTime,
        totalTrades: this.state.totalTrades,
        totalPnL: this.state.totalPnL.toString(),
        errors: this.state.errors,
      });
      
    } catch (error) {
      this.state.errors++;
      logger.logError(error as Error, { context: 'bot_stop' });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Pause trading (keep monitoring)
   */
  pause(): void {
    if (!this.state.isRunning || this.state.isPaused) {
      return;
    }
    
    this.state.isPaused = true;
    this.emit('paused');
    logger.info('Bot paused');
  }

  /**
   * Resume trading
   */
  resume(): void {
    if (!this.state.isRunning || !this.state.isPaused) {
      return;
    }
    
    this.state.isPaused = false;
    this.emit('resumed');
    logger.info('Bot resumed');
  }

  /**
   * Get current bot state
   */
  getState(): BotState {
    return { ...this.state };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): any {
    const strategyMetrics = this.strategyEngine.getMetrics();
    const riskMetrics = this.riskManager.getRiskMetrics();
    const positionMetrics = this.positionManager.getPerformanceMetrics();
    
    return {
      bot: this.state,
      strategy: strategyMetrics,
      risk: riskMetrics,
      positions: positionMetrics,
      system: metricsCollector.getSnapshot(),
    };
  }

  /**
   * Run backtest
   */
  async runBacktest(
    startDate: Date,
    endDate: Date,
    initialCapital: ethers.BigNumber
  ): Promise<any> {
    logger.info('Starting backtest', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      initialCapital: initialCapital.toString(),
    });

    const backtester = new Backtester({
      startDate,
      endDate,
      initialCapital,
      commissionRate: 0.001, // 0.1%
      slippageModel: 'DYNAMIC',
      latencyModel: 'REALISTIC',
      marketImpactModel: 'SQUARE_ROOT',
    });

    // Load historical data (this would need to be implemented)
    // await backtester.loadMarketData('market_1', historicalData);

    const strategy = (marketData: MarketData) => {
      return this.strategyEngine.generateSignals(marketData);
    };

    const execution = async (request: ExecutionRequest): Promise<ExecutionResult> => {
      return this.executionEngine.execute(request);
    };

    const results = await backtester.runBacktest(strategy, execution);
    
    logger.info('Backtest completed', {
      totalTrades: results.metrics.totalTrades,
      totalPnL: results.metrics.totalPnL.toString(),
      sharpeRatio: results.metrics.sharpeRatio,
      maxDrawdown: results.metrics.maxDrawdown.toString(),
    });

    return results;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Market data events
    this.marketDataEngine.on('marketData', (marketData: MarketData) => {
      this.state.lastActivity = Date.now();
      metricsCollector.recordMarketData(marketData);
      logger.logMarketData(marketData);
      
      if (!this.state.isPaused) {
        this.strategyEngine.processMarketData(marketData);
        this.positionManager.updateAllPositions(marketData);
      }
    });

    this.marketDataEngine.on('opportunity', (opportunity: any) => {
      metricsCollector.recordArbitrageOpportunity(opportunity.marketId, opportunity.threshold);
      logger.logArbitrageOpportunity(opportunity);
      
      if (!this.state.isPaused) {
        this.strategyEngine.processOpportunity(opportunity);
      }
    });

    this.marketDataEngine.on('staleData', (data: any) => {
      logger.logNetworkIssue(`Stale market data for ${data.marketId}`, data);
      metricsCollector.recordWarning('stale_data');
    });

    // Strategy events
    this.strategyEngine.on('signal', async (signal: StrategySignal) => {
      logger.logStrategySignal(signal);
      
      if (!this.state.isPaused) {
        await this.executeSignal(signal);
      }
    });

    this.strategyEngine.on('positionUpdate', (data: any) => {
      this.emit('positionUpdate', data);
    });

    // Risk events
    this.riskManager.on('riskAlert', (alert: any) => {
      logger.logRiskAlert(alert);
      metricsCollector.recordError(alert.type, alert.severity);
      
      if (alert.severity === 'CRITICAL') {
        this.pause();
        this.emit('criticalRisk', alert);
      }
    });

    this.riskManager.on('stopLoss', async (data: any) => {
      logger.warn('Stop loss triggered', data);
      await this.closePosition(data.positionId);
    });

    this.riskManager.on('hedgeTimeout', async (data: any) => {
      logger.warn('Hedge timeout', data);
      await this.handleHedgeTimeout(data);
    });

    // Position events
    this.positionManager.on('positionOpened', (position: Position) => {
      this.riskManager.addPosition(position);
      logger.logPosition(position, 'OPENED');
      this.emit('positionOpened', position);
    });

    this.positionManager.on('positionClosed', (data: any) => {
      this.riskManager.removePosition(data.position.id, data.realizedPnL);
      logger.logPosition(data.position, 'CLOSED');
      this.emit('positionClosed', data);
    });

    // Error handling
    this.on('error', (error: any) => {
      this.state.errors++;
      logger.logError(error);
      metricsCollector.recordError('system', 'HIGH');
    });
  }

  /**
   * Execute strategy signal
   */
  private async executeSignal(signal: StrategySignal): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Create execution request
      const request: ExecutionRequest = {
        marketId: signal.marketId,
        outcome: signal.signal.includes('UP') ? 'UP' : 'DOWN',
        type: signal.signal.includes('BUY') ? 'BUY' : 'SELL',
        size: signal.expectedProfit, // This should be calculated properly
        deadline: Date.now() + 30000, // 30 seconds
      };

      // Validate with risk manager
      await this.riskManager.validateTrade({
        id: 'temp',
        marketId: request.marketId,
        type: request.type,
        outcome: request.outcome,
        size: request.size,
        price: ethers.BigNumber.from(0), // Will be set by execution
        fee: ethers.BigNumber.from(0), // Will be set by execution
        timestamp: Date.now(),
        status: 'PENDING',
      });

      // Execute trade
      const result = await this.executionEngine.execute(request);
      
      if (result.success) {
        this.state.totalTrades++;
        this.state.lastActivity = Date.now();
        
        // Create trade record
        const trade: Trade = {
          id: result.tradeId || 'unknown',
          marketId: request.marketId,
          type: request.type,
          outcome: request.outcome,
          size: result.executedSize || request.size,
          price: result.executedPrice || ethers.BigNumber.from(0),
          fee: result.fee || ethers.BigNumber.from(0),
          timestamp: Date.now(),
          txHash: result.txHash,
          status: 'CONFIRMED',
        };

        // Update position manager
        const marketData = this.marketDataEngine.getMarketData(request.marketId);
        if (marketData) {
          const existingPosition = this.positionManager.getMarketPositions(request.marketId)
            .find(p => p.type === request.outcome && p.status === 'OPEN');
          
          if (existingPosition) {
            this.positionManager.updatePosition(existingPosition.id, trade, marketData);
          } else {
            this.positionManager.createPosition(trade, marketData);
          }
        }

        logger.logTrade(trade);
        metricsCollector.recordTrade(trade);
        metricsCollector.recordExecutionLatency('trade_execution', request.marketId, Date.now() - startTime);
        
        // Update risk manager
        this.riskManager.updateRiskMetrics(trade, marketData);
      } else {
        logger.logTradingError(result.error || 'Unknown error');
        metricsCollector.recordTransactionFailure(result.error || 'unknown', request.marketId);
      }

    } catch (error) {
      this.state.errors++;
      logger.logTradingError(error);
      metricsCollector.recordError('trade_execution', 'HIGH');
    }
  }

  /**
   * Close specific position
   */
  private async closePosition(positionId: string): Promise<void> {
    try {
      const position = this.positionManager.getPosition(positionId);
      if (!position) {
        return;
      }

      const marketData = this.marketDataEngine.getMarketData(position.marketId);
      if (!marketData) {
        return;
      }

      const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
      
      const request: ExecutionRequest = {
        marketId: position.marketId,
        outcome: position.type,
        type: 'SELL',
        size: position.size,
        deadline: Date.now() + 30000,
      };

      const result = await this.executionEngine.execute(request);
      
      if (result.success && result.executedSize && result.executedPrice) {
        this.positionManager.closePosition(
          positionId,
          result.executedSize,
          result.executedPrice,
          marketData
        );
      }

    } catch (error) {
      logger.logError(error as Error, { positionId });
    }
  }

  /**
   * Close all positions
   */
  private async closeAllPositions(): Promise<void> {
    const openPositions = this.positionManager.getOpenPositions();
    
    for (const position of openPositions) {
      await this.closePosition(position.id);
    }
  }

  /**
   * Handle hedge timeout
   */
  private async handleHedgeTimeout(data: any): Promise<void> {
    logger.warn('Handling hedge timeout', data);
    
    // Emergency close all positions in the market
    const marketPositions = this.positionManager.getMarketPositions(data.marketId);
    
    for (const position of marketPositions) {
      if (position.status === 'OPEN') {
        await this.closePosition(position.id);
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.stop();
      
      this.marketDataEngine.cleanup();
      this.riskManager.cleanup();
      this.positionManager.cleanup();
      
      logger.info('Bot cleanup completed');
      
    } catch (error) {
      logger.logError(error as Error, { context: 'cleanup' });
    }
  }
}

// Main execution function
async function main(): Promise<void> {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('PRIVATE_KEY environment variable is required');
    process.exit(1);
  }

  const bot = new PolymarketHFTBot(privateKey);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await bot.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await bot.cleanup();
    process.exit(0);
  });

  try {
    await bot.start();
    
    // Keep the process running
    console.log('Bot is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { PolymarketHFTBot };
