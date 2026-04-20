import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { 
  RiskLimits, 
  RiskMetrics, 
  Position, 
  Trade, 
  MarketData,
  RiskError,
  TradingError 
} from '@/types';
import { config } from '@/config';

interface RiskState {
  totalExposure: ethers.BigNumber;
  marketExposure: Map<string, ethers.BigNumber>;
  openPositions: Position[];
  dailyPnL: ethers.BigNumber;
  maxDrawdown: ethers.BigNumber;
  peakEquity: ethers.BigNumber;
  consecutiveLosses: number;
  lastRiskCheck: number;
  riskAlerts: RiskAlert[];
}

interface RiskAlert {
  type: 'EXPOSURE_LIMIT' | 'DRAWDOWN_LIMIT' | 'CONSECUTIVE_LOSSES' | 'LIQUIDITY_RISK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: number;
  metadata?: any;
}

export class RiskManager extends EventEmitter {
  private state: RiskState;
  private riskCheckInterval: NodeJS.Timeout | null = null;
  private readonly DAILY_PNL_RESET_HOUR = 0; // UTC midnight
  
  constructor() {
    super();
    this.state = this.initializeState();
    this.startRiskMonitoring();
  }

  /**
   * Validate trade before execution
   */
  async validateTrade(trade: Omit<Trade, 'id' | 'timestamp' | 'txHash' | 'status'>): Promise<void> {
    // Check position size limits
    if (trade.size.gt(config.risk.maxPositionSize)) {
      throw new RiskError(`Trade size ${trade.size.toString()} exceeds maximum ${config.risk.maxPositionSize.toString()}`);
    }

    // Check market exposure limits
    const currentMarketExposure = this.state.marketExposure.get(trade.marketId) || ethers.BigNumber.from(0);
    const newMarketExposure = trade.type === 'BUY' 
      ? currentMarketExposure.add(trade.size)
      : currentMarketExposure.sub(trade.size);

    if (newMarketExposure.gt(config.risk.maxExposurePerMarket)) {
      throw new RiskError(`Market exposure ${newMarketExposure.toString()} exceeds maximum ${config.risk.maxExposurePerMarket.toString()}`);
    }

    // Check total exposure limits
    const newTotalExposure = trade.type === 'BUY'
      ? this.state.totalExposure.add(trade.size)
      : this.state.totalExposure.sub(trade.size);

    if (newTotalExposure.gt(config.risk.maxTotalExposure)) {
      throw new RiskError(`Total exposure ${newTotalExposure.toString()} exceeds maximum ${config.risk.maxTotalExposure.toString()}`);
    }

    // Check position count limits
    if (trade.type === 'BUY' && this.state.openPositions.length >= config.risk.maxOpenPositions) {
      throw new RiskError(`Open positions ${this.state.openPositions.length} exceeds maximum ${config.risk.maxOpenPositions}`);
    }

    // Check slippage limits
    const slippage = trade.price.mul(config.risk.maxSlippage * 10000).div(10000);
    if (slippage.gt(trade.price)) {
      throw new RiskError(`Slippage exceeds maximum allowed limit`);
    }
  }

  /**
   * Validate position for risk management
   */
  validatePosition(position: Position, marketData: MarketData): void {
    // Check stop-loss
    const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
    const priceChange = currentPrice.sub(position.averagePrice).abs()
      .mul(100).div(position.averagePrice);

    if (priceChange.gt(config.risk.stopLossPercentage * 10000)) {
      this.emit('stopLoss', {
        positionId: position.id,
        marketId: position.marketId,
        priceChange: priceChange.toNumber() / 100,
        reason: 'Stop loss triggered'
      });
    }

    // Check position age
    const positionAge = Date.now() - position.timestamp;
    const maxAge = 300000; // 5 minutes

    if (positionAge > maxAge) {
      this.emit('positionTimeout', {
        positionId: position.id,
        marketId: position.marketId,
        age: positionAge,
        reason: 'Position timeout'
      });
    }

    // Check hedge timeout
    const marketPositions = this.state.openPositions.filter(p => p.marketId === position.marketId);
    const upPositions = marketPositions.filter(p => p.type === 'UP');
    const downPositions = marketPositions.filter(p => p.type === 'DOWN');

    if ((upPositions.length > 0 && downPositions.length === 0) || 
        (downPositions.length > 0 && upPositions.length === 0)) {
      const timeSinceHedge = Date.now() - position.timestamp;
      if (timeSinceHedge > config.risk.hedgeTimeout) {
        this.emit('hedgeTimeout', {
          marketId: position.marketId,
          positionId: position.id,
          timeSinceHedge,
          reason: 'Hedge timeout exceeded'
        });
      }
    }
  }

