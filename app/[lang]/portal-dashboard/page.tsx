'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PortalGrid } from '@/components/portals/portal-grid'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { OfflinePanel } from '@/components/dashboard/offline-panel'
import { Loader2, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react'
import type { User, Session } from '@supabase/auth-helpers-nextjs'

// ── Enterprise TypeScript Interfaces ──
interface Portal {
  id: string
  name: string
  description: string
  is_active: boolean
  order_index: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'master'
  estimated_duration?: number
  unlock_conditions?: Record<string, any>
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

interface UserProgress {
  id: string
  user_id: string
  portal_id: string
  progress_percentage: number
  status: 'not_started' | 'in_progress' | 'completed' | 'locked'
  last_accessed_at?: string
  completion_data?: Record<string, any>
  created_at?: string
  updated_at?: string
}

interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  spiritual_level?: number
  preferred_language?: 'en' | 'ro'
  onboarding_completed?: boolean
  subscription_tier?: 'free' | 'premium' | 'enterprise'
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

interface DashboardError {
  type: 'auth' | 'network' | 'database' | 'permission' | 'unknown'
  message: string
  code?: string
  details?: any
}

interface DashboardState {
  user: User | null
  session: Session | null
  profile: Profile | null
  portals: Portal[]
  userProgress: UserProgress[]
  loading: boolean
  error: DashboardError | null
  retryCount: number
}

const INITIAL_STATE: DashboardState = {
  user: null,
  session: null,
  profile: null,
  portals: [],
  userProgress: [],
  loading: true,
  error: null,
  retryCount: 0
}

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

// ── Enterprise Error Handler ──
const createError = (
  type: DashboardError['type'], 
  message: string, 
  code?: string, 
  details?: any
): DashboardError => ({
  type,
  message,
  code,
  details
})

export default function PortalDashboardPage({
  params,
}: {
  params: { lang: string }
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)

  // ── Retry Logic with Exponential Backoff ──
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const retryWithBackoff = async (
    fn: () => Promise<void>, 
    attempt: number = 0
  ): Promise<void> => {
    try {
      await fn()
    } catch (error: any) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const backoffDelay = RETRY_DELAY * Math.pow(2, attempt)
        console.warn(`🔄 DASHBOARD: Retry attempt ${attempt + 1} after ${backoffDelay}ms`)
        await delay(backoffDelay)
        return retryWithBackoff(fn, attempt + 1)
      }
      throw error
    }
  }

  // ── Authentication Check ──
  const checkAuthentication = useCallback(async (): Promise<{ user: User; session: Session }> => {
    console.log('🔐 DASHBOARD: Checking authentication...')
    
    // Primary: Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('🔐 DASHBOARD: Session error:', sessionError)
      throw createError('auth', 'Failed to retrieve session', sessionError.message, sessionError)
    }

    if (!session) {
      console.log('🔐 DASHBOARD: No session found')
      throw createError('auth', 'No active session found', 'NO_SESSION')
    }

    if (!session.user) {
      console.log('🔐 DASHBOARD: No user in session')
      throw createError('auth', 'Invalid session - no user data', 'INVALID_SESSION')
    }

    // Secondary: Verify session is still valid
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.warn('🔐 DASHBOARD: User verification failed:', userError)
      // Session exists but user verification failed - likely expired
      throw createError('auth', 'Session expired', 'SESSION_EXPIRED', userError)
    }

    if (!user || user.id !== session.user.id) {
      throw createError('auth', 'Session validation failed', 'SESSION_MISMATCH')
    }

    console.log('🔐 DASHBOARD: Authentication successful for user:', user.id)
    return { user, session }
  }, [supabase])

  // ── Profile Fetcher ──
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('👤 DASHBOARD: Fetching profile for user:', userId)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          spiritual_level,
          preferred_language,
          onboarding_completed,
          subscription_tier,
          metadata,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - this is okay for new users
          console.log('👤 DASHBOARD: No profile found (new user)')
          return null
        }
        throw error
      }

      console.log('👤 DASHBOARD: Profile loaded successfully')
      return data as Profile
    } catch (error: any) {
      console.error('👤 DASHBOARD: Profile fetch error:', error)
      throw createError('database', 'Failed to load user profile', error.code, error)
    }
  }, [supabase])

  // ── Portals Fetcher ──
  const fetchPortals = useCallback(async (): Promise<Portal[]> => {
    console.log('🚪 DASHBOARD: Fetching active portals...')
    
    try {
      const { data, error } = await supabase
        .from('portals')
        .select(`
          id,
          name,
          description,
          is_active,
          order_index,
          difficulty,
          estimated_duration,
          unlock_conditions,
          metadata,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
      
      if (error) {
        throw error
      }

      const portals = (data || []) as Portal[]
      console.log('🚪 DASHBOARD: Loaded', portals.length, 'active portals')
      return portals
    } catch (error: any) {
      console.error('🚪 DASHBOARD: Portals fetch error:', error)
      throw createError('database', 'Failed to load portals', error.code, error)
    }
  }, [supabase])

  // ── User Progress Fetcher ──
  const fetchUserProgress = useCallback(async (userId: string): Promise<UserProgress[]> => {
    console.log('📊 DASHBOARD: Fetching user progress for:', userId)
    
    try {
      const { data, error } = await supabase
        .from('user_portal_progress')
        .select(`
          id,
          user_id,
          portal_id,
          progress_percentage,
          status,
          last_accessed_at,
          completion_data,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
      
      if (error) {
        throw error
      }

      const progress = (data || []) as UserProgress[]
      console.log('📊 DASHBOARD: Loaded progress for', progress.length, 'portals')
      return progress
    } catch (error: any) {
      console.error('📊 DASHBOARD: Progress fetch error:', error)
      throw createError('database', 'Failed to load progress data', error.code, error)
    }
  }, [supabase])

  // ── Main Data Loader ──
  const loadDashboardData = useCallback(async () => {
    let mounted = true

    const updateState = (updates: Partial<DashboardState>) => {
      if (mounted) {
        setState(prev => ({ ...prev, ...updates }))
      }
    }

    try {
      updateState({ loading: true, error: null })

      // Step 1: Authentication
      const { user, session } = await checkAuthentication()
      
      if (!mounted) return
      updateState({ user, session })

      // Step 2: Parallel data fetching for better performance
      const [profile, portals, userProgress] = await Promise.allSettled([
        fetchProfile(user.id),
        fetchPortals(),
        fetchUserProgress(user.id)
      ])

      if (!mounted) return

      // Process results
      const profileData = profile.status === 'fulfilled' ? profile.value : null
      const portalsData = portals.status === 'fulfilled' ? portals.value : []
      const progressData = userProgress.status === 'fulfilled' ? userProgress.value : []

      // Log any partial failures
      if (profile.status === 'rejected') {
        console.warn('⚠️ DASHBOARD: Profile fetch failed:', profile.reason)
      }
      if (portals.status === 'rejected') {
        console.warn('⚠️ DASHBOARD: Portals fetch failed:', portals.reason)
      }
      if (userProgress.status === 'rejected') {
        console.warn('⚠️ DASHBOARD: Progress fetch failed:', userProgress.reason)
      }

      updateState({
        profile: profileData,
        portals: portalsData,
        userProgress: progressData,
        loading: false,
        error: null,
        retryCount: 0
      })

      console.log('✅ DASHBOARD: All data loaded successfully')

    } catch (error: any) {
      console.error('❌ DASHBOARD: Load error:', error)
      
      if (!mounted) return

      // Handle authentication errors differently
      if (error.type === 'auth') {
        const redirectPath = `/${params.lang}/login?next=${encodeURIComponent(`/${params.lang}/portal-dashboard`)}&reason=${error.code || 'auth_required'}`
        console.log('🔄 DASHBOARD: Redirecting to login:', redirectPath)
        router.replace(redirectPath)
        return
      }

      updateState({
        loading: false,
        error: error as DashboardError,
        retryCount: (state.retryCount || 0) + 1
      })
    }

    return () => {
      mounted = false
    }
  }, [supabase, router, params.lang, checkAuthentication, fetchProfile, fetchPortals, fetchUserProgress, state.retryCount])

  // ── Retry Handler ──
  const handleRetry = useCallback(async () => {
    console.log('🔄 DASHBOARD: Manual retry initiated')
    await retryWithBackoff(loadDashboardData)
  }, [loadDashboardData])

  // ── Effect Hook ──
  useEffect(() => {
    const cleanup = loadDashboardData()
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [loadDashboardData])

  // ── Auth Session Listener ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 DASHBOARD: Auth state changed:', event)
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('🔄 DASHBOARD: User signed out, redirecting...')
          router.replace(`/${params.lang}/login`)
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 DASHBOARD: Token refreshed, reloading data...')
          await loadDashboardData()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, params.lang, loadDashboardData])

  // ── Loading State ──
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto" />
          <div>
            <p className="text-lg font-medium text-gray-700">Loading your spiritual dashboard...</p>
            <p className="text-sm text-gray-500 mt-1">Connecting to the quantum field</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (state.error) {
    const isNetworkError = state.error.type === 'network'
    const isAuthError = state.error.type === 'auth'
    const canRetry = state.retryCount < MAX_RETRY_ATTEMPTS && !isAuthError

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            {isAuthError ? (
              <ShieldAlert className="h-16 w-16 text-red-500 mx-auto" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {isAuthError ? '🔐 Authentication Required' : '⚠️ Dashboard Error'}
            </h1>
          </div>

          <div className="space-y-2">
            <p className="text-lg text-gray-700">{state.error.message}</p>
            {state.error.code && (
              <p className="text-sm text-gray-500 font-mono">Error Code: {state.error.code}</p>
            )}
            {isNetworkError && (
              <p className="text-sm text-gray-500">Please check your internet connection</p>
            )}
          </div>

          <div className="space-y-3">
            {canRetry ? (
              <button
                onClick={handleRetry}
                disabled={state.loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
                Try Again ({MAX_RETRY_ATTEMPTS - state.retryCount} attempts left)
              </button>
            ) : isAuthError ? (
              <button
                onClick={() => router.replace(`/${params.lang}/login`)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Login
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            )}
            
            <button
              onClick={() => router.replace(`/${params.lang}`)}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Safety Check ──
  if (!state.user || !state.session) {
    return null
  }

  // ── Main Dashboard ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <DashboardHeader user={state.user} profile={state.profile} />

      {/* Offline / Telemetry Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <OfflinePanel />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {state.profile?.full_name || state.user.email?.split('@')[0] || 'Spiritual Seeker'}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Continue your journey through the dimensions of consciousness
          </p>
          {state.profile?.subscription_tier && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                state.profile.subscription_tier === 'enterprise' 
                  ? 'bg-purple-100 text-purple-800'
                  : state.profile.subscription_tier === 'premium'
                  ? 'bg-gold-100 text-gold-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {state.profile.subscription_tier.toUpperCase()} Tier
              </span>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <StatsOverview userProgress={state.userProgress} />

        {/* Portal Grid */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Spiritual Portals
            </h2>
            <span className="text-sm text-gray-500">
              {state.portals.length} portals available
            </span>
          </div>
          <PortalGrid
            portals={state.portals}
            userProgress={state.userProgress}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard
              title="AI Guidance"
              description="Chat with your spiritual AI guide"
              icon="🤖"
              href={`/${params.lang}/ai-chat`}
              gradient="from-purple-500 to-purple-700"
              available={true}
            />
            <QuickActionCard
              title="Biometric Scan"
              description="Analyze your energy and emotions"
              icon="🔬"
              href={`/${params.lang}/biometric-scan`}
              gradient="from-pink-500 to-pink-700"
              available={state.profile?.subscription_tier !== 'free'}
            />
            <QuickActionCard
              title="Quantum Vault"
              description="Connect with your future self"
              icon="⚛️"
              href={`/${params.lang}/quantum-vault`}
              gradient="from-blue-500 to-blue-700"
              available={state.profile?.subscription_tier === 'enterprise'}
            />
          </div>
        </div>

        {/* Recent Activity */}
        {state.userProgress.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {state.userProgress
                  .filter(p => p.last_accessed_at)
                  .sort((a, b) => new Date(b.last_accessed_at!).getTime() - new Date(a.last_accessed_at!).getTime())
                  .slice(0, 5)
                  .map((progress) => {
                    const portal = state.portals.find(p => p.id === progress.portal_id)
                    return (
                      <div key={progress.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-gray-900">{portal?.name || 'Unknown Portal'}</p>
                          <p className="text-sm text-gray-500">
                            Last accessed: {new Date(progress.last_accessed_at!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-purple-600">
                            {progress.progress_percentage}% complete
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            progress.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : progress.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {progress.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Quick Action Card Component ──
function QuickActionCard({
  title,
  description,
  icon,
  href,
  gradient,
  available = true,
}: {
  title: string
  description: string
  icon: string
  href: string
  gradient: string
  available?: boolean
}) {
  const content = (
    <div className={`block p-6 rounded-2xl bg-gradient-to-br ${gradient} text-white transition-all duration-200 shadow-lg ${
      available 
        ? 'hover:scale-105 cursor-pointer' 
        : 'opacity-60 cursor-not-allowed'
    }`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-purple-100">{description}</p>
      {!available && (
        <div className="mt-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20">
            Premium Feature
          </span>
        </div>
      )}
    </div>
  )

  if (!available) {
    return content
  }

  return (
    <a href={href}>
      {content}
    </a>
  )
}