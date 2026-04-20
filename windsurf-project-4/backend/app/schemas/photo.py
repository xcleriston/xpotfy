"""
Photo schemas for API request/response models
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, validator


class PhotoBase(BaseModel):
    """Base photo schema"""
    original_filename: Optional[str] = None
    width: int
    height: int
    format: str
    
    # EXIF metadata
    taken_at: Optional[datetime] = None
    gps_lat: Optional[Decimal] = None
    gps_lng: Optional[Decimal] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    lens_model: Optional[str] = None
    iso: Optional[int] = None
    aperture: Optional[str] = None
    shutter_speed: Optional[str] = None
    focal_length: Optional[str] = None


class PhotoCreate(PhotoBase):
    """Photo creation schema"""
    filename: str
    file_size: int
    s3_key: str
    thumbnail_key: Optional[str] = None


class PhotoUpdate(BaseModel):
    """Photo update schema"""
    original_filename: Optional[str] = None
    taken_at: Optional[datetime] = None
    gps_lat: Optional[Decimal] = None
    gps_lng: Optional[Decimal] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    lens_model: Optional[str] = None
    iso: Optional[int] = None
    aperture: Optional[str] = None
    shutter_speed: Optional[str] = None
    focal_length: Optional[str] = None


class PhotoResponse(PhotoBase):
    """Photo response schema"""
    id: str
    user_id: str
    filename: str
    file_size: int
    s3_key: str
    thumbnail_key: Optional[str] = None
    processing_status: str
    processing_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    face_count: int
    file_size_mb: float
    aspect_ratio: float
    has_gps: bool

    class Config:
        from_attributes = True


class PhotoUploadResponse(BaseModel):
    """Photo upload response schema"""
    id: str
    filename: str
    file_size: int
    processing_status: str
    upload_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class PhotoListResponse(BaseModel):
    """Photo list response schema"""
    photos: List[PhotoResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool


class PhotoStatsResponse(BaseModel):
    """Photo statistics response schema"""
    total_photos: int
    total_faces: int
    total_persons: int
    storage_used_mb: float
    processing_completed: int
    processing_pending: int
    processing_failed: int
