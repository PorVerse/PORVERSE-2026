export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocalization } from '@/hooks/useLocalization'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

type Lang = 'en' | 'ro'

interface AuthState {
  loading: boolean
  error: string | null
  success: string | null
  passwordVisible: boolean
}

export default function LoginPage({ params }: { params: { lang: Lang } }) {
  const lang: Lang = params.lang === 'ro' ? 'ro' : 'en'
  const { language } = useLocalization()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    loading: false,
    error: null,
    success: null,
    passwordVisible: false
  })

  // Redirect configuration
  const next = searchParams.get('next') || `/${lang}/portal-dashboard`
  
  // Initialize Supabase client
  const supabase = createClientComponentClient()

  // Translations
  const t = {
    en: {
      title: 'Welcome Back',
      subtitle: 'Sign in to continue your spiritual journey',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      signInButton: 'Sign In',
      magicLinkButton: 'Send Magic Link',
      orDivider: 'or',
      backTopricing: 'Back to Pricing',
      magicLinkSent: 'Check your email for the magic link!',
      signingIn: 'Signing in...',
      sendingLink: 'Sending link...',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      invalidEmail: 'Please enter a valid email address',
      authenticationFailed: 'Authentication failed',
      unexpectedError: 'An unexpected error occurred'
    },
    ro: {
      title: 'Bine ai revenit',
      subtitle: 'Autentifică-te pentru a continua călătoria spirituală',
      emailPlaceholder: 'Introdu emailul',
      passwordPlaceholder: 'Introdu parola',
      signInButton: 'Autentificare',
      magicLinkButton: 'Trimite Magic Link',
      orDivider: 'sau',
      backTopricing: 'Înapoi la Prețuri',
      magicLinkSent: 'Verifică emailul pentru magic link!',
      signingIn: 'Se conectează...',
      sendingLink: 'Se trimite link...',
      emailRequired: 'Emailul este obligatoriu',
      passwordRequired: 'Parola este obligatorie',
      invalidEmail: 'Te rog introdu o adresă de email validă',
      authenticationFailed: 'Autentificarea a eșuat',
      unexpectedError: 'A apărut o eroare neașteptată'
    }
  }

  const currentLang = language === 'ro' ? 'ro' : 'en'
  const translations = t[currentLang]

  // Validation helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (email: string, password?: string): string | null => {
    if (!email.trim()) return translations.emailRequired
    if (!isValidEmail(email)) return translations.invalidEmail
    if (password !== undefined && !password.trim()) return translations.passwordRequired
    return null
  }

  // Clear messages after a delay
  useEffect(() => {
    if (authState.error || authState.success) {
      const timer = setTimeout(() => {
        setAuthState(prev => ({ ...prev, error: null, success: null }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [authState.error, authState.success])

  // Password login handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validationError = validateForm(email, password)
    if (validationError) {
      setAuthState(prev => ({ ...prev, error: validationError }))
      return
    }

    setAuthState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      success: null 
    }))

    try {
      console.log('🚀 Starting password authentication...')
      console.log('📧 Email:', email)
      console.log('🔄 Redirect URL:', next)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      console.log('✅ Auth response:', { data: !!data, error: !!error })
      
      if (error) {
        console.error('❌ Authentication error:', error)
        throw error
      }

      if (data?.user) {
        console.log('👤 User authenticated:', data.user.id)
        console.log('🔄 Redirecting to:', next)
        
        // Small delay to ensure auth state is set
        setTimeout(() => {
          router.replace(next)
        }, 100)
      } else {
        throw new Error('No user data returned')
      }

    } catch (error: any) {
      console.error('💥 Login error:', error)
      
      let errorMessage = translations.authenticationFailed
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = currentLang === 'ro' 
          ? 'Email sau parolă incorectă' 
          : 'Invalid email or password'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = currentLang === 'ro'
          ? 'Te rog confirmă emailul înainte de autentificare'
          : 'Please confirm your email before signing in'
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = currentLang === 'ro'
          ? 'Prea multe încercări. Te rog încearcă din nou mai târziu'
          : 'Too many attempts. Please try again later'
      }
      
      setAuthState(prev => ({ ...prev, error: errorMessage }))
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  // Magic link handler
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm(email)
    if (validationError) {
      setAuthState(prev => ({ ...prev, error: validationError }))
      return
    }

    setAuthState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      success: null 
    }))

    try {
      console.log('🔗 Sending magic link to:', email)
      
      const redirectTo = `${window.location.origin}/${lang}/auth/callback?next=${encodeURIComponent(next)}`
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo
        }
      })

      if (error) throw error

      setAuthState(prev => ({ 
        ...prev, 
        success: translations.magicLinkSent 
      }))
      
    } catch (error: any) {
      console.error('💥 Magic link error:', error)
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message || translations.unexpectedError 
      }))
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {translations.title}
          </h1>
          <p className="text-indigo-200">
            {translations.subtitle}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
          
          {/* Messages */}
          {authState.error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle size={16} />
              <span className="text-sm">{authState.error}</span>
            </div>
          )}
          
          {authState.success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-200">
              <CheckCircle size={16} />
              <span className="text-sm">{authState.success}</span>
            </div>
          )}

          {/* Password Login Form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4 mb-6">
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={translations.emailPlaceholder}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={authState.loading}
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={authState.passwordVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={translations.passwordPlaceholder}
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={authState.loading}
                required
              />
              <button
                type="button"
                onClick={() => setAuthState(prev => ({ 
                  ...prev, 
                  passwordVisible: !prev.passwordVisible 
                }))}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
                disabled={authState.loading}
              >
                {authState.passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={authState.loading || !email || !password}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {authState.loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {translations.signingIn}
                </>
              ) : (
                translations.signInButton
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-400">
                {translations.orDivider}
              </span>
            </div>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            {/* Email Input for Magic Link */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={translations.emailPlaceholder}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={authState.loading}
                required
              />
            </div>

            {/* Magic Link Button */}
            <button
              type="submit"
              disabled={authState.loading || !email}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {authState.loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {translations.sendingLink}
                </>
              ) : (
                translations.magicLinkButton
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link 
            href={`/${lang}/pricing`} 
            className="text-indigo-200 hover:text-white transition-colors duration-200 text-sm"
          >
            {translations.backTopricing}
          </Link>
        </div>
      </div>
    </div>
  )
}