  /**
   * Update risk metrics after trade
   */
  updateRiskMetrics(trade: Trade, marketData?: MarketData): void {
    // Update exposure
    if (trade.type === 'BUY') {
      this.state.totalExposure = this.state.totalExposure.add(trade.size);
      const marketExposure = this.state.marketExposure.get(trade.marketId) || ethers.BigNumber.from(0);
      this.state.marketExposure.set(trade.marketId, marketExposure.add(trade.size));
    } else {
      this.state.totalExposure = this.state.totalExposure.sub(trade.size);
      const marketExposure = this.state.marketExposure.get(trade.marketId) || ethers.BigNumber.from(0);
      this.state.marketExposure.set(trade.marketId, marketExposure.sub(trade.size));
    }

    // Update daily P&L
    this.state.dailyPnL = this.state.dailyPnL.add(trade.fee.mul(-1)); // Subtract fees

    // Update drawdown
    const currentEquity = this.state.totalExposure.add(this.state.dailyPnL);
    if (currentEquity.gt(this.state.peakEquity)) {
      this.state.peakEquity = currentEquity;
    } else {
      const drawdown = this.state.peakEquity.sub(currentEquity);
      if (drawdown.gt(this.state.maxDrawdown)) {
        this.state.maxDrawdown = drawdown;
      }
    }

    // Check for risk alerts
    this.checkRiskLimits();
  }

  /**
   * Add new position to risk tracking
   */
  addPosition(position: Position): void {
    this.state.openPositions.push(position);
    this.state.lastRiskCheck = Date.now();
  }

  /**
   * Remove position from risk tracking
   */
  removePosition(positionId: string, realizedPnL?: ethers.BigNumber): void {
    const index = this.state.openPositions.findIndex(p => p.id === positionId);
    if (index >= 0) {
      const position = this.state.openPositions[index];
      this.state.openPositions.splice(index, 1);

      // Update consecutive losses
      if (realizedPnL && realizedPnL.lt(0)) {
        this.state.consecutiveLosses++;
      } else {
        this.state.consecutiveLosses = 0;
      }

      // Update daily P&L
      if (realizedPnL) {
        this.state.dailyPnL = this.state.dailyPnL.add(realizedPnL);
      }
    }
  }

  /**
   * Check all risk limits and emit alerts
   */
  private checkRiskLimits(): void {
    const alerts: RiskAlert[] = [];

    // Check total exposure
    const exposureRatio = this.state.totalExposure.mul(100).div(config.risk.maxTotalExposure);
    if (exposureRatio.gt(90)) {
      alerts.push({
        type: 'EXPOSURE_LIMIT',
        severity: exposureRatio.gt(95) ? 'CRITICAL' : 'HIGH',
        message: `Total exposure at ${exposureRatio.toNumber()}% of limit`,
        timestamp: Date.now(),
        metadata: { exposure: this.state.totalExposure, limit: config.risk.maxTotalExposure }
      });
    }

    // Check drawdown
    const maxDrawdownLimit = config.risk.maxTotalExposure.mul(10).div(100); // 10% of max exposure
    if (this.state.maxDrawdown.gt(maxDrawdownLimit)) {
      alerts.push({
        type: 'DRAWDOWN_LIMIT',
        severity: 'CRITICAL',
        message: `Max drawdown ${this.state.maxDrawdown.toString()} exceeds limit`,
        timestamp: Date.now(),
        metadata: { drawdown: this.state.maxDrawdown, limit: maxDrawdownLimit }
      });
    }

    // Check consecutive losses
    if (this.state.consecutiveLosses > 5) {
      alerts.push({
        type: 'CONSECUTIVE_LOSSES',
        severity: this.state.consecutiveLosses > 10 ? 'CRITICAL' : 'HIGH',
        message: `${this.state.consecutiveLosses} consecutive losses`,
        timestamp: Date.now(),
        metadata: { consecutiveLosses: this.state.consecutiveLosses }
      });
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.state.riskAlerts.push(alert);
      this.emit('riskAlert', alert);
      
      if (alert.severity === 'CRITICAL') {
        this.emit('criticalRisk', alert);
      }
    });

