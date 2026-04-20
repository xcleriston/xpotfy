import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { User, AuthTokens, LoginCredentials, RegisterData } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class AuthAPI {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const tokens = localStorage.getItem('tokens')
        if (tokens) {
          const { access_token } = JSON.parse(tokens) as AuthTokens
          config.headers.Authorization = `Bearer ${access_token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const tokens = localStorage.getItem('tokens')
            if (tokens) {
              const { refresh_token } = JSON.parse(tokens) as AuthTokens
              const response = await this.refreshToken(refresh_token)
              localStorage.setItem('tokens', JSON.stringify(response))
              
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.access_token}`
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('tokens')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response: AxiosResponse<AuthTokens> = await this.api.post(
      '/api/v1/auth/login',
      credentials
    )
    return response.data
  }

  async register(userData: RegisterData): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post(
      '/api/v1/auth/register',
      userData
    )
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(
      '/api/v1/auth/me'
    )
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response: AxiosResponse<AuthTokens> = await this.api.post(
      '/api/v1/auth/refresh',
      { refresh_token: refreshToken }
    )
    return response.data
  }

  async logout(): Promise<void> {
    await this.api.post('/api/v1/auth/logout')
  }
}

export const authAPI = new AuthAPI()
