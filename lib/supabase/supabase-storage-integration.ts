/**
 * 🎭 WAVE 2 - Task 1.2: Supabase Biometric Storage Integration
 * 
 * NEW METHOD to add to EmotionAnalyzer class in /lib/biometric/emotion-analyzer.ts
 * This integrates with the existing biometric_scans table in Supabase
 */

import { createClient } from '@/lib/supabase/client'
import type { EmotionReading, BiometricReading, PrivacyMode } from '@/types/biometric'

// ============================================================================
// 🗄️ SUPABASE STORAGE INTEGRATION
// ============================================================================

/**
 * Stores a biometric reading to Supabase database
 * Respects user privacy settings and GDPR compliance
 * 
 * @param userId - User ID
 * @param reading - Emotion reading to store
 * @param privacyLevel - Privacy level ('strict' | 'balanced' | 'permissive')
 * @returns Promise<string> - Returns the ID of the stored reading
 * 
 * USAGE:
 * ```typescript
 * const readingId = await analyzer.storeBiometricReading(
 *   userId,
 *   emotionReading,
 *   'strict' // or 'balanced', 'permissive'
 * )
 * ```
 */
async storeBiometricReading(
  userId: string,
  reading: EmotionReading,
  privacyLevel: PrivacyMode = 'strict'
): Promise<string> {
  try {
    const supabase = createClient()
    
    // STEP 1: Anonymize data based on privacy level
    const dataToStore = this.prepareDataForStorage(reading, privacyLevel)
    
    // STEP 2: Insert into biometric_scans table
    const { data, error } = await supabase
      .from('biometric_scans')
      .insert({
        user_id: userId,
        scan_type: 'face_emotion', // Type of biometric scan
        scan_data: dataToStore.scanData, // Processed biometric data
        analysis_results: dataToStore.analysisResults, // Analysis results
        confidence_score: reading.confidence,
        quality_score: this.calculateQualityScore(reading), // Overall quality
        processing_location: 'client', // Processed on client side
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ Failed to store biometric reading:', error)
      throw new Error(`Storage failed: ${error.message}`)
    }
    
    console.log('✅ Biometric reading stored successfully:', data.id)
    
    // STEP 3: Update user's last scan timestamp
    await this.updateLastScanTimestamp(userId)
    
    return data.id
    
  } catch (error) {
    console.error('❌ Error storing biometric reading:', error)
    throw error
  }
}

/**
 * Prepares biometric data for storage based on privacy level
 * 
 * Privacy levels:
 * - strict: Only store emotion category, no detailed data
 * - balanced: Store emotion + confidence, minimal metadata
 * - permissive: Store full data for better analysis
 * 
 * @param reading - Emotion reading
 * @param privacyLevel - Privacy mode
 * @returns Prepared data for storage
 */
private prepareDataForStorage(
  reading: EmotionReading,
  privacyLevel: PrivacyMode
): {
  scanData: any
  analysisResults: any
} {
  
  if (privacyLevel === 'strict') {
    // STRICT MODE: Minimal data
    return {
      scanData: {
        emotion_category: this.generalizeEmotion(reading.emotion),
        timestamp: reading.timestamp
      },
      analysisResults: {
        emotional_state: this.generalizeEmotion(reading.emotion),
        general_intensity: reading.intensity > 0.7 ? 'high' : reading.intensity > 0.4 ? 'medium' : 'low'
      }
    }
  } else if (privacyLevel === 'balanced') {
    // BALANCED MODE: Moderate data
    return {
      scanData: {
        emotion: reading.emotion,
        intensity: Math.round(reading.intensity * 10) / 10, // Round to 1 decimal
        confidence: Math.round(reading.confidence * 10) / 10,
        timestamp: reading.timestamp
      },
      analysisResults: {
        emotional_state: reading.emotion,
        intensity_level: this.categorizeIntensity(reading.intensity),
        valence: reading.valence ? Math.round(reading.valence * 10) / 10 : null,
        arousal: reading.arousal ? Math.round(reading.arousal * 10) / 10 : null
      }
    }
  } else {
    // PERMISSIVE MODE: Full data
    return {
      scanData: {
        emotion: reading.emotion,
        intensity: reading.intensity,
        confidence: reading.confidence,
        timestamp: reading.timestamp,
        raw_scores: reading.rawScores || {},
        valence: reading.valence,
        arousal: reading.arousal
      },
      analysisResults: {
        emotional_state: reading.emotion,
        intensity: reading.intensity,
        confidence: reading.confidence,
        stress_level: this.calculateStressFromEmotion(reading),
        emotional_valence: reading.valence,
        emotional_arousal: reading.arousal
      }
    }
  }
}

/**
 * Generalizes emotion to broader category for privacy
 * Maps specific emotions to general categories
 */
private generalizeEmotion(emotion: EmotionType): string {
  const mapping: Record<EmotionType, string> = {
    'happy': 'positive',
    'surprised': 'positive',
    'sad': 'negative',
    'angry': 'negative',
    'fearful': 'negative',
    'disgusted': 'negative',
    'neutral': 'neutral'
  }
  return mapping[emotion] || 'neutral'
}

/**
 * Categorizes intensity into low/medium/high
 */
private categorizeIntensity(intensity: number): 'low' | 'medium' | 'high' {
  if (intensity < 0.33) return 'low'
  if (intensity < 0.67) return 'medium'
  return 'high'
}

/**
 * Calculates overall quality score for the reading
 * Based on confidence and other factors
 */
private calculateQualityScore(reading: EmotionReading): number {
  // Quality factors:
  // - Confidence score (70% weight)
  // - Intensity (30% weight) - higher intensity = more reliable
  const confidenceWeight = 0.7
  const intensityWeight = 0.3
  
  const qualityScore = 
    (reading.confidence * confidenceWeight) +
    (reading.intensity * intensityWeight)
  
  return Math.round(qualityScore * 100) / 100 // Round to 2 decimals
}

/**
 * Estimates stress level from emotion reading
 */
private calculateStressFromEmotion(reading: EmotionReading): 'low' | 'moderate' | 'high' | 'critical' {
  const negativeEmotions: EmotionType[] = ['angry', 'fearful', 'disgusted', 'sad']
  const isNegative = negativeEmotions.includes(reading.emotion)
  
  if (!isNegative) return 'low'
  
  // Higher intensity negative emotions = higher stress
  if (reading.intensity > 0.8) return 'critical'
  if (reading.intensity > 0.6) return 'high'
  if (reading.intensity > 0.4) return 'moderate'
  return 'low'
}

/**
 * Updates user's last scan timestamp in profile
 */
private async updateLastScanTimestamp(userId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    await supabase
      .from('profiles')
      .update({
        last_biometric_scan: new Date().toISOString()
      })
      .eq('id', userId)
    
  } catch (error) {
    // Don't throw - this is non-critical
    console.warn('⚠️  Could not update last scan timestamp:', error)
  }
}

