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

    const fetchProfile = async (userId, userMetadata = null, createdAt = null) => {
      try {
        let { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (!active) return

        // Retry once if no profile yet — trigger may still be committing
        if (!data) {
          await new Promise(r => setTimeout(r, 1200))
          if (!active) return
          ;({ data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle())
          if (!active) return
        }

        const pendingRole = sessionStorage.getItem('oauth_intended_role')

        if (data) {
          // Profile exists — check if role needs updating (e.g. teacher OAuth)
          if (pendingRole && pendingRole !== data.role) {
            const extra = pendingRole === 'teacher'
              ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
              : {}
            await supabase.from('profiles').update({ role: pendingRole, ...extra }).eq('id', userId)
            sessionStorage.removeItem('oauth_intended_role')
            const { data: updated } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
            if (!active) return
            if (pendingRole === 'student') sessionStorage.setItem('new_student', '1')
            setProfile(updated ?? data)
          } else {
            // Detect new user by auth created_at (within 30s = just registered)
            const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 30000
            if (isNew && data.role === 'student') sessionStorage.setItem('new_student', '1')
            sessionStorage.removeItem('oauth_intended_role')
            setProfile(data)
          }
          return
        }

        // No profile yet — trigger may not have run yet, create as fallback
        if (userMetadata) {
          const role = pendingRole || 'student'
          const name = userMetadata.full_name || userMetadata.name ||
            userMetadata.email?.split('@')[0] || 'Usuario'
          const extra = role === 'teacher'
            ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
            : {}
          const { data: rows } = await supabase.from('profiles')
            .upsert({ id: userId, role, name, ...extra }, { onConflict: 'id' })
            .select()
          sessionStorage.removeItem('oauth_intended_role')
          if (role === 'student') sessionStorage.setItem('new_student', '1')
          if (!active) return
          setProfile(rows?.[0] ?? null)
          setLoading(false)
          return
        }

        setProfile(null)
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
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id, session.user.user_metadata, session.user.created_at)
        }, 0)
      } else {
        setProfile(null)
        setLoading(false)
      }
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

  const signInWithGoogle = (role) => {
    sessionStorage.setItem('oauth_intended_role', role)
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const clearRecovery = () => setRecoveryMode(false)

  return (
    <AuthCtx.Provider value={{
      user, profile, setProfile, loading,
      signIn, signUp, signInWithGoogle, signOut,
      recoveryMode, clearRecovery,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
