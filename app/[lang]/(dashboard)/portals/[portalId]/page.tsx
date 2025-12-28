'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Play,
  Lock,
  Unlock,
  Star,
  TrendingUp,
  Award,
  CheckCircle2,
  Circle,
  Zap,
  Sparkles,
  ChevronRight,
  Clock,
  Target,
} from 'lucide-react'
import Link from 'next/link'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    back: 'Înapoi la portale',
    difficulty: 'Dificultate',
    estimatedTime: 'Timp estimat',
    totalXP: 'Total XP',
    steps: 'Pași',
    yourProgress: 'Progresul tău',
    notStarted: 'Nu ai început încă acest portal',
    startJourney: 'Începe călătoria',
    continueJourney: 'Continuă călătoria',
    completed: 'Completat',
    current: 'Curent',
    locked: 'Blocat',
    unlocked: 'Deblocat',
    loading: 'Se încarcă...',
    min: 'min',
    step: 'Pas',
    complete: 'Complet',
  },
  en: {
    back: 'Back to portals',
    difficulty: 'Difficulty',
    estimatedTime: 'Estimated time',
    totalXP: 'Total XP',
    steps: 'Steps',
    yourProgress: 'Your progress',
    notStarted: 'You haven't started this portal yet',
    startJourney: 'Start journey',
    continueJourney: 'Continue journey',
    completed: 'Completed',
    current: 'Current',
    locked: 'Locked',
    unlocked: 'Unlocked',
    loading: 'Loading...',
    min: 'min',
    step: 'Step',
    complete: 'Complete',
  },
} as const

const safeLang = (x: string): Lang => (x === 'ro' ? 'ro' : 'en')

interface PortalStep {
  id: string
  step_number: number
  name: string
  description: string
  estimated_time: number
  experience_points: number
  is_locked: boolean
}

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
  steps?: PortalStep[]
}

interface UserProgress {
  current_step: number
  completed_steps: string[]
  completed_at?: string
}

export default function MegaInterstellarPortalDetailPage({
  params,
}: {
  params: { lang: string; portalId: string }
}) {
  const lang = safeLang(params.lang)
  const t = COPY[lang]
  const router = useRouter()
  const supabase = createClient()

  const [portal, setPortal] = useState<Portal | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number }>>([])

  // Generate particles
  useEffect(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  // Fetch portal and progress
  useEffect(() => {
    fetchPortalData()
  }, [params.portalId])

  const fetchPortalData = async () => {
    try {
      setLoading(true)

      // Fetch portal
      const { data: portalData, error: portalError } = await supabase
        .from('portals')
        .select('*, steps:portal_steps(*)')
        .eq('id', params.portalId)
        .single()

      if (portalError) throw portalError

      setPortal(portalData)

      // Fetch user progress
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: progressData } = await supabase
          .from('user_portal_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('portal_id', params.portalId)
          .single()

        setUserProgress(progressData)
      }
    } catch (err) {
      console.error('Error fetching portal:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPortal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !portal) return

    // Create progress entry
    await supabase.from('user_portal_progress').insert({
      user_id: user.id,
      portal_id: portal.id,
      current_step: 1,
      completed_steps: [],
    })

    // Navigate to first step
    router.push(`/${lang}/portals/${portal.id}/step/1`)
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/50">
            <Sparkles className="w-10 h-10 text-white animate-spin" />
          </div>
          <div className="text-2xl font-bold text-white">{t.loading}</div>
        </div>
      </div>
    )
  }

  if (!portal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Portal not found</div>
      </div>
    )
  }

  const diffInfo = getDifficultyText(portal.difficulty)
  const completedSteps = userProgress?.completed_steps || []
  const currentStep = userProgress?.current_step || 0
  const totalSteps = portal.steps?.length || 0
  const progressPercent = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* MEGA INTERSTELLAR BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 top-1/3 right-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-96 h-96 -bottom-48 left-1/3 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
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

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href={`/${lang}/portals`}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 backdrop-blur-xl bg-white/5 border border-purple-500/30 rounded-xl text-purple-300 hover:text-white hover:border-purple-400/50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.back}
        </Link>

        {/* Portal header */}
        <div className="mb-12 backdrop-blur-xl bg-gradient-to-br from-black/40 to-purple-900/20 border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                🌌 {portal.name}
              </h1>
              <p className="text-xl text-purple-200 leading-relaxed mb-6">
                {portal.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getDifficultyColor(portal.difficulty)} shadow-lg flex items-center gap-2`}>
                  <span className="text-lg">{diffInfo.emoji}</span>
                  <span className="font-semibold text-white">{diffInfo.text}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-2 text-purple-200">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">{portal.estimated_time} {t.min}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-2 text-purple-200">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">{portal.experience_points} XP</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-2 text-purple-200 capitalize">
                  <Target className="w-5 h-5" />
                  <span className="font-semibold">{portal.category}</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="md:w-64">
              {userProgress ? (
                <button
                  onClick={() => router.push(`/${lang}/portals/${portal.id}/step/${currentStep}`)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white text-lg hover:from-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
                >
                  <Zap className="w-6 h-6" />
                  {t.continueJourney}
                </button>
              ) : (
                <button
                  onClick={handleStartPortal}
                  disabled={portal.is_locked}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    portal.is_locked
                      ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/50'
                  }`}
                >
                  {portal.is_locked ? (
                    <>
                      <Lock className="w-6 h-6" />
                      {t.locked}
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      {t.startJourney}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          {userProgress && (
            <div className="mt-8 pt-8 border-t border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">📊 {t.yourProgress}</h3>
                <span className="text-purple-300 font-bold">
                  {Math.round(progressPercent)}% {t.complete}
                </span>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-purple-500/30">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all shadow-lg shadow-purple-500/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-black/40 to-purple-900/20 border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            {t.steps} ({totalSteps})
          </h2>

          <div className="space-y-4">
            {portal.steps?.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = step.step_number === currentStep
              const isLocked = step.is_locked && !isCompleted && !isCurrent

              return (
                <div
                  key={step.id}
                  className={`backdrop-blur-xl rounded-2xl p-6 border transition-all ${
                    isCompleted
                      ? 'bg-green-500/10 border-green-500/30'
                      : isCurrent
                      ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/30'
                      : isLocked
                      ? 'bg-gray-500/10 border-gray-500/20 opacity-60'
                      : 'bg-white/5 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : isCurrent
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse'
                        : isLocked
                        ? 'bg-gray-500/30'
                        : 'bg-purple-500/20'
                    } shadow-lg`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : isLocked ? (
                        <Lock className="w-6 h-6 text-gray-400" />
                      ) : isCurrent ? (
                        <Zap className="w-6 h-6 text-white" />
                      ) : (
                        <Circle className="w-6 h-6 text-purple-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-xs text-purple-400 font-semibold mb-1">
                            {t.step} {step.step_number}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1">{step.name}</h3>
                        </div>
                        {isCurrent && (
                          <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold animate-pulse shadow-lg shadow-purple-500/50">
                            {t.current}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                            ✓ {t.completed}
                          </span>
                        )}
                      </div>
                      <p className="text-purple-200 mb-3 leading-relaxed">{step.description}</p>
                      <div className="flex items-center gap-4 text-sm text-purple-300">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {step.estimated_time} min
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          {step.experience_points} XP
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    {(isCurrent || isCompleted) && !isLocked && (
                      <button
                        onClick={() => router.push(`/${lang}/portals/${portal.id}/step/${step.step_number}`)}
                        className="px-4 py-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/50"
                      >
                        {isCompleted ? 'Review' : 'Start'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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
