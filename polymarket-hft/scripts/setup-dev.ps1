# Setup script for Polymarket HFT Bot Development Environment (PowerShell)

Write-Host "🚀 Setting up Polymarket HFT Bot Development Environment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "monitoring\grafana\dashboards" | Out-Null
New-Item -ItemType Directory -Force -Path "monitoring\grafana\datasources" | Out-Null

# Create Grafana datasource configuration
$grafanaDatasource = @"
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
"@
Set-Content -Path "monitoring\grafana\datasources\prometheus.yml" -Value $grafanaDatasource

# Create Prometheus configuration
$prometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'polymarket-hft'
    static_configs:
      - targets: ['app:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
"@
Set-Content -Path "monitoring\prometheus.yml" -Value $prometheusConfig

# Create environment file for development
Write-Host "📝 Creating development environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your actual API keys and configuration" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Blue
}

# Build and start services
Write-Host "🐳 Building and starting Docker services..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Show URLs
Write-Host ""
Write-Host "🌐 Services are running at:" -ForegroundColor Green
Write-Host "   - Grafana Dashboard: http://localhost:3000 (admin/admin)" -ForegroundColor Cyan
Write-Host "   - Prometheus: http://localhost:9090" -ForegroundColor Cyan
Write-Host "   - PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "   - Redis: localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 To view logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f app" -ForegroundColor Gray
Write-Host "   docker-compose logs -f prometheus" -ForegroundColor Gray
Write-Host "   docker-compose logs -f grafana" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop services:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 To restart services:" -ForegroundColor Yellow
Write-Host "   docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
Write-Host "💡 Don't forget to:" -ForegroundColor Yellow
Write-Host "   1. Edit .env with your actual API keys" -ForegroundColor White
Write-Host "   2. Import Grafana dashboard from monitoring/grafana/dashboards/" -ForegroundColor White
Write-Host "   3. Run database migrations if needed" -ForegroundColor White
