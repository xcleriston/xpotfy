"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create photos table
    op.create_table('photos',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('format', sa.String(length=10), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('thumbnail_key', sa.String(length=500), nullable=True),
        sa.Column('taken_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('gps_lat', postgresql.NUMERIC(precision=10, scale=8), nullable=True),
        sa.Column('gps_lng', postgresql.NUMERIC(precision=11, scale=8), nullable=True),
        sa.Column('camera_make', sa.String(length=100), nullable=True),
        sa.Column('camera_model', sa.String(length=100), nullable=True),
        sa.Column('lens_model', sa.String(length=100), nullable=True),
        sa.Column('iso', sa.Integer(), nullable=True),
        sa.Column('aperture', sa.String(length=10), nullable=True),
        sa.Column('shutter_speed', sa.String(length=20), nullable=True),
        sa.Column('focal_length', sa.String(length=10), nullable=True),
        sa.Column('processing_status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='processingstatus'), nullable=False),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_photos_user_id'), 'photos', ['user_id'], unique=False)
    
    # Create persons table
    op.create_table('persons',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('avatar_photo_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_confirmed', sa.Boolean(), nullable=False),
        sa.Column('face_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['avatar_photo_id'], ['photos.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_persons_user_id'), 'persons', ['user_id'], unique=False)
    
    # Create faces table
    op.create_table('faces',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('photo_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('person_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('bbox_x', sa.Integer(), nullable=False),
        sa.Column('bbox_y', sa.Integer(), nullable=False),
        sa.Column('bbox_width', sa.Integer(), nullable=False),
        sa.Column('bbox_height', sa.Integer(), nullable=False),
        sa.Column('face_encoding', postgresql.VECTOR(512), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['person_id'], ['persons.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['photo_id'], ['photos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faces_photo_id'), 'faces', ['photo_id'], unique=False)
    op.create_index(op.f('ix_faces_person_id'), 'faces', ['person_id'], unique=False)
    
    # Create processing_jobs table
    op.create_table('processing_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('photo_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_type', sa.Enum('FACE_DETECTION', 'FACE_RECOGNITION', 'THUMBNAIL_GENERATION', 'PHOTO_PROCESSING', name='jobtype'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', name='jobstatus'), nullable=False),
        sa.Column('task_id', sa.String(length=255), nullable=True),
        sa.Column('progress', sa.String(length=50), nullable=True),
        sa.Column('result_data', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['photo_id'], ['photos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_processing_jobs_photo_id'), 'processing_jobs', ['photo_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_processing_jobs_photo_id'), table_name='processing_jobs')
    op.drop_table('processing_jobs')
    op.drop_index(op.f('ix_faces_person_id'), table_name='faces')
    op.drop_index(op.f('ix_faces_photo_id'), table_name='faces')
    op.drop_table('faces')
    op.drop_index(op.f('ix_persons_user_id'), table_name='persons')
    op.drop_table('persons')
    op.drop_index(op.f('ix_photos_user_id'), table_name='photos')
    op.drop_table('photos')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
