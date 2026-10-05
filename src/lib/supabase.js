import { createClient } from '@supabase/supabase-js'
import { createMockClient } from './devMock'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// `vite dev` without credentials → in-memory preview data (see devMock.js).
// In production builds import.meta.env.DEV is false and the mock is tree-shaken.
const useDevMock = import.meta.env.DEV && !supabaseUrl

export const supabase = useDevMock
  ? createMockClient()
  : createClient(
      supabaseUrl,
      supabaseAnonKey,
      { auth: { flowType: 'pkce' } }
    )
