'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, TrendingUp, Clock, Users } from 'lucide-react'

interface Market {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  end_date: string
  status: 'active' | 'ended' | 'pending'
  total_volume: number
  outcomes: Array<{
    id: string
    title: string
    probability: number
    volume: number
  }>
}

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState('volume')

  const markets: Market[] = [
    {
      id: '1',
      title: "Bolsonaro será eleito em 2026?",
      description: "Mercado sobre as eleições presidenciais brasileiras",
      category: "Política",
      image_url: "https://images.unsplash.com/photo-1577805296214-d05f4a5c2e0c?w=400",
      end_date: "2026-10-31",
      status: "active",
      total_volume: 1500000,
      outcomes: [
        { id: '1-1', title: "Sim", probability: 45, volume: 675000 },
        { id: '1-2', title: "Não", probability: 55, volume: 825000 }
      ]
    },
    {
      id: '2',
      title: "Bitcoin ultrapassará $100k em 2024?",
      description: "Previsão sobre o preço do Bitcoin",
      category: "Crypto",
      image_url: "https://images.unsplash.com/photo-1621504450181-5d356f61d737?w=400",
      end_date: "2024-12-31",
      status: "active",
      total_volume: 2300000,
      outcomes: [
        { id: '2-1', title: "Sim", probability: 62, volume: 1426000 },
        { id: '2-2', title: "Não", probability: 38, volume: 874000 }
      ]
    },
    {
      id: '3',
      title: "Palmeiras vencerá o Brasileirão 2024?",
      description: "Campeonato Brasileiro de Futebol",
      category: "Esportes",
      image_url: "https://images.unsplash.com/photo-1577805296214-d05f4a5c2e0c?w=400",
      end_date: "2024-12-15",
      status: "active",
      total_volume: 890000,
      outcomes: [
        { id: '3-1', title: "Sim", probability: 48, volume: 427200 },
        { id: '3-2', title: "Não", probability: 52, volume: 462800 }
      ]
    },
    {
      id: '4',
      title: "Brasil crescerá mais de 3% em 2024?",
      description: "Projeção de crescimento econômico do Brasil",
      category: "Economia",
      image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400",
      end_date: "2024-12-31",
      status: "active",
      total_volume: 1200000,
      outcomes: [
        { id: '4-1', title: "Sim", probability: 35, volume: 420000 },
        { id: '4-2', title: "Não", probability: 65, volume: 780000 }
      ]
    },
    {
      id: '5',
      title: "Messi vencerá Bola de Ouro 2024?",
      description: "Prêmio de melhor jogador do mundo",
      category: "Esportes",
      image_url: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400",
      end_date: "2024-12-20",
      status: "active",
      total_volume: 750000,
      outcomes: [
        { id: '5-1', title: "Sim", probability: 58, volume: 435000 },
        { id: '5-2', title: "Não", probability: 42, volume: 315000 }
      ]
    },
    {
      id: '6',
      title: "Tesla alcançará market cap de $1T?",
      description: "Valorização da empresa de Elon Musk",
      category: "Economia",
      image_url: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=400",
      end_date: "2024-12-31",
      status: "active",
      total_volume: 980000,
      outcomes: [
        { id: '6-1', title: "Sim", probability: 41, volume: 401800 },
        { id: '6-2', title: "Não", probability: 59, volume: 578200 }
      ]
    }
  ]

  const categories = ["Todos", "Política", "Esportes", "Crypto", "Economia", "Entretenimento"]
  const sortOptions = [
    { value: "volume", label: "Volume" },
    { value: "ending", label: "Término" },
    { value: "created", label: "Criado" },
    { value: "trending", label: "Popular" }
  ]

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "Todos" || market.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.total_volume - a.total_volume
      case 'ending':
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      case 'trending':
        return b.total_volume - a.total_volume // Simplified - would use actual trending data
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mercados</h1>
              <p className="text-gray-600 mt-1">Aposte em eventos do mundo real</p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar mercados..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-prediz-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-prediz-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "gradient-bg text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedMarkets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="market-card bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Market Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={market.image_url}
                  alt={market.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-prediz-600 text-white text-sm rounded-full">
                    {market.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-sm rounded-full flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(market.end_date).toLocaleDateString('pt-BR', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>

              {/* Market Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-900 line-clamp-2">
                  {market.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {market.description}
                </p>

                {/* Outcomes */}
                <div className="space-y-3">
                  {market.outcomes.map(outcome => (
                    <div key={outcome.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {outcome.title}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-bg"
                              style={{ width: `${outcome.probability}%` }}
                            ></div>
                          </div>
                          <span className="text-xs ml-2 text-gray-600">
                            {outcome.probability}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Volume */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Volume
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    R$ {market.total_volume.toLocaleString('pt-BR')}
                  </span>
                </div>

                {/* Action Button */}
                <button className="w-full btn-primary mt-4">
                  Apostar Agora
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {sortedMarkets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum mercado encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
