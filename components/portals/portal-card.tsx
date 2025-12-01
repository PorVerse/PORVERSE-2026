// components/portals/portal-card.tsx
'use client';

import { motion } from 'framer-motion';
import { Lock, TrendingUp, Clock, Award, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Portal, PortalProgress } from '@/types/portal';

export interface PortalCardProps {
  portal: Portal;
  progress: PortalProgress;
  isLocked: boolean;
  onPortalSelect: (portalId: string) => void;
  variant?: 'card' | 'hero' | 'minimal';
  showProgress?: boolean;
  showBiometricData?: boolean;
  className?: string;
}

export function PortalCard({
  portal,
  progress,
  isLocked,
  onPortalSelect,
  variant = 'card',
  showProgress = true,
  showBiometricData = false,
  className = ''
}: PortalCardProps) {
  
  // Calculate completion percentage
  const completionPercentage = progress
    ? Math.round((progress.completed_steps / progress.total_steps) * 100)
    : 0;

  // Get portal theme colors
  const themeColors = getPortalTheme(portal.id);

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.645, 0.045, 0.355, 1] }
    },
    hover: { 
      y: -8, 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  const handleClick = () => {
    if (!isLocked) {
      onPortalSelect(portal.id);
    }
  };

  // Render based on variant
  switch (variant) {
    case 'hero':
      return <HeroVariant {...{ portal, progress, isLocked, onPortalSelect, themeColors }} />;
    case 'minimal':
      return <MinimalVariant {...{ portal, progress, isLocked, onPortalSelect }} />;
    default:
      return (
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover={!isLocked ? "hover" : undefined}
          whileTap={!isLocked ? "tap" : undefined}
          onClick={handleClick}
          className={`
            relative overflow-hidden rounded-2xl border backdrop-blur-md
            transition-all cursor-pointer
            ${isLocked 
              ? 'border-gray-700 bg-black/20 cursor-not-allowed opacity-60' 
              : `border-${themeColors.border} bg-gradient-to-br ${themeColors.gradient}`
            }
            ${className}
          `}
          style={{
            boxShadow: isLocked 
              ? 'none' 
              : `0 0 40px ${themeColors.glow}20, inset 0 0 60px ${themeColors.glow}10`
          }}
        >
          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <Lock className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-400">Complete {portal.unlock_requirements?.required_portal} first</p>
              </div>
            </div>
          )}

          {/* Background Image */}
          {portal.background_image && (
            <div className="absolute inset-0 z-0 opacity-20">
              <Image
                src={portal.background_image}
                alt={portal.name}
                fill
                className="object-cover"
                priority={portal.id === 'P0'}
              />
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="mb-1 text-2xl font-bold text-white">
                  {portal.name}
                </h3>
                <p className="text-sm text-gray-300">
                  Portal {portal.id}
                </p>
              </div>
              
              {/* Portal Icon */}
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${themeColors.primary}30` }}
              >
                <span className="text-2xl">{portal.icon || '🌟'}</span>
              </div>
            </div>

            {/* Description */}
            <p className="mb-4 line-clamp-2 text-sm text-gray-300">
              {portal.description}
            </p>

            {/* Progress Bar */}
            {showProgress && progress && !isLocked && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className={`font-semibold text-${themeColors.text}`}>
                    {completionPercentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/50">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${themeColors.progressGradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Stats Grid */}
            {!isLocked && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {/* Steps Completed */}
                <div className="rounded-lg bg-black/30 p-2 text-center">
                  <TrendingUp className="mx-auto mb-1 h-4 w-4 text-blue-400" />
                  <p className="text-xs text-gray-400">Steps</p>
                  <p className="text-sm font-semibold text-white">
                    {progress?.completed_steps || 0}/{progress?.total_steps || 0}
                  </p>
                </div>

                {/* Time Spent */}
                <div className="rounded-lg bg-black/30 p-2 text-center">
                  <Clock className="mx-auto mb-1 h-4 w-4 text-purple-400" />
                  <p className="text-xs text-gray-400">Time</p>
                  <p className="text-sm font-semibold text-white">
                    {formatTime(progress?.time_spent || 0)}
                  </p>
                </div>

                {/* Achievements */}
                <div className="rounded-lg bg-black/30 p-2 text-center">
                  <Award className="mx-auto mb-1 h-4 w-4 text-yellow-400" />
                  <p className="text-xs text-gray-400">Awards</p>
                  <p className="text-sm font-semibold text-white">
                    {progress?.achievements?.length || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Biometric Data */}
            {showBiometricData && progress?.biometric_summary && !isLocked && (
              <div className="mb-4 rounded-lg bg-black/30 p-3">
                <p className="mb-2 text-xs text-gray-400">Recent Emotional State</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{getEmotionEmoji(progress.biometric_summary.dominant_emotion)}</span>
                  <span className="text-sm text-white capitalize">
                    {progress.biometric_summary.dominant_emotion}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Math.round(progress.biometric_summary.average_intensity * 100)}% intensity
                  </span>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLocked}
              className={`
                w-full rounded-lg py-3 font-semibold transition-all
                flex items-center justify-center gap-2
                ${isLocked
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : `bg-gradient-to-r ${themeColors.buttonGradient} text-white hover:shadow-lg`
                }
              `}
              style={{
                boxShadow: !isLocked ? `0 0 20px ${themeColors.glow}40` : 'none'
              }}
            >
              {isLocked ? (
                <>
                  <Lock className="h-5 w-5" />
                  Locked
                </>
              ) : completionPercentage === 100 ? (
                <>
                  <Award className="h-5 w-5" />
                  Completed
                </>
              ) : completionPercentage > 0 ? (
                <>
                  Continue
                  <ChevronRight className="h-5 w-5" />
                </>
              ) : (
                <>
                  Start Journey
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </div>

          {/* Glow Effect */}
          {!isLocked && (
            <div 
              className="absolute inset-0 -z-10 opacity-30 blur-3xl"
              style={{ background: `radial-gradient(circle at 50% 50%, ${themeColors.glow}, transparent 70%)` }}
            />
          )}
        </motion.div>
      );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPortalTheme(portalId: string) {
  const themes: Record<string, any> = {
    P0: {
      primary: '#3B82F6',
      border: 'blue-500/30',
      gradient: 'from-blue-900/50 to-purple-900/50',
      progressGradient: 'from-blue-500 to-purple-500',
      buttonGradient: 'from-blue-500 to-purple-500',
      glow: '#3B82F6',
      text: 'blue-400'
    },
    P1: {
      primary: '#8B5CF6',
      border: 'purple-500/30',
      gradient: 'from-purple-900/50 to-pink-900/50',
      progressGradient: 'from-purple-500 to-pink-500',
      buttonGradient: 'from-purple-500 to-pink-500',
      glow: '#8B5CF6',
      text: 'purple-400'
    },
    P2: {
      primary: '#EC4899',
      border: 'pink-500/30',
      gradient: 'from-pink-900/50 to-red-900/50',
      progressGradient: 'from-pink-500 to-red-500',
      buttonGradient: 'from-pink-500 to-red-500',
      glow: '#EC4899',
      text: 'pink-400'
    },
    P3: {
      primary: '#10B981',
      border: 'green-500/30',
      gradient: 'from-green-900/50 to-teal-900/50',
      progressGradient: 'from-green-500 to-teal-500',
      buttonGradient: 'from-green-500 to-teal-500',
      glow: '#10B981',
      text: 'green-400'
    },
    P4: {
      primary: '#F59E0B',
      border: 'yellow-500/30',
      gradient: 'from-yellow-900/50 to-orange-900/50',
      progressGradient: 'from-yellow-500 to-orange-500',
      buttonGradient: 'from-yellow-500 to-orange-500',
      glow: '#F59E0B',
      text: 'yellow-400'
    },
    P5: {
      primary: '#8B5CF6',
      border: 'purple-500/30',
      gradient: 'from-purple-900/50 via-pink-900/50 to-blue-900/50',
      progressGradient: 'from-purple-500 via-pink-500 to-blue-500',
      buttonGradient: 'from-purple-500 via-pink-500 to-blue-500',
      glow: '#8B5CF6',
      text: 'purple-400'
    }
  };

  return themes[portalId] || themes.P0;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
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
    stressed: '😫'
  };
  return emojis[emotion] || '😐';
}

// ============================================
// VARIANT COMPONENTS
// ============================================

function HeroVariant({ 
  portal, 
  progress, 
  isLocked, 
  onPortalSelect,
  themeColors 
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative h-[500px] overflow-hidden rounded-3xl border
        ${isLocked ? 'border-gray-700' : `border-${themeColors.border}`}
      `}
    >
      {/* Background with parallax effect */}
      {portal.background_image && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
        >
          <Image
            src={portal.background_image}
            alt={portal.name}
            fill
            className="object-cover opacity-40"
            priority
          />
        </motion.div>
      )}

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${themeColors.gradient} opacity-60`} />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-8">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 text-5xl font-bold text-white"
        >
          {portal.name}
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 text-lg text-gray-200"
        >
          {portal.description}
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPortalSelect(portal.id)}
          disabled={isLocked}
          className={`
            w-fit rounded-full px-8 py-4 font-semibold
            ${isLocked
              ? 'bg-gray-800 text-gray-500'
              : `bg-gradient-to-r ${themeColors.buttonGradient} text-white`
            }
          `}
        >
          {isLocked ? 'Locked' : 'Enter Portal'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function MinimalVariant({ portal, progress, isLocked, onPortalSelect }: any) {
  const completionPercentage = progress
    ? Math.round((progress.completed_steps / progress.total_steps) * 100)
    : 0;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPortalSelect(portal.id)}
      disabled={isLocked}
      className={`
        flex w-full items-center gap-4 rounded-xl border p-4
        transition-all
        ${isLocked
          ? 'border-gray-700 bg-black/20 opacity-60'
          : 'border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-blue-900/30 hover:border-purple-500/50'
        }
      `}
    >
      {/* Icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
        <span className="text-2xl">{portal.icon || '🌟'}</span>
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <h4 className="font-semibold text-white">{portal.name}</h4>
        <p className="text-xs text-gray-400">Portal {portal.id}</p>
      </div>

      {/* Progress */}
      {!isLocked && (
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-purple-400">
            {completionPercentage}%
          </p>
          <p className="text-xs text-gray-400">Complete</p>
        </div>
      )}

      {/* Lock Icon */}
      {isLocked && (
        <Lock className="h-5 w-5 shrink-0 text-gray-500" />
      )}
    </motion.button>
  );
}

export default PortalCard;