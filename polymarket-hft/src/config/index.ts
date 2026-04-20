import { BotConfig } from '@/types';
import { BigNumber } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG: BotConfig = {
  rpc: {
    alchemyUrl: process.env.ALCHEMY_POLYGON_URL || 'https://polygon-mainnet.g.alchemy.com/v2/VDsFz_Ooaj0-4vaVrIxOd',
    alchemyWebSocketUrl: process.env.ALCHEMY_WEBSOCKET_URL || 'wss://polygon-mainnet.g.alchemy.com/v2/VDsFz_Ooaj0-4vaVrIxOd',
    polygonRpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  },
  markets: {
    monitoredMarkets: process.env.MONITORED_MARKETS?.split(',') || [],
    minLiquidity: BigNumber.from(100000), // $100k minimum liquidity
    maxSpread: 0.02, // 2% maximum spread
  },
  strategy: {
    thresholds: [0.95, 0.92, 0.90], // Arbitrage thresholds
    positionSizing: 'KELLY',
    baseSize: BigNumber.from(1000), // Base position size in USD
    maxLeverage: 3.0,
  },
  risk: {
    maxPositionSize: BigNumber.from(10000), // $10k per position
    maxExposurePerMarket: BigNumber.from(25000), // $25k per market
    maxTotalExposure: BigNumber.from(100000), // $100k total exposure
    maxSlippage: 0.005, // 0.5% maximum slippage
    stopLossPercentage: 0.02, // 2% stop loss
    hedgeTimeout: 30000, // 30 seconds to complete hedge
    maxOpenPositions: 10,
  },
  execution: {
    maxGasPrice: BigNumber.from(100000000000), // 100 gwei
    maxSlippage: 0.01, // 1% execution slippage
    confirmationBlocks: 2,
  },
};

// Environment-specific configurations
export const ENVIRONMENTS = {
  development: {
    ...CONFIG,
    risk: {
      ...CONFIG.risk,
      maxPositionSize: BigNumber.from(100), // $100 for testing
      maxTotalExposure: BigNumber.from(1000), // $1k for testing
    },
  },
  production: CONFIG,
  staging: {
    ...CONFIG,
    risk: {
      ...CONFIG.risk,
      maxPositionSize: BigNumber.from(5000), // $5k for staging
      maxTotalExposure: BigNumber.from(50000), // $50k for staging
    },
  },
};

export const CURRENT_ENV = process.env.NODE_ENV || 'development';
export const config = ENVIRONMENTS[CURRENT_ENV as keyof typeof ENVIRONMENTS] || CONFIG;
