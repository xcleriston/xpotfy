import axios, { AxiosResponse } from 'axios'
import { Photo, PhotoStats, PaginatedResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class PhotosAPI {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  constructor() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const tokens = localStorage.getItem('tokens')
        if (tokens) {
          const { access_token } = JSON.parse(tokens)
          config.headers.Authorization = `Bearer ${access_token}`
        }
        return config
      }
    )
  }

  async getPhotos(params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
  }): Promise<PaginatedResponse<Photo>> {
    const response: AxiosResponse<PaginatedResponse<Photo>> = await this.api.get(
      '/api/v1/photos',
      { params }
    )
    return response.data
  }

  async getPhotoById(photoId: string): Promise<Photo> {
    const response: AxiosResponse<Photo> = await this.api.get(
      `/api/v1/photos/${photoId}`
    )
    return response.data
  }

  async deletePhoto(photoId: string): Promise<void> {
    await this.api.delete(`/api/v1/photos/${photoId}`)
  }

  async getPhotoStats(): Promise<PhotoStats> {
    const response: AxiosResponse<PhotoStats> = await this.api.get(
      '/api/v1/photos/stats'
    )
    return response.data
  }

  async uploadPhoto(file: File): Promise<Photo> {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse<Photo> = await this.api.post(
      '/api/v1/photos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }
}

export const photosAPI = new PhotosAPI()
