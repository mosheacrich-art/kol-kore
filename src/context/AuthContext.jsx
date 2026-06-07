import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [profile, setProfile]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [oauthConflict, setOauthConflict] = useState(null) // existing role when there's a mismatch

  useEffect(() => {
    let active = true

    const fetchProfile = async (userId, userMetadata, createdAt) => {
      try {
        const ALLOWED_ROLES = ['teacher', 'student']
        const oauthRoleRaw  = sessionStorage.getItem('oauth_intended_role')
        const loginRoleRaw  = sessionStorage.getItem('login_intended_role')
        const intendedRole  = ALLOWED_ROLES.includes(oauthRoleRaw)  ? oauthRoleRaw  : null
        const loginRole     = ALLOWED_ROLES.includes(loginRoleRaw)  ? loginRoleRaw  : null
        // Role the user actively chose when signing in (used for conflict detection)
        const effectiveRole = intendedRole || loginRole
        // Role stored in auth metadata at signup time — authoritative source of intended role
        const metadataRole  = ALLOWED_ROLES.includes(userMetadata?.app_role) ? userMetadata.app_role : null

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

        const isNewUser = createdAt && (Date.now() - new Date(createdAt).getTime()) < 60000

        if (!data && userMetadata) {
          // No profile yet — create it (first OAuth login, or signup upsert failed due to RLS).
          const role = metadataRole || intendedRole || 'student'
          const name = userMetadata.app_name
            || sessionStorage.getItem('apple_display_name')
            || userMetadata.full_name || userMetadata.name
            || userMetadata.email?.split('@')[0] || 'Usuario'
          sessionStorage.removeItem('apple_display_name')
          const extra = role === 'teacher'
            ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
            : {}
          const { data: rows } = await supabase
            .from('profiles')
            .upsert({ id: userId, role, name, ...extra }, { onConflict: 'id' })
            .select()
          data = rows?.[0] ?? null
          // If the upsert select returned empty (RLS blocks SELECT during token setup),
          // do a plain read — the insert succeeded even if select didn't return it.
          if (!data) {
            const { data: fb } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
            data = fb
          }
        } else if (data && effectiveRole && data.role !== effectiveRole) {
          // The user signed in from a card that doesn't match their existing role.
          if (intendedRole && isNewUser) {
            // OAuth new user: DB trigger created profile with wrong default role — correct it.
            const extra = intendedRole === 'teacher' && !data.teacher_code
              ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
              : {}
            await supabase.from('profiles').update({ role: intendedRole, ...extra }).eq('id', userId)
            data = { ...data, role: intendedRole, ...extra }
          } else {
            // Existing account with a different role — block and show error.
            sessionStorage.removeItem('oauth_intended_role')
            sessionStorage.removeItem('login_intended_role')
            if (active) {
              setOauthConflict({ existing: data.role, intended: effectiveRole })
              setLoading(false)
            }
            setTimeout(() => supabase.auth.signOut(), 100)
            return
          }
        } else if (data && metadataRole && data.role !== metadataRole && !effectiveRole) {
          // Profile role doesn't match what was explicitly set at signup time.
          // This happens when: email confirmation is enabled, the signup upsert fails due to
          // RLS (no session yet), and the DB trigger creates the profile with a default role.
          // Trust app_role from metadata — it was set once at signup and never changes.
          const extra = metadataRole === 'teacher' && !data.teacher_code
            ? { teacher_code: Math.random().toString(36).substring(2, 8).toUpperCase() }
            : {}
          await supabase.from('profiles').update({ role: metadataRole, ...extra }).eq('id', userId)
          data = { ...data, role: metadataRole, ...extra }
        }

        sessionStorage.removeItem('oauth_intended_role')
        sessionStorage.removeItem('login_intended_role')
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
      // TOKEN_REFRESHED fires every time the user returns to the tab — profile is
      // already loaded so we just update the user object without triggering loading
      if (event === 'TOKEN_REFRESHED') { setUser(session?.user ?? null); return }
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true)
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

  const signUp = async (email, password, name, role, marketingConsent = false) => {
    // Ensure stale role keys don't interfere with a fresh signup
    sessionStorage.removeItem('oauth_intended_role')
    sessionStorage.removeItem('login_intended_role')

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
        { id: data.user.id, role, name, marketing_consent: !!marketingConsent, ...extra },
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

  const signInWithApple = async (role) => {
    sessionStorage.setItem('oauth_intended_role', role)
    try {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
      const rawNonce = Math.random().toString(36).substring(2, 15)
      // SHA256 hash del nonce — Apple lo requiere así
      const msgBuffer = new TextEncoder().encode(rawNonce)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashedNonce = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const result = await SignInWithApple.authorize({
        clientId: 'com.perasha.app',
        redirectURI: `${window.location.origin}/auth/callback`,
        scopes: 'email name',
        state: Math.random().toString(36).substring(2, 10),
        nonce: hashedNonce,
      })
      const { identityToken, givenName, familyName } = result.response
      const fullName = [givenName, familyName].filter(Boolean).join(' ')
      if (fullName) sessionStorage.setItem('apple_display_name', fullName)
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        nonce: rawNonce,
      })
      if (error) { sessionStorage.removeItem('oauth_intended_role'); return error }
      return null
    } catch (e) {
      sessionStorage.removeItem('oauth_intended_role')
      return e
    }
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
  const clearOauthConflict = () => setOauthConflict(null)

  return (
    <AuthCtx.Provider value={{
      user, profile, setProfile, loading,
      signIn, signUp, signInWithGoogle, signInWithApple, signOut,
      recoveryMode, clearRecovery,
      oauthConflict, clearOauthConflict,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
