/**
 * Trading Configuration for Polymarket HFT Bot
 * Default configurations with risk management parameters
 */

import fs from 'fs';
import path from 'path';

export interface TradingConfig {
  // Order Execution
  marketOrderBuy: boolean;
  marketOrderSell: boolean;
  
  // Slippage Configuration
  slippageBuy: number; // Percentage (e.g., 0.01 = 1%)
  slippageSell: number; // Percentage (e.g., 0.01 = 1%)
  
  // Position Sizing
  maxPerTrade: number; // Maximum USDC per trade
  totalSpendLimit: number; // Maximum total USDC exposure
  maxPerMarket: number; // Maximum USDC per market
  
  // Risk Management
  balanceStopLoss: number; // Stop loss in USDC (kill switch)
  minPrice: number; // Minimum price to enter
  maxPrice: number; // Maximum price to enter
  ignoreTradesUnder: number; // Ignore trades below this amount (liquidity filter)
  
  // Strategy
  minInefficiency: number; // Minimum inefficiency percentage to trigger trade
  maxInefficiency: number; // Maximum inefficiency percentage (avoid bad entries)
  triggerDelta: number; // Trigger Delta - minimum absolute price movement in USDC required to enter (filters noise, captures momentum)
}

export const DEFAULT_TRADING_CONFIG: TradingConfig = {
  // Order Execution
  marketOrderBuy: true,
  marketOrderSell: true,
  
  // Slippage Configuration
  slippageBuy: 0.01, // 1% slippage for buy orders
  slippageSell: 0.01, // 1% slippage for sell orders
  
  // Position Sizing
  maxPerTrade: 20, // Sniper Mode: $20 USDC per trade (minimum to dilute gas fees)
  totalSpendLimit: 1000, // $1000 USDC total exposure
  maxPerMarket: 200, // $200 USDC per market
  
  // Risk Management
  balanceStopLoss: 200, // Stop loss at $200 USDC
  minPrice: 0.00, // Sniper Mode: Minimum price 0 cents (allows extreme low odds)
  maxPrice: 0.05, // Sniper Mode: Maximum price 5 cents (focus on < 0.05 for 20x returns)
  ignoreTradesUnder: 10, // Ignore trades under $10 USDC
  
  // Strategy
  minInefficiency: 0.05, // Sniper Mode: Minimum 5% inefficiency (sum < 0.95)
  maxInefficiency: 0.50, // Sniper Mode: Maximum 50% inefficiency (allows extreme opportunities)
  triggerDelta: 0.001, // Trigger Delta: $0.001 movement required to enter (filters noise, captures momentum)
};

export class TradingConfigManager {
  private config: TradingConfig;
  private configPath: string;
  
  constructor() {
    this.configPath = path.join(__dirname, '../../config/trading-config.json');
    this.config = { ...DEFAULT_TRADING_CONFIG };
    this.loadConfigFromFile();
  }
  
  private loadConfigFromFile(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const savedConfig = JSON.parse(data) as TradingConfig;
        this.config = { ...DEFAULT_TRADING_CONFIG, ...savedConfig };
        console.log('✅ Trading configuration loaded from file');
      } else {
        console.log('📝 No saved config found, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading config from file:', error);
      this.config = { ...DEFAULT_TRADING_CONFIG };
    }
  }
  
  private saveConfigToFile(): void {
    try {
      console.log('💾 Attempting to save config to file:', this.configPath);
      const dir = path.dirname(this.configPath);
      console.log('💾 Config directory:', dir);
      
      if (!fs.existsSync(dir)) {
        console.log('💾 Creating directory:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('✅ Trading configuration saved to file:', this.configPath);
    } catch (error) {
      console.error('❌ Error saving config to file:', error);
    }
  }
  
  getConfig(): TradingConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<TradingConfig>): void {
    console.log('🔄 updateConfig called with updates:', updates);
    this.config = { ...this.config, ...updates };
    this.saveConfigToFile();
  }
  
  resetToDefaults(): void {
    this.config = { ...DEFAULT_TRADING_CONFIG };
    this.saveConfigToFile();
  }
  
  validateConfig(config: TradingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (config.slippageBuy < 0 || config.slippageBuy > 1) {
      errors.push('Buy slippage must be between 0% and 100%');
    }
    
    if (config.slippageSell < 0 || config.slippageSell > 1) {
      errors.push('Sell slippage must be between 0% and 100%');
    }
    
    if (config.maxPerTrade <= 0) {
      errors.push('Max per trade must be greater than 0');
    }
    
    if (config.totalSpendLimit <= 0) {
      errors.push('Total spend limit must be greater than 0');
    }
    
    if (config.maxPerMarket <= 0) {
      errors.push('Max per market must be greater than 0');
    }
    
    if (config.balanceStopLoss < 0) {
      errors.push('Balance stop loss cannot be negative');
    }
    
    if (config.minPrice < 0 || config.minPrice > 1) {
      errors.push('Min price must be between 0 and 1');
    }
    
    if (config.maxPrice < 0 || config.maxPrice > 1) {
      errors.push('Max price must be between 0 and 1');
    }
    
    if (config.minPrice >= config.maxPrice) {
      errors.push('Min price must be less than max price');
    }
    
    if (config.ignoreTradesUnder < 0) {
      errors.push('Ignore trades under cannot be negative');
    }
    
    if (config.minInefficiency < 0 || config.minInefficiency > 1) {
      errors.push('Min inefficiency must be between 0% and 100%');
    }
    
    if (config.maxInefficiency < 0 || config.maxInefficiency > 1) {
      errors.push('Max inefficiency must be between 0% and 100%');
    }
    
    if (config.minInefficiency >= config.maxInefficiency) {
      errors.push('Min inefficiency must be less than max inefficiency');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const tradingConfigManager = new TradingConfigManager();
