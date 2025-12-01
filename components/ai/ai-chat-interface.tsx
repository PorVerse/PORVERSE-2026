// components/ai/ai-chat-interface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Heart, Brain } from 'lucide-react';
import { conversationManager } from '@/lib/ai/advanced-conversation-manager';
import { EmotionReading } from '@/types/biometric';

export interface AIChatProps {
  conversationId: string;
  portalContext?: any;
  biometricData?: EmotionReading;
  personalityAdaptation: boolean;
  onMessageSend?: (message: string) => void;
  onEmotionalSupport?: () => void;
  className?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
}

export function AIChatInterface({
  conversationId,
  portalContext,
  biometricData,
  personalityAdaptation = true,
  onMessageSend,
  onEmotionalSupport,
  className = ''
}: AIChatProps) {
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmotionIndicator, setShowEmotionIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show emotion indicator when biometric data changes
  useEffect(() => {
    if (biometricData) {
      setShowEmotionIndicator(true);
      setTimeout(() => setShowEmotionIndicator(false), 3000);
    }
  }, [biometricData]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      emotion: biometricData?.emotion
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (onMessageSend) {
      onMessageSend(input);
    }

    try {
      // Get AI response with emotional context
      const response = await conversationManager.adaptConversationFlow(
        conversationId,
        input
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/30 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Guide</h3>
              <p className="text-xs text-gray-400">
                {personalityAdaptation ? 'Personality adapted' : 'Standard mode'}
              </p>
            </div>
          </div>

          {/* Emotional Support Button */}
          {biometricData && (
            <button
              onClick={onEmotionalSupport}
              className="flex items-center gap-2 rounded-lg bg-pink-500/20 px-3 py-1.5 text-sm text-pink-300 transition-colors hover:bg-pink-500/30"
            >
              <Heart className="h-4 w-4" />
              Emotional Support
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showEmotion={message.emotion !== undefined}
            />
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-gray-400"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emotion Indicator */}
      <AnimatePresence>
        {showEmotionIndicator && biometricData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-4 mb-2 rounded-lg bg-purple-900/30 p-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-gray-300">
                Detected emotion: <span className="font-semibold text-white capitalize">
                  {biometricData.emotion}
                </span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-purple-500/20 bg-black/30 p-4 backdrop-blur-md">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-purple-500/30 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MessageBubble({ 
  message, 
  showEmotion 
}: { 
  message: Message; 
  showEmotion: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser 
          ? 'bg-blue-500' 
          : 'bg-gradient-to-r from-purple-500 to-pink-500'
      }`}>
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-white'
          }`}>
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>

          {/* Timestamp & Emotion */}
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {showEmotion && message.emotion && (
              <>
                <span>•</span>
                <span className="capitalize">{message.emotion}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AIChatInterface;