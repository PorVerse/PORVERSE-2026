// lib/ai/advanced-conversation-manager.ts
import { createClient } from '@/lib/supabase/client';
import { personalityEngine, type PersonalityProfile } from './personality-engine';
import { AIServiceManager } from './ai-service-manager';

export interface ConversationContext {
  userId: string;
  conversationId: string;
  currentEmotion?: string;
  emotionalHistory: Array<{
    emotion: string;
    timestamp: string;
    intensity: number;
  }>;
  personality?: PersonalityProfile;
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export class AdvancedConversationManager {
  private supabase = createClient();
  private aiService: AIServiceManager;
  private contexts: Map<string, ConversationContext> = new Map();

  constructor() {
    this.aiService = new AIServiceManager();
  }

  /**
   * 1. MAINTAIN EMOTIONAL CONTEXT
   * Păstrează istoricul emoțional în conversație
   */
  async maintainEmotionalContext(
    userId: string,
    conversationId: string,
    currentEmotion: string,
    intensity: number
  ): Promise<void> {
    let context = this.contexts.get(conversationId);
    
    if (!context) {
      context = {
        userId,
        conversationId,
        emotionalHistory: [],
        recentMessages: []
      };
    }

    // Adaugă emoția curentă la istoric
    context.emotionalHistory.push({
      emotion: currentEmotion,
      timestamp: new Date().toISOString(),
      intensity
    });

    // Păstrează doar ultimele 10 emoții
    if (context.emotionalHistory.length > 10) {
      context.emotionalHistory = context.emotionalHistory.slice(-10);
    }

    context.currentEmotion = currentEmotion;
    this.contexts.set(conversationId, context);

    // Salvează în database
    await this.saveContext(conversationId, context);
  }

  /**
   * 2. ADAPT CONVERSATION FLOW
   * Adaptează flow-ul conversației bazat pe emoții
   */
  async adaptConversationFlow(
    conversationId: string,
    userMessage: string
  ): Promise<string> {
    const context = await this.getContext(conversationId);
    
    if (!context) {
      throw new Error('Conversation context not found');
    }

    // Verifică dacă e o criză emoțională
    const isInCrisis = this.detectEmotionalCrisis(context);
    if (isInCrisis) {
      return this.handleEmotionalCrisis(context, userMessage);
    }

    // Construiește profilul de personalitate dacă nu există
    if (!context.personality) {
      context.personality = await personalityEngine.buildPersonalityProfile(
        context.userId
      );
      this.contexts.set(conversationId, context);
    }

    // Generează răspunsul AI-ului
    let response = await this.generateAIResponse(context, userMessage);

    // Adaptează răspunsul bazat pe personalitate și emoție
    response = await personalityEngine.adaptResponseStyle(
      context.userId,
      response
    );

    if (context.currentEmotion) {
      response = await personalityEngine.integrateEmotionalContext(
        context.userId,
        response,
        context.currentEmotion
      );
    }

    // Salvează mesajul în istoric
    context.recentMessages.push(
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    );

    // Păstrează doar ultimele 20 mesaje
    if (context.recentMessages.length > 20) {
      context.recentMessages = context.recentMessages.slice(-20);
    }

    this.contexts.set(conversationId, context);
    await this.saveContext(conversationId, context);

    return response;
  }

  /**
   * 3. HANDLE EMOTIONAL CRISIS
   * Detectează și gestionează situații de criză
   */
  async handleEmotionalCrisis(
    context: ConversationContext,
    userMessage: string
  ): Promise<string> {
    console.log('🚨 Emotional crisis detected');

    // Keywords pentru criză
    const crisisKeywords = [
      'suicide', 'kill myself', 'want to die', 'end it all',
      'hurt myself', 'no point', 'give up'
    ];

    const hasCrisisKeyword = crisisKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (hasCrisisKeyword) {
      // Răspuns pentru criză severă
      return `I'm really concerned about what you're sharing. Your safety is the most important thing right now. 

Please reach out to a crisis helpline immediately:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International: findahelpline.com

I'm here to support you, but I'm not equipped to handle crisis situations. Please talk to a trained professional who can help. 💙`;
    }

    // Pentru criză moderată (anxietate, stress extrem)
    return `I can sense you're going through a really difficult time. Let's take a moment to breathe together. 

What you're feeling is valid, and it's okay to not be okay. Would you like to talk about what's weighing on you? I'm here to listen without judgment. 

If you need professional support, I can help you find resources. 🌸`;
  }

  /**
   * 4. DETECT EMOTIONAL CRISIS
   * Detectează dacă user-ul e într-o criză emoțională
   */
  private detectEmotionalCrisis(context: ConversationContext): boolean {
    const recentEmotions = context.emotionalHistory.slice(-5);
    
    // Verifică dacă ultimele 3+ emoții sunt negative cu intensitate mare
    const negativeEmotions = ['sad', 'angry', 'anxious', 'stressed', 'depressed'];
    const crisisCount = recentEmotions.filter(e =>
      negativeEmotions.includes(e.emotion) && e.intensity > 0.7
    ).length;

    return crisisCount >= 3;
  }

  /**
   * 5. GENERATE AI RESPONSE
   * Generează răspunsul de la AI service
   */
  private async generateAIResponse(
    context: ConversationContext,
    userMessage: string
  ): Promise<string> {
    // Construiește prompt-ul cu context
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.recentMessages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: userMessage }
    ];

    // Folosește AI Service Manager existent
    const response = await this.aiService.generateResponse(
      messages,
      {
        portalId: 'P0', // Default portal
        temperature: 0.7,
        maxTokens: 500
      }
    );

    return response.content;
  }

  /**
   * 6. BUILD SYSTEM PROMPT
   * Construiește prompt-ul pentru AI cu context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    let prompt = 'You are a helpful AI assistant in PorVerse, a consciousness exploration platform.';

    if (context.personality) {
      prompt += `\n\nUser personality:
- Communication style: ${context.personality.communicationStyle}
- Learning style: ${context.personality.learningStyle}
- Strengths: ${context.personality.strengths.join(', ')}
- Challenges: ${context.personality.challenges.join(', ')}`;
    }

    if (context.currentEmotion) {
      prompt += `\n\nCurrent emotional state: ${context.currentEmotion}
Please adapt your tone and approach accordingly.`;
    }

    return prompt;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getContext(conversationId: string): Promise<ConversationContext | null> {
    // Încearcă din cache
    let context = this.contexts.get(conversationId);
    if (context) return context;

    // Încarcă din database
    const { data } = await this.supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!data) return null;

    context = {
      userId: data.user_id,
      conversationId: data.id,
      emotionalHistory: data.emotional_history || [],
      recentMessages: data.messages || [],
      currentEmotion: data.current_emotion
    };

    this.contexts.set(conversationId, context);
    return context;
  }

  private async saveContext(
    conversationId: string,
    context: ConversationContext
  ): Promise<void> {
    await this.supabase
      .from('ai_conversations')
      .upsert({
        id: conversationId,
        user_id: context.userId,
        emotional_history: context.emotionalHistory,
        messages: context.recentMessages,
        current_emotion: context.currentEmotion,
        updated_at: new Date().toISOString()
      });
  }
}

// Export singleton
export const conversationManager = new AdvancedConversationManager();