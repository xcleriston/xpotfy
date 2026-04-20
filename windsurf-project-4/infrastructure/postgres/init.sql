-- PostgreSQL Initialization Script for Face Recognition MVP
-- This script runs when the database container starts for the first time

-- Enable pgvector extension for face embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create additional indexes for performance optimization
-- These will be managed by Alembic migrations, but here for initial setup

-- Example indexes (will be created by migrations):
-- CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
-- CREATE INDEX IF NOT EXISTS idx_faces_photo_id ON faces(photo_id);
-- CREATE INDEX IF NOT EXISTS idx_faces_person_id ON faces(person_id);
-- CREATE INDEX IF NOT EXISTS idx_faces_encoding ON faces USING ivfflat (face_encoding vector_cosine_ops) WITH (lists = 100);

-- Set up database configuration
ALTER DATABASE face_recognition SET search_path TO public;

-- Create custom functions for distance calculations
CREATE OR REPLACE FUNCTION cosine_distance(vec1 vector, vec2 vector)
RETURNS float AS $$
BEGIN
    RETURN 1 - (vec1 <=> vec2);
END;
$$ LANGUAGE plpgsql;

-- Create function for face similarity search
CREATE OR REPLACE FUNCTION find_similar_faces(target_embedding vector, threshold float DEFAULT 0.6)
RETURNS TABLE(face_id uuid, photo_id uuid, similarity float) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.photo_id,
        (1 - (f.face_encoding <=> target_embedding)) as similarity
    FROM faces f
    WHERE (1 - (f.face_encoding <=> target_embedding)) > threshold
    ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Face Recognition database initialized successfully';
END $$;
