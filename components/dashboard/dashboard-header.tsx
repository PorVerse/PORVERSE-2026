// components/dashboard/dashboard-header.tsx
// Dashboard Header - Navigation & User Menu

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signOut } from '@/lib/auth/auth-helpers'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const getSubscriptionBadge = () => {
    const tier = profile?.subscription_tier || 'free'
    const colors = { free: '...', pro: '...', elite: '...' } as const
    const key = (tier ?? 'free') as keyof typeof colors
className={`px-3 py-1 rounded-full text-xs font-medium ${colors[key]}`}
,
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${colors[tier]}`}
      >
        {tier.toUpperCase()}
      </span>
    )
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/portal-dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PorVerse
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/portal-dashboard"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/ai-chat"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              AI Guide
            </Link>
            <Link
              href="/quantum-vault"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Quantum Vault
            </Link>
            <Link
              href="/settings"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Settings
            </Link>
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {profile?.full_name?.[0]?.toUpperCase() ||
                  user.email?.[0]?.toUpperCase()}
              </div>

              {/* User Info */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user.email}
                </p>
                {getSubscriptionBadge()}
              </div>

              {/* Dropdown Icon */}
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isMenuOpen ? 'rotate-180' : ''
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

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ⚙️ Settings
                </Link>
                <Link
                  href="/settings/subscription"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  💳 Subscription
                </Link>
                <hr className="my-2" />
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}