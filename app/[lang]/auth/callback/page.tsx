'use client'

export const dynamic = 'force-dynamic'

// app/[lang]/auth/callback/page.tsx - Enhanced callback handler

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuthCallbackPage({
  params,
}: {
  params: { lang: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 AUTH CALLBACK: Processing auth callback...')
        
        // Check for errors in URL params
        const error = searchParams.get('error')
        const errorCode = searchParams.get('error_code')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('🔍 AUTH CALLBACK: Error from Supabase:', {
            error,
            errorCode,
            errorDescription
          })
          
          let userMessage = 'Authentication failed'
          
          if (errorCode === 'otp_expired') {
            userMessage = params.lang === 'ro' 
              ? 'Link-ul magic a expirat. Te rog încearcă din nou.'
              : 'Magic link has expired. Please try again.'
          } else if (error === 'access_denied') {
            userMessage = params.lang === 'ro'
              ? 'Acces refuzat. Te rog verifică link-ul.'
              : 'Access denied. Please check your link.'
          }
          
          setStatus('error')
          setMessage(userMessage)
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.replace(`/${params.lang}/login`)
          }, 3000)
          
          return
        }

        // Process the auth session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('🔍 AUTH CALLBACK: Session error:', sessionError)
          throw sessionError
        }

        if (!data.session) {
          // Try to exchange code for session
          const code = searchParams.get('code')
          if (code) {
            console.log('🔍 AUTH CALLBACK: Exchanging code for session...')
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (exchangeError) {
              console.error('🔍 AUTH CALLBACK: Code exchange error:', exchangeError)
              throw exchangeError
            }
            
            if (!exchangeData.session) {
              throw new Error('No session after code exchange')
            }
            
            console.log('🔍 AUTH CALLBACK: Session created successfully')
          } else {
            throw new Error('No session and no code to exchange')
          }
        }

        setStatus('success')
        setMessage(params.lang === 'ro' ? 'Autentificare reușită!' : 'Authentication successful!')
        
        // Get redirect URL
        const next = searchParams.get('next') || `/${params.lang}/portal-dashboard`
        
        console.log('🔍 AUTH CALLBACK: Redirecting to:', next)
        
        // Small delay to show success message
        setTimeout(() => {
          router.replace(next)
        }, 1000)

      } catch (error: any) {
        console.error('🔍 AUTH CALLBACK: Callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.replace(`/${params.lang}/login`)
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [searchParams, router, params.lang, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin h-12 w-12 text-white mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">
              {params.lang === 'ro' ? 'Se procesează autentificarea...' : 'Processing authentication...'}
            </h1>
            <p className="text-indigo-200">
              {params.lang === 'ro' ? 'Te rog așteaptă...' : 'Please wait...'}
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">
              {params.lang === 'ro' ? 'Succes!' : 'Success!'}
            </h1>
            <p className="text-green-200">{message}</p>
            <p className="text-sm text-indigo-200 mt-2">
              {params.lang === 'ro' ? 'Redirectare în curs...' : 'Redirecting...'}
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">
              {params.lang === 'ro' ? 'Eroare de autentificare' : 'Authentication Error'}
            </h1>
            <p className="text-red-200 mb-4">{message}</p>
            <p className="text-sm text-indigo-200">
              {params.lang === 'ro' 
                ? 'Redirectare către login în 3 secunde...' 
                : 'Redirecting to login in 3 seconds...'}
            </p>
            <button
              onClick={() => router.replace(`/${params.lang}/login`)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {params.lang === 'ro' ? 'Înapoi la Login' : 'Back to Login'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}