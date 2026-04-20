import { ethers } from 'ethers';
import { ExecutionRequest, ExecutionResult } from '@/types';
export declare class ExecutionEngine {
    private provider;
    private wallet;
    private nonce;
    private gasPriceTracker;
    private pendingTransactions;
    private readonly CTF_EXCHANGE_ABI;
    constructor(privateKey: string);
    /**
     * Execute a trade request with optimal parameters
     */
    execute(request: ExecutionRequest): Promise<ExecutionResult>;
    /**
     * Execute multiple trades atomically (for hedging)
     */
    executeBatch(requests: ExecutionRequest[]): Promise<ExecutionResult[]>;
    /**
     * Flash loan execution for arbitrage (advanced feature)
     */
    executeWithFlashLoan(request: ExecutionRequest, callback: (amount: ethers.BigNumber) => Promise<ExecutionResult[]>): Promise<ExecutionResult[]>;
    /**
     * Get current buy price for a token
     */
    getBuyPrice(tokenId: string, amount: ethers.BigNumber): Promise<ethers.BigNumber>;
    /**
     * Get current sell price for a token
     */
    getSellPrice(tokenId: string, amount: ethers.BigNumber): Promise<ethers.BigNumber>;
    /**
     * Estimate gas for transaction
     */
    estimateGas(request: ExecutionRequest): Promise<ethers.BigNumber>;
    /**
     * Get optimal gas price based on network conditions
     */
    private getOptimalGasPrice;
    /**
     * Build transaction for execution
     */
    private buildTransaction;
    /**
     * Validate execution request
     */
    private validateExecution;
    /**
     * Get next nonce with proper synchronization
     */
    private getNextNonce;
    /**
     * Initialize nonce from network
     */
    private initializeNonce;
    /**
     * Start tracking gas prices for optimization
     */
    private startGasPriceTracking;
    /**
     * Get execution price from transaction receipt
     */
    private getExecutionPrice;
    /**
     * Generate unique trade ID
     */
    private generateTradeId;
    /**
     * Get pending transactions
     */
    getPendingTransactions(): Map<string, ExecutionRequest>;
    /**
     * Cancel pending transaction (if possible)
     */
    cancelTransaction(txHash: string): Promise<boolean>;
    private readonly CTF_EXCHANGE_ADDRESS;
    private readonly UP_TOKEN_ID;
    private readonly DOWN_TOKEN_ID;
}
//# sourceMappingURL=ExecutionEngine.d.ts.map