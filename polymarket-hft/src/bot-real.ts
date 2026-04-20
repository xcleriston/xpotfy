/**
 * Real Data Bot - Uses Polymarket API and Alchemy RPC
 * Fetches real market data and executes trades on Polygon
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PolymarketAPI } from './integrators/PolymarketAPI';
import { AlchemyRPC } from './integrators/AlchemyRPC';
import { PolymarketCLOB } from './integrators/PolymarketCLOB';
import { WebServer } from './web-server';
import { BotConfig } from './types';
import { tradingConfigManager } from './config/trading-config';

interface RealPosition {
  id: string;
  marketId: string;
  type: 'UP' | 'DOWN';
  size: number;
  averagePrice: number;
  unrealizedPnL: number;
  timestamp: number;
}

interface RealTrade {
  id: string;
  marketId: string;
  type: 'BUY' | 'SELL';
  outcome: string;
  price: number;
  size: number;
  timestamp: number;
  txHash?: string;
  status: 'PENDING' | 'FILLED' | 'FAILED';
  executedPrice?: number;
  executedSize?: number;
  orderId?: string;
  error?: string;
  slippage?: number;
  limit?: number;
}

interface MonitoredMarket {
  id: string;
  outcomes: string[];
  outcomePrices: string[];
  tokenIds: {
    [outcome: string]: string;
  };
}

class RealDataBot {
  private positions: RealPosition[] = [];
  private trades: RealTrade[] = [];
  private isRunning = false;
  private winningTrades = 0;
  private losingTrades = 0;
  private monitoredMarkets: MonitoredMarket[] = [];
  private webServer: WebServer;
  private tradeCooldowns: Map<string, number> = new Map(); // Track cooldowns per market
  private polymarketAPI: PolymarketAPI;
  private polymarketCLOB: PolymarketCLOB;
  private priceHistory: Map<string, { upPrice: number; downPrice: number; timestamp: number }[]> = new Map(); // Track price history for variation calculation
  private walletBalance: number = 0;

  constructor() {
    this.polymarketAPI = new PolymarketAPI();
    this.polymarketCLOB = new PolymarketCLOB(
      process.env.POLYMARKET_WALLET_ADDRESS || '',
      process.env.PRIVATE_KEY || ''
    );
    this.webServer = new WebServer(3001, this.polymarketCLOB);
    console.log('✅ RealDataBot initialized');
  }

  async start(): Promise<void> {
    console.log('🚀 Starting RealDataBot...');
    console.log('🚀 About to call getBalance()...');
    try {
      // Initialize CLOB client for real trading
      console.log('🔑 Initializing CLOB client...');
      await this.polymarketCLOB.initialize();
      console.log('✅ CLOB client ready for trading');

      // Use Polymarket API to fetch markets
      console.log('📊 Fetching markets from Polymarket...');
      const events = await this.polymarketAPI.getMarkets();
      console.log(`📊 Fetched ${events.length} events`);
      
      // Extract markets from events
      const allMarkets: any[] = [];
      events.forEach((event: any) => {
        if (event.markets && Array.isArray(event.markets)) {
          event.markets.forEach((market: any) => {
            // Parse outcomes if it's a stringified JSON
            let outcomes = market.outcomes || [];
            if (typeof outcomes === 'string') {
              try {
                outcomes = JSON.parse(outcomes);
              } catch (e) {
                outcomes = [];
              }
            }
            
            // Parse outcomePrices if it's a stringified JSON
            let outcomePrices = market.outcomePrices || [];
            if (typeof outcomePrices === 'string') {
              try {
                outcomePrices = JSON.parse(outcomePrices);
              } catch (e) {
                outcomePrices = [];
              }
            }

            // Parse clobTokenIds if available
            let clobTokenIds: string[] = [];
            if (market.clobTokenIds && typeof market.clobTokenIds === 'string') {
              try {
                clobTokenIds = JSON.parse(market.clobTokenIds);
                console.log(`🔑 Market ${market.marketId || market.id} clobTokenIds:`, clobTokenIds);
              } catch (e) {
                clobTokenIds = [];
                console.log(`⚠️ Failed to parse clobTokenIds for market ${market.marketId || market.id}`);
              }
            } else {
              console.log(`⚠️ No clobTokenIds found for market ${market.marketId || market.id}`);
            }

            // Map outcomes to token IDs
            const tokenIds: { [outcome: string]: string } = {};
            if (clobTokenIds.length === outcomes.length) {
              outcomes.forEach((outcome: string, index: number) => {
                tokenIds[outcome] = clobTokenIds[index];
              });
              console.log(`🔑 Mapped tokenIds for market ${market.marketId || market.id}:`, tokenIds);
            } else {
              console.log(`⚠️ Token IDs length mismatch: outcomes=${outcomes.length}, tokenIds=${clobTokenIds.length}`);
            }

            allMarkets.push({
              id: market.marketId || market.id,
              question: market.question || event.question,
              outcomes: outcomes,
              outcomePrices: outcomePrices,
              orderbookEnabled: market.enableOrderBook || false,
              active: market.active || event.active,
              tokenIds: tokenIds,
            });
          });
        }
      });
      
      console.log(`📊 Total markets found: ${allMarkets.length}`);
      if (allMarkets.length > 0) {
        console.log('📊 Sample market:', JSON.stringify(allMarkets[0], null, 2));
      }
      
      // Filter for binary markets (Yes/No or UP/DOWN) that are active and have orderbook
      this.monitoredMarkets = allMarkets
        .filter(m => {
          if (!m.active || !m.orderbookEnabled) return false;
          if (!m.outcomes || !Array.isArray(m.outcomes)) return false;
          if (!m.outcomePrices || !Array.isArray(m.outcomePrices)) return false;
          
          // Check for Yes/No or UP/DOWN outcomes
          const hasYesNo = m.outcomes.includes('Yes') && m.outcomes.includes('No');
          const hasUpDown = m.outcomes.includes('UP') && m.outcomes.includes('DOWN');
          
          return hasYesNo || hasUpDown;
        })
        .slice(0, 5) // Monitor top 5 markets
        .map(m => ({
          id: m.id,
          outcomes: m.outcomes,
          outcomePrices: m.outcomePrices,
          tokenIds: (m as any).tokenIds || {},
        }));

      console.log(`✅ Monitoring ${this.monitoredMarkets.length} markets:`, this.monitoredMarkets);

      this.isRunning = true;
      
      // Fetch initial wallet balance
      this.walletBalance = await this.polymarketCLOB.getBalance();
      
      this.webServer.updateMetrics({ isRunning: true, walletBalance: this.walletBalance });

      // Start monitoring loop
      this.startMonitoringLoop();

      console.log('✅ RealDataBot started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start RealDataBot:', error);
      throw error;
    }
  }

  stop(): void {
    console.log('🛑 Stopping RealDataBot...');
    this.isRunning = false;
    this.webServer.updateMetrics({ isRunning: false });
    console.log('✅ RealDataBot stopped');
  }

  private async startMonitoringLoop(): Promise<void> {
    console.log('🔄 Starting monitoring loop...');
    while (this.isRunning) {
      try {
        // Fetch market data for all monitored markets
        for (const market of this.monitoredMarkets) {
          try {
            // Use Gamma API prices
            const upPrice = parseFloat(market.outcomePrices[0] || '0');
            const downPrice = parseFloat(market.outcomePrices[1] || '0');
            
            console.log(`📊 Market ${market.id}: UP=${upPrice.toFixed(4)}, DOWN=${downPrice.toFixed(4)}`);
            
            const sum = upPrice + downPrice;

            // Track price history for variation calculation
            const history = this.priceHistory.get(market.id) || [];
            history.push({ upPrice, downPrice, timestamp: Date.now() });
            // Keep only last 10 data points (20 seconds with 2s interval)
            if (history.length > 10) {
              history.shift();
            }
            this.priceHistory.set(market.id, history);

            // Calculate absolute price variation (in dollars)
            let priceVariation = 0;
            if (history.length >= 2) {
              const prev = history[history.length - 2];
              const current = history[history.length - 1];
              const upVariation = Math.abs(current.upPrice - prev.upPrice);
              const downVariation = Math.abs(current.downPrice - prev.downPrice);
              priceVariation = Math.max(upVariation, downVariation);
            }
            
            // Send to web server
            this.webServer.addMarketData({
              marketId: market.id,
              upPrice: upPrice,
              downPrice: downPrice,
              sum: sum,
              timestamp: Date.now(),
            });
            
            console.log(`📤 Sent market data for ${market.id} to web server`);

            // Check for trading opportunities based on price levels
            const config = tradingConfigManager.getConfig();
            const minPrice = config.minPrice;
            const maxPrice = config.maxPrice;
            const triggerDelta = config.triggerDelta;
            
            console.log(`📊 Market ${market.id} analysis:`, {
              upPrice: upPrice.toFixed(4),
              downPrice: downPrice.toFixed(4),
              minPrice: minPrice,
              maxPrice: maxPrice,
              sum: sum.toFixed(4),
              priceVariation: '$' + priceVariation.toFixed(4),
              triggerDelta: '$' + triggerDelta.toFixed(4)
            });

            // Check if price variation meets trigger delta (absolute dollar value)
            if (history.length >= 2 && priceVariation < triggerDelta) {
              console.log(`⏭️ Skipping trade - price variation $${priceVariation.toFixed(4)} below trigger delta $${triggerDelta.toFixed(4)}`);
              this.webServer.addLog(`Market ${market.id}: Price variation too low (noise filter)`, 'info');
              continue;
            }

            // SNIPER MODE: Skip sum check - focus on extreme low prices for 20x returns
            // The strategy bets on market panic and statistical probability vs collective panic

            // Generate signal if prices are within acceptable range
            const signal = this.generateSignal({ upPrice, downPrice });
            if (signal) {
              console.log(`🎯 Trading opportunity detected!`);
              console.log(`   Market: ${market.id}`);
              console.log(`   Signal: ${signal.type}`);
              
              // Check cooldown and existing positions before executing
              const cooldownKey = `${market.id}_${signal.type}`;
              const lastTradeTime = this.tradeCooldowns.get(cooldownKey) || 0;
              const cooldownPeriod = 60000; // 60 seconds cooldown per market/signal
              
              if (Date.now() - lastTradeTime < cooldownPeriod) {
                console.log(`⏭️ Skipping trade - cooldown active for ${market.id} (${Math.ceil((cooldownPeriod - (Date.now() - lastTradeTime)) / 1000)}s remaining)`);
                this.webServer.addLog(`Market ${market.id}: Cooldown active`, 'info');
              } else {
                // Check if already has position for this market
                const hasExistingPosition = this.positions.some(p => 
                  p.marketId === market.id && 
                  p.type === (signal.type === 'BUY_UP' ? 'UP' : 'DOWN')
                );
                
                if (hasExistingPosition) {
                  console.log(`⏭️ Skipping trade - already have position for ${market.id} (${signal.type})`);
                  this.webServer.addLog(`Market ${market.id}: Already have position`, 'info');
                } else {
                  await this.executeSignal(market.id, signal, { upPrice, downPrice });
                  this.tradeCooldowns.set(cooldownKey, Date.now());
                }
              }
            } else {
              console.log(`⏭️ Skipping trade - no opportunity (upPrice=${upPrice.toFixed(4)}, downPrice=${downPrice.toFixed(4)})`);
              this.webServer.addLog(`Market ${market.id}: No opportunity (up=${upPrice.toFixed(4)}, down=${downPrice.toFixed(4)})`, 'info');
            }
          } catch (error) {
            console.error(`Error processing market ${market.id}:`, error);
          }
        }

        // Wait before next iteration
        await this.sleep(2000); // 2 seconds between checks

      } catch (error) {
        console.error('Error in monitoring loop:', error);
        await this.sleep(5000); // Wait 5 seconds before retry
      }
    }
  }

  private generateSignal(marketData: { upPrice: number; downPrice: number }): { type: 'BUY_UP' | 'BUY_DOWN' } | null {
    // SNIPER MODE: Only trade when price is extremely low (< 0.05) for 20x potential returns
    // This strategy bets on market panic and statistical probability vs collective panic
    // MIN_THRESHOLD: CLOB SDK requires price > 0, so we use 0.01 as minimum
    const SNIPER_THRESHOLD = 0.05;
    const MIN_THRESHOLD = 0.01;
    
    if (marketData.upPrice >= MIN_THRESHOLD && marketData.upPrice < SNIPER_THRESHOLD) {
      console.log(`🎯 SNIPER MODE: UP price ${marketData.upPrice.toFixed(4)} < ${SNIPER_THRESHOLD} - BUY_UP signal`);
      return { type: 'BUY_UP' };
    } else if (marketData.downPrice >= MIN_THRESHOLD && marketData.downPrice < SNIPER_THRESHOLD) {
      console.log(`🎯 SNIPER MODE: DOWN price ${marketData.downPrice.toFixed(4)} < ${SNIPER_THRESHOLD} - BUY_DOWN signal`);
      return { type: 'BUY_DOWN' };
    }
    
    console.log(`⏭️ SNIPER MODE: No sniper opportunity (UP=${marketData.upPrice.toFixed(4)}, DOWN=${marketData.downPrice.toFixed(4)})`);
    return null;
  }

  private async executeSignal(
    marketId: string,
    signal: { type: 'BUY_UP' | 'BUY_DOWN' },
    marketData: { upPrice: number; downPrice: number }
  ): Promise<void> {
    try {
      // Get the market to access token IDs and outcomes
      const market = this.monitoredMarkets.find(m => m.id === marketId);
      if (!market || !market.tokenIds) {
        console.error(`❌ Market ${marketId} not found or has no token IDs`);
        return;
      }

      // Determine the outcome based on signal type and actual market outcomes
      let outcome: string;
      let price: number;
      
      if (signal.type === 'BUY_UP') {
        // Buy the first outcome (typically Yes or UP)
        outcome = market.outcomes[0];
        price = marketData.upPrice;
      } else {
        // Buy the second outcome (typically No or DOWN)
        outcome = market.outcomes[1];
        price = marketData.downPrice;
      }

      // Get the token ID for the specific outcome
      const tokenID = market.tokenIds[outcome];
      if (!tokenID) {
        console.error(`❌ No token ID found for outcome ${outcome} in market ${marketId}`);
        return;
      }
      
      // Get config for validation
      const config = tradingConfigManager.getConfig();
      
      // Validate price before executing trade
      // SNIPER MODE: Allow price 0.0000 for extreme low odds (but skip if price is truly invalid)
      if (price < 0 || (price > 0 && price < config.minPrice) || price > config.maxPrice) {
        console.log(`⏭️ Skipping trade - price ${price.toFixed(4)} outside valid range [${config.minPrice}, ${config.maxPrice}]`);
        this.webServer.addLog(`Market ${marketId}: Price ${price.toFixed(4)} outside valid range`, 'info');
        return;
      }

      // SNIPER MODE SAFETY CHECK #1: Minimum position size to dilute gas fees
      // Rule: Only execute if position size is at least $10-$20 to cover gas fees
      const MIN_POSITION_SIZE = 10; // $10 minimum to dilute gas fees
      if (config.maxPerTrade < MIN_POSITION_SIZE) {
        console.log(`⏭️ Skipping trade - position size $${config.maxPerTrade} below minimum $${MIN_POSITION_SIZE} (gas fees would kill profit)`);
        this.webServer.addLog(`Market ${marketId}: Position size too small for gas fees`, 'info');
        return;
      }

      // SNIPER MODE SAFETY CHECK #2: Safety margin for Polymarket fees
      // Need 3x-5x margin over entry cost to cover trading fees + gas
      const entryCost = config.maxPerTrade * price;
      const targetExitPrice = Math.min(price * 5, 0.50); // Target 5x return, max 50 cents
      const potentialProfit = (config.maxPerTrade * targetExitPrice) - entryCost;
      const safetyMargin = potentialProfit / entryCost; // Profit as multiple of entry cost
      
      if (safetyMargin < 3) {
        console.log(`⏭️ Skipping trade - safety margin ${safetyMargin.toFixed(2)}x below 3x minimum (entry: $${entryCost.toFixed(2)}, target: $${targetExitPrice.toFixed(4)})`);
        this.webServer.addLog(`Market ${marketId}: Safety margin too low`, 'info');
        return;
      }

      console.log(`✅ Safety checks passed - entry: $${entryCost.toFixed(2)}, target: $${targetExitPrice.toFixed(4)}, margin: ${safetyMargin.toFixed(2)}x`);
      
      // Execute trade via CLOB client
      console.log(`📈 Executing trade: ${outcome} @ ${price.toFixed(4)} (tokenID: ${tokenID})`);
      
      
      const tradeResult = await this.polymarketCLOB.executeTrade({
        tokenID: tokenID,
        price: price,
        size: config.maxPerTrade,
        side: 'BUY',
      });
      
      if (tradeResult.success) {
        console.log(`✅ Trade executed successfully`);
        console.log(`   Order ID: ${tradeResult.orderId}`);
        console.log(`   Executed Price: ${tradeResult.executedPrice?.toFixed(4)}`);
        console.log(`   Executed Size: ${tradeResult.executedSize}`);
        console.log(`   Transaction Hash: ${tradeResult.transactionHash}`);

        // Create position
        const position: RealPosition = {
          id: `pos_${Date.now()}`,
          marketId,
          type: signal.type === 'BUY_UP' ? 'UP' : 'DOWN',
          size: tradeResult.executedSize || config.maxPerTrade,
          averagePrice: tradeResult.executedPrice || price,
          unrealizedPnL: 0,
          timestamp: Date.now(),
        };

        this.positions.push(position);
        this.webServer.addPosition(position);

        // Create trade record with detailed information
        const tradeId = tradeResult.orderId || `trade_${Date.now()}`;
        const trade: RealTrade = {
          id: tradeId,
          marketId,
          type: 'BUY' as const,
          outcome,
          price: tradeResult.executedPrice || price,
          size: tradeResult.executedSize || config.maxPerTrade,
          timestamp: Date.now(),
          txHash: tradeResult.transactionHash,
          status: 'FILLED',
          executedPrice: tradeResult.executedPrice,
          executedSize: tradeResult.executedSize,
          orderId: tradeResult.orderId,
          slippage: config.slippageBuy,
          limit: config.maxPerTrade,
        };

        this.trades.push(trade);
        this.webServer.addTrade(trade);

        this.webServer.addLog(`✅ Trade executed: ${outcome} ${marketId} @ ${price.toFixed(4)} (UP/DOWN: ${signal.type === 'BUY_UP' ? 'UP' : 'DOWN'})`, 'success');
      } else {
        console.error(`❌ Trade execution failed: ${tradeResult.error}`);
        
        // Create failed trade record with error details
        const failedTrade: RealTrade = {
          id: `failed_${Date.now()}`,
          marketId,
          type: 'BUY' as const,
          outcome,
          price: price,
          size: config.maxPerTrade,
          timestamp: Date.now(),
          status: 'FAILED',
          error: tradeResult.error,
          slippage: config.slippageBuy,
          limit: config.maxPerTrade,
        };

        this.trades.push(failedTrade);
        this.webServer.addTrade(failedTrade);
        
        this.webServer.addLog(`❌ Trade failed: ${outcome} ${marketId} - ${tradeResult.error}`, 'error');
      }

    } catch (error) {
      console.error('Error executing trade:', error);
    }
  }

  private async executeHedge(
    marketId: string,
    originalOutcome: 'UP' | 'DOWN',
    marketData: { upPrice: number; downPrice: number }
  ): Promise<void> {
    try {
      const hedgeOutcome = originalOutcome === 'UP' ? 'DOWN' : 'UP';
      const hedgePrice = hedgeOutcome === 'UP' ? marketData.upPrice : marketData.downPrice;
      
      console.log(`🛡️ Executing hedge: ${hedgeOutcome} @ ${hedgePrice.toFixed(4)}`);

      const hedgeRequest = {
        market_id: marketId,
        outcome: hedgeOutcome,
        type: 'BUY' as const,
        size: 100,
        slippage: 0.01,
      };

      const hedgeResult = await this.polymarketAPI.executeTrade(hedgeRequest);
      
      if (hedgeResult.success) {
        console.log(`✅ Hedge executed successfully`);
        console.log(`   Trade ID: ${hedgeResult.trade_id}`);
        console.log(`   Executed Price: ${hedgeResult.executed_price?.toFixed(4)}`);

        // Create hedge position
        const hedgePosition: RealPosition = {
          id: `pos_${Date.now()}`,
          marketId,
          type: hedgeOutcome,
          size: hedgeResult.executed_size || hedgeRequest.size,
          averagePrice: hedgeResult.executed_price || hedgePrice,
          unrealizedPnL: 0,
          timestamp: Date.now(),
        };

        this.positions.push(hedgePosition);
        this.webServer.addPosition(hedgePosition);

        // Create hedge trade record
        const hedgeTrade: RealTrade = {
          id: hedgeResult.trade_id || `trade_${Date.now()}`,
          marketId,
          type: 'BUY' as const,
          outcome: hedgeOutcome,
          size: hedgeResult.executed_size || hedgeRequest.size,
          price: hedgeResult.executed_price || hedgePrice,
          timestamp: Date.now(),
          txHash: hedgeResult.transaction_hash,
          status: 'FILLED',
        };

        this.trades.push(hedgeTrade);
        this.webServer.addTrade(hedgeTrade);

        // Calculate expected profit
        const totalCost = marketData.upPrice + marketData.downPrice;
        const expectedProfit = 1 - totalCost;
        
        console.log(`💰 Expected profit: ${expectedProfit.toFixed(4)} (${(expectedProfit * 100).toFixed(2)}%)`);

        // Update metrics
        this.updateMetrics();

      } else {
        console.error(`❌ Hedge execution failed: ${hedgeResult.error}`);
      }

    } catch (error) {
      console.error('Error executing hedge:', error);
    }
  }

  private updateMetrics(): void {
    const totalPnL = this.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    const totalTrades = this.trades.length;
    const openPositions = this.positions.filter(p => p.unrealizedPnL === 0).length;
    const winRate = this.positions.length > 0 
      ? (this.winningTrades / this.positions.length) * 100 
      : 0;
    
    this.webServer.updateMetrics({
      totalTrades,
      openPositions,
      totalPnL,
      winRate,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test execution
async function main(): Promise<void> {
  console.log('🧪 Starting Polymarket HFT Bot with Real Data');
  console.log('=====================================\n');
  
  const bot = new RealDataBot();
  
  // Start web server
  bot['webServer'].start();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    bot.stop();
    bot['webServer'].stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    bot.stop();
    bot['webServer'].stop();
    process.exit(0);
  });
  
  try {
    await bot.start();
    
    console.log('🎉 Real data bot is running!');
    console.log('🌐 Open http://localhost:3001 in your browser');
    console.log('📊 Press Ctrl+C to stop');
    console.log('=====================================\n');
    
    // Keep process running
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start real data bot:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { RealDataBot };
