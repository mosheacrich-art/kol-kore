import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'
import LangToggle from '../components/LangToggle'
import Logo from '../components/Logo'
import { Capacitor } from '@capacitor/core'


export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, signIn, signUp, signInWithGoogle, oauthConflict, clearOauthConflict } = useAuth()
  const { isDark } = useTheme()
  const { t: tl } = useLang()
  const [expanded, setExpanded] = useState(null)
  const [modal, setModal] = useState(null)
  const [conflictError, setConflictError] = useState(null) // { existing, intended }

  // Conflict from OAuth redirect (URL params)
  const oauthError   = searchParams.get('oauth_error')
  const existingRole = searchParams.get('existing')
  const intendedRole = searchParams.get('intended')

  useEffect(() => {
    if (oauthError === 'conflict' && existingRole) {
      setConflictError({ existing: existingRole, intended: intendedRole })
    }
  }, [oauthError, existingRole, intendedRole])

  // Conflict from email/password sign-in (oauthConflict state in context)
  useEffect(() => {
    if (!oauthConflict) return
    clearOauthConflict()
    setModal(null)
    setExpanded(null)
    setConflictError(oauthConflict)
  }, [oauthConflict])

  useEffect(() => {
    if (!profile) return
    navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile')
  }, [profile, navigate])

  const t = isDark ? {
    bg: '#0d0b1e',
    title: 'rgba(255,255,255,0.95)',
    subtitle: 'rgba(200,148,31,0.7)',
    desc: 'rgba(27,47,107,0.6)',
    cardBg: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(255,255,255,0.07)',
    cardText: 'rgba(255,255,255,0.9)',
    cardDesc: 'rgba(27,47,107,0.55)',
    cardCta: 'rgba(255,255,255,0.3)',
    hebrewCard: 'rgba(200,148,31,0.5)',
    inputBg: 'rgba(255,255,255,0.07)',
    inputBorder: 'rgba(255,255,255,0.12)',
    inputText: 'rgba(255,255,255,0.9)',
    inputPlaceholder: 'rgba(255,255,255,0.35)',
    cancelBg: 'rgba(255,255,255,0.06)',
    cancelText: 'rgba(255,255,255,0.5)',
    switchText: 'rgba(255,255,255,0.35)',
    footer: 'rgba(255,255,255,0.2)',
    backBg: 'rgba(255,255,255,0.07)',
    backBorder: 'rgba(255,255,255,0.1)',
    backText: 'rgba(255,255,255,0.55)',
    iconDefault: 'rgba(200,190,255,0.6)',
  } : {
    bg: '#ffffff',
    title: '#111827',
    subtitle: '#9a6f12',
    desc: '#6b7280',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    cardText: '#111827',
    cardDesc: '#6b7280',
    cardCta: 'rgba(0,0,0,0.3)',
    hebrewCard: '#9a6f12',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    inputText: '#111827',
    inputPlaceholder: 'rgba(0,0,0,0.3)',
    cancelBg: 'rgba(0,0,0,0.05)',
    cancelText: 'rgba(0,0,0,0.4)',
    switchText: 'rgba(0,0,0,0.35)',
    footer: 'rgba(0,0,0,0.2)',
    backBg: '#ffffff',
    backBorder: '#e5e7eb',
    backText: '#6b7280',
    iconDefault: '#9ca3af',
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[5fr_6fr]" style={{ background: '#fff' }}>
      <aside className="hidden lg:flex flex-col justify-between p-12" style={{ background: '#1b2f6b', color: '#fff' }}>
        <Logo size={34} color="#fff" />
        <div>
          <p dir="rtl" className="hebrew text-5xl leading-[1.8]" style={{ color: '#e3b448' }}>בְּרֵאשִׁית בָּרָא אֱלֹהִים</p>
          <p className="serif text-2xl mt-6 max-w-sm" style={{ fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>{tl('hero_tagline')}</p>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Sefaria · Tikkun</p>
      </aside>

      <main className="flex flex-col px-6 sm:px-14 py-8">
        <div className="flex items-center justify-between mb-14">
          <button onClick={() => navigate('/')} className="text-sm flex items-center gap-2" style={{ color: '#1b2f6b' }}>
            <span>←</span>{tl('back')}
          </button>
          <LangToggle compact />
        </div>

        <div className="w-full max-w-md my-auto">
          <div className="lg:hidden mb-10"><Logo size={30} /></div>
          <p className="eyebrow mb-3">{tl('choose_role')}</p>
          <h1 className="serif text-4xl sm:text-5xl mb-10" style={{ color: '#1b2f6b', fontWeight: 600 }}>{tl('how_enter')}</h1>

        {/* Role-conflict error banner (email/password or Google) */}
        {conflictError && (
          <div className="mb-6 p-4 rounded-2xl text-sm fade-up-2 flex items-start gap-3"
            style={{ background: '#fdf3f2', border: '1px solid rgba(180,35,24,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="9" cy="9" r="7.5" stroke="#b42318" strokeWidth="1.3"/>
              <path d="M9 5.5v4M9 12.5v.5" stroke="#b42318" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="font-semibold mb-0.5" style={{ color: '#b42318' }}>
                {tl('oauth_conflict_title')}
              </p>
              <p className="text-xs" style={{ color: 'rgba(252,165,165,0.85)' }}>
                {conflictError.existing === 'teacher'
                  ? tl('oauth_conflict_desc_teacher')
                  : tl('oauth_conflict_desc_student')}
              </p>
            </div>
          </div>
        )}

          <div style={{ borderTop: '1px solid #e5e7eb' }}>
            <RoleCard label={tl('role_teacher')} hebrew="מּוֹרֶה"
              description={tl('teacher_desc')}
              color="#c8941f" icon={TeacherIcon}
              expanded={false} onExpand={() => setModal('teacher')} />
            <RoleCard label={tl('role_student')} hebrew="תַּלְמִיד"
              description={tl('student_desc')}
              color="#1b2f6b" icon={StudentIcon}
              expanded={false} onExpand={() => setModal('student')} />
          </div>
        </div>
      </main>

      {modal === 'teacher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <div>
                <p className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>מּוֹרֶה</p>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{tl('role_teacher')}</h2>
              </div>
              <button onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="pt-4">
              <SimpleAuthForm role="teacher" color="#c8941f" onCancel={() => setModal(null)} onDone={() => {}} t={t} tl={tl} />
            </div>
          </div>
        </div>
      )}
      {modal === 'student' && (
        <StudentModal onClose={() => setModal(null)} isDark={isDark} t={t} tl={tl} />
      )}
    </div>
  )
}

// ── Student modal: registro + plan en un solo popup ──────────────────────────

function StudentModal({ onClose, isDark, t, tl }) {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()
  const isNative = Capacitor.isNativePlatform()

  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setForgotSent(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      sessionStorage.setItem('login_intended_role', 'student')
      const err = await signIn(email, password)
      setLoading(false)
      if (err) { sessionStorage.removeItem('login_intended_role'); setError(tl('login_error')) }
      return
    }

    if (!name.trim()) { setError(tl('full_name')); setLoading(false); return }

    const result = await signUp(email, password, name.trim(), 'student', marketingConsent)
    setLoading(false)
    if (result?.needsConfirmation) { setConfirmationSent(true); return }
    if (result) { setError('Error al registrarse: ' + result.message); return }
    // null → success, profile useEffect redirects
  }

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.inputText,
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: isDark ? '#0d0b1e' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
          <div>
            <p className="text-xs hebrew" style={{ color: 'var(--text-gold)' }}>תַּלְמִיד</p>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {isLogin ? tl('login_title') : tl('register_title')}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Account confirmation screen (after registration) */}
        {confirmationSent ? (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: '#f6f7f9', border: '1px solid rgba(27,47,107,0.2)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 8l9 6 9-6" stroke="#1b2f6b" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="#1b2f6b" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>{tl('confirm_sent')}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                {tl('confirm_sent_desc')}
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: '#1b2f6b' }}>{email}</p>
            </div>
            <button type="button" onClick={onClose}
              className="mt-2 text-xs px-4 py-2 rounded-xl transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              {tl('close')}
            </button>
          </div>
        ) : isForgot ? (
          <form onSubmit={handleForgot} className="px-6 py-5 flex flex-col gap-3">
            {forgotSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: '#f6f7f9' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7.5" stroke="#1b2f6b" strokeWidth="1.3"/>
                    <path d="M5.5 9l2.5 2.5L12.5 7" stroke="#1b2f6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#1b2f6b' }}>{tl('email_sent')}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {tl('email_sent_desc')}
                </p>
                <button type="button" onClick={() => { setIsForgot(false); setForgotSent(false) }}
                  className="text-xs mt-1" style={{ color: '#1b2f6b' }}>
                  {tl('forgot_back')}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tl('recover_password')}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {tl('recover_desc')}
                </p>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={tl('email')} required autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle} />
                {error && <p className="text-xs" style={{ color: '#b42318' }}>{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: loading ? 'var(--bg-card)' : '#1b2f6b', color: loading ? 'var(--text-3)' : '#fff', border: loading ? '1px solid var(--border)' : 'none' }}>
                  {loading ? '…' : tl('send_link')}
                </button>
                <button type="button" onClick={() => { setIsForgot(false); setError('') }}
                  className="text-xs text-center" style={{ color: t.switchText }}>
                  {tl('back')}
                </button>
              </>
            )}
          </form>
        ) : (

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">

          {/* Register fields */}
          {!isLogin && (
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder={tl('full_name')} required autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle} />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={tl('email')} required autoFocus={isLogin}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={tl('password')} required
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle} />

          {!isLogin && (
            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)}
                className="mt-0.5 flex-shrink-0 accent-[#1b2f6b]" />
              <span className="text-xs leading-relaxed" style={{ color: t.switchText }}>
                {tl('marketing_consent_label')}
              </span>
            </label>
          )}

          {error && <p className="text-xs px-1" style={{ color: '#b42318' }}>{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-1"
            style={{
              background: loading ? 'var(--bg-card)' : '#1b2f6b',
              color: loading ? 'var(--text-3)' : '#fff',
              border: loading ? '1px solid var(--border)' : 'none',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(27,47,107,0.35)',
            }}>
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(27,47,107,0.3)', borderTopColor: '#1b2f6b' }} />
                {isLogin ? tl('logging_in') : tl('registering')}
              </>
            ) : isLogin ? tl('login_tab') : tl('register_btn')
            }
          </button>

          {/* Google sign-in */}
          <div className="flex items-center gap-3 my-0.5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: t.switchText }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <button type="button" onClick={() => signInWithGoogle('student')}
            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText }}>
            <GoogleIcon />
            {tl('google_btn')}
          </button>

          {isNative && (
            <button type="button" onClick={() => signInWithApple('student')}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '12px' }}>
              <AppleIcon />
              Sign in with Apple
            </button>
          )}

          {/* Forgot password link — only on login */}
          {isLogin && (
            <button type="button"
              onClick={() => { setIsForgot(true); setError('') }}
              className="text-xs text-center"
              style={{ color: '#1b2f6b' }}>
              {tl('forgot_password')}
            </button>
          )}

          {/* Switch login/register */}
          <button type="button"
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="text-xs text-center py-1"
            style={{ color: t.switchText }}>
            {isLogin ? tl('no_account') : tl('have_account')}
          </button>

        </form>
        )} {/* end isForgot / confirmationSent conditional */}
      </div>
    </div>
  )
}

