"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.CURRENT_ENV = exports.ENVIRONMENTS = exports.CONFIG = void 0;
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.CONFIG = {
    rpc: {
        alchemyUrl: process.env.ALCHEMY_POLYGON_URL || 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
        polygonRpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    },
    markets: {
        monitoredMarkets: process.env.MONITORED_MARKETS?.split(',') || [],
        minLiquidity: ethers_1.BigNumber.from(100000), // $100k minimum liquidity
        maxSpread: 0.02, // 2% maximum spread
    },
    strategy: {
        thresholds: [0.95, 0.92, 0.90], // Arbitrage thresholds
        positionSizing: 'KELLY',
        baseSize: ethers_1.BigNumber.from(1000), // Base position size in USD
        maxLeverage: 3.0,
    },
    risk: {
        maxPositionSize: ethers_1.BigNumber.from(10000), // $10k per position
        maxExposurePerMarket: ethers_1.BigNumber.from(25000), // $25k per market
        maxTotalExposure: ethers_1.BigNumber.from(100000), // $100k total exposure
        maxSlippage: 0.005, // 0.5% maximum slippage
        stopLossPercentage: 0.02, // 2% stop loss
        hedgeTimeout: 30000, // 30 seconds to complete hedge
        maxOpenPositions: 10,
    },
    execution: {
        maxGasPrice: ethers_1.BigNumber.from(100000000000), // 100 gwei
        maxSlippage: 0.01, // 1% execution slippage
        confirmationBlocks: 2,
    },
};
// Environment-specific configurations
exports.ENVIRONMENTS = {
    development: {
        ...exports.CONFIG,
        risk: {
            ...exports.CONFIG.risk,
            maxPositionSize: ethers_1.BigNumber.from(100), // $100 for testing
            maxTotalExposure: ethers_1.BigNumber.from(1000), // $1k for testing
        },
    },
    production: exports.CONFIG,
    staging: {
        ...exports.CONFIG,
        risk: {
            ...exports.CONFIG.risk,
            maxPositionSize: ethers_1.BigNumber.from(5000), // $5k for staging
            maxTotalExposure: ethers_1.BigNumber.from(50000), // $50k for staging
        },
    },
};
exports.CURRENT_ENV = process.env.NODE_ENV || 'development';
exports.config = exports.ENVIRONMENTS[exports.CURRENT_ENV] || exports.CONFIG;
//# sourceMappingURL=index.js.map