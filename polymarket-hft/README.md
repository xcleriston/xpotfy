# Polymarket High-Frequency Trading Bot

Um sistema de trading algorítmico de alta frequência para explorar ineficiências de precificação em mercados de previsão binária da Polymarket.

## 🎯 Objetivo

Desenvolver um bot automatizado capaz de executar estratégias de arbitragem probabilística dinâmica em mercados binários (UP/DOWN) de curto prazo na Polymarket, explorando momentos onde a soma das probabilidades (UP + DOWN) < 1.0.

## 🏗️ Arquitetura do Sistema

### Camadas do Sistema
```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Dashboard     │  │   Metrics       │  │   Alerts     │ │
│  │   (React/Vue)   │  │   (Prometheus)  │  │ (PagerDuty)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Strategy       │  │  Position       │  │   Risk       │ │
│  │  Engine         │  │  Manager        │  │   Manager    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     EXECUTION LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Market Data    │  │  Execution      │  │  Transaction │ │
│  │  Engine         │  │  Engine         │  │  Signer      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  PostgreSQL     │  │  Redis Cache    │  │  Alchemy     │ │
│  │  (Supabase)     │  │  (State)        │  │  RPC         │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Stack Tecnológico

- **Backend**: Node.js com TypeScript (baixa latência, async/await nativo)
- **Blockchain**: Polygon (via Alchemy RPC)
- **Banco de Dados**: PostgreSQL via Supabase (ACID, replicação)
- **Cache**: Redis (estado em memória, pub/sub)
- **Monitoramento**: Prometheus + Grafana + Winston
- **Smart Contracts**: Ethers.js para interação com contratos da Polymarket

## 📊 Componentes Principais

### 1. Market Data Engine
- Conexão via WebSocket para dados em tempo real
- Monitoramento de preços UP/DOWN
- Cálculo contínuo de soma = UP + DOWN
- Detecção de distorções abaixo dos thresholds (0.95, 0.92, 0.90)
- Reconexão automática com exponential backoff

### 2. Execution Engine
- Assinatura local de transações
- Envio direto via RPC (Alchemy Polygon)
- Minimização de delay entre decisão e execução
- Estratégias para reduzir front-running e slippage
- Suporte para execução em lote (hedging)

### 3. Strategy Engine
- Detecção de oportunidades de arbitragem
- Entrada inicial oportunística
- Rebalanceamento progressivo (multi-entry)
- Lógica de "hedge incompleto" quando necessário
- Cálculo de position sizing via Kelly Criterion

### 4. Risk Manager
- Stop-loss dinâmico baseado em exposição
- Timeout de hedge (30 segundos)
- Limites de capital por operação
- Proteção contra liquidez insuficiente
- Controle de slippage máximo aceitável

### 5. Position Manager
- Cálculo de preço médio ponderado
- Monitoramento de P&L esperado
- Gestão de múltiplas posições simultâneas
- Cálculo de métricas de performance

## 🎲 Estratégia de Trading

### Arbitragem Probabilística
1. **Detecção**: Monitorar soma UP + DOWN < threshold
2. **Entrada**: Comprar lado mais barato (UP ou DOWN)
3. **Hedge**: Comprar lado oposto para completar arbitragem
4. **Saída**: Manter até resolução ou fechamento antecipado

### Thresholds de Oportunidade
- **Level 1**: soma < 0.95 (oportunidade moderada)
- **Level 2**: soma < 0.92 (boa oportunidade)
- **Level 3**: soma < 0.90 (excelente oportunidade)

### Position Sizing
- **Kelly Criterion**: f* = (bp - q) / b
- **Fixed**: Tamanho fixo configurado
- **Volatility**: Baseado em volatilidade histórica

## 🛡️ Gestão de Risco

### Limites de Exposição
- Posição máxima: $10.000
- Exposição por mercado: $25.000
- Exposição total: $100.000
- Slippage máximo: 0.5%

### Mecanismos de Proteção
- Stop-loss: 2% de movimento adverso
- Hedge timeout: 30 segundos
- Máximo de posições abertas: 10
- Drawdown máximo: 10% do capital

## 📈 Métricas de Performance

### Indicadores Chave
- **Sharpe Ratio**: Rentabilidade ajustada ao risco
- **Sortino Ratio**: Considera apenas downside risk
- **Calmar Ratio**: Retorno / máximo drawdown
- **Win Rate**: Taxa de operações vencedoras
- **Profit Factor**: Ganhos totais / Perdas totais

### Monitoramento em Tempo Real
- Latência de execução
- Taxa de sucesso de hedge
- P&L acumulado
- Número de oportunidades detectadas
- Erros e warnings do sistema

## 🧪 Backtesting

### Framework de Simulação
- Dados históricos ou sintéticos
- Modelos de slippage (fixo, percentual, dinâmico)
- Modelos de latência (zero, fixo, realista)
- Simulação Monte Carlo (1.000 iterações)
- Análise de distribuição de retornos

### Métricas de Backtest
- Taxa de sucesso de hedge
- Drawdown máximo
- Expectativa matemática
- Intervalos de confiança (95%)

## 🚀 Instalação e Configuração

### Pré-requisitos
```bash
Node.js >= 18.0.0
PostgreSQL >= 13
Redis >= 6.0
```

### Instalação
```bash
# Clonar repositório
git clone <repository-url>
cd polymarket-hft

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves e configurações

