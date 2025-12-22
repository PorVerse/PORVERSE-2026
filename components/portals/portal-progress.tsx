// components/portals/portal-progress.tsx
// Portal Progress - Visual progress overview

'use client'

import { motion } from 'framer-motion'

import type { Database } from '@/types/database.types'

type Portal = Database['public']['Tables']['portals']['Row']
type Progress = Database['public']['Tables']['user_portal_progress']['Row']
type Step = Database['public']['Tables']['portal_steps']['Row']

interface PortalProgressProps {
  portal: Portal
  progress: Progress | null
  steps: Step[]
}

export function PortalProgress({ portal, progress, steps }: PortalProgressProps) {
  const completionPercentage = progress?.completion_percentage || 0
  const currentStep = progress?.current_step || 1
  const totalSteps = steps.length
  const completedSteps = currentStep - 1

  const totalEstimatedTime = steps.reduce(
    (acc, step) => acc + step.estimated_duration,
    0
  )
  const completedTime = steps
    .slice(0, completedSteps)
    .reduce((acc, step) => acc + step.estimated_duration, 0)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Progress</h2>

      {/* Main Progress Circle */}
      <div className="flex items-center gap-8 mb-8">
        {/* Progress Circle */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={portal.color_primary}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{
                strokeDashoffset:
                  2 * Math.PI * 56 * (1 - completionPercentage / 100),
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {completionPercentage}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <StatCard
            label="Steps Completed"
            value={`${completedSteps}/${totalSteps}`}
            icon="✓"
            color={portal.color_primary}
          />
          <StatCard
            label="Time Invested"
            value={`${completedTime} min`}
            icon="⏱️"
            color={portal.color_secondary}
          />
          <StatCard
            label="Current Step"
            value={`Step ${currentStep}`}
            icon="🎯"
            color={portal.color_primary}
          />
          <StatCard
            label="Est. Remaining"
            value={`${totalEstimatedTime - completedTime} min`}
            icon="⏳"
            color={portal.color_secondary}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Step Timeline
        </h3>
        <div className="flex items-center gap-2">
          {steps.map((step) => {
            const isCompleted = step.step_number < currentStep
            const isCurrent = step.step_number === currentStep

            return (
              <div
                key={step.id}
                className="flex-1 h-2 rounded-full overflow-hidden relative"
                style={{
                  background: isCompleted || isCurrent
                    ? `linear-gradient(135deg, ${portal.color_primary}, ${portal.color_secondary})`
                    : '#e5e7eb',
                }}
              >
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 bg-white/30"
                    animate={{ x: ['0%', '100%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Start</span>
          <span>{totalSteps} Steps</span>
          <span>Complete</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div
      className="rounded-lg p-3 border-2"
      style={{ borderColor: `${color  }40`, backgroundColor: `${color  }10` }}
    >
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  )
}