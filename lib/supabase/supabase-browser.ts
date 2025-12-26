// lib/supabase/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr'
import { getEnv } from '@/lib/env'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!_client) {
    _client = createBrowserClient(
      getEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    )
  }
  return _client
}