    // Clean old alerts (keep last 100)
    if (this.state.riskAlerts.length > 100) {
      this.state.riskAlerts = this.state.riskAlerts.slice(-100);
    }
  }

  /**
   * Get current risk metrics
   */
  getRiskMetrics(): RiskMetrics {
    const unrealizedPnL = this.state.openPositions.reduce((sum, position) => {
      return sum.add(position.unrealizedPnL);
    }, ethers.BigNumber.from(0));

    const totalPnL = this.state.dailyPnL.add(unrealizedPnL);

    return {
      totalExposure: this.state.totalExposure,
      openPositions: this.state.openPositions.length,
      unrealizedPnL,
      dailyPnL: this.state.dailyPnL,
      maxDrawdown: this.state.maxDrawdown,
      sharpeRatio: this.calculateSharpeRatio(),
      winRate: this.calculateWinRate(),
    };
  }

  /**
   * Calculate Sharpe ratio
   */
  private calculateSharpeRatio(): number {
    // Simplified Sharpe ratio calculation
    // In production, this would use historical returns
    const dailyReturn = this.state.dailyPnL.toNumber();
    const riskFreeRate = 0.02; // 2% annual
    const volatility = 0.15; // Assumed 15% annual volatility
    
    if (volatility === 0) return 0;
    
    return (dailyReturn / 365 - riskFreeRate / 365) / (volatility / Math.sqrt(365));
  }

  /**
   * Calculate win rate
   */
  private calculateWinRate(): number {
    // Simplified win rate calculation
    // In production, this would track actual trade history
    return 0.55; // Placeholder
  }

  /**
   * Check if trading should be paused due to risk limits
   */
  shouldPauseTrading(): boolean {
    const metrics = this.getRiskMetrics();
    
    // Pause if drawdown exceeds 5% of max exposure
    const drawdownLimit = config.risk.maxTotalExposure.mul(5).div(100);
    if (metrics.maxDrawdown.gt(drawdownLimit)) {
      return true;
    }

    // Pause if consecutive losses exceed 10
    if (this.state.consecutiveLosses > 10) {
      return true;
    }

    // Pause if total exposure exceeds 95% of limit
    const exposureRatio = metrics.totalExposure.mul(100).div(config.risk.maxTotalExposure);
    if (exposureRatio.gt(95)) {
      return true;
    }

    return false;
  }

  /**
   * Get risk limits for a specific trade
   */
  getTradeLimits(marketId: string): {
    maxSize: ethers.BigNumber;
    maxPrice: ethers.BigNumber;
    maxSlippage: number;
  } {
    const marketExposure = this.state.marketExposure.get(marketId) || ethers.BigNumber.from(0);
    const remainingMarketExposure = config.risk.maxExposurePerMarket.sub(marketExposure);
    const remainingTotalExposure = config.risk.maxTotalExposure.sub(this.state.totalExposure);
    
    const maxSize = remainingMarketExposure.lt(remainingTotalExposure) 
      ? remainingMarketExposure 
      : remainingTotalExposure;

    return {
      maxSize: size.min(config.risk.maxPositionSize),
      maxPrice: ethers.constants.MaxUint256, // No price limit for binary markets
      maxSlippage: config.risk.maxSlippage,
    };
  }

  /**
   * Start risk monitoring loop
   */
  private startRiskMonitoring(): void {
    this.riskCheckInterval = setInterval(() => {
      this.performRiskCheck();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Perform comprehensive risk check
   */
  private performRiskCheck(): void {
    try {
      // Check for stale positions
      const now = Date.now();
      const staleThreshold = 300000; // 5 minutes

      this.state.openPositions.forEach(position => {
        if (now - position.timestamp > staleThreshold) {
          this.emit('stalePosition', {
            positionId: position.id,
            marketId: position.marketId,
            age: now - position.timestamp,
          });
        }
      });

      // Reset daily P&L at midnight UTC
      const nowUTC = new Date();
      if (nowUTC.getUTCHours() === this.DAILY_PNL_RESET_HOUR && 
          nowUTC.getUTCMinutes() === 0 && 
          nowUTC.getUTCSeconds() < 5) {
        this.resetDailyMetrics();
      }

      this.state.lastRiskCheck = now;

    } catch (error) {
      console.error('❌ Risk check failed:', error);
    }
  }

  /**
   * Reset daily metrics
   */
  private resetDailyMetrics(): void {
    this.state.dailyPnL = ethers.BigNumber.from(0);
    this.state.consecutiveLosses = 0;
    console.log('📊 Daily risk metrics reset');
  }

  /**
   * Initialize risk state
   */
  private initializeState(): RiskState {
    return {
      totalExposure: ethers.BigNumber.from(0),
      marketExposure: new Map(),
      openPositions: [],
      dailyPnL: ethers.BigNumber.from(0),
      maxDrawdown: ethers.BigNumber.from(0),
      peakEquity: ethers.BigNumber.from(0),
      consecutiveLosses: 0,
      lastRiskCheck: Date.now(),
      riskAlerts: [],
    };
  }

  /**
   * Get current risk state
   */
  getState(): RiskState {
    return {
      totalExposure: this.state.totalExposure,
      marketExposure: new Map(this.state.marketExposure),
      openPositions: [...this.state.openPositions],
      dailyPnL: this.state.dailyPnL,
      maxDrawdown: this.state.maxDrawdown,
      peakEquity: this.state.peakEquity,
      consecutiveLosses: this.state.consecutiveLosses,
      lastRiskCheck: this.state.lastRiskCheck,
      riskAlerts: [...this.state.riskAlerts],
    };
  }

  /**
   * Get recent risk alerts
   */
  getRecentAlerts(limit: number = 10): RiskAlert[] {
    return this.state.riskAlerts.slice(-limit);
  }

  /**
   * Clear risk alerts
   */
  clearAlerts(): void {
    this.state.riskAlerts = [];
  }

  /**
   * Emergency stop - close all positions
   */
  emergencyStop(): void {
    this.emit('emergencyStop', {
      reason: 'Manual emergency stop triggered',
      positions: this.state.openPositions.length,
      totalExposure: this.state.totalExposure,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.riskCheckInterval) {
      clearInterval(this.riskCheckInterval);
      this.riskCheckInterval = null;
    }
    
    console.log('🧹 RiskManager cleaned up');
  }
}
