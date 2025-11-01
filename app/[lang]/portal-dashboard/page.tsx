// app/[lang]/portal-dashboard/page.tsx - FIXED VERSION
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PortalGrid } from '@/components/portals/portal-grid'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { OfflinePanel } from '@/components/dashboard/offline-panel'
import { Loader2 } from 'lucide-react'

interface Portal {
  id: string
  name: string
  description: string
  is_active: boolean
  order_index: number
  [key: string]: any
}

interface UserProgress {
  id: string
  user_id: string
  portal_id: string
  [key: string]: any
}

interface Profile {
  id: string
  full_name?: string
  [key: string]: any
}

interface User {
  id: string
  email: string
  [key: string]: any
}

interface DashboardData {
  user: User | null
  profile: Profile | null
  portals: Portal[]
  userProgress: UserProgress[]
  loading: boolean
  error: string | null
}

export default function PortalDashboardPage({
  params,
}: {
  params: { lang: string }
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user: null,
    profile: null,
    portals: [],
    userProgress: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    const loadDashboardData = async () => {
      try {
        console.log('🔍 DASHBOARD: Loading dashboard data...')
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('🔍 DASHBOARD: Auth error:', authError)
          throw authError
        }

        if (!user) {
          console.log('🔍 DASHBOARD: No user found, redirecting to login')
          router.replace(`/${params.lang}/login?next=${encodeURIComponent(`/${params.lang}/portal-dashboard`)}`)
          return
        }

        console.log('🔍 DASHBOARD: User authenticated:', user.id)

        // Fetch profile with error handling
        let profile = null
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('🔍 DASHBOARD: Profile fetch error:', profileError)
          } else {
            profile = profileData
            console.log('🔍 DASHBOARD: Profile loaded:', !!profile)
          }
        } catch (profileErr) {
          console.warn('🔍 DASHBOARD: Profile fetch exception:', profileErr)
        }

        // Fetch portals with error handling
        let portals: Portal[] = []
        try {
          const { data: portalsData, error: portalsError } = await supabase
            .from('portals')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true })
          
          if (portalsError) {
            console.warn('🔍 DASHBOARD: Portals fetch error:', portalsError)
          } else {
            portals = portalsData || []
            console.log('🔍 DASHBOARD: Portals loaded:', portals.length)
          }
        } catch (portalsErr) {
          console.warn('🔍 DASHBOARD: Portals fetch exception:', portalsErr)
        }

        // Fetch user progress with error handling
        let userProgress: UserProgress[] = []
        try {
          const { data: progressData, error: progressError } = await supabase
            .from('user_portal_progress')
            .select('*')
            .eq('user_id', user.id)
          
          if (progressError) {
            console.warn('🔍 DASHBOARD: Progress fetch error:', progressError)
          } else {
            userProgress = progressData || []
            console.log('🔍 DASHBOARD: Progress loaded:', userProgress.length)
          }
        } catch (progressErr) {
          console.warn('🔍 DASHBOARD: Progress fetch exception:', progressErr)
        }

        if (mounted) {
          setDashboardData({
            user,
            profile,
            portals,
            userProgress,
            loading: false,
            error: null
          })
          console.log('🔍 DASHBOARD: Dashboard data loaded successfully')
        }

      } catch (error: any) {
        console.error('🔍 DASHBOARD: Load error:', error)
        if (mounted) {
          setDashboardData(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Failed to load dashboard'
          }))
        }
      }
    }

    loadDashboardData()

    return () => {
      mounted = false
    }
  }, [supabase, router, params.lang])

  // Loading state
  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (dashboardData.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-lg text-gray-600 mb-4">Failed to load dashboard</p>
          <p className="text-sm text-gray-500">{dashboardData.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No user (shouldn't happen due to redirect, but safety check)
  if (!dashboardData.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <DashboardHeader user={dashboardData.user} profile={dashboardData.profile} />

      {/* Offline / Telemetry mini-panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <OfflinePanel />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {dashboardData.profile?.full_name || dashboardData.user.email}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Continue your spiritual journey through the portals
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview userProgress={dashboardData.userProgress} />

        {/* Portal Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Portals
          </h2>
          <PortalGrid
            portals={dashboardData.portals}
            userProgress={dashboardData.userProgress}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            title="AI Guidance"
            description="Chat with your spiritual AI guide"
            icon="🤖"
            href={`/${params.lang}/ai-chat`}
            gradient="from-purple-500 to-purple-700"
          />
          <QuickActionCard
            title="Biometric Scan"
            description="Analyze your energy and emotions"
            icon="🔬"
            href={`/${params.lang}/biometric-scan`}
            gradient="from-pink-500 to-pink-700"
          />
          <QuickActionCard
            title="Quantum Vault"
            description="Connect with your future self"
            icon="⚛️"
            href={`/${params.lang}/quantum-vault`}
            gradient="from-blue-500 to-blue-700"
          />
        </div>
      </main>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  gradient,
}: {
  title: string
  description: string
  icon: string
  href: string
  gradient: string
}) {
  return (
    <a
      href={href}
      className={`block p-6 rounded-2xl bg-gradient-to-br ${gradient} text-white hover:scale-105 transition-transform duration-200 shadow-lg`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-purple-100">{description}</p>
    </a>
  )
}