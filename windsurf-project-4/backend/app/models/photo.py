"""
Photo model for image storage and metadata
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, DECIMAL, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class ProcessingStatus(str, enum.Enum):
    """Photo processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Photo(Base):
    """
    Photo model for image storage and metadata
    """
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    
    # Image properties
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    format = Column(String(10), nullable=False)  # jpg, png, etc.
    
    # Storage information
    s3_key = Column(String(500), nullable=False)  # S3/MinIO key
    thumbnail_key = Column(String(500), nullable=True)  # Thumbnail S3 key
    
    # EXIF metadata
    taken_at = Column(DateTime(timezone=True), nullable=True)
    gps_lat = Column(DECIMAL(10, 8), nullable=True)  # Latitude
    gps_lng = Column(DECIMAL(11, 8), nullable=True)  # Longitude
    camera_make = Column(String(100), nullable=True)
    camera_model = Column(String(100), nullable=True)
    lens_model = Column(String(100), nullable=True)
    iso = Column(Integer, nullable=True)
    aperture = Column(String(10), nullable=True)  # f/2.8
    shutter_speed = Column(String(20), nullable=True)  # 1/250
    focal_length = Column(String(10), nullable=True)  # 50mm
    
    # Processing status
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING, nullable=False)
    processing_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="photos")
    faces = relationship("Face", back_populates="photo", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Photo(id={self.id}, filename={self.filename}, user_id={self.user_id})>"
    
    @property
    def face_count(self) -> int:
        """Get number of faces detected in this photo"""
        return len(self.faces) if self.faces else 0
    
    @property
    def has_gps(self) -> bool:
        """Check if photo has GPS coordinates"""
        return self.gps_lat is not None and self.gps_lng is not None
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in megabytes"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def aspect_ratio(self) -> float:
        """Calculate aspect ratio"""
        if self.height == 0:
            return 0
        return self.width / self.height
