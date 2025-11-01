'use client'

import { createContext, useContext, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

type Ctx = { supabase: SupabaseClient }
const SupabaseCtx = createContext<Ctx | null>(null)

export function Providers({ children }: { children: React.ReactNode }) {
  // important: o singură instanță per mount
  const supabase = useMemo(() => createClientComponentClient(), [])
  const value = useMemo(() => ({ supabase }), [supabase])

  return <SupabaseCtx.Provider value={value}>{children}</SupabaseCtx.Provider>
}

export function useSupabase(): SupabaseClient {
  const ctx = useContext(SupabaseCtx)
  if (!ctx) throw new Error('useSupabase must be used within <Providers>')
  return ctx.supabase
}
