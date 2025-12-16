// lib/ai/ai-service-manager.ts
/**
 * 🎯 PorVerse V2 - AI Service Manager
 * Core AI service managing OpenAI and Anthropic models for portal guidance
 * 
 * @version 2.0.0 - WAVE 2 UPDATED
 * @author PorVerse Development Team
 * @description AI brain for personalized spiritual guidance and coaching with biometric adaptation
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createBiometricAIAdapter, type BiometricAIAdapter } from './biometric-adapter'
import type { EmotionReading } from '../../types/biometric'
import type {
  UserPortalProgress,
  BiometricReading,
  CulturalContext,
  ServiceResponse
} from '../../types/portal-management'

/**
 * AI service configuration
 */
interface AIServiceConfig {
  openAIKey: string
  anthropicKey: string
  defaultModel: 'openai' | 'anthropic'
  maxTokens: number
  temperature: number
  enableCaching: boolean
  enableCrisisDetection: boolean
  culturalAdaptation: boolean
  enableBiometricAdaptation: boolean // WAVE 2 NEW
}

/**
 * AI conversation context
 */
interface ConversationContext {
  userId: string
  portalId: string
  currentStep?: string
  userProgress: UserPortalProgress
  culturalContext?: CulturalContext
  biometricData?: BiometricReading[]
  conversationHistory: ConversationMessage[]
  currentEmotion?: EmotionReading // WAVE 2 NEW
}

/**
 * Conversation message
 */
interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

/**
 * AI guidance response
 */
interface AIGuidance {
  message: string
  tone: 'supportive' | 'challenging' | 'neutral' | 'celebratory'
  actionItems: string[]
  nextSteps: string[]
  confidenceScore: number
  culturallyAdapted: boolean
  crisisDetected: boolean
  resourceRecommendations: AIResource[]
  biometricallyAdapted?: boolean // WAVE 2 NEW
  emotionDetected?: string // WAVE 2 NEW
}

/**
 * AI resource recommendation
 */
interface AIResource {
  type: 'meditation' | 'article' | 'video' | 'exercise' | 'reflection'
  title: string
  description: string
  url?: string
  duration?: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Crisis detection result
 */
interface CrisisDetection {
  detected: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  indicators: string[]
  recommendedActions: string[]
  emergencyContacts?: string[]
}

/**
 * AI Service Manager Class - WAVE 2 UPDATED
 * Manages AI model selection, conversation routing, response generation, and biometric adaptation
 */
export class AIServiceManager {
  private openai: OpenAI
  private anthropic: Anthropic
  private config: AIServiceConfig
  private conversationCache: Map<string, ConversationMessage[]> = new Map()
  private biometricAdapter: BiometricAIAdapter // WAVE 2 NEW

  /**
   * Initialize AI Service Manager - WAVE 2 UPDATED
   */
  constructor(config: AIServiceConfig) {
    this.config = config
    
    this.openai = new OpenAI({
      apiKey: config.openAIKey
    })
    
    this.anthropic = new Anthropic({
      apiKey: config.anthropicKey
    })

    // WAVE 2 NEW: Initialize biometric adapter
    this.biometricAdapter = createBiometricAIAdapter({
      adaptationIntensity: 'moderate',
      enableCrisisDetection: config.enableCrisisDetection,
      enableStressDetection: true
    })

    console.log('🎯 AI Service Manager initialized:', {
      defaultModel: config.defaultModel,
      biometricAdaptation: config.enableBiometricAdaptation,
      crisisDetection: config.enableCrisisDetection,
      culturalAdaptation: config.culturalAdaptation
    })
  }

  // ============================================================================
  // CORE AI GUIDANCE METHODS - WAVE 2 UPDATED
  // ============================================================================

