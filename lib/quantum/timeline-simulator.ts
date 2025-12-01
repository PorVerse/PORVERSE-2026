// lib/quantum/timeline-simulator.ts
import { createClient } from '@/lib/supabase/client';
import { AIServiceManager } from '@/lib/ai/ai-service-manager';

export interface TimelineScenario {
  id: string;
  title: string;
  description: string;
  probability: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  category: 'career' | 'personal' | 'health' | 'relationships';
  createdAt: string;
}

export interface TimelinePoint {
  timestamp: string;
  event: string;
  type: 'past' | 'present' | 'future';
  significance: number;
}

export class TimelineSimulator {
  private supabase = createClient();
  private aiService: AIServiceManager;

  constructor() {
    this.aiService = new AIServiceManager();
  }

  /**
   * 1. GENERATE FUTURE SCENARIOS
   * Generează scenarii posibile pentru viitor
   */
  async generateFutureScenarios(
    userId: string,
    timeframe: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<TimelineScenario[]> {
    console.log('🔮 Generating future scenarios for:', userId);

    // Fetch user data pentru context
    const userData = await this.fetchUserData(userId);

    // Generează scenarii cu AI
    const prompt = this.buildScenarioPrompt(userData, timeframe);
    const response = await this.aiService.generateResponse(
      [{ role: 'user', content: prompt }],
      { portalId: 'P4', temperature: 0.8, maxTokens: 1000 }
    );

    // Parse răspunsul AI
    const scenarios = this.parseScenarios(response.content);

    // Salvează în database
    await this.saveScenarios(userId, scenarios);

    return scenarios;
  }

  /**
   * 2. CREATE TIMELINE VISUALIZATION
   * Creează datele pentru vizualizarea timeline-ului
   */
  async createTimelineVisualization(
    userId: string
  ): Promise<{ past: TimelinePoint[], present: TimelinePoint[], future: TimelinePoint[] }> {
    console.log('📊 Creating timeline for:', userId);

    // Fetch memories (past)
    const { data: memories } = await this.supabase
      .from('quantum_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const past: TimelinePoint[] = (memories || []).map(m => ({
      timestamp: m.created_at,
      event: m.title,
      type: 'past' as const,
      significance: m.significance || 0.5
    }));

    // Present
    const present: TimelinePoint[] = [{
      timestamp: new Date().toISOString(),
      event: 'Now',
      type: 'present' as const,
      significance: 1.0
    }];

    // Future (scenarii)
    const { data: scenarios } = await this.supabase
      .from('timeline_scenarios')
      .select('*')
      .eq('user_id', userId)
      .order('probability', { ascending: false });

    const future: TimelinePoint[] = (scenarios || []).map(s => ({
      timestamp: s.timeframe,
      event: s.title,
      type: 'future' as const,
      significance: s.probability
    }));

    return { past, present, future };
  }

  /**
   * 3. SIMULATE DECISION IMPACTS
   * Simulează impactul unei decizii asupra viitorului
   */
  async simulateDecisionImpacts(
    userId: string,
    decision: string
  ): Promise<{
    positive: TimelineScenario[];
    negative: TimelineScenario[];
    neutral: TimelineScenario[];
  }> {
    console.log('🎲 Simulating decision impacts:', decision);

    const prompt = `User is considering: "${decision}"

Generate 3 possible outcomes:
1. Best case scenario (positive)
2. Worst case scenario (negative)
3. Most likely scenario (neutral)

For each, describe:
- What happens
- Probability (0-1)
- Impact level (low/medium/high)
- Timeframe (1 month / 6 months / 1 year)

Format as JSON array.`;

    const response = await this.aiService.generateResponse(
      [{ role: 'user', content: prompt }],
      { portalId: 'P4', temperature: 0.7, maxTokens: 1000 }
    );

    const outcomes = this.parseOutcomes(response.content);

    return {
      positive: outcomes.filter(o => o.impact === 'high' && o.probability > 0.6),
      negative: outcomes.filter(o => o.impact === 'high' && o.probability < 0.4),
      neutral: outcomes.filter(o => o.impact === 'medium')
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async fetchUserData(userId: string) {
    const [profile, memories, progress] = await Promise.all([
      this.supabase.from('profiles').select('*').eq('id', userId).single(),
      this.supabase.from('quantum_memories').select('*').eq('user_id', userId).limit(10),
      this.supabase.from('user_progress').select('*').eq('user_id', userId).single()
    ]);

    return {
      profile: profile.data,
      memories: memories.data || [],
      progress: progress.data
    };
  }

  private buildScenarioPrompt(userData: any, timeframe: string): string {
    const timeframeMap = {
      short: '1-3 months',
      medium: '6-12 months',
      long: '1-3 years'
    };

    return `Based on this user data:
- Recent memories: ${userData.memories.map((m: any) => m.title).join(', ')}
- Progress: ${JSON.stringify(userData.progress)}

Generate 5 realistic future scenarios for the next ${timeframeMap[timeframe as keyof typeof timeframeMap]}.

For each scenario:
- Title (brief)
- Description (2-3 sentences)
- Probability (0-1)
- Impact level (low/medium/high)
- Category (career/personal/health/relationships)

Format as JSON array.`;
  }

  private parseScenarios(content: string): TimelineScenario[] {
    try {
      // Remove markdown code blocks
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      
      return parsed.map((s: any, i: number) => ({
        id: `scenario-${Date.now()}-${i}`,
        title: s.title || 'Untitled Scenario',
        description: s.description || '',
        probability: s.probability || 0.5,
        timeframe: s.timeframe || 'medium',
        impact: s.impact || 'medium',
        category: s.category || 'personal',
        createdAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to parse scenarios:', error);
      // Return default scenarios
      return [{
        id: `scenario-${Date.now()}`,
        title: 'Personal Growth',
        description: 'Continue your journey of self-discovery',
        probability: 0.7,
        timeframe: 'medium',
        impact: 'medium',
        category: 'personal',
        createdAt: new Date().toISOString()
      }];
    }
  }

  private parseOutcomes(content: string): TimelineScenario[] {
    return this.parseScenarios(content);
  }

  private async saveScenarios(userId: string, scenarios: TimelineScenario[]) {
    const records = scenarios.map(s => ({
      user_id: userId,
      title: s.title,
      description: s.description,
      probability: s.probability,
      timeframe: s.timeframe,
      impact: s.impact,
      category: s.category
    }));

    await this.supabase
      .from('timeline_scenarios')
      .insert(records);
  }
}

// Export singleton
export const timelineSimulator = new TimelineSimulator();