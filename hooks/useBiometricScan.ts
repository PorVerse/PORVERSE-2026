/**
 * 🎣 PorVerse V2 - useBiometricScan Hook
 * Custom React hook pentru scanare biometrică simplificată
 * 
 * @version 2.0.0
 * @description Hook pentru integrare ușoară a sistemului biometric
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  BiometricReading,
  EmotionType,
  StressLevel,
  EmotionalState,
} from '@/types/biometric'

// ============================================================================
// 🎯 TYPES
// ============================================================================

interface UseBiometricScanOptions {
  userId: string
  autoStart?: boolean
  scanInterval?: number
  privacyMode?: 'strict' | 'balanced' | 'permissive'
  onScanComplete?: (reading: BiometricReading) => void
  onError?: (error: Error) => void
  saveToDatabase?: boolean
}

interface BiometricScanState {
  isInitialized: boolean
  isScanning: boolean
  currentReading: BiometricReading | null
  currentEmotion: EmotionType | null
  stressLevel: StressLevel | null
  emotionalState: EmotionalState | null
  error: string | null
  scanCount: number
  lastScanTime: number | null
}

interface UseBiometricScanReturn {
  // State
  state: BiometricScanState
  
  // Actions
  startScan: () => Promise<void>
  stopScan: () => void
  takeSingleScan: () => Promise<BiometricReading | null>
  
  // Services access
  services: any | null
  
  // Utilities
  isReady: boolean
  hasPermission: boolean
  canScan: boolean
}

// ============================================================================
// 🎣 HOOK
// ============================================================================

export function useBiometricScan(options: UseBiometricScanOptions): UseBiometricScanReturn {
  const {
    userId,
    autoStart = false,
    scanInterval = 2000,
    privacyMode = 'strict',
    onScanComplete,
    onError,
    saveToDatabase = false,
  } = options

  // ========================================================================
  // 📊 STATE
  // ========================================================================

  const [state, setState] = useState<BiometricScanState>({
    isInitialized: false,
    isScanning: false,
    currentReading: null,
    currentEmotion: null,
    stressLevel: null,
    emotionalState: null,
    error: null,
    scanCount: 0,
    lastScanTime: null,
  })

  const [hasPermission, setHasPermission] = useState(false)

  // ========================================================================
  // 🎯 REFS
  // ========================================================================

  const servicesRef = useRef<any>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const emotionHistoryRef = useRef<BiometricReading[]>([])

  // ========================================================================
  // 🔧 INITIALIZATION
  // ========================================================================

  const initializeServices = useCallback(async () => {
    try {
      // Dynamic import
      const { createBiometricServices, initializeBiometricServices } = 
        await import('@/lib/biometric')

      // Create services
      const services = createBiometricServices({
        privacy: { mode: privacyMode },
        faceDetector: { maxNumFaces: 1, minDetectionConfidence: 0.5 },
        emotionAnalyzer: { minConfidence: 0.6, smoothingFactor: 0.7 },
      })

      // Initialize
      await initializeBiometricServices(services)

      // Set callbacks
      services.camera.setCallbacks({
        onStreamReady: () => {
          setHasPermission(true)
          console.log('✅ Camera ready')
        },
        onError: (error: Error) => {
          setHasPermission(false)
          if (isMountedRef.current) {
            setState(prev => ({ ...prev, error: error.message }))
            onError?.(error)
          }
        },
      })

      servicesRef.current = services

      if (isMountedRef.current) {
        setState(prev => ({ ...prev, isInitialized: true, error: null }))
      }

      console.log('✅ Biometric services initialized')

    } catch (error) {
      console.error('❌ Initialization error:', error)
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isInitialized: false,
          error: error instanceof Error ? error.message : 'Initialization failed',
        }))
        onError?.(error as Error)
      }
    }
  }, [privacyMode, onError])

  // ========================================================================
  // 📸 SCANNING
  // ========================================================================

  const performScan = useCallback(async (): Promise<BiometricReading | null> => {
    if (!servicesRef.current) {
      console.warn('Services not initialized')
      return null
    }

    try {
      const { processCompleteBiometricFrame } = await import('@/lib/biometric')
      
      const reading = await processCompleteBiometricFrame(
        servicesRef.current,
        userId
      )

      if (reading && isMountedRef.current) {
        // Update history
        emotionHistoryRef.current.push(reading)
        if (emotionHistoryRef.current.length > 100) {
          emotionHistoryRef.current.shift() // Keep only last 100
        }

        // Calculate emotional state from history
        const emotionalState = servicesRef.current.emotionAnalyzer.calculateEmotionalState(
          emotionHistoryRef.current.map(r => r.emotion).filter(Boolean)
        )

        // Update state
        setState(prev => ({
          ...prev,
          currentReading: reading,
          currentEmotion: reading.emotion?.emotion || null,
          stressLevel: reading.stress?.level || null,
          emotionalState,
          scanCount: prev.scanCount + 1,
          lastScanTime: Date.now(),
          error: null,
        }))

        // Callback
        onScanComplete?.(reading)

        // Save to database if enabled
        if (saveToDatabase) {
          await saveBiometricReading(reading)
        }

        return reading
      }

      return null

    } catch (error) {
      console.error('Scan error:', error)
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Scan failed',
        }))
      }
      return null
    }
  }, [userId, onScanComplete, saveToDatabase])

  const startScan = useCallback(async () => {
    // Initialize if needed
    if (!state.isInitialized) {
      await initializeServices()
    }

    if (!servicesRef.current) {
      console.error('Services not available')
      return
    }

    try {
      // Start camera
      await servicesRef.current.camera.initializeCamera()

      // Update state
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, isScanning: true, error: null }))
      }

      // Start scan loop
      scanIntervalRef.current = setInterval(async () => {
        await performScan()
      }, scanInterval)

      console.log('✅ Continuous scanning started')

    } catch (error) {
      console.error('❌ Start scan error:', error)
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isScanning: false,
          error: error instanceof Error ? error.message : 'Failed to start scanning',
        }))
        onError?.(error as Error)
      }
    }
  }, [state.isInitialized, initializeServices, scanInterval, performScan, onError])

  const stopScan = useCallback(() => {
    // Stop interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Stop camera
    if (servicesRef.current) {
      servicesRef.current.camera.cleanup()
    }

    // Update state
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isScanning: false }))
    }

    console.log('⏹️ Scanning stopped')
  }, [])

  const takeSingleScan = useCallback(async (): Promise<BiometricReading | null> => {
    // Initialize if needed
    if (!state.isInitialized) {
      await initializeServices()
    }

    if (!servicesRef.current) {
      console.error('Services not available')
      return null
    }

    try {
      // Ensure camera is started
      if (!servicesRef.current.camera.isActive()) {
        await servicesRef.current.camera.initializeCamera()
      }

      // Perform single scan
      const reading = await performScan()

      return reading

    } catch (error) {
      console.error('❌ Single scan error:', error)
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Single scan failed',
        }))
        onError?.(error as Error)
      }
      return null
    }
  }, [state.isInitialized, initializeServices, performScan, onError])

  // ========================================================================
  // 💾 DATABASE SAVE
  // ========================================================================

  const saveBiometricReading = async (reading: BiometricReading) => {
    try {
      // Import Supabase client
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()

      // Save to biometric_scans table
      const { error } = await supabase
        .from('biometric_scans')
        .insert({
          user_id: userId,
          scan_type: 'face',
          scan_data: {
            emotion: reading.emotion,
            stress: reading.stress,
            quality: reading.quality,
          },
          analysis_results: {
            emotion: reading.emotion?.emotion,
            stress_level: reading.stress?.level,
            confidence: reading.emotion?.confidence,
          },
          confidence_score: reading.emotion?.confidence || 0,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Database save error:', error)
      } else {
        console.log('✅ Reading saved to database')
      }

    } catch (error) {
      console.error('Failed to save to database:', error)
    }
  }

  // ========================================================================
  // 🎬 LIFECYCLE
  // ========================================================================

  useEffect(() => {
    isMountedRef.current = true

    // Auto-initialize
    if (autoStart) {
      initializeServices().then(() => {
        if (isMountedRef.current) {
          startScan()
        }
      })
    } else {
      initializeServices()
    }

    // Cleanup
    return () => {
      isMountedRef.current = false
      stopScan()
      if (servicesRef.current) {
        servicesRef.current.camera.cleanup()
        servicesRef.current.faceDetector.cleanup()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================================================
  // 🎯 RETURN
  // ========================================================================

  return {
    state,
    startScan,
    stopScan,
    takeSingleScan,
    services: servicesRef.current,
    isReady: state.isInitialized && hasPermission,
    hasPermission,
    canScan: state.isInitialized && hasPermission && !state.isScanning,
  }
}

// ============================================================================
// 🎯 ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook pentru tracking emoțional pe termen lung
 */
export function useEmotionTracking(userId: string) {
  const [emotionHistory, setEmotionHistory] = useState<BiometricReading[]>([])
  const [patterns, setPatterns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()

      const { data, error } = await supabase
        .from('biometric_scans')
        .select('*')
        .eq('user_id', userId)
        .eq('scan_type', 'face')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error && data) {
        // Convert to BiometricReading format
        const readings = data.map(scan => ({
          userId: scan.user_id,
          timestamp: new Date(scan.created_at).getTime(),
          emotion: scan.scan_data.emotion,
          stress: scan.scan_data.stress,
          quality: scan.scan_data.quality,
          face: null,
          metadata: scan.analysis_results,
        }))
        
        setEmotionHistory(readings)
      }
    } catch (error) {
      console.error('Failed to load emotion history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return {
    emotionHistory,
    patterns,
    isLoading,
    refresh: loadHistory,
  }
}

/**
 * Hook pentru consent management
 */
export function useBiometricConsent(userId: string) {
  const [consent, setConsent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadConsent = useCallback(async () => {
    try {
      // Load from localStorage first
      const stored = localStorage.getItem(`biometric_consent_${userId}`)
      if (stored) {
        setConsent(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load consent:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const saveConsent = useCallback(async (consentData: any) => {
    try {
      // Save to localStorage
      localStorage.setItem(`biometric_consent_${userId}`, JSON.stringify(consentData))
      setConsent(consentData)

      // Optionally save to database
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()

      await supabase
        .from('profiles')
        .update({
          metadata: {
            biometric_consent: consentData,
            consent_timestamp: new Date().toISOString(),
          },
        })
        .eq('id', userId)

      console.log('✅ Consent saved')
    } catch (error) {
      console.error('Failed to save consent:', error)
    }
  }, [userId])

  const revokeConsent = useCallback(async () => {
    try {
      localStorage.removeItem(`biometric_consent_${userId}`)
      setConsent(null)
      console.log('✅ Consent revoked')
    } catch (error) {
      console.error('Failed to revoke consent:', error)
    }
  }, [userId])

  useEffect(() => {
    loadConsent()
  }, [loadConsent])

  return {
    consent,
    isLoading,
    hasConsent: consent?.biometricCapture === true,
    saveConsent,
    revokeConsent,
  }
}

// ============================================================================
// 🎯 EXPORT
// ============================================================================

export default useBiometricScan

/**
 * USAGE EXAMPLES:
 * 
 * ```tsx
 * // Basic usage
 * function MyComponent() {
 *   const { state, startScan, stopScan, isReady } = useBiometricScan({
 *     userId: user.id,
 *     onScanComplete: (reading) => {
 *       console.log('Emotion:', reading.emotion.emotion)
 *     }
 *   })
 * 
 *   return (
 *     <div>
 *       {state.currentEmotion && (
 *         <p>Current emotion: {state.currentEmotion}</p>
 *       )}
 *       <button onClick={startScan} disabled={!isReady}>
 *         Start Scan
 *       </button>
 *     </div>
 *   )
 * }
 * 
 * // With emotion tracking
 * function EmotionDashboard() {
 *   const { emotionHistory, isLoading } = useEmotionTracking(user.id)
 * 
 *   if (isLoading) return <p>Loading...</p>
 * 
 *   return (
 *     <div>
 *       <h2>Your Emotion History</h2>
 *       {emotionHistory.map(reading => (
 *         <div key={reading.timestamp}>
 *           {reading.emotion.emotion} - {new Date(reading.timestamp).toLocaleString()}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * 
 * // With consent
 * function BiometricSetup() {
 *   const { hasConsent, saveConsent } = useBiometricConsent(user.id)
 * 
 *   const handleAccept = () => {
 *     saveConsent({
 *       biometricCapture: true,
 *       emotionAnalysis: true,
 *       dataStorage: true,
 *       timestamp: Date.now(),
 *       version: '2.0.0'
 *     })
 *   }
 * 
 *   if (!hasConsent) {
 *     return <ConsentModal onAccept={handleAccept} />
 *   }
 * 
 *   return <BiometricScanner userId={user.id} />
 * }
 * ```
 */