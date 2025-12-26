// lib/services/progress-tracker.ts
/**
 * 🎯 PorVerse V2 - Progress Tracker Service
 * Advanced progress tracking with analytics, insights, and performance monitoring
 *
 * @version 2.1.0-enterprise
 * @author PorVerse
 * @description Robust progress tracking for portal-based journey
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '../../types/database.types'
import type {
  UserPortalProgress,
  UserStepProgress,
  PortalSession,
  ImprovementMetric,
  ServiceResponse,
} from '../../types/portal-management'

/**
 * Progress tracking configuration
 */
interface ProgressTrackerConfig {
  supabaseUrl: string
  supabaseKey: string
  enableAnalytics: boolean
  enableBiometricTracking: boolean
  sessionTimeoutMinutes: number
  improvementWindowDays: number
}

/** Dashboard summary */
interface ProgressSummary {
  userId: string
  totalPortalsCompleted: number
  totalTimeSpentMinutes: number
  currentStreak: number
  longestStreak: number
  averageQualityScore: number
  achievementPoints: number
  completionRate: number
  improvementMetrics: ImprovementMetric[]
  recentSessions: PortalSession[]
  nextRecommendations: PortalRecommendation[]
}

interface PortalRecommendation {
  portalId: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  estimatedBenefit: number
  prerequisites: string[]
}

// ————————————————————————————————————————————————————————————————
// Utilities
// ————————————————————————————————————————————————————————————————
const toJson = (obj: unknown): Json => {
  // Ensure plain JSON that matches Database Json type
  return JSON.parse(JSON.stringify(obj ?? null)) as Json
}

