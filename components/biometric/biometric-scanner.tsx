/**
 * 📸 PorVerse V2 - Biometric Scanner Component
 * React component pentru scanare biometrică în timp real
 * 
 * @version 2.0.0 - WAVE 2 UPDATED
 * @description Component complet cu cameră, detectare față, afișare emoții și salvare Supabase
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

import type {
  BiometricReading,
  EmotionType,
  StressLevel,
  QualityScore,
  FaceDetection,
} from '@/types/biometric'

// ============================================================================
// 🎨 TYPES & INTERFACES
// ============================================================================

interface BiometricScannerProps {
  userId?: string // WAVE 2 UPDATED: Made optional, will fetch from Supabase if not provided
  onScanComplete?: (reading: BiometricReading) => void
  onEmotionDetected?: (emotion: EmotionType, reading: BiometricReading) => void // WAVE 2 NEW
  onError?: (error: Error) => void
  autoStart?: boolean
  scanInterval?: number
  showOverlay?: boolean
  showQuality?: boolean
  showEmotion?: boolean
  privacyMode?: 'strict' | 'balanced' | 'permissive' // WAVE 2: Used for storage
  enableStorage?: boolean // WAVE 2 NEW: Enable/disable Supabase storage
  className?: string
}

interface ScanState {
  isInitializing: boolean
  isScanning: boolean
  currentEmotion: EmotionType | null
  stressLevel: StressLevel | null
  quality: QualityScore | null
  error: string | null
  fps: number
  lastSavedReadingId?: string // WAVE 2 NEW
  totalScansStored?: number // WAVE 2 NEW
}

// ============================================================================
// 🎭 EMOTION CONFIG
// ============================================================================

const EMOTION_CONFIG: Record<EmotionType, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '😊', color: '#10b981', label: 'Fericit' },
  sad: { emoji: '😢', color: '#3b82f6', label: 'Trist' },
  angry: { emoji: '😠', color: '#ef4444', label: 'Nervos' },
  surprised: { emoji: '😲', color: '#f59e0b', label: 'Surprins' },
  fearful: { emoji: '😨', color: '#8b5cf6', label: 'Speriat' },
  disgusted: { emoji: '🤢', color: '#14b8a6', label: 'Dezgustat' },
  neutral: { emoji: '😐', color: '#6b7280', label: 'Neutru' },
}

const STRESS_CONFIG: Record<StressLevel, { color: string; label: string; icon: string }> = {
  low: { color: '#10b981', label: 'Scăzut', icon: '✓' },
  moderate: { color: '#f59e0b', label: 'Moderat', icon: '!' },
  high: { color: '#ef4444', label: 'Ridicat', icon: '!!' },
  critical: { color: '#dc2626', label: 'Critical', icon: '⚠️' },
}

// ============================================================================
// 📸 BIOMETRIC SCANNER COMPONENT - WAVE 2 UPDATED
// ============================================================================

export function BiometricScanner({
  userId: propUserId,
  onScanComplete,
  onEmotionDetected, // WAVE 2 NEW
  onError,
  autoStart = false,
  scanInterval = 1000,
  showOverlay = true,
  showQuality = true,
  showEmotion = true,
  privacyMode = 'balanced', // WAVE 2: Changed default from 'strict' to 'balanced'
  enableStorage = true, // WAVE 2 NEW: Default to true
  className = '',
}: BiometricScannerProps) {
  // ========================================================================
  // 🎯 REFS
  // ========================================================================
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const servicesRef = useRef<any>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(Date.now())

  // ========================================================================
  // 📊 STATE
  // ========================================================================
  
  const [state, setState] = useState<ScanState>({
    isInitializing: false,
    isScanning: false,
    currentEmotion: null,
    stressLevel: null,
    quality: null,
    error: null,
    fps: 0,
    totalScansStored: 0, // WAVE 2 NEW
  })

  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [availableCameras, setAvailableCameras] = useState<any[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(propUserId || null) // WAVE 2 NEW

  // ========================================================================
  // WAVE 2 NEW: GET USER ID FROM SUPABASE
  // ========================================================================

  useEffect(() => {
    const getUserId = async () => {
      // If userId provided as prop, use it
      if (propUserId) {
        setCurrentUserId(propUserId)
        return
      }

      // Otherwise, fetch from Supabase
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('❌ Error getting user:', error)
          return
        }

        if (user) {
          setCurrentUserId(user.id)
          console.log('✅ User ID loaded:', user.id)
        } else {
          console.warn('⚠️  No user logged in - biometric storage will be disabled')
        }
      } catch (error) {
        console.error('❌ Error fetching user:', error)
      }
    }

    getUserId()
  }, [propUserId])

  // ========================================================================
  // 🎬 INITIALIZATION
  // ========================================================================

  const initializeServices = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isInitializing: true, error: null }))

      // Dynamic import pentru a evita SSR issues
      const { createBiometricServices, initializeBiometricServices } = await import('@/lib/biometric')

      // Creăm serviciile
      const services = createBiometricServices({
        privacy: { mode: privacyMode },
        faceDetector: { maxNumFaces: 1 },
        emotionAnalyzer: { minConfidence: 0.6 },
      })

      // Inițializăm
      await initializeBiometricServices(services)

      // Atașăm video element
      if (videoRef.current) {
        services.camera.attachVideoElement(videoRef.current)
      }

      // Setăm callbacks
      services.camera.setCallbacks({
        onError: (error: Error) => {
          setState(prev => ({ ...prev, error: error.message }))
          onError?.(error)
        },
        onStreamReady: () => {
          setCameraPermission('granted')
        },
        onStreamEnded: () => {
          stopScanning()
        },
      })

      // Obținem camerele disponibile
      const cameras = await services.camera.getAvailableCameras()
      setAvailableCameras(cameras)

      servicesRef.current = services
      setState(prev => ({ ...prev, isInitializing: false }))

      console.log('✅ Biometric Scanner initialized')

    } catch (error) {
      console.error('❌ Initialization error:', error)
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      }))
      onError?.(error as Error)
    }
  }, [privacyMode, onError])

  // ========================================================================
  // 📸 SCANNING - WAVE 2 UPDATED with Supabase storage
  // ========================================================================

  const startScanning = useCallback(async () => {
    if (!servicesRef.current) {
      await initializeServices()
    }

    try {
      setState(prev => ({ ...prev, isScanning: true, error: null }))

      // Pornim camera
      await servicesRef.current.camera.initializeCamera()

      // Pornim loop-ul de scanare
      scanIntervalRef.current = setInterval(async () => {
        try {
          const { processCompleteBiometricFrame } = await import('@/lib/biometric')
          
          // WAVE 2 UPDATED: Now we need userId for storage
          const userIdForScan = currentUserId || 'anonymous'
          
          // Procesăm frame-ul
          const reading = await processCompleteBiometricFrame(
            servicesRef.current,
            userIdForScan
          )

          if (reading) {
            // Update state
            setState(prev => ({
              ...prev,
              currentEmotion: reading.emotion?.emotion || null,
              stressLevel: reading.stress?.level || null,
              quality: reading.quality ? {
                overall: reading.quality.isGoodQuality ? 0.8 : 0.5,
                factors: {
                  size: reading.quality.faceSize / 150,
                  lighting: reading.quality.brightness,
                  sharpness: reading.quality.sharpness,
                  pose: 1.0,
                },
                isAcceptable: reading.quality.isGoodQuality,
                suggestions: [],
              } : null,
            }))

            // WAVE 2 NEW: Store to Supabase if enabled and user is logged in
            if (enableStorage && currentUserId && reading.emotion) {
              try {
                // Import emotion analyzer for storage
                const { createEmotionAnalyzer } = await import('@/lib/biometric/emotion-analyzer')
                const emotionAnalyzer = createEmotionAnalyzer()

                // Store the reading
                const readingId = await emotionAnalyzer.storeBiometricReading(
                  currentUserId,
                  reading.emotion,
                  privacyMode
                )

                // Update state with storage info
                setState(prev => ({
                  ...prev,
                  lastSavedReadingId: readingId,
                  totalScansStored: (prev.totalScansStored || 0) + 1,
                }))

                console.log('✅ Biometric reading stored:', readingId)

              } catch (storageError) {
                // Don't stop scanning if storage fails
                console.error('⚠️  Storage failed (continuing scan):', storageError)
              }
            }

            // WAVE 2 NEW: Emotion detection callback
            if (reading.emotion && onEmotionDetected) {
              onEmotionDetected(reading.emotion.emotion, reading)
            }

            // FPS tracking
            frameCountRef.current++
            const now = Date.now()
            if (now - lastFpsUpdateRef.current >= 1000) {
              setState(prev => ({ ...prev, fps: frameCountRef.current }))
              frameCountRef.current = 0
              lastFpsUpdateRef.current = now
            }

            // Original callback
            onScanComplete?.(reading)

            // Draw overlay
            if (showOverlay && canvasRef.current && reading.face) {
              drawFaceOverlay(reading.face)
            }
          }
        } catch (scanError) {
          console.error('Scan error:', scanError)
        }
      }, scanInterval)

      console.log('✅ Scanning started')

    } catch (error) {
      console.error('❌ Start scanning error:', error)
      setState(prev => ({
        ...prev,
        isScanning: false,
        error: error instanceof Error ? error.message : 'Failed to start scanning',
      }))
      onError?.(error as Error)
    }
  }, [currentUserId, scanInterval, showOverlay, enableStorage, privacyMode, onScanComplete, onEmotionDetected, onError, initializeServices])

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setState(prev => ({
      ...prev,
      isScanning: false,
      currentEmotion: null,
      stressLevel: null,
      quality: null,
      fps: 0,
    }))

    console.log('⏹️ Scanning stopped')
  }, [])

  const switchCamera = useCallback(async (cameraId: string) => {
    if (!servicesRef.current) {return}

    try {
      await servicesRef.current.camera.switchCamera(cameraId)
      setSelectedCameraId(cameraId)
      console.log('✅ Camera switched:', cameraId)
    } catch (error) {
      console.error('❌ Switch camera error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to switch camera',
      }))
    }
  }, [])

  // ========================================================================
  // 🎨 DRAWING
  // ========================================================================

  const drawFaceOverlay = useCallback((faceDetection: FaceDetection) => {
    const canvas = canvasRef.current
    if (!canvas) {return}

    const ctx = canvas.getContext('2d')
    if (!ctx) {return}

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw bounding box
    const bbox = faceDetection.boundingBox
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.strokeRect(
      bbox.x * canvas.width,
      bbox.y * canvas.height,
      bbox.width * canvas.width,
      bbox.height * canvas.height
    )

    // Draw landmarks (optional - poate fi heavy)
    if (faceDetection.landmarks && faceDetection.landmarks.landmarks.length < 50) {
      ctx.fillStyle = '#10b981'
      faceDetection.landmarks.landmarks.forEach((landmark) => {
        ctx.beginPath()
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          2,
          0,
          2 * Math.PI
        )
        ctx.fill()
      })
    }
  }, [])

  // ========================================================================
  // 🧹 CLEANUP
  // ========================================================================

  useEffect(() => {
    if (autoStart && currentUserId) {
      initializeServices().then(() => startScanning())
    }

    return () => {
      stopScanning()
      if (servicesRef.current) {
        servicesRef.current.camera.cleanup()
      }
    }
  }, [currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================================================
  // 🎨 RENDER
  // ========================================================================

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Overlay Canvas */}
        {showOverlay && (
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}

        {/* Loading Overlay */}
        {state.isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg font-medium">Inițializare cameră...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {state.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white p-6">
              <p className="text-2xl mb-2">❌</p>
              <p className="text-lg font-medium mb-2">Eroare</p>
              <p className="text-sm text-gray-300">{state.error}</p>
              <button
                onClick={startScanning}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Încearcă din nou
              </button>
            </div>
          </div>
        )}

        {/* Emotion Display */}
        {showEmotion && state.currentEmotion && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">
                {EMOTION_CONFIG[state.currentEmotion].emoji}
              </span>
              <div>
                <p className="text-white font-medium text-lg">
                  {EMOTION_CONFIG[state.currentEmotion].label}
                </p>
                <p className="text-gray-400 text-sm">Emoție detectată</p>
              </div>
            </div>

            {/* Stress Level */}
            {state.stressLevel && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600">
                <span className="text-lg">
                  {STRESS_CONFIG[state.stressLevel].icon}
                </span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    Stress: {STRESS_CONFIG[state.stressLevel].label}
                  </p>
                  <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${
                          state.stressLevel === 'low' ? 25 :
                          state.stressLevel === 'moderate' ? 50 :
                          state.stressLevel === 'high' ? 75 : 100
                        }%`,
                        backgroundColor: STRESS_CONFIG[state.stressLevel].color,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WAVE 2 NEW: Storage Status */}
            {enableStorage && currentUserId && state.totalScansStored !== undefined && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <p className="text-gray-400 text-xs">
                  💾 {state.totalScansStored} scanări salvate
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quality Indicators */}
        {showQuality && state.quality && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 min-w-[150px]">
            <p className="text-white text-sm font-medium mb-2">
              {state.quality.isAcceptable ? '✓ Calitate bună' : '⚠️ Calitate slabă'}
            </p>
            <div className="space-y-1">
              <QualityBar label="Mărime" value={state.quality.factors.size} />
              <QualityBar label="Lumină" value={state.quality.factors.lighting} />
              <QualityBar label="Claritate" value={state.quality.factors.sharpness} />
            </div>
          </div>
        )}

        {/* FPS Counter (Debug) */}
        {state.isScanning && (
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
            <p className="text-white text-xs font-mono">{state.fps} FPS</p>
          </div>
        )}

        {/* WAVE 2 NEW: No user warning */}
        {!currentUserId && enableStorage && (
          <div className="absolute bottom-4 left-4 bg-yellow-900/70 backdrop-blur-sm rounded-lg px-3 py-2">
            <p className="text-yellow-200 text-xs">
              ⚠️ Scanările nu vor fi salvate (user neautentificat)
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-4">
        {/* Start/Stop Button */}
        <button
          onClick={state.isScanning ? stopScanning : startScanning}
          disabled={state.isInitializing}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            state.isScanning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {state.isInitializing ? (
            'Inițializare...'
          ) : state.isScanning ? (
            '⏹️ Oprește Scanarea'
          ) : (
            '▶️ Pornește Scanarea'
          )}
        </button>

        {/* Camera Selector */}
        {availableCameras.length > 1 && (
          <select
            value={selectedCameraId || ''}
            onChange={(e) => switchCamera(e.target.value)}
            disabled={state.isInitializing}
            className="px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {availableCameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                📸 {camera.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Status Messages */}
      {cameraPermission === 'denied' && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-800 text-sm">
            ⛔ Acces la cameră refuzat. Te rog permite accesul la cameră în setările browser-ului.
          </p>
        </div>
      )}

      {/* WAVE 2 NEW: Storage info */}
      {enableStorage && currentUserId && state.totalScansStored !== undefined && state.totalScansStored > 0 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm">
            ✅ Salvare activă: <strong>{state.totalScansStored}</strong> scanări în această sesiune
            {state.lastSavedReadingId && (
              <span className="text-xs block mt-1 text-green-600">
                Ultimul ID: {state.lastSavedReadingId.slice(0, 8)}...
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 🎨 HELPER COMPONENTS
// ============================================================================

function QualityBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100)
  const color = value > 0.7 ? '#10b981' : value > 0.4 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-300 mb-1">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// 🎯 EXPORT
// ============================================================================

export default BiometricScanner

/**
 * ✅ WAVE 2 - BIOMETRIC SCANNER UPDATED! 🎉
 * 
 * NEW CAPABILITIES:
 * ✅ Automatic Supabase storage integration
 * ✅ User ID fetching from Supabase auth
 * ✅ Privacy mode support (strict/balanced/permissive)
 * ✅ Storage enable/disable toggle
 * ✅ onEmotionDetected callback
 * ✅ Storage statistics display
 * ✅ User authentication status warnings
 * 
 * USAGE EXAMPLES:
 * 
 * ```tsx
 * // Basic usage (auto storage)
 * <BiometricScanner
 *   onScanComplete={handleScan}
 *   autoStart={true}
 * />
 * 
 * // With emotion callback for AI adaptation
 * <BiometricScanner
 *   onScanComplete={handleScan}
 *   onEmotionDetected={(emotion, reading) => {
 *     // Pass to AI service for adaptation
 *     console.log('Detected:', emotion)
 *   }}
 *   enableStorage={true}
 *   privacyMode="balanced"
 * />
 * 
 * // Without storage (demo mode)
 * <BiometricScanner
 *   onScanComplete={handleScan}
 *   enableStorage={false}
 * />
 * ```
 */