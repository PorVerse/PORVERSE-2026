// components/dashboard/stats-overview.tsx
// Stats Overview - User progress statistics

'use client'

import { motion } from 'framer-motion'

import type { Database } from '@/types/database.types'

type Progress = Database['public']['Tables']['user_portal_progress']['Row']

interface StatsOverviewProps {
  userProgress: Progress[]
}

export function StatsOverview({ userProgress }: StatsOverviewProps) {
  // Calculate stats
  const totalPortals = 6 // P0-P5
  const completedPortals = userProgress.filter(
    (p) => p.status === 'completed'
  ).length
  const inProgressPortals = userProgress.filter(
    (p) => p.status === 'in_progress'
  ).length

  const totalCompletion =
    userProgress.length > 0
      ? Math.round(
          userProgress.reduce((acc, p) => acc + p.completion_percentage, 0) /
            userProgress.length
        )
      : 0

  const stats = [
    {
      label: 'Total Portals',
      value: totalPortals,
      icon: '🌟',
      color: 'from-purple-500 to-purple-700',
    },
    {
      label: 'In Progress',
      value: inProgressPortals,
      icon: '⏳',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'Completed',
      value: completedPortals,
      icon: '✓',
      color: 'from-green-500 to-green-700',
    },
    {
      label: 'Overall Progress',
      value: `${totalCompletion}%`,
      icon: '📊',
      color: 'from-blue-500 to-blue-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-3xl">{stat.icon}</div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stat.value}</div>
            </div>
          </div>
          <div className="text-white/90 text-sm font-medium">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}