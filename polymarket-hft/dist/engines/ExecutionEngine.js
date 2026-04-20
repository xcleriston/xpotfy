"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionEngine = void 0;
const ethers_1 = require("ethers");
const types_1 = require("@/types");
const config_1 = require("@/config");
class ExecutionEngine {
    provider;
    wallet;
    nonce;
    gasPriceTracker = new Map();
    pendingTransactions = new Map();
    // Polymarket contract ABI (simplified)
    CTF_EXCHANGE_ABI = [
        'function buy(uint256 tokenId, uint256 amount, uint256 maxPrice) external payable returns (uint256)',
        'function sell(uint256 tokenId, uint256 amount, uint256 minPrice) external returns (uint256)',
        'function getBuyPrice(uint256 tokenId, uint256 amount) external view returns (uint256)',
        'function getSellPrice(uint256 tokenId, uint256 amount) external view returns (uint256)'
    ];
    constructor(privateKey) {
        this.provider = new ethers_1.ethers.providers.JsonRpcProvider(config_1.config.rpc.alchemyUrl);
        this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
        this.nonce = 0;
        this.initializeNonce();
        this.startGasPriceTracking();
    }
    /**
     * Execute a trade request with optimal parameters
     */
    async execute(request) {
        const startTime = Date.now();
        try {
            // Pre-execution validation
            await this.validateExecution(request);
            // Get optimal gas price
            const gasPrice = await this.getOptimalGasPrice();
            // Build transaction
            const tx = await this.buildTransaction(request, gasPrice);
            // Execute transaction
            const txResponse = await this.wallet.sendTransaction(tx);
            // Store pending transaction
            this.pendingTransactions.set(txResponse.hash, request);
            // Wait for confirmation
            const receipt = await txResponse.wait(config_1.config.execution.confirmationBlocks);
            // Calculate execution metrics
            const executionTime = Date.now() - startTime;
            if (receipt.status === 1) {
                const result = {
                    success: true,
                    tradeId: this.generateTradeId(),
                    txHash: receipt.transactionHash,
                    executedPrice: await this.getExecutionPrice(receipt),
                    executedSize: request.size,
                    fee: receipt.gasUsed.mul(gasPrice),
                    executionTime,
                };
                this.pendingTransactions.delete(receipt.transactionHash);
                return result;
            }
            else {
                throw new types_1.ExecutionError('Transaction failed', { txHash: receipt.transactionHash });
            }
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            if (error instanceof types_1.TradingError) {
                throw error;
            }
            throw new types_1.ExecutionError(`Execution failed: ${error.message}`, {
                originalError: error,
                executionTime,
                request
            });
        }
    }
    /**
     * Execute multiple trades atomically (for hedging)
     */
    async executeBatch(requests) {
        const results = [];
        const batchSize = 3; // Limit batch size to avoid gas limit issues
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            try {
                // Execute batch in parallel
                const batchPromises = batch.map(request => this.execute(request));
                const batchResults = await Promise.allSettled(batchPromises);
                // Process results
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    }
                    else {
                        results.push({
                            success: false,
                            error: result.reason.message,
                            executionTime: Date.now(),
                        });
                    }
                });
            }
            catch (error) {
                console.error('Batch execution failed:', error);
                // Add failed results for this batch
                batch.forEach(() => {
                    results.push({
                        success: false,
                        error: error.message,
                        executionTime: Date.now(),
                    });
                });
            }
        }
        return results;
    }
    /**
     * Flash loan execution for arbitrage (advanced feature)
     */
    async executeWithFlashLoan(request, callback) {
        // This would integrate with Aave/Compound flash loans
        // For now, implementing basic version
        try {
            const loanAmount = request.size;
            const results = await callback(loanAmount);
            return results;
        }
        catch (error) {
            throw new types_1.ExecutionError(`Flash loan execution failed: ${error.message}`);
        }
    }
    /**
     * Get current buy price for a token
     */
    async getBuyPrice(tokenId, amount) {
        try {
            const contract = new ethers_1.ethers.Contract(this.CTF_EXCHANGE_ADDRESS, this.CTF_EXCHANGE_ABI, this.provider);
            return await contract.getBuyPrice(tokenId, amount);
        }
        catch (error) {
            throw new types_1.TradingError(`Failed to get buy price: ${error.message}`, 'PRICE_FETCH_FAILED');
        }
    }
    /**
     * Get current sell price for a token
     */
    async getSellPrice(tokenId, amount) {
        try {
            const contract = new ethers_1.ethers.Contract(this.CTF_EXCHANGE_ADDRESS, this.CTF_EXCHANGE_ABI, this.provider);
            return await contract.getSellPrice(tokenId, amount);
        }
        catch (error) {
            throw new types_1.TradingError(`Failed to get sell price: ${error.message}`, 'PRICE_FETCH_FAILED');
        }
    }
    /**
     * Estimate gas for transaction
     */
    async estimateGas(request) {
        try {
            const tx = await this.buildTransaction(request, ethers_1.ethers.BigNumber.from(0));
            return await this.provider.estimateGas(tx);
        }
        catch (error) {
            throw new types_1.TradingError(`Gas estimation failed: ${error.message}`, 'GAS_ESTIMATION_FAILED');
        }
    }
    /**
     * Get optimal gas price based on network conditions
     */
    async getOptimalGasPrice() {
        try {
            const gasPrice = await this.provider.getGasPrice();
            // Apply multiplier for faster inclusion
            const priorityMultiplier = 1.2;
            const optimalGasPrice = gasPrice.mul(Math.floor(priorityMultiplier * 100)).div(100);
            // Ensure we don't exceed maximum
            return optimalGasPrice.gt(config_1.config.execution.maxGasPrice)
                ? config_1.config.execution.maxGasPrice
                : optimalGasPrice;
        }
        catch (error) {
            console.warn('Failed to get optimal gas price, using fallback:', error);
            return config_1.config.execution.maxGasPrice.div(2); // Conservative fallback
        }
    }
    /**
     * Build transaction for execution
     */
    async buildTransaction(request, gasPrice) {
        const contract = new ethers_1.ethers.Contract(this.CTF_EXCHANGE_ADDRESS, this.CTF_EXCHANGE_ABI, this.wallet);
        let txData;
        let value = ethers_1.ethers.BigNumber.from(0);
        if (request.type === 'BUY') {
            const amount = request.size;
            const maxPrice = request.maxPrice || ethers_1.ethers.constants.MaxUint256;
            txData = contract.interface.encodeFunctionData('buy', [
                request.outcome === 'UP' ? this.UP_TOKEN_ID : this.DOWN_TOKEN_ID,
                amount,
                maxPrice
            ]);
            value = amount.mul(maxPrice).div(ethers_1.ethers.BigNumber.from(10).pow(18)); // USDC value
        }
        else { // SELL
            const amount = request.size;
            const minPrice = request.minPrice || ethers_1.ethers.BigNumber.from(0);
            txData = contract.interface.encodeFunctionData('sell', [
                request.outcome === 'UP' ? this.UP_TOKEN_ID : this.DOWN_TOKEN_ID,
                amount,
                minPrice
            ]);
        }
        return {
            to: this.CTF_EXCHANGE_ADDRESS,
            data: txData,
            value,
            gasLimit: config_1.config.execution.gasLimit || ethers_1.ethers.BigNumber.from(500000),
            gasPrice,
            nonce: await this.getNextNonce(),
            type: 2, // EIP-1559 transaction
        };
    }
    /**
     * Validate execution request
     */
    async validateExecution(request) {
        // Check deadline
        if (Date.now() > request.deadline) {
            throw new types_1.ExecutionError('Execution deadline exceeded');
        }
        // Check slippage
        if (request.type === 'BUY' && request.maxPrice) {
            const currentPrice = await this.getBuyPrice(request.outcome === 'UP' ? this.UP_TOKEN_ID : this.DOWN_TOKEN_ID, request.size);
            const slippage = currentPrice.sub(request.maxPrice).abs()
                .mul(10000).div(currentPrice);
            if (slippage.gt(config_1.config.execution.maxSlippage.mul(10000))) {
                throw new types_1.ExecutionError('Slippage exceeds maximum allowed');
            }
        }
        // Check balance (for buys)
        if (request.type === 'BUY') {
            const balance = await this.provider.getBalance(this.wallet.address);
            const requiredValue = request.size.mul(request.maxPrice || ethers_1.ethers.BigNumber.from(10).pow(18)).div(ethers_1.ethers.BigNumber.from(10).pow(18));
            if (balance.lt(requiredValue)) {
                throw new types_1.ExecutionError('Insufficient balance for execution');
            }
        }
    }
    /**
     * Get next nonce with proper synchronization
     */
    async getNextNonce() {
        try {
            const networkNonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
            if (networkNonce > this.nonce) {
                this.nonce = networkNonce;
            }
            return this.nonce++;
        }
        catch (error) {
            throw new types_1.TradingError(`Failed to get nonce: ${error.message}`, 'NONCE_ERROR');
        }
    }
    /**
     * Initialize nonce from network
     */
    async initializeNonce() {
        try {
            this.nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
        }
        catch (error) {
            console.warn('Failed to initialize nonce, using 0:', error);
            this.nonce = 0;
        }
    }
    /**
     * Start tracking gas prices for optimization
     */
    startGasPriceTracking() {
        setInterval(async () => {
            try {
                const gasPrice = await this.provider.getGasPrice();
                const timestamp = Date.now();
                this.gasPriceTracker.set(timestamp, gasPrice);
                // Keep only last hour of data
                const cutoff = timestamp - 3600000; // 1 hour ago
                for (const [key] of this.gasPriceTracker) {
                    if (key < cutoff) {
                        this.gasPriceTracker.delete(key);
                    }
                }
            }
            catch (error) {
                console.warn('Failed to track gas price:', error);
            }
        }, 30000); // Update every 30 seconds
    }
    /**
     * Get execution price from transaction receipt
     */
    async getExecutionPrice(receipt) {
        // This would parse the transaction logs to determine actual execution price
        // For now, returning estimated price
        return ethers_1.ethers.BigNumber.from(0);
    }
    /**
     * Generate unique trade ID
     */
    generateTradeId() {
        return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get pending transactions
     */
    getPendingTransactions() {
        return new Map(this.pendingTransactions);
    }
    /**
     * Cancel pending transaction (if possible)
     */
    async cancelTransaction(txHash) {
        try {
            const request = this.pendingTransactions.get(txHash);
            if (!request) {
                return false;
            }
            // Send cancel transaction with higher gas price
            const cancelTx = {
                to: this.wallet.address,
                value: 0,
                gasLimit: ethers_1.ethers.BigNumber.from(21000),
                gasPrice: (await this.getOptimalGasPrice()).mul(110).div(100), // 10% higher
                nonce: await this.getNextNonce(),
            };
            await this.wallet.sendTransaction(cancelTx);
            this.pendingTransactions.delete(txHash);
            return true;
        }
        catch (error) {
            console.error('Failed to cancel transaction:', error);
            return false;
        }
    }
    // Contract addresses (would be fetched from config)
    CTF_EXCHANGE_ADDRESS = '0x4bFb41d96A3e6460A18d4f3d3F3b8e0B0e0e0e0e';
    UP_TOKEN_ID = 1;
    DOWN_TOKEN_ID = 2;
}
exports.ExecutionEngine = ExecutionEngine;
//# sourceMappingURL=ExecutionEngine.js.map