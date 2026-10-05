import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Mail, Moon, Presentation, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'
import LangToggle from '../components/LangToggle'
import { Capacitor } from '@capacitor/core'
import { Logo, Modal, Spinner } from '../components/ui'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, oauthConflict, clearOauthConflict } = useAuth()
  const { isDark, toggle } = useTheme()
  const { t: tl } = useLang()
  const [role, setRole] = useState(null) // 'teacher' | 'student' | null
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
    setRole(null)
    setConflictError(oauthConflict)
  }, [oauthConflict]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return
    navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile')
  }, [profile, navigate])

  const roles = [
    { id: 'teacher', label: tl('role_teacher'), hebrew: 'מוֹרֶה', description: tl('teacher_desc'), icon: Presentation, tone: 'gold' },
    { id: 'student', label: tl('role_student'), hebrew: 'תַּלְמִיד', description: tl('student_desc'), icon: GraduationCap, tone: 'accent' },
  ]

  return (
    <div className="min-h-[100svh] flex flex-col bg-canvas relative overflow-hidden">
      {/* Soft parchment light */}
      <div className="absolute inset-x-0 top-0 h-[60vh] pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(var(--gold-rgb),0.10), transparent 70%)' }} />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8 h-16 app-header">
        <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm text-ink-3">
          <ArrowLeft size={16} className="rtl:rotate-180" />{tl('back')}
        </button>
        <Logo size={30} />
        <div className="flex items-center gap-1">
          <LangToggle />
          <button onClick={toggle} className="btn btn-ghost btn-icon" aria-label={isDark ? tl('light_mode') : tl('dark_mode')}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-12 fade-up-1">
            <p className="hebrew text-[24px] text-gold-ink mb-3" style={{ fontWeight: 400 }}>בְּחַר אֶת תַּפְקִידְךָ</p>
            <h1 className="font-serif font-semibold text-ink tracking-[-0.025em]" style={{ fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.05 }}>
              {tl('how_enter')}
            </h1>
            <p className="mt-3 text-[15px] text-ink-3">{tl('choose_role')}</p>
          </div>

          {conflictError && (
            <div role="alert" className="mb-6 p-4 rounded-2xl flex items-start gap-3 fade-up-2"
              style={{ background: 'rgba(var(--danger-rgb),0.07)', border: '1px solid rgba(var(--danger-rgb),0.2)' }}>
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-danger" />
              <div>
                <p className="text-[14px] font-semibold text-danger">{tl('oauth_conflict_title')}</p>
                <p className="text-[13px] text-ink-2 mt-0.5">
                  {conflictError.existing === 'teacher' ? tl('oauth_conflict_desc_teacher') : tl('oauth_conflict_desc_student')}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-up-2">
            {roles.map(r => {
              const Icon = r.icon
              const toneStyle = r.tone === 'gold'
                ? { background: 'rgba(var(--gold-rgb),0.12)', color: 'var(--text-gold)' }
                : { background: 'rgba(var(--accent-rgb),0.07)', color: 'rgb(var(--accent-rgb))' }
              return (
                <button key={r.id} onClick={() => setRole(r.id)}
                  className="card card-interactive group text-start p-7 flex flex-col gap-5 min-h-[240px]">
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={toneStyle}>
                    <Icon size={22} strokeWidth={1.6} />
                  </span>
                  <span>
                    <span className="flex items-baseline gap-2.5">
                      <span className="font-serif text-[24px] font-semibold text-ink">{r.label}</span>
                      <span className="hebrew-ui text-[17px] text-ink-3">{r.hebrew}</span>
                    </span>
                    <span className="block text-[14px] text-ink-3 leading-relaxed mt-1.5">{r.description}</span>
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2 group-hover:text-ink">
                    {tl('enter')}<ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-center mt-12 text-[12px] text-ink-4 fade-up-3">{tl('ui_login_footer')}</p>
        </div>
      </main>

      {role && <AuthSheet role={role} onClose={() => setRole(null)} tl={tl} />}
    </div>
  )
}

// ── Auth sheet (sign in / register / recover) ────────────────────────────────

function AuthSheet({ role, onClose, tl }) {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth()
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
      sessionStorage.setItem('login_intended_role', role)
      const err = await signIn(email, password)
      setLoading(false)
      if (err) { sessionStorage.removeItem('login_intended_role'); setError(tl('login_error')) }
      return
    }

    if (!name.trim()) { setError(tl('full_name')); setLoading(false); return }

    const result = await signUp(email, password, name.trim(), role, marketingConsent)
    setLoading(false)
    if (result?.needsConfirmation) { setConfirmationSent(true); return }
    if (result) { setError(`${tl('ui_register_error')}: ${result.message}`); return }
    // null → success, profile useEffect redirects
  }

  const roleHeb = role === 'teacher' ? 'מוֹרֶה' : 'תַּלְמִיד'
  const title = confirmationSent ? tl('confirm_sent')
    : isForgot ? tl('recover_password')
    : isLogin ? tl('login_title') : tl('register_title')

  return (
    <Modal open onClose={onClose} size="sm" title={title}
      subtitle={<span className="inline-flex items-center gap-2">{role === 'teacher' ? tl('role_teacher_label') : tl('role_student_label')} <span className="hebrew-ui">{roleHeb}</span></span>}>
      {confirmationSent ? (
        <div className="flex flex-col items-center gap-4 text-center py-4">
          <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.07)', color: 'rgb(var(--accent-rgb))' }}>
            <Mail size={24} strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-[14px] text-ink-2">{tl('confirm_sent_desc')}</p>
            <p className="text-[14px] font-medium text-ink mt-2">{email}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary mt-2">{tl('close')}</button>
        </div>
      ) : isForgot ? (
        forgotSent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={36} strokeWidth={1.5} style={{ color: 'rgb(var(--success-rgb))' }} />
            <p className="text-[15px] font-semibold text-ink">{tl('email_sent')}</p>
            <p className="text-[13px] text-ink-3">{tl('email_sent_desc')}</p>
            <button type="button" onClick={() => { setIsForgot(false); setForgotSent(false) }} className="btn btn-ghost btn-sm text-accent mt-1">
              {tl('forgot_back')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="flex flex-col gap-3">
            <p className="text-[14px] text-ink-3">{tl('recover_desc')}</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={tl('email')} aria-label={tl('email')}
              required autoFocus autoComplete="email" className="input" />
            {error && <p className="text-[13px] text-danger">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">{loading ? <Spinner size={16} /> : tl('send_link')}</button>
            <button type="button" onClick={() => { setIsForgot(false); setError('') }} className="btn btn-ghost btn-sm text-ink-3">{tl('back')}</button>
          </form>
        )
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!isLogin && (
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={tl('full_name')} aria-label={tl('full_name')}
              required autoFocus autoComplete="name" className="input" />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={tl('email')} aria-label={tl('email')}
            required autoFocus={isLogin} autoComplete="email" className="input" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={tl('password')} aria-label={tl('password')}
            required autoComplete={isLogin ? 'current-password' : 'new-password'} className="input" />

          {!isLogin && (
            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[#0B315F]" />
              <span className="text-[12px] leading-relaxed text-ink-3">{tl('marketing_consent_label')}</span>
            </label>
          )}

          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-1">
            {loading ? <><Spinner size={16} />{isLogin ? tl('logging_in') : tl('registering')}</> : isLogin ? tl('login_tab') : tl('register_btn')}
          </button>

          {isLogin && (
            <button type="button" onClick={() => { setIsForgot(true); setError('') }} className="text-[13px] text-accent hover:underline self-center">
              {tl('forgot_password')}
            </button>
          )}

          <div className="flex items-center gap-3 my-1">
            <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-[12px] text-ink-4">{tl('ui_or')}</span>
            <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <button type="button" onClick={() => signInWithGoogle(role)} className="btn btn-secondary btn-lg w-full">
            <GoogleIcon />{tl('google_btn')}
          </button>
          {isNative && (
            <button type="button" onClick={() => signInWithApple(role)} className="btn btn-lg w-full" style={{ background: '#000', color: '#fff' }}>
              <AppleIcon />Sign in with Apple
            </button>
          )}

          <button type="button" onClick={() => { setIsLogin(!isLogin); setError('') }} className="text-[13px] text-ink-3 hover:text-ink py-1 mt-1">
            {isLogin ? tl('no_account') : tl('have_account')}
          </button>
        </form>
      )}
    </Modal>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 814 1000" fill="white" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-156.8-108.4C98.3 653.1 56 552.8 56 454.3c0-168.8 109.7-258.2 221.5-258.2 79.3 0 145.2 51.9 194.8 51.9 47.5 0 121.9-55 212.6-55 34.2 0 122.5 3.2 189.4 86.2zm-278-190.5c35.8-42.5 61.6-101.9 61.6-161.3 0-8.3-.6-16.7-2-24.4-58.3 2.3-128 38.9-169.2 87.2-32.7 36.8-63.3 96.2-63.3 156.3 0 9 1.4 18 2 21 3.5.6 9 1.4 14.5 1.4 52.3 0 116.2-34.9 156.4-80.2z"/>
    </svg>
  )
}
