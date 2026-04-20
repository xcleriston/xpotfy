import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie suas fotos e organize-as com reconhecimento facial
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <div className="h-6 w-6 bg-primary-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Fotos</p>
                <p className="text-2xl font-semibold text-gray-900">{user?.photo_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <div className="h-6 w-6 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pessoas Identificadas</p>
                <p className="text-2xl font-semibold text-gray-900">{user?.person_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <div className="h-6 w-6 bg-yellow-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Faces Detectadas</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <div className="h-6 w-6 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Armazenamento</p>
                <p className="text-2xl font-semibold text-gray-900">0 MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button className="btn-primary w-full text-left">
                <span className="flex items-center">
                  <div className="h-5 w-5 bg-white rounded mr-3"></div>
                  Upload de Fotos
                </span>
              </button>
              <button className="btn-secondary w-full text-left">
                <span className="flex items-center">
                  <div className="h-5 w-5 bg-gray-600 rounded mr-3"></div>
                  Ver Todas as Fotos
                </span>
              </button>
              <button className="btn-secondary w-full text-left">
                <span className="flex items-center">
                  <div className="h-5 w-5 bg-gray-600 rounded-full mr-3"></div>
                  Gerenciar Pessoas
                </span>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Nenhuma atividade recente
                  </p>
                  <p className="text-sm text-gray-500">
                    Comece fazendo upload de suas fotos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
