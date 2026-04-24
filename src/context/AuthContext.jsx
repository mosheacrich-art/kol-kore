import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data ?? null)
    setLoading(false)
  }

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately — no need for a separate getSession() call
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  const signUp = async (email, password, name, role) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error
    if (data.user) {
      const extra = role === 'teacher'
        ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
        : {}
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role,
        name,
        ...extra,
      }, { onConflict: 'id' })
      await fetchProfile(data.user.id)
    }
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthCtx.Provider value={{ user, profile, setProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