// ============================================================================
// 📊 BATCH STORAGE (Optional Enhancement)
// ============================================================================

/**
 * Stores multiple biometric readings in batch
 * More efficient for bulk operations
 * 
 * @param userId - User ID
 * @param readings - Array of emotion readings
 * @param privacyLevel - Privacy mode
 * @returns Promise<string[]> - Array of stored reading IDs
 */
async storeBiometricReadingsBatch(
  userId: string,
  readings: EmotionReading[],
  privacyLevel: PrivacyMode = 'strict'
): Promise<string[]> {
  try {
    const supabase = createClient()
    
    // Prepare all readings
    const recordsToInsert = readings.map(reading => {
      const dataToStore = this.prepareDataForStorage(reading, privacyLevel)
      
      return {
        user_id: userId,
        scan_type: 'face_emotion',
        scan_data: dataToStore.scanData,
        analysis_results: dataToStore.analysisResults,
        confidence_score: reading.confidence,
        quality_score: this.calculateQualityScore(reading),
        processing_location: 'client',
        created_at: new Date(reading.timestamp).toISOString()
      }
    })
    
    // Batch insert
    const { data, error } = await supabase
      .from('biometric_scans')
      .insert(recordsToInsert)
      .select('id')
    
    if (error) {
      console.error('❌ Batch storage failed:', error)
      throw new Error(`Batch storage failed: ${error.message}`)
    }
    
    console.log(`✅ Stored ${data.length} biometric readings in batch`)
    
    await this.updateLastScanTimestamp(userId)
    
    return data.map(record => record.id)
    
  } catch (error) {
    console.error('❌ Error in batch storage:', error)
    throw error
  }
}

// ============================================================================
// 🔍 RETRIEVAL METHODS
// ============================================================================

/**
 * Retrieves biometric readings for a user
 * 
 * @param userId - User ID
 * @param options - Query options
 * @returns Array of biometric readings
 */
