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

        // If still no profile, create it (fallback — trigger should handle it)
        if (!data && userMetadata) {
          const role = sessionStorage.getItem('oauth_intended_role') || 'student'
          const name = userMetadata.full_name || userMetadata.name ||
            userMetadata.email?.split('@')[0] || 'Usuario'
          const extra = role === 'teacher'
            ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
            : {}
          const { data: rows } = await supabase
            .from('profiles')
            .upsert({ id: userId, role, name, ...extra }, { onConflict: 'id' })
            .select()
          data = rows?.[0] ?? null
        }
        if (!active) return

        // Handle pending role change (teacher OAuth)
        const pendingRole = sessionStorage.getItem('oauth_intended_role')
        if (data && pendingRole && pendingRole !== data.role) {
          const extra = pendingRole === 'teacher'
            ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
            : {}
          await supabase.from('profiles').update({ role: pendingRole, ...extra }).eq('id', userId)
          if (!active) return
          const { data: updated } = await supabase
            .from('profiles').select('*').eq('id', userId).maybeSingle()
          data = updated ?? data
        }
        sessionStorage.removeItem('oauth_intended_role')

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
      // PKCE: on callback page the code exchange is async — INITIAL_SESSION fires with
      // null session before SIGNED_IN arrives. Don't resolve loading yet or AuthCallback
      // will redirect to /login before the session is established.
      if (event === 'INITIAL_SESSION' && !session && window.location.search.includes('code=')) return
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
    let data, error
    try {
      ;({ data, error } = await supabase.auth.signUp({ email, password }))
    } catch (err) { return err }
    if (error) return error
    if (data.user) {
      const extra = role === 'teacher'
        ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
        : {}
      await supabase.from('profiles').upsert(
        { id: data.user.id, role, name, ...extra },
        { onConflict: 'id' }
      )
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
