/**
 * 🎭 PorVerse V2 - Biometric System Types
 * Complete type definitions for biometric recognition and emotion analysis
 * 
 * @version 2.0.0 - ENTERPRISE FIXED
 * @author PorVerse Development Team
 * @description Production-ready type definitions with full type safety
 */

// ============================================================================
// 📸 CAMERA & MEDIA TYPES
// ============================================================================

/**
 * Camera configuration settings
 * Controls video capture parameters and device selection
 */
export interface CameraConfig {
  width: number                              // Video width in pixels (e.g., 1280)
  height: number                             // Video height in pixels (e.g., 720)
  facingMode: 'user' | 'environment'         // 'user' = front camera, 'environment' = back camera
  frameRate?: number                         // Target frames per second (e.g., 30)
  deviceId?: string                          // Specific camera device ID (if multiple cameras)
}

/**
 * Information about an available camera device
 * Describes a video input device
 */
export interface CameraDeviceInfo {
  deviceId: string                           // Unique device identifier
  label: string                              // Human-readable device name
  kind: 'videoinput'                         // Device type (always 'videoinput' for cameras)
  groupId: string                            // Device group identifier
}

/**
 * Current state of the camera
 * Tracks camera status and errors
 */
export interface CameraState {
  isActive: boolean                          // Is camera currently active?
  isRecording: boolean                       // Is recording in progress?
  currentDeviceId: string | null             // Active camera device ID (null if none)
  error: string | null                       // Error message (null if no error)
  lastFrameTime: number                      // Timestamp of last captured frame
}

// ============================================================================
// 👤 FACE DETECTION TYPES
// ============================================================================

/**
 * Single landmark point on face
 * Represents a detected facial feature point
 */
export interface FaceLandmark {
  x: number                                  // Horizontal position (0-1 normalized)
  y: number                                  // Vertical position (0-1 normalized)
  z?: number                                 // Depth (optional, for 3D detection)
  confidence: number                         // Detection confidence (0-1)
}

/**
 * Complete set of facial landmarks
 * MediaPipe detects 468 landmark points
 */
export interface FaceLandmarks {
  landmarks: FaceLandmark[]                  // Array of 468 facial landmarks
  timestamp: number                          // Detection timestamp (milliseconds)
}

/**
 * Complete face detection result
 * All information about a detected face
 */
export interface FaceDetection {
  landmarks: FaceLandmarks                   // All facial landmark points
  boundingBox: BoundingBox                   // Face bounding rectangle
  confidence: number                         // Overall detection confidence (0-1)
  faceId?: string                           // Unique tracking ID (optional)
}

/**
 * Rectangular bounding box for face
 * Defines the region containing the face
 */
export interface BoundingBox {
  x: number                                  // Left edge position
  y: number                                  // Top edge position
  width: number                              // Box width
  height: number                             // Box height
}

/**
 * Quality metrics for face detection
 * Assesses suitability for analysis
 */
export interface FaceMetrics {
  faceSize: number                           // Face size in pixels
  brightness: number                         // Lighting quality (0=dark, 1=good, 2=bright)
  sharpness: number                          // Image sharpness (0=blurry, 1=sharp)
  headPose: HeadPose                         // Head orientation
  isGoodQuality: boolean                     // Overall quality assessment
}

/**
 * Head pose estimation
 * 3D orientation of the head
 */
export interface HeadPose {
  yaw: number                                // Left-right rotation (-90 to +90 degrees)
  pitch: number                              // Up-down rotation (-90 to +90 degrees)
  roll: number                               // Tilt rotation (-90 to +90 degrees)
}

/**
 * Quality score for detection
 * Comprehensive quality assessment with recommendations
 */
export interface QualityScore {
  overall: number                            // Overall quality score (0-1)
  factors: {
    size: number                            // Face size quality (0-1)
    lighting: number                        // Lighting quality (0-1)
    sharpness: number                       // Image sharpness (0-1)
    pose: number                            // Head pose quality (0-1)
  }
  isAcceptable: boolean                      // Is quality sufficient for analysis?
  suggestions: string[]                      // Improvement suggestions
}

// ============================================================================
// 😊 EMOTION ANALYSIS TYPES
// ============================================================================

/**
 * Basic emotion types
 * 7 universally recognized fundamental emotions
 */
export type EmotionType =
  | 'happy'                                  // Happy 😊
  | 'sad'                                    // Sad 😢
  | 'angry'                                  // Angry 😠
  | 'surprised'                              // Surprised 😲
  | 'fearful'                                // Fearful 😨
  | 'disgusted'                              // Disgusted 🤢
  | 'neutral'                                // Neutral 😐

