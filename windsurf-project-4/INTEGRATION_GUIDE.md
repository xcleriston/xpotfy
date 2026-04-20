# 🔗 Integration Guide - Face Recognition MVP

## Overview

This guide covers the complete integration of all components in the Face Recognition MVP, including setup, testing, and deployment procedures.

## 🏗️ Architecture Overview

### Services
- **Frontend**: React + TypeScript (Port 3000)
- **Backend**: FastAPI + PostgreSQL (Port 8000)
- **ML Service**: Python + OpenCV (Port 8001)
- **Database**: PostgreSQL + pgvector (Port 5432)
- **Cache**: Redis (Port 6379)
- **Storage**: MinIO (Ports 9000/9001)
- **Proxy**: Nginx (Port 80)
- **Monitoring**: Prometheus (9090) + Grafana (3001)

### Communication Flow
```
Frontend → Nginx → Backend → ML Service
                ↓
            PostgreSQL ↔ Redis ↔ MinIO
```

---

## 🚀 Quick Start Integration

### Prerequisites
- Docker Desktop installed and running
- At least 8GB RAM available
- 10GB free disk space

### 1. Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd face-recognition-mvp

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env
cp frontend/.env.example frontend/.env

# Create necessary directories
mkdir -p models uploads logs
```

### 2. Start All Services
```bash
# Using integration compose file
docker-compose -f docker-compose.integration.yml up -d

# Check service status
docker-compose -f docker-compose.integration.yml ps
```

### 3. Verify Integration
```bash
# Run integration tests
chmod +x scripts/integration-test.sh
./scripts/integration-test.sh

# Or manual verification
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:3000
```

---

## 🔧 Service Configuration

### Backend Configuration
Key settings in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/face_recognition
REDIS_URL=redis://redis:6379
ML_SERVICE_URL=http://ml-service:8001
MINIO_ENDPOINT=minio:9000
JWT_SECRET_KEY=your-secret-key
```

### ML Service Configuration
Key settings in `ml-service/.env`:
```env
FACE_DETECTION_CONFIDENCE_THRESHOLD=0.7
FACE_RECOGNITION_THRESHOLD=0.6
EMBEDDING_DIMENSION=512
MODEL_PATH=/app/models
```

### Frontend Configuration
Key settings in `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_ML_SERVICE_URL=http://localhost:8001
```

---

## 🧪 Integration Testing

### Automated Testing
```bash
# Run full integration test suite
./scripts/integration-test.sh

# Run specific test categories
./scripts/integration-test.sh --api-only
./scripts/integration-test.sh --ml-only
./scripts/integration-test.sh --frontend-only
```

### Manual Testing Steps

#### 1. Backend API Tests
```bash
# Health check
curl http://localhost:8000/health

# User registration
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","name":"Test User"}'

# User login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

#### 2. ML Service Tests
```bash
# Health check
curl http://localhost:8001/health

# Detector info
curl http://localhost:8001/api/v1/face-detection/detector_info

# Test face detection (requires image file)
curl -X POST http://localhost:8001/api/v1/face-detection/detect \
  -F "file=@test_image.jpg"
```

#### 3. Frontend Tests
```bash
# Check accessibility
curl http://localhost:3000

# Check build
docker-compose -f docker-compose.integration.yml exec frontend npm run build
```

---

## 🔄 Service Integration Points

### 1. Backend ↔ ML Service Integration
```python
# Backend calls ML service for face detection
import httpx

async def detect_faces(image_data: bytes):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://ml-service:8001/api/v1/face-detection/detect",
            files={"file": image_data}
        )
    return response.json()
```

### 2. Frontend ↔ Backend Integration
```typescript
// Frontend API service
const API_BASE_URL = 'http://localhost:8000/api/v1';

export const photoAPI = {
  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/photos/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};
```

### 3. Database Integration
```python
# Backend database models with pgvector
class Face(Base):
    __tablename__ = "faces"
    
    face_encoding = Column(Vector(512))  # pgvector for embeddings
    
    @classmethod
    def find_similar_faces(cls, encoding, threshold=0.6):
        return cls.query.filter(
            func.cosine_distance(cls.face_encoding, encoding) < (1 - threshold)
        ).all()
```

---

## 📊 Monitoring & Logging

### Prometheus Metrics
Available endpoints:
- `http://localhost:8000/metrics` - Backend metrics
- `http://localhost:8001/metrics` - ML service metrics
- `http://localhost:9090` - Prometheus UI

### Grafana Dashboards
Access: http://localhost:3001
- Username: admin
- Password: admin123

### Structured Logging
All services use structured logging with context:
```python
logger.info("face_processed", 
           photo_id=photo.id, 
           faces_detected=len(faces),
           processing_time=duration)
```

---

## 🐛 Troubleshooting Integration

### Common Issues

#### 1. Service Connection Issues
```bash
# Check service network
docker network ls
docker network inspect face_recognition_mvp_face_recognition_network

# Test service connectivity
docker-compose -f docker-compose.integration.yml exec backend ping ml-service
```

#### 2. Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.integration.yml logs postgres