# Compilar TypeScript
npm run build

# Iniciar bot
npm start
```

### Variáveis de Ambiente
```bash
# Configurações RPC
ALCHEMY_POLYGON_URL=your_alchemy_url
POLYGON_RPC_URL=backup_rpc_url

# Chave privada da carteira
PRIVATE_KEY=your_private_key

# Mercados monitorados
MONITORED_MARKETS=market1,market2,market3

# Configurações de risco
MAX_POSITION_SIZE=10000
MAX_TOTAL_EXPOSURE=100000
STOP_LOSS_PERCENTAGE=0.02

# Nível de log
LOG_LEVEL=info
NODE_ENV=production
```

## 📊 Monitoramento

### Dashboard (opcional)
Interface web para monitoramento em tempo real:
- Posições abertas
- P&L acumulado
- Latência de execução
- Alertas de risco
- Métricas de performance

### Prometheus Metrics
- `polymarket_trades_total`: Total de trades executados
- `polymarket_total_pnl`: P&L total acumulado
- `polymarket_execution_latency_seconds`: Latência de execução
- `polymarket_arbitrage_opportunities_total`: Oportunidades detectadas

### Logs Estruturados
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "event": "TRADE_EXECUTED",
  "tradeId": "trade_123",
  "marketId": "market_456",
  "type": "BUY",
  "outcome": "UP",
  "size": "1000",
  "price": "0.45",
  "fee": "1.5"
}
```

## ⚡ Otimizações de Performance

### Baixa Latência
- Conexão WebSocket persistente
- Pool de conexões RPC
- Assinatura local de transações
- Gas price otimizado
- Execução paralela de hedges

### Eficiência de Capital
- Kelly Criterion para sizing ótimo
- Hedge progressivo para reduzir risco
- Reutilização de capital rápido
- Minimização de fees

## 🔄 Fluxo de Operação

### 1. Detecção de Oportunidade
```typescript
const sum = upPrice + downPrice;
if (sum < threshold) {
  const inefficiency = 1 - sum;
  const expectedProfit = inefficiency * positionSize;
  // Gerar sinal de compra
}
```

### 2. Execução Inicial
```typescript
const trade = await executionEngine.execute({
  marketId,
  outcome: 'UP', // ou 'DOWN'
  type: 'BUY',
  size: calculateOptimalSize(),
  maxPrice: calculateMaxSlippage(),
});
```

### 3. Hedge Dinâmico
```typescript
const hedgeNeeded = calculateHedgeRequirement();
if (hedgeNeeded.urgency === 'HIGH') {
  await executeBatch([
    { outcome: 'DOWN', type: 'BUY', size: hedgeNeeded.size }
  ]);
}
```

### 4. Monitoramento e Gestão
```typescript
// Monitorar P&L em tempo real
position.unrealizedPnL = currentValue - costBasis;

// Verificar stop-loss
if (priceChange > stopLossThreshold) {
  await closePosition(position.id);
}
```

## 🎯 Principais Riscos e Mitigação

### Riscos de Mercado
- **Liquidez insuficiente**: Verificar depth do orderbook
- **Slippage elevado**: Limitar tamanho da ordem
- **Front-running**: Usar RPC privado e assinatura local

### Riscos Técnicos
- **Falha de conexão**: Reconexão automática
- **Latência alta**: Múltiplos providers RPC
- **Erro de execução**: Sistema de retry exponencial

### Riscos de Smart Contract
- **Bugs no contrato**: Auditoria e testes extensivos
- **Mudança de regras**: Monitoramento de atualizações
- **Risco de custódia**: Diversificação e cold storage

## 📈 Métricas de Validação

### Edge Real
1. **Sharpe Ratio > 1.0**: Retorno superior ao risco
2. **Win Rate > 55%**: Mais vitórias que derrotas
3. **Profit Factor > 1.5**: Ganhos 50% maiores que perdas
4. **Max Drawdown < 15%**: Risco controlado

### Estatísticas Operacionais
- Latência média < 100ms
- Taxa de sucesso de hedge > 95%
- Oportunidades capturadas > 80%
- Erros de execução < 1%

## 🔄 Melhorias Iterativas

### Fase 1 (MVP)
- Arbitragem básica UP/DOWN
- Risk management fundamental
- Monitoramento essencial

### Fase 2 (Otimizações)
- Machine learning para previsão
- Flash loans para arbitragem
- Interface web avançada

### Fase 3 (Expansão)
- Multi-market arbitragem
- Cross-chain opportunities
- Liquidity provision

## 📝 Licença e Disclaimer

Este projeto é para fins educacionais e de pesquisa. Trading algorítmico envolve riscos significativos e pode resultar em perdas financeiras. Use por sua conta e risco.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:
1. Fork o repositório
2. Criar feature branch
3. Implementar mudanças com testes
4. Submeter pull request

## 📞 Suporte

Para dúvidas e suporte:
- Issues no GitHub
- Documentação técnica
- Comunidade Discord

---

**Aviso**: Este é um sistema complexo que requer conhecimento avançado de trading, blockchain e desenvolvimento de software. Teste extensivamente em ambiente de desenvolvimento antes de usar em produção.
