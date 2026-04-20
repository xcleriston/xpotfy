# Estrutura Técnica - Aplicativo de Reconhecimento Facial

## Arquitetura Geral

### Visão do Sistema
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │   IA/ML Service │
│   (Web/Mobile)  │◄──►│   (API REST)    │◄──►│  (Face Recognition)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Database      │    │   File Storage  │
│   (Assets)      │    │   (PostgreSQL)  │    │   (AWS S3)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Stack Tecnológico

### Frontend
```javascript
// Web Application
{
  "framework": "React 18+",
  "language": "TypeScript",
  "styling": "TailwindCSS + Headless UI",
  "state": "Redux Toolkit + RTK Query",
  "routing": "React Router v6",
  "forms": "React Hook Form + Zod",
  "ui": "Lucide React + Radix UI",
  "testing": "Jest + React Testing Library",
  "bundler": "Vite"
}

// Mobile Application
{
  "framework": "React Native",
  "navigation": "React Navigation",
  "state": "Redux Toolkit",
  "ui": "React Native Elements",
  "camera": "React Native Camera",
  "storage": "AsyncStorage + MMKV"
}
```

### Backend
```python
# API Server
{
  "framework": "FastAPI (Python)",
  "language": "Python 3.11+",
  "async": "asyncio + uvicorn",
  "validation": "Pydantic",
  "auth": "JWT + OAuth2",
  "docs": "OpenAPI/Swagger",
  "testing": "pytest + httpx"
}

# Microservices
{
  "face_recognition": "OpenCV + FaceNet",
  "image_processing": "Pillow + scikit-image",
  "file_upload": "aiofiles",
  "email": "celery + redis",
  "monitoring": "sentry + prometheus"
}
```

### Database
```sql
-- PostgreSQL Schema
{
  "primary_db": "PostgreSQL 15+",
  "cache": "Redis 7+",
  "search": "Elasticsearch",
  "migrations": "Alembic",
  "orm": "SQLAlchemy 2.0"
}
```

### Infrastructure
```yaml
# Docker Compose
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
  
  ml_service:
    build: ./ml-service
    ports: ["8001:8001"]
    gpu: true
  
  postgres:
    image: postgres:15
    volumes: ["postgres_data:/var/lib/postgresql/data"]
  
  redis:
    image: redis:7-alpine
  
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
```

## Estrutura de Diretórios

```
project-root/
├── frontend/                    # React Web App
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── ui/            # Componentes base
│   │   │   ├── forms/         # Formulários
│   │   │   └── layout/        # Layout components
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── hooks/             # Custom hooks
│   │   ├── store/             # Redux store
│   │   ├── services/          # API services
│   │   ├── utils/             # Utilitários
│   │   └── types/             # TypeScript types
│   ├── public/
│   └── package.json
├── mobile/                     # React Native App
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── store/
│   │   └── services/
│   └── package.json
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── photos.py
│   │   │   │   ├── faces.py
│   │   │   │   └── albums.py
│   │   ├── core/              # Configurações core
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilitários
│   ├── tests/
│   └── requirements.txt
├── ml-service/                 # ML Microservice
│   ├── src/
│   │   ├── face_detection/    # OpenCV models
│   │   ├── face_recognition/  # FaceNet implementation
│   │   ├── image_processing/  # Image enhancement
│   │   └── api/              # FastAPI endpoints
│   ├── models/               # Trained models
│   └── requirements.txt
├── infrastructure/            # DevOps configs
│   ├── docker/
│   ├── kubernetes/
│   ├── nginx/
│   └── monitoring/
└── docs/                     # Project documentation
    ├── api/
    ├── deployment/
    └── user-guide/
```

## Modelos de Dados

### PostgreSQL Schema
```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos Table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    format VARCHAR(10) NOT NULL,
    taken_at TIMESTAMP,
    gps_lat DECIMAL(10, 8),
    gps_lng DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Faces Table
CREATE TABLE faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID REFERENCES photos(id),
    person_id UUID REFERENCES persons(id),
    face_encoding VECTOR(512), -- FaceNet embedding
    bbox_x INTEGER NOT NULL,
    bbox_y INTEGER NOT NULL,
    bbox_width INTEGER NOT NULL,
    bbox_height INTEGER NOT NULL,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Persons Table
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Albums Table
CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES album_templates(id),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Album Photos Junction
CREATE TABLE album_photos (
    album_id UUID REFERENCES albums(id),
    photo_id UUID REFERENCES photos(id),
    page_number INTEGER NOT NULL,
    position_x FLOAT,
    position_y FLOAT,
    width FLOAT,
    height FLOAT,
    PRIMARY KEY (album_id, photo_id)
);
```

## API Endpoints

### Authentication
```python
# /api/v1/auth/
POST   /register          # User registration
POST   /login             # User login
POST   /refresh           # Token refresh
POST   /logout            # User logout
```

