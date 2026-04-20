import winston from 'winston';
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

export class Logger {
  private logger: winston.Logger;
  private performanceLogs: Map<string, number[]> = new Map();

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
      defaultMeta: { service: 'polymarket-hft' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ],
    });
  }

  /**
   * Log trade execution
   */
  logTrade(trade: Trade, context?: LogContext): void {
    this.logger.info('Trade executed', {
      event: 'TRADE_EXECUTED',
      tradeId: trade.id,
      marketId: trade.marketId,
      type: trade.type,
      outcome: trade.outcome,
      size: trade.size.toString(),
      price: trade.price.toString(),
      fee: trade.fee.toString(),
      status: trade.status,
      txHash: trade.txHash,
      timestamp: trade.timestamp,
      ...context,
    });
  }

  /**
   * Log position changes
   */
  logPosition(position: Position, action: 'OPENED' | 'CLOSED' | 'MODIFIED', context?: LogContext): void {
    this.logger.info(`Position ${action}`, {
      event: `POSITION_${action}`,
      positionId: position.id,
      marketId: position.marketId,
      type: position.type,
      size: position.size.toString(),
      averagePrice: position.averagePrice.toString(),
      unrealizedPnL: position.unrealizedPnL.toString(),
      realizedPnL: position.realizedPnL.toString(),
      status: position.status,
      timestamp: position.timestamp,
      ...context,
    });
  }

  /**
   * Log market data updates
   */
  logMarketData(marketData: MarketData, context?: LogContext): void {
    this.logger.debug('Market data update', {
      event: 'MARKET_DATA_UPDATE',
      marketId: marketData.marketId,
      upPrice: marketData.upPrice.toString(),
      downPrice: marketData.downPrice.toString(),
      sum: marketData.sum.toString(),
      spread: marketData.spread.toString(),
      volume: marketData.volume.toString(),
      liquidity: {
        up: marketData.liquidity.up.toString(),
        down: marketData.liquidity.down.toString(),
      },
      timestamp: marketData.timestamp,
      ...context,
    });
  }

  /**
   * Log strategy signals
   */
  logStrategySignal(signal: any, context?: LogContext): void {
    this.logger.info('Strategy signal generated', {
      event: 'STRATEGY_SIGNAL',
      marketId: signal.marketId,
      signal: signal.signal,
      confidence: signal.confidence,
      expectedProfit: signal.expectedProfit.toString(),
      risk: signal.risk.toString(),
      reason: signal.reason,
      timestamp: signal.timestamp,
      ...context,
    });
  }

  /**
   * Log risk alerts
   */
  logRiskAlert(alert: RiskAlert, context?: LogContext): void {
    this.logger.warn('Risk alert', {
      event: 'RISK_ALERT',
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      metadata: alert.metadata,
      ...context,
    });

    if (alert.severity === 'CRITICAL') {
      this.logger.error('CRITICAL RISK ALERT', {
        event: 'CRITICAL_RISK_ALERT',
        ...alert,
        ...context,
      });
    }
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(metrics: PerformanceMetrics, context?: LogContext): void {
    this.logger.info('Performance metrics', {
      event: 'PERFORMANCE_METRICS',
      totalTrades: metrics.totalTrades,
      winningTrades: metrics.winningTrades,
      losingTrades: metrics.losingTrades,
      totalPnL: metrics.totalPnL.toString(),
      averageWin: metrics.averageWin.toString(),
      averageLoss: metrics.averageLoss.toString(),
      profitFactor: metrics.profitFactor,
      maxConsecutiveLosses: metrics.maxConsecutiveLosses,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      calmarRatio: metrics.calmarRatio,
      timestamp: metrics.timestamp,
      ...context,
    });
  }

  /**
   * Log execution performance
   */
  logExecutionPerformance(operation: string, duration: number, context?: LogContext): void {
    const key = `execution_${operation}`;
    
    if (!this.performanceLogs.has(key)) {
      this.performanceLogs.set(key, []);
    }
    
    const durations = this.performanceLogs.get(key)!;
    durations.push(duration);
    
    // Keep only last 1000 measurements
    if (durations.length > 1000) {
      durations.shift();
    }
    
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);
    
    this.logger.debug('Execution performance', {
      event: 'EXECUTION_PERFORMANCE',
      operation,
      duration,
      average: avg,
      max,
      min,
      samples: durations.length,
      ...context,
    });

    // Log warning if execution is slow
    if (duration > avg * 2) {
      this.logger.warn('Slow execution detected', {
        event: 'SLOW_EXECUTION',
        operation,
        duration,
        average: avg,
        ...context,
      });
    }
  }

  /**
   * Log system errors
   */
  logError(error: Error, context?: LogContext): void {
    this.logger.error('System error', {
      event: 'SYSTEM_ERROR',
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: Date.now(),
      ...context,
    });
  }

  /**
   * Log trading errors
   */
  logTradingError(error: any, context?: LogContext): void {
    this.logger.error('Trading error', {
      event: 'TRADING_ERROR',
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: Date.now(),
      ...context,
    });
  }

  /**
   * Log network issues
   */
  logNetworkIssue(issue: string, context?: LogContext): void {
    this.logger.warn('Network issue', {
      event: 'NETWORK_ISSUE',
      issue,
      timestamp: Date.now(),
      ...context,
    });
  }

  /**
   * Log arbitrage opportunities
   */
  logArbitrageOpportunity(opportunity: any, context?: LogContext): void {
    this.logger.info('Arbitrage opportunity detected', {
      event: 'ARBITRAGE_OPPORTUNITY',
      marketId: opportunity.marketId,
      upPrice: opportunity.upPrice.toString(),
      downPrice: opportunity.downPrice.toString(),
      sum: opportunity.sum.toString(),
      inefficiency: opportunity.inefficiency.toString(),
      threshold: opportunity.threshold,
      expectedProfit: opportunity.expectedProfit.toString(),
      timestamp: opportunity.timestamp,
      ...context,
    });
  }

  /**
   * Log hedge operations
   */
  logHedgeOperation(marketId: string, hedgeType: string, size: ethers.BigNumber, context?: LogContext): void {
    this.logger.info('Hedge operation', {
      event: 'HEDGE_OPERATION',
      marketId,
      hedgeType,
      size: size.toString(),
      timestamp: Date.now(),
      ...context,
    });
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): { [operation: string]: { avg: number; max: number; min: number; samples: number } } {
    const stats: { [operation: string]: { avg: number; max: number; min: number; samples: number } } = {};
    
    for (const [key, durations] of this.performanceLogs) {
      const operation = key.replace('execution_', '');
      stats[operation] = {
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        max: Math.max(...durations),
        min: Math.min(...durations),
        samples: durations.length,
      };
    }
    
    return stats;
  }

  /**
   * Clear performance logs
   */
  clearPerformanceLogs(): void {
    this.performanceLogs.clear();
  }

  /**
   * Create child logger with context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  /**
   * Set log level
   */
  setLevel(level: string): void {
    this.logger.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): string {
    return this.logger.level;
  }
}

// Singleton instance
export const logger = new Logger();
