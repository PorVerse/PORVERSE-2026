// lib/quantum/memory-integrator.ts
import { createClient } from '@/lib/supabase/client';
import { AIServiceManager } from '@/lib/ai/ai-service-manager';

export interface Memory {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'experience' | 'insight' | 'decision' | 'achievement';
  emotionalTone: 'positive' | 'negative' | 'neutral';
  significance: number;
  tags: string[];
  timestamp: string;
  connections: string[]; // IDs of related memories
}

export interface MemoryPattern {
  id: string;
  type: 'recurring' | 'trend' | 'cycle' | 'breakthrough';
  description: string;
  memories: string[];
  insight: string;
  confidence: number;
}

export class MemoryIntegrator {
  private supabase = createClient();
  private aiService: AIServiceManager;

  constructor() {
    this.aiService = new AIServiceManager();
  }

  /**
   * 1. PROCESS MEMORY INPUT
   * Procesează un memory nou și extrage metadata
   */
  async processMemoryInput(
    userId: string,
    title: string,
    description: string
  ): Promise<Memory> {
    console.log('🧠 Processing memory:', title);

    // Analizează memoria cu AI
    const analysis = await this.analyzeMemory(description);

    // Creează obiectul Memory
    const memory: Memory = {
      id: `memory-${Date.now()}`,
      userId,
      title,
      description,
      category: analysis.category,
      emotionalTone: analysis.emotionalTone,
      significance: analysis.significance,
      tags: analysis.tags,
      timestamp: new Date().toISOString(),
      connections: []
    };

    // Găsește conexiuni cu alte memories
    memory.connections = await this.findConnections(userId, memory);

    // Salvează în database
    await this.saveMemory(memory);

    // Trigger pattern detection
    setTimeout(() => {
      this.findMemoryPatterns(userId).catch(console.error);
    }, 1000);

    return memory;
  }

  /**
   * 2. CATEGORIZE MEMORIES
   * Categorizează toate memories existente
   */
  async categorizeMemories(userId: string): Promise<{
    experiences: Memory[];
    insights: Memory[];
    decisions: Memory[];
    achievements: Memory[];
  }> {
    const { data: memories } = await this.supabase
      .from('quantum_memories')
      .select('*')
      .eq('user_id', userId);

    const categorized = {
      experiences: [] as Memory[],
      insights: [] as Memory[],
      decisions: [] as Memory[],
      achievements: [] as Memory[]
    };

    (memories || []).forEach((m: any) => {
      const memory = this.dbToMemory(m);
      
      switch (memory.category) {
        case 'experience':
          categorized.experiences.push(memory);
          break;
        case 'insight':
          categorized.insights.push(memory);
          break;
        case 'decision':
          categorized.decisions.push(memory);
          break;
        case 'achievement':
          categorized.achievements.push(memory);
          break;
      }
    });

    return categorized;
  }

  /**
   * 3. FIND MEMORY PATTERNS
   * Găsește patterns în memories
   */
  async findMemoryPatterns(userId: string): Promise<MemoryPattern[]> {
    console.log('🔍 Finding memory patterns for:', userId);

    // Fetch toate memories
    const { data: memories } = await this.supabase
      .from('quantum_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!memories || memories.length < 3) {
      return [];
    }

    // Analizează cu AI
    const prompt = this.buildPatternPrompt(memories);
    const response = await this.aiService.generateResponse(
      [{ role: 'user', content: prompt }],
      { portalId: 'P4', temperature: 0.7, maxTokens: 1000 }
    );

    const patterns = this.parsePatterns(response.content, memories);

    // Salvează patterns
    await this.savePatterns(userId, patterns);

    return patterns;
  }

