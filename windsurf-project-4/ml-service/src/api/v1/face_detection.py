"""
Face Detection API endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import structlog
from typing import List, Optional
import io
import base64

from app.models.face_detector import face_detector
from app.models.face_encoder import face_encoder

router = APIRouter()
logger = structlog.get_logger()


def decode_image_from_upload(file: UploadFile) -> Optional[np.ndarray]:
    """Decode image from uploaded file"""
    try:
        # Read file content
        contents = file.file.read()
        file.file.seek(0)
        
        # Convert to numpy array
        nparr = np.frombuffer(contents, np.uint8)
        
        # Decode image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            logger.error("image_decode_failed", filename=file.filename)
            return None
        
        logger.info("image_decoded", filename=file.filename, shape=image.shape)
        return image
        
    except Exception as e:
        logger.error("image_decode_exception", error=str(e), filename=file.filename)
        return None


@router.post("/detect")
async def detect_faces(
    file: UploadFile = File(...),
    return_face_images: bool = Form(False),
    min_confidence: float = Form(0.5)
):
    """
    Detect faces in an uploaded image
    
    Args:
        file: Image file to process
        return_face_images: Whether to return extracted face images
        min_confidence: Minimum confidence threshold for face detection
        
    Returns:
        JSON response with detected faces
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Decode image
        image = decode_image_from_upload(file)
        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to decode image"
            )
        
        # Detect faces
        detected_faces = face_detector.detect_faces(image)
        
        # Filter by confidence
        filtered_faces = [
            face for face in detected_faces 
            if face['confidence'] >= min_confidence
        ]
        
        # Process faces
        results = []
        for face_data in filtered_faces:
            bbox = face_data['bbox']
            
            result = {
                'bbox': bbox,
                'confidence': face_data['confidence'],
                'quality_score': face_data.get('quality_score', 0.5),
                'bbox_area': bbox['width'] * bbox['height'],
                'bbox_center_x': bbox['x'] + bbox['width'] // 2,
                'bbox_center_y': bbox['y'] + bbox['height'] // 2,
                'is_high_confidence': face_data['confidence'] >= 0.8,
                'is_good_quality': face_data.get('quality_score', 0.5) >= 0.6,
            }
            
            # Extract face image if requested
            if return_face_images:
                face_image = face_detector.extract_face(image, bbox)
                if face_image is not None:
                    # Encode face image to base64
                    _, buffer = cv2.imencode('.jpg', face_image)
                    face_b64 = base64.b64encode(buffer).decode('utf-8')
                    result['face_image'] = f"data:image/jpeg;base64,{face_b64}"
                else:
                    result['face_image'] = None
            
            # Generate embedding for recognition
            face_image = face_detector.extract_face(image, bbox)
            if face_image is not None:
                embedding = face_encoder.generate_embedding(face_image)
                if embedding is not None:
                    result['embedding'] = embedding.tolist()
                else:
                    result['embedding'] = None
            else:
                result['embedding'] = None
            
            results.append(result)
        
        logger.info("face_detection_completed", 
                   filename=file.filename, 
                   faces_detected=len(results),
                   total_faces=len(detected_faces))
        
        return {
            'success': True,
            'filename': file.filename,
            'image_size': {
                'width': int(image.shape[1]),
                'height': int(image.shape[0]),
                'channels': int(image.shape[2]) if len(image.shape) > 2 else 1
            },
            'faces_detected': len(results),
            'total_faces_processed': len(detected_faces),
            'faces': results,
            'processing_info': {
                'detector_info': face_detector.get_detector_info(),
                'min_confidence_threshold': min_confidence,
                'return_face_images': return_face_images
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("face_detection_error", error=str(e), filename=file.filename)
        raise HTTPException(
            status_code=500,
            detail=f"Face detection failed: {str(e)}"
        )


@router.post("/detect_batch")
async def detect_faces_batch(
    files: List[UploadFile] = File(...),
    min_confidence: float = Form(0.5)
):
    """
    Detect faces in multiple images
    
    Args:
        files: List of image files to process
        min_confidence: Minimum confidence threshold for face detection
        
    Returns:
        JSON response with detected faces for each image
    """
    try:
        if len(files) > 10:  # Limit batch size
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 files allowed per batch"
            )
        
        results = []
        total_faces = 0
        
        for file in files:
            try:
                # Process each image
                result = await detect_faces(file, return_face_images=False, min_confidence=min_confidence)
                results.append({
                    'filename': file.filename,
                    'success': True,
                    'faces_detected': result['faces_detected'],
                    'faces': result['faces']
                })
                total_faces += result['faces_detected']
                
            except Exception as e:
                logger.error("batch_processing_failed", filename=file.filename, error=str(e))
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'error': str(e),
                    'faces_detected': 0,
                    'faces': []
                })
        
        logger.info("batch_face_detection_completed", 
                   files_processed=len(files),
                   total_faces=total_faces)
        
        return {
            'success': True,
            'files_processed': len(files),
            'total_faces_detected': total_faces,
            'results': results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("batch_face_detection_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Batch face detection failed: {str(e)}"
        )


@router.get("/detector_info")
async def get_detector_info():
    """Get information about the face detector"""
    try:
        return {
            'success': True,
            'detector': face_detector.get_detector_info(),
            'encoder': face_encoder.get_encoder_info()
        }
    except Exception as e:
        logger.error("detector_info_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get detector info: {str(e)}"
        )


@router.post("/test")
async def test_detection():
    """
    Test endpoint for face detection
    Creates a simple test image and detects faces
    """
    try:
        # Create a simple test image
        test_image = np.zeros((200, 200, 3), dtype=np.uint8)
        
        # Add a simple "face" rectangle
        cv2.rectangle(test_image, (50, 50), (150, 150), (255, 255, 255), -1)
        cv2.rectangle(test_image, (70, 70), (130, 130), (0, 0, 0), -1)  # Eyes
        cv2.rectangle(test_image, (85, 120), (115, 130), (0, 0, 0), -1)  # Mouth
        
        # Detect faces
        faces = face_detector.detect_faces(test_image)
        
        return {
            'success': True,
            'test_image_size': {
                'width': 200,
                'height': 200,
                'channels': 3
            },
            'faces_detected': len(faces),
            'faces': faces,
            'detector_info': face_detector.get_detector_info()
        }
        
    except Exception as e:
        logger.error("test_detection_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Test detection failed: {str(e)}"
        )