### Users
```python
# /api/v1/users/
GET    /me               # Current user info
PUT    /me               # Update user profile
DELETE /me               # Delete account
```

### Photos
```python
# /api/v1/photos/
GET    /                 # List photos
POST   /                 # Upload photo
GET    /{photo_id}       # Get photo details
PUT    /{photo_id}       # Update photo
DELETE /{photo_id}       # Delete photo
POST   /{photo_id}/faces # Detect faces
```

### Face Recognition
```python
# /api/v1/faces/
GET    /                 # List detected faces
POST   /recognize        # Recognize faces in photo
PUT    /{face_id}/person # Assign face to person
DELETE /{face_id}        # Remove face detection
```

### Persons
```python
# /api/v1/persons/
GET    /                 # List persons
POST   /                 # Create person
GET    /{person_id}      # Get person details
PUT    /{person_id}      # Update person
DELETE /{person_id}      # Delete person
GET    /{person_id}/photos # Get person's photos
```

### Albums
```python
# /api/v1/albums/
GET    /                 # List albums
POST   /                 # Create album
GET    /{album_id}       # Get album details
PUT    /{album_id}       # Update album
DELETE /{album_id}       # Delete album
POST   /{album_id}/photos # Add photos to album
```

## Machine Learning Pipeline

### Face Detection
```python
# OpenCV DNN Face Detection
import cv2
import numpy as np

class FaceDetector:
    def __init__(self):
        self.model = cv2.dnn.readNetFromTensorflow(
            'models/opencv_face_detector_uint8.pb',
            'models/opencv_face_detector.pbtxt'
        )
    
    def detect_faces(self, image):
        # Preprocess image
        blob = cv2.dnn.blobFromImage(
            image, 1.0, (300, 300), [104, 117, 123]
        )
        
        # Forward pass
        self.model.setInput(blob)
        detections = self.model.forward()
        
        # Process detections
        faces = []
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.7:
                # Extract bounding box
                box = detections[0, 0, i, 3:7] * np.array([
                    image.shape[1], image.shape[0],
                    image.shape[1], image.shape[0]
                ])
                faces.append({
                    'bbox': box.astype(int),
                    'confidence': float(confidence)
                })
        
        return faces
```

### Face Recognition
```python
# FaceNet Implementation
from keras.models import load_model
from sklearn.metrics.pairwise import cosine_similarity

class FaceRecognizer:
    def __init__(self):
        self.model = load_model('models/facenet_keras.h5')
        self.known_encodings = {}
    
    def extract_embedding(self, face_image):
        # Preprocess face
        face = cv2.resize(face_image, (160, 160))
        face = face.astype('float32') / 255.0
        face = np.expand_dims(face, axis=0)
        
        # Extract embedding
        embedding = self.model.predict(face)[0]
        return embedding
    
    def recognize_face(self, face_embedding, threshold=0.6):
        best_match = None
        best_similarity = 0
        
        for person_id, known_embedding in self.known_encodings.items():
            similarity = cosine_similarity(
                [face_embedding], [known_embedding]
            )[0][0]
            
            if similarity > best_similarity and similarity > threshold:
                best_similarity = similarity
                best_match = person_id
        
        return best_match, best_similarity
```

## Deployment Configuration

### Dockerfile (Backend)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
      - name: backend
        image: your-registry/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Monitoring e Logging

### Prometheus Metrics
```python
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency'
)
```

### Structured Logging
```python
import structlog

logger = structlog.get_logger()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    logger.info(
        "request_processed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        duration=duration
    )
    
    return response
```

## Security Considerations

### JWT Configuration
```python
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### File Upload Security
```python
import magic
from pathlib import Path

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_upload(file):
    # Check file size
    if file.size > MAX_FILE_SIZE:
        raise ValueError("File too large")
    
    # Check file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Invalid file type")
    
    # Check MIME type
    file_type = magic.from_buffer(file.file.read(1024), mime=True)
    if file_type not in ['image/jpeg', 'image/png', 'image/webp']:
        raise ValueError("Invalid file format")
    
    file.file.seek(0)  # Reset file pointer
    return True
```

## Performance Optimization

### Caching Strategy
```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

@cache(expire=3600)
async def get_user_photos(user_id: UUID):
    # Cached for 1 hour
    return await fetch_user_photos(user_id)
```

### Database Optimization
```sql
-- Indexes for performance
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_faces_photo_id ON faces(photo_id);
CREATE INDEX idx_faces_person_id ON faces(person_id);
CREATE INDEX idx_albums_user_id ON albums(user_id);

-- Vector index for face search
CREATE INDEX idx_faces_encoding ON faces USING ivfflat (face_encoding vector_cosine_ops);
```

Esta estrutura técnica fornece uma base sólida para o desenvolvimento do aplicativo, com escalabilidade, segurança e performance em mente.
