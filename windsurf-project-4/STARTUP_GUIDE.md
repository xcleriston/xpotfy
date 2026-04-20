# 🚀 Startup Guide - Face Recognition MVP

## Prerequisites

### Required Software
1. **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop)
2. **Git** - Download from [git-scm.com](https://git-scm.com)
3. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org) (for local frontend development)

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 10GB free space
- **OS**: Windows 10/11, macOS, or Linux

---

## 🚀 Quick Start (Windows)

### 1. Clone Repository
```bash
git clone <repository-url>
cd face-recognition-mvp
```

### 2. Environment Setup
```bash
# Copy environment file
copy .env.example .env

# Edit .env file with your settings
notepad .env
```

### 3. Start Development Environment
```bash
# Start core services (PostgreSQL, Redis, MinIO, Backend)
docker-compose -f docker-compose.dev.yml up -d

# Check services status
docker-compose -f docker-compose.dev.yml ps
```

### 4. Verify Installation
Open your browser and test:
- **Backend API**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)
- **Health Check**: http://localhost:8000/health

---

## 📋 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:8000 | - |
| API Documentation | http://localhost:8000/docs | - |
| Database | localhost:5432 | postgres/postgres123 |
| Redis | localhost:6379 | - |
| MinIO Console | http://localhost:9001 | minioadmin/minioadmin123 |
| MinIO API | http://localhost:9000 | minioadmin/minioadmin123 |

---

## 🛠️ Development Commands

### Docker Commands
```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Rebuild backend
docker-compose -f docker-compose.dev.yml build --no-cache backend

# Access database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d face_recognition

# Access MinIO
docker-compose -f docker-compose.dev.yml exec minio mc ls local/
```

### Backend Development
```bash
# Enter backend container
docker-compose -f docker-compose.dev.yml exec backend bash

# Run database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"

# Run tests
pytest

# Check code style
black .
isort .
flake8 .
```

### Database Operations
```bash
# Reset database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d face_recognition -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Seed test data
docker-compose -f docker-compose.dev.yml exec backend python scripts/seed-data.py
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Not Starting
**Problem**: `docker: command not found`
**Solution**: Install Docker Desktop and restart your computer

#### 2. Port Conflicts
**Problem**: `Port already in use`
**Solution**: 
```bash
# Check what's using the port
netstat -ano | findstr :8000

# Stop conflicting services or change ports in docker-compose.dev.yml
```

#### 3. Database Connection Issues
**Problem**: `Connection refused`
**Solution**: 
```bash
# Check PostgreSQL container
docker-compose -f docker-compose.dev.yml logs postgres

# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres
```

#### 4. Permission Issues (Windows)
**Problem**: File permission errors
**Solution**: Run Docker Desktop as Administrator

#### 5. Memory Issues
**Problem**: Containers keep restarting
**Solution**: Increase Docker memory allocation in Docker Desktop settings (minimum 4GB)

### Debug Commands
```bash
# Check container health
docker-compose -f docker-compose.dev.yml ps

# Check detailed container info
docker inspect face_recognition_backend_dev

# Access container shell
docker-compose -f docker-compose.dev.yml exec backend bash

# Check resource usage
docker stats
```

---

## 📊 First Steps

### 1. Test Backend API
```bash
# Register a new user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123456", "name": "Test User"}'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123456"}'
```

### 2. Setup MinIO Bucket
1. Open http://localhost:9001
2. Login with minioadmin/minioadmin123
3. Create bucket named `face-recognition`

### 3. Run Database Migrations
```bash
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

### 4. Verify Setup
```bash
# Health check
curl http://localhost:8000/health

# API docs
curl http://localhost:8000/docs
```

---

## 🚀 Next Steps

Once the basic setup is working:

1. **Frontend Development**: Set up React development server
2. **ML Service**: Implement face detection service
3. **Integration**: Connect frontend to backend
4. **Testing**: Run full test suite
5. **Production Setup**: Configure production environment

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs`
3. Check system resources: `docker stats`
4. Verify environment variables in `.env`
5. Restart Docker Desktop if needed

---

## 🎯 Success Criteria

You're ready to continue when:

- ✅ All containers are running (`docker-compose ps` shows healthy status)
- ✅ Backend API responds at http://localhost:8000/health
- ✅ MinIO console accessible at http://localhost:9001
- ✅ Database migrations completed successfully
- ✅ Can register and login via API

Good luck! 🚀
