// components/portals/portal-header.tsx
// Portal Header - Beautiful header pentru fiecare portal

'use client'

import Link from 'next/link'

import type { Database } from '@/types/database.types'

type Portal = Database['public']['Tables']['portals']['Row']
type Progress = Database['public']['Tables']['user_portal_progress']['Row']

interface PortalHeaderProps {
  portal: Portal
  progress: Progress | null
}

export function PortalHeader({ portal, progress }: PortalHeaderProps) {
  const completionPercentage = progress?.completion_percentage || 0

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${portal.color_primary}, ${portal.color_secondary})`,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.5),transparent)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/portal-dashboard"
          className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>

        {/* Portal Info */}
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div className="text-7xl">{portal.icon}</div>

          {/* Content */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {portal.title}
            </h1>
            <p className="text-xl text-white/90 mb-6 max-w-2xl">
              {portal.description}
            </p>

            {/* Progress Bar */}
            <div className="max-w-md">
              <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                <span>Your Progress</span>
                <span className="font-bold">{completionPercentage}%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {progress && (
          <div className="mt-8 flex flex-wrap gap-6">
            <StatBadge
              label="Current Step"
              value={`${progress.current_step} / ${progress.total_steps}`}
            />
            <StatBadge label="Status" value={progress.status.replace('_', ' ')} />
            {progress.started_at && (
              <StatBadge
                label="Started"
                value={new Date(progress.started_at).toLocaleDateString()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
      <div className="text-xs text-white/70 mb-1">{label}</div>
      <div className="text-sm font-bold text-white capitalize">{value}</div>
    </div>
  )
}