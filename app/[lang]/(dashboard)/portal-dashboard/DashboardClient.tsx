'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Compass,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  Globe,
  Bell,
  Search,
} from 'lucide-react'
import Link from 'next/link'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    dashboard: 'Dashboard',
    portals: 'Portale',
    profile: 'Profil',
    settings: 'Setări',
    logout: 'Deconectare',
    welcome: 'Bine ai revenit',
    stats: {
      completed: 'Completate',
      inProgress: 'În progres',
      achievements: 'Realizări',
    },
    yourPortals: 'Portalurile tale',
    continuePortal: 'Continuă',
    startPortal: 'Începe',
    noPortals: 'Nu ai început încă niciun portal. Explorează și descoperă-ți drumul!',
    explorePortals: 'Explorează portale',
    search: 'Caută portale...',
  },
  en: {
    dashboard: 'Dashboard',
    portals: 'Portals',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    welcome: 'Welcome back',
    stats: {
      completed: 'Completed',
      inProgress: 'In Progress',
      achievements: 'Achievements',
    },
    yourPortals: 'Your Portals',
    continuePortal: 'Continue',
    startPortal: 'Start',
    noPortals: 'You haven't started any portals yet. Explore and discover your path!',
    explorePortals: 'Explore portals',
    search: 'Search portals...',
  },
} as const

const safeLang = (x: string): Lang => (x === 'ro' ? 'ro' : 'en')

interface DashboardClientProps {
  lang: string
  user: any
  profile: any
  portals: any[]
}

export default function DashboardClient({
  lang: langRaw,
  user,
  profile,
  portals,
}: DashboardClientProps) {
  const lang = safeLang(langRaw)
  const t = COPY[lang]
  const router = useRouter()
  const supabase = createClient()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push(`/${lang}/login`)
  }

  const navigation = [
    { name: t.dashboard, href: `/${lang}/portal-dashboard`, icon: LayoutDashboard, current: true },
    { name: t.portals, href: `/${lang}/portals`, icon: Compass, current: false },
    { name: t.profile, href: `/${lang}/profile`, icon: User, current: false },
    { name: t.settings, href: `/${lang}/settings`, icon: Settings, current: false },
  ]

  const stats = [
    {
      name: t.stats.completed,
      value: portals.filter((p) => p.completed_at).length.toString(),
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      name: t.stats.inProgress,
      value: portals.filter((p) => !p.completed_at).length.toString(),
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: t.stats.achievements,
      value: '0',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full backdrop-blur-xl bg-white/5 border-r border-white/10">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PORVERSE</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    item.current
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 backdrop-blur-xl bg-white/5 border-b border-white/10">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/60 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search bar */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder={t.search}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/25 transition"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Language switcher */}
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition">
                <Globe className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-white hidden md:block">
                    {profile?.full_name || user.email}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white/10 border border-white/10 rounded-xl shadow-lg overflow-hidden">
                    <Link
                      href={`/${lang}/profile`}
                      className="block px-4 py-3 text-white/80 hover:bg-white/5 transition"
                    >
                      {t.profile}
                    </Link>
                    <Link
                      href={`/${lang}/settings`}
                      className="block px-4 py-3 text-white/80 hover:bg-white/5 transition"
                    >
                      {t.settings}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition"
                    >
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t.welcome}, {profile?.full_name || user.email}!
            </h1>
            <p className="text-white/60">Continue your journey through the portals</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.name}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.name}</div>
                </div>
              )
            })}
          </div>

          {/* Portals section */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{t.yourPortals}</h2>
              <Link
                href={`/${lang}/portals`}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {t.explorePortals}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {portals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Compass className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/60 mb-4">{t.noPortals}</p>
                <Link
                  href={`/${lang}/portals`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-medium hover:opacity-90 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  {t.explorePortals}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portals.map((portal) => (
                  <div
                    key={portal.id}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition group"
                  >
                    <h3 className="text-white font-medium mb-2 line-clamp-1">
                      {portal.portal?.title || 'Portal'}
                    </h3>
                    <p className="text-sm text-white/60 mb-4 line-clamp-2">
                      {portal.portal?.description || 'Explore this portal'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/50">
                        {Math.round((portal.current_step / (portal.total_steps || 1)) * 100)}% complete
                      </div>
                      <Link
                        href={`/${lang}/portals/${portal.portal_id}`}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {t.continuePortal}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                        style={{
                          width: `${Math.round((portal.current_step / (portal.total_steps || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
