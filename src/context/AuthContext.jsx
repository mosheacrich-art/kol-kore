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

    const queryProfile = async (userId) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      return data ?? null
    }

    const fetchProfile = async (userId, userMetadata = null, createdAt = null) => {
      try {
        // Ensure the Supabase client has a valid session before querying.
        // If getSession() returns null (OAuth token not yet processed),
        // parse it directly from the URL hash and set it explicitly.
        let { data: { session } } = await supabase.auth.getSession()

        if (!session && window.location.hash.includes('access_token=')) {
          const params = new URLSearchParams(window.location.hash.slice(1))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token') || ''
          if (access_token) {
            const { data: sd } = await supabase.auth.setSession({ access_token, refresh_token })
            session = sd.session
          }
        }

        if (!session || !active) {
          setProfile(null)
          setLoading(false)
          return
        }

        let data = await queryProfile(userId)
        if (!active) return

        // Retry once after 1s — trigger might still be committing
        if (!data) {
          await new Promise(r => setTimeout(r, 1000))
          if (!active) return
          data = await queryProfile(userId)
          if (!active) return
        }

        const pendingRole = sessionStorage.getItem('oauth_intended_role')

        if (data) {
          if (pendingRole && pendingRole !== data.role) {
            const extra = pendingRole === 'teacher'
              ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
              : {}
            await supabase.from('profiles').update({ role: pendingRole, ...extra }).eq('id', userId)
            sessionStorage.removeItem('oauth_intended_role')
            const updated = await queryProfile(userId)
            if (!active) return
            if (pendingRole === 'student') sessionStorage.setItem('new_student', '1')
            setProfile(updated ?? data)
          } else {
            const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 30000
            if (isNew && data.role === 'student') sessionStorage.setItem('new_student', '1')
            sessionStorage.removeItem('oauth_intended_role')
            setProfile(data)
          }
          return
        }

        // Still no profile — create as fallback (trigger may have failed)
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
        fetchProfile(session.user.id, session.user.user_metadata, session.user.created_at)
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
      options: { redirectTo: 'https://www.perashapp.com' },
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
