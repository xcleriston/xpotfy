/**
 * Polymarket CLOB Client Integration
 * Uses official @polymarket/clob-client SDK for real trade execution
 */

import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import { tradingConfigManager } from '../config/trading-config';
import { Chain } from '@polymarket/clob-client/dist/types';

export interface TradeRequest {
  tokenID: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
}

export interface TradeResult {
  success: boolean;
  orderId?: any;
  executedPrice?: number;
  executedSize?: number;
  transactionHash?: any;
  error?: string;
}

export class PolymarketCLOB {
  private client: ClobClient | null = null;
  private walletAddress: string;
  private privateKey: string;
  private isInitialized: boolean = false;

  constructor(walletAddress: string, privateKey: string) {
    this.walletAddress = walletAddress;
    this.privateKey = privateKey;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔑 Initializing Polymarket CLOB client...');
      
      // Create signer from private key
      const signer = new ethers.Wallet(this.privateKey);
      
      // Create temporary client to derive API credentials
      const tempClient = new ClobClient(
        'https://clob.polymarket.com',
        Chain.POLYGON,
        signer
      );
      
      // Derive API credentials
      const apiCreds = await tempClient.createOrDeriveApiKey();
      
      // Initialize trading client with signer and credentials
      this.client = new ClobClient(
        'https://clob.polymarket.com',
        Chain.POLYGON,
        signer,
        apiCreds,
        0 // signatureType (EIP-712 signing)
      );

      this.isInitialized = true;
      console.log('✅ Polymarket CLOB client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CLOB client:', error);
      throw error;
    }
  }

  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    if (!this.isInitialized || !this.client) {
      throw new Error('CLOB client not initialized');
    }

    const config = tradingConfigManager.getConfig();

    try {
      console.log(`📤 Executing ${request.side} order:`, {
        tokenID: request.tokenID,
        price: request.price,
        size: request.size,
      });

      // Apply slippage
      const slippage = request.side === 'BUY' ? config.slippageBuy : config.slippageSell;
      const adjustedPrice = request.side === 'BUY' 
        ? request.price * (1 + slippage)
        : request.price * (1 - slippage);

      // Execute order using createAndPostOrder as per documentation
      const response = await this.client.createAndPostOrder(
        {
          tokenID: request.tokenID,
          price: adjustedPrice,
          size: request.size,
          side: request.side === 'BUY' ? Side.BUY : Side.SELL,
        },
        {
          tickSize: "0.01",
          negRisk: false,
        },
        OrderType.GTC
      );

      console.log('✅ Order executed successfully:', response);

      return {
        success: true,
        orderId: response.orderID,
        executedPrice: adjustedPrice,
        executedSize: request.size,
        transactionHash: response.transactionHash,
      };
    } catch (error: any) {
      console.error('❌ Trade execution failed:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  async getOpenOrders(): Promise<any[]> {
    if (!this.isInitialized || !this.client) {
      throw new Error('CLOB client not initialized');
    }

    try {
      const orders = await this.client.getOpenOrders();
      return orders;
    } catch (error) {
      console.error('❌ Failed to get open orders:', error);
      throw error;
    }
  }

  async getOrderBook(tokenID: string): Promise<{ bidPrice: number; askPrice: number } | null> {
    try {
      console.log(`📊 Fetching orderbook for token ${tokenID}...`);
      
      // Use REST API directly to get orderbook
      const response = await fetch(`https://clob.polymarket.com/book?token_id=${tokenID}`);
      
      if (!response.ok) {
        console.log(`⚠️ Failed to fetch orderbook: ${response.status}`);
        return null;
      }

      const data = await response.json() as any;
      
      if (!data || !data.bids || !data.asks) {
        console.log(`⚠️ No orderbook data for token ${tokenID}`);
        return null;
      }

      // Get best bid and ask prices
      const bestBid = data.bids[0]; // Highest buy price
      const bestAsk = data.asks[0]; // Lowest sell price
      
      if (!bestBid || !bestAsk) {
        console.log(`⚠️ No bids or asks for token ${tokenID}`);
        return null;
      }

      const bidPrice = parseFloat(bestBid.price);
      const askPrice = parseFloat(bestAsk.price);
      
      console.log(`📊 Orderbook for ${tokenID}:`, {
        bidPrice: bidPrice.toFixed(4),
        askPrice: askPrice.toFixed(4),
        spread: (askPrice - bidPrice).toFixed(4)
      });

      return { bidPrice, askPrice };
    } catch (error: any) {
      console.error(`❌ Failed to fetch orderbook for ${tokenID}:`, error.message);
      return null;
    }
  }

  async getMarkets(): Promise<any[]> {
    if (!this.isInitialized || !this.client) {
      throw new Error('CLOB client not initialized');
    }

    try {
      console.log('📊 Fetching markets from CLOB API...');
      
      // Get markets from CLOB - returns PaginationPayload
      const response = await this.client.getMarkets();
      const markets = (response as any).data || [];
      
      console.log(`📊 Fetched ${markets.length} markets from CLOB`);
      return markets;
    } catch (error: any) {
      console.error('❌ Failed to fetch markets from CLOB:', error.message);
      throw error;
    }
  }

  async getBalance(): Promise<number> {
    console.log('💰 getBalance() called');
    try {
      console.log('💰 Fetching wallet balance from Polymarket...');
      console.log('💰 Wallet address:', this.walletAddress);
      
      // Use REST API to get balance with wallet address
      const response = await fetch(`https://clob.polymarket.com/balance?address=${this.walletAddress}`);
      
      console.log('💰 Balance API response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Failed to fetch balance from Polymarket API:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        console.log('💰 Falling back to Alchemy RPC for USDC balance...');
        return await this.getUSDCBalanceFromRPC();
      }

      const data = await response.json() as any;
      console.log('💰 Balance API response data:', data);
      
      const balance = parseFloat(data.balance) || parseFloat(data.usdc_balance) || 0;
      
      if (balance > 0) {
        console.log(`💰 Wallet balance from Polymarket API: $${balance.toFixed(2)}`);
        return balance;
      } else {
        console.log('💰 Polymarket API returned 0, falling back to Alchemy RPC...');
        return await this.getUSDCBalanceFromRPC();
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch balance from Polymarket API:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.log('💰 Falling back to Alchemy RPC for USDC balance...');
      return await this.getUSDCBalanceFromRPC();
    }
  }

  private async getUSDCBalanceFromRPC(): Promise<number> {
    try {
      console.log('💰 Fetching USDC balance from Alchemy RPC...');
      
      // USDC contract address on Polygon
      const usdcContractAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
      const alchemyUrl = process.env.ALCHEMY_POLYGON_URL || '';
      
      if (!alchemyUrl) {
        console.error('❌ ALCHEMY_POLYGON_URL not set in environment variables');
        return 0;
      }

      // ERC20 balanceOf function signature
      const balanceOfSignature = '0x70a08231';
      // Pad address to 32 bytes
      const paddedAddress = this.walletAddress.slice(2).padStart(64, '0');
      
      const payload = {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: usdcContractAddress,
            data: balanceOfSignature + paddedAddress
          },
          'latest'
        ],
        id: 1
      };

      const response = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch USDC balance from Alchemy:', response.status);
        return 0;
      }

      const data = await response.json() as any;
      if (data.error) {
        console.error('❌ Alchemy RPC error:', data.error);
        return 0;
      }

      // Convert hex to number (USDC has 6 decimals)
      const balanceHex = data.result;
      const balanceWei = parseInt(balanceHex, 16);
      const balance = balanceWei / 1e6; // USDC has 6 decimals
      
      console.log(`💰 USDC balance from Alchemy: $${balance.toFixed(2)}`);
      return balance;
    } catch (error: any) {
      console.error('❌ Failed to fetch USDC balance from Alchemy:', error.message);
      return 0;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }
}
