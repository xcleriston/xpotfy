'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Clock, Users, BarChart3, Menu, X, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  // Auto-detect theme based on time (dark after 19h until 6h)
  useEffect(() => {
    const hour = new Date().getHours()
    const shouldBeDark = hour >= 19 || hour < 6
    setIsDarkMode(shouldBeDark)
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const markets = [
    {
      id: 1,
      title: "Bolsonaro será eleito em 2026?",
      description: "Mercado sobre as eleições presidenciais brasileiras",
      category: "Política",
      image: "https://images.unsplash.com/photo-1577805296214-d05f4a5c2e0c?w=400",
      endDate: "2026-10-31",
      totalVolume: 1500000,
      outcomes: [
        { title: "Sim", probability: 45, volume: 675000 },
        { title: "Não", probability: 55, volume: 825000 }
      ]
    },
    {
      id: 2,
      title: "Bitcoin ultrapassará $100k em 2024?",
      description: "Previsão sobre o preço do Bitcoin",
      category: "Crypto",
      image: "https://images.unsplash.com/photo-1621504450181-5d356f61d737?w=400",
      endDate: "2024-12-31",
      totalVolume: 2300000,
      outcomes: [
        { title: "Sim", probability: 62, volume: 1426000 },
        { title: "Não", probability: 38, volume: 874000 }
      ]
    },
    {
      id: 3,
      title: "Palmeiras vencerá o Brasileirão 2024?",
      description: "Campeonato Brasileiro de Futebol",
      category: "Esportes",
      image: "https://images.unsplash.com/photo-1577805296214-d05f4a5c2e0c?w=400",
      endDate: "2024-12-15",
      totalVolume: 890000,
      outcomes: [
        { title: "Sim", probability: 48, volume: 427200 },
        { title: "Não", probability: 52, volume: 462800 }
      ]
    },
    {
      id: 4,
      title: "Brasil crescerá mais de 3% em 2024?",
      description: "Projeção de crescimento econômico do Brasil",
      category: "Economia",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400",
      endDate: "2024-12-31",
      totalVolume: 1200000,
      outcomes: [
        { title: "Sim", probability: 35, volume: 420000 },
        { title: "Não", probability: 65, volume: 780000 }
      ]
    }
  ]

  const categories = ["Todos", "Política", "Esportes", "Crypto", "Economia", "Entretenimento"]

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-md border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">Prediz.tech</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/markets" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Mercados
              </Link>
              <Link href="/portfolio" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Portfolio
              </Link>
              <Link href="/leaderboard" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Ranking
              </Link>
              <Link href="/about" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Sobre
              </Link>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Buscar mercados..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-prediz-500`}
                  />
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:opacity-80 transition-opacity`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Connect Wallet Button */}
              <button className="btn-primary">
                Conectar Carteira
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`md:hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}
          >
            <div className="px-4 py-4 space-y-4">
              <Link href="/markets" className={`block ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Mercados
              </Link>
              <Link href="/portfolio" className={`block ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Portfolio
              </Link>
              <Link href="/leaderboard" className={`block ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Ranking
              </Link>
              <Link href="/about" className={`block ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
                Sobre
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <button className="btn-primary w-full">
                  Conectar Carteira
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className={`relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 font-heading ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Ganhe Dinheiro
              <span className="gradient-text"> Prevendo</span> Eventos
            </h1>
            <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              A maior plataforma de mercados de previsão do Brasil. Política, esportes, crypto e mais.
              Aposte em eventos do mundo real e ganhe dinheiro com suas previsões.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8 py-4">
                Começar Agora
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                Como Funciona
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="text-3xl font-bold gradient-text mb-2">$10M+</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Volume Total</div>
            </div>
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="text-3xl font-bold gradient-text mb-2">50K+</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Usuários Ativos</div>
            </div>
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="text-3xl font-bold gradient-text mb-2">1000+</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mercados</div>
            </div>
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="text-3xl font-bold gradient-text mb-2">98%</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pagamentos</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Markets Section */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 font-heading ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Mercados em
              <span className="gradient-text"> Destaque</span>
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Aposte nos eventos mais populares do momento
            </p>
          </motion.div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full ${
                  category === "Todos"
                    ? "gradient-bg text-white"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } transition-colors`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Markets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMarkets.map((market, index) => (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`market-card ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
              >
                {/* Market Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={market.image}
                    alt={market.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-prediz-600 text-white text-sm rounded-full">
                      {market.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-900 text-sm rounded-full flex items-center`}>
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(market.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Market Content */}
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {market.title}
                  </h3>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {market.description}
                  </p>

                  {/* Outcomes */}
                  <div className="space-y-3">
                    {market.outcomes.map((outcome, outcomeIndex) => (
                      <div key={outcomeIndex} className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {outcome.title}
                        </span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <div className={`w-32 h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                              <div
                                className="h-full gradient-bg"
                                style={{ width: `${outcome.probability}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {outcome.probability}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Volume */}
                  <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} flex items-center justify-between`}>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Volume
                    </span>
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      R$ {market.totalVolume.toLocaleString('pt-BR')}
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
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">Prediz.tech</span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                A maior plataforma de mercados de previsão do Brasil
              </p>
            </div>
            
            <div>
              <h4 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Plataforma</h4>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><Link href="/markets" className="hover:text-prediz-500 transition-colors">Mercados</Link></li>
                <li><Link href="/portfolio" className="hover:text-prediz-500 transition-colors">Portfolio</Link></li>
                <li><Link href="/leaderboard" className="hover:text-prediz-500 transition-colors">Ranking</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recursos</h4>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><Link href="/how-it-works" className="hover:text-prediz-500 transition-colors">Como Funciona</Link></li>
                <li><Link href="/faq" className="hover:text-prediz-500 transition-colors">FAQ</Link></li>
                <li><Link href="/api" className="hover:text-prediz-500 transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Legal</h4>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><Link href="/terms" className="hover:text-prediz-500 transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacy" className="hover:text-prediz-500 transition-colors">Privacidade</Link></li>
                <li><Link href="/responsible" className="hover:text-prediz-500 transition-colors">Jogo Responsável</Link></li>
              </ul>
            </div>
          </div>
          
          <div className={`mt-8 pt-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>&copy; 2024 Prediz.tech. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
