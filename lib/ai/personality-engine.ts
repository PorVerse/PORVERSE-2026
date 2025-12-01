// lib/ai/personality-engine.ts
import { createClient } from '@/lib/supabase/client';

export interface PersonalityProfile {
  userId: string;
  communicationStyle: 'direct' | 'friendly' | 'formal' | 'casual';
  emotionalPatterns: {
    dominant: string;
    frequency: Record<string, number>;
  };
  learningStyle: 'visual' | 'textual' | 'interactive';
  preferences: {
    tone: string;
    complexity: 'simple' | 'detailed' | 'technical';
  };
  strengths: string[];
  challenges: string[];
  lastUpdated: string;
}

export class PersonalityEngine {
  private supabase = createClient();
  private profiles: Map<string, PersonalityProfile> = new Map();

  /**
   * 1. BUILD PERSONALITY PROFILE
   * Colectează date despre user și construiește profilul
   */
  async buildPersonalityProfile(userId: string): Promise<PersonalityProfile> {
    console.log('🧠 Building personality profile for:', userId);

    // Fetch data din database
    const [biometricData, conversationData, progressData] = await Promise.all([
      this.fetchBiometricHistory(userId),
      this.fetchConversationHistory(userId),
      this.fetchUserProgress(userId)
    ]);

    // Analizează patterns
    const emotionalPatterns = this.analyzeEmotionalPatterns(biometricData);
    const communicationStyle = this.analyzeCommunicationStyle(conversationData);
    const learningStyle = this.analyzeLearningStyle(progressData);

    // Construiește profilul
    const profile: PersonalityProfile = {
      userId,
      communicationStyle,
      emotionalPatterns,
      learningStyle,
      preferences: {
        tone: communicationStyle === 'formal' ? 'professional' : 'friendly',
        complexity: learningStyle === 'technical' ? 'technical' : 'simple'
      },
      strengths: this.identifyStrengths(progressData),
      challenges: this.identifyChallenges(progressData),
      lastUpdated: new Date().toISOString()
    };

    // Cache-uiește
    this.profiles.set(userId, profile);
    
    console.log('✅ Profile built:', profile);
    return profile;
  }

  /**
   * 2. ADAPT RESPONSE STYLE
   * Modifică răspunsul AI-ului bazat pe personalitate
   */
  async adaptResponseStyle(
    userId: string,
    baseResponse: string
  ): Promise<string> {
    // Ia profilul (sau construiește-l)
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = await this.buildPersonalityProfile(userId);
    }

    let adapted = baseResponse;

    // Adaptează după communication style
    switch (profile.communicationStyle) {
      case 'direct':
        adapted = this.makeMoreDirect(adapted);
        break;
      case 'friendly':
        adapted = this.makeFriendlier(adapted);
        break;
      case 'formal':
        adapted = this.makeMoreFormal(adapted);
        break;
      case 'casual':
        adapted = this.makeCasual(adapted);
        break;
    }

    // Adaptează după complexity
    if (profile.preferences.complexity === 'simple') {
      adapted = this.simplify(adapted);
    } else if (profile.preferences.complexity === 'technical') {
      adapted = this.addTechnicalDetails(adapted);
    }

    return adapted;
  }

  /**
   * 3. INTEGRATE EMOTIONAL CONTEXT
   * Adaugă contextul emoțional la răspuns
   */
  async integrateEmotionalContext(
    userId: string,
    response: string,
    currentEmotion: string
  ): Promise<string> {
    const profile = await this.getProfile(userId);
    
    // Dacă userul e stresat, fă răspunsul mai calm
    if (currentEmotion === 'stressed' || currentEmotion === 'anxious') {
      return this.makeCalmingResponse(response);
    }

    // Dacă userul e fericit, menține energia
    if (currentEmotion === 'happy' || currentEmotion === 'excited') {
      return this.makeEnergetic(response);
    }

    // Dacă userul e trist, fă răspunsul mai empatic
    if (currentEmotion === 'sad') {
      return this.makeEmpathetic(response);
    }

    return response;
  }

  // ============================================
  // HELPER METHODS (simple implementations)
  // ============================================

  private async fetchBiometricHistory(userId: string) {
    const { data } = await this.supabase
      .from('biometric_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    return data || [];
  }

  private async fetchConversationHistory(userId: string) {
    const { data } = await this.supabase
      .from('ai_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    return data || [];
  }

  private async fetchUserProgress(userId: string) {
    const { data } = await this.supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data || null;
  }

  private analyzeEmotionalPatterns(biometricData: any[]) {
    const emotions: Record<string, number> = {};
    
    biometricData.forEach(scan => {
      const emotion = scan.analysis_results?.emotional_state || 'neutral';
      emotions[emotion] = (emotions[emotion] || 0) + 1;
    });

    const dominant = Object.keys(emotions).sort((a, b) => 
      emotions[b] - emotions[a]
    )[0] || 'neutral';

    return { dominant, frequency: emotions };
  }

  private analyzeCommunicationStyle(conversationData: any[]): PersonalityProfile['communicationStyle'] {
    // Simplu: analizează length-ul mesajelor
    const avgLength = conversationData.reduce((sum, msg) => 
      sum + (msg.content?.length || 0), 0
    ) / (conversationData.length || 1);

    if (avgLength < 50) return 'direct';
    if (avgLength > 200) return 'formal';
    return 'friendly';
  }

  private analyzeLearningStyle(progressData: any): PersonalityProfile['learningStyle'] {
    // Default: textual (poate fi extins)
    return 'textual';
  }

  private identifyStrengths(progressData: any): string[] {
    return progressData?.strengths || ['determined', 'curious'];
  }

  private identifyChallenges(progressData: any): string[] {
    return progressData?.challenges || ['time management'];
  }

  private makeMoreDirect(text: string): string {
    // Remove filler words
    return text
      .replace(/I think that maybe/gi, '')
      .replace(/perhaps/gi, '')
      .replace(/possibly/gi, '');
  }

  private makeFriendlier(text: string): string {
    // Add friendly emojis and phrases
    return `${text} 😊`;
  }

  private makeMoreFormal(text: string): string {
    // Make more professional
    return text
      .replace(/gonna/gi, 'going to')
      .replace(/wanna/gi, 'want to');
  }

  private makeCasual(text: string): string {
    return text.replace(/Hello/gi, 'Hey');
  }

  private simplify(text: string): string {
    // Remove complex words
    return text
      .replace(/utilize/gi, 'use')
      .replace(/demonstrate/gi, 'show');
  }

  private addTechnicalDetails(text: string): string {
    // In production, add more technical explanations
    return text;
  }

  private makeCalmingResponse(text: string): string {
    return `Take a deep breath. ${text} Everything will be okay. 🌸`;
  }

  private makeEnergetic(text: string): string {
    return `Great energy! ${text} Let's keep this momentum going! 🚀`;
  }

  private makeEmpathetic(text: string): string {
    return `I understand how you feel. ${text} You're not alone. 💙`;
  }

  private async getProfile(userId: string): Promise<PersonalityProfile> {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = await this.buildPersonalityProfile(userId);
    }
    return profile;
  }
}

// Export singleton
export const personalityEngine = new PersonalityEngine();