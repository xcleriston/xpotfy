/**
 * Test Bot with Web Integration
 * This version integrates with the web server for browser-based monitoring
 */

import { webServer } from './web-server';

interface TestMarketData {
  marketId: string;
  upPrice: number;
  downPrice: number;
  sum: number;
  timestamp: number;
}

interface TestPosition {
  id: string;
  marketId: string;
  type: 'UP' | 'DOWN';
  size: number;
  averagePrice: number;
  unrealizedPnL: number;
  timestamp: number;
}

class TestBotWeb {
  private positions: TestPosition[] = [];
  private trades: any[] = [];
  private isRunning = false;
  private winningTrades = 0;
  private losingTrades = 0;

  constructor() {
    console.log('✅ TestBotWeb initialized');
  }

  start(): void {
    console.log('🚀 Starting TestBotWeb...');
    this.isRunning = true;
    
    // Update web server with initial status
    webServer.updateMetrics({ isRunning: true });
    
    // Simulate market data processing
    setInterval(() => {
      if (!this.isRunning) return;
      
      const marketData = this.generateMockMarketData();
      webServer.addMarketData(marketData);
      this.processMarketData(marketData);
    }, 1000); // Every second
    
    console.log('✅ TestBotWeb started successfully');
  }

  stop(): void {
    console.log('🛑 Stopping TestBotWeb...');
    this.isRunning = false;
    webServer.updateMetrics({ isRunning: false });
    console.log('✅ TestBotWeb stopped');
  }

  private generateMockMarketData(): TestMarketData {
    const upPrice = 0.4 + Math.random() * 0.2; // 0.4 to 0.6
    const downPrice = 0.4 + Math.random() * 0.2; // 0.4 to 0.6
    const sum = upPrice + downPrice;
    
    return {
      marketId: 'test_market_1',
      upPrice,
      downPrice,
      sum,
      timestamp: Date.now(),
    };
  }

  private processMarketData(marketData: TestMarketData): void {
    // Check for arbitrage opportunity
    if (marketData.sum < 0.95) {
      const inefficiency = 1 - marketData.sum;
      console.log(`🎯 Arbitrage opportunity detected!`);
      console.log(`   UP: ${marketData.upPrice.toFixed(4)}, DOWN: ${marketData.downPrice.toFixed(4)}`);
      console.log(`   Sum: ${marketData.sum.toFixed(4)}, Inefficiency: ${inefficiency.toFixed(4)}`);
      
      // Generate trading signal
      const signal = this.generateSignal(marketData);
      if (signal) {
        this.executeSignal(signal);
      }
    }
  }

  private generateSignal(marketData: TestMarketData): { type: 'BUY_UP' | 'BUY_DOWN' } | null {
    // Simple strategy: buy the cheaper side
    if (marketData.upPrice < marketData.downPrice) {
      return { type: 'BUY_UP' };
    } else if (marketData.downPrice < marketData.upPrice) {
      return { type: 'BUY_DOWN' };
    }
    
    return null;
  }

  private executeSignal(signal: { type: 'BUY_UP' | 'BUY_DOWN' }): void {
    const position: TestPosition = {
      id: `pos_${Date.now()}`,
      marketId: 'test_market_1',
      type: signal.type === 'BUY_UP' ? 'UP' : 'DOWN',
      size: 1000,
      averagePrice: signal.type === 'BUY_UP' ? 0.45 : 0.55,
      unrealizedPnL: 0,
      timestamp: Date.now(),
    };
    
    this.positions.push(position);
    webServer.addPosition(position);
    
    const trade = {
      id: `trade_${Date.now()}`,
      marketId: position.marketId,
      type: 'BUY',
      outcome: position.type,
      size: position.size,
      price: position.averagePrice,
      timestamp: Date.now(),
      status: 'EXECUTED',
    };
    
    this.trades.push(trade);
    webServer.addTrade(trade);
    
    console.log(`📈 Position opened: ${position.type} @ ${position.averagePrice}`);
    console.log(`   Position ID: ${position.id}`);
    console.log(`   Trade ID: ${trade.id}`);
    
    // Update metrics
    this.updateMetrics();
    
    // Simulate hedge after 2 seconds
    setTimeout(() => {
      this.simulateHedge(position);
    }, 2000);
  }

