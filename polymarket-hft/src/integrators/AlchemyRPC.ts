/**
 * Alchemy RPC Integration
 * Uses HTTP RPC instead of WebSocket to avoid rate limiting
 */

import { ethers } from 'ethers';

class AlchemyRPC {
  private provider: ethers.providers.JsonRpcProvider;
  private url: string;

  constructor(url: string) {
    this.url = url;
    this.provider = new ethers.providers.JsonRpcProvider(url);
  }

  /**
   * Get latest block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: number): Promise<any> {
    return await this.provider.getBlock(blockNumber);
  }

  /**
   * Get latest block
   */
  async getLatestBlock(): Promise<any> {
    return await this.provider.getBlock('latest');
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<any> {
    return await this.provider.getTransaction(txHash);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Get balance
   */
  async getBalance(address: string): Promise<ethers.BigNumber> {
    return await this.provider.getBalance(address);
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<ethers.BigNumber> {
    return await this.provider.getGasPrice();
  }

  /**
   * Estimate gas
   */
  async estimateGas(transaction: any): Promise<ethers.BigNumber> {
    return await this.provider.estimateGas(transaction);
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction: any): Promise<ethers.providers.TransactionResponse> {
    return await this.provider.sendTransaction(transaction);
  }

  /**
   * Call contract method
   */
  async call(contract: ethers.Contract, method: string, params: any[]): Promise<any> {
    return await contract[method](...params);
  }

  /**
   * Get logs
   */
  async getLogs(filter: ethers.providers.Filter): Promise<ethers.providers.Log[]> {
    return await this.provider.getLogs(filter);
  }

  /**
   * Get network
   */
  async getNetwork(): Promise<ethers.providers.Network> {
    return await this.provider.getNetwork();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return true; // RPC provider is always connected for HTTP
  }
}

// Singleton instance
export const alchemyRPC = new AlchemyRPC(
  process.env.ALCHEMY_POLYGON_URL || 'https://polygon-mainnet.g.alchemy.com/v2/VDsFz_Ooaj0-4vaVrIxOd'
);
export { AlchemyRPC };
