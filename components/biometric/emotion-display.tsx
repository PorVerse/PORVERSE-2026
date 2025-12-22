// components/biometric/emotion-display.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Eye, TrendingUp } from 'lucide-react';

import { EmotionReading } from '@/types/biometric';

// Extended type for display purposes
type EmotionDisplayData = EmotionReading & {
  heartRate?: number;
  stressLevel?: number;
  valence?: number;
  arousal?: number;
}

export interface EmotionDisplayProps {
  emotionData: EmotionReading;
  displayMode: 'realtime' | 'summary' | 'history';
  privacyLevel: 'full' | 'anonymous' | 'hidden';
  onPrivacyChange?: (level: 'full' | 'anonymous' | 'hidden') => void;
  className?: string;
}

export function EmotionDisplay({
  emotionData,
  displayMode = 'realtime',
  privacyLevel = 'full',
  onPrivacyChange,
  className = ''
}: EmotionDisplayProps) {
  
  if (privacyLevel === 'hidden') {
    return null;
  }

  const displayData: EmotionDisplayData = privacyLevel === 'anonymous' 
    ? anonymizeData(emotionData)
    : emotionData;

  switch (displayMode) {
    case 'summary':
      return <SummaryView data={displayData} className={className} />;
    case 'history':
      return <HistoryView data={displayData} className={className} />;
    default:
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            rounded-2xl border border-purple-500/30 
            bg-gradient-to-br from-purple-900/20 to-pink-900/20 
            p-6 backdrop-blur-md
            ${className}
          `}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Heart className="h-5 w-5 text-pink-400" />
              Emotional State
            </h3>

            {/* Privacy Toggle */}
            {onPrivacyChange && (
              <select
                value={privacyLevel}
                onChange={(e) => onPrivacyChange(e.target.value as any)}
                className="rounded-lg border border-purple-500/30 bg-black/50 px-3 py-1 text-sm text-white"
              >
                <option value="full">Full</option>
                <option value="anonymous">Anonymous</option>
                <option value="hidden">Hidden</option>
              </select>
            )}
          </div>

          {/* Main Emotion Display */}
          <div className="mb-6 text-center">
            <motion.div
              key={displayData.emotion}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-4 inline-block"
            >
              <div className="text-8xl">
                {getEmotionEmoji(displayData.emotion)}
              </div>
            </motion.div>

            <h4 className="mb-2 text-2xl font-bold capitalize text-white">
              {displayData.emotion}
            </h4>

            <p className="text-sm text-gray-400">
              {Math.round(displayData.confidence * 100)}% confidence
            </p>
          </div>

          {/* Emotion Intensity Bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">Intensity</span>
              <span className="text-white">
                {Math.round((displayData.intensity || 0.5) * 100)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/50">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${(displayData.intensity || 0.5) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Heart Rate (if available) */}
            {displayData.heartRate && (
              <div className="rounded-lg bg-black/30 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-gray-400">Heart Rate</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {displayData.heartRate} bpm
                </p>
              </div>
            )}

            {/* Stress Level */}
            <div className="rounded-lg bg-black/30 p-3">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Stress Level</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {getStressLabel(displayData.stressLevel || 0.5)}
              </p>
            </div>

            {/* Valence */}
            <div className="rounded-lg bg-black/30 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-gray-400">Valence</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {getValenceLabel(displayData.valence || 0)}
              </p>
            </div>

            {/* Arousal */}
            <div className="rounded-lg bg-black/30 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-400">Arousal</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {getArousalLabel(displayData.arousal || 0)}
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mt-4 text-center text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </motion.div>
      );
  }
}

// ============================================
// VIEW COMPONENTS
// ============================================

function SummaryView({ data, className }: { data: EmotionReading; className?: string }) {
  return (
    <div className={`rounded-xl border border-purple-500/30 bg-black/20 p-4 ${className}`}>
      <h4 className="mb-3 text-sm font-semibold text-white">Emotional Summary</h4>
      
      <div className="flex items-center gap-4">
        <div className="text-4xl">{getEmotionEmoji(data.emotion)}</div>
        <div className="flex-1">
          <p className="font-semibold capitalize text-white">{data.emotion}</p>
          <p className="text-xs text-gray-400">
            {Math.round(data.confidence * 100)}% confidence
          </p>
        </div>
      </div>
    </div>
  );
}

function HistoryView({ data: _data, className }: { data: EmotionReading; className?: string }) {
  // In production, fetch history from database
  const mockHistory = [
    { emotion: 'happy', time: '10:30 AM', intensity: 0.8 },
    { emotion: 'calm', time: '10:45 AM', intensity: 0.6 },
    { emotion: 'focused', time: '11:00 AM', intensity: 0.9 },
  ];

  return (
    <div className={`rounded-xl border border-purple-500/30 bg-black/20 p-4 ${className}`}>
      <h4 className="mb-4 text-sm font-semibold text-white">Emotion History</h4>
      
      <div className="space-y-3">
        {mockHistory.map((entry, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-2xl">{getEmotionEmoji(entry.emotion)}</div>
            <div className="flex-1">
              <p className="text-sm font-medium capitalize text-white">{entry.emotion}</p>
              <p className="text-xs text-gray-400">{entry.time}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                {Math.round(entry.intensity * 100)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function anonymizeData(data: EmotionReading): EmotionDisplayData {
  // Remove identifying features, keep only general emotion
  return {
    ...data,
    heartRate: undefined,
  };
}

function getEmotionEmoji(emotion: string): string {
  const emojis: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    calm: '😌',
    excited: '🤩',
    neutral: '😐',
    stressed: '😫',
    focused: '🎯',
    relaxed: '😌',
    surprised: '😲',
    confused: '😕'
  };
  return emojis[emotion] || '😐';
}

function getStressLabel(level: number): string {
  if (level < 0.3) {return 'Low';}
  if (level < 0.6) {return 'Medium';}
  return 'High';
}

function getValenceLabel(value: number): string {
  if (value < -0.3) {return 'Negative';}
  if (value > 0.3) {return 'Positive';}
  return 'Neutral';
}

function getArousalLabel(value: number): string {
  if (value < -0.3) {return 'Calm';}
  if (value > 0.3) {return 'Energized';}
  return 'Balanced';
}

export default EmotionDisplay;