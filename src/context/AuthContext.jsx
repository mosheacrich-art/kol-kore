import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    let active = true

    const fetchProfile = async (userId, userMetadata, createdAt) => {
      try {
        let { data } = await supabase
          .from('profiles').select('*').eq('id', userId).maybeSingle()

        // Retry once — DB trigger may still be committing
        if (!data) {
          await new Promise(r => setTimeout(r, 1000))
          if (!active) return
          ;({ data } = await supabase
            .from('profiles').select('*').eq('id', userId).maybeSingle())
        }
        if (!active) return

        // If still no profile, create it (first OAuth login — profile doesn't exist yet)
        // Role comes from sessionStorage only during profile CREATION, never to update an existing one.
        if (!data && userMetadata) {
          const ALLOWED_ROLES = ['teacher', 'student']
          const pendingRoleRaw = sessionStorage.getItem('oauth_intended_role')
          const role = userMetadata.app_role
            || (ALLOWED_ROLES.includes(pendingRoleRaw) ? pendingRoleRaw : null)
            || 'student'
          const name = userMetadata.app_name
            || userMetadata.full_name || userMetadata.name
            || userMetadata.email?.split('@')[0] || 'Usuario'
          const extra = role === 'teacher'
            ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
            : {}
          const { data: rows } = await supabase
            .from('profiles')
            .upsert({ id: userId, role, name, ...extra }, { onConflict: 'id' })
            .select()
          data = rows?.[0] ?? null
        }
        // Always clear the sessionStorage role after profile creation — never use it to update existing profiles
        sessionStorage.removeItem('oauth_intended_role')
        if (!active) return

        // If DB trigger created the profile with email as name, fix it using user_metadata
        if (data && userMetadata?.app_name && data.name !== userMetadata.app_name) {
          await supabase.from('profiles').update({ name: userMetadata.app_name }).eq('id', userId)
          data = { ...data, name: userMetadata.app_name }
        }

        // Mark new students for subscription redirect
        const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 30000
        if (isNew && data?.role === 'student') sessionStorage.setItem('new_student', '1')

        setProfile(data ?? null)
      } catch {
        if (active) setProfile(null)
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

    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error
    } catch (err) { return err }
  }

  const signUp = async (email, password, name, role) => {
    // Ensure stale OAuth role doesn't interfere with email/password signup
    sessionStorage.removeItem('oauth_intended_role')

    let data, error
    try {
      ;({ data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { app_role: role, app_name: name },  // persisted in user_metadata
        },
      }))
    } catch (err) { return err }
    if (error) return error

    if (data.user) {
      const extra = role === 'teacher'
        ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
        : {}
      const { error: upsertErr } = await supabase.from('profiles').upsert(
        { id: data.user.id, role, name, ...extra },
        { onConflict: 'id' }
      )
      if (upsertErr) console.error('Profile upsert error:', upsertErr.message)
    }

    // session === null → Supabase requires email confirmation
    if (!data.session) return { needsConfirmation: true }

    // Immediate login (email confirmation disabled in Supabase)
    if (data.user) {
      const { data: p } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).maybeSingle()
      setProfile(p ?? null)
      setLoading(false)
    }
    return null
  }

  const signInWithGoogle = (role) => {
    sessionStorage.setItem('oauth_intended_role', role)
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