# Test database connection
docker-compose -f docker-compose.integration.yml exec postgres psql -U postgres -d face_recognition
```

#### 3. ML Service Issues
```bash
# Check ML service logs
docker-compose -f docker-compose.integration.yml logs ml-service

# Test ML models
curl http://localhost:8001/api/v1/face-detection/test
```

#### 4. Frontend Build Issues
```bash
# Rebuild frontend
docker-compose -f docker-compose.integration.yml build --no-cache frontend

# Check frontend logs
docker-compose -f docker-compose.integration.yml logs frontend
```

### Performance Issues

#### 1. Slow API Responses
```bash
# Check response times
curl -w "%{time_total}" -o /dev/null -s http://localhost:8000/health

# Monitor resource usage
docker stats
```

#### 2. Memory Issues
```bash
# Check memory usage
docker-compose -f docker-compose.integration.yml exec backend python -c "
import psutil
print(f'Memory: {psutil.virtual_memory().percent}%')
"
```

---

## 🚀 Production Deployment

### 1. Environment Preparation
```bash
# Set production environment variables
export ENVIRONMENT=production
export DEBUG=false
export LOG_LEVEL=WARNING

# Generate secure secrets
openssl rand -hex 32 > .jwt-secret
```

### 2. Database Migration
```bash
# Run database migrations
docker-compose -f docker-compose.integration.yml exec backend alembic upgrade head

# Create MinIO bucket
docker-compose -f docker-compose.integration.yml exec minio mc mb local/face-recognition
```

### 3. SSL Configuration
```bash
# Generate SSL certificates
certbot certonly --standalone -d yourdomain.com

# Update Nginx configuration
# Add SSL settings to infrastructure/nginx/conf.d/default.conf
```

### 4. Health Checks
```bash
# Set up health check monitoring
# Configure external monitoring service
# Set up alerting for service failures
```

---

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_faces_photo_id ON faces(photo_id);
CREATE INDEX idx_faces_person_id ON faces(person_id);
CREATE INDEX idx_faces_encoding_gin ON faces USING GIN(face_encoding);
```

### 2. Caching Strategy
```python
# Redis caching for frequent queries
@cache.memoize(timeout=3600)
def get_person_by_id(person_id: str):
    return Person.query.get(person_id)
```

### 3. ML Service Optimization
```python
# Batch processing for multiple faces
def process_faces_batch(images: List[np.ndarray]) -> List[dict]:
    # Process multiple images simultaneously
    return [detect_faces(img) for img in images]
```

---

## 🔒 Security Considerations

### 1. Network Security
- All services communicate within Docker network
- Only Nginx exposed to external traffic
- Rate limiting configured in Nginx

### 2. Authentication
- JWT tokens with expiration
- Secure password hashing with bcrypt
- Token refresh mechanism

### 3. Data Protection
- File upload validation
- SQL injection prevention
- XSS protection headers

---

## 📝 Integration Checklist

### Pre-Integration Checklist
- [ ] All environment files configured
- [ ] Docker services built successfully
- [ ] Database migrations applied
- [ ] SSL certificates (production)
- [ ] Monitoring configured

### Post-Integration Checklist
- [ ] All health checks passing
- [ ] API endpoints responding correctly
- [ ] ML service processing images
- [ ] Frontend loading properly
- [ ] Database connections stable
- [ ] Monitoring metrics available

### Testing Checklist
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] API documentation accessible
- [ ] Performance benchmarks met
- [ ] Error handling working
- [ ] Logging functional

---

## 🎯 Success Metrics

### Performance Targets
- API response time < 200ms
- Face detection < 500ms per image
- File upload < 30s for 100 photos
- Frontend load time < 3s
- Database query time < 100ms

### Availability Targets
- Uptime > 99.5%
- Error rate < 1%
- Health check response time < 1s
- Service restart time < 30s

### Quality Metrics
- Code coverage > 80%
- All tests passing
- Documentation complete
- Security scan clean
- Performance benchmarks met

---

## 🆘 Support & Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check service health, review logs
2. **Weekly**: Update dependencies, backup database
3. **Monthly**: Security updates, performance review
4. **Quarterly**: Capacity planning, architecture review

### Emergency Procedures
1. Service failure: Check logs, restart affected services
2. Database issues: Check connections, run diagnostics
3. Performance degradation: Check metrics, scale resources
4. Security incident: Review logs, update credentials

### Contact Information
- **Development Team**: dev-team@company.com
- **Infrastructure**: infra-team@company.com
- **Security**: security@company.com

---

## 📚 Additional Resources

### Documentation
- [API Documentation](http://localhost:8000/docs)
- [ML Service Documentation](http://localhost:8001/docs)
- [Database Schema](./docs/database-schema.md)
- [Architecture Overview](./docs/architecture.md)

### Tools & Utilities
- [Integration Test Script](./scripts/integration-test.sh)
- [Database Migration Tool](./scripts/migrate.sh)
- [Backup Script](./scripts/backup.sh)
- [Performance Monitor](./scripts/monitor.sh)

---

**Integration Complete! 🎉**

Your Face Recognition MVP is now fully integrated and ready for use. All services are communicating properly, and the system is ready for testing and deployment.
