// app/[lang]/quantum-vault/page.tsx
'use client';

import { useState, useEffect } from 'react';

import { memoryIntegrator } from '@/lib/quantum/memory-integrator';
import { timelineSimulator } from '@/lib/quantum/timeline-simulator';
import { createClient } from '@/lib/supabase/client';

import type { Memory, MemoryPattern } from '@/lib/quantum/memory-integrator';
import type { TimelinePoint, TimelineScenario } from '@/lib/quantum/timeline-simulator';

export default function QuantumVaultPage() {
  const supabase = createClient();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [patterns, setPatterns] = useState<MemoryPattern[]>([]);
  const [timeline, setTimeline] = useState<{
    past: TimelinePoint[];
    present: TimelinePoint[];
    future: TimelinePoint[];
  }>({ past: [], present: [], future: [] });
  const [scenarios, setScenarios] = useState<TimelineScenario[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'timeline' | 'memories' | 'patterns'>('timeline');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Load user și data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }
    setUserId(user.id);

    // Load memories
    const { data: memoriesData } = await supabase
      .from('quantum_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (memoriesData) {
      setMemories(memoriesData.map(dbToMemory));
    }

    // Load patterns
    const { data: patternsData } = await supabase
      .from('memory_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('confidence', { ascending: false });

    if (patternsData) {
      setPatterns(patternsData);
    }

    // Load timeline
    const timelineData = await timelineSimulator.createTimelineVisualization(user.id);
    setTimeline(timelineData);

    // Load scenarios
    const { data: scenariosData } = await supabase
      .from('timeline_scenarios')
      .select('*')
      .eq('user_id', user.id)
      .order('probability', { ascending: false })
      .limit(5);

    if (scenariosData) {
      setScenarios(scenariosData);
    }

    setIsLoading(false);
  };

  // Handlers
  const handleAddMemory = async () => {
    if (!userId || !newMemory.title) {return;}

    setIsLoading(true);

    try {
      const memory = await memoryIntegrator.processMemoryInput(
        userId,
        newMemory.title,
        newMemory.description
      );

      setMemories([memory, ...memories]);
      setNewMemory({ title: '', description: '' });
      setIsAddingMemory(false);

      // Reload patterns
      const patterns = await memoryIntegrator.findMemoryPatterns(userId);
      setPatterns(patterns);
    } catch (error) {
      console.error('Error adding memory:', error);
    }

    setIsLoading(false);
  };

  const handleGenerateScenarios = async () => {
    if (!userId) {return;}

    setIsLoading(true);

    try {
      const newScenarios = await timelineSimulator.generateFutureScenarios(
        userId,
        'medium'
      );

      setScenarios(newScenarios);

      // Reload timeline
      const timelineData = await timelineSimulator.createTimelineVisualization(userId);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error generating scenarios:', error);
    }

    setIsLoading(false);
  };

  // Helper
  const dbToMemory = (dbRecord: {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category: 'experience' | 'insight' | 'decision' | 'achievement';
    emotional_tone: 'positive' | 'negative' | 'neutral';
    significance: number;
    tags?: string[];
    created_at: string;
    connections?: string[];
  }): Memory => ({
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
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading Quantum Vault... 🌌</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          🌌 Quantum Vault
        </h1>
        <p className="text-xl text-purple-200">
          Explore your memories, patterns, and possible futures
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex gap-4 border-b border-purple-500/30">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'timeline'
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-purple-300 hover:text-purple-200'
            }`}
          >
            📊 Timeline
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'memories'
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-purple-300 hover:text-purple-200'
            }`}
          >
            🧠 Memories ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'patterns'
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-purple-300 hover:text-purple-200'
            }`}
          >
            🔍 Patterns ({patterns.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-8">
            {/* Generate Scenarios Button */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerateScenarios}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                🔮 Generate Future Scenarios
              </button>
            </div>

            {/* Timeline Visualization */}
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-6">Your Timeline</h2>
              
              {/* Simple 2D Timeline */}
              <div className="relative h-64">
                {/* Past */}
                <div className="absolute left-0 top-0 w-1/3 h-full border-r border-purple-500/50 p-4">
                  <div className="text-purple-400 font-semibold mb-4">Past</div>
                  <div className="space-y-2">
                    {timeline.past.slice(0, 3).map((point, i) => (
                      <div key={i} className="text-sm text-purple-200">
                        • {point.event}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Present */}
                <div className="absolute left-1/3 top-0 w-1/3 h-full border-r border-pink-500/50 p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="text-pink-400 font-semibold">NOW</div>
                  </div>
                </div>

                {/* Future */}
                <div className="absolute right-0 top-0 w-1/3 h-full p-4">
                  <div className="text-blue-400 font-semibold mb-4">Future</div>
                  <div className="space-y-2">
                    {timeline.future.slice(0, 3).map((point, i) => (
                      <div key={i} className="text-sm text-blue-200">
                        • {point.event}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Future Scenarios */}
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-6">Future Scenarios</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scenarios.map((scenario, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold">{scenario.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        scenario.impact === 'high'
                          ? 'bg-red-500/20 text-red-300'
                          : scenario.impact === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {scenario.impact}
                      </span>
                    </div>
                    
                    <p className="text-purple-200 mb-4">{scenario.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-300">
                        📊 {Math.round(scenario.probability * 100)}% likely
                      </span>
                      <span className="text-purple-300">
                        ⏰ {scenario.timeframe}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEMORIES TAB */}
        {activeTab === 'memories' && (
          <div className="space-y-8">
            {/* Add Memory Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddingMemory(!isAddingMemory)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                {isAddingMemory ? '❌ Cancel' : '➕ Add Memory'}
              </button>
            </div>

            {/* Add Memory Form */}
            {isAddingMemory && (
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
                <h2 className="text-2xl font-bold mb-6">New Memory</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={newMemory.title}
                      onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="What happened?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-purple-300 mb-2">Description</label>
                    <textarea
                      value={newMemory.description}
                      onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 h-32"
                      placeholder="Tell me more..."
                    />
                  </div>
                  
                  <button
                    onClick={handleAddMemory}
                    disabled={!newMemory.title || isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                  >
                    💾 Save Memory
                  </button>
                </div>
              </div>
            )}

            {/* Memory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{memory.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      memory.emotionalTone === 'positive'
                        ? 'bg-green-500/20 text-green-300'
                        : memory.emotionalTone === 'negative'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {memory.emotionalTone}
                    </span>
                  </div>
                  
                  <p className="text-purple-200 text-sm mb-4 line-clamp-3">
                    {memory.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {memory.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-purple-300">
                    <span>🎯 {memory.category}</span>
                    <span>⭐ {Math.round(memory.significance * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {memories.length === 0 && (
              <div className="text-center py-20 text-purple-300">
                <div className="text-6xl mb-4">🌌</div>
                <div className="text-xl">No memories yet. Add your first one!</div>
              </div>
            )}
          </div>
        )}

        {/* PATTERNS TAB */}
        {activeTab === 'patterns' && (
          <div className="space-y-8">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-6">Discovered Patterns</h2>
              
              <div className="space-y-6">
                {patterns.map((pattern, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm mb-2 ${
                          pattern.type === 'breakthrough'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : pattern.type === 'trend'
                            ? 'bg-blue-500/20 text-blue-300'
                            : pattern.type === 'cycle'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {pattern.type}
                        </span>
                        <h3 className="text-xl font-semibold">{pattern.description}</h3>
                      </div>
                      <span className="text-purple-300 text-sm">
                        {Math.round(pattern.confidence * 100)}% confidence
                      </span>
                    </div>
                    
                    <p className="text-purple-200 mb-4">{pattern.insight}</p>
                    
                    <div className="text-sm text-purple-300">
                      📊 Based on {pattern.memories.length} memories
                    </div>
                  </div>
                ))}
              </div>

              {patterns.length === 0 && (
                <div className="text-center py-12 text-purple-300">
                  <div className="text-4xl mb-4">🔍</div>
                  <div className="text-lg">Add more memories to discover patterns</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}