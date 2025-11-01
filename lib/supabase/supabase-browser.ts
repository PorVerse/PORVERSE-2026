// lib/supabase/supabase-browser.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function supabaseBrowser(): SupabaseClient {
  if (_client) return _client
  // Important: single instance per browser context
  _client = createClientComponentClient()
  return _client
}
