# Face Recognition MVP

A complete face recognition application with upload, detection, and organization features.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Git
- At least 8GB RAM available
- 10GB free disk space

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd face-recognition-mvp
```

2. Run the setup script:
```bash
# On Linux/macOS
chmod +x scripts/setup.sh
./scripts/setup.sh

# On Windows
scripts/setup.sh
```

3. Start all services:
```bash
# Development environment
docker-compose up -d

# OR Full integration environment
docker-compose -f docker-compose.integration.yml up -d
```

4. Run integration tests:
```bash
chmod +x scripts/integration-test.sh
./scripts/integration-test.sh
```

5. Access the applications:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **ML Service**: http://localhost:8001/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Nginx Proxy**: http://localhost:80

### Test Credentials
- **Email**: test@example.com
- **Password**: test123456

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
chmod +x scripts/integration-test.sh
./scripts/integration-test.sh

# Full test suite with Docker
docker-compose -f docker-compose.integration.yml up --abort-on-container-exit
```

## 📊 Monitoring

- **Grafana dashboard**: http://localhost:3001 (admin/admin123)
- **Prometheus metrics**: http://localhost:9090
- **Backend health**: http://localhost:8000/health
- **ML Service health**: http://localhost:8001/health

## 📖 Documentation

- **API Documentation**: http://localhost:8000/docs
- **ML Service API**: http://localhost:8001/docs
- **Integration Guide**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Startup Guide**: [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)
- **User Guide**: `docs/user-guide/`
- **Development Guide**: `docs/api/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 8000, 8001, 5432, 6379, 9000, 9001 are available
2. **Docker permissions**: Ensure your user has Docker permissions
3. **Memory issues**: Allocate at least 4GB RAM to Docker Desktop
4. **Windows permissions**: Run scripts as Administrator if needed

### Useful Commands

```bash
# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Clean up volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild services
docker-compose build --no-cache

# Access database
docker-compose exec postgres psql -U postgres -d face_recognition

# Access MinIO
docker-compose exec minio mc ls local/
```

### Environment Variables

Copy `.env.example` to `.env` and update as needed:

```bash
cp .env.example .env
```

Key variables to review:
- `JWT_SECRET_KEY`: Change for production
- `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`: Change for production
- `DATABASE_URL`: Update if using external database
- `REDIS_URL`: Update if using external Redis

## 📋 MVP Features

### ✅ Completed Features
- [x] User authentication (JWT)
- [x] Photo upload (multiple files)
- [x] Face detection (OpenCV Haar Cascade)
- [x] Face recognition (Feature-based encoding)
- [x] Photo organization by people
- [x] Responsive web interface (React + TypeScript)
- [x] REST API with FastAPI
- [x] Database with PostgreSQL + pgvector
- [x] File storage with MinIO
- [x] Caching with Redis
- [x] Monitoring with Prometheus + Grafana
- [x] Docker containerization
- [x] Nginx reverse proxy
- [x] Integration testing suite
- [x] Structured logging
- [x] Error handling and validation
- [x] Security headers and rate limiting

### 🔄 In Progress
- [ ] Real-time processing notifications
- [ ] Advanced search and filtering
- [ ] Photo albums and collections
- [ ] Export functionality

### 🚀 Future Features
- [ ] Mobile applications
- [ ] Advanced AI photo enhancement
- [ ] Social features and sharing
- [ ] Cloud storage integration
- [ ] Payment processing for premium features

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `docs/`
- Review the troubleshooting section above

---

**Built with ❤️ using modern web technologies**
