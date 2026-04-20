#!/bin/bash

# Face Recognition MVP Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up Face Recognition MVP Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js (for local frontend development)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. You'll need it for local frontend development."
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Create directory structure
create_directories() {
    print_step "Creating directory structure..."
    
    directories=(
        "backend/app/api/v1"
        "backend/app/core"
        "backend/app/models"
        "backend/app/schemas"
        "backend/app/services"
        "backend/app/utils"
        "backend/tests"
        "backend/alembic/versions"
        "ml-service/src/face_detection"
        "ml-service/src/face_recognition"
        "ml-service/src/image_processing"
        "ml-service/src/clustering"
        "ml-service/src/api"
        "ml-service/src/workers"
        "ml-service/models"
        "ml-service/tests"
        "frontend/src/components/ui"
        "frontend/src/components/forms"
        "frontend/src/components/layout"
        "frontend/src/components/features"
        "frontend/src/pages"
        "frontend/src/hooks"
        "frontend/src/store/slices"
        "frontend/src/store/api"
        "frontend/src/services"
        "frontend/src/utils"
        "frontend/src/types"
        "frontend/src/styles"
        "frontend/public"
        "infrastructure/nginx"
        "infrastructure/postgres"
        "infrastructure/monitoring/grafana/dashboards"
        "infrastructure/monitoring/grafana/datasources"
        "docs/api"
        "docs/deployment"
        "docs/user-guide"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        # Create .gitkeep files to preserve empty directories
        touch "$dir/.gitkeep"
    done
    
    print_success "Directory structure created"
}

# Setup environment files
setup_environment() {
    print_step "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success ".env file created from .env.example"
        print_warning "Please review and update .env file with your configuration"
    else
        print_warning ".env file already exists, skipping..."
    fi
}

# Create Dockerfiles
create_dockerfiles() {
    print_step "Creating Dockerfiles..."
    
    # Backend Dockerfile
    cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

    # ML Service Dockerfile
    cat > ml-service/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for ML
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/models /app/cache

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8001"]
EOF

    # Frontend Dockerfile
    cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["npm", "start"]
EOF

    print_success "Dockerfiles created"
}

# Create Nginx configuration
create_nginx_config() {
    print_step "Creating Nginx configuration..."
    
    cat > infrastructure/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream ml_service {
        server ml-service:8001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # ML Service
        location /ml/ {
            proxy_pass http://ml_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

    print_success "Nginx configuration created"
}

# Create PostgreSQL init script
create_postgres_init() {
    print_step "Creating PostgreSQL initialization script..."
    
    cat > infrastructure/postgres/init.sql << 'EOF'
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance
-- These will be created by Alembic migrations, but here for reference

-- Example: CREATE INDEX ON faces USING ivfflat (face_encoding vector_cosine_ops) WITH (lists = 100);

-- Set up search path for the application
-- ALTER DATABASE face_recognition SET search_path TO public, extensions;
EOF

    print_success "PostgreSQL initialization script created"
}

# Create Prometheus configuration
create_prometheus_config() {
    print_step "Creating Prometheus configuration..."
    
    cat > infrastructure/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'ml-service'
    static_configs:
      - targets: ['ml-service:8001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
EOF

    print_success "Prometheus configuration created"
}

# Create requirements files
create_requirements_files() {
    print_step "Creating requirements files..."
    
    # Backend requirements
    cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.22.0
sqlalchemy==2.0.19
alembic==1.11.1
psycopg2-binary==2.9.7
redis==4.6.0
pydantic==2.3.0
pydantic-settings==2.0.3
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pillow==10.0.0
boto3==1.28.57
celery==5.3.1
pytest==7.4.0
pytest-asyncio==0.21.1
httpx==0.24.1
prometheus-client==0.17.1
structlog==23.1.0
EOF

    # ML Service requirements
    cat > ml-service/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.22.0
sqlalchemy==2.0.19
psycopg2-binary==2.9.7
redis==4.6.0
pydantic==2.3.0
pillow==10.0.0
opencv-python==4.8.0.76
tensorflow==2.13.0
numpy==1.24.3
scikit-learn==1.3.0
celery==5.3.1
boto3==1.28.57
pytest==7.4.0
httpx==0.24.1
prometheus-client==0.17.1
structlog==23.1.0
EOF

    print_success "Requirements files created"
}

# Create package.json for frontend
create_frontend_package() {
    print_step "Creating frontend package.json..."
    
    cat > frontend/package.json << 'EOF'
{
  "name": "face-recognition-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@reduxjs/toolkit": "^1.9.5",
    "@headlessui/react": "^1.7.0",
    "@heroicons/react": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.0",
    "react-hook-form": "^7.44.0",
    "axios": "^1.4.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.263.0",
    "clsx": "^2.0.0",
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^27.5.1"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "jest",
    "start": "react-scripts start"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

    print_success "Frontend package.json created"
}

# Create README
create_readme() {
    print_step "Creating README.md..."
    
    cat > README.md << 'EOF'
# Face Recognition MVP

A complete face recognition application with upload, detection, and organization features.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Git

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd face-recognition-mvp
```

2. Run the setup script:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the applications:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- ML Service: http://localhost:8001
- MinIO Console: http://localhost:9001
- Grafana: http://localhost:3001 (admin/admin123)
- Prometheus: http://localhost:9090

### Development

#### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend Development
```bash
cd frontend
npm install
npm start
```

#### ML Service Development
```bash
cd ml-service
pip install -r requirements.txt
uvicorn src.api.main:app --reload
```

## 📁 Project Structure

```
face-recognition-mvp/
├── backend/           # FastAPI backend service
├── ml-service/        # ML microservice for face recognition
├── frontend/          # React frontend application
├── infrastructure/    # Docker, nginx, monitoring configs
├── scripts/          # Setup and utility scripts
├── docs/             # Documentation
└── docker-compose.yml # All services orchestration
```

## 🔧 Services

- **PostgreSQL**: Main database with pgvector extension
- **Redis**: Cache and message broker
- **MinIO**: S3-compatible object storage
- **Backend**: FastAPI REST API
- **ML Service**: Face detection and recognition
- **Frontend**: React SPA
- **Nginx**: Reverse proxy
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboard

## 🧪 Testing

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 Monitoring

- Grafana dashboard: http://localhost:3001
- Prometheus metrics: http://localhost:9090

## 🚀 Deployment

See `docs/deployment/` for production deployment instructions.

## 📖 Documentation

- API Documentation: http://localhost:8000/docs
- User Guide: `docs/user-guide/`
- Development Guide: `docs/api/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
EOF

    print_success "README.md created"
}

# Create utility scripts
create_utility_scripts() {
    print_step "Creating utility scripts..."
    
    # Seed data script
    cat > scripts/seed-data.py << 'EOF'
#!/usr/bin/env python3
"""
Seed data script for development
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import User, Person, Photo
from app.core.security import get_password_hash

async def create_test_data():
    """Create test data for development"""
    
    engine = create_async_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with SessionLocal() as session:
        # Create test user
        test_user = User(
            email="test@example.com",
            password_hash=get_password_hash("test123"),
            name="Test User"
        )
        session.add(test_user)
        await session.commit()
        await session.refresh(test_user)
        
        print(f"Created test user: {test_user.email}")
        print("Password: test123")
        
        # Create test person
        test_person = Person(
            user_id=test_user.id,
            name="John Doe",
            description="Test person for face recognition"
        )
        session.add(test_person)
        await session.commit()
        
        print(f"Created test person: {test_person.name}")
    
    await engine.dispose()
    print("Test data created successfully!")

if __name__ == "__main__":
    asyncio.run(create_test_data())
EOF

    # Backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for Face Recognition MVP

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔄 Creating backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "📊 Backing up PostgreSQL..."
docker-compose exec -T postgres pg_dump -U postgres face_recognition > $BACKUP_DIR/postgres_$TIMESTAMP.sql

# Backup MinIO data
echo "📦 Backing up MinIO data..."
docker run --rm -v face_recognition_mvp_minio_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/minio_$TIMESTAMP.tar.gz -C /data .

# Backup configuration files
echo "⚙️ Backing up configuration..."
tar czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz .env docker-compose.yml infrastructure/

echo "✅ Backup completed: $BACKUP_DIR/"
echo "📋 Files created:"
ls -la $BACKUP_DIR/*$TIMESTAMP*
EOF

    # Make scripts executable
    chmod +x scripts/seed-data.py
    chmod +x scripts/backup.sh
    
    print_success "Utility scripts created"
}

# Main execution
main() {
    echo "🎯 Face Recognition MVP Setup"
    echo "================================"
    
    check_prerequisites
    create_directories
    setup_environment
    create_dockerfiles
    create_nginx_config
    create_postgres_init
    create_prometheus_config
    create_requirements_files
    create_frontend_package
    create_readme
    create_utility_scripts
    
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review and update .env file"
    echo "2. Run: docker-compose up -d"
    echo "3. Access: http://localhost:3000"
    echo ""
    echo "📚 Useful commands:"
    echo "- Start services: docker-compose up -d"
    echo "- Stop services: docker-compose down"
    echo "- View logs: docker-compose logs -f"
    echo "- Seed data: python scripts/seed-data.py"
    echo "- Backup: ./scripts/backup.sh"
    echo ""
    print_success "Happy coding! 🚀"
}

# Run main function
main "$@"
