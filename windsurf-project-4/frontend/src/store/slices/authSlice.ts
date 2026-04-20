import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, AuthTokens, LoginCredentials, RegisterData } from '../../types'
import { authAPI } from '../../services/authAPI'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      localStorage.setItem('tokens', JSON.stringify(response))
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Registration failed')
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser()
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to get user')
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState }
      const refresh_token = state.auth.tokens?.refresh_token
      
      if (!refresh_token) {
        throw new Error('No refresh token available')
      }
      
      const response = await authAPI.refreshToken(refresh_token)
      localStorage.setItem('tokens', JSON.stringify(response))
      return response
    } catch (error: any) {
      localStorage.removeItem('tokens')
      return rejectWithValue(error.response?.data?.detail || 'Token refresh failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout()
      localStorage.removeItem('tokens')
    } catch (error: any) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('tokens')
      return rejectWithValue(error.response?.data?.detail || 'Logout failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload
      state.isAuthenticated = true
    },
    clearAuth: (state) => {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.error = null
    },
    initializeAuth: (state) => {
      const tokens = localStorage.getItem('tokens')
      if (tokens) {
        try {
          const parsedTokens = JSON.parse(tokens) as AuthTokens
          state.tokens = parsedTokens
          state.isAuthenticated = true
        } catch (error) {
          localStorage.removeItem('tokens')
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.tokens = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        state.tokens = null
      })

    // Refresh token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.tokens = action.payload
        state.isAuthenticated = true
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
      })

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError, setTokens, clearAuth, initializeAuth } = authSlice.actions
export default authSlice.reducer