// ── Teacher inline auth form (unchanged) ────────────────────────────────────

function SimpleAuthForm({ role, color, onCancel, onDone, t, tl }) {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth()
  const isNative = Capacitor.isNativePlatform()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.inputText,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (isRegister) {
      if (!name.trim()) { setError(tl('full_name')); setLoading(false); return }
      const result = await signUp(email, password, name.trim(), role, marketingConsent)
      setLoading(false)
      if (result?.needsConfirmation) { setConfirmationSent(true); return }
      if (result) { setError('Error: ' + result.message); return }
    } else {
      sessionStorage.setItem('login_intended_role', role)
      const err = await signIn(email, password)
      setLoading(false)
      if (err) { sessionStorage.removeItem('login_intended_role'); setError(tl('login_error')) }
    }
  }

  if (confirmationSent) return (
    <div className="px-7 pb-7 pt-2 flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 8l9 6 9-6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
        </svg>
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{tl('confirm_sent')}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{tl('confirm_sent_desc')}</p>
        <p className="text-xs mt-1 font-medium" style={{ color }}>{email}</p>
      </div>
      <button type="button" onClick={onCancel}
        className="text-xs px-4 py-2 rounded-xl"
        style={{ background: t.cancelBg, color: t.cancelText }}>
        {tl('close')}
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="px-7 pb-7 flex flex-col gap-3">
      {isRegister && (
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder={tl('full_name')} required autoFocus
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle} />
      )}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder={tl('email')} required autoFocus={!isRegister}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={inputStyle} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
        placeholder={tl('password')} required
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={inputStyle} />
      {isRegister && (
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)}
            className="mt-0.5 flex-shrink-0 accent-[#1b2f6b]" />
          <span className="text-xs leading-relaxed" style={{ color: t.switchText }}>
            {tl('marketing_consent_label')}
          </span>
        </label>
      )}
      {error && <p className="text-xs" style={{ color: '#b42318' }}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-xs transition-all"
          style={{ background: t.cancelBg, color: t.cancelText }}>
          {tl('cancel')}
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: color, color: '#fff', opacity: loading ? 0.7 : 1 }}>
          {loading ? '…' : isRegister ? tl('register_short') : tl('enter')}
        </button>
      </div>
      <button type="button"
        onClick={() => { setIsRegister(!isRegister); setEmail(''); setPassword(''); setName('') }}
        className="text-xs text-center"
        style={{ color: t.switchText }}>
        {isRegister ? tl('have_account_short') : tl('no_account_short')}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: t.switchText }}>o</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>
      <button type="button" onClick={() => signInWithGoogle(role)}
        className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText }}>
        <GoogleIcon />
        {tl('google_btn')}
      </button>

      {isNative && (
        <button type="button" onClick={() => signInWithApple(role)}
          className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
          style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '12px' }}>
          <AppleIcon />
          Sign in with Apple
        </button>
      )}
    </form>
  )
}

