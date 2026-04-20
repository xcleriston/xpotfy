import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Photo, PhotoStats, PaginatedResponse } from '../../types'
import { photosAPI } from '../../services/photosAPI'

interface PhotosState {
  photos: Photo[]
  currentPhoto: Photo | null
  stats: PhotoStats | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const initialState: PhotosState = {
  photos: [],
  currentPhoto: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
}

// Async thunks
export const fetchPhotos = createAsyncThunk(
  'photos/fetchPhotos',
  async (params: { page?: number; pageSize?: number; search?: string; status?: string }, { rejectWithValue }) => {
    try {
      const response = await photosAPI.getPhotos(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch photos')
    }
  }
)

export const fetchPhotoById = createAsyncThunk(
  'photos/fetchPhotoById',
  async (photoId: string, { rejectWithValue }) => {
    try {
      const response = await photosAPI.getPhotoById(photoId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch photo')
    }
  }
)

export const deletePhoto = createAsyncThunk(
  'photos/deletePhoto',
  async (photoId: string, { rejectWithValue }) => {
    try {
      await photosAPI.deletePhoto(photoId)
      return photoId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete photo')
    }
  }
)

export const fetchPhotoStats = createAsyncThunk(
  'photos/fetchPhotoStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await photosAPI.getPhotoStats()
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch photo stats')
    }
  }
)

export const uploadPhoto = createAsyncThunk(
  'photos/uploadPhoto',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await photosAPI.uploadPhoto(file)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to upload photo')
    }
  }
)

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentPhoto: (state) => {
      state.currentPhoto = null
    },
    updatePhotoInList: (state, action: PayloadAction<Photo>) => {
      const index = state.photos.findIndex(photo => photo.id === action.payload.id)
      if (index !== -1) {
        state.photos[index] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch photos
    builder
      .addCase(fetchPhotos.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPhotos.fulfilled, (state, action) => {
        state.isLoading = false
        state.photos = action.payload.items
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.page_size,
          total: action.payload.total,
          hasNext: action.payload.has_next,
          hasPrev: action.payload.has_prev,
        }
      })
      .addCase(fetchPhotos.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Fetch photo by ID
    builder
      .addCase(fetchPhotoById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPhotoById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPhoto = action.payload
      })
      .addCase(fetchPhotoById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Delete photo
    builder
      .addCase(deletePhoto.fulfilled, (state, action) => {
        state.photos = state.photos.filter(photo => photo.id !== action.payload)
        if (state.currentPhoto?.id === action.payload) {
          state.currentPhoto = null
        }
      })

    // Fetch photo stats
    builder
      .addCase(fetchPhotoStats.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchPhotoStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = action.payload
      })
      .addCase(fetchPhotoStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Upload photo
    builder
      .addCase(uploadPhoto.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        state.isLoading = false
        state.photos.unshift(action.payload)
      })
      .addCase(uploadPhoto.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearCurrentPhoto, updatePhotoInList } = photosSlice.actions
export default photosSlice.reducer
