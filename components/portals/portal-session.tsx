// components/portals/portal-session.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Clock, 
  Eye,
  Brain,
  Heart,
  X
} from 'lucide-react';
import { Portal, SessionData, PortalStep } from '@/types/portal';
import { EmotionReading } from '@/types/biometric';
import { createClient } from '@/lib/supabase/client';

export interface PortalSessionProps {
  portalId: string;
  currentStep: number;
  totalSteps: number;
  sessionData: SessionData;
  onStepComplete: (stepId: string) => void;
  onSessionEnd: () => void;
  biometricIntegration?: boolean;
}

export function PortalSession({
  portalId,
  currentStep,
  totalSteps,
  sessionData,
  onStepComplete,
  onSessionEnd,
  biometricIntegration = false
}: PortalSessionProps) {
  const supabase = createClient();
  
  // State
  const [portal, setPortal] = useState<Portal | null>(null);
  const [steps, setSteps] = useState<PortalStep[]>([]);
  const [activeStep, setActiveStep] = useState<PortalStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [emotionData, setEmotionData] = useState<EmotionReading | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Load portal and steps
  useEffect(() => {
    loadPortalData();
  }, [portalId]);

  // Update active step when currentStep changes
  useEffect(() => {
    if (steps.length > 0 && currentStep < steps.length) {
      setActiveStep(steps[currentStep]);
    }
  }, [currentStep, steps]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const loadPortalData = async () => {
    setIsLoading(true);

    // Load portal
    const { data: portalData } = await supabase
      .from('portals')
      .select('*')
      .eq('id', portalId)
      .single();

    if (portalData) {
      setPortal(portalData);
    }

    // Load steps
    const { data: stepsData } = await supabase
      .from('portal_steps')
      .select('*')
      .eq('portal_id', portalId)
      .order('order_index', { ascending: true });

    if (stepsData) {
      setSteps(stepsData);
      setActiveStep(stepsData[currentStep] || stepsData[0]);
    }

    setIsLoading(false);
  };

  const handleStepComplete = useCallback(() => {
    if (!activeStep) return;

    onStepComplete(activeStep.id);

    // Play completion sound/animation
    playCompletionFeedback();

    // Move to next step
    if (currentStep < totalSteps - 1) {
      setActiveStep(steps[currentStep + 1]);
    } else {
      // Session complete
      handleSessionComplete();
    }
  }, [activeStep, currentStep, totalSteps, steps, onStepComplete]);

  const handleSessionComplete = () => {
    // Show completion modal/animation
    playSessionCompletionAnimation();

    // Save session data
    saveSessionData();

    // Navigate away after animation
    setTimeout(() => {
      onSessionEnd();
    }, 2000);
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    // Save progress
    saveSessionData();
    onSessionEnd();
  };

  const playCompletionFeedback = () => {
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  const playSessionCompletionAnimation = () => {
    // Trigger confetti or celebration animation
    console.log('🎉 Session completed!');
  };

  const saveSessionData = async () => {
    await supabase
      .from('portal_sessions')
      .upsert({
        portal_id: portalId,
        user_id: sessionData.userId,
        current_step: currentStep,
        time_spent: timeElapsed,
        session_data: sessionData,
        last_activity: new Date().toISOString()
      });
  };

  if (isLoading || !portal || !activeStep) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-white">Loading session...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b border-purple-500/20 bg-black/50 backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Exit Button */}
            <button
              onClick={handleExit}
              className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Exit</span>
            </button>

            {/* Portal Info */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">{portal.name}</h1>
              <p className="text-sm text-gray-400">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-5 w-5" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            {/* Step Content */}
            <div className="mb-8 rounded-2xl border border-purple-500/30 bg-black/30 p-8 backdrop-blur-md">
              {/* Step Title */}
              <h2 className="mb-4 text-3xl font-bold text-white">
                {activeStep.title}
              </h2>

              {/* Step Description */}
              <p className="mb-6 text-lg text-gray-300">
                {activeStep.description}
              </p>

              {/* Step Content */}
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: activeStep.content }}
              />

              {/* Interactive Elements */}
              {activeStep.interactive_elements && (
                <div className="mt-8">
                  {renderInteractiveElements(activeStep.interactive_elements)}
                </div>
              )}
            </div>

            {/* Biometric Integration */}
            {biometricIntegration && (
              <BiometricOverlay
                onEmotionUpdate={setEmotionData}
                portalTheme={portal.theme}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentStep > 0) {
                    setActiveStep(steps[currentStep - 1]);
                  }
                }}
                disabled={currentStep === 0}
                className={`
                  flex items-center gap-2 rounded-lg px-6 py-3 font-semibold
                  transition-all
                  ${currentStep === 0
                    ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                    : 'bg-purple-900/50 text-white hover:bg-purple-900'
                  }
                `}
              >
                <ArrowLeft className="h-5 w-5" />
                Previous
              </motion.button>

              {/* Complete Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStepComplete}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    <Check className="h-5 w-5" />
                    Complete Session
                  </>
                ) : (
                  <>
                    Next Step
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sidebar - AI Guidance & Stats */}
      <aside className="fixed right-0 top-20 h-[calc(100vh-5rem)] w-80 border-l border-purple-500/20 bg-black/50 p-6 backdrop-blur-md">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Brain className="h-5 w-5 text-purple-400" />
          AI Guidance
        </h3>

        {/* AI Suggestions */}
        <div className="mb-6 rounded-lg bg-purple-900/20 p-4">
          <p className="text-sm text-gray-300">
            Take your time with this step. Focus on understanding the concepts before moving forward.
          </p>
        </div>

        {/* Emotion Display */}
        {biometricIntegration && emotionData && (
          <div className="mb-6">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Heart className="h-4 w-4 text-pink-400" />
              Current State
            </h4>
            <div className="rounded-lg bg-black/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{getEmotionEmoji(emotionData.emotion)}</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white capitalize">
                    {emotionData.emotion}
                  </p>
                  <p className="text-xs text-gray-400">
                    {Math.round(emotionData.confidence * 100)}% confident
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Eye className="h-4 w-4 text-blue-400" />
            Session Stats
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Steps Completed</span>
              <span className="text-white">{currentStep + 1} / {totalSteps}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Time Elapsed</span>
              <span className="text-white">{formatTime(timeElapsed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="text-white">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-black p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-2xl font-bold text-white">
                Exit Session?
              </h3>
              <p className="mb-6 text-gray-300">
                Your progress will be saved, but you'll need to resume later.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 rounded-lg bg-gray-800 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-semibold text-white"
                >
                  Exit Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function BiometricOverlay({ 
  onEmotionUpdate, 
  portalTheme 
}: { 
  onEmotionUpdate: (data: EmotionReading) => void;
  portalTheme: any;
}) {
  // Implement biometric scanning overlay
  return (
    <div className="fixed bottom-6 left-6 rounded-lg border border-purple-500/30 bg-black/50 p-4 backdrop-blur-md">
      <p className="text-sm text-gray-400">Biometric monitoring active</p>
    </div>
  );
}

function renderInteractiveElements(elements: any) {
  // Render different types of interactive elements
  // (quiz, reflection, meditation timer, etc.)
  return <div>Interactive elements coming soon</div>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

export default PortalSession;