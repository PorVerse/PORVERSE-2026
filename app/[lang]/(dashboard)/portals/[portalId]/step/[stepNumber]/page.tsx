'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  Star,
  Clock,
  CheckCircle2,
  Zap,
  TrendingUp,
  Award,
} from 'lucide-react'
import Link from 'next/link'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    back: 'Înapoi la portal',
    step: 'Pas',
    of: 'din',
    timeEstimate: 'Timp estimat',
    xpReward: 'Recompensă XP',
    yourResponse: 'Răspunsul tău',
    submit: 'Trimite răspuns',
    submitting: 'Se trimite...',
    next: 'Pas următor',
    complete: 'Finalizează portal',
    completed: 'Completat',
    loading: 'Se încarcă...',
    min: 'min',
    saved: 'Salvat!',
    earned: 'Ai câștigat',
    level: 'Nivel',
    totalXP: 'Total XP',
  },
  en: {
    back: 'Back to portal',
    step: 'Step',
    of: 'of',
    timeEstimate: 'Estimated time',
    xpReward: 'XP Reward',
    yourResponse: 'Your response',
    submit: 'Submit response',
    submitting: 'Submitting...',
    next: 'Next step',
    complete: 'Complete portal',
    completed: 'Completed',
    loading: 'Loading...',
    min: 'min',
    saved: 'Saved!',
    earned: 'You earned',
    level: 'Level',
    totalXP: 'Total XP',
  },
} as const

const safeLang = (x: string): Lang => (x === 'ro' ? 'ro' : 'en')

interface Step {
  id: string
  step_number: number
  name: string
  description: string
  content: any
  question_type: string
  question_data: any
  estimated_time: number
  experience_points: number
  isCompleted: boolean
  userResponse: any
}

