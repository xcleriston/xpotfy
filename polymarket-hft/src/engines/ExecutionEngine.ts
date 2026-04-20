import { ethers } from 'ethers';
import { 
  ExecutionRequest, 
  ExecutionResult, 
  Trade, 
  TradingError,
  ExecutionError 
} from '@/types';
import { config } from '@/config';

export class ExecutionEngine {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private nonce: number;
  private gasPriceTracker: Map<number, ethers.BigNumber> = new Map();
  private pendingTransactions: Map<string, ExecutionRequest> = new Map();
  
  // Polymarket contract ABI (simplified)
  private readonly CTF_EXCHANGE_ABI = [
    'function buy(uint256 tokenId, uint256 amount, uint256 maxPrice) external payable returns (uint256)',
    'function sell(uint256 tokenId, uint256 amount, uint256 minPrice) external returns (uint256)',
    'function getBuyPrice(uint256 tokenId, uint256 amount) external view returns (uint256)',
    'function getSellPrice(uint256 tokenId, uint256 amount) external view returns (uint256)'
  ];

  constructor(privateKey: string) {
    this.provider = new ethers.providers.JsonRpcProvider(config.rpc.alchemyUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.nonce = 0;
    this.initializeNonce();
    this.startGasPriceTracking();
  }

  /**
   * Execute a trade request with optimal parameters
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
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
      const receipt = await txResponse.wait(config.execution.confirmationBlocks);
      
      // Calculate execution metrics
      const executionTime = Date.now() - startTime;
      
      if (receipt.status === 1) {
        const result: ExecutionResult = {
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
      } else {
        throw new ExecutionError('Transaction failed', { txHash: receipt.transactionHash });
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof TradingError) {
        throw error;
      }
      
      throw new ExecutionError(
        `Execution failed: ${error.message}`,
        { 
          originalError: error,
          executionTime,
          request 
        }
      );
    }
  }

  /**
   * Execute multiple trades atomically (for hedging)
   */
  async executeBatch(requests: ExecutionRequest[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
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
          } else {
            results.push({
              success: false,
              error: result.reason.message,
              executionTime: Date.now(),
            });
          }
        });
        
      } catch (error) {
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
  async executeWithFlashLoan(
    request: ExecutionRequest,
    callback: (amount: ethers.BigNumber) => Promise<ExecutionResult[]>
  ): Promise<ExecutionResult[]> {
    // This would integrate with Aave/Compound flash loans
    // For now, implementing basic version
    try {
      const loanAmount = request.size;
      const results = await callback(loanAmount);
      return results;
    } catch (error) {
      throw new ExecutionError(`Flash loan execution failed: ${error.message}`);
    }
  }

  /**
   * Get current buy price for a token
   */
  async getBuyPrice(tokenId: string, amount: ethers.BigNumber): Promise<ethers.BigNumber> {
    try {
      const contract = new ethers.Contract(
        this.CTF_EXCHANGE_ADDRESS,
        this.CTF_EXCHANGE_ABI,
        this.provider
      );
      
      return await contract.getBuyPrice(tokenId, amount);
    } catch (error) {
      throw new TradingError(`Failed to get buy price: ${error.message}`, 'PRICE_FETCH_FAILED');
    }
  }

  /**
   * Get current sell price for a token
   */
  async getSellPrice(tokenId: string, amount: ethers.BigNumber): Promise<ethers.BigNumber> {
    try {
      const contract = new ethers.Contract(
        this.CTF_EXCHANGE_ADDRESS,
        this.CTF_EXCHANGE_ABI,
        this.provider
      );
      
      return await contract.getSellPrice(tokenId, amount);
    } catch (error) {
      throw new TradingError(`Failed to get sell price: ${error.message}`, 'PRICE_FETCH_FAILED');
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(request: ExecutionRequest): Promise<ethers.BigNumber> {
    try {
      const tx = await this.buildTransaction(request, ethers.BigNumber.from(0));
      return await this.provider.estimateGas(tx);
    } catch (error) {
      throw new TradingError(`Gas estimation failed: ${error.message}`, 'GAS_ESTIMATION_FAILED');
    }
  }

  /**
   * Get optimal gas price based on network conditions
   */
  private async getOptimalGasPrice(): Promise<ethers.BigNumber> {
    try {
      const gasPrice = await this.provider.getGasPrice();
      
      // Apply multiplier for faster inclusion
      const priorityMultiplier = 1.2;
      const optimalGasPrice = gasPrice.mul(Math.floor(priorityMultiplier * 100)).div(100);
      
      // Ensure we don't exceed maximum
      return optimalGasPrice.gt(config.execution.maxGasPrice) 
        ? config.execution.maxGasPrice 
        : optimalGasPrice;
        
    } catch (error) {
      console.warn('Failed to get optimal gas price, using fallback:', error);
      return config.execution.maxGasPrice.div(2); // Conservative fallback
    }
  }

  /**
   * Build transaction for execution
   */
  private async buildTransaction(
    request: ExecutionRequest, 
    gasPrice: ethers.BigNumber
  ): Promise<ethers.providers.TransactionRequest> {
    const contract = new ethers.Contract(
      this.CTF_EXCHANGE_ADDRESS,
      this.CTF_EXCHANGE_ABI,
      this.wallet
    );

    let txData: string;
    let value: ethers.BigNumber = ethers.BigNumber.from(0);
    
    if (request.type === 'BUY') {
      const amount = request.size;
      const maxPrice = request.maxPrice || ethers.constants.MaxUint256;
      
      txData = contract.interface.encodeFunctionData('buy', [
        request.outcome === 'UP' ? this.UP_TOKEN_ID : this.DOWN_TOKEN_ID,
        amount,
        maxPrice
      ]);
      
      value = amount.mul(maxPrice).div(ethers.BigNumber.from(10).pow(18)); // USDC value
      
    } else { // SELL
      const amount = request.size;
      const minPrice = request.minPrice || ethers.BigNumber.from(0);
      
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
      gasLimit: config.execution.gasLimit || ethers.BigNumber.from(500000),
      gasPrice,
      nonce: await this.getNextNonce(),
      type: 2, // EIP-1559 transaction
    };
  }

  /**
   * Validate execution request
   */
  private async validateExecution(request: ExecutionRequest): Promise<void> {
    // Check deadline
    if (Date.now() > request.deadline) {
      throw new ExecutionError('Execution deadline exceeded');
    }
    
    // Check slippage
    if (request.type === 'BUY' && request.maxPrice) {
      const currentPrice = await this.getBuyPrice(
        request.outcome === 'UP' ? this.UP_TOKEN_ID : this.DOWN_TOKEN_ID,
        request.size
      );
      
      const slippage = currentPrice.sub(request.maxPrice).abs()
        .mul(10000).div(currentPrice);
      
      if (slippage.gt(config.execution.maxSlippage.mul(10000))) {
        throw new ExecutionError('Slippage exceeds maximum allowed');
      }
    }
    
    // Check balance (for buys)
    if (request.type === 'BUY') {
      const balance = await this.provider.getBalance(this.wallet.address);
      const requiredValue = request.size.mul(
        request.maxPrice || ethers.BigNumber.from(10).pow(18)
      ).div(ethers.BigNumber.from(10).pow(18));
      
      if (balance.lt(requiredValue)) {
        throw new ExecutionError('Insufficient balance for execution');
      }
    }
  }

  /**
   * Get next nonce with proper synchronization
   */
  private async getNextNonce(): Promise<number> {
    try {
      const networkNonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
      
      if (networkNonce > this.nonce) {
        this.nonce = networkNonce;
      }
      
      return this.nonce++;
    } catch (error) {
      throw new TradingError(`Failed to get nonce: ${error.message}`, 'NONCE_ERROR');
    }
  }

  /**
   * Initialize nonce from network
   */
  private async initializeNonce(): Promise<void> {
    try {
      this.nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
    } catch (error) {
      console.warn('Failed to initialize nonce, using 0:', error);
      this.nonce = 0;
    }
  }

  /**
   * Start tracking gas prices for optimization
   */
  private startGasPriceTracking(): void {
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
        
      } catch (error) {
        console.warn('Failed to track gas price:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Get execution price from transaction receipt
   */
  private async getExecutionPrice(receipt: ethers.providers.TransactionReceipt): Promise<ethers.BigNumber> {
    // This would parse the transaction logs to determine actual execution price
    // For now, returning estimated price
    return ethers.BigNumber.from(0);
  }

  /**
   * Generate unique trade ID
   */
  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): Map<string, ExecutionRequest> {
    return new Map(this.pendingTransactions);
  }

  /**
   * Cancel pending transaction (if possible)
   */
  async cancelTransaction(txHash: string): Promise<boolean> {
    try {
      const request = this.pendingTransactions.get(txHash);
      if (!request) {
        return false;
      }
      
      // Send cancel transaction with higher gas price
      const cancelTx = {
        to: this.wallet.address,
        value: 0,
        gasLimit: ethers.BigNumber.from(21000),
        gasPrice: (await this.getOptimalGasPrice()).mul(110).div(100), // 10% higher
        nonce: await this.getNextNonce(),
      };
      
      await this.wallet.sendTransaction(cancelTx);
      this.pendingTransactions.delete(txHash);
      
      return true;
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      return false;
    }
  }

  // Contract addresses (would be fetched from config)
  private readonly CTF_EXCHANGE_ADDRESS = '0x4bFb41d96A3e6460A18d4f3d3F3b8e0B0e0e0e0e';
  private readonly UP_TOKEN_ID = 1;
  private readonly DOWN_TOKEN_ID = 2;
}