async getBiometricReadings(
  userId: string,
  options: {
    limit?: number
    startDate?: Date
    endDate?: Date
    minConfidence?: number
  } = {}
): Promise<any[]> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('biometric_scans')
      .select('*')
      .eq('user_id', userId)
      .eq('scan_type', 'face_emotion')
      .order('created_at', { ascending: false })
    
    // Apply filters
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
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Failed to retrieve readings:', error)
      throw error
    }
    
    return data || []
    
  } catch (error) {
    console.error('❌ Error retrieving readings:', error)
    throw error
  }
}

/**
 * Gets emotional statistics for a user
 * Aggregates data for insights
 */
async getEmotionalStatistics(
  userId: string,
  days: number = 7
): Promise<{
  totalScans: number
  dominantEmotion: EmotionType
  averageConfidence: number
  emotionDistribution: Record<EmotionType, number>
}> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const readings = await this.getBiometricReadings(userId, {
      startDate,
      limit: 1000
    })
    
    if (readings.length === 0) {
      return {
        totalScans: 0,
        dominantEmotion: 'neutral',
        averageConfidence: 0,
        emotionDistribution: {} as Record<EmotionType, number>
      }
    }
    
    // Calculate statistics
    const emotionCounts: Record<string, number> = {}
    let totalConfidence = 0
    
    readings.forEach(reading => {
      const emotion = reading.scan_data?.emotion || 'neutral'
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
      totalConfidence += reading.confidence_score || 0
    })
    
    // Find dominant emotion
    let dominantEmotion: EmotionType = 'neutral'
    let maxCount = 0
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count
        dominantEmotion = emotion as EmotionType
      }
    })
    
    // Calculate distribution percentages
    const distribution: Record<EmotionType, number> = {} as Record<EmotionType, number>
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      distribution[emotion as EmotionType] = count / readings.length
    })
    
    return {
      totalScans: readings.length,
      dominantEmotion,
      averageConfidence: totalConfidence / readings.length,
      emotionDistribution: distribution
    }
    
  } catch (error) {
    console.error('❌ Error calculating statistics:', error)
    throw error
  }
}

// ============================================================================
// 🔒 GDPR COMPLIANCE METHODS
// ============================================================================

/**
 * Deletes all biometric data for a user (GDPR Right to Erasure)
 * 
 * @param userId - User ID
 * @returns Number of deleted records
 */
async deleteBiometricData(userId: string): Promise<number> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('biometric_scans')
      .delete()
      .eq('user_id', userId)
      .select('id')
    
    if (error) {
      console.error('❌ Failed to delete biometric data:', error)
      throw error
    }
    
    const deletedCount = data?.length || 0
    console.log(`🗑️  Deleted ${deletedCount} biometric records for user ${userId}`)
    
    // Also clear in-memory history
    this.clearHistory(userId)
    
    return deletedCount
    
  } catch (error) {
    console.error('❌ Error deleting biometric data:', error)
    throw error
  }
}

/**
 * Exports user's biometric data (GDPR Right to Data Portability)
 * 
 * @param userId - User ID
 * @returns JSON export of all biometric data
 */
async exportBiometricData(userId: string): Promise<string> {
  try {
    const readings = await this.getBiometricReadings(userId, { limit: 10000 })
    
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      total_records: readings.length,
      data: readings
    }
    
    return JSON.stringify(exportData, null, 2)
    
  } catch (error) {
    console.error('❌ Error exporting biometric data:', error)
    throw error
  }
}

// ============================================================================
// 📝 USAGE EXAMPLES
// ============================================================================

/**
 * COMPLETE USAGE EXAMPLE:
 * 
 * ```typescript
 * // 1. Store a single reading
 * const readingId = await analyzer.storeBiometricReading(
 *   userId,
 *   emotionReading,
 *   'balanced' // privacy level
 * )
 * 
 * // 2. Store multiple readings (batch)
 * const ids = await analyzer.storeBiometricReadingsBatch(
 *   userId,
 *   [reading1, reading2, reading3],
 *   'balanced'
 * )
 * 
 * // 3. Retrieve readings
 * const recentReadings = await analyzer.getBiometricReadings(userId, {
 *   limit: 50,
 *   startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
 *   minConfidence: 0.7
 * })
 * 
 * // 4. Get statistics
 * const stats = await analyzer.getEmotionalStatistics(userId, 7)
 * console.log('Dominant emotion:', stats.dominantEmotion)
 * console.log('Total scans:', stats.totalScans)
 * 
 * // 5. GDPR: Delete all data
 * await analyzer.deleteBiometricData(userId)
 * 
 * // 6. GDPR: Export data
 * const exportJson = await analyzer.exportBiometricData(userId)
 * // Download or send to user
 * ```
 */