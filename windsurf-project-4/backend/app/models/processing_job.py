"""
Processing job model for background tasks
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class JobType(str, enum.Enum):
    """Types of processing jobs"""
    FACE_DETECTION = "face_detection"
    FACE_RECOGNITION = "face_recognition"
    THUMBNAIL_GENERATION = "thumbnail_generation"
    PHOTO_PROCESSING = "photo_processing"


class JobStatus(str, enum.Enum):
    """Job processing status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ProcessingJob(Base):
    """
    Processing job model for background tasks
    """
    __tablename__ = "processing_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    photo_id = Column(UUID(as_uuid=True), ForeignKey("photos.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Job information
    job_type = Column(Enum(JobType), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False, index=True)
    
    # Job metadata
    task_id = Column(String(255), nullable=True, index=True)  # Celery task ID
    progress = Column(String(50), nullable=True)  # Progress information
    result_data = Column(Text, nullable=True)  # JSON string with results
    
    # Error information
    error_message = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)
    retry_count = Column(String(50), default="0", nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    photo = relationship("Photo")
    
    def __repr__(self):
        return f"<ProcessingJob(id={self.id}, type={self.job_type}, status={self.status})>"
    
    @property
    def is_running(self) -> bool:
        """Check if job is currently running"""
        return self.status == JobStatus.RUNNING
    
    @property
    def is_completed(self) -> bool:
        """Check if job has completed (successfully or failed)"""
        return self.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]
    
    @property
    def is_successful(self) -> bool:
        """Check if job completed successfully"""
        return self.status == JobStatus.COMPLETED
    
    @property
    def has_failed(self) -> bool:
        """Check if job has failed"""
        return self.status == JobStatus.FAILED
    
    @property
    def duration_seconds(self) -> float:
        """Calculate job duration in seconds"""
        if not self.started_at:
            return 0.0
        
        end_time = self.completed_at or func.now()
        return (end_time - self.started_at).total_seconds()
    
    def mark_as_running(self, task_id: str = None):
        """Mark job as running"""
        self.status = JobStatus.RUNNING
        self.started_at = func.now()
        if task_id:
            self.task_id = task_id
    
    def mark_as_completed(self, result_data: str = None):
        """Mark job as completed successfully"""
        self.status = JobStatus.COMPLETED
        self.completed_at = func.now()
        if result_data:
            self.result_data = result_data
    
    def mark_as_failed(self, error_message: str, error_details: str = None):
        """Mark job as failed"""
        self.status = JobStatus.FAILED
        self.completed_at = func.now()
        self.error_message = error_message
        if error_details:
            self.error_details = error_details
    
    def mark_as_cancelled(self):
        """Mark job as cancelled"""
        self.status = JobStatus.CANCELLED
        self.completed_at = func.now()
