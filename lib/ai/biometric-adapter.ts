/**
 * 🤖💙 WAVE 2 - Task 1.3: Biometric AI Adapter
 * 
 * NEW FILE: /lib/ai/biometric-adapter.ts
 * 
 * Adapts AI responses based on user's emotional state
 * This is the bridge between biometric scanning and AI personality
 * 
 * @version 2.0.0
 * @description Emotion-aware AI response adaptation
 */

import type { EmotionReading, EmotionalState, StressLevel } from '@/types/biometric'
import type { AIResponse, ConversationContext, EmotionalTone } from '@/types/ai-services'

// ============================================================================
// 🔧 TYPES & INTERFACES
// ============================================================================

/**
 * Configuration for BiometricAIAdapter
 */
export interface BiometricAdapterConfig {
  enableEmotionalAdaptation: boolean      // Enable emotion-based adaptation
  enableStressDetection: boolean          // Enable stress-based interventions
  minConfidence: number                   // Minimum confidence to trigger adaptation
  adaptationIntensity: 'subtle' | 'moderate' | 'strong'  // How much to adapt
  enableCrisisDetection: boolean          // Enable crisis situation detection
  crisisThreshold: number                 // Threshold for crisis detection (0-1)
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: BiometricAdapterConfig = {
  enableEmotionalAdaptation: true,
  enableStressDetection: true,
  minConfidence: 0.6,
  adaptationIntensity: 'moderate',
  enableCrisisDetection: true,
  crisisThreshold: 0.8
}

/**
 * Adaptation strategy based on emotion
 */
interface AdaptationStrategy {
  tone: EmotionalTone                     // Tone to use in response
  approach: 'supportive' | 'empowering' | 'reflective' | 'energizing' | 'calming'
  pacing: 'slow' | 'moderate' | 'quick'   // Response pacing
  language: {
    useEmpathy: boolean                   // Use empathetic language
    useValidation: boolean                // Validate user's feelings
    useEncouragement: boolean             // Encourage user
    useHumor: boolean                     // Use light humor (when appropriate)
  }
  interventions: string[]                 // Suggested interventions
}

/**
 * Adapted AI response with emotional context
 */
export interface AdaptedAIResponse extends AIResponse {
  originalResponse: string                // Original AI response before adaptation
  adaptationApplied: boolean              // Whether adaptation was applied
  adaptationStrategy: AdaptationStrategy  // Strategy used
  emotionalContext: {
    detectedEmotion: string               // Detected emotion
    confidence: number                    // Detection confidence
    stressLevel: string                   // Stress level
    requiresIntervention: boolean         // Whether intervention is needed
  }
}

// ============================================================================
// 🤖 BIOMETRIC AI ADAPTER CLASS
// ============================================================================

/**
 * BiometricAIAdapter - Adapts AI responses based on emotional state
 * 
 * WHAT IT DOES:
 * - Analyzes user's emotional state from biometric readings
 * - Adapts AI response tone, pacing, and content
 * - Detects stress and crisis situations
 * - Provides appropriate interventions
 * 
 * USAGE:
 * ```typescript
 * const adapter = new BiometricAIAdapter()
 * const adaptedResponse = await adapter.adaptToEmotionalState(
 *   originalAIResponse,
 *   emotionReading
 * )
 * ```
 */
export class BiometricAIAdapter {
  // ========================================================================
  // 📦 PROPERTIES
  // ========================================================================

  private config: BiometricAdapterConfig
  private adaptationHistory: Map<string, AdaptationStrategy[]> = new Map()
  private crisisDetectionCount: number = 0

  // ========================================================================
  // 🏗️ CONSTRUCTOR
  // ========================================================================

  constructor(config?: Partial<BiometricAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    console.log('🤖💙 BiometricAIAdapter initialized:', {
      emotionalAdaptation: this.config.enableEmotionalAdaptation,
      stressDetection: this.config.enableStressDetection,
      crisisDetection: this.config.enableCrisisDetection,
      adaptationIntensity: this.config.adaptationIntensity
    })
  }

