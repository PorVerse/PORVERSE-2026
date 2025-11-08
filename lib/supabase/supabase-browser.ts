// lib/supabase/supabase-browser.ts
import { createClientComponentClient, type SupabaseClient } from '@supabase/auth-helpers-nextjs'

let _client: SupabaseClient<any, 'public', 'public'> | null = null
export function getSupabaseBrowserClient() {
  if (!_client) _client = createClientComponentClient()
  return _client!
}
