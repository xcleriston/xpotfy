// Common types for the application

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  photo_count: number;
  person_count: number;
}

export interface Photo {
  id: string;
  user_id: string;
  filename: string;
  original_filename?: string;
  file_size: number;
  width: number;
  height: number;
  format: string;
  s3_key: string;
  thumbnail_key?: string;
  taken_at?: string;
  gps_lat?: number;
  gps_lng?: number;
  camera_make?: string;
  camera_model?: string;
  lens_model?: string;
  iso?: number;
  aperture?: string;
  shutter_speed?: string;
  focal_length?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  face_count: number;
  file_size_mb: number;
  aspect_ratio: number;
  has_gps: boolean;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  avatar_photo_id?: string;
  is_confirmed: boolean;
  face_count: number;
  created_at: string;
  updated_at: string;
  photo_count: number;
  confirmed_face_count: number;
}

export interface Face {
  id: string;
  photo_id: string;
  person_id?: string;
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  confidence: number;
  quality_score?: number;
  is_verified: boolean;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
  bbox_area: number;
  bbox_center_x: number;
  bbox_center_y: number;
  is_high_confidence: boolean;
  is_good_quality: boolean;
  bbox_dict: {
    x: number;
    y: number;
    width: number;
    height: number;
    center_x: number;
    center_y: number;
    area: number;
  };
}

export interface ProcessingJob {
  id: string;
  photo_id: string;
  job_type: 'face_detection' | 'face_recognition' | 'thumbnail_generation' | 'photo_processing';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  task_id?: string;
  progress?: string;
  result_data?: string;
  error_message?: string;
  error_details?: string;
  retry_count: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  is_running: boolean;
  is_completed: boolean;
  is_successful: boolean;
  has_failed: boolean;
  duration_seconds: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status_code: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PhotoStats {
  total_photos: number;
  total_faces: number;
  total_persons: number;
  storage_used_mb: number;
  processing_completed: number;
  processing_pending: number;
  processing_failed: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface NotificationType {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface ThemeConfig {
  primaryColor: string;
  mode: 'light' | 'dark';
  compactMode: boolean;
}
