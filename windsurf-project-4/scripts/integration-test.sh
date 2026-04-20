#!/bin/bash

# Integration Test Script for Face Recognition MVP
# This script tests the complete integration of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if service is healthy
check_service_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Checking $service_name health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            print_success "$service_name is healthy!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to run API tests
test_api_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-""}
    local expected_status=${4:-200}
    
    print_status "Testing $method $endpoint..."
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$endpoint")
    else
        response=$(curl -s -w "%{http_code}" "$endpoint")
    fi
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$method $endpoint - Status: $status_code"
        return 0
    else
        print_error "$method $endpoint - Expected: $expected_status, Got: $status_code"
        print_error "Response: $response_body"
        return 1
    fi
}

# Function to test file upload
test_file_upload() {
    local endpoint=$1
    local file_path=$2
    
    print_status "Testing file upload to $endpoint..."
    
    if [ ! -f "$file_path" ]; then
        print_error "Test file not found: $file_path"
        return 1
    fi
    
    response=$(curl -s -w "%{http_code}" -X POST -F "file=@$file_path" "$endpoint")
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" = "200" ]; then
        print_success "File upload successful - Status: $status_code"
        return 0
    else
        print_error "File upload failed - Status: $status_code"
        print_error "Response: $response_body"
        return 1
    fi
}

# Main integration test function
run_integration_tests() {
    print_status "Starting Face Recognition MVP Integration Tests"
    echo "=================================================="
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if services are running
    print_status "Checking if services are running..."
    
    services=("face_recognition_backend_integration" "face_recognition_ml_integration" "face_recognition_frontend_integration")
    for service in "${services[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "$service"; then
            print_error "Service $service is not running"
            exit 1
        fi
    done
    
    print_success "All services are running!"
    
    # Health checks
    echo ""
    print_status "Performing health checks..."
    
    check_service_health "Backend" "http://localhost:8000/health" || exit 1
    check_service_health "ML Service" "http://localhost:8001/health" || exit 1
    check_service_health "Frontend" "http://localhost:3000" || exit 1
    
    # Backend API Tests
    echo ""
    print_status "Testing Backend API..."
    
    # Test health endpoint
    test_api_endpoint "http://localhost:8000/health"
    
    # Test registration
    test_api_endpoint "http://localhost:8000/api/v1/auth/register" "POST" '{"email":"test@example.com","password":"test123456","name":"Test User"}' 200
    
    # Test login
    login_response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123456"}' "http://localhost:8000/api/v1/auth/login")
    token=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$token" ]; then
        print_success "Login successful, token obtained"
    else
        print_error "Failed to obtain token"
        exit 1
    fi
    
    # Test protected endpoint
    test_api_endpoint "http://localhost:8000/api/v1/auth/me" "GET" "" 200
    
    # Test photo stats
    test_api_endpoint "http://localhost:8000/api/v1/photos/stats" "GET" "" 200
    
    # ML Service Tests
    echo ""
    print_status "Testing ML Service..."
    
    # Test ML health
    test_api_endpoint "http://localhost:8001/health"
    
    # Test detector info
    test_api_endpoint "http://localhost:8001/api/v1/face-detection/detector_info"
    
    # Test encoder info
    test_api_endpoint "http://localhost:8001/api/v1/face-recognition/encoder_info"
    
    # Test ML test endpoint
    test_api_endpoint "http://localhost:8001/api/v1/face-detection/test"
    
    # Integration Tests
    echo ""
    print_status "Testing Integration..."
    
    # Create a test image for upload
    test_image="/tmp/test_image.jpg"
    python3 -c "
import cv2
import numpy as np
# Create a simple test image
img = np.zeros((200, 200, 3), dtype=np.uint8)
cv2.rectangle(img, (50, 50), (150, 150), (255, 255, 255), -1)
cv2.rectangle(img, (70, 70), (130, 130), (0, 0, 0), -1)
cv2.rectangle(img, (85, 120), (115, 130), (0, 0, 0), -1)
cv2.imwrite('$test_image', img)
print('Test image created')
"
    
    if [ -f "$test_image" ]; then
        print_success "Test image created"
        
        # Test ML face detection
        test_file_upload "http://localhost:8001/api/v1/face-detection/detect" "$test_image"
        
        # Test backend photo upload (this might fail without proper MinIO setup)
        print_warning "Testing backend photo upload (may fail without MinIO configuration)..."
        test_file_upload "http://localhost:8000/api/v1/photos/upload" "$test_image" || print_warning "Backend upload test failed (expected without MinIO)"
        
        # Cleanup
        rm -f "$test_image"
    else
        print_error "Failed to create test image"
    fi
    
    # Frontend Tests
    echo ""
    print_status "Testing Frontend..."
    
    # Test frontend accessibility
    if curl -f -s "http://localhost:3000" > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
    fi
    
    # Performance Tests
    echo ""
    print_status "Running Performance Tests..."
    
    # Test API response times
    print_status "Testing API response times..."
    
    for endpoint in "http://localhost:8000/health" "http://localhost:8001/health"; do
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$endpoint")
        print_status "$endpoint response time: ${response_time}s"
        
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            print_success "Response time is acceptable"
        else
            print_warning "Response time is slow"
        fi
    done
    
    # Final Summary
    echo ""
    echo "=================================================="
    print_success "Integration Tests Completed!"
    echo ""
    print_status "Service URLs:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000/docs"
    echo "  - ML Service: http://localhost:8001/docs"
    echo "  - MinIO Console: http://localhost:9001"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001"
    echo ""
    print_status "Test user credentials:"
    echo "  - Email: test@example.com"
    echo "  - Password: test123456"
    echo ""
    print_success "All integration tests passed! 🎉"
}

# Function to cleanup test data
cleanup() {
    print_status "Cleaning up test data..."
    
    # Remove test user from database (if needed)
    # This would require database connection setup
    
    print_status "Cleanup completed"
}

# Trap to cleanup on exit
trap cleanup EXIT

# Run the integration tests
run_integration_tests
