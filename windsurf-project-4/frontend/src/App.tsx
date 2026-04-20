import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { initializeAuth, getCurrentUser } from './store/slices/authSlice'
import { RootState, AppDispatch } from './store'

// Components
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PhotosPage from './pages/PhotosPage'
import UploadPage from './pages/UploadPage'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Initialize auth state from localStorage
    dispatch(initializeAuth())
  }, [dispatch])

  useEffect(() => {
    // Get current user if authenticated
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          } 
        />

        {/* Protected routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="photos" 
            element={
              <ProtectedRoute>
                <PhotosPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="upload" 
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App