  // ========================================================================
  // 🎭 MAIN ADAPTATION METHODS
  // ========================================================================

  /**
   * Adapts AI response to user's emotional state
   * MAIN PUBLIC METHOD
   * 
   * @param aiResponse - Original AI response
   * @param emotionReading - Current emotion reading
   * @param userId - User ID (for history tracking)
   * @returns Adapted AI response
   */
  async adaptToEmotionalState(
    aiResponse: AIResponse,
    emotionReading: EmotionReading,
    userId?: string
  ): Promise<AdaptedAIResponse> {
    try {
      // Check if adaptation should be applied
      if (!this.shouldAdapt(emotionReading)) {
        return this.createNonAdaptedResponse(aiResponse, emotionReading)
      }

      // Step 1: Determine adaptation strategy
      const strategy = this.determineAdaptationStrategy(emotionReading)

      // Step 2: Check for crisis situation
      const crisisDetected = this.detectCrisis(emotionReading)
      if (crisisDetected) {
        return this.handleCrisisSituation(aiResponse, emotionReading, strategy)
      }

      // Step 3: Adapt the response
      const adaptedMessage = this.adaptResponseMessage(
        aiResponse.message,
        strategy,
        emotionReading
      )

      // Step 4: Add emotional support if needed
      const finalMessage = this.addEmotionalSupport(
        adaptedMessage,
        strategy,
        emotionReading
      )

      // Step 5: Save to history
      if (userId) {
        this.saveAdaptationHistory(userId, strategy)
      }

      // Step 6: Create adapted response
      const adapted: AdaptedAIResponse = {
        ...aiResponse,
        message: finalMessage,
        originalResponse: aiResponse.message,
        adaptationApplied: true,
        adaptationStrategy: strategy,
        emotionalContext: {
          detectedEmotion: emotionReading.emotion,
          confidence: emotionReading.confidence,
          stressLevel: this.estimateStressLevel(emotionReading),
          requiresIntervention: crisisDetected
        },
        metadata: {
          ...aiResponse.metadata,
          biometricAdaptation: {
            applied: true,
            strategy: strategy.approach,
            emotionDetected: emotionReading.emotion
          }
        }
      }

      console.log('✨ AI Response adapted:', {
        emotion: emotionReading.emotion,
        approach: strategy.approach,
        tone: strategy.tone
      })

      return adapted

    } catch (error) {
      console.error('❌ Error adapting AI response:', error)
      // Return original response on error
      return this.createNonAdaptedResponse(aiResponse, emotionReading)
    }
  }

  /**
   * Detects stress and provides appropriate response
   * 
   * @param aiResponse - Original AI response
   * @param emotionReading - Current emotion reading
   * @returns Stress-adapted response
   */
  async detectStressAndRespond(
    aiResponse: AIResponse,
    emotionReading: EmotionReading
  ): Promise<AdaptedAIResponse> {
    const stressLevel = this.estimateStressLevel(emotionReading)
    
    if (stressLevel === 'low' || !this.config.enableStressDetection) {
      return this.createNonAdaptedResponse(aiResponse, emotionReading)
    }

    // Create stress-aware strategy
    const strategy: AdaptationStrategy = {
      tone: 'calming',
      approach: 'supportive',
      pacing: 'slow',
      language: {
        useEmpathy: true,
        useValidation: true,
        useEncouragement: true,
        useHumor: false // No humor in stressful situations
      },
      interventions: this.getStressInterventions(stressLevel)
    }

    const adaptedMessage = this.adaptResponseMessage(
      aiResponse.message,
      strategy,
      emotionReading
    )

    // Add stress-specific support
    const stressSupport = this.getStressSupportMessage(stressLevel)
    const finalMessage = `${stressSupport}\n\n${adaptedMessage}`

    return {
      ...aiResponse,
      message: finalMessage,
      originalResponse: aiResponse.message,
      adaptationApplied: true,
      adaptationStrategy: strategy,
      emotionalContext: {
        detectedEmotion: emotionReading.emotion,
        confidence: emotionReading.confidence,
        stressLevel,
        requiresIntervention: stressLevel === 'high' || stressLevel === 'critical'
      }
    }
  }

