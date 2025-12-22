// components/portals/portal-grid.tsx
// Portal Grid - Display all portals with progress

'use client'

import { motion } from 'framer-motion'

import Link from 'next/link'

import type { Database } from '@/types/database.types'

type Portal = Database['public']['Tables']['portals']['Row']
type Progress = Database['public']['Tables']['user_portal_progress']['Row']

interface PortalGridProps {
  portals: Portal[]
  userProgress: Progress[]
}

export function PortalGrid({ portals, userProgress }: PortalGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {portals.map((portal, index) => {
        const progress = userProgress.find((p) => p.portal_id === portal.id)
        return (
          <PortalCard
            key={portal.id}
            portal={portal}
            progress={progress}
            index={index}
          />
        )
      })}
    </div>
  )
}

function PortalCard({
  portal,
  progress,
  index,
}: {
  portal: Portal
  progress?: Progress
  index: number
}) {
  const completionPercentage = progress?.completion_percentage || 0
  const status = progress?.status || 'not_started'

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return '✓ Completed'
      case 'in_progress':
        return '⏳ In Progress'
      default:
        return '🚀 Start Now'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/portal/${portal.portal_code}`}>
        <div
          className={`group relative p-6 rounded-2xl bg-gradient-to-br hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${portal.color_primary}, ${portal.color_secondary})`,
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              {portal.icon}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-2">
              {portal.title}
            </h3>

            {/* Description */}
            <p className="text-white/90 text-sm mb-4 line-clamp-2">
              {portal.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}
              >
                {getStatusText()}
              </span>

              {progress && (
                <span className="text-xs text-white/80">
                  Step {progress.current_step} of {progress.total_steps}
                </span>
              )}
            </div>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
        </div>
      </Link>
    </motion.div>
  )
}