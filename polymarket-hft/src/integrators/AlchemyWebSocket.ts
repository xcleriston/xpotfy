/**
 * Alchemy WebSocket Integration
 * Connects to Alchemy WebSocket for real-time blockchain data
 */

import WebSocket from 'ws';

interface BlockData {
  number: number;
  hash: string;
  timestamp: number;
  gasLimit: number;
  gasUsed: number;
}

interface LogData {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  blockNumber: number;
}

class AlchemyWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private subscriptions: Set<string> = new Set();
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          console.log('✅ Connected to Alchemy WebSocket');
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // Resubscribe to all subscriptions after reconnection
          this.subscriptions.forEach(subscription => {
            this.sendSubscription(subscription);
          });
          
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        });

        this.ws.on('close', () => {
          console.log('WebSocket connection closed');
          this.emit('disconnected');
          this.scheduleReconnect();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    const { method, params, result } = message;

    if (method === 'eth_subscription') {
      const subscription = params.subscription;
      const data = params.result;

      // Emit based on subscription type
      this.emit('data', { subscription, data });

      // Specific events based on data type
      if (data.logs) {
        this.emit('logs', data.logs);
      } else if (data.block) {
        this.emit('block', data.block);
      } else if (data.transaction) {
        this.emit('transaction', data.transaction);
      }
    }
  }

  /**
   * Send subscription request
   */
  private sendSubscription(subscription: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(subscription);
    }
  }

  /**
   * Subscribe to new blocks
   */
  async subscribeToNewBlocks(): Promise<void> {
    const subscription = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: ['newHeads'],
    });

    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
    console.log('✅ Subscribed to new blocks');
  }

  /**
   * Subscribe to logs for specific contract addresses
   */
  async subscribeToLogs(addresses: string[]): Promise<void> {
    const subscription = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_subscribe',
      params: [
        'logs',
        {
          address: addresses,
        },
      ],
    });

    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
    console.log('✅ Subscribed to logs for addresses:', addresses);
  }

  /**
   * Subscribe to pending transactions
   */
  async subscribeToPendingTransactions(): Promise<void> {
    const subscription = JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'eth_subscribe',
      params: ['newPendingTransactions'],
    });

    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
    console.log('✅ Subscribed to pending transactions');
  }

  /**
   * Subscribe to specific topic filters
   */
  async subscribeToTopics(topics: string[]): Promise<void> {
    const subscription = JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'eth_subscribe',
      params: [
        'logs',
        {
          topics: [topics],
        },
      ],
    });

    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
    console.log('✅ Subscribed to topics:', topics);
  }

  /**
   * Send JSON-RPC request
   */
  async sendRequest(method: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      };

      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === request.id) {
            this.ws?.off('message', messageHandler);
            if (response.error) {
              reject(response.error);
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      this.ws.on('message', messageHandler);
      this.ws.send(JSON.stringify(request));
    });
  }

  /**
   * Get latest block number
   */
  async getBlockNumber(): Promise<number> {
    const result = await this.sendRequest('eth_blockNumber');
    return parseInt(result, 16);
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: number): Promise<BlockData> {
    const result = await this.sendRequest('eth_getBlockByNumber', [
      `0x${blockNumber.toString(16)}`,
      false,
    ]);
    return {
      number: parseInt(result.number, 16),
      hash: result.hash,
      timestamp: parseInt(result.timestamp, 16),
      gasLimit: parseInt(result.gasLimit, 16),
      gasUsed: parseInt(result.gasUsed, 16),
    };
  }

  /**
   * Event emitter methods
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const alchemyWebSocket = new AlchemyWebSocket(
  process.env.ALCHEMY_WEBSOCKET_URL || 'wss://polygon-mainnet.g.alchemy.com/v2/VDsFz_Ooaj0-4vaVrIxOd'
);
export { AlchemyWebSocket };
