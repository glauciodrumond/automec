import { createClient } from '@supabase/supabase-js'

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  }
}

const config = getSupabaseConfig()

export const supabase = createClient(
  config.url || 'https://example.supabase.co',
  config.anonKey || 'public-anon-key-for-unconfigured-client',
)
