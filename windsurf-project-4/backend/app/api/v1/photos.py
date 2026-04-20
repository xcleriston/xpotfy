"""
Photo management endpoints
"""

from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id, validate_file_extension, validate_file_size
from app.models.user import User
from app.models.photo import Photo, ProcessingStatus
from app.schemas.photo import (
    PhotoResponse,
    PhotoListResponse,
    PhotoStatsResponse,
    PhotoUploadResponse,
)

router = APIRouter()


@router.post("/upload", response_model=PhotoUploadResponse)
async def upload_photo(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Upload a new photo
    """
    # Validate file
    if not validate_file_extension(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    file_content = await file.read()
    if not validate_file_size(len(file_content)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # TODO: Implement actual file upload to MinIO/S3
    # For now, create a placeholder photo record
    
    # Extract image metadata (placeholder)
    # TODO: Use Pillow to extract actual metadata
    
    photo = Photo(
        user_id=user_id,
        filename=f"uploads/{user_id}/{file.filename}",
        original_filename=file.filename,
        file_size=len(file_content),
        width=1920,  # Placeholder
        height=1080,  # Placeholder
        format=file.filename.split('.')[-1].lower(),
        s3_key=f"uploads/{user_id}/{file.filename}",
        processing_status=ProcessingStatus.PENDING,
    )
    
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    
    # TODO: Trigger background processing job
    
    return PhotoUploadResponse(
        id=str(photo.id),
        filename=photo.filename,
        file_size=photo.file_size,
        processing_status=photo.processing_status,
    )


@router.get("/", response_model=PhotoListResponse)
async def list_photos(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    List user's photos with pagination and filtering
    """
    # Validate page size
    if page_size > settings.MAX_PAGE_SIZE:
        page_size = settings.MAX_PAGE_SIZE
    
    # Build query
    query = select(Photo).where(Photo.user_id == user_id)
    
    # Apply filters
    if search:
        query = query.where(
            or_(
                Photo.original_filename.ilike(f"%{search}%"),
                Photo.camera_make.ilike(f"%{search}%"),
                Photo.camera_model.ilike(f"%{search}%"),
            )
        )
    
    if status:
        query = query.where(Photo.processing_status == ProcessingStatus(status))
    
    # Count total photos
    count_query = select(func.count(Photo.id)).where(Photo.user_id == user_id)
    if search:
        count_query = count_query.where(
            or_(
                Photo.original_filename.ilike(f"%{search}%"),
                Photo.camera_make.ilike(f"%{search}%"),
                Photo.camera_model.ilike(f"%{search}%"),
            )
        )
    if status:
        count_query = count_query.where(Photo.processing_status == ProcessingStatus(status))
    
    # Execute queries
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(Photo.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    photos = result.scalars().all()
    
    # Calculate pagination info
    has_next = page * page_size < total
    has_prev = page > 1
    
    return PhotoListResponse(
        photos=[PhotoResponse.from_orm(photo) for photo in photos],
        total=total,
        page=page,
        page_size=page_size,
        has_next=has_next,
        has_prev=has_prev,
    )


@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get photo details by ID
    """
    from sqlalchemy import select
    
    result = await db.execute(
        select(Photo).where(
            and_(Photo.id == photo_id, Photo.user_id == user_id)
        )
    )
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    return PhotoResponse.from_orm(photo)


@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Delete a photo
    """
    from sqlalchemy import select
    
    result = await db.execute(
        select(Photo).where(
            and_(Photo.id == photo_id, Photo.user_id == user_id)
        )
    )
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    # TODO: Delete file from storage
    
    await db.delete(photo)
    await db.commit()
    
    return {"message": "Photo deleted successfully"}


@router.get("/stats", response_model=PhotoStatsResponse)
async def get_photo_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get photo statistics for the user
    """
    from sqlalchemy import select
    
    # Total photos
    total_photos_result = await db.execute(
        select(func.count(Photo.id)).where(Photo.user_id == user_id)
    )
    total_photos = total_photos_result.scalar()
    
    # Storage used
    storage_result = await db.execute(
        select(func.sum(Photo.file_size)).where(Photo.user_id == user_id)
    )
    storage_bytes = storage_result.scalar() or 0
    storage_used_mb = storage_bytes / (1024 * 1024)
    
    # Processing status counts
    completed_result = await db.execute(
        select(func.count(Photo.id)).where(
            and_(
                Photo.user_id == user_id,
                Photo.processing_status == ProcessingStatus.COMPLETED
            )
        )
    )
    processing_completed = completed_result.scalar()
    
    pending_result = await db.execute(
        select(func.count(Photo.id)).where(
            and_(
                Photo.user_id == user_id,
                Photo.processing_status == ProcessingStatus.PENDING
            )
        )
    )
    processing_pending = pending_result.scalar()
    
    failed_result = await db.execute(
        select(func.count(Photo.id)).where(
            and_(
                Photo.user_id == user_id,
                Photo.processing_status == ProcessingStatus.FAILED
            )
        )
    )
    processing_failed = failed_result.scalar()
    
    # TODO: Get total faces and persons from related tables
    
    return PhotoStatsResponse(
        total_photos=total_photos,
        total_faces=0,  # TODO: Implement
        total_persons=0,  # TODO: Implement
        storage_used_mb=round(storage_used_mb, 2),
        processing_completed=processing_completed,
        processing_pending=processing_pending,
        processing_failed=processing_failed,
    )
