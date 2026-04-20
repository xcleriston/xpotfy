import React from 'react'

const UploadPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Upload de Fotos
          </h1>
          <p className="mt-2 text-gray-600">
            Adicione suas fotos para processamento de reconhecimento facial
          </p>
        </div>

        <div className="card">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arraste e solte suas fotos aqui
            </h3>
            <p className="text-gray-600 mb-6">
              ou clique para selecionar arquivos
            </p>
            <button className="btn-primary">
              Selecionar Fotos
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Formatos suportados: JPG, PNG, WebP (máximo 50MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
