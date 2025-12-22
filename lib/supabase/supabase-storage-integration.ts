import { createClient } from '@/lib/supabase/client'
import { isQueryError } from '@/lib/services/supabase-helpers'

import type { EmotionReading, PrivacyMode } from '@/types/biometric'

type EmotionType = 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'neutral'

// Helper functions
function generalizeEmotion(emotion: EmotionType): string {
  const mapping: Record<EmotionType, string> = {
    happy: 'positive',
    surprised: 'positive',
    sad: 'negative',
    angry: 'negative',
    fearful: 'negative',
    disgusted: 'negative',
    neutral: 'neutral'
  }
  return mapping[emotion] || 'neutral'
}

function categorizeIntensity(intensity: number): 'low' | 'medium' | 'high' {
  if (intensity < 0.33) {
    return 'low'
  }
  if (intensity < 0.67) {
    return 'medium'
  }
  return 'high'
}

function calculateQualityScore(reading: EmotionReading): number {
  const qualityScore = reading.confidence * 0.7 + reading.intensity * 0.3
  return Math.round(qualityScore * 100) / 100
}

function calculateStressFromEmotion(reading: EmotionReading): 'low' | 'moderate' | 'high' | 'critical' {
  const negativeEmotions: EmotionType[] = ['angry', 'fearful', 'disgusted', 'sad']
  const isNegative = negativeEmotions.includes(reading.emotion as EmotionType)

  if (!isNegative) {
    return 'low'
  }
  if (reading.intensity > 0.8) {
    return 'critical'
  }
  if (reading.intensity > 0.6) {
    return 'high'
  }
  if (reading.intensity > 0.4) {
    return 'moderate'
  }
  return 'low'
}

function prepareDataForStorage(reading: EmotionReading, privacyLevel: PrivacyMode) {
  if (privacyLevel === 'strict') {
    return {
      scanData: {
        emotion_category: generalizeEmotion(reading.emotion as EmotionType),
        timestamp: reading.timestamp
      },
      analysisResults: {
        emotional_state: generalizeEmotion(reading.emotion as EmotionType),
        general_intensity: reading.intensity > 0.7 ? 'high' : reading.intensity > 0.4 ? 'medium' : 'low'
      }
    }
  } else if (privacyLevel === 'balanced') {
    return {
      scanData: {
        emotion: reading.emotion,
        intensity: Math.round(reading.intensity * 10) / 10,
        confidence: Math.round(reading.confidence * 10) / 10,
        timestamp: reading.timestamp
      },
      analysisResults: {
        emotional_state: reading.emotion,
        intensity_level: categorizeIntensity(reading.intensity),
        valence: reading.valence ? Math.round(reading.valence * 10) / 10 : null,
        arousal: reading.arousal ? Math.round(reading.arousal * 10) / 10 : null
      }
    }
  } else {
    return {
      scanData: {
        emotion: reading.emotion,
        intensity: reading.intensity,
        confidence: reading.confidence,
        timestamp: reading.timestamp,
        valence: reading.valence,
        arousal: reading.arousal
      },
      analysisResults: {
        emotional_state: reading.emotion,
        intensity: reading.intensity,
        confidence: reading.confidence,
        stress_level: calculateStressFromEmotion(reading),
        emotional_valence: reading.valence,
        emotional_arousal: reading.arousal
      }
    }
  }
}

async function updateLastScanTimestamp(userId: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ last_biometric_scan: new Date().toISOString() })
      .eq('id', userId)
  } catch (error) {
    console.warn('⚠️ Could not update last scan timestamp:', error)
  }
}

// Main exports
export async function storeBiometricReading(
  userId: string,
  reading: EmotionReading,
  privacyLevel: PrivacyMode = 'strict'
): Promise<string> {
  const supabase = createClient()
  const dataToStore = prepareDataForStorage(reading, privacyLevel)

  const result = await supabase
    .from('biometric_scans')
    .insert({
      user_id: userId,
      scan_type: 'face_emotion',
      scan_data: dataToStore.scanData,
      analysis_results: dataToStore.analysisResults,
      confidence_score: reading.confidence,
      quality_score: calculateQualityScore(reading),
      processing_location: 'client',
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (isQueryError(result)) {
    throw new Error(`Storage failed: ${result.error.message}`)
  }

  await updateLastScanTimestamp(userId)
  return result.data.id
}

export async function getBiometricReadings(
  userId: string,
  options: {
    limit?: number
    startDate?: Date
    endDate?: Date
    minConfidence?: number
  } = {}
): Promise<any[]> {
  const supabase = createClient()
  let query = supabase
    .from('biometric_scans')
    .select('*')
    .eq('user_id', userId)
    .eq('scan_type', 'face_emotion')
    .order('created_at', { ascending: false })

  if (options.startDate) {
    query = query.gte('created_at', options.startDate.toISOString())
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate.toISOString())
  }
  if (options.minConfidence) {
    query = query.gte('confidence_score', options.minConfidence)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const result = await query
  if (isQueryError(result)) {
    throw result.error
  }
  return result.data ?? []
}

export async function deleteBiometricData(userId: string): Promise<number> {
  const supabase = createClient()
  const deleteResult = await supabase
    .from('biometric_scans')
    .delete()
    .eq('user_id', userId)
    .select('id')

  if (isQueryError(deleteResult)) {
    throw deleteResult.error
  }
  return deleteResult.data?.length ?? 0
}
