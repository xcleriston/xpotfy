# 🚀 Quick Start Guide - Polymarket HFT Bot

## 🎯 Opções de Teste Local

### Opção 1: Teste Rápido (Recomendado)
```bash
# 1. Instalar dependências
npm install

# 2. Testar compilação (vai ter erros TypeScript - é normal)
npm run build

# 3. Testar configuração básica
node -e "console.log('✅ Node.js funcionando');"

# 4. Testar imports principais
node -e "
try {
  require('./dist/config/index.js');
  console.log('✅ Configuração carregada');
} catch(e) {
  console.log('❌ Erro:', e.message);
}
"
```

### Opção 2: Ambiente Completo com Docker
```bash
# Windows (PowerShell)
.\scripts\setup-dev.ps1

# Linux/Mac
./scripts/setup-dev.sh

# Acessar serviços:
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# App: http://localhost:8080
```

### Opção 3: Testes Unitários
```bash
# Windows
.\scripts\test-local.ps1

# Linux/Mac  
./scripts/test-local.sh
```

## 🔧 Configuração Mínima

### 1. Criar .env
```bash
# Copiar template
copy .env.example .env

# Editar (mínimo para testes)
ALCHEMY_POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/demo
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000000
MONITORED_MARKETS=test_market_1
LOG_LEVEL=debug
```

### 2. Variáveis Obrigatórias
```bash
# Mínimo para funcionamento:
ALCHEMY_POLYGON_URL=seu_api_key
PRIVATE_KEY=sua_chave_privada
MONITORED_MARKETS=mercado_1,mercado_2
```

## 🐛 Solução de Problemas Comuns

### Erros de TypeScript (Normal no primeiro build)
```bash
# Erros esperados (não bloqueiam):
- Cannot find module 'events'
- Cannot find module 'ethers' 
- Cannot find name 'process'

# Solução: Instalar dependências
npm install

# Se persistir, ignorar erros de tipagem por enquanto
npm run build -- --skipLibCheck
```

### Problemas de Porta
```bash
# Verificar portas em uso
netstat -ano | findstr :8080
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Matar processos se necessário
taskkill /PID <PID> /F
```

### Docker Issues
```bash
# Limpar containers antigos
docker system prune -a

# Recriar rede
docker network rm polymarket-network
docker network create polymarket-network

# Verificar logs
docker-compose logs app
```

## 📊 Testes Funcionais

### 1. Testar Conexão RPC
```javascript
// test-rpc.js
const { ethers } = require('ethers');

async function testRPC() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_POLYGON_URL);
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ RPC conectado - Block:', blockNumber);
  } catch (error) {
    console.error('❌ Erro RPC:', error.message);
  }
}

testRPC();
```

### 2. Testar Market Data Engine
```javascript
// test-market-data.js
const { MarketDataEngine } = require('./dist/engines/MarketDataEngine');

const engine = new MarketDataEngine();
console.log('✅ MarketDataEngine criado');

// Testar subscrição (com market ID válido)
engine.subscribeToMarket('test_market_1').catch(console.error);
```

### 3. Testar Strategy Engine
```javascript
// test-strategy.js
const { StrategyEngine } = require('./dist/engines/StrategyEngine');

const strategy = new StrategyEngine();
console.log('✅ StrategyEngine criado');

// Testar sinal
const mockMarketData = {
  marketId: 'test_market_1',
  upPrice: { toNumber: () => 0.45 },
  downPrice: { toNumber: () => 0.50 },
  sum: { toNumber: () => 0.95 },
  timestamp: Date.now()
};

const signals = strategy.generateSignals(mockMarketData);
console.log('Sinais gerados:', signals.length);
```

## 🚀 Deploy para Testes

### Opção A: Local (Recomendado)
```bash
# 1. Setup completo
.\scripts\setup-dev.ps1

# 2. Editar .env com chaves de teste
notepad .env

# 3. Iniciar bot
npm start

# 4. Monitorar
docker-compose logs -f app
```

### Opção B: VPS Barato
```bash
# Requisitos mínimos:
# - 2 vCPU
# - 4GB RAM  
# - 40GB SSD

# Providers recomendados:
# - DigitalOcean: $6/mês
# - Vultr: $6/mês
# - Hetzner: $5/mês

# Setup automático:
curl -sSL https://raw.githubusercontent.com/your-repo/polymarket-hft/main/scripts/setup-vps.sh | bash
```

### Opção C: Cloud Free Tier
```bash
# AWS ECS (12 meses free)
# Google Cloud Run ($300 crédito)
# Azure Container Instances (12 meses free)

# Deploy automático:
gcloud builds submit --tag gcr.io/PROJECT/polymarket-hft
gcloud run deploy polymarket-hft --image gcr.io/PROJECT/polymarket-hft
```

## 📈 Monitoramento Básico

### Logs em Tempo Real
```bash
# Ver logs do bot
docker-compose logs -f app

# Ver logs específicos
docker-compose logs app | grep ERROR
docker-compose logs app | grep TRADE
```

### Métricas Simples
```bash
# Acessar Prometheus
curl http://localhost:9090/metrics | grep polymarket

# Ver métricas principais
curl -s http://localhost:9090/metrics | grep polymarket_trades_total
curl -s http://localhost:9090/metrics | grep polymarket_total_pnl
```

### Health Checks
```bash
# Verificar se bot está rodando
curl http://localhost:8080/health

# Verificar latência
time curl http://localhost:8080/metrics
```

## ⚡ Performance Local

### Otimizar para Desenvolvimento
```bash
# 1. Usar variáveis de teste
export NODE_ENV=development
export LOG_LEVEL=debug

# 2. Limitar mercados testados
export MONITORED_MARKETS=test_market_1

# 3. Reduzir limites de risco
export MAX_POSITION_SIZE=100
export MAX_TOTAL_EXPOSURE=1000
```

### Debug Mode
```bash
# Ativar debug completo
export DEBUG=*
export LOG_LEVEL=debug

# Ver traces completos
npm start 2>&1 | tee debug.log
```

## 🎯 Próximos Passos

### 1. Configurar Chaves Reais
- [ ] Obter API key da Alchemy
- [ ] Criar carteira de teste
- [ ] Configurar .env com valores reais

### 2. Testar em Testnet
- [ ] Mudar para Polygon Mumbai testnet
- [ ] Obter tokens de teste
- [ ] Validar funcionamento completo

### 3. Deploy Produção
- [ ] Configurar monitoring avançado
- [ ] Setup alertas (Slack/Email)
- [ ] Implementar backup automático

---

**🎉 Sistema pronto para testes! Comece com a Opção 1 para testes rápidos locais.**
