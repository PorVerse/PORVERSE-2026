'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Filter,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Compass,
  TrendingUp,
  Award,
  Lock,
  Unlock,
} from 'lucide-react'
import Link from 'next/link'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    title: 'Explorează Portaluri',
    subtitle: 'Descoperă portaluri quantum și începe călătoria ta',
    search: 'Caută portaluri...',
    allCategories: 'Toate categoriile',
    found: 'Găsite',
    portals: 'portale',
    noPortals: 'Niciun portal găsit',
    tryAgain: 'Încearcă alt termen de căutare',
    clearFilters: 'Șterge filtrele',
    loading: 'Se încarcă portaluri...',
    error: 'Eroare la încărcare',
    retry: 'Încearcă din nou',
    difficulty: 'Dificultate',
    time: 'min',
    xp: 'XP',
    locked: 'Blocat',
    unlocked: 'Deblocat',
    start: 'Începe',
    continue: 'Continuă',
  },
  en: {
    title: 'Explore Portals',
    subtitle: 'Discover quantum portals and begin your journey',
    search: 'Search portals...',
    allCategories: 'All categories',
    found: 'Found',
    portals: 'portals',
    noPortals: 'No portals found',
    tryAgain: 'Try a different search term',
    clearFilters: 'Clear filters',
    loading: 'Loading portals...',
    error: 'Error loading portals',
    retry: 'Try again',
    difficulty: 'Difficulty',
    time: 'min',
    xp: 'XP',
    locked: 'Locked',
    unlocked: 'Unlocked',
    start: 'Start',
    continue: 'Continue',
  },
} as const

const safeLang = (x: string): Lang => (x === 'ro' ? 'ro' : 'en')

interface Portal {
  id: string
  code: string
  name: string
  description: string
  category: string
  difficulty: number
  estimated_time: number
  experience_points: number
  is_locked: boolean
  icon?: string
  gradient?: string
}

export default function MegaInterstellarPortalsPage({ params }: { params: { lang: string } }) {
  const lang = safeLang(params.lang)
  const t = COPY[lang]
  const router = useRouter()
  const supabase = createClient()

  const [portals, setPortals] = useState<Portal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number }>>([])

  // Generate particles
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  // Fetch portals
  useEffect(() => {
    fetchPortals()
  }, [])

  const fetchPortals = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('portals')
        .select('*')
        .order('difficulty', { ascending: true })

      if (fetchError) throw fetchError

      setPortals(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching portals:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtered portals
  const filteredPortals = useMemo(() => {
    let filtered = [...portals]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [portals, selectedCategory, searchTerm])

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(portals.map((p) => p.category))
    return ['all', ...Array.from(cats)]
  }, [portals])

  // Difficulty color
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 1) return 'from-green-500 to-emerald-500'
    if (difficulty <= 2) return 'from-blue-500 to-cyan-500'
    if (difficulty <= 3) return 'from-yellow-500 to-orange-500'
    if (difficulty <= 4) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-pink-500'
  }

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 1) return { text: 'Beginner', emoji: '🌱' }
    if (difficulty <= 2) return { text: 'Easy', emoji: '⭐' }
    if (difficulty <= 3) return { text: 'Medium', emoji: '🔥' }
    if (difficulty <= 4) return { text: 'Hard', emoji: '⚡' }
    return { text: 'Expert', emoji: '💎' }
  }

  // Loading state
  if (loading && portals.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/50">
            <Sparkles className="w-10 h-10 text-white animate-spin" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">{t.loading}</div>
          <div className="text-purple-300">🌌 Preparing quantum portals...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && portals.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full backdrop-blur-xl bg-red-900/20 border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-red-500/20">
          <div className="flex items-center gap-3 text-red-300 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-2xl font-bold">{t.error}</h2>
          </div>
          <p className="text-red-200 mb-6">{error.message}</p>
          <button
            onClick={fetchPortals}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl font-semibold text-white hover:from-red-600 hover:to-pink-600 transition-all shadow-lg shadow-red-500/50"
          >
            <RefreshCw className="w-5 h-5" />
            {t.retry}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* MEGA INTERSTELLAR BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 top-1/3 right-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-96 h-96 -bottom-48 left-1/3 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating stars */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-pulse">
            🌌 {t.title}
          </h1>
          <p className="text-2xl text-purple-300">{t.subtitle}</p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 group-hover:text-pink-400 transition-colors" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-xl text-white placeholder:text-purple-400/50 focus:outline-none focus:border-purple-400 focus:shadow-2xl focus:shadow-purple-500/30 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="relative md:w-64 group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none group-hover:text-pink-400 transition-colors" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-4 py-4 backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:shadow-2xl focus:shadow-purple-500/30 transition-all appearance-none cursor-pointer capitalize"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize bg-black">
                  {cat === 'all' ? t.allCategories : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        {(searchTerm.trim() || selectedCategory !== 'all') && (
          <div className="mb-6 text-purple-300 text-lg">
            ✨ {t.found} <span className="text-purple-200 font-bold">{filteredPortals.length}</span> {t.portals}
          </div>
        )}

        {/* Portal Grid */}
        {filteredPortals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortals.map((portal, index) => {
              const diffInfo = getDifficultyText(portal.difficulty)
              return (
                <div
                  key={portal.id}
                  className="backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/40 transition-all group cursor-pointer transform hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => router.push(`/${lang}/portals/${portal.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors mb-1">
                        {portal.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getDifficultyColor(portal.difficulty)} text-white shadow-lg`}>
                          {diffInfo.emoji} {diffInfo.text}
                        </span>
                      </div>
                    </div>
                    {portal.is_locked ? (
                      <Lock className="w-6 h-6 text-red-400" />
                    ) : (
                      <Unlock className="w-6 h-6 text-green-400" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-purple-200 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {portal.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-purple-300">
                      <TrendingUp className="w-4 h-4" />
                      {portal.estimated_time} {t.time}
                    </div>
                    <div className="flex items-center gap-1 text-purple-300">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {portal.experience_points} {t.xp}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                      📂 {portal.category}
                    </span>
                  </div>

                  {/* Action button */}
                  <button
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all shadow-lg group-hover:shadow-xl ${
                      portal.is_locked
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-purple-500/50'
                    }`}
                    disabled={portal.is_locked}
                  >
                    {portal.is_locked ? (
                      <>
                        <Lock className="w-5 h-5" />
                        {t.locked}
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        {t.start}
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center backdrop-blur">
              <Compass className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">🌠 {t.noPortals}</h3>
            <p className="text-purple-300 mb-6">{t.tryAgain}</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              {t.clearFilters}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite;
        }
      `}</style>
    </div>
  )
}
