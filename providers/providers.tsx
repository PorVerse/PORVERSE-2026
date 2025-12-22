'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useMemo } from 'react'

// ✅ FIX: Funcția corectă din @supabase/ssr
import type { SupabaseClient } from '@supabase/supabase-js'

type Ctx = { supabase: SupabaseClient }

const SupabaseCtx = createContext<Ctx | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  // ✅ FIX: Înlocuit createClientComponentClient() cu createBrowserClient()
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
      ),
    []
  )
  
  const value = useMemo(() => ({ supabase }), [supabase])

  return <SupabaseCtx.Provider value={value}>{children}</SupabaseCtx.Provider>
}

export function useSupabase() {
  const ctx = useContext(SupabaseCtx)
  if (!ctx) {
    throw new Error('useSupabase must be used within Providers')
  }
  return ctx.supabase
}