/**
 * Portal Session Component
 * @module components/portals/portal-session
 * @description Manages active portal session with AI integration
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

import { logger } from '@/lib/logger';
import { usePortalStore } from '@/stores/portal-store';

import { ErrorBoundary } from '@/components/ErrorBoundary';

import { useAIStore } from '@/stores/ai-store';

interface PortalSessionProps {
  portalId: string;
  onComplete: () => void;
  onExit: () => void;
}
export const PortalSession = memo((props: PortalSessionProps) => {
  if (process.env['NODE_ENV'] === 'development') {
    // Props validated by TypeScript
  }

  const { portalId, onComplete, onExit } = props;
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const mountedRef = useRef(true);

  const { portal, progress, updateProgress } = usePortalStore(state => ({
    portal: state.getPortalById(portalId),
    progress: state.getProgressForPortal(portalId),
    updateProgress: state.updateProgress
  }))

  // Derive steps from portal data (portal.steps is part of the Portal interface)
  const steps = portal?.steps || [];

  const { sendMessage, messages, isLoading } = useAIStore();

  useEffect(() => {
    logger.info('Portal session started', { portalId });
    return () => {
      mountedRef.current = false;
      logger.info('Portal session ended', { portalId, step: currentStep });
    };
  }, [portalId, currentStep]);

  const handleStepComplete = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Save user response
      await updateProgress(portalId, {
        currentStep: currentStep + 1
      });

      // Get AI guidance for next step
      if (currentStep < steps.length - 1) {
        await sendMessage({
          role: 'user',
          content: userInput,
          context: {
            portalId,
            step: currentStep,
            stepTitle: steps[currentStep]?.name || ''
          }
        });
      }

      setCurrentStep(prev => prev + 1);
      setUserInput('');
      
      logger.info('Portal step completed', { portalId, step: currentStep });
      
    } catch (error) {
      Sentry.captureException(error);
      
      logger.error('Failed to complete step', { error, portalId, step: currentStep });
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [portalId, currentStep, steps, userInput, sendMessage, updateProgress]);

  const handleComplete = useCallback(async () => {
    try {
      await updateProgress(portalId, {
        completedAt: new Date().toISOString()
      });
      
      logger.info('Portal completed', { portalId });
      onComplete();
      
    } catch (error) {
      Sentry.captureException(error);
    }
  }, [portalId, onComplete, updateProgress]);

  if (!portal || !steps) {
    return <div>Loading portal...</div>;
  }

  const isLastStep = currentStep >= steps.length - 1;
  const step = steps[currentStep];

  return (
    <ErrorBoundary>
      <div className="portal-session" data-testid="portal-session">
        {/* Header */}
        <div className="session-header">
          <h1>{portal.name}</h1>
          <div className="progress-indicator">
            <span>{currentStep + 1} / {steps.length}</span>
            <div className="progress-dots">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="step-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="step-icon">
              <BookOpen size={48} />
            </div>
            
            <h2 className="step-title">{step?.name}</h2>
            <p className="step-description">{step?.description}</p>

            {/* User Input Area */}
            <div className="input-area">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={ "Share your thoughts..."}
                rows={6}
                disabled={isProcessing || isLoading}
                data-testid="step-input"
              />
            </div>

            {/* AI Messages */}
            {messages.length > 0 && (
              <div className="ai-messages">
                {messages.map((msg: unknown, idx: number) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <MessageCircle size={20} />
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="step-actions">
              <button
                onClick={onExit}
                className="btn-secondary"
                disabled={isProcessing}
              >
                Save & Exit
              </button>
              
              {!isLastStep ? (
                <button
                  onClick={handleStepComplete}
                  className="btn-primary"
                  disabled={!userInput.trim() || isProcessing || isLoading}
                  data-testid="complete-step"
                >
                  {isProcessing ? 'Processing...' : 'Continue'}
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="btn-success"
                  disabled={!userInput.trim() || isProcessing}
                  data-testid="complete-portal"
                >
                  Complete Portal
                  <CheckCircle size={20} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <style jsx>{`
          .portal-session {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
          }

          .session-header {
            margin-bottom: 3rem;
          }

          .session-header h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #2c3e50;
          }

          .progress-indicator {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .progress-dots {
            display: flex;
            gap: 0.5rem;
          }

          .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ddd;
            transition: all 0.3s;
          }

          .dot.active {
            background: #3498db;
            transform: scale(1.3);
          }

          .dot.completed {
            background: #27ae60;
          }

          .step-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .step-icon {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
            color: #3498db;
          }

          .step-title {
            font-size: 1.5rem;
            text-align: center;
            margin-bottom: 1rem;
            color: #2c3e50;
          }

          .step-description {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 2rem;
            line-height: 1.6;
          }

          .input-area {
            margin-bottom: 2rem;
          }

          .input-area textarea {
            width: 100%;
            padding: 1rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-family: inherit;
            font-size: 1rem;
            resize: vertical;
            transition: border-color 0.3s;
          }

          .input-area textarea:focus {
            outline: none;
            border-color: #3498db;
          }

          .ai-messages {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
          }

          .message {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 6px;
            background: white;
          }

          .message.assistant {
            background: #e3f2fd;
          }

          .step-actions {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
          }

          button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-primary {
            background: #3498db;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #2980b9;
          }

          .btn-secondary {
            background: #95a5a6;
            color: white;
          }

          .btn-success {
            background: #27ae60;
            color: white;
          }

          .btn-success:hover:not(:disabled) {
            background: #229954;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
});
