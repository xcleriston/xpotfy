import React from 'react'

const PhotosPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Minhas Fotos
          </h1>
          <p className="mt-2 text-gray-600">
            Visualize e organize suas fotos
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma foto ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Comece fazendo upload de suas fotos para usar o reconhecimento facial
            </p>
            <button className="btn-primary">
              Fazer Upload de Fotos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotosPage
