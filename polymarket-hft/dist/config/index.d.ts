import { BotConfig } from '@/types';
import { BigNumber } from 'ethers';
export declare const CONFIG: BotConfig;
export declare const ENVIRONMENTS: {
    development: {
        risk: {
            maxPositionSize: BigNumber;
            maxTotalExposure: BigNumber;
            maxExposurePerMarket: BigNumber;
            maxSlippage: number;
            stopLossPercentage: number;
            hedgeTimeout: number;
            maxOpenPositions: number;
        };
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
            positionSizing: "FIXED" | "KELLY" | "VOLATILITY";
            baseSize: BigNumber;
            maxLeverage: number;
        };
        execution: {
            maxGasPrice: BigNumber;
            maxSlippage: number;
            confirmationBlocks: number;
        };
    };
    production: BotConfig;
    staging: {
        risk: {
            maxPositionSize: BigNumber;
            maxTotalExposure: BigNumber;
            maxExposurePerMarket: BigNumber;
            maxSlippage: number;
            stopLossPercentage: number;
            hedgeTimeout: number;
            maxOpenPositions: number;
        };
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
            positionSizing: "FIXED" | "KELLY" | "VOLATILITY";
            baseSize: BigNumber;
            maxLeverage: number;
        };
        execution: {
            maxGasPrice: BigNumber;
            maxSlippage: number;
            confirmationBlocks: number;
        };
    };
};
export declare const CURRENT_ENV: string;
export declare const config: BotConfig | {
    risk: {
        maxPositionSize: BigNumber;
        maxTotalExposure: BigNumber;
        maxExposurePerMarket: BigNumber;
        maxSlippage: number;
        stopLossPercentage: number;
        hedgeTimeout: number;
        maxOpenPositions: number;
    };
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
        positionSizing: "FIXED" | "KELLY" | "VOLATILITY";
        baseSize: BigNumber;
        maxLeverage: number;
    };
    execution: {
        maxGasPrice: BigNumber;
        maxSlippage: number;
        confirmationBlocks: number;
    };
} | {
    risk: {
        maxPositionSize: BigNumber;
        maxTotalExposure: BigNumber;
        maxExposurePerMarket: BigNumber;
        maxSlippage: number;
        stopLossPercentage: number;
        hedgeTimeout: number;
        maxOpenPositions: number;
    };
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
        positionSizing: "FIXED" | "KELLY" | "VOLATILITY";
        baseSize: BigNumber;
        maxLeverage: number;
    };
    execution: {
        maxGasPrice: BigNumber;
        maxSlippage: number;
        confirmationBlocks: number;
    };
};
//# sourceMappingURL=index.d.ts.map