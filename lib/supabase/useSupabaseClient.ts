// lib/supabase/useSupabaseClient.ts
'use client'

import { useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'


export function useSupabaseClient() {
  // memorat => previne instanțe multiple
  const supabase = useMemo(() => createClientComponentClient<Database>(), [])
  return supabase
}
