import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'
import LangToggle from '../components/LangToggle'


export default function Login() {
  const navigate = useNavigate()
  const { profile, signIn, signUp, signInWithGoogle } = useAuth()
  const { isDark } = useTheme()
  const { t: tl } = useLang()
  const [expanded, setExpanded] = useState(null)
  // modal state: null | 'student-register' | 'teacher' | 'student-login'
  const [modal, setModal] = useState(null)

  useEffect(() => {
    if (!profile) return
    navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile')
  }, [profile, navigate])

  const t = isDark ? {
    bg: 'radial-gradient(ellipse at 50% 0%, #1a0f3e 0%, #0d0b1e 50%, #050812 100%)',
    title: 'rgba(255,255,255,0.95)',
    subtitle: 'rgba(255,202,40,0.7)',
    desc: 'rgba(180,170,220,0.6)',
    cardBg: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(255,255,255,0.07)',
    cardText: 'rgba(255,255,255,0.9)',
    cardDesc: 'rgba(180,170,220,0.55)',
    cardCta: 'rgba(255,255,255,0.3)',
    hebrewCard: 'rgba(255,202,40,0.5)',
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
    starColor: 'rgba(255,255,255,0.6)',
    iconDefault: 'rgba(200,190,255,0.6)',
  } : {
    bg: 'radial-gradient(ellipse at 50% 0%, #e0d5be 0%, #f5f0e4 50%, #ece4cc 100%)',
    title: '#1a1200',
    subtitle: 'rgba(140,95,0,0.8)',
    desc: 'rgba(60,40,0,0.5)',
    cardBg: 'rgba(255,255,255,0.75)',
    cardBorder: 'rgba(0,0,0,0.08)',
    cardText: '#1a1200',
    cardDesc: 'rgba(60,40,0,0.5)',
    cardCta: 'rgba(0,0,0,0.3)',
    hebrewCard: 'rgba(140,95,0,0.6)',
    inputBg: 'rgba(255,255,255,0.9)',
    inputBorder: 'rgba(0,0,0,0.12)',
    inputText: '#1a1200',
    inputPlaceholder: 'rgba(0,0,0,0.3)',
    cancelBg: 'rgba(0,0,0,0.05)',
    cancelText: 'rgba(0,0,0,0.4)',
    switchText: 'rgba(0,0,0,0.35)',
    footer: 'rgba(0,0,0,0.2)',
    backBg: 'rgba(255,255,255,0.6)',
    backBorder: 'rgba(0,0,0,0.1)',
    backText: 'rgba(60,40,0,0.6)',
    starColor: 'rgba(140,95,0,0.2)',
    iconDefault: 'rgba(140,95,0,0.45)',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative"
      style={{ background: t.bg, transition: 'background 0.4s' }}>

      <StarField color={t.starColor} />

      <button onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-xs px-4 py-2 rounded-full flex items-center gap-2 z-10 transition-all"
        style={{ background: t.backBg, border: `1px solid ${t.backBorder}`, color: t.backText, backdropFilter: 'blur(8px)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {tl('back')}
      </button>
      <div className="absolute top-6 right-6 z-10"
        style={{ background: t.backBg, border: `1px solid ${t.backBorder}`, borderRadius: '999px', backdropFilter: 'blur(8px)', padding: '4px' }}>
        <LangToggle compact />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-14 fade-up-1">
          <div className="hebrew text-2xl mb-3" style={{ color: t.subtitle }}>בְּחַר אֶת תַּפְקִידְךָ</div>
          <h1 className="text-4xl md:text-5xl font-light" style={{ letterSpacing: '-1.5px', color: t.title }}>
            {tl('how_enter')}
          </h1>
          <p className="mt-3 text-sm" style={{ color: t.desc }}>
            {tl('choose_role')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 fade-up-2">
          {/* Teacher card — inline expand as before */}
          <RoleCard id="teacher" label={tl('role_teacher')} hebrew="מּוֹרֶה"
            description={tl('teacher_desc')}
            color="#f9b800" glow="rgba(249,184,0,0.25)" icon={TeacherIcon}
            expanded={expanded === 'teacher'} onExpand={() => setExpanded(expanded === 'teacher' ? null : 'teacher')}
            t={t} tl={tl} isDark={isDark}>
            {expanded === 'teacher' && (
              <SimpleAuthForm
                role="teacher" color="#f9b800"
                onCancel={() => setExpanded(null)}
                onDone={() => {}} t={t} tl={tl}
              />
            )}
          </RoleCard>

          {/* Student card — opens modal */}
          <RoleCard id="student" label={tl('role_student')} hebrew="תַּלְמִיד"
            description={tl('student_desc')}
            color="#6c33e6" glow="rgba(108,51,230,0.25)" icon={StudentIcon}
            expanded={false} onExpand={() => setModal('student')}
            t={t} tl={tl} isDark={isDark} />

          {/* Guest */}
          <RoleCard id="guest" label={tl('guest')} hebrew="אוֹרֵחַ"
            description={tl('guest_desc')}
            color="#2dd4bf" glow="rgba(45,212,191,0.2)" icon={GuestIcon}
            expanded={false} onExpand={() => navigate('/guest/study')} t={t} tl={tl} isDark={isDark} />
        </div>

        <p className="text-center mt-10 text-xs fade-up-3" style={{ color: t.footer }}>
          Sistema de estudio de Torá · Kehilá
        </p>
      </div>

      {/* Student modal */}
      {modal === 'student' && (
        <StudentModal onClose={() => setModal(null)} isDark={isDark} t={t} tl={tl} />
      )}
    </div>
  )
}

// ── Student modal: registro + plan en un solo popup ──────────────────────────

function StudentModal({ onClose, isDark, t, tl }) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [isLogin, setIsLogin] = useState(true)
  const [isForgot, setIsForgot] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

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
      const err = await signIn(email, password)
      setLoading(false)
      if (err) setError(tl('login_error'))
      return
    }

    if (!name.trim()) { setError(tl('full_name')); setLoading(false); return }

    const err = await signUp(email, password, name.trim(), 'student')
    if (err) { setError('Error al registrarse: ' + err.message); setLoading(false); return }
    // Profile useEffect will redirect to /student/profile → paywall handles subscription
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
          background: isDark ? '#0d0b1e' : '#f5f0e4',
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

        {/* Forgot password form */}
        {isForgot ? (
          <form onSubmit={handleForgot} className="px-6 py-5 flex flex-col gap-3">
            {forgotSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7.5" stroke="#16a34a" strokeWidth="1.3"/>
                    <path d="M5.5 9l2.5 2.5L12.5 7" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>{tl('email_sent')}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {tl('email_sent_desc')}
                </p>
                <button type="button" onClick={() => { setIsForgot(false); setForgotSent(false) }}
                  className="text-xs mt-1" style={{ color: '#6c33e6' }}>
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
                {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg,#6c33e6,#8b5cf6)', color: loading ? 'var(--text-3)' : '#fff', border: loading ? '1px solid var(--border)' : 'none' }}>
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

          {error && <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-1"
            style={{
              background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, #6c33e6, #8b5cf6)',
              color: loading ? 'var(--text-3)' : '#fff',
              border: loading ? '1px solid var(--border)' : 'none',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(108,51,230,0.35)',
            }}>
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#8b5cf6' }} />
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

          {/* Forgot password link — only on login */}
          {isLogin && (
            <button type="button"
              onClick={() => { setIsForgot(true); setError('') }}
              className="text-xs text-center"
              style={{ color: '#6c33e6' }}>
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
        )} {/* end isForgot conditional */}
      </div>
    </div>
  )
}

// ── Teacher inline auth form (unchanged) ────────────────────────────────────

function SimpleAuthForm({ role, color, onCancel, onDone, t, tl }) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.inputText,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    let err
    if (isRegister) {
      if (!name.trim()) { setError(tl('full_name')); setLoading(false); return }
      err = await signUp(email, password, name.trim(), role)
    } else {
      err = await signIn(email, password)
    }
    setLoading(false)
    if (err) {
      setError(isRegister ? 'Error: ' + err.message : tl('login_error'))
    }
  }

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
      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
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
    </form>
  )
}

// ── Role card ────────────────────────────────────────────────────────────────

function RoleCard({ label, hebrew, description, color, glow, icon: Icon, expanded, onExpand, children, t, tl, isDark }) {
  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: expanded
          ? isDark
            ? `radial-gradient(ellipse at 30% 20%, ${glow} 0%, rgba(255,255,255,0.04) 60%)`
            : `radial-gradient(ellipse at 30% 20%, ${glow} 0%, rgba(255,255,255,0.8) 60%)`
          : t.cardBg,
        border: `1px solid ${expanded ? color + '40' : t.cardBorder}`,
        backdropFilter: 'blur(16px)',
      }}>

      <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: expanded ? 1 : 0 }} />

      <button onClick={onExpand} className="w-full text-left p-7 flex flex-col gap-5">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{
            background: expanded ? `${color}20` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${expanded ? color + '50' : t.cardBorder}`,
          }}>
          <Icon color={expanded ? color : t.iconDefault} />
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-medium" style={{ color: expanded ? color : t.cardText }}>{label}</span>
            <span className="hebrew text-sm" style={{ color: t.hebrewCard }}>{hebrew}</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: t.cardDesc }}>{description}</p>
        </div>
        {!expanded && (
          <div className="mt-auto flex items-center gap-2 text-xs font-medium" style={{ color: t.cardCta }}>
            {tl('enter')}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {children}
    </div>
  )
}

// ── Misc ─────────────────────────────────────────────────────────────────────

function StarField({ color }) {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 0.5, dur: Math.random() * 4 + 2, del: Math.random() * 5,
  }))
  return (
    <>
      {stars.map(s => (
        <div key={s.id} className="star absolute pointer-events-none"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            background: color,
            borderRadius: '50%',
            '--duration': `${s.dur}s`, '--delay': `${s.del}s`,
          }} />
      ))}
    </>
  )
}

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

function GuestIcon({ color }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="9" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M5 22c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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
