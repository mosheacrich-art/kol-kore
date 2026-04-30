import { createClient } from '@supabase/supabase-js'

// env vars injected at build time via vite define
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { auth: { flowType: 'pkce', detectSessionInUrl: false } }
)