const safeNumber = (v: unknown, def = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : def

// ————————————————————————————————————————————————————————————————
// Service
// ————————————————————————————————————————————————————————————————
export class ProgressTracker {
  private supabase: SupabaseClient<Database>
  private config: ProgressTrackerConfig
  private activeSession: Pick<PortalSession, 'id' | 'user_id' | 'portal_id' | 'session_start' | 'session_data'> | null = null
  private sessionTimer: NodeJS.Timeout | null = null

  constructor(config: ProgressTrackerConfig) {
    this.config = config
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey)
  }

  // ————————————————————————————————————————————————————————————————
  // PROGRESS ANALYTICS & INSIGHTS
  // ————————————————————————————————————————————————————————————————
  async getProgressSummary(
    userId: string,
    includeRecommendations: boolean = true
  ): Promise<ServiceResponse<ProgressSummary>> {
    try {
      const startTime = Date.now()

      // Overall progress
      const { data: portalProgress, error: progressError } = await this.supabase
        .from('user_portal_progress')
        .select(
          `*,
           portals:portal_id (
             name,
             category,
             color_primary,
             color_secondary,
             estimated_duration_days
           )`
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (progressError) {throw new Error(`Failed to fetch progress data: ${progressError.message}`)}

      // Basic metrics
      const completedPortals = (portalProgress || []).filter((p: unknown) => p.status === 'completed')
      const totalTimeSpent = (portalProgress || []).reduce(
        (sum: number, p: unknown) => sum + safeNumber((p).time_spent_minutes, 0),
        0
      )
      const totalPoints = (portalProgress || []).reduce(
        (sum: number, p: unknown) => sum + safeNumber((p).achievement_points, 0),
        0
      )

      // Average quality score from steps (UserPortalProgress may not have quality_score)
      const averageQuality = await this.calculateAverageQualityFromSteps(userId)

      // Streaks
      const streakData = await this.calculateStreakData(userId)

      // Recent sessions
      const recentSessionsRes = await this.getRecentSessions(userId, 10)
      const recentSessions = recentSessionsRes.success ? recentSessionsRes.data || [] : []

      // Improvement metrics
      const improvementMetrics = await this.calculateImprovementMetrics(userId)

      // Recommendations
      const recommendations = includeRecommendations
        ? await this.generateRecommendations(userId, (portalProgress || []) as unknown as UserPortalProgress[])
        : []

      const summary: ProgressSummary = {
        userId,
        totalPortalsCompleted: completedPortals.length,
        totalTimeSpentMinutes: totalTimeSpent,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        averageQualityScore: averageQuality,
        achievementPoints: totalPoints,
        completionRate: this.calculateCompletionRate((portalProgress || []) as unknown as UserPortalProgress[]),
        improvementMetrics,
        recentSessions,
        nextRecommendations: recommendations,
      }

      return {
        success: true,
        data: summary,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          cache_hit: false,
          data_freshness: 'fresh',
          api_version: '2.1.0-enterprise',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROGRESS_SUMMARY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate progress summary',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  /** Track a step completion */
  async trackStepCompletion(
    userId: string,
    portalId: string,
    stepId: string,
    timeSpent: number,
    qualityScore?: number,
    stepData?: Record<string, any>
  ): Promise<ServiceResponse<UserStepProgress>> {
    try {
      const startTime = Date.now()

      const { data: existingProgress } = await this.supabase
        .from('user_step_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .eq('step_id', stepId)
        .maybeSingle()

      const now = new Date().toISOString()

      const payload: Partial<UserStepProgress> = {
        user_id: userId,
        portal_id: portalId,
        step_id: stepId,
        status: 'completed',
        completed_at: now,
        time_spent_minutes: safeNumber(existingProgress?.time_spent_minutes, 0) + timeSpent,
        quality_score: typeof qualityScore === 'number' ? qualityScore : existingProgress?.quality_score,
        // attempts_count: safeNumber(existingProgress?.attempts_count, 0) + 1, // Field does not exist on UserStepProgress
        step_data: toJson({ ...(existingProgress as any)?.step_data, ...(stepData || {}), completion_timestamp: now }) as any, started_at: existingProgress?.started_at ?? now,
      }

      const { data: updatedProgress, error: progressError } = await this.supabase
        .from('user_step_progress')
        .upsert(payload, { onConflict: 'user_id,portal_id,step_id' })
        .select()
        .single()

      if (progressError) {throw new Error(`Failed to update step progress: ${progressError.message}`)}

      await this.updatePortalProgressFromStep(userId, portalId)

      if (this.activeSession?.portal_id === portalId) {
        const sd = (this.activeSession.session_data as any) || {}
        this.activeSession.session_data = toJson({ ...sd, last_step_completed: stepId, last_quality_score: qualityScore }) as any
      }

      if (this.config.enableAnalytics) {
        await this.recordStepAnalytics(userId, portalId, stepId, timeSpent, qualityScore)
      }

      return {
        success: true,
        data: updatedProgress as UserStepProgress,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          cache_hit: false,
          data_freshness: 'fresh',
          api_version: '2.1.0-enterprise',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STEP_TRACKING_ERROR',
          message: error instanceof Error ? error.message : 'Failed to track step completion',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  /** Track session time */
  async trackSessionTime(
    userId: string,
    portalId: string,
    sessionId: string,
    timeSpentMinutes: number,
    sessionData?: Record<string, any>
  ): Promise<ServiceResponse<PortalSession>> {
    try {
      const { data: session, error } = await this.supabase
        .from('portal_sessions')
        .update({
          duration_minutes: timeSpentMinutes,
          session_data: toJson(sessionData || {}) as any,
        })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .select()
        .single()

      if (error) {throw new Error(`Failed to update session time: ${error.message}`)}

      return { success: true, data: session as PortalSession }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_TIME_ERROR',
          message: error instanceof Error ? error.message : 'Failed to track session time',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  // ————————————————————————————————————————————————————————————————
  // SESSION MANAGEMENT
  // ————————————————————————————————————————————————————————————————
  async startSession(userId: string, portalId: string): Promise<ServiceResponse<PortalSession>> {
    try {
      if (this.activeSession) {await this.endSession()}

      const nowIso = new Date().toISOString()

      const insertPayload = {
        user_id: userId,
        portal_id: portalId,
        session_start: nowIso,
        session_data: toJson({ start_timestamp: Date.now() }) as any,
      } satisfies Partial<PortalSession>

      const { data, error } = await this.supabase
        .from('portal_sessions')
        .insert(insertPayload as any)
        .select()
        .single()

      if (error) {throw new Error(`Failed to create session: ${error.message}`)}

      this.activeSession = {
        id: data!.id,
        user_id: userId,
        portal_id: portalId,
        session_start: data!.session_start,
        session_data: data!.session_data,
      }

      this.sessionTimer = setTimeout(() => {
        this.endSession().catch(() => void 0)
      }, this.config.sessionTimeoutMinutes * 60 * 1000)

      return { success: true, data: data as PortalSession }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_START_ERROR',
          message: error instanceof Error ? error.message : 'Failed to start session',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  async endSession(): Promise<ServiceResponse<PortalSession | null>> {
    try {
      if (!this.activeSession) {return { success: true, data: null }}

      const endIso = new Date().toISOString()
      const startMs = new Date(this.activeSession.session_start).getTime()
      const duration = Math.max(0, Math.round((Date.now() - startMs) / 60000))

      const { data, error } = await this.supabase
        .from('portal_sessions')
        .update({
          session_end: endIso,
          duration_minutes: duration,
          session_data: toJson({ ...(this.activeSession.session_data as any), end_timestamp: Date.now(), final_duration: duration }) as any,
        })
        .eq('id', this.activeSession.id)
        .select()
        .single()

      if (error) {throw new Error(`Failed to end session: ${error.message}`)}

      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer)
        this.sessionTimer = null
      }

      this.activeSession = null
      return { success: true, data: data as PortalSession }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_END_ERROR',
          message: error instanceof Error ? error.message : 'Failed to end session',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  async getRecentSessions(userId: string, limit: number = 10): Promise<ServiceResponse<PortalSession[]>> {
    try {
      const { data, error } = await this.supabase
        .from('portal_sessions')
        .select(
          `*,
           portals:portal_id (
             name,
             category,
             color_primary,
             color_secondary
           )`
        )
        .eq('user_id', userId)
        .order('session_start', { ascending: false })
        .limit(limit)

      if (error) {throw new Error(`Failed to fetch recent sessions: ${error.message}`)}

      return { success: true, data: (data || []) as PortalSession[] }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RECENT_SESSIONS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch recent sessions',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  // ————————————————————————————————————————————————————————————————
  // ANALYTICS & CALCULATIONS
  // ————————————————————————————————————————————————————————————————
  private async calculateAverageQualityFromSteps(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_step_progress')
      .select('quality_score')
      .eq('user_id', userId)
      .not('quality_score', 'is', null)

    if (error || !data || data.length === 0) {return 0}
    const scores = data.map((r: unknown) => safeNumber(r.quality_score, 0))
    return scores.reduce((a: number, b: number) => a + b, 0) / scores.length
  }

  private calculateCompletionRate(progress: UserPortalProgress[]): number {
    if (!progress || progress.length === 0) {return 0}
    const completed = progress.filter((p) => (p as any).status === 'completed').length
    return (completed / progress.length) * 100
  }

  private calculateAverageEfficiency(rows: Array<{ progress_percentage?: number | null; time_spent_minutes?: number | null }>): number {
    if (!rows || rows.length === 0) {return 0}
    const values = rows.map((r) => safeNumber(r.progress_percentage, 0) / Math.max(1, safeNumber(r.time_spent_minutes, 0)))
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  private async calculateImprovementMetrics(userId: string): Promise<ImprovementMetric[]> {
    const metrics: ImprovementMetric[] = []
    try {
      const timeMetric = await this.calculateTimeEfficiencyImprovement(userId)
      if (timeMetric) {metrics.push(timeMetric)}

      const qualityMetric = await this.calculateQualityImprovement(userId)
      if (qualityMetric) {metrics.push(qualityMetric)}

      const consistencyMetric = await this.calculateConsistencyImprovement(userId)
      if (consistencyMetric) {metrics.push(consistencyMetric)}
    } catch (e) {
      // swallow — metrics are optional
    }
    return metrics
  }

  private async calculateTimeEfficiencyImprovement(userId: string): Promise<ImprovementMetric | null> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data } = await this.supabase
        .from('user_portal_progress')
        .select('time_spent_minutes, progress_percentage, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at')

      if (!data || data.length < 2) {return null}
      const mid = Math.floor(data.length / 2)
      const oldEfficiency = this.calculateAverageEfficiency(data.slice(0, mid))
      const newEfficiency = this.calculateAverageEfficiency(data.slice(mid))
      if (oldEfficiency === 0) {return null}

      return {
        metric_name: 'Time Efficiency',
        baseline_value: oldEfficiency,
        current_value: newEfficiency,
        improvement_percentage: ((newEfficiency - oldEfficiency) / oldEfficiency) * 100,
        trend: 'improving' as const,
        confidence: 0.85,
        measurement_count: data.length,
        
      }
    } catch {
      return null
    }
  }

  private async calculateQualityImprovement(userId: string): Promise<ImprovementMetric | null> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data } = await this.supabase
        .from('user_step_progress')
        .select('quality_score, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('quality_score', 'is', null)
        .order('created_at')

      if (!data || data.length < 5) {return null}
      const mid = Math.floor(data.length / 2)
      const oldAvg = data.slice(0, mid).reduce((s: number, r: unknown) => s + safeNumber(r.quality_score, 0), 0) / mid
      const newAvg = data.slice(mid).reduce((s: number, r: unknown) => s + safeNumber(r.quality_score, 0), 0) / Math.max(1, data.length - mid)

      return {
        metric_name: 'Quality Score',
        baseline_value: oldAvg,
        current_value: newAvg,
        improvement_percentage: oldAvg === 0 ? 0 : ((newAvg - oldAvg) / oldAvg) * 100,
        trend: 'improving' as const,
        confidence: 0.9,
        measurement_count: data.length,
        
      }
    } catch {
      return null
    }
  }

  private async calculateConsistencyImprovement(userId: string): Promise<ImprovementMetric | null> {
    try {
      const streak = await this.calculateStreakData(userId)
      return {
        metric_name: 'Consistency',
        baseline_value: streak.averageSessionGap,
        current_value: streak.recentSessionGap,
        improvement_percentage: streak.consistencyImprovement,
        trend: 'stable' as const,
        confidence: 0.75,
        measurement_count: 30,
        
      }
    } catch {
      return null
    }
  }

  private async calculateStreakData(userId: string): Promise<{
    currentStreak: number
    longestStreak: number
    averageSessionGap: number
    recentSessionGap: number
    consistencyImprovement: number
  }> {
    const { data: sessions } = await this.supabase
      .from('portal_sessions')
      .select('session_start')
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .limit(60)

    if (!sessions || sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, averageSessionGap: 0, recentSessionGap: 0, consistencyImprovement: 0 }
    }

    const dates = sessions.map((s: unknown) => new Date(s.session_start).toDateString())
    const uniqueDates = [...new Set(dates)]

    let currentStreak = 0
    const check = new Date()
    while (uniqueDates.includes(check.toDateString())) {
      currentStreak++
      check.setDate(check.getDate() - 1)
    }

    const longestStreak = Math.max(currentStreak, uniqueDates.length)

    // Placeholder simple gaps — can be replaced with real gap calculation
    return {
      currentStreak,
      longestStreak,
      averageSessionGap: 1.2,
      recentSessionGap: 1.0,
      consistencyImprovement: 15,
    }
  }

  private async generateRecommendations(
    _userId: string,
    portalProgress: UserPortalProgress[]
  ): Promise<PortalRecommendation[]> {
    const recs: PortalRecommendation[] = []
    const inProgress = (portalProgress || []).filter((p: unknown) => p.status === 'in_progress')

    for (const p of inProgress) {
      recs.push({
        portalId: (p as any).portal_id,
        priority: 'high',
        reason: 'Continue your current progress',
        estimatedBenefit: 85,
        prerequisites: [],
      })
    }

    return recs.slice(0, 3)
  }

  // ————————————————————————————————————————————————————————————————
  // DB Mutations derived from steps
  // ————————————————————————————————————————————————————————————————
  private async updatePortalProgressFromStep(userId: string, portalId: string): Promise<void> {
    const { data: steps } = await this.supabase
      .from('portal_steps')
      .select('id')
      .eq('portal_id', portalId)
      .eq('is_active', true)

    const { data: completed } = await this.supabase
      .from('user_step_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('portal_id', portalId)
      .eq('status', 'completed')

    const total = steps?.length || 0
    const done = completed?.length || 0
    const progressPct = total > 0 ? Math.round((done / total) * 100) : 0

    await this.supabase
      .from('user_portal_progress')
      .update({
        progress_percentage: progressPct,
        status: progressPct === 100 ? 'completed' : 'in_progress',
        last_activity_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('portal_id', portalId)
  }

  private async recordStepAnalytics(
    _userId: string,
    _portalId: string,
    _stepId: string,
    _timeSpent: number,
    _qualityScore?: number
  ): Promise<void> {
    // TODO: Implement detailed analytics recording (events table / telemetry)
  }
}

export function createProgressTracker(overrides?: Partial<ProgressTrackerConfig>): ProgressTracker {
  const config: ProgressTrackerConfig = {
    supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    supabaseKey: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    enableAnalytics: true,
    enableBiometricTracking: true,
    sessionTimeoutMinutes: 60,
    improvementWindowDays: 30,
    ...overrides,
  }

  return new ProgressTracker(config)
}

export default ProgressTracker
