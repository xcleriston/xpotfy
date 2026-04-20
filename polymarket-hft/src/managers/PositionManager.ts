import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { 
  Position, 
  Trade, 
  MarketData, 
  ExecutionRequest,
  TradingError,
  DatabasePosition 
} from '@/types';
import { config } from '@/config';

interface PositionState {
  positions: Map<string, Position>;
  marketPositions: Map<string, Position[]>; // marketId -> positions[]
  trades: Map<string, Trade>;
  averagePrices: Map<string, ethers.BigNumber>; // positionId -> avg price
  unrealizedPnL: Map<string, ethers.BigNumber>; // positionId -> unrealized P&L
}

export class PositionManager extends EventEmitter {
  private state: PositionState;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.state = {
      positions: new Map(),
      marketPositions: new Map(),
      trades: new Map(),
      averagePrices: new Map(),
      unrealizedPnL: new Map(),
    };
    this.startPriceUpdates();
  }

  /**
   * Create new position from trade
   */
  createPosition(trade: Trade, marketData: MarketData): Position {
    const position: Position = {
      id: this.generatePositionId(),
      marketId: trade.marketId,
      type: trade.outcome,
      size: trade.size,
      averagePrice: trade.price,
      unrealizedPnL: ethers.BigNumber.from(0),
      realizedPnL: ethers.BigNumber.from(0),
      timestamp: Date.now(),
      status: 'OPEN',
    };

    // Store position
    this.state.positions.set(position.id, position);
    
    // Update market positions
    const marketPositions = this.state.marketPositions.get(trade.marketId) || [];
    marketPositions.push(position);
    this.state.marketPositions.set(trade.marketId, marketPositions);
    
    // Store trade
    this.state.trades.set(trade.id, trade);
    
    // Calculate initial unrealized P&L
    this.updateUnrealizedPnL(position, marketData);
    
    // Emit events
    this.emit('positionOpened', position);
    this.emit('positionUpdate', { marketId: trade.marketId, positions: marketPositions });
    
    return position;
  }

  /**
   * Update existing position with new trade
   */
  updatePosition(positionId: string, trade: Trade, marketData: MarketData): Position {
    const position = this.state.positions.get(positionId);
    if (!position) {
      throw new TradingError(`Position ${positionId} not found`, 'POSITION_NOT_FOUND');
    }

    if (position.status !== 'OPEN') {
      throw new TradingError(`Position ${positionId} is not open`, 'POSITION_NOT_OPEN');
    }

    // Calculate new average price
    const totalCost = position.averagePrice.mul(position.size).add(trade.price.mul(trade.size));
    const totalSize = position.size.add(trade.size);
    const newAveragePrice = totalCost.div(totalSize);

    // Update position
    position.size = totalSize;
    position.averagePrice = newAveragePrice;
    position.timestamp = Date.now();

    // Store trade
    this.state.trades.set(trade.id, trade);
    
    // Update unrealized P&L
    this.updateUnrealizedPnL(position, marketData);
    
    // Emit events
    this.emit('positionUpdated', position);
    this.emit('positionUpdate', { 
      marketId: position.marketId, 
      positions: this.state.marketPositions.get(position.marketId) || [] 
    });
    
    return position;
  }

  /**
   * Close position (full or partial)
   */
  closePosition(
    positionId: string, 
    closeSize: ethers.BigNumber, 
    closePrice: ethers.BigNumber,
    marketData: MarketData
  ): { position: Position; realizedPnL: ethers.BigNumber } {
    const position = this.state.positions.get(positionId);
    if (!position) {
      throw new TradingError(`Position ${positionId} not found`, 'POSITION_NOT_FOUND');
    }

    if (closeSize.gt(position.size)) {
      throw new TradingError(`Close size ${closeSize.toString()} exceeds position size ${position.size.toString()}`, 'INVALID_SIZE');
    }

    // Calculate realized P&L
    const closeValue = closeSize.mul(closePrice);
    const costBasis = closeSize.mul(position.averagePrice);
    const realizedPnL = closeValue.sub(costBasis);

    // Update position
    position.size = position.size.sub(closeSize);
    position.realizedPnL = position.realizedPnL.add(realizedPnL);

    if (position.size.eq(0)) {
      position.status = 'CLOSED';
      this.updateUnrealizedPnL(position, marketData);
    } else {
      this.updateUnrealizedPnL(position, marketData);
    }

    // Emit events
    if (position.status === 'CLOSED') {
      this.emit('positionClosed', { position, realizedPnL });
    } else {
      this.emit('positionPartiallyClosed', { position, realizedPnL, remainingSize: position.size });
    }

    this.emit('positionUpdate', { 
      marketId: position.marketId, 
      positions: this.state.marketPositions.get(position.marketId) || [] 
    });

    return { position, realizedPnL };
  }

  /**
   * Get position by ID
   */
  getPosition(positionId: string): Position | undefined {
    return this.state.positions.get(positionId);
  }

  /**
   * Get all positions for a market
   */
  getMarketPositions(marketId: string): Position[] {
    return this.state.marketPositions.get(marketId) || [];
  }

  /**
   * Get all open positions
   */
  getOpenPositions(): Position[] {
    return Array.from(this.state.positions.values()).filter(p => p.status === 'OPEN');
  }

  /**
   * Get position metrics for a market
   */
  getMarketMetrics(marketId: string): {
    totalExposure: ethers.BigNumber;
    upExposure: ethers.BigNumber;
    downExposure: ethers.BigNumber;
    netExposure: ethers.BigNumber;
    averageUpPrice: ethers.BigNumber;
    averageDownPrice: ethers.BigNumber;
    totalUnrealizedPnL: ethers.BigNumber;
    totalRealizedPnL: ethers.BigNumber;
  } {
    const positions = this.getMarketPositions(marketId);
    const openPositions = positions.filter(p => p.status === 'OPEN');

    const upPositions = openPositions.filter(p => p.type === 'UP');
    const downPositions = openPositions.filter(p => p.type === 'DOWN');

    const upExposure = upPositions.reduce((sum, p) => sum.add(p.size), ethers.BigNumber.from(0));
    const downExposure = downPositions.reduce((sum, p) => sum.add(p.size), ethers.BigNumber.from(0));

    const averageUpPrice = this.calculateWeightedAveragePrice(upPositions);
    const averageDownPrice = this.calculateWeightedAveragePrice(downPositions);

    const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum.add(p.unrealizedPnL), ethers.BigNumber.from(0));
    const totalRealizedPnL = positions.reduce((sum, p) => sum.add(p.realizedPnL), ethers.BigNumber.from(0));

    return {
      totalExposure: upExposure.add(downExposure),
      upExposure,
      downExposure,
      netExposure: upExposure.sub(downExposure),
      averageUpPrice,
      averageDownPrice,
      totalUnrealizedPnL,
      totalRealizedPnL,
    };
  }

  /**
   * Calculate expected profit for hedged position
   */
  calculateExpectedProfit(marketId: string, marketData: MarketData): ethers.BigNumber {
    const metrics = this.getMarketMetrics(marketId);
    
    if (metrics.upExposure.eq(0) || metrics.downExposure.eq(0)) {
      return ethers.BigNumber.from(0); // Not hedged
    }

    // Expected profit = 1 - (avg_up_price + avg_down_price)
    const sumPrices = metrics.averageUpPrice.add(metrics.averageDownPrice);
    const expectedProfit = ethers.BigNumber.from(10).pow(18).sub(sumPrices);

    // Scale by minimum exposure
    const minExposure = metrics.upExposure.lt(metrics.downExposure) ? metrics.upExposure : metrics.downExposure;
    return expectedProfit.mul(minExposure).div(ethers.BigNumber.from(10).pow(18));
  }

  /**
   * Check if position needs hedging
   */
  needsHedging(marketId: string, marketData: MarketData): {
    needsHedge: boolean;
    hedgeSize: ethers.BigNumber;
    hedgeType: 'UP' | 'DOWN';
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const metrics = this.getMarketMetrics(marketId);
    
    if (metrics.upExposure.eq(0) && metrics.downExposure.eq(0)) {
      return { needsHedge: false, hedgeSize: ethers.BigNumber.from(0), hedgeType: 'UP', urgency: 'LOW' };
    }

    if (metrics.upExposure.eq(0) && metrics.downExposure.gt(0)) {
      return {
        needsHedge: true,
        hedgeSize: metrics.downExposure,
        hedgeType: 'UP',
        urgency: this.calculateUrgency(metrics.downExposure, marketData),
      };
    }

    if (metrics.downExposure.eq(0) && metrics.upExposure.gt(0)) {
      return {
        needsHedge: true,
        hedgeSize: metrics.upExposure,
        hedgeType: 'DOWN',
        urgency: this.calculateUrgency(metrics.upExposure, marketData),
      };
    }

    // Check for imbalance
    const imbalance = metrics.netExposure.abs().mul(100).div(metrics.totalExposure);
    if (imbalance.gt(20)) { // 20% imbalance threshold
      const hedgeSize = metrics.netExposure.abs();
      const hedgeType = metrics.netExposure.gt(0) ? 'DOWN' : 'UP';
      
      return {
        needsHedge: true,
        hedgeSize,
        hedgeType,
        urgency: imbalance.gt(50) ? 'HIGH' : 'MEDIUM',
      };
    }

    return { needsHedge: false, hedgeSize: ethers.BigNumber.from(0), hedgeType: 'UP', urgency: 'LOW' };
  }

  /**
   * Update all positions with new market data
   */
  updateAllPositions(marketData: MarketData): void {
    const positions = this.state.marketPositions.get(marketData.marketId) || [];
    
    positions.forEach(position => {
      if (position.status === 'OPEN') {
        this.updateUnrealizedPnL(position, marketData);
      }
    });

    this.emit('marketPositionsUpdated', { 
      marketId: marketData.marketId, 
      positions,
      metrics: this.getMarketMetrics(marketData.marketId)
    });
  }

  /**
   * Get position history
   */
  getPositionHistory(positionId: string): Trade[] {
    const trades: Trade[] = [];
    for (const trade of this.state.trades.values()) {
      // This would need to be linked to position IDs in a real implementation
      // For now, returning empty array
    }
    return trades;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalPositions: number;
    openPositions: number;
    closedPositions: number;
    totalRealizedPnL: ethers.BigNumber;
    totalUnrealizedPnL: ethers.BigNumber;
    winRate: number;
    averageWin: ethers.BigNumber;
    averageLoss: ethers.BigNumber;
    profitFactor: number;
  } {
    const allPositions = Array.from(this.state.positions.values());
    const openPositions = allPositions.filter(p => p.status === 'OPEN');
    const closedPositions = allPositions.filter(p => p.status === 'CLOSED');

    const totalRealizedPnL = allPositions.reduce((sum, p) => sum.add(p.realizedPnL), ethers.BigNumber.from(0));
    const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum.add(p.unrealizedPnL), ethers.BigNumber.from(0));

    const winningPositions = closedPositions.filter(p => p.realizedPnL.gt(0));
    const losingPositions = closedPositions.filter(p => p.realizedPnL.lt(0));

    const averageWin = winningPositions.length > 0 
      ? winningPositions.reduce((sum, p) => sum.add(p.realizedPnL), ethers.BigNumber.from(0)).div(winningPositions.length)
      : ethers.BigNumber.from(0);

    const averageLoss = losingPositions.length > 0
      ? losingPositions.reduce((sum, p) => sum.add(p.realizedPnL.abs()), ethers.BigNumber.from(0)).div(losingPositions.length)
      : ethers.BigNumber.from(0);

    const totalWins = winningPositions.reduce((sum, p) => sum.add(p.realizedPnL), ethers.BigNumber.from(0));
    const totalLosses = losingPositions.reduce((sum, p) => sum.add(p.realizedPnL.abs()), ethers.BigNumber.from(0));
    const profitFactor = totalLosses.gt(0) ? totalWins.mul(10000).div(totalLosses).toNumber() / 10000 : 0;

    return {
      totalPositions: allPositions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalRealizedPnL,
      totalUnrealizedPnL,
      winRate: closedPositions.length > 0 ? winningPositions.length / closedPositions.length : 0,
      averageWin,
      averageLoss,
      profitFactor,
    };
  }

  /**
   * Update unrealized P&L for a position
   */
  private updateUnrealizedPnL(position: Position, marketData: MarketData): void {
    const currentPrice = position.type === 'UP' ? marketData.upPrice : marketData.downPrice;
    const currentValue = position.size.mul(currentPrice);
    const costBasis = position.size.mul(position.averagePrice);
    const unrealizedPnL = currentValue.sub(costBasis);

    position.unrealizedPnL = unrealizedPnL;
    this.state.unrealizedPnL.set(position.id, unrealizedPnL);
  }

  /**
   * Calculate weighted average price for positions
   */
  private calculateWeightedAveragePrice(positions: Position[]): ethers.BigNumber {
    if (positions.length === 0) {
      return ethers.BigNumber.from(0);
    }

    const totalCost = positions.reduce((sum, p) => sum.add(p.averagePrice.mul(p.size)), ethers.BigNumber.from(0));
    const totalSize = positions.reduce((sum, p) => sum.add(p.size), ethers.BigNumber.from(0));

    return totalSize.gt(0) ? totalCost.div(totalSize) : ethers.BigNumber.from(0);
  }

  /**
   * Calculate hedging urgency based on exposure and market conditions
   */
  private calculateUrgency(exposure: ethers.BigNumber, marketData: MarketData): 'LOW' | 'MEDIUM' | 'HIGH' {
    const exposureRatio = exposure.mul(100).div(config.risk.maxExposurePerMarket);
    
    if (exposureRatio.gt(80)) {
      return 'HIGH';
    } else if (exposureRatio.gt(50)) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Start periodic price updates
   */
  private startPriceUpdates(): void {
    this.priceUpdateInterval = setInterval(() => {
      // This would trigger price updates for all positions
      // In practice, this would be driven by market data events
    }, 1000); // Update every second
  }

  /**
   * Generate unique position ID
   */
  private generatePositionId(): string {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current state
   */
  getState(): PositionState {
    return {
      positions: new Map(this.state.positions),
      marketPositions: new Map(this.state.marketPositions),
      trades: new Map(this.state.trades),
      averagePrices: new Map(this.state.averagePrices),
      unrealizedPnL: new Map(this.state.unrealizedPnL),
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    
    console.log('🧹 PositionManager cleaned up');
  }
}