/**
 * Emotion scores for all basic emotions
 * Probability distribution across emotions
 */
export interface EmotionScores {
  happy: number                              // Happy probability (0-1)
  sad: number                                // Sad probability (0-1)
  angry: number                              // Angry probability (0-1)
  surprised: number                          // Surprised probability (0-1)
  fearful: number                            // Fearful probability (0-1)
  disgusted: number                          // Disgusted probability (0-1)
  neutral: number                            // Neutral probability (0-1)
}

/**
 * Single emotion reading at a point in time
 * Detected emotion with metadata
 * 
 * @property emotion - Primary detected emotion
 * @property type - Alternative emotion field (for backwards compatibility)
 * @property confidence - Detection confidence (0-1)
 * @property intensity - Emotion intensity (0-1)
 * @property timestamp - Reading timestamp (milliseconds)
 * @property valence - Emotional valence: positive/negative (-1 to +1, optional)
 * @property arousal - Emotional arousal: calm/excited (0-1, optional)
 * @property rawScores - Raw confidence scores for all emotions (optional, for debugging/analysis)
 */
export interface EmotionReading {
  emotion: EmotionType                       // Primary detected emotion
  type?: EmotionType                         // Alternative emotion field (backwards compatibility)
  confidence: number                         // Detection confidence (0-1)
  intensity: number                          // Emotion intensity (0-1)
  timestamp: number                          // Reading timestamp (milliseconds)
  valence?: number                           // Emotional valence (-1 to +1)
  arousal?: number                           // Emotional arousal (0-1)
  rawScores?: Record<string, number>         // Raw scores for all emotions (TensorFlow or rule-based)
}

/**
 * Emotional state over a time period
 * Aggregated emotion data with analysis
 * 
 * @property dominantEmotion - Most frequent emotion in period
 * @property emotionDistribution - Distribution of all emotions
 * @property averageIntensity - Average emotion intensity (0-1)
 * @property stressLevel - Detected stress level
 * @property valence - Average emotional valence (-1 to +1)
 * @property arousal - Average emotional arousal (0-1)
 * @property emotionalStability - How stable emotions are (0-1, higher = more stable)
 */
export interface EmotionalState {
  dominantEmotion: EmotionType               // Most frequent emotion
  emotionDistribution: Record<EmotionType, number>  // Emotion distribution
  averageIntensity: number                   // Average intensity (0-1)
  stressLevel: StressLevel                   // Stress level assessment
  valence: number                            // Average valence (-1 to +1)
  arousal: number                            // Average arousal (0-1)
  emotionalStability: number                 // Emotional stability (0-1)
}

/**
 * Emotional pattern recognition
 * Detected patterns in emotional behavior
 */
export interface EmotionalPattern {
  userId: string                             // User identifier
  patternType: 'daily' | 'weekly' | 'monthly'  // Pattern time period
  dominantEmotions: EmotionType[]            // Primary emotions in pattern
  triggers: string[]                         // Identified triggers
  improvements: string[]                     // Observed improvements
  concerns: string[]                         // Areas of concern
  confidence: number                         // Pattern confidence (0-1)
}

/**
 * Emotion report with insights
 * Comprehensive emotional analysis report
 */
export interface EmotionReport {
  userId: string                             // User identifier
  timeRange: TimeRange                       // Report time range
  dominantEmotion: EmotionType               // Most frequent emotion
  emotionDistribution: Record<EmotionType, number>  // Emotion breakdown
  averageIntensity: number                   // Average intensity (0-1)
  stressLevel: StressLevel                   // Overall stress level
  insights: string[]                         // Generated insights
  recommendations: string[]                  // Recommendations
}

// ============================================================================
// 📊 STRESS & WELLBEING TYPES
// ============================================================================

/**
 * Stress level categories
 * Classification of stress intensity
 */
export type StressLevel =
  | 'low'                                    // Low stress - all good ✅
  | 'moderate'                               // Moderate stress - be aware ⚠️
  | 'high'                                   // High stress - take action 🔴
  | 'critical'                               // Critical stress - urgent attention 🚨

/**
 * Detailed stress assessment
 * Complete stress analysis with factors
 */
export interface StressScore {
  level: StressLevel                         // Stress level category
  value: number                              // Numeric stress value (0-100)
  factors: {
    facial: number                          // Facial stress indicators (0-1)
    temporal: number                        // Temporal stress patterns (0-1)
    contextual: number                      // Contextual stress factors (0-1)
  }
  recommendations: string[]                  // Stress reduction recommendations
  timestamp: number                          // Assessment timestamp
}

// ============================================================================
// 🔐 PRIVACY TYPES
// ============================================================================

/**
 * Privacy mode settings
 * Controls data processing and storage
 */
