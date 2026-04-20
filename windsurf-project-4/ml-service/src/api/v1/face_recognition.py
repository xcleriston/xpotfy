"""
Face Recognition API endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import structlog
from typing import List, Optional, Dict
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


@router.post("/recognize")
async def recognize_faces(
    file: UploadFile = File(...),
    known_embeddings: str = Form("[]"),  # JSON string of known embeddings
    threshold: float = Form(0.6)
):
    """
    Recognize faces in an uploaded image against known embeddings
    
    Args:
        file: Image file to process
        known_embeddings: JSON string of known face embeddings with labels
        threshold: Recognition threshold
        
    Returns:
        JSON response with recognized faces
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
        
        # Parse known embeddings
        import json
        try:
            known_faces = json.loads(known_embeddings)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid known_embeddings format"
            )
        
        # Detect faces
        detected_faces = face_detector.detect_faces(image)
        
        # Process each detected face
        results = []
        for face_data in detected_faces:
            bbox = face_data['bbox']
            
            # Extract face
            face_image = face_detector.extract_face(image, bbox)
            if face_image is None:
                continue
            
            # Generate embedding
            embedding = face_encoder.generate_embedding(face_image)
            if embedding is None:
                continue
            
            # Compare with known faces
            best_match = None
            best_similarity = 0.0
            
            for known_face in known_faces:
                known_embedding = np.array(known_face['embedding'])
                similarity = face_encoder.compare_embeddings(embedding, known_embedding)
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = known_face
            
            # Determine if recognition is successful
            is_recognized = best_similarity >= threshold and best_match is not None
            
            result = {
                'bbox': bbox,
                'confidence': face_data['confidence'],
                'quality_score': face_data.get('quality_score', 0.5),
                'is_recognized': is_recognized,
                'similarity': float(best_similarity),
                'threshold': threshold,
                'embedding': embedding.tolist()
            }
            
            if is_recognized and best_match:
                result['person'] = {
                    'id': best_match.get('id'),
                    'name': best_match.get('name'),
                    'confidence': float(best_similarity)
                }
            else:
                result['person'] = None
            
            results.append(result)
        
        logger.info("face_recognition_completed", 
                   filename=file.filename, 
                   faces_processed=len(results),
                   threshold=threshold)
        
        return {
            'success': True,
            'filename': file.filename,
            'faces_processed': len(results),
            'threshold': threshold,
            'known_faces_count': len(known_faces),
            'faces': results,
            'recognition_stats': {
                'total_faces': len(results),
                'recognized_faces': len([r for r in results if r['is_recognized']]),
                'unknown_faces': len([r for r in results if not r['is_recognized']]),
                'average_similarity': np.mean([r['similarity'] for r in results]) if results else 0.0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("face_recognition_error", error=str(e), filename=file.filename)
        raise HTTPException(
            status_code=500,
            detail=f"Face recognition failed: {str(e)}"
        )


@router.post("/compare")
async def compare_faces(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    threshold: float = Form(0.6)
):
    """
    Compare faces between two images
    
    Args:
        file1: First image file
        file2: Second image file
        threshold: Comparison threshold
        
    Returns:
        JSON response with face comparison results
    """
    try:
        # Validate file types
        if not (file1.content_type.startswith('image/') and file2.content_type.startswith('image/')):
            raise HTTPException(
                status_code=400,
                detail="Both files must be images"
            )
        
        # Decode images
        image1 = decode_image_from_upload(file1)
        image2 = decode_image_from_upload(file2)
        
        if image1 is None or image2 is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to decode one or both images"
            )
        
        # Detect faces in both images
        faces1 = face_detector.detect_faces(image1)
        faces2 = face_detector.detect_faces(image2)
        
        if not faces1 or not faces2:
            return {
                'success': True,
                'message': 'No faces detected in one or both images',
                'faces_in_image1': len(faces1),
                'faces_in_image2': len(faces2),
                'comparisons': []
            }
        
        # Generate embeddings for all faces
        embeddings1 = []
        for face_data in faces1:
            face_image = face_detector.extract_face(image1, face_data['bbox'])
            if face_image is not None:
                embedding = face_encoder.generate_embedding(face_image)
                if embedding is not None:
                    embeddings1.append({
                        'bbox': face_data['bbox'],
                        'embedding': embedding,
                        'confidence': face_data['confidence']
                    })
        
        embeddings2 = []
        for face_data in faces2:
            face_image = face_detector.extract_face(image2, face_data['bbox'])
            if face_image is not None:
                embedding = face_encoder.generate_embedding(face_image)
                if embedding is not None:
                    embeddings2.append({
                        'bbox': face_data['bbox'],
                        'embedding': embedding,
                        'confidence': face_data['confidence']
                    })
        
        # Compare all face pairs
        comparisons = []
        for i, face1 in enumerate(embeddings1):
            for j, face2 in enumerate(embeddings2):
                similarity = face_encoder.compare_embeddings(face1['embedding'], face2['embedding'])
                is_match = similarity >= threshold
                
                comparison = {
                    'face1_index': i,
                    'face2_index': j,
                    'face1_bbox': face1['bbox'],
                    'face2_bbox': face2['bbox'],
                    'similarity': float(similarity),
                    'is_match': is_match,
                    'threshold': threshold
                }
                comparisons.append(comparison)
        
        # Find best match
        best_match = None
        if comparisons:
            best_match = max(comparisons, key=lambda x: x['similarity'])
        
        logger.info("face_comparison_completed", 
                   filename1=file1.filename,
                   filename2=file2.filename,
                   comparisons_made=len(comparisons))
        
        return {
            'success': True,
            'filename1': file1.filename,
            'filename2': file2.filename,
            'faces_in_image1': len(embeddings1),
            'faces_in_image2': len(embeddings2),
            'comparisons_made': len(comparisons),
            'threshold': threshold,
            'best_match': best_match,
            'all_comparisons': comparisons
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("face_comparison_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Face comparison failed: {str(e)}"
        )


@router.post("/create_embedding")
async def create_face_embedding(
    file: UploadFile = File(...),
    person_id: str = Form(...),
    person_name: str = Form("")
):
    """
    Create face embedding for a person
    
    Args:
        file: Image file containing the face
        person_id: Unique identifier for the person
        person_name: Name of the person (optional)
        
    Returns:
        JSON response with face embedding
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
        faces = face_detector.detect_faces(image)
        
        if not faces:
            return {
                'success': False,
                'message': 'No faces detected in the image',
                'person_id': person_id,
                'person_name': person_name
            }
        
        # Use the largest/best quality face
        best_face = max(faces, key=lambda x: x.get('quality_score', 0.5))
        
        # Extract face
        face_image = face_detector.extract_face(image, best_face['bbox'])
        if face_image is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to extract face"
            )
        
        # Generate embedding
        embedding = face_encoder.generate_embedding(face_image)
        if embedding is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate face embedding"
            )
        
        logger.info("face_embedding_created", 
                   person_id=person_id,
                   person_name=person_name,
                   filename=file.filename)
        
        return {
            'success': True,
            'person_id': person_id,
            'person_name': person_name,
            'filename': file.filename,
            'face_detected': {
                'bbox': best_face['bbox'],
                'confidence': best_face['confidence'],
                'quality_score': best_face.get('quality_score', 0.5)
            },
            'embedding': embedding.tolist(),
            'embedding_dimension': len(embedding)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("embedding_creation_error", error=str(e), person_id=person_id)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create face embedding: {str(e)}"
        )


@router.get("/encoder_info")
async def get_encoder_info():
    """Get information about the face encoder"""
    try:
        return {
            'success': True,
            'encoder': face_encoder.get_encoder_info(),
            'detector': face_detector.get_detector_info()
        }
    except Exception as e:
        logger.error("encoder_info_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get encoder info: {str(e)}"
        )


@router.post("/test")
async def test_recognition():
    """
    Test endpoint for face recognition
    Creates simple test embeddings and tests recognition
    """
    try:
        # Create test embeddings (simulated)
        test_embedding1 = np.random.rand(512)
        test_embedding1 = test_embedding1 / np.linalg.norm(test_embedding1)
        
        test_embedding2 = np.random.rand(512)
        test_embedding2 = test_embedding2 / np.linalg.norm(test_embedding2)
        
        # Compare embeddings
        similarity = face_encoder.compare_embeddings(test_embedding1, test_embedding2)
        
        # Create a similar embedding for testing
        similar_embedding = test_embedding1 + np.random.rand(512) * 0.1
        similar_embedding = similar_embedding / np.linalg.norm(similar_embedding)
        
        similar_similarity = face_encoder.compare_embeddings(test_embedding1, similar_embedding)
        
        return {
            'success': True,
            'test_results': {
                'embedding_dimension': len(test_embedding1),
                'random_similarity': float(similarity),
                'similar_embedding_similarity': float(similar_similarity),
                'encoder_info': face_encoder.get_encoder_info()
            },
            'test_known_faces': [
                {
                    'id': 'test_person_1',
                    'name': 'Test Person 1',
                    'embedding': test_embedding1.tolist()
                },
                {
                    'id': 'test_person_2', 
                    'name': 'Test Person 2',
                    'embedding': similar_embedding.tolist()
                }
            ]
        }
        
    except Exception as e:
        logger.error("test_recognition_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Test recognition failed: {str(e)}"
        )
