"""
Person model for identified individuals
"""

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Person(Base):
    """
    Person model for identified individuals
    """
    __tablename__ = "persons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Basic information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Avatar/representative photo
    avatar_photo_id = Column(UUID(as_uuid=True), ForeignKey("photos.id", ondelete="SET NULL"), nullable=True)
    
    # Face recognition data
    is_confirmed = Column(Boolean, default=False, nullable=False)  # User confirmed this person
    face_count = Column(Integer, default=0, nullable=False)  # Number of faces assigned to this person
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="persons")
    avatar_photo = relationship("Photo", foreign_keys=[avatar_photo_id])
    faces = relationship("Face", back_populates="person", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Person(id={self.id}, name={self.name}, user_id={self.user_id})>"
    
    @property
    def photo_count(self) -> int:
        """Get number of photos containing this person"""
        if not self.faces:
            return 0
        
        # Get unique photos from faces
        photo_ids = {face.photo_id for face in self.faces}
        return len(photo_ids)
    
    @property
    def confirmed_face_count(self) -> int:
        """Get number of verified faces for this person"""
        if not self.faces:
            return 0
        
        return len([face for face in self.faces if face.is_verified])
    
    def update_face_count(self):
        """Update the face count based on current faces"""
        self.face_count = len(self.faces) if self.faces else 0
