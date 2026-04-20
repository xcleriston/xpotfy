"""
Face Detection Module using OpenCV Haar Cascades
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional
import structlog
from pathlib import Path

from app.core.config import settings

logger = structlog.get_logger()


class FaceDetector:
    """Face detection using OpenCV Haar Cascade classifiers"""
    
    def __init__(self):
        self.face_cascade = None
        self.model_path = Path(settings.MODEL_PATH)
        self.confidence_threshold = settings.FACE_DETECTION_CONFIDENCE_THRESHOLD
        self.min_face_size = settings.MIN_FACE_SIZE
        self.max_face_size = settings.MAX_FACE_SIZE
        self._load_models()
    
    def _load_models(self) -> None:
        """Load face detection models"""
        try:
            # Create model directory if it doesn't exist
            self.model_path.mkdir(exist_ok=True)
            
            # Load Haar Cascade classifier
            cascade_path = self.model_path / settings.FACE_DETECTION_MODEL
            
            if not cascade_path.exists():
                logger.warning("face_cascade_not_found", path=str(cascade_path))
                # Use OpenCV's built-in cascade as fallback
                self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            else:
                self.face_cascade = cv2.CascadeClassifier(str(cascade_path))
            
            if self.face_cascade.empty():
                raise RuntimeError("Failed to load face cascade classifier")
            
            logger.info("face_detector_loaded", model=str(cascade_path))
            
        except Exception as e:
            logger.error("face_detector_load_failed", error=str(e))
            raise
    
    def detect_faces(self, image: np.ndarray, return_confidence: bool = False) -> List[dict]:
        """
        Detect faces in an image
        
        Args:
            image: Input image as numpy array (BGR format)
            return_confidence: Whether to return confidence scores
            
        Returns:
            List of detected face dictionaries with bounding boxes and optional confidence
        """
        try:
            if image is None or image.size == 0:
                logger.warning("empty_image_provided")
                return []
            
            # Convert to grayscale for detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(self.min_face_size, self.min_face_size),
                maxSize=(self.max_face_size, self.max_face_size),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            # Convert to list of dictionaries
            detected_faces = []
            for (x, y, w, h) in faces:
                face_data = {
                    'bbox': {
                        'x': int(x),
                        'y': int(y),
                        'width': int(w),
                        'height': int(h)
                    },
                    'confidence': 0.8  # Haar cascades don't provide confidence, use default
                }
                
                # Validate face dimensions
                if w >= self.min_face_size and h >= self.min_face_size:
                    # Calculate face quality metrics
                    face_data['quality_score'] = self._calculate_face_quality(gray[y:y+h, x:x+w])
                    detected_faces.append(face_data)
            
            logger.info("faces_detected", count=len(detected_faces))
            return detected_faces
            
        except Exception as e:
            logger.error("face_detection_failed", error=str(e))
            return []
    
    def _calculate_face_quality(self, face_image: np.ndarray) -> float:
        """
        Calculate face quality score based on various metrics
        
        Args:
            face_image: Grayscale face image patch
            
        Returns:
            Quality score between 0.0 and 1.0
        """
        try:
            if face_image.size == 0:
                return 0.0
            
            # Calculate Laplacian variance (sharpness)
            laplacian_var = cv2.Laplacian(face_image, cv2.CV_64F).var()
            
            # Normalize to 0-1 range (typical values 0-1000)
            sharpness_score = min(laplacian_var / 1000.0, 1.0)
            
            # Calculate brightness score (avoid too dark/bright faces)
            mean_brightness = np.mean(face_image)
            brightness_score = 1.0 - abs(mean_brightness - 128) / 128.0
            
            # Calculate contrast score
            contrast_score = np.std(face_image) / 128.0
            contrast_score = min(contrast_score, 1.0)
            
            # Combine scores with weights
            quality_score = (
                0.5 * sharpness_score +
                0.3 * brightness_score +
                0.2 * contrast_score
            )
            
            return max(0.0, min(1.0, quality_score))
            
        except Exception as e:
            logger.warning("quality_calculation_failed", error=str(e))
            return 0.5  # Default medium quality
    
    def extract_face(self, image: np.ndarray, bbox: dict, target_size: tuple = (160, 160)) -> Optional[np.ndarray]:
        """
        Extract and align face from image
        
        Args:
            image: Input image
            bbox: Bounding box dictionary with x, y, width, height
            target_size: Target size for extracted face
            
        Returns:
            Extracted face image or None if extraction fails
        """
        try:
            x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
            
            # Add some padding
            padding = int(0.2 * min(w, h))
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(image.shape[1], x + w + padding)
            y2 = min(image.shape[0], y + h + padding)
            
            # Extract face
            face = image[y1:y2, x1:x2]
            
            if face.size == 0:
                return None
            
            # Resize to target size
            face_resized = cv2.resize(face, target_size, interpolation=cv2.INTER_AREA)
            
            return face_resized
            
        except Exception as e:
            logger.error("face_extraction_failed", error=str(e))
            return None
    
    def get_detector_info(self) -> dict:
        """Get detector information"""
        return {
            'type': 'Haar Cascade',
            'model': settings.FACE_DETECTION_MODEL,
            'confidence_threshold': self.confidence_threshold,
            'min_face_size': self.min_face_size,
            'max_face_size': self.max_face_size,
            'loaded': self.face_cascade is not None and not self.face_cascade.empty()
        }


# Global face detector instance
face_detector = FaceDetector()