  private simulateHedge(originalPosition: TestPosition): void {
    const hedgeType = originalPosition.type === 'UP' ? 'DOWN' : 'UP';
    const hedgePrice = hedgeType === 'UP' ? 0.55 : 0.45;
    
    const hedgePosition: TestPosition = {
      id: `pos_${Date.now()}`,
      marketId: 'test_market_1',
      type: hedgeType,
      size: 1000,
      averagePrice: hedgePrice,
      unrealizedPnL: 0,
      timestamp: Date.now(),
    };
    
    this.positions.push(hedgePosition);
    webServer.addPosition(hedgePosition);
    
    const hedgeTrade = {
      id: `trade_${Date.now()}`,
      marketId: hedgePosition.marketId,
      type: 'BUY',
      outcome: hedgePosition.type,
      size: hedgePosition.size,
      price: hedgePosition.averagePrice,
      timestamp: Date.now(),
      status: 'EXECUTED',
    };
    
    this.trades.push(hedgeTrade);
    webServer.addTrade(hedgeTrade);
    
    console.log(`🛡️ Hedge executed: ${hedgeType} @ ${hedgePrice}`);
    
    // Calculate expected profit
    const totalCost = originalPosition.averagePrice + hedgePosition.averagePrice;
    const expectedProfit = 1 - totalCost;
    
    console.log(`💰 Expected profit: ${expectedProfit.toFixed(4)} (${(expectedProfit * 100).toFixed(2)}%)`);
    
    // Update metrics
    this.updateMetrics();
    
    // Simulate position resolution after 5 seconds
    setTimeout(() => {
      this.simulateResolution();
    }, 5000);
  }

  private simulateResolution(): void {
    console.log(`🏁 Simulating position resolution...`);
    
    // Update positions with final P&L
    this.positions.forEach(position => {
      const randomOutcome = Math.random();
      if (position.type === 'UP') {
        position.unrealizedPnL = randomOutcome > 0.5 ? 100 : -100;
      } else {
        position.unrealizedPnL = randomOutcome > 0.5 ? -100 : 100;
      }
      
      webServer.updatePosition(position.id, { unrealizedPnL: position.unrealizedPnL });
      
      if (position.unrealizedPnL > 0) {
        this.winningTrades++;
      } else {
        this.losingTrades++;
      }
    });
    
    const totalPnL = this.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    console.log(`📊 Final P&L: ${totalPnL.toFixed(2)}`);
    
    this.updateMetrics();
    this.printSummary();
  }

  private updateMetrics(): void {
    const totalPnL = this.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    const totalTrades = this.trades.length;
    const openPositions = this.positions.filter(p => p.unrealizedPnL === 0).length;
    const winRate = this.positions.length > 0 
      ? (this.winningTrades / this.positions.length) * 100 
      : 0;
    
    webServer.updateMetrics({
      totalTrades,
      openPositions,
      totalPnL,
      winRate,
    });
  }

  private printSummary(): void {
    console.log('\n📋 === TRADING SUMMARY ===');
    console.log(`Total Positions: ${this.positions.length}`);
    console.log(`Total Trades: ${this.trades.length}`);
    
    const totalPnL = this.positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    console.log(`Total P&L: ${totalPnL.toFixed(2)}`);
    
    const winRate = this.positions.length > 0 
      ? (this.winningTrades / this.positions.length) * 100 
      : 0;
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    
    console.log('========================\n');
  }
}

// Test execution
function main(): void {
  console.log('🧪 Starting Polymarket HFT Bot with Web Interface');
  console.log('=====================================\n');
  
  // Start web server
  webServer.start();
  
  const bot = new TestBotWeb();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    bot.stop();
    webServer.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    bot.stop();
    webServer.stop();
    process.exit(0);
  });
  
  try {
    bot.start();
    
    console.log('🎉 Test bot with web interface is running!');
    console.log('🌐 Open http://localhost:3001 in your browser');
    console.log('📊 Press Ctrl+C to stop');
    console.log('=====================================\n');
    
    // Keep process running
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start test bot:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { TestBotWeb };
