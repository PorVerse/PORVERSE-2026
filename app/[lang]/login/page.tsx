'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocalization } from '@/hooks/useLocalization'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Shield, ArrowLeft, Zap, Info
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// ── Enterprise TypeScript Interfaces ──
interface AuthAttempt {
  timestamp: number
  success: boolean
  method: 'password' | 'magic_link' | 'oauth'
  error?: string
}

interface SecurityState {
  attempts: AuthAttempt[]
  isLocked: boolean
  lockUntil?: number
  remainingAttempts: number
}

interface AuthState {
  loading: boolean
  method: 'password' | 'magic_link' | 'oauth'
  error: AuthError | null
  success: string | null
  passwordVisible: boolean
  security: SecurityState
  rateLimited: boolean
  rateLimitReset?: number
}

interface AuthError {
  type: 'validation' | 'authentication' | 'network' | 'rate_limit' | 'security' | 'unknown'
  message: string
  code?: string
  retryable: boolean
  retryAfter?: number
}

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface URLParams {
  next?: string
  reason?: string
  message?: string
  token?: string
  type?: string
}

type Lang = 'en' | 'ro'
type AuthMethod = 'password' | 'magic_link' | 'oauth'

// ── Enterprise Constants ──
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

// ── Enhanced Translations ──
const translations = {
  en: {
    // Main Content
    title: 'Secure Access Portal',
    subtitle: 'Enter your credentials to access PorVerse',
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter your email address',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Keep me signed in for 24 hours',
    
    // Authentication Methods
    signInButton: 'Sign In Securely',
    magicLinkButton: 'Send Secure Magic Link',
    oauthButton: 'Continue with OAuth',
    
    // Status Messages
    signingIn: 'Authenticating...',
    sendingLink: 'Sending secure link...',
    processingOAuth: 'Processing OAuth...',
    magicLinkSent: 'Secure magic link sent! Check your email',
    
    // Navigation
    orDivider: 'or authenticate with',
    backToHome: 'Back to Home',
    backToPricing: 'View Pricing',
    createAccount: 'Create New Account',
    forgotPassword: 'Reset Password',
    
    // Security & Validation
    emailRequired: 'Email address is required',
    emailInvalid: 'Please enter a valid email address',
    passwordRequired: 'Password is required',
    passwordTooShort: 'Password must be at least 8 characters',
    
    // Authentication Errors
    invalidCredentials: 'Invalid email or password',
    emailNotConfirmed: 'Please verify your email address first',
    accountLocked: 'Account temporarily locked for security',
    tooManyAttempts: 'Too many failed attempts. Please try again later',
    rateLimited: 'Too many requests. Please wait before trying again',
    networkError: 'Network connection error. Please check your internet',
    serverError: 'Server temporarily unavailable. Please try again',
    sessionExpired: 'Your session has expired. Please sign in again',
    
    // Security Features
    securityNotice: 'Your connection is secured with end-to-end encryption',
    attemptsRemaining: 'attempts remaining',
    accountLockedUntil: 'Account locked until',
    rateLimitReset: 'Rate limit resets in',
    
    // Advanced Features
    biometricAuth: 'Use Biometric Authentication',
    twoFactorAuth: 'Two-Factor Authentication',
    deviceTrust: 'Trust this device for 30 days',
    
    // Time & Status
    timeRemaining: 'Time remaining',
    secondsShort: 's',
    minutesShort: 'm',
    hoursShort: 'h',
  },
  ro: {
    // Main Content
    title: 'Portal de Acces Securizat',
    subtitle: 'Introduceți credențialele pentru a accesa PorVerse',
    emailLabel: 'Adresa de Email',
    emailPlaceholder: 'Introduceți adresa de email',
    passwordLabel: 'Parola',
    passwordPlaceholder: 'Introduceți parola',
    rememberMe: 'Păstrează-mă conectat pentru 24 ore',
    
    // Authentication Methods
    signInButton: 'Conectare Securizată',
    magicLinkButton: 'Trimite Link Magic Securizat',
    oauthButton: 'Continuă cu OAuth',
    
    // Status Messages
    signingIn: 'Se autentifică...',
    sendingLink: 'Se trimite link-ul securizat...',
    processingOAuth: 'Se procesează OAuth...',
    magicLinkSent: 'Link magic securizat trimis! Verificați emailul',
    
    // Navigation
    orDivider: 'sau autentifică-te cu',
    backToHome: 'Înapoi la Pagina Principală',
    backToPricing: 'Vezi Prețurile',
    createAccount: 'Creează Cont Nou',
    forgotPassword: 'Resetează Parola',
    
    // Security & Validation
    emailRequired: 'Adresa de email este obligatorie',
    emailInvalid: 'Te rog introduceți o adresă de email validă',
    passwordRequired: 'Parola este obligatorie',
    passwordTooShort: 'Parola trebuie să aibă cel puțin 8 caractere',
    
    // Authentication Errors
    invalidCredentials: 'Email sau parolă incorectă',
    emailNotConfirmed: 'Te rog verifică adresa de email mai întâi',
    accountLocked: 'Contul este temporar blocat pentru securitate',
    tooManyAttempts: 'Prea multe încercări eșuate. Te rog încearcă din nou mai târziu',
    rateLimited: 'Prea multe cereri. Te rog așteaptă înainte să încerci din nou',
    networkError: 'Eroare de conexiune la rețea. Verifică internetul',
    serverError: 'Serverul este temporar indisponibil. Te rog încearcă din nou',
    sessionExpired: 'Sesiunea a expirat. Te rog conectează-te din nou',
    
    // Security Features
    securityNotice: 'Conexiunea ta este securizată cu criptare end-to-end',
    attemptsRemaining: 'încercări rămase',
    accountLockedUntil: 'Cont blocat până la',
    rateLimitReset: 'Limita de rată se resetează în',
    
    // Advanced Features
    biometricAuth: 'Folosește Autentificare Biometrică',
    twoFactorAuth: 'Autentificare în Doi Factori',
    deviceTrust: 'Încrede în acest dispozitiv pentru 30 zile',
    
    // Time & Status
    timeRemaining: 'Timp rămas',
    secondsShort: 's',
    minutesShort: 'm',
    hoursShort: 'h',
  }
} as const