  /**
   * 4. GET CONNECTED MEMORIES
   * Ia toate memories conectate la o memorie
   */
  async getConnectedMemories(memoryId: string): Promise<Memory[]> {
    const { data: memory } = await this.supabase
      .from('quantum_memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (!memory || !memory.connections) {
      return [];
    }

    const { data: connected } = await this.supabase
      .from('quantum_memories')
      .select('*')
      .in('id', memory.connections);

    return (connected || []).map(this.dbToMemory);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async analyzeMemory(description: string) {
    const prompt = `Analyze this memory and extract:
1. Category (experience/insight/decision/achievement)
2. Emotional tone (positive/negative/neutral)
3. Significance (0-1)
4. Key tags (3-5 words)

Memory: "${description}"

Return as JSON: { category, emotionalTone, significance, tags }`;

    const response = await this.aiService.generateResponse(
      [{ role: 'user', content: prompt }],
      { portalId: 'P4', temperature: 0.3, maxTokens: 200 }
    );

    try {
      const cleaned = response.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      // Default values
      return {
        category: 'experience',
        emotionalTone: 'neutral',
        significance: 0.5,
        tags: ['general']
      };
    }
  }

  private async findConnections(userId: string, memory: Memory): Promise<string[]> {
    // Fetch recent memories
    const { data: recentMemories } = await this.supabase
      .from('quantum_memories')
      .select('id, title, description, tags')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!recentMemories) return [];

    // Find connections based on tags
    const connections: string[] = [];
    
    recentMemories.forEach((m: any) => {
      const commonTags = memory.tags.filter(tag => 
        m.tags?.includes(tag)
      );

      if (commonTags.length >= 2) {
        connections.push(m.id);
      }
    });

    return connections;
  }

  private async saveMemory(memory: Memory) {
    await this.supabase
      .from('quantum_memories')
      .insert({
        id: memory.id,
        user_id: memory.userId,
        title: memory.title,
        description: memory.description,
        category: memory.category,
        emotional_tone: memory.emotionalTone,
        significance: memory.significance,
        tags: memory.tags,
        connections: memory.connections,
        created_at: memory.timestamp
      });
  }

  private buildPatternPrompt(memories: any[]): string {
    const memoryList = memories.map((m, i) => 
      `${i + 1}. ${m.title} (${m.category}) - ${m.emotional_tone}`
    ).join('\n');

    return `Analyze these memories and find patterns:

${memoryList}

Identify:
1. Recurring themes
2. Emotional trends
3. Growth cycles
4. Breakthrough moments

Return as JSON array of patterns:
[
  {
    type: "recurring" | "trend" | "cycle" | "breakthrough",
    description: "Brief description",
    memoryIndices: [1, 3, 5],
    insight: "What this pattern reveals",
    confidence: 0-1
  }
]`;
  }

  private parsePatterns(content: string, memories: any[]): MemoryPattern[] {
    try {
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      return parsed.map((p: any, i: number) => ({
        id: `pattern-${Date.now()}-${i}`,
        type: p.type || 'recurring',
        description: p.description || '',
        memories: p.memoryIndices?.map((idx: number) => memories[idx - 1]?.id).filter(Boolean) || [],
        insight: p.insight || '',
        confidence: p.confidence || 0.5
      }));
    } catch (error) {
      console.error('Failed to parse patterns:', error);
      return [];
    }
  }

  private async savePatterns(userId: string, patterns: MemoryPattern[]) {
    const records = patterns.map(p => ({
      user_id: userId,
      type: p.type,
      description: p.description,
      memory_ids: p.memories,
      insight: p.insight,
      confidence: p.confidence
    }));

    await this.supabase
      .from('memory_patterns')
      .insert(records);
  }

  private dbToMemory(dbRecord: any): Memory {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      title: dbRecord.title,
      description: dbRecord.description,
      category: dbRecord.category,
      emotionalTone: dbRecord.emotional_tone,
      significance: dbRecord.significance,
      tags: dbRecord.tags || [],
      timestamp: dbRecord.created_at,
      connections: dbRecord.connections || []
    };
  }
}

// Export singleton
export const memoryIntegrator = new MemoryIntegrator();