export default function MegaInterstellarStepPage({
  params,
}: {
  params: { lang: string; portalId: string; stepNumber: string }
}) {
  const lang = safeLang(params.lang)
  const t = COPY[lang]
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step | null>(null)
  const [portal, setPortal] = useState<any>(null)
  const [response, setResponse] = useState('')
  const [scaleValues, setScaleValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number }>>([])
  const [startTime] = useState(Date.now())

  // Generate particles
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  // Fetch step data
  useEffect(() => {
    fetchStepData()
  }, [params.stepNumber])

  const fetchStepData = async () => {
    try {
      setLoading(true)

      // Fetch portal
      const portalRes = await fetch(`/api/portals/${params.portalId}`)
      const portalData = await portalRes.json()
      setPortal(portalData.data)

      // Fetch step
      const stepRes = await fetch(
        `/api/portals/${params.portalId}/steps/${params.stepNumber}`
      )
      const stepData = await stepRes.json()
      setStep(stepData.data)

      // Pre-fill response if exists
      if (stepData.data.userResponse) {
        if (stepData.data.question_type === 'text') {
          setResponse(stepData.data.userResponse.text || '')
        } else if (stepData.data.question_type === 'scale') {
          setScaleValues(stepData.data.userResponse.scales || {})
        }
      }
    } catch (error) {
      console.error('Error fetching step:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!step) return

    setSubmitting(true)

    try {
      // Prepare response data based on question type
      let responseData: any = {}
      if (step.question_type === 'text') {
        responseData = { text: response }
      } else if (step.question_type === 'scale') {
        responseData = { scales: scaleValues }
      }

      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)

      // Submit response
      const res = await fetch(
        `/api/portals/${params.portalId}/steps/${params.stepNumber}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responseData, timeSpent }),
        }
      )

      const data = await res.json()

      if (data.success) {
        setXpEarned(data.data.xpEarned)
        setShowSuccess(true)

        // Auto-navigate after 2 seconds
        setTimeout(() => {
          if (data.data.isPortalCompleted) {
            router.push(`/${lang}/portals/${params.portalId}`)
          } else if (data.data.nextStep) {
            router.push(`/${lang}/portals/${params.portalId}/step/${data.data.nextStep}`)
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !step || !portal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/50">
            <Sparkles className="w-10 h-10 text-white animate-spin" />
          </div>
          <div className="text-2xl font-bold text-white">{t.loading}</div>
        </div>
      </div>
    )
  }

  const isTextQuestion = step.question_type === 'text'
  const isScaleQuestion = step.question_type === 'scale'
  const canSubmit = isTextQuestion
    ? response.trim().length >= (step.question_data?.minLength || 10)
    : Object.keys(scaleValues).length >= (step.question_data?.scales?.length || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* MEGA INTERSTELLAR BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 top-1/3 right-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-96 h-96 -bottom-48 left-1/3 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-gradient-to-br from-green-900/80 to-emerald-900/80 border-2 border-green-400/50 rounded-3xl p-12 shadow-2xl shadow-green-500/50 text-center animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-pulse shadow-2xl shadow-green-500/70">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">{t.saved}</h2>
            {xpEarned > 0 && (
              <div className="text-2xl text-green-300 mb-2">
                ✨ {t.earned} <span className="text-yellow-400 font-bold">+{xpEarned} XP</span>!
              </div>
            )}
            <p className="text-green-200">Redirecting...</p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href={`/${lang}/portals/${params.portalId}`}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 backdrop-blur-xl bg-white/5 border border-purple-500/30 rounded-xl text-purple-300 hover:text-white hover:border-purple-400/50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.back}
        </Link>

        {/* Progress indicator */}
        <div className="mb-8 backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-purple-300 text-sm">
              {t.step} {step.step_number} {t.of} {portal.totalSteps}
            </div>
            <div className="text-purple-300 text-sm font-bold">
              {Math.round((step.step_number / portal.totalSteps) * 100)}%
            </div>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-purple-500/30">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all shadow-lg shadow-purple-500/50"
              style={{ width: `${(step.step_number / portal.totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-black/40 to-purple-900/20 border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20 mb-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-purple-400 font-semibold">
                  {t.step} {step.step_number}
                </div>
                <h1 className="text-3xl font-bold text-white">{step.name}</h1>
              </div>
            </div>
            <p className="text-xl text-purple-200 leading-relaxed">{step.description}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-2 text-purple-200">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{step.estimated_time} {t.min}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center gap-2 text-purple-200">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold">{step.experience_points} XP</span>
            </div>
            {step.isCompleted && (
              <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">{t.completed}</span>
              </div>
            )}
          </div>

          {/* Content prompt */}
          {step.content?.prompt && (
            <div className="mb-6 p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-purple-200 leading-relaxed">{step.content.prompt}</p>
            </div>
          )}

          {/* Question form */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-white mb-4">
              {t.yourResponse}
            </label>

            {/* Text question */}
            {isTextQuestion && (
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={step.question_data?.placeholder || 'Type your response...'}
                rows={8}
                className="w-full px-6 py-4 backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-2xl text-white placeholder:text-purple-400/50 focus:outline-none focus:border-purple-400 focus:shadow-2xl focus:shadow-purple-500/30 transition-all resize-none"
                minLength={step.question_data?.minLength}
                maxLength={step.question_data?.maxLength}
              />
            )}

            {/* Scale question */}
            {isScaleQuestion && (
              <div className="space-y-6">
                {step.question_data?.scales?.map((scale: any, index: number) => (
                  <div key={index} className="p-6 rounded-2xl bg-black/40 border border-purple-500/30">
                    <label className="block text-white font-semibold mb-4">
                      {scale.name}
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-purple-400 text-sm">{scale.min}</span>
                      <input
                        type="range"
                        min={scale.min}
                        max={scale.max}
                        value={scaleValues[scale.name] || scale.min}
                        onChange={(e) =>
                          setScaleValues({ ...scaleValues, [scale.name]: parseInt(e.target.value) })
                        }
                        className="flex-1 h-2 bg-purple-500/20 rounded-full appearance-none cursor-pointer slider"
                      />
                      <span className="text-purple-400 text-sm">{scale.max}</span>
                      <span className="text-white font-bold text-xl min-w-[3rem] text-center">
                        {scaleValues[scale.name] || scale.min}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Character count for text */}
            {isTextQuestion && step.question_data?.minLength && (
              <div className="mt-2 text-sm text-purple-300">
                {response.length} / {step.question_data?.minLength} characters minimum
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
              canSubmit && !submitting
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                {t.submit}
                <Zap className="w-6 h-6 text-yellow-400" />
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite;
        }
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
          border: none;
        }
      `}</style>
    </div>
  )
}
