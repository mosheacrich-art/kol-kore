import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(
    () => window.location.hash.includes('type=recovery')
  )

  // Used by signUp (no active guard needed — not tied to effect lifecycle)
  const loadProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      setProfile(data ?? null)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const fetchProfile = async (userId) => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (!active) return
        setProfile(data ?? null)
      } catch {
        if (!active) return
        setProfile(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') { setRecoveryMode(true); return }
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error
    } catch (err) {
      return err
    }
  }

  const signUp = async (email, password, name, role) => {
    let data, error
    try {
      ;({ data, error } = await supabase.auth.signUp({ email, password }))
    } catch (err) {
      return err
    }
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
      await loadProfile(data.user.id)
    }
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const clearRecovery = () => setRecoveryMode(false)

  return (
    <AuthCtx.Provider value={{ user, profile, setProfile, loading, signIn, signUp, signOut, recoveryMode, clearRecovery }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
