'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { OfflinePanel } from '@/components/dashboard/offline-panel'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { PortalGrid } from '@/components/portals/portal-grid'

import type { Database } from '@/types/database.types'
import type { User, Session } from '@supabase/supabase-js'

type DBProfile = Database['public']['Tables']['profiles']['Row']
type DBProgress = Database['public']['Tables']['user_portal_progress']['Row']
type DBPortal = Database['public']['Tables']['portals']['Row']

interface DashboardState {
  user: User | null
  session: Session | null
  profile: DBProfile | null
  portals: DBPortal[]
  userProgress: DBProgress[]
  loading: boolean
  error: Error | null
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
  retryCount: 0,
}

export default function PortalDashboardPage({
  params,
}: {
  params: { lang: string }
}) {
  const lang = params.lang
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  )
  
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)

  const loadDashboardData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace(`/${lang}/login`)
        return
      }

      const [profileRes, portalsRes, progressRes] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('portals').select('*').eq('is_active', true).order('order_index'),
        supabase.from('user_portal_progress').select('*').eq('user_id', user.id),
      ])

      setState({
        user,
        session: null,
        profile: profileRes.status === 'fulfilled' ? profileRes.value.data : null,
        portals: portalsRes.status === 'fulfilled' ? portalsRes.value.data || [] : [],
        userProgress: progressRes.status === 'fulfilled' ? progressRes.value.data || [] : [],
        loading: false,
        error: null,
        retryCount: 0,
      })
    } catch (error: unknown) {
      console.error('Dashboard load error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        retryCount: prev.retryCount + 1,
      }))
    }
  }, [supabase, router, lang])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto" />
          <p className="text-lg font-medium text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Error</h1>
          <button
            onClick={loadDashboardData}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={state.user!} profile={state.profile} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <OfflinePanel />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Continue your journey through consciousness
          </p>
        </div>

        <StatsOverview userProgress={state.userProgress} />
        <PortalGrid portals={state.portals} userProgress={state.userProgress} />
      </main>
    </div>
  )
}