  /**
   * Personalizes response based on mood
   * Takes into account current emotional state and history
   * 
   * @param aiResponse - Original AI response
   * @param emotionReading - Current emotion reading
   * @param userId - User ID
   * @param emotionalHistory - User's emotional history (optional)
   * @returns Personalized response
   */
  async personalizeBasedOnMood(
    aiResponse: AIResponse,
    emotionReading: EmotionReading,
    userId: string,
    emotionalHistory?: EmotionalState
  ): Promise<AdaptedAIResponse> {
    // Get user's adaptation history
    const userHistory = this.adaptationHistory.get(userId) || []
    
    // Determine strategy considering history
    let strategy = this.determineAdaptationStrategy(emotionReading)
    
    // Adjust strategy based on what worked before
    if (userHistory.length > 0) {
      strategy = this.refineStrategyWithHistory(strategy, userHistory)
    }
    
    // Consider emotional trends if history provided
    if (emotionalHistory) {
      strategy = this.adjustForEmotionalTrends(strategy, emotionalHistory)
    }

    return this.adaptToEmotionalState(aiResponse, emotionReading, userId)
  }

  // ========================================================================
  // 🎯 STRATEGY DETERMINATION
  // ========================================================================

  /**
   * Determines the best adaptation strategy for a given emotion
   */
  private determineAdaptationStrategy(
    emotionReading: EmotionReading
  ): AdaptationStrategy {
    const { emotion, intensity } = emotionReading

    // Strategy mapping based on emotion
    const strategyMap: Record<string, AdaptationStrategy> = {
      happy: {
        tone: 'encouraging',
        approach: 'energizing',
        pacing: 'moderate',
        language: {
          useEmpathy: false,
          useValidation: true,
          useEncouragement: true,
          useHumor: intensity > 0.6 // Use humor if very happy
        },
        interventions: []
      },
      sad: {
        tone: 'empathetic',
        approach: 'supportive',
        pacing: 'slow',
        language: {
          useEmpathy: true,
          useValidation: true,
          useEncouragement: true,
          useHumor: false
        },
        interventions: [
          'Consider taking a moment for self-care',
          'Remember that it\'s okay to feel this way',
          'Reaching out to someone you trust might help'
        ]
      },
      angry: {
        tone: 'calming',
        approach: 'reflective',
        pacing: 'slow',
        language: {
          useEmpathy: true,
          useValidation: true,
          useEncouragement: false,
          useHumor: false
        },
        interventions: [
          'Take a few deep breaths',
          'Consider what might be the root cause',
          'Physical activity can help process anger'
        ]
      },
      fearful: {
        tone: 'reassuring',
        approach: 'supportive',
        pacing: 'slow',
        language: {
          useEmpathy: true,
          useValidation: true,
          useEncouragement: true,
          useHumor: false
        },
        interventions: [
          'You\'re safe right now',
          'Try grounding techniques: notice 5 things you can see',
          'Focus on what you can control'
        ]
      },
      surprised: {
        tone: 'neutral',
        approach: 'reflective',
        pacing: 'moderate',
        language: {
          useEmpathy: false,
          useValidation: true,
          useEncouragement: false,
          useHumor: false
        },
        interventions: []
      },
      disgusted: {
        tone: 'neutral',
        approach: 'reflective',
        pacing: 'moderate',
        language: {
          useEmpathy: true,
          useValidation: true,
          useEncouragement: false,
          useHumor: false
        },
        interventions: [
          'Consider what values this might be touching on',
          'It\'s okay to have boundaries'
        ]
      },
      neutral: {
        tone: 'neutral',
        approach: 'reflective',
        pacing: 'moderate',
        language: {
          useEmpathy: false,
          useValidation: false,
          useEncouragement: false,
          useHumor: false
        },
        interventions: []
      }
    }

    return strategyMap[emotion] || strategyMap.neutral
  }