// ── Role card ────────────────────────────────────────────────────────────────

function RoleCard({ label, hebrew, description, color, icon: Icon, expanded, onExpand, children }) {
  return (
    <div style={{ borderBottom: '1px solid #e5e7eb' }}>
      <button onClick={onExpand} className="w-full text-left py-6 flex items-center gap-5 group">
        <Icon color={expanded ? color : '#1b2f6b'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="serif text-2xl" style={{ color: '#1b2f6b', fontWeight: 600 }}>{label}</span>
            <span className="hebrew text-base" style={{ color: '#c8941f' }}>{hebrew}</span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{description}</p>
        </div>
        <span className="text-xl transition-transform group-hover:translate-x-1" style={{ color: '#1b2f6b' }}>{expanded ? '−' : '→'}</span>
      </button>
      {children && <div className="pb-6">{children}</div>}
    </div>
  )
}

// ── Misc ─────────────────────────────────────────────────────────────────────


function StudentIcon({ color }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 3L2 8.5l11 5.5 11-5.5L13 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M5 10.5v6c0 2.5 3.5 4.5 8 4.5s8-2 8-4.5v-6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function TeacherIcon({ color }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="3" y="4" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M8 22h10M13 18v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 9h4M8 12h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}


function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 814 1000" fill="white">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-156.8-108.4C98.3 653.1 56 552.8 56 454.3c0-168.8 109.7-258.2 221.5-258.2 79.3 0 145.2 51.9 194.8 51.9 47.5 0 121.9-55 212.6-55 34.2 0 122.5 3.2 189.4 86.2zm-278-190.5c35.8-42.5 61.6-101.9 61.6-161.3 0-8.3-.6-16.7-2-24.4-58.3 2.3-128 38.9-169.2 87.2-32.7 36.8-63.3 96.2-63.3 156.3 0 9 1.4 18 2 21 3.5.6 9 1.4 14.5 1.4 52.3 0 116.2-34.9 156.4-80.2z"/>
    </svg>
  )
}
