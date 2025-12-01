// components/navigation/portal-navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Portal, PortalProgress } from '@/types/portal';

export interface PortalNavigationProps {
  currentPortal: Portal;
  variant?: 'sidebar' | 'horizontal' | 'circular';
  onPortalChange?: (portalId: string) => void;
  showProgress?: boolean;
}

export function PortalNavigation({
  currentPortal,
  variant = 'sidebar',
  onPortalChange,
  showProgress = true
}: PortalNavigationProps) {
  const supabase = createClient();
  
  const [portals, setPortals] = useState<Portal[]>([]);
  const [progressData, setProgressData] = useState<Record<string, PortalProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Load all portals
    const { data: portalsData } = await supabase
      .from('portals')
      .select('*')
      .order('order_index', { ascending: true });

    if (portalsData) {
      setPortals(portalsData);
    }

    // Load progress for all portals
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: progressData } = await supabase
        .from('portal_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressData) {
        const progressMap: Record<string, PortalProgress> = {};
        progressData.forEach((p: any) => {
          progressMap[p.portal_id] = p;
        });
        setProgressData(progressMap);
      }
    }

    setIsLoading(false);
  };

  const isPortalUnlocked = (portal: Portal): boolean => {
    // P0 is always unlocked
    if (portal.id === 'P0') return true;

    // Check if requirements are met
    const requiredPortal = portal.unlock_requirements?.required_portal;
    if (!requiredPortal) return true;

    const requiredProgress = progressData[requiredPortal];
    return requiredProgress?.status === 'completed';
  };

  const handlePortalClick = (portal: Portal) => {
    if (isPortalUnlocked(portal) && onPortalChange) {
      onPortalChange(portal.id);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-400">Loading...</div>;
  }

  // Render based on variant
  switch (variant) {
    case 'horizontal':
      return <HorizontalNav {...{ portals, currentPortal, progressData, isPortalUnlocked, handlePortalClick, showProgress }} />;
    case 'circular':
      return <CircularNav {...{ portals, currentPortal, progressData, isPortalUnlocked, handlePortalClick }} />;
    default:
      return (
        <nav className="space-y-2">
          {portals.map((portal) => {
            const progress = progressData[portal.id];
            const isUnlocked = isPortalUnlocked(portal);
            const isCurrent = portal.id === currentPortal.id;
            const completionPercentage = progress
              ? Math.round((progress.completed_steps / progress.total_steps) * 100)
              : 0;

            return (
              <motion.button
                key={portal.id}
                onClick={() => handlePortalClick(portal)}
                disabled={!isUnlocked}
                whileHover={isUnlocked ? { x: 8 } : undefined}
                whileTap={isUnlocked ? { scale: 0.98 } : undefined}
                className={`
                  group relative w-full rounded-xl border p-4 text-left transition-all
                  ${isCurrent
                    ? 'border-purple-500 bg-purple-500/20'
                    : isUnlocked
                    ? 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10'
                    : 'border-gray-800 bg-black/20 cursor-not-allowed opacity-50'
                  }
                `}
              >
                {/* Lock Icon */}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="h-4 w-4 text-gray-600" />
                  </div>
                )}

                {/* Completion Check */}
                {progress?.status === 'completed' && (
                  <div className="absolute top-2 right-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Portal Info */}
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <span className="text-xl">{portal.icon || '🌟'}</span>
                  </div>

                  {/* Name & ID */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">
                      {portal.name}
                    </h4>
                    <p className="text-xs text-gray-400">
                      Portal {portal.id}
                    </p>
                  </div>

                  {/* Arrow */}
                  {isUnlocked && (
                    <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                  )}
                </div>

                {/* Progress Bar */}
                {showProgress && isUnlocked && progress && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-purple-400">{completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </nav>
      );
  }
}

// ============================================
// VARIANT COMPONENTS
// ============================================

function HorizontalNav({ 
  portals, 
  currentPortal, 
  progressData, 
  isPortalUnlocked, 
  handlePortalClick,
  showProgress 
}: any) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {portals.map((portal: Portal) => {
        const progress = progressData[portal.id];
        const isUnlocked = isPortalUnlocked(portal);
        const isCurrent = portal.id === currentPortal.id;
        const completionPercentage = progress
          ? Math.round((progress.completed_steps / progress.total_steps) * 100)
          : 0;

        return (
          <motion.button
            key={portal.id}
            onClick={() => handlePortalClick(portal)}
            disabled={!isUnlocked}
            whileHover={isUnlocked ? { y: -4 } : undefined}
            className={`
              relative flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl border p-4 transition-all
              ${isCurrent
                ? 'border-purple-500 bg-purple-500/20'
                : isUnlocked
                ? 'border-white/10 bg-white/5 hover:border-purple-500/50'
                : 'border-gray-800 bg-black/20 cursor-not-allowed opacity-50'
              }
            `}
          >
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <span className="text-3xl">{portal.icon || '🌟'}</span>
            </div>

            {/* Name */}
            <h4 className="text-sm font-semibold text-white text-center">
              {portal.name}
            </h4>

            {/* Progress */}
            {showProgress && isUnlocked && progress && (
              <div className="w-full">
                <div className="h-1 overflow-hidden rounded-full bg-black/50">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">{completionPercentage}%</p>
              </div>
            )}

            {/* Lock/Check */}
            {!isUnlocked && (
              <Lock className="absolute top-2 right-2 h-4 w-4 text-gray-600" />
            )}
            {progress?.status === 'completed' && (
              <Check className="absolute top-2 right-2 h-4 w-4 text-green-500" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function CircularNav({ 
  portals, 
  currentPortal, 
  progressData, 
  isPortalUnlocked, 
  handlePortalClick 
}: any) {
  const radius = 200;
  const centerX = 250;
  const centerY = 250;

  return (
    <div className="relative h-[500px] w-[500px]">
      {/* Center - Current Portal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
          <span className="text-4xl">{currentPortal.icon || '🌟'}</span>
        </div>
      </div>

      {/* Portals in Circle */}
      {portals.map((portal: Portal, index: number) => {
        const angle = (index / portals.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        const isUnlocked = isPortalUnlocked(portal);
        const isCurrent = portal.id === currentPortal.id;

        if (isCurrent) return null; // Skip current portal (it's in center)

        return (
          <motion.button
            key={portal.id}
            onClick={() => handlePortalClick(portal)}
            disabled={!isUnlocked}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={isUnlocked ? { scale: 1.2 } : undefined}
            className={`
              absolute flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all
              ${isUnlocked
                ? 'border-purple-500 bg-purple-500/20 hover:bg-purple-500/40'
                : 'border-gray-700 bg-black/20 cursor-not-allowed opacity-50'
              }
            `}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-2xl">{portal.icon || '🌟'}</span>
          </motion.button>
        );
      })}

      {/* Connection Lines */}
      <svg className="absolute inset-0 pointer-events-none">
        {portals.map((portal: Portal, index: number) => {
          if (portal.id === currentPortal.id) return null;
          
          const angle = (index / portals.length) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return (
            <motion.line
              key={portal.id}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="rgba(139, 92, 246, 0.2)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: index * 0.1 }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default PortalNavigation;