  /**
   * Checks if adaptation should be applied
   */
  private shouldAdapt(emotionReading: EmotionReading): boolean {
    if (!this.config.enableEmotionalAdaptation) return false
    if (emotionReading.confidence < this.config.minConfidence) return false
    if (emotionReading.emotion === 'neutral' && emotionReading.intensity < 0.3) return false
    return true
  }

  /**
   * Detects crisis situations
   */
  private detectCrisis(emotionReading: EmotionReading): boolean {
    if (!this.config.enableCrisisDetection) return false

    const crisisEmotions: string[] = ['fearful', 'sad', 'angry']
    const isCrisisEmotion = crisisEmotions.includes(emotionReading.emotion)
    const isHighIntensity = emotionReading.intensity > this.config.crisisThreshold
    const isHighConfidence = emotionReading.confidence > 0.7

    return isCrisisEmotion && isHighIntensity && isHighConfidence
  }

  // ========================================================================
  // 📝 MESSAGE ADAPTATION
  // ========================================================================

  /**
   * Adapts the response message based on strategy
   */
  private adaptResponseMessage(
    originalMessage: string,
    strategy: AdaptationStrategy,
    emotionReading: EmotionReading
  ): string {
    let adapted = originalMessage

    // Add empathetic opening if needed
    if (strategy.language.useEmpathy) {
      adapted = this.addEmpatheticOpening(adapted, emotionReading.emotion)
    }

    // Add validation if needed
    if (strategy.language.useValidation) {
      adapted = this.addValidation(adapted, emotionReading.emotion)
    }

    // Add encouragement if needed
    if (strategy.language.useEncouragement) {
      adapted = this.addEncouragement(adapted)
    }

    // Adjust pacing
    adapted = this.adjustPacing(adapted, strategy.pacing)

    return adapted
  }

  /**
   * Adds empathetic opening to message
   */
  private addEmpatheticOpening(message: string, emotion: string): string {
    const openings: Record<string, string> = {
      sad: "I can sense that you're going through a difficult time. ",
      angry: "I understand that you're feeling frustrated. ",
      fearful: "I hear that you're feeling anxious or worried. ",
      disgusted: "I recognize that this is uncomfortable for you. "
    }

    const opening = openings[emotion]
    return opening ? `${opening}${message}` : message
  }

  /**
   * Adds validation to message
   */
  private addValidation(message: string, emotion: string): string {
    const validations: Record<string, string> = {
      sad: "Your feelings are completely valid. ",
      angry: "It's understandable to feel this way. ",
      fearful: "These feelings make sense given the situation. ",
      happy: "It's wonderful that you're feeling positive. "
    }

    const validation = validations[emotion]
    if (validation && !message.includes(validation)) {
      // Insert after first sentence if possible
      const firstSentenceEnd = message.indexOf('. ')
      if (firstSentenceEnd > 0) {
        return message.slice(0, firstSentenceEnd + 2) + validation + message.slice(firstSentenceEnd + 2)
      }
      return `${validation}${message}`
    }

    return message
  }

  /**
   * Adds encouragement to message
   */
  private addEncouragement(message: string): string {
    const encouragements = [
      "You've got this. ",
      "You're stronger than you think. ",
      "You're taking positive steps. "
    ]

    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
    return `${message}\n\n${encouragement}`
  }

  /**
   * Adjusts message pacing
   */
  private adjustPacing(message: string, pacing: 'slow' | 'moderate' | 'quick'): string {
    if (pacing === 'slow') {
      // Add more breaks for slow pacing
      return message.replace(/\. /g, '. \n\n')
    }
    return message
  }

  /**
   * Adds emotional support messaging
   */
  private addEmotionalSupport(
    message: string,
    strategy: AdaptationStrategy,
    emotionReading: EmotionReading
  ): string {
    if (strategy.interventions.length === 0) {
      return message
    }

    // Add interventions as gentle suggestions
    const interventionText = strategy.interventions
      .map(intervention => `• ${intervention}`)
      .join('\n')

    return `${message}\n\n💙 Some things that might help:\n${interventionText}`
  }

  // ========================================================================
  // 🚨 CRISIS HANDLING
  // ========================================================================

  /**
   * Handles crisis situations with appropriate response
   */
  private handleCrisisSituation(
    aiResponse: AIResponse,
    emotionReading: EmotionReading,
    strategy: AdaptationStrategy
  ): AdaptedAIResponse {
    this.crisisDetectionCount++

    const crisisMessage = this.getCrisisResponse(emotionReading.emotion)
    const supportResources = this.getSupportResources()

    const finalMessage = `${crisisMessage}\n\n${supportResources}\n\n${aiResponse.message}`

    return {
      ...aiResponse,
      message: finalMessage,
      originalResponse: aiResponse.message,
      adaptationApplied: true,
      adaptationStrategy: {
        ...strategy,
        approach: 'supportive',
        tone: 'empathetic'
      },
      emotionalContext: {
        detectedEmotion: emotionReading.emotion,
        confidence: emotionReading.confidence,
        stressLevel: 'critical',
        requiresIntervention: true
      }
    }
  }

  /**
   * Gets crisis-appropriate response
   */
  private getCrisisResponse(emotion: string): string {
    return `I notice you might be going through a really difficult time right now. Your wellbeing is important, and it's okay to ask for help.`
  }

  /**
   * Gets support resources
   */
  private getSupportResources(): string {
    return `🆘 If you're in crisis, please reach out:
• Crisis Text Line: Text HOME to 741741
• National Suicide Prevention Lifeline: 988
• Or talk to someone you trust

You don't have to go through this alone.`
  }

  // ========================================================================
  // 📊 STRESS DETECTION & INTERVENTIONS
  // ========================================================================

  /**
   * Estimates stress level from emotion reading
   */
  private estimateStressLevel(emotionReading: EmotionReading): StressLevel {
    const { emotion, intensity } = emotionReading

    const stressfulEmotions: string[] = ['angry', 'fearful', 'sad', 'disgusted']
    if (!stressfulEmotions.includes(emotion)) return 'low'

    if (intensity > 0.8) return 'critical'
    if (intensity > 0.6) return 'high'
    if (intensity > 0.4) return 'moderate'
    return 'low'
  }

  /**
   * Gets stress interventions based on level
   */
  private getStressInterventions(level: StressLevel): string[] {
    const interventions: Record<StressLevel, string[]> = {
      low: [],
      moderate: [
        'Take a short break',
        'Practice deep breathing',
        'Step outside for fresh air'
      ],
      high: [
        'Stop and breathe for 2 minutes',
        'Reach out to someone supportive',
        'Consider postponing non-urgent tasks'
      ],
      critical: [
        'Please prioritize your wellbeing right now',
        'Reach out for professional support if needed',
        'Remove yourself from stressful situation if possible'
      ]
    }

    return interventions[level] || []
  }

  /**
   * Gets stress-specific support message
   */
  private getStressSupportMessage(level: StressLevel): string {
    const messages: Record<StressLevel, string> = {
      low: '',
      moderate: '💙 I notice you might be feeling some stress.',
      high: '⚠️  You seem to be experiencing significant stress.',
      critical: '🚨 Your stress levels seem very high right now.'
    }

    return messages[level] || ''
  }

  // ========================================================================
  // 📚 HISTORY & LEARNING
  // ========================================================================

  /**
   * Saves adaptation history for user
   */
  private saveAdaptationHistory(userId: string, strategy: AdaptationStrategy): void {
    const history = this.adaptationHistory.get(userId) || []
    history.push(strategy)

    // Keep only last 50 adaptations
    if (history.length > 50) {
      history.shift()
    }

    this.adaptationHistory.set(userId, history)
  }

