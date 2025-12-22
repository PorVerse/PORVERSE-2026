/**
 * @fileoverview AI Store - Stub for type checking
 * @module stores/ai-store
 * @description Minimal AI state management store
 * @version 2.0.0
 * @todo Implement full AI store functionality
 */

import { create } from 'zustand';

interface MessageContext {
  portalId?: string
  stepId?: string
  sessionId?: string
  [key: string]: unknown
}

interface AIState {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    context?: MessageContext;
  }>;
  isLoading: boolean;
  sendMessage: (message: { role: 'user' | 'assistant' | 'system'; content: string; context?: MessageContext }) => Promise<void>;
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  isLoading: false,
  sendMessage: async (message) => {
    set({ isLoading: true });
    try {
      // TODO: Implement AI message sending logic
      set((state) => ({
        messages: [...state.messages, message],
        isLoading: false
      }));
    } catch (error) {
      console.error('AI message failed:', error);
      set({ isLoading: false });
    }
  }
}));
