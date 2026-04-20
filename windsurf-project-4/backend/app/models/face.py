"""
Face model for detected faces in photos
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, VECTOR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Face(Base):
    """
    Face model for detected faces in photos
    """
    __tablename__ = "faces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    photo_id = Column(UUID(as_uuid=True), ForeignKey("photos.id", ondelete="CASCADE"), nullable=False, index=True)
    person_id = Column(UUID(as_uuid=True), ForeignKey("persons.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Face detection data
    bbox_x = Column(Integer, nullable=False)  # Bounding box x coordinate
    bbox_y = Column(Integer, nullable=False)  # Bounding box y coordinate
    bbox_width = Column(Integer, nullable=False)  # Bounding box width
    bbox_height = Column(Integer, nullable=False)  # Bounding box height
    
    # Face recognition data
    face_encoding = Column(VECTOR(512), nullable=False)  # Face embedding vector
    confidence = Column(Float, nullable=False)  # Detection confidence (0-1)
    quality_score = Column(Float, nullable=True)  # Face quality score (0-1)
    
    # Verification status
    is_verified = Column(Boolean, default=False, nullable=False)  # User verified this face
    verification_notes = Column(Text, nullable=True)  # User notes about verification
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    photo = relationship("Photo", back_populates="faces")
    person = relationship("Person", back_populates="faces")
    
    def __repr__(self):
        return f"<Face(id={self.id}, photo_id={self.photo_id}, person_id={self.person_id})>"
    
    @property
    def bbox_area(self) -> int:
        """Calculate bounding box area"""
        return self.bbox_width * self.bbox_height
    
    @property
    def bbox_center_x(self) -> float:
        """Calculate bounding box center x coordinate"""
        return self.bbox_x + (self.bbox_width / 2)
    
    @property
    def bbox_center_y(self) -> float:
        """Calculate bounding box center y coordinate"""
        return self.bbox_y + (self.bbox_height / 2)
    
    @property
    def is_high_confidence(self) -> bool:
        """Check if face detection has high confidence"""
        return self.confidence >= 0.8
    
    @property
    def is_good_quality(self) -> bool:
        """Check if face has good quality"""
        return self.quality_score is not None and self.quality_score >= 0.7
    
    @property
    def bbox_dict(self) -> dict:
        """Get bounding box as dictionary"""
        return {
            "x": self.bbox_x,
            "y": self.bbox_y,
            "width": self.bbox_width,
            "height": self.bbox_height,
            "center_x": self.bbox_center_x,
            "center_y": self.bbox_center_y,
            "area": self.bbox_area,
        }
    
    def calculate_similarity(self, other_encoding: VECTOR) -> float:
        """
        Calculate cosine similarity with another face encoding
        Note: This is a placeholder - actual implementation would use pgvector functions
        """
        # In a real implementation, this would use pgvector <=> operator
        # For now, return a placeholder value
        return 0.0