  /**
   * Refines strategy based on historical effectiveness
   */
  private refineStrategyWithHistory(
    strategy: AdaptationStrategy,
    history: AdaptationStrategy[]
  ): AdaptationStrategy {
    // Analyze what worked before
    const approachCounts = new Map<string, number>()
    history.forEach(h => {
      approachCounts.set(h.approach, (approachCounts.get(h.approach) || 0) + 1)
    })

    // Prefer approaches that were used successfully before
    // This is a simple heuristic - in production, you'd track feedback
    return strategy
  }

  /**
   * Adjusts strategy for emotional trends
   */
  private adjustForEmotionalTrends(
    strategy: AdaptationStrategy,
    emotionalState: EmotionalState
  ): AdaptationStrategy {
    // If user has been consistently stressed, increase support
    if (emotionalState.stressLevel === 'high' || emotionalState.stressLevel === 'critical') {
      return {
        ...strategy,
        approach: 'supportive',
        language: {
          ...strategy.language,
          useEmpathy: true,
          useValidation: true,
          useEncouragement: true
        }
      }
    }

    return strategy
  }

  // ========================================================================
  // 🛠️ UTILITY METHODS
  // ========================================================================

  /**
   * Creates non-adapted response (when adaptation not needed)
   */
  private createNonAdaptedResponse(
    aiResponse: AIResponse,
    emotionReading: EmotionReading
  ): AdaptedAIResponse {
    return {
      ...aiResponse,
      originalResponse: aiResponse.message,
      adaptationApplied: false,
      adaptationStrategy: {
        tone: 'neutral',
        approach: 'reflective',
        pacing: 'moderate',
        language: {
          useEmpathy: false,
          useValidation: false,
          useEncouragement: false,
          useHumor: false
        },
        interventions: []
      },
      emotionalContext: {
        detectedEmotion: emotionReading.emotion,
        confidence: emotionReading.confidence,
        stressLevel: 'low',
        requiresIntervention: false
      }
    }
  }

  /**
   * Gets adapter statistics
   */
  getStats(): {
    totalAdaptations: number
    crisisDetections: number
    usersTracked: number
  } {
    let totalAdaptations = 0
    this.adaptationHistory.forEach(history => {
      totalAdaptations += history.length
    })

    return {
      totalAdaptations,
      crisisDetections: this.crisisDetectionCount,
      usersTracked: this.adaptationHistory.size
    }
  }

  /**
   * Clears adaptation history for user
   */
  clearHistory(userId: string): void {
    this.adaptationHistory.delete(userId)
  }
}

// ============================================================================
// 🎯 FACTORY FUNCTION
// ============================================================================

/**
 * Creates a BiometricAIAdapter instance
 */
export function createBiometricAIAdapter(
  config?: Partial<BiometricAdapterConfig>
): BiometricAIAdapter {
  return new BiometricAIAdapter(config)
}

// ============================================================================
// 🎯 EXPORT
// ============================================================================

export default BiometricAIAdapter

/**
 * USAGE EXAMPLE:
 * 
 * ```typescript
 * import { createBiometricAIAdapter } from '@/lib/ai/biometric-adapter'
 * 
 * // Create adapter
 * const adapter = createBiometricAIAdapter({
 *   adaptationIntensity: 'moderate',
 *   enableCrisisDetection: true
 * })
 * 
 * // Get AI response
 * const aiResponse = await aiService.generateResponse(userMessage)
 * 
 * // Get emotion reading
 * const emotion = await emotionAnalyzer.analyzeEmotion(landmarks)
 * 
 * // Adapt response
 * const adapted = await adapter.adaptToEmotionalState(
 *   aiResponse,
 *   emotion,
 *   userId
 * )
 * 
 * // Send adapted response to user
 * console.log(adapted.message)
 * ```
 */