// app/[lang]/portal/[portalId]/page.tsx — ENTERPRISE FIXED
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/ssr'
import { PortalHeader } from '@/components/portals/portal-header'
import { PortalSteps } from '@/components/portals/portal-steps'
import { PortalProgress } from '@/components/portals/portal-progress'
import { AIGuidancePanel } from '@/components/ai/ai-guidance-panel'
import { Loader2, AlertCircle } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Minimal, runtime-safe shapes used by this page. Components may accept
// broader types; at the render boundary we cast with `as any` to avoid
// leaking those types in this page.
// ─────────────────────────────────────────────────────────────────────────────
interface Portal {
  id: string
  name: string
  description: string
  // Some projects key routes by code ("p0", "p1"), others by id.
  // We fetch by `portal_code` below, but keep this field optional-safe.
  portal_code?: string
  [key: string]: unknown
}

interface PortalStep {
  id: string
  portal_id: string
  step_number: number
  title: string
  description: string
  content: unknown
  is_active: boolean
  estimated_duration_minutes?: number | null
  [key: string]: unknown
}

interface UserProgress {
  id: string
  user_id: string
  portal_id: string
  current_step: number
  total_steps: number
  completion_percentage: number
  status: 'not_started' | 'in_progress' | 'completed' | string
  [key: string]: unknown
}

interface PortalPageData {
  user: User | null
  portal: Portal | null
  steps: PortalStep[]
  progress: UserProgress | null
  loading: boolean
  error: string | null
}

export default function PortalPage({
  params,
}: {
  params: { lang: string; portalId: string }
}) {
  const router = useRouter()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  const [portalData, setPortalData] = useState<PortalPageData>({
    user: null,
    portal: null,
    steps: [],
    progress: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    const loadPortalData = async () => {
      try {
        console.log('🔍 PORTAL: Loading portal data for:', params.portalId)

        // 1) Auth check
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.error('🔍 PORTAL: Auth error:', authError)
          throw authError
        }

        if (!user) {
          console.log('🔍 PORTAL: No user found, redirecting to login')
          router.replace(
            `/${params.lang}/login?next=${encodeURIComponent(
              `/${params.lang}/portal/${params.portalId}`,
            )}`,
          )
          return
        }

        console.log('🔍 PORTAL: User authenticated:', user.id)

        // 2) Fetch portal by code (fallback to id if your schema uses ids in the route)
        let portal: Portal | null = null
        try {
          const { data: portalRow, error: portalError } = await supabase
            .from('portals')
            .select('*')
            .or(
              // Match either the `portal_code` or the `id` to be resilient
              `portal_code.eq.${params.portalId},id.eq.${params.portalId}`,
            )
            .single()

          if (portalError) {
            if ((portalError as any).code === 'PGRST116') {
              console.log('🔍 PORTAL: Portal not found:', params.portalId)
              router.replace(`/${params.lang}/portal-dashboard`)
              return
            }
            throw portalError
          }

          portal = portalRow as Portal
          console.log('🔍 PORTAL: Portal loaded:', portal?.id)
        } catch (portalErr: any) {
          console.error('🔍 PORTAL: Portal fetch error:', portalErr)
          if (mounted) {
            setPortalData((prev) => ({
              ...prev,
              loading: false,
              error: 'Portal not found or inaccessible',
            }))
          }
          return
        }

        if (!portal) {
          console.log('🔍 PORTAL: Portal not found, redirecting to dashboard')
          router.replace(`/${params.lang}/portal-dashboard`)
          return
        }

        // 3) Fetch portal steps
        let steps: PortalStep[] = []
        try {
          const { data: stepsData, error: stepsError } = await supabase
            .from('portal_steps')
            .select('*')
            .eq('portal_id', portal.id)
            .eq('is_active', true)
            .order('step_number', { ascending: true })

          if (stepsError) {
            console.warn('🔍 PORTAL: Steps fetch error:', stepsError)
          } else {
            steps = (stepsData || []) as PortalStep[]
            console.log('🔍 PORTAL: Steps loaded:', steps.length)
          }
        } catch (stepsErr) {
          console.warn('🔍 PORTAL: Steps fetch exception:', stepsErr)
        }

        // 4) Fetch user progress
        let progress: UserProgress | null = null
        try {
          const { data: progressRow, error: progressError } = await supabase
            .from('user_portal_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('portal_id', portal.id)
            .single()

          if (progressError && (progressError as any).code !== 'PGRST116') {
            console.warn('🔍 PORTAL: Progress fetch error:', progressError)
          } else {
            progress = (progressRow as unknown as UserProgress) || null
            console.log('🔍 PORTAL: Progress loaded:', !!progress)
          }
        } catch (progressErr) {
          console.warn('🔍 PORTAL: Progress fetch exception:', progressErr)
        }

        // 5) Create initial progress if missing and we have steps
        if (!progress && steps.length > 0) {
          try {
            console.log('🔍 PORTAL: Creating initial progress record...')

            const { data: created, error: createError } = await supabase
              .from('user_portal_progress')
              .insert({
                user_id: user.id,
                portal_id: portal.id,
                current_step: 1,
                total_steps: steps.length,
                completion_percentage: 0,
                status: 'not_started',
              })
              .select()
              .single()

            if (createError) {
              console.warn('🔍 PORTAL: Progress creation error:', createError)
            } else {
              progress = created as unknown as UserProgress
              console.log('🔍 PORTAL: Progress created successfully')
            }
          } catch (createErr) {
            console.warn('🔍 PORTAL: Progress creation exception:', createErr)
          }
        }

        if (mounted) {
          setPortalData({
            user,
            portal,
            steps,
            progress,
            loading: false,
            error: null,
          })
          console.log('🔍 PORTAL: Portal data loaded successfully')
        }
      } catch (error: any) {
        console.error('🔍 PORTAL: Load error:', error)
        if (mounted) {
          setPortalData((prev) => ({
            ...prev,
            loading: false,
            error: error?.message || 'Failed to load portal',
          }))
        }
      }
    }

    void loadPortalData()

    return () => {
      mounted = false
    }
  }, [supabase, router, params.lang, params.portalId])

  // ───────────────────────────────────────────────────────────────────────────
  // Render States
  // ───────────────────────────────────────────────────────────────────────────
  if (portalData.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4"
            aria-label="Loading"
            role="status"
          />
          <span className="sr-only">Loading...</span>
          <p className="text-lg text-gray-600">Loading portal...</p>
          <p className="text-sm text-gray-500 mt-2">Portal ID: {params.portalId}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (portalData.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Portal Not Available</h1>
          <p className="text-gray-600 mb-4">{portalData.error}</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push(`/${params.lang}/portal-dashboard`)}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!portalData.user || !portalData.portal) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Portal Header */}
      <PortalHeader portal={portalData.portal as any} progress={portalData.progress as any} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <PortalProgress
              portal={portalData.portal as any}
              progress={portalData.progress as any}
              steps={portalData.steps as any}
            />

            {/* Portal Steps */}
            <PortalSteps
              portal={portalData.portal as any}
              steps={portalData.steps as any}
              progress={portalData.progress as any}
            />
          </div>

          {/* Sidebar - AI Guidance */}
          <div className="lg:col-span-1">
            <AIGuidancePanel portal={portalData.portal as any} userId={portalData.user.id as any} />
          </div>
        </div>
      </div>
    </div>
  )
}