  /**
   * Generate personalized portal guidance - WAVE 2 UPDATED with biometric adaptation
   * @param context - Conversation context with user and portal data
   * @returns AI guidance response
   */
  async generatePortalGuidance(context: ConversationContext): Promise<ServiceResponse<AIGuidance>> {
    try {
      const startTime = Date.now()

      // Select appropriate AI model based on context
      const model = this.selectOptimalModel(context)

      // Build culturally adapted prompt
      const prompt = this.buildGuidancePrompt(context)

      // Generate base AI response
      const baseResponse = await this.generateResponse(model, prompt, context)

      // WAVE 2 NEW: Adapt response based on current emotion if available
      let finalResponse = baseResponse
      let biometricallyAdapted = false
      let emotionDetected = undefined

      if (this.config.enableBiometricAdaptation && context.currentEmotion) {
        console.log('🎭 Adapting AI response to detected emotion:', context.currentEmotion.emotion)
        
        try {
          // Create a simple AIResponse object for the adapter
          const aiResponse = {
            message: baseResponse,
            metadata: {}
          }

          // Adapt the response using biometric adapter
          const adapted = await this.biometricAdapter.adaptToEmotionalState(
            aiResponse,
            context.currentEmotion,
            context.userId
          )

          if (adapted.adaptationApplied) {
            finalResponse = adapted.message
            biometricallyAdapted = true
            emotionDetected = context.currentEmotion.emotion
            console.log('✨ Response adapted successfully for emotion:', emotionDetected)
          }
        } catch (adaptError) {
          console.error('⚠️  Biometric adaptation failed, using base response:', adaptError)
          // Continue with base response if adaptation fails
        }
      }

      // Detect potential crisis indicators
      const crisisDetection = this.config.enableCrisisDetection ? 
        await this.detectCrisis(finalResponse) : null

      // Generate resource recommendations
      const resources = await this.generateResourceRecommendations(context, finalResponse)

      const guidance: AIGuidance = {
        message: finalResponse,
        tone: this.analyzeTone(context, finalResponse),
        actionItems: this.extractActionItems(finalResponse),
        nextSteps: this.generateNextSteps(context, finalResponse),
        confidenceScore: this.calculateConfidenceScore(context, finalResponse),
        culturallyAdapted: this.config.culturalAdaptation && !!context.culturalContext,
        crisisDetected: crisisDetection?.detected || false,
        resourceRecommendations: resources,
        biometricallyAdapted, // WAVE 2 NEW
        emotionDetected // WAVE 2 NEW
      }

      return {
        success: true,
        data: guidance,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          cache_hit: false,
          api_version: '2.0.0',
          biometric_adaptation_applied: biometricallyAdapted // WAVE 2 NEW
        }
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AI_GUIDANCE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate guidance',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Create new conversation with portal-specific AI personality
   * @param userId - User identifier
   * @param portalId - Portal identifier
   * @param initialContext - Initial conversation setup
   * @returns Conversation identifier
   */
  async createConversation(
    _userId: string,
    portalId: string,
    initialContext: Partial<ConversationContext>
  ): Promise<ServiceResponse<string>> {
    try {
      const conversationId = crypto.randomUUID()
      
      // Initialize conversation with system prompt
      const systemPrompt = await this.buildPortalSystemPrompt(portalId, initialContext.culturalContext)
      
      const initialMessages: ConversationMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: systemPrompt,
          timestamp: new Date().toISOString()
        }
      ]

      // Cache conversation
      this.conversationCache.set(conversationId, initialMessages)

      return {
        success: true,
        data: conversationId
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONVERSATION_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create conversation',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Process user message and generate AI response - WAVE 2 UPDATED
   * @param conversationId - Conversation identifier
   * @param userMessage - User's message
   * @param context - Current context including biometrics and progress
   * @param currentEmotion - Current emotion reading (WAVE 2 NEW)
   * @returns AI response
   */
  async processUserMessage(
    conversationId: string,
    userMessage: string,
    context: Partial<ConversationContext>,
    currentEmotion?: EmotionReading // WAVE 2 NEW parameter
  ): Promise<ServiceResponse<AIGuidance>> {
    try {
      const conversation = this.conversationCache.get(conversationId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // Add user message to conversation
      const userMsg: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        metadata: {
          biometricData: context.biometricData,
          progressData: context.userProgress,
          emotion: currentEmotion?.emotion // WAVE 2 NEW
        }
      }

      conversation.push(userMsg)

      // Build full context for AI - WAVE 2 UPDATED with emotion
      const fullContext: ConversationContext = {
        userId: context.userId || '',
        portalId: context.portalId || '',
        currentStep: context.currentStep,
        userProgress: context.userProgress!,
        culturalContext: context.culturalContext,
        biometricData: context.biometricData,
        conversationHistory: conversation,
        currentEmotion // WAVE 2 NEW
      }

      // Generate guidance
      const guidanceResponse = await this.generatePortalGuidance(fullContext)

      if (guidanceResponse.success && guidanceResponse.data) {
        // Add AI response to conversation
        const aiMsg: ConversationMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: guidanceResponse.data.message,
          timestamp: new Date().toISOString(),
          metadata: {
            tone: guidanceResponse.data.tone,
            confidenceScore: guidanceResponse.data.confidenceScore,
            biometricallyAdapted: guidanceResponse.data.biometricallyAdapted // WAVE 2 NEW
          }
        }

        conversation.push(aiMsg)
        this.conversationCache.set(conversationId, conversation)
      }

      return guidanceResponse

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MESSAGE_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process message',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * WAVE 2 NEW: Generate response with automatic biometric adaptation
   * Convenience method that handles emotion detection automatically
   * 
   * @param userMessage - User's message
   * @param context - Conversation context
   * @param emotionReading - Optional emotion reading
   * @returns Adapted AI guidance
   */
  async generateAdaptedResponse(
    userMessage: string,
    context: ConversationContext,
    emotionReading?: EmotionReading
  ): Promise<ServiceResponse<AIGuidance>> {
    // If emotion reading provided, add to context
    if (emotionReading && emotionReading.confidence > 0.6) {
      context.currentEmotion = emotionReading
    }

    // Generate normal guidance (will auto-adapt if emotion present)
    return this.generatePortalGuidance(context)
  }

  /**
   * WAVE 2 NEW: Detect stress and adapt response accordingly
   * Specialized method for stress-aware responses
   * 
   * @param baseResponse - Base AI response
   * @param emotionReading - Current emotion reading
   * @param userId - User ID
   * @returns Stress-adapted response
   */
  async adaptResponseForStress(
    baseResponse: string,
    emotionReading: EmotionReading,
    userId: string
  ): Promise<string> {
    try {
      const aiResponse = {
        message: baseResponse,
        metadata: {}
      }

      const adapted = await this.biometricAdapter.detectStressAndRespond(
        aiResponse,
        emotionReading
      )

      return adapted.message
    } catch (error) {
      console.error('❌ Stress adaptation failed:', error)
      return baseResponse
    }
  }

  // ============================================================================
  // MODEL SELECTION & OPTIMIZATION
  // ============================================================================

  /**
   * Select optimal AI model based on context
   */
  private selectOptimalModel(context: ConversationContext): 'openai' | 'anthropic' {
    // Use Anthropic for deeper philosophical discussions
    if (context.portalId.includes('quantum') || context.portalId.includes('mind')) {
      return 'anthropic'
    }

    // Use OpenAI for health and practical guidance
    if (context.portalId.includes('health') || context.portalId.includes('flow')) {
      return 'openai'
    }

    // Default to configured preference
    return this.config.defaultModel
  }

  /**
   * Generate AI response using selected model
   */
  private async generateResponse(
    model: 'openai' | 'anthropic',
    prompt: string,
    context: ConversationContext
  ): Promise<string> {
    if (model === 'openai') {
      return this.generateOpenAIResponse(prompt, context)
    } else {
      return this.generateAnthropicResponse(prompt, context)
    }
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    prompt: string,
    context: ConversationContext
  ): Promise<string> {
    const messages = [
      ...context.conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      { role: 'user' as const, content: prompt }
    ]

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    })

    return completion.choices[0]?.message?.content || ''
  }

  /**
   * Generate response using Anthropic Claude
   */
  private async generateAnthropicResponse(
    prompt: string,
    context: ConversationContext
  ): Promise<string> {
    const systemPrompt = context.conversationHistory.find(msg => msg.role === 'system')?.content || ''
    const userMessages = context.conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }))

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: [...userMessages, { role: 'user', content: prompt }]
    })

    return response.content[0]?.type === 'text' ? response.content[0].text : ''
  }

  // ============================================================================
  // PROMPT BUILDING & CULTURAL ADAPTATION
  // ============================================================================

  /**
   * Build guidance prompt with cultural adaptation - WAVE 2 UPDATED
   */
  private buildGuidancePrompt(context: ConversationContext): string {
    let prompt = `You are a wise, compassionate spiritual guide helping a user progress through the ${this.getPortalName(context.portalId)} portal. `

    // Add cultural context
    if (context.culturalContext) {
      prompt += this.addCulturalAdaptation(context.culturalContext)
    }

    // Add progress context
    prompt += `The user is currently ${this.calculateCompletionPercentage(context.userProgress)}% complete with this portal. `

    // WAVE 2 NEW: Add current emotion context (will be further adapted by BiometricAIAdapter)
    if (context.currentEmotion) {
      prompt += `The user's current emotional state is ${context.currentEmotion.emotion} with ${(context.currentEmotion.confidence * 100).toFixed(0)}% confidence. `
    }

    // Add biometric context
    if (context.biometricData && context.biometricData.length > 0) {
      prompt += this.addBiometricContext(context.biometricData)
    }

    // Add current step context
    if (context.currentStep) {
      prompt += `They are currently working on step: ${context.currentStep}. `
    }

    prompt += `Provide personalized guidance that is encouraging, practical, and aligned with their spiritual journey. `
    prompt += `Keep responses concise but meaningful (2-3 paragraphs maximum). `
    prompt += `Include specific action items they can take next.`

    return prompt
  }

  /**
   * Build portal-specific system prompt
   */
  private async buildPortalSystemPrompt(
    portalId: string,
    culturalContext?: CulturalContext
  ): Promise<string> {
    const portalPersonalities = {
      activation: "You are an encouraging activation guide, helping users discover their inner potential and take the first steps on their spiritual journey.",
      foundation: "You are a grounding foundation teacher, helping users establish solid spiritual practices and core principles for growth.",
      health: "You are a holistic health coach, integrating physical, mental, and spiritual wellness approaches.",
      mind: "You are a mindfulness and meditation teacher, guiding users toward mental clarity and emotional balance.",
      flow: "You are a productivity and flow guide, helping users align their actions with their spiritual purpose.",
      well: "You are a sanctuary keeper, creating spaces of peace and healing for deep restoration.",
      quantum: "You are a consciousness explorer, guiding users through advanced spiritual concepts and quantum awareness."
    } as const

    const portalCategory = this.getPortalCategory(portalId) as keyof typeof portalPersonalities
    let systemPrompt = portalPersonalities[portalCategory] || portalPersonalities.activation

    // Add cultural sensitivity
    if (culturalContext) {
      systemPrompt += ` Always respect and incorporate insights from the user's cultural background (${culturalContext.primary_language}, ${culturalContext.country_code}).`
    }

    systemPrompt += ` Your responses should be warm, non-judgmental, and practical. Focus on actionable guidance that respects the user's individual path.`

    return systemPrompt
  }

  /**
   * Add cultural adaptation to prompt
   */
  private addCulturalAdaptation(culturalContext: CulturalContext): string {
    let adaptation = `Consider the user's cultural background: `
    
    if (culturalContext.primary_language !== 'en') {
      adaptation += `They primarily speak ${culturalContext.primary_language}. `
    }

    if (culturalContext.cultural_values.length > 0) {
      const values = culturalContext.cultural_values.map(v => v.category).join(', ')
      adaptation += `Their cultural values emphasize ${values}. `
    }

    if (culturalContext.religious_preferences) {
      adaptation += `They have expressed interest in ${culturalContext.religious_preferences.join(', ')} perspectives. `
    }

    adaptation += `Adapt your guidance to be culturally sensitive and relevant. `

    return adaptation
  }

  /**
   * Add biometric context to prompt
   */
  private addBiometricContext(biometricData: BiometricReading[]): string {
    const latestReading = biometricData[biometricData.length - 1]
    
    let context = `Based on their current biometric readings: `
    
    if (latestReading.type === 'face_emotion') {
      const emotionLevel = latestReading.values.overall || 50
      if (emotionLevel > 70) {
        context += `they appear to be in a positive emotional state. `
      } else if (emotionLevel < 30) {
        context += `they may be experiencing some emotional challenges. `
      } else {
        context += `they appear to be in a neutral emotional state. `
      }
    }

    context += `Consider this in your guidance and adjust your tone accordingly. `

    return context
  }

  // ============================================================================
  // RESPONSE ANALYSIS & EXTRACTION
  // ============================================================================

  /**
   * Analyze tone of AI response
   */
  private analyzeTone(_context: ConversationContext, response: string): 'supportive' | 'challenging' | 'neutral' | 'celebratory' {
    const celebratoryWords = ['congratulations', 'amazing', 'wonderful', 'celebrate', 'proud']
    const supportiveWords = ['support', 'gentle', 'patience', 'compassion', 'understand']
    const challengingWords = ['challenge', 'push', 'growth', 'discomfort', 'breakthrough']

    const lowerResponse = response.toLowerCase()

    if (celebratoryWords.some(word => lowerResponse.includes(word))) {
      return 'celebratory'
    }

    if (challengingWords.some(word => lowerResponse.includes(word))) {
      return 'challenging'
    }

    if (supportiveWords.some(word => lowerResponse.includes(word))) {
      return 'supportive'
    }

    return 'neutral'
  }

  /**
   * Extract action items from response
   */
  private extractActionItems(response: string): string[] {
    const actionItems: string[] = []
    
    // Look for numbered lists
    const numberedMatches = response.match(/\d+\.\s*([^.\n]+)/g)
    if (numberedMatches) {
      actionItems.push(...numberedMatches.map(match => match.replace(/^\d+\.\s*/, '')))
    }

    // Look for bullet points
    const bulletMatches = response.match(/[•·-]\s*([^.\n]+)/g)
    if (bulletMatches) {
      actionItems.push(...bulletMatches.map(match => match.replace(/^[•·-]\s*/, '')))
    }

    // Look for action verbs
    const actionVerbs = ['try', 'practice', 'focus', 'meditate', 'reflect', 'journal', 'breathe']
    const sentences = response.split(/[.!?]/)
    
    for (const sentence of sentences) {
      if (actionVerbs.some(verb => sentence.toLowerCase().includes(verb))) {
        actionItems.push(sentence.trim())
      }
    }

    return actionItems.slice(0, 5) // Limit to 5 action items
  }

  /**
   * Generate next steps based on context and response
   */
  private generateNextSteps(context: ConversationContext, _response: string): string[] {
    const nextSteps: string[] = []

    // Calculate completion percentage from progress data
    const completionPercentage = this.calculateCompletionPercentage(context.userProgress)

    // Based on progress level
    if (completionPercentage < 25) {
      nextSteps.push('Continue with the current portal step')
      nextSteps.push('Set aside time for regular practice')
    } else if (completionPercentage < 75) {
      nextSteps.push('Deepen your current practices')
      nextSteps.push('Reflect on your progress so far')
    } else {
      nextSteps.push('Prepare for portal completion')
      nextSteps.push('Consider the next portal in your journey')
    }

    return nextSteps
  }

  /**
   * Calculate completion percentage from user progress data
   */
  private calculateCompletionPercentage(progress: UserPortalProgress): number {
    // Assuming UserPortalProgress has properties to calculate completion
    // This is a fallback implementation that should be adjusted based on actual UserPortalProgress structure
    if ('completed_steps' in progress && 'total_steps' in progress) {
      return ((progress as any).completed_steps / (progress as any).total_steps) * 100
    }
    
    // Default to 50% if we can't determine progress
    return 50
  }

  /**
   * Calculate confidence score for AI response
   */
  private calculateConfidenceScore(context: ConversationContext, response: string): number {
    let score = 0.7 // Base confidence

    // Increase confidence with more context
    if (context.biometricData && context.biometricData.length > 0) score += 0.1
    if (context.culturalContext) score += 0.1
    if (context.conversationHistory.length > 2) score += 0.1
    if (context.currentEmotion) score += 0.05 // WAVE 2 NEW

    // Adjust based on response length and quality
    if (response.length > 200 && response.length < 1000) score += 0.05
    if (this.extractActionItems(response).length > 0) score += 0.05

    return Math.min(0.95, score) // Cap at 95%
  }

  // ============================================================================
  // CRISIS DETECTION
  // ============================================================================

  /**
   * Detect crisis indicators in conversation
   */
  private async detectCrisis(response: string): Promise<CrisisDetection> {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'hopeless', 'worthless',
      'can\'t go on', 'want to die', 'no point', 'give up'
    ]

    const indicators: string[] = []
    const lowerResponse = response.toLowerCase()

    for (const keyword of crisisKeywords) {
      if (lowerResponse.includes(keyword)) {
        indicators.push(keyword)
      }
    }

    const detected = indicators.length > 0
    const severity = indicators.length > 2 ? 'critical' : 
                    indicators.length > 1 ? 'high' : 'medium'

    return {
      detected,
      severity,
      indicators,
      recommendedActions: detected ? [
        'Connect with a mental health professional',
        'Contact emergency services if in immediate danger',
        'Reach out to a trusted friend or family member'
      ] : []
    }
  }

  // ============================================================================
  // RESOURCE RECOMMENDATIONS
  // ============================================================================

  /**
   * Generate resource recommendations
   */
  private async generateResourceRecommendations(
    context: ConversationContext,
    _response: string
  ): Promise<AIResource[]> {
    const resources: AIResource[] = []

    // Basic meditation resource
    resources.push({
      type: 'meditation',
      title: 'Guided Mindfulness Meditation',
      description: 'A gentle 10-minute meditation to center yourself',
      duration: 10,
      difficulty: 'beginner'
    })

    // Portal-specific resources based on context
    const portalCategory = this.getPortalCategory(context.portalId)
    
    switch (portalCategory) {
      case 'health':
        resources.push({
          type: 'exercise',
          title: 'Holistic Wellness Check-in',
          description: 'Assess your physical, mental, and spiritual health',
          duration: 15,
          difficulty: 'beginner'
        })
        break
        
      case 'mind':
        resources.push({
          type: 'reflection',
          title: 'Mind Clarity Journal',
          description: 'Reflect on your thoughts and mental patterns',
          duration: 20,
          difficulty: 'intermediate'
        })
        break
    }

    return resources
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getPortalName(portalId: string): string {
    // TODO: Fetch from database or config
    return portalId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  private getPortalCategory(portalId: string): string {
    if (portalId.includes('activation')) return 'activation'
    if (portalId.includes('foundation')) return 'foundation'
    if (portalId.includes('health')) return 'health'
    if (portalId.includes('mind')) return 'mind'
    if (portalId.includes('flow')) return 'flow'
    if (portalId.includes('well')) return 'well'
    if (portalId.includes('quantum')) return 'quantum'
    return 'activation'
  }

  // ============================================================================
  // WAVE 2 NEW: UTILITY METHODS FOR BIOMETRIC ADAPTER
  // ============================================================================

  /**
   * Get biometric adapter statistics
   */
  getBiometricAdapterStats(): {
    totalAdaptations: number
    crisisDetections: number
    usersTracked: number
  } {
    return this.biometricAdapter.getStats()
  }

  /**
   * Clear biometric adaptation history for a user
   */
  clearBiometricHistory(userId: string): void {
    this.biometricAdapter.clearHistory(userId)
  }
}

/**
 * Create AI Service Manager instance - WAVE 2 UPDATED
 */
export function createAIServiceManager(overrides?: Partial<AIServiceConfig>): AIServiceManager {
  const config: AIServiceConfig = {
    openAIKey: process.env['OPENAI_API_KEY']!,
    anthropicKey: process.env['ANTHROPIC_API_KEY']!,
    defaultModel: 'openai',
    maxTokens: 1500,
    temperature: 0.7,
    enableCaching: true,
    enableCrisisDetection: true,
    culturalAdaptation: true,
    enableBiometricAdaptation: true, // WAVE 2 NEW - enabled by default
    ...overrides
  }

  return new AIServiceManager(config)
}

export default AIServiceManager

/**
 * ✅ WAVE 2 - AI SERVICE MANAGER UPDATED! 🎉
 * 
 * NEW CAPABILITIES:
 * ✅ BiometricAIAdapter integration
 * ✅ Automatic emotion-based response adaptation
 * ✅ Stress detection and specialized responses
 * ✅ Current emotion tracking in conversation context
 * ✅ Biometric adaptation statistics
 * ✅ Enhanced confidence scoring with emotion data
 * 
 * USAGE:
 * const aiService = createAIServiceManager()
 * 
 * // With emotion detection:
 * const response = await aiService.generateAdaptedResponse(
 *   userMessage,
 *   context,
 *   emotionReading // from biometric scan
 * )
 * 
 * // Response will be automatically adapted based on user's emotional state!
 */