// app/[lang]/portal/[portalId]/page.tsx - FIXED VERSION
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PortalHeader } from '@/components/portals/portal-header'
import { PortalSteps } from '@/components/portals/portal-steps'
import { PortalProgress } from '@/components/portals/portal-progress'
import { AIGuidancePanel } from '@/components/ai/ai-guidance-panel'
import { Loader2, AlertCircle } from 'lucide-react'

interface Portal {
  id: string
  name: string
  description: string
  portal_code: string
  [key: string]: any
}

interface PortalStep {
  id: string
  portal_id: string
  step_number: number
  title: string
  description: string
  content: any
  is_active: boolean
  [key: string]: any
}

interface UserProgress {
  id: string
  user_id: string
  portal_id: string
  current_step: number
  total_steps: number
  completion_percentage: number
  status: string
  [key: string]: any
}

interface User {
  id: string
  email: string
  [key: string]: any
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
  const supabase = createClientComponentClient()
  const [portalData, setPortalData] = useState<PortalPageData>({
    user: null,
    portal: null,
    steps: [],
    progress: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    const loadPortalData = async () => {
      try {
        console.log('🔍 PORTAL: Loading portal data for:', params.portalId)
        
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('🔍 PORTAL: Auth error:', authError)
          throw authError
        }

        if (!user) {
          console.log('🔍 PORTAL: No user found, redirecting to login')
          router.replace(`/${params.lang}/login?next=${encodeURIComponent(`/${params.lang}/portal/${params.portalId}`)}`)
          return
        }

        console.log('🔍 PORTAL: User authenticated:', user.id)

        // Fetch portal details
        let portal: Portal | null = null
        try {
          const { data: portalData, error: portalError } = await supabase
            .from('portals')
            .select('*')
            .eq('portal_code', params.portalId)
            .single()
          
          if (portalError) {
            if (portalError.code === 'PGRST116') {
              console.log('🔍 PORTAL: Portal not found:', params.portalId)
              router.replace(`/${params.lang}/portal-dashboard`)
              return
            }
            throw portalError
          }
          
          portal = portalData
          console.log('🔍 PORTAL: Portal loaded:', portal?.id)
        } catch (portalErr: any) {
          console.error('🔍 PORTAL: Portal fetch error:', portalErr)
          if (mounted) {
            setPortalData(prev => ({
              ...prev,
              loading: false,
              error: 'Portal not found or inaccessible'
            }))
          }
          return
        }

        if (!portal) {
          console.log('🔍 PORTAL: Portal not found, redirecting to dashboard')
          router.replace(`/${params.lang}/portal-dashboard`)
          return
        }

        // Fetch portal steps
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
            steps = stepsData || []
            console.log('🔍 PORTAL: Steps loaded:', steps.length)
          }
        } catch (stepsErr) {
          console.warn('🔍 PORTAL: Steps fetch exception:', stepsErr)
        }

        // Fetch user progress
        let progress: UserProgress | null = null
        try {
          const { data: progressData, error: progressError } = await supabase
            .from('user_portal_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('portal_id', portal.id)
            .single()
          
          if (progressError && progressError.code !== 'PGRST116') {
            console.warn('🔍 PORTAL: Progress fetch error:', progressError)
          } else {
            progress = progressData
            console.log('🔍 PORTAL: Progress loaded:', !!progress)
          }
        } catch (progressErr) {
          console.warn('🔍 PORTAL: Progress fetch exception:', progressErr)
        }

        // Create progress if doesn't exist and we have steps
        if (!progress && steps.length > 0) {
          try {
            console.log('🔍 PORTAL: Creating initial progress record...')
            
            const { data: newProgress, error: createError } = await supabase
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
              // Continue without progress - app should still work
            } else {
              progress = newProgress
              console.log('🔍 PORTAL: Progress created successfully')
            }
          } catch (createErr) {
            console.warn('🔍 PORTAL: Progress creation exception:', createErr)
            // Continue without progress - app should still work
          }
        }

        if (mounted) {
          setPortalData({
            user as unknown as import('@supabase/auth-helpers-nextjs').User,
            portal,
            steps,
            progress,
            loading: false,
            error: null
          })
          console.log('🔍 PORTAL: Portal data loaded successfully')
        }

      } catch (error: any) {
        console.error('🔍 PORTAL: Load error:', error)
        if (mounted) {
          setPortalData(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Failed to load portal'
          }))
        }
      }
    }

    loadPortalData()

    return () => {
      mounted = false
    }
  }, [supabase, router, params.lang, params.portalId])

  // Loading state
  if (portalData.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
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

  // No user (shouldn't happen due to redirect, but safety check)
  if (!portalData.user || !portalData.portal) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Portal Header */}
      <PortalHeader
  portal={portalData.portal as any}
  progress={portalData.progress as any}
/>

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
          <AIGuidancePanel portal={portalData.portal as any} />
          <div className="lg:col-span-1">
            <AIGuidancePanel 
              portal={portalData.portal} 
              userId={portalData.user.id} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}