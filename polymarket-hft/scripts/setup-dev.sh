#!/bin/bash

# Setup script for Polymarket HFT Bot Development Environment

echo "🚀 Setting up Polymarket HFT Bot Development Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Create Grafana datasource configuration
cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Create Prometheus configuration
cat > monitoring/prometheus.yml << EOF
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
EOF

# Create environment file for development
echo "📝 Creating development environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your actual API keys and configuration"
else
    echo "ℹ️  .env file already exists"
fi

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Show URLs
echo ""
echo "🌐 Services are running at:"
echo "   - Grafana Dashboard: http://localhost:3000 (admin/admin)"
echo "   - Prometheus: http://localhost:9090"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f app"
echo "   docker-compose logs -f prometheus"
echo "   docker-compose logs -f grafana"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""
echo "🔄 To restart services:"
echo "   docker-compose restart"
echo ""
echo "✅ Development environment setup complete!"
echo "💡 Don't forget to:"
echo "   1. Edit .env with your actual API keys"
echo "   2. Import Grafana dashboard from monitoring/grafana/dashboards/"
echo "   3. Run database migrations if needed"
