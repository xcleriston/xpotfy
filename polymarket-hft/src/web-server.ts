/**
 * Web Server for Polymarket HFT Bot
 * Provides browser-based interface for testing and monitoring
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { POPULAR_MARKETS, getMarketById, getActiveMarkets, getCategories } from './config/markets';
import { tradingConfigManager, DEFAULT_TRADING_CONFIG, TradingConfig } from './config/trading-config';

interface TradeData {
  id: string;
  marketId: string;
  type: string;
  outcome: string;
  size: number;
  price: number;
  timestamp: number;
  status: string;
  executedPrice?: number;
  executedSize?: number;
  orderId?: string;
  txHash?: string;
  error?: string;
  slippage?: number;
  limit?: number;
  balance?: number;
}

interface PositionData {
  id: string;
  marketId: string;
  type: string;
  size: number;
  averagePrice: number;
  unrealizedPnL: number;
  timestamp: number;
}

interface MarketData {
  marketId: string;
  upPrice: number;
  downPrice: number;
  sum: number;
  timestamp: number;
}

interface BotMetrics {
  totalTrades: number;
  openPositions: number;
  totalPnL: number;
  winRate: number;
  isRunning: boolean;
  walletBalance: number;
}

class WebServer {
  private app: express.Express;
  private server: http.Server;
  private io: SocketIOServer;
  private port: number;
  private trades: TradeData[] = [];
  private positions: PositionData[] = [];
  private marketData: MarketData[] = [];
  private metrics: BotMetrics = {
    totalTrades: 0,
    openPositions: 0,
    totalPnL: 0,
    winRate: 0,
    isRunning: false,
    walletBalance: 0,
  };
  private polymarketCLOB: any;

  constructor(port: number = 3001, polymarketCLOB: any = null) {
    this.port = port;
    this.polymarketCLOB = polymarketCLOB;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes(): void {
    // API Routes
    this.app.get('/api/metrics', (req, res) => {
      res.json(this.metrics);
    });

    this.app.get('/api/trades', (req, res) => {
      res.json(this.trades.slice(-50)); // Last 50 trades
    });

    this.app.get('/api/positions', (req, res) => {
      res.json(this.positions);
    });

    this.app.get('/api/market-data', (req, res) => {
      res.json(this.marketData.slice(-10)); // Last 10 market data points
    });

    this.app.post('/api/start', (req, res) => {
      this.metrics.isRunning = true;
      this.io.emit('botStatus', { running: true });
      res.json({ success: true, message: 'Bot started' });
    });

    this.app.post('/api/stop', (req, res) => {
      this.metrics.isRunning = false;
      this.io.emit('botStatus', { running: false });
      res.json({ success: true, message: 'Bot stopped' });
    });

    // Market selection endpoints
    this.app.get('/api/markets', (req, res) => {
      res.json({
        all: POPULAR_MARKETS,
        active: getActiveMarkets(),
        categories: getCategories(),
      });
    });

    this.app.get('/api/markets/:id', (req, res) => {
      const market = getMarketById(req.params.id);
      if (market) {
        res.json(market);
      } else {
        res.status(404).json({ error: 'Market not found' });
      }
    });

    this.app.post('/api/markets/select', (req, res) => {
      const { marketId } = req.body;
      const market = getMarketById(marketId);
      
      if (market) {
        this.io.emit('marketSelected', market);
        res.json({ success: true, market });
      } else {
        res.status(404).json({ error: 'Market not found' });
      }
    });

    // Wallet balance endpoint
    this.app.get('/api/wallet/balance', async (req, res) => {
      try {
        if (!this.polymarketCLOB) {
          res.json({ balance: 0 });
          return;
        }
        const balance = await this.polymarketCLOB.getBalance();
        this.metrics.walletBalance = balance;
        this.io.emit('metrics', this.metrics);
        res.json({ balance });
      } catch (error: any) {
        console.error('Error fetching wallet balance:', error.message);
        res.status(500).json({ error: 'Failed to fetch balance' });
      }
    });

    // Trading configuration endpoints
    this.app.get('/api/config/trading', (req, res) => {
      res.json(tradingConfigManager.getConfig());
    });

    this.app.post('/api/config/trading', (req, res) => {
      console.log('📝 POST /api/config/trading received:', req.body);
      const updates = req.body;
      const validation = tradingConfigManager.validateConfig({ ...tradingConfigManager.getConfig(), ...updates });
      
      if (validation.valid) {
        console.log('✅ Config validation passed, calling updateConfig');
        tradingConfigManager.updateConfig(updates);
        this.io.emit('tradingConfigUpdated', tradingConfigManager.getConfig());
        res.json({ success: true, config: tradingConfigManager.getConfig() });
      } else {
        console.log('❌ Config validation failed:', validation.errors);
        res.status(400).json({ success: false, errors: validation.errors });
      }
    });

    this.app.post('/api/config/trading/reset', (req, res) => {
      tradingConfigManager.resetToDefaults();
      this.io.emit('tradingConfigUpdated', tradingConfigManager.getConfig());
      res.json({ success: true, config: tradingConfigManager.getConfig() });
    });

    // Serve index.html
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send initial data
      socket.emit('metrics', this.metrics);
      socket.emit('trades', this.trades.slice(-50));
      socket.emit('positions', this.positions);
      socket.emit('marketData', this.marketData.slice(-10));
      socket.emit('botStatus', { running: this.metrics.isRunning });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Methods to update data (called by bot)
  public updateMetrics(metrics: Partial<BotMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
    this.io.emit('metrics', this.metrics);
  }

  public addTrade(trade: TradeData): void {
    this.trades.push(trade);
    this.metrics.totalTrades++;
    this.io.emit('trades', this.trades.slice(-50));
    this.io.emit('metrics', this.metrics);
  }

  public addPosition(position: PositionData): void {
    this.positions.push(position);
    this.metrics.openPositions++;
    this.io.emit('positions', this.positions);
    this.io.emit('metrics', this.metrics);
  }

  public updatePosition(positionId: string, updates: Partial<PositionData>): void {
    const index = this.positions.findIndex(p => p.id === positionId);
    if (index !== -1) {
      this.positions[index] = { ...this.positions[index], ...updates };
      this.io.emit('positions', this.positions);
    }
  }

  public addMarketData(marketData: MarketData): void {
    this.marketData.push(marketData);
    const dataToSend = this.marketData.slice(-10);
    console.log('📤 Emitting marketData to clients:', dataToSend.length, 'items');
    this.io.emit('marketData', dataToSend);
  }

  public addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    this.io.emit('log', { message, type, timestamp: Date.now() });
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`🌐 Web Server running at http://localhost:${this.port}`);
      console.log(`📊 Dashboard available at http://localhost:${this.port}`);
    });
  }

  public stop(): void {
    this.server.close();
    console.log('Web Server stopped');
  }
}

// Create and export singleton
const webServer = new WebServer(3001);
export { webServer, WebServer };

// If this file is executed directly, start the server
if (require.main === module) {
  webServer.start();
}