export type PrivacyMode =
  | 'strict'                                 // Strict - all processing on-device only
  | 'balanced'                               // Balanced - minimal anonymized data
  | 'permissive'                             // Permissive - full functionality

/**
 * User consent levels
 * Tracks user permissions for data processing
 */
export interface ConsentLevel {
  biometricCapture: boolean                  // Allow biometric capture?
  emotionAnalysis: boolean                   // Allow emotion analysis?
  dataStorage: boolean                       // Allow data storage?
  analytics: boolean                         // Allow analytics?
  sharing: boolean                           // Allow data sharing?
  timestamp: number                          // Consent timestamp
  version: string                            // Terms version accepted
}

/**
 * Encrypted data container
 * Stores encrypted biometric data
 */
export interface EncryptedData {
  data: string                               // Encrypted data (base64)
  algorithm: string                          // Encryption algorithm (e.g., 'AES-256')
  iv: string                                 // Initialization vector
  timestamp: number                          // Encryption timestamp
}

/**
 * Data usage audit log
 * Tracks all data access and usage
 */
export interface DataUsageAudit {
  userId: string                             // User identifier
  actions: DataUsageAction[]                 // List of data actions
  summary: {
    totalAccesses: number                   // Total data accesses
    lastAccess: number                      // Last access timestamp
    purposes: string[]                      // Access purposes
  }
}

/**
 * Single data usage action
 * Records a single data access event
 */
export interface DataUsageAction {
  action: string                             // Action type (e.g., 'read', 'analyze')
  timestamp: number                          // Action timestamp
  purpose: string                            // Action purpose
  dataType: string                           // Type of data accessed
  location: 'device' | 'cloud'               // Processing location
}

/**
 * Anonymized biometric reading
 * Privacy-safe biometric data (GDPR compliant)
 */
export interface AnonymizedBiometricReading {
  readingId: string                          // Reading identifier (NOT user ID)
  timestamp: number                          // Reading timestamp
  emotionCategory: string                    // General emotion category
  stressCategory: string                     // General stress category
  qualityScore: number                       // Quality score (0-1)
  // NO userId, NO face data, NO identifiable information
}

// ============================================================================
// ⚙️ CONFIGURATION TYPES
// ============================================================================

/**
 * Complete biometric system configuration
 * All settings for the biometric system
 */
export interface BiometricConfig {
  camera: CameraConfig                       // Camera settings
  faceDetection: {
    minConfidence: number                   // Minimum detection confidence (0-1)
    maxFaces: number                        // Maximum faces to detect
    smoothing: boolean                      // Enable landmark smoothing
  }
  emotionAnalysis: {
    enabled: boolean                        // Enable emotion analysis
    updateInterval: number                  // Update interval (milliseconds)
    minConfidence: number                   // Minimum confidence (0-1)
  }
  privacy: {
    mode: PrivacyMode                       // Privacy mode
    onDeviceOnly: boolean                   // Process only on device
    dataRetention: number                   // Data retention period (days)
    anonymize: boolean                      // Anonymize data
  }
  performance: {
    targetFps: number                       // Target frames per second
    maxLatency: number                      // Maximum latency (milliseconds)
    useWebWorker: boolean                   // Use Web Worker for processing
  }
}

// ============================================================================
// 📦 COMPLETE BIOMETRIC READING
// ============================================================================

/**
 * Complete biometric reading
 * All biometric data at a point in time
 */
export interface BiometricReading {
  userId: string                             // User identifier
  timestamp: number                          // Reading timestamp (milliseconds)
  face: FaceDetection | null                 // Face detection data (null if not detected)
  emotion: EmotionReading | null             // Emotion data (null if not analyzed)
  stress: StressScore | null                 // Stress data (null if not calculated)
  quality: FaceMetrics | null                // Quality metrics (null if not assessed)
  metadata: {
    sessionId: string                       // Session identifier
    portalId?: string                       // Portal ID (if in portal context)
    context?: string                        // Additional context
  }
}

// ============================================================================
// 🕐 TIME RANGE TYPE
// ============================================================================

/**
 * Time range specification
 * Defines a time period for queries and reports
 */
export interface TimeRange {
  start: number                              // Start timestamp (milliseconds)
  end: number                                // End timestamp (milliseconds)
}

// ============================================================================
// 🎯 TYPE EXPORTS COMPLETE
// ============================================================================

/**
 * All biometric types are now defined with:
 * ✅ Full type safety
 * ✅ Comprehensive documentation
 * ✅ Enterprise-grade structure
 * ✅ GDPR compliance support
 * ✅ Privacy-first design
 * 
 * Ready for production use! 🚀
 */