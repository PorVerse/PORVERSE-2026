// components/portals/portal-steps.tsx
// Portal Steps - FIXED: Persistență răspunsuri + UX îmbunătățit

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import type { Database } from '@/types/database.types'

type Portal = Database['public']['Tables']['portals']['Row']
type Step = Database['public']['Tables']['portal_steps']['Row']
type Progress = Database['public']['Tables']['user_portal_progress']['Row']

interface StepSection {
  title?: string
  content?: string
  type?: 'exercise' | 'reflection' | 'info' | 'assessment'
  prompt?: string
  questions?: string[]
}

interface ParsedStepContent {
  intro?: string
  sections?: StepSection[]
}

interface PortalStepsProps {
  portal: Portal
  steps: Step[]
  progress: Progress | null
  userId: string
}

function parseStepContent(content: unknown): ParsedStepContent {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content) as ParsedStepContent
    } catch {
      return { intro: content, sections: [] }
    }
  }
  return content as ParsedStepContent
}

function InteractiveStepContent({ 
  content,
  responses,
  onResponseChange 
}: { 
  content: unknown
  stepId: string
  responses: Record<string, string>
  onResponseChange: (key: string, value: string) => void
}) {
  const parsed = parseStepContent(content)

  return (
    <div className="space-y-6">
      {parsed.intro && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500">
          <p className="text-gray-800 font-medium">{parsed.intro}</p>
        </div>
      )}

      {parsed.sections && parsed.sections.length > 0 && (
        <div className="space-y-6">
          {parsed.sections.map((section: StepSection, index: number) => (
            <div key={index} className="space-y-3">
              {section.title && (
                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <span>📌</span>
                  {section.title}
                </h4>
              )}

              {section.content && section.type !== 'exercise' && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-gray-700">{section.content}</p>
                </div>
              )}

              {section.type === 'exercise' && (
                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 rounded-xl border-2 border-purple-300 shadow-md">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-3xl">✍️</span>
                    <div className="flex-1">
                      <p className="font-bold text-purple-900 text-lg mb-2">Exercise:</p>
                      <p className="text-gray-700 mb-4">{section.content}</p>
                      
                      <textarea
                        value={responses[`exercise_${index}`] || ''}
                        onChange={(e) => onResponseChange(`exercise_${index}`, e.target.value)}
                        placeholder="Write your thoughts here... (minimum 50 characters)"
                        className="w-full min-h-[150px] p-4 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-y"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {responses[`exercise_${index}`]?.length || 0} characters
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {section.type === 'reflection' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-300 shadow-md">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-3xl">💭</span>
                    <div className="flex-1">
                      <p className="font-bold text-blue-900 text-lg mb-2">Reflection:</p>
                      <p className="text-gray-700 mb-4">{section.content}</p>
                      
                      <textarea
                        value={responses[`reflection_${index}`] || ''}
                        onChange={(e) => onResponseChange(`reflection_${index}`, e.target.value)}
                        placeholder="Take your time to reflect deeply..."
                        className="w-full min-h-[150px] p-4 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {responses[`reflection_${index}`]?.length || 0} characters
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {section.questions && Array.isArray(section.questions) && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">📝</span>
                    <div className="flex-1 space-y-4">
                      <p className="font-bold text-green-900 text-lg">Questions to Answer:</p>
                      
                      {section.questions.map((question: string, qIndex: number) => (
                        <div key={qIndex} className="space-y-2">
                          <label className="block">
                            <span className="font-medium text-gray-800 flex items-start gap-2">
                              <span className="text-green-600">{qIndex + 1}.</span>
                              {question}
                            </span>
                            <textarea
                              value={responses[`question_${index}_${qIndex}`] || ''}
                              onChange={(e) => onResponseChange(`question_${index}_${qIndex}`, e.target.value)}
                              placeholder="Your answer..."
                              className="mt-2 w-full min-h-[100px] p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-y"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {section.type === 'assessment' && !section.questions && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-300 shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🎯</span>
                    <div className="flex-1">
                      <p className="font-bold text-yellow-900 text-lg mb-2">Assessment:</p>
                      {section.content && <p className="text-gray-700 mb-4">{section.content}</p>}
                      
                      <textarea
                        value={responses[`assessment_${index}`] || ''}
                        onChange={(e) => onResponseChange(`assessment_${index}`, e.target.value)}
                        placeholder="Complete your assessment here..."
                        className="w-full min-h-[150px] p-4 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PortalSteps({ portal, steps, progress, userId }: PortalStepsProps) {
  const currentStepNumber = progress?.current_step || 1
  
  // DOAR current step este expandat la început
  const [expandedStep, setExpandedStep] = useState<string | null>(
    steps.find(s => s.step_number === currentStepNumber)?.id || null
  )
  
  const [stepResponses, setStepResponses] = useState<Record<string, Record<string, string>>>({})
  const [loadedResponses, setLoadedResponses] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load saved responses când se expandează un step
  useEffect(() => {
    const loadResponses = async () => {
      if (!expandedStep || loadedResponses.has(expandedStep)) {return}
      
      try {
        const response = await fetch(`/api/portals/get-responses?stepId=${expandedStep}&userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.responses && Object.keys(data.responses).length > 0) {
            setStepResponses(prev => ({
              ...prev,
              [expandedStep]: data.responses
            }))
          }
          setLoadedResponses(prev => new Set([...prev, expandedStep]))
        }
      } catch (error) {
        console.error('Error loading responses:', error)
      }
    }
    
    loadResponses()
  }, [expandedStep, userId, loadedResponses])

  const handleResponseChange = (stepId: string, key: string, value: string) => {
    setStepResponses(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [key]: value
      }
    }))
  }

  const validateResponses = (stepId: string): boolean => {
    const responses = stepResponses[stepId] || {}
    const values = Object.values(responses).filter(v => v) // doar non-empty
    
    if (values.length === 0) {
      toast.error('Please answer at least one question before completing this step')
      return false
    }
    
    // Check că toate răspunsurile completate au minim 10 caractere
    const allValid = values.every(val => val.trim().length >= 50)
    
    if (!allValid) {
      toast.error('Please provide meaningful answers (minimum 50 characters each)')
      return false
    }
    
    return true
  }

  const handleCompleteStep = async (step: Step) => {
    const stepNumber = step.step_number
    
    if (!validateResponses(step.id)) {
      return
    }
    
    setIsSubmitting(true)

    try {
      // 1. Salvează răspunsurile
      const saveResponse = await fetch('/api/portals/save-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          portalId: portal.id,
          stepId: step.id,
          stepNumber,
          responses: stepResponses[step.id] || {}
        }),
      })

      if (!saveResponse.ok) {throw new Error('Failed to save responses')}

      // 2. Completează step-ul
      const completeResponse = await fetch('/api/portals/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          portalId: portal.id,
          stepNumber,
        }),
      })

      if (!completeResponse.ok) {throw new Error('Failed to complete step')}

      toast.success('Step completed! Your responses have been saved.')
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      toast.error('Failed to complete step. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const stepNumber = step.step_number
        const isCompleted = stepNumber < currentStepNumber
        const isCurrent = stepNumber === currentStepNumber
        const isLocked = stepNumber > currentStepNumber
        const isExpanded = expandedStep === step.id
        const hasUnsavedChanges = stepResponses[step.id] && Object.keys(stepResponses[step.id] || {}).length > 0 && !isCompleted

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl shadow-md overflow-hidden ${
              isLocked ? 'opacity-60' : ''
            }`}
          >
            <button
              onClick={() =>
                !isLocked && setExpandedStep(isExpanded ? null : step.id)
              }
              disabled={isLocked}
              className="w-full p-6 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                    ? `bg-gradient-to-br`
                    : 'bg-gray-300'
                }`}
                style={
                  isCurrent
                    ? {
                        background: `linear-gradient(135deg, ${portal.color_primary}, ${portal.color_secondary})`,
                      }
                    : {}
                }
              >
                {isCompleted ? '✓' : isLocked ? '🔒' : stepNumber}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>

                  <div className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {step.estimated_duration} min
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted
                        ? 'bg-green-100 text-green-800'
                        : isCurrent
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isCompleted
                      ? '✓ Completed'
                      : isCurrent
                      ? '🔥 Current Step'
                      : '🔒 Locked'}
                  </span>
                  
                  {hasUnsavedChanges && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium">
                      📝 Unsaved changes
                    </span>
                  )}
                </div>
              </div>

              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {isExpanded && !isLocked && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
                    <InteractiveStepContent
                      content={step.content}
                      stepId={step.id}
                      responses={stepResponses[step.id] || {}}
                      onResponseChange={(key, value) => handleResponseChange(step.id, key, value)}
                    />

                    {isCurrent && !isCompleted && (
                      <div className="mt-8 space-y-4">
                        <button
                          onClick={() => handleCompleteStep(step)}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-gradient-to-r text-white font-bold px-8 py-4 rounded-xl hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: `linear-gradient(135deg, ${portal.color_primary}, ${portal.color_secondary})`,
                          }}
                        >
                          {isSubmitting ? 'Saving...' : 'Complete This Step →'}
                        </button>
                        
                        <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-200">
                          💡 Your answers will be saved and analyzed by AI to provide personalized guidance throughout your journey
                        </p>
                      </div>
                    )}
                    
                    {isCompleted && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                          <span className="text-xl">✓</span>
                          <span>You completed this step. Your responses are saved and being used by AI.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}