export default function EnterpriseLoginPage({ params }: { params: { lang: Lang } }) {
  const lang: Lang = params.lang === 'ro' ? 'ro' : 'en'
  const { language } = useLocalization()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  
  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout>()
  const intervalRef = useRef<NodeJS.Timeout>()
  
  // Extract URL parameters
  const urlParams: URLParams = {
    next: searchParams.get('next') || undefined,
    reason: searchParams.get('reason') || undefined,
    message: searchParams.get('message') || undefined,
    token: searchParams.get('token') || undefined,
    type: searchParams.get('type') || undefined,
  }
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  })
  
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    loading: false,
    method: 'password',
    error: null,
    success: null,
    passwordVisible: false,
    security: {
      attempts: [],
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS
    },
    rateLimited: false
  })
  
  // Redirect configuration
  const redirectTo = urlParams.next || `/${lang}/portal-dashboard`
  
  // Get current translations
  const t = translations[language === 'ro' ? 'ro' : 'en']
  
  // ── Security Functions ──
  const addAuthAttempt = useCallback((success: boolean, method: AuthMethod, error?: string) => {
    const attempt: AuthAttempt = {
      timestamp: Date.now(),
      success,
      method,
      error
    }
    
    setAuthState(prev => {
      const newAttempts = [...prev.security.attempts, attempt].slice(-10) // Keep last 10
      const recentFailures = newAttempts
        .filter(a => !a.success && Date.now() - a.timestamp < RATE_LIMIT_WINDOW)
        .length
      
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - recentFailures)
      const isLocked = remainingAttempts === 0
      const lockUntil = isLocked ? Date.now() + LOCKOUT_DURATION : undefined
      
      return {
        ...prev,
        security: {
          attempts: newAttempts,
          isLocked,
          lockUntil,
          remainingAttempts
        }
      }
    })
  }, [])
  
  const checkSecurityStatus = useCallback(() => {
    setAuthState(prev => {
      const now = Date.now()
      
      // Check if lockout has expired
      if (prev.security.isLocked && prev.security.lockUntil && now > prev.security.lockUntil) {
        return {
          ...prev,
          security: {
            ...prev.security,
            isLocked: false,
            lockUntil: undefined,
            remainingAttempts: MAX_ATTEMPTS
          }
        }
      }
      
      return prev
    })
  }, [])
  
  // ── Validation Functions ──
  const createError = useCallback((
    type: AuthError['type'],
    message: string,
    code?: string,
    retryable: boolean = true,
    retryAfter?: number
  ): AuthError => ({
    type,
    message,
    code,
    retryable,
    retryAfter
  }), [])
  
  const validateEmail = useCallback((email: string): string | null => {
    if (!email.trim()) return t.emailRequired
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return t.emailInvalid
    
    return null
  }, [t])
  
  const validatePassword = useCallback((password: string): string | null => {
    if (!password) return t.passwordRequired
    if (password.length < 8) return t.passwordTooShort
    return null
  }, [t])
  
  const validateForm = useCallback((requirePassword: boolean = true): AuthError | null => {
    const emailError = validateEmail(formData.email)
    if (emailError) {
      return createError('validation', emailError, 'INVALID_EMAIL')
    }
    
    if (requirePassword) {
      const passwordError = validatePassword(formData.password)
      if (passwordError) {
        return createError('validation', passwordError, 'INVALID_PASSWORD')
      }
    }
    
    return null
  }, [formData, validateEmail, validatePassword, createError])
  
  // ── Authentication Handlers ──
  const handlePasswordLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Security checks
    if (authState.security.isLocked) {
      setAuthState(prev => ({
        ...prev,
        error: createError('security', t.accountLocked, 'ACCOUNT_LOCKED', false)
      }))
      return
    }
    
    // Form validation
    const validationError = validateForm(true)
    if (validationError) {
      setAuthState(prev => ({ ...prev, error: validationError }))
      return
    }
    
    setAuthState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: null,
      method: 'password'
    }))
    
    try {
      console.log('🔐 ENTERPRISE LOGIN: Starting password authentication')
      console.log('📧 Email:', formData.email)
      console.log('🔄 Redirect:', redirectTo)
      console.log('⏱️ Remember me:', formData.rememberMe)
      
      const { data, error } = await supabase.auth.signInWithPassword({
  emailemail: authState.email,
,
  password: authState.password

})
      
      if (error) {
        console.error('❌ Authentication failed:', error)
        addAuthAttempt(false, 'password', error.message)
        
        let authError: AuthError
        
        switch (error.message?.toLowerCase()) {
          case 'invalid login credentials':
          case 'invalid email or password':
            authError = createError('authentication', t.invalidCredentials, 'INVALID_CREDENTIALS')
            break
          case 'email not confirmed':
            authError = createError('authentication', t.emailNotConfirmed, 'EMAIL_NOT_CONFIRMED')
            break
          case 'too many requests':
            authError = createError('rate_limit', t.rateLimited, 'RATE_LIMITED', true, 60)
            break
          default:
            authError = createError('authentication', error.message || t.serverError, error.name)
        }
        
        throw authError
      }
      
      if (!data?.user || !data?.session) {
        throw createError('authentication', 'Authentication failed - no user data', 'NO_USER_DATA')
      }
      
      console.log('✅ Authentication successful')
      console.log('👤 User ID:', data.user.id)
      console.log('🔄 Session valid until:', new Date(data.session.expires_at! * 1000))
      
      addAuthAttempt(true, 'password')
      
      // Success - redirect after short delay
      setAuthState(prev => ({
        ...prev,
        success: 'Authentication successful! Redirecting...',
        loading: false
      }))
      
      setTimeout(() => {
        router.replace(redirectTo)
      }, 1000)
      
    } catch (error: any) {
      console.error('💥 LOGIN ERROR:', error)
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error as AuthError
      }))
    }
  }, [authState.security.isLocked, validateForm, formData, redirectTo, supabase, addAuthAttempt, createError, t, router])
  
  const handleMagicLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (authState.security.isLocked) {
      setAuthState(prev => ({
        ...prev,
        error: createError('security', t.accountLocked, 'ACCOUNT_LOCKED', false)
      }))
      return
    }
    
    const validationError = validateForm(false)
    if (validationError) {
      setAuthState(prev => ({ ...prev, error: validationError }))
      return
    }
    
    setAuthState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: null,
      method: 'magic_link'
    }))
    
    try {
      console.log('🔗 ENTERPRISE LOGIN: Sending magic link')
      
      const callbackUrl = `${window.location.origin}/${lang}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email.trim().toLowerCase(),
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: false // Only for existing users
        }
      })
      
      if (error) {
        console.error('❌ Magic link failed:', error)
        addAuthAttempt(false, 'magic_link', error.message)
        throw createError('authentication', error.message || t.serverError, error.name)
      }
      
      console.log('✅ Magic link sent successfully')
      addAuthAttempt(true, 'magic_link')
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        success: t.magicLinkSent
      }))
      
    } catch (error: any) {
      console.error('💥 MAGIC LINK ERROR:', error)
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error as AuthError
      }))
    }
  }, [authState.security.isLocked, validateForm, formData.email, lang, redirectTo, supabase, addAuthAttempt, createError, t])
  
  // ── Effects ──
  useEffect(() => {
    const interval = setInterval(checkSecurityStatus, 1000)
    intervalRef.current = interval
    return () => clearInterval(interval)
  }, [checkSecurityStatus])
  
  useEffect(() => {
    if (authState.error || authState.success) {
      const timeout = setTimeout(() => {
        setAuthState(prev => ({ ...prev, error: null, success: null }))
      }, 5000)
      timeoutRef.current = timeout
      return () => clearTimeout(timeout)
    }
  }, [authState.error, authState.success])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
  
  // ── URL Parameter Handling ──
  useEffect(() => {
    if (urlParams.reason) {
      let message = ''
      switch (urlParams.reason) {
        case 'session_expired':
          message = t.sessionExpired
          break
        case 'auth_required':
          message = 'Authentication required to access this page'
          break
        default:
          message = urlParams.message || 'Please sign in to continue'
      }
      
      setAuthState(prev => ({
        ...prev,
        error: createError('authentication', message, urlParams.reason)
      }))
    }
  }, [urlParams, createError, t])
  
  // ── Helper Functions ──
  const formatTimeRemaining = (timestamp: number): string => {
    const remaining = Math.max(0, timestamp - Date.now())
    const seconds = Math.floor(remaining / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}${t.hoursShort} ${minutes % 60}${t.minutesShort}`
    if (minutes > 0) return `${minutes}${t.minutesShort} ${seconds % 60}${t.secondsShort}`
    return `${seconds}${t.secondsShort}`
  }
  
  const isFormValid = authState.method === 'password' 
    ? formData.email && formData.password
    : formData.email
  
  const isSubmitDisabled = authState.loading || !isFormValid || authState.security.isLocked
  
  // ── Render ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t.title}
          </h1>
          <p className="text-purple-200">
            {t.subtitle}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          
          {/* Security Status */}
          {authState.security.isLocked && authState.security.lockUntil && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-200 mb-2">
                <Shield size={16} />
                <span className="font-medium">{t.accountLocked}</span>
              </div>
              <div className="text-sm text-red-300">
                {t.accountLockedUntil}: {formatTimeRemaining(authState.security.lockUntil)}
              </div>
            </div>
          )}
          
          {/* Error Messages */}
          {authState.error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-200 mb-2">
                <AlertCircle size={16} />
                <span className="font-medium">Authentication Error</span>
              </div>
              <p className="text-sm text-red-300 mb-2">{authState.error.message}</p>
              {authState.error.code && (
                <p className="text-xs text-red-400 font-mono">Code: {authState.error.code}</p>
              )}
              {authState.error.retryAfter && (
                <p className="text-xs text-red-400">
                  Retry in: {authState.error.retryAfter}s
                </p>
              )}
            </div>
          )}
          
          {/* Success Messages */}
          {authState.success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-200">
                <CheckCircle size={16} />
                <span className="text-sm">{authState.success}</span>
              </div>
            </div>
          )}
          
          {/* Security Info */}
          {!authState.security.isLocked && authState.security.remainingAttempts < MAX_ATTEMPTS && (
            <div className="mb-6 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-200 text-sm">
                <Info size={14} />
                <span>
                  {authState.security.remainingAttempts} {t.attemptsRemaining}
                </span>
              </div>
            </div>
          )}

          {/* Authentication Method Switcher */}
          <div className="mb-6">
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setAuthState(prev => ({ ...prev, method: 'password' }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authState.method === 'password'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:text-white'
                }`}
              <LockIcon className="w-4 h-4 inline mr-2" />
                <LockIcon className="w-4 h-4 inline mr-2" />
                Password
              </button>
              <button
                type="button"
                onClick={() => setAuthState(prev => ({ ...prev, method: 'magic_link' }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authState.method === 'magic_link'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Magic Link
              </button>
            </div>
          </div>

          {/* Authentication Form */}
          <form 
            onSubmit={authState.method === 'password' ? handlePasswordLogin : handleMagicLink}
            className="space-y-4"
          >
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-purple-200">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-purple-300" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={authState.loading}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input (only for password method) */}
            {authState.method === 'password' && (
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-purple-200">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-3 h-5 w-5 text-purple-300" />

                  <input
                    id="password"
                    type={authState.passwordVisible ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={t.passwordPlaceholder}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    disabled={authState.loading}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setAuthState(prev => ({ 
                      ...prev, 
                      passwordVisible: !prev.passwordVisible 
                    }))}
                    className="absolute right-3 top-3 text-purple-300 hover:text-white transition-colors"
                    disabled={authState.loading}
                    tabIndex={-1}
                  >
                    {authState.passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}

                  </button>
                </div>
              </div>
            )}

            {/* Remember Me (only for password method) */}
            {authState.method === 'password' && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-white/20 rounded bg-white/10"
                  disabled={authState.loading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-purple-200">
                  {t.rememberMe}
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              {authState.loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {authState.method === 'password' ? t.signingIn : t.sendingLink}
                </>
              ) : (
                <>
                  {authState.method === 'password' ? (
                    <>
                      <Shield size={16} />
                      {t.signInButton}
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      {t.magicLinkButton}
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex flex-col space-y-3 text-center">
              <Link 
                href={`/${lang}/auth/forgot-password`}
                className="text-purple-200 hover:text-white transition-colors text-sm"
              >
                {t.forgotPassword}
              </Link>
              <Link 
                href={`/${lang}/auth/signup`}
                className="text-purple-200 hover:text-white transition-colors text-sm"
              >
                {t.createAccount}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="text-center mt-6 space-y-2">
          <Link 
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            {t.backToHome}
          </Link>
          <div className="text-purple-300 text-xs">•</div>
          <Link 
            href={`/${lang}/pricing`}
            className="text-purple-200 hover:text-white transition-colors text-sm"
          >
            {t.backToPricing}
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-200 text-xs">
            <Shield size={12} />
            <span>{t.securityNotice}</span>
          </div>
        </div>
      </div>
    </div>
  )
}