"""
Face Encoding Module for generating face embeddings
"""

import cv2
import numpy as np
from typing import Optional, List
import structlog
from pathlib import Path

from app.core.config import settings

logger = structlog.get_logger()


class FaceEncoder:
    """Face encoding using traditional computer vision methods"""
    
    def __init__(self):
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        self.target_size = (160, 160)
        self._initialize_encoder()
    
    def _initialize_encoder(self) -> None:
        """Initialize face encoding method"""
        try:
            # For MVP, we'll use a simple feature-based approach
            # In production, this would be replaced with deep learning models
            logger.info("face_encoder_initialized", method="feature_based")
            
        except Exception as e:
            logger.error("face_encoder_init_failed", error=str(e))
            raise
    
    def generate_embedding(self, face_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Generate face embedding from face image
        
        Args:
            face_image: Face image as numpy array (BGR format)
            
        Returns:
            Face embedding vector or None if encoding fails
        """
        try:
            if face_image is None or face_image.size == 0:
                logger.warning("empty_face_image_provided")
                return None
            
            # Convert to grayscale
            if len(face_image.shape) == 3:
                gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = face_image
            
            # Resize to standard size
            resized = cv2.resize(gray, self.target_size, interpolation=cv2.INTER_AREA)
            
            # Generate features using multiple methods
            features = []
            
            # 1. Histogram of Oriented Gradients (HOG)
            hog_features = self._extract_hog_features(resized)
            features.extend(hog_features)
            
            # 2. Local Binary Patterns (LBP)
            lbp_features = self._extract_lbp_features(resized)
            features.extend(lbp_features)
            
            # 3. Raw pixel values (normalized)
            pixel_features = resized.flatten() / 255.0
            features.extend(pixel_features[:100])  # Take subset to limit dimension
            
            # 4. Statistical features
            stats_features = self._extract_statistical_features(resized)
            features.extend(stats_features)
            
            # Convert to numpy array and normalize
            embedding = np.array(features, dtype=np.float32)
            
            # Pad or truncate to target dimension
            if len(embedding) < self.embedding_dimension:
                embedding = np.pad(embedding, (0, self.embedding_dimension - len(embedding)))
            elif len(embedding) > self.embedding_dimension:
                embedding = embedding[:self.embedding_dimension]
            
            # Normalize embedding
            embedding = self._normalize_embedding(embedding)
            
            return embedding
            
        except Exception as e:
            logger.error("embedding_generation_failed", error=str(e))
            return None
    
    def _extract_hog_features(self, image: np.ndarray) -> List[float]:
        """Extract HOG features from image"""
        try:
            # Simple gradient-based HOG implementation
            gx = cv2.Sobel(image, cv2.CV_32F, 1, 0)
            gy = cv2.Sobel(image, cv2.CV_32F, 0, 1)
            
            magnitude = np.sqrt(gx**2 + gy**2)
            orientation = np.arctan2(gy, gx) * 180 / np.pi
            
            # Create histogram bins
            bins = 9
            hist, _ = np.histogram(orientation, bins=bins, range=(-180, 180), weights=magnitude)
            
            # Normalize histogram
            hist = hist / (np.sum(hist) + 1e-7)
            
            return hist.tolist()
            
        except Exception as e:
            logger.warning("hog_extraction_failed", error=str(e))
            return [0.0] * 9
    
    def _extract_lbp_features(self, image: np.ndarray) -> List[float]:
        """Extract Local Binary Pattern features"""
        try:
            # Simple LBP implementation
            height, width = image.shape
            lbp = np.zeros_like(image)
            
            for i in range(1, height - 1):
                for j in range(1, width - 1):
                    center = image[i, j]
                    
                    # 8 neighbors
                    neighbors = [
                        image[i-1, j-1], image[i-1, j], image[i-1, j+1],
                        image[i, j+1], image[i+1, j+1], image[i+1, j],
                        image[i+1, j-1], image[i, j-1]
                    ]
                    
                    # Calculate LBP
                    binary = [1 if n >= center else 0 for n in neighbors]
                    lbp_value = 0
                    for k, bit in enumerate(binary):
                        lbp_value += bit * (2 ** k)
                    
                    lbp[i, j] = lbp_value
            
            # Calculate LBP histogram
            hist, _ = np.histogram(lbp, bins=256, range=(0, 256))
            hist = hist / (np.sum(hist) + 1e-7)
            
            # Return first 64 bins to limit dimension
            return hist[:64].tolist()
            
        except Exception as e:
            logger.warning("lbp_extraction_failed", error=str(e))
            return [0.0] * 64
    
    def _extract_statistical_features(self, image: np.ndarray) -> List[float]:
        """Extract statistical features from image"""
        try:
            features = []
            
            # Basic statistics
            features.append(float(np.mean(image)))
            features.append(float(np.std(image)))
            features.append(float(np.min(image)))
            features.append(float(np.max(image)))
            
            # Percentiles
            features.append(float(np.percentile(image, 25)))
            features.append(float(np.percentile(image, 50)))
            features.append(float(np.percentile(image, 75)))
            
            # Skewness and kurtosis
            mean = np.mean(image)
            std = np.std(image)
            if std > 0:
                skewness = np.mean(((image - mean) / std) ** 3)
                kurtosis = np.mean(((image - mean) / std) ** 4) - 3
            else:
                skewness = 0
                kurtosis = 0
            
            features.append(float(skewness))
            features.append(float(kurtosis))
            
            # Edge density
            edges = cv2.Canny(image, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            features.append(float(edge_density))
            
            return features
            
        except Exception as e:
            logger.warning("stats_extraction_failed", error=str(e))
            return [0.0] * 12
    
    def _normalize_embedding(self, embedding: np.ndarray) -> np.ndarray:
        """Normalize embedding vector"""
        try:
            # L2 normalization
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            
            return embedding
            
        except Exception as e:
            logger.warning("embedding_normalization_failed", error=str(e))
            return embedding
    
    def compare_embeddings(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compare two face embeddings
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
            
        Returns:
            Similarity score between 0.0 and 1.0
        """
        try:
            if embedding1 is None or embedding2 is None:
                return 0.0
            
            # Calculate cosine similarity
            similarity = np.dot(embedding1, embedding2)
            
            # Ensure similarity is in [0, 1] range
            similarity = max(0.0, min(1.0, similarity))
            
            return float(similarity)
            
        except Exception as e:
            logger.error("embedding_comparison_failed", error=str(e))
            return 0.0
    
    def get_encoder_info(self) -> dict:
        """Get encoder information"""
        return {
            'type': 'Feature-based Encoder',
            'embedding_dimension': self.embedding_dimension,
            'target_size': self.target_size,
            'methods': ['HOG', 'LBP', 'Pixels', 'Statistics']
        }


# Global face encoder instance
face_encoder = FaceEncoder()
