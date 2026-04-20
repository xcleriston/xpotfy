# 🚀 Deployment Guide - Polymarket HFT Bot

## 📋 Pré-requisitos

### Sistema
- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **Git**
- **8GB+ RAM** recomendado
- **50GB+ disco** disponível

### APIs e Serviços
- **Alchemy API Key** (Polygon RPC)
- **Supabase** (PostgreSQL hosting)
- **Chave privada** da carteira (testnet para desenvolvimento)

## 🏗️ Opções de Deploy

### Opção 1: Desenvolvimento Local (Recomendado para Testes)

#### 🐳 Docker Compose (Completo)
```bash
# Clonar repositório
git clone <repository-url>
cd polymarket-hft

# Setup automático (Windows)
.\scripts\setup-dev.ps1

# Setup automático (Linux/Mac)
./scripts/setup-dev.sh

# Editar configuração
notepad .env  # Windows
nano .env       # Linux/Mac
```

#### 📦 Serviços Incluídos:
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379  
- **Prometheus**: localhost:9090
- **Grafana**: localhost:3000 (admin/admin)
- **App Bot**: localhost:8080

#### 🧪 Testes Locais:
```bash
# Testes completos (Windows)
.\scripts\test-local.ps1

# Testes completos (Linux/Mac)  
./scripts/test-local.sh

# Testes unitários
npm test

# Build e lint
npm run build
npm run lint
```

---

### Opção 2: Cloud Production

#### ☁️ AWS ECS + RDS + ElastiCache

**Stack Production:**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: polymarket-hft:latest
    environment:
      - NODE_ENV=production
      - ALCHEMY_POLYGON_URL=${ALCHEMY_POLYGON_URL}
      - POSTGRES_HOST=${RDS_ENDPOINT}
      - REDIS_URL=${ELASTICACHE_ENDPOINT}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
```

**Deploy Commands:**
```bash
# Build e push para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t polymarket-hft .
docker tag polymarket-hft:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/polymarket-hft:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/polymarket-hft:latest

# Deploy ECS
aws ecs update-service --cluster polymarket-cluster --service polymarket-service --force-new-deployment
```

#### 🟢 Google Cloud Run + Cloud SQL + Memorystore

**Configuração:**
```bash
# Build e push
gcloud builds submit --tag gcr.io/PROJECT_ID/polymarket-hft

# Deploy Cloud Run
gcloud run deploy polymarket-hft \
  --image gcr.io/PROJECT_ID/polymarket-hft \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --set-env-vars NODE_ENV=production
```

#### 🔵 Azure Container Instances + Azure Database

**Deploy:**
```bash
# Build e push
az acr build --registry polymarketacr.azurecr.io --image polymarket-hft .

# Deploy Container Instance
az container create \
  --resource-group polymarket-rg \
  --name polymarket-hft \
  --image polymarketacr.azurecr.io/polymarket-hft:latest \
  --cpu 1 \
  --memory 2 \
  --ports 8080
```

---

### Opção 3: VPS Dedicado (Hetzner/DigitalOcean)

#### 🖥️ Setup Servidor
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clonar projeto
git clone <repository-url>
cd polymarket-hft

# Configurar ambiente
cp .env.example .env
nano .env  # Editar com suas chaves
```

#### 🚀 Iniciar Serviços
```bash
# Build e iniciar
docker-compose -f docker-compose.yml up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

#### 🔧 Configuração Nginx (Opcional)
```nginx
# /etc/nginx/sites-available/polymarket-hft
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /metrics {
        proxy_pass http://localhost:9090;
        proxy_set_header Host $host;
    }
}
```

---

## 🔐 Configuração de Segurança

### 🌐 SSL/TLS
```bash
# Let's Encrypt (gratuito)
certbot --nginx -d seu-dominio.com

# Cloudflare (recomendado)
# Configurar no painel Cloudflare:
# - SSL Full (Strict)
# - Orange Cloud (Off para desenvolvimento)
```

### 🔥 Firewall
```bash
# UFW (Ubuntu)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 🗝️ Variáveis de Ambiente Produção
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn

# APIs
ALCHEMY_POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/PROD_KEY
PRIVATE_KEY=PROD_PRIVATE_KEY  # NUNCA comitar

# Database
POSTGRES_HOST=postgres.prod.example.com
POSTGRES_DB=polymarket_hft_prod
POSTGRES_USER=polymarket_user
POSTGRES_PASSWORD=STRONG_PASSWORD

# Redis
REDIS_URL=redis://redis.prod.example.com:6379

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_ADMIN_PASSWORD=STRONG_GRAFANA_PASSWORD
```

## 📊 Monitoramento Produção

### 📈 Grafana Dashboard
**Acesso:** `https://seu-dominio.com:3000`
- **Login:** admin / senha configurada
- **Dashboards:** Importar de `monitoring/grafana/dashboards/`

**Métricas Principais:**
- P&L acumulado
- Número de trades
- Latência de execução
- Taxa de sucesso
- Alertas de risco

### 🚨 Alertas
```yaml
# prometheus-alerts.yml
groups:
  - name: polymarket-alerts
    rules:
      - alert: HighLatency
        expr: polymarket_execution_latency_seconds > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High execution latency detected"
          
      - alert: TradingErrors
        expr: rate(polymarket_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate in trading"
```

### 📧 Notificações
```bash
# Slack webhook
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Email alerts
export SMTP_HOST=smtp.gmail.com
export SMTP_USER=alerts@seu-dominio.com
export SMTP_PASSWORD=app_password
```

## 🧪 Testes de Produção

### 🎯 Testes de Carga
```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:8080/metrics

# K6 Load Testing
k6 run --vus 50 --duration 30s script.js
```

### 🔄 Testes de Failover
```bash
# Testar reconexão automática
docker-compose stop app
sleep 30
docker-compose start app

# Verificar logs
docker-compose logs app | tail -50
```

### 📡 Testes de Conectividade
```bash
# Testar RPC endpoints
curl -X POST https://polygon-mainnet.g.alchemy.com/v2/KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Testar WebSocket
wscat -c wss://polygon-mainnet.g.alchemy.com/v2/KEY
```

## 🚀 Deploy Automatizado (CI/CD)

### 🔄 GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Build
        run: npm ci && npm run build
        
      - name: Deploy
        run: |
          docker build -t polymarket-hft .
          docker push ${{ secrets.DOCKER_REGISTRY }}/polymarket-hft
          # Comandos de deploy específicos da nuvem
```

### ⚡ Scripts de Deploy
```bash
#!/bin/bash
# deploy.sh
set -e

echo "🚀 Starting deployment..."

# Backup atual
docker-compose exec postgres pg_dump polymarket_hft > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull nova versão
git pull origin main
docker-compose pull

# Deploy com zero downtime
docker-compose up -d --no-deps app

# Health check
sleep 30
curl -f http://localhost:8080/health || exit 1

echo "✅ Deployment successful!"
```

## 🔧 Manutenção Produção

### 📋 Backup Automático
```bash
# Cron job diário
0 2 * * * /usr/local/bin/backup-db.sh

# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump polymarket_hft | gzip > /backups/backup_$DATE.sql.gz
find /backups -name "backup_*.sql.gz" -mtime +7 -delete
```

### 🔄 Updates
```bash
# Atualizar aplicação
git pull origin main
docker-compose build
docker-compose up -d

# Atualizar dependências
docker-compose exec app npm update
docker-compose restart app
```

### 📊 Limpeza de Logs
```bash
# Log rotation
docker-compose exec app find /app/logs -name "*.log" -mtime +30 -delete
docker-compose exec prometheus find /prometheus -name "*.db" -mtime +7 -delete
```

## 🎯 Checklist de Deploy Produção

### ✅ Pré-Deploy
- [ ] Backup completo do banco
- [ ] Testes em ambiente de staging
- [ ] Validação de configurações
- [ ] Verificação de limites de risco
- [ ] Teste de chaves API

### ✅ Pós-Deploy
- [ ] Verificação de saúde dos serviços
- [ ] Teste de funcionalidades críticas
- [ ] Monitoramento de métricas
- [ ] Verificação de alertas
- [ ] Documentação da versão

### ✅ Monitoramento Contínuo
- [ ] Latência < 100ms
- [ ] Taxa de erro < 1%
- [ ] Uso de CPU < 80%
- [ ] Uso de memória < 85%
- [ ] Backup diário funcionando

---

**⚠️ AVISO IMPORTANTE:** Use sempre contas de teste para desenvolvimento. Nunca exponha chaves privadas ou senhas em repositórios públicos.
