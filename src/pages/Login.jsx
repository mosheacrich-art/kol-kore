import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

const MONTHLY = 5
const ANNUAL = 50
const TRIAL_DAYS = 7
const SAVING_PCT = Math.round(100 - (ANNUAL / (MONTHLY * 12)) * 100)

export default function Login() {
  const navigate = useNavigate()
  const { profile, signIn, signUp } = useAuth()
  const { isDark } = useTheme()
  const [expanded, setExpanded] = useState(null)
  // modal state: null | 'student-register' | 'teacher' | 'student-login'
  const [modal, setModal] = useState(null)

  useEffect(() => {
    if (profile) navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile')
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
        Volver
      </button>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-14 fade-up-1">
          <div className="hebrew text-2xl mb-3" style={{ color: t.subtitle }}>בְּחַר אֶת תַּפְקִידְךָ</div>
          <h1 className="text-4xl md:text-5xl font-light" style={{ letterSpacing: '-1.5px', color: t.title }}>
            ¿Cómo entras hoy?
          </h1>
          <p className="mt-3 text-sm" style={{ color: t.desc }}>
            Elige tu rol para acceder a tu espacio personalizado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 fade-up-2">
          {/* Teacher card — inline expand as before */}
          <RoleCard id="teacher" label="Profesor" hebrew="מּוֹרֶה"
            description="Gestiona alumnos, clases, deberes y estadísticas"
            color="#f9b800" glow="rgba(249,184,0,0.25)" icon={TeacherIcon}
            expanded={expanded === 'teacher'} onExpand={() => setExpanded(expanded === 'teacher' ? null : 'teacher')}
            t={t} isDark={isDark}>
            {expanded === 'teacher' && (
              <SimpleAuthForm
                role="teacher" color="#f9b800"
                onCancel={() => setExpanded(null)}
                onDone={() => {}} t={t}
              />
            )}
          </RoleCard>

          {/* Student card — opens modal */}
          <RoleCard id="student" label="Alumno" hebrew="תַּלְמִיד"
            description="Accede a tu perfil, deberes y estudio de la Perashá"
            color="#6c33e6" glow="rgba(108,51,230,0.25)" icon={StudentIcon}
            expanded={false} onExpand={() => setModal('student')}
            t={t} isDark={isDark} />

          {/* Guest */}
          <RoleCard id="guest" label="Invitado" hebrew="אוֹרֵחַ"
            description="Explora la plataforma sin necesidad de cuenta"
            color="#2dd4bf" glow="rgba(45,212,191,0.2)" icon={GuestIcon}
            expanded={false} onExpand={() => navigate('/guest/study')} t={t} isDark={isDark} />
        </div>

        <p className="text-center mt-10 text-xs fade-up-3" style={{ color: t.footer }}>
          Sistema de estudio de Torá · Kehilá
        </p>
      </div>

      {/* Student modal */}
      {modal === 'student' && (
        <StudentModal onClose={() => setModal(null)} isDark={isDark} t={t} />
      )}
    </div>
  )
}

// ── Student modal: registro + plan en un solo popup ──────────────────────────

function StudentModal({ onClose, isDark, t }) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('trial')   // 'trial' | 'monthly' | 'annual'
  const [months, setMonths] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const price = plan === 'annual' ? ANNUAL : plan === 'monthly' ? MONTHLY * months : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const err = await signIn(email, password)
      if (err) { setError('Email o contraseña incorrectos'); setLoading(false) }
      return
    }

    if (!name.trim()) { setError('Escribe tu nombre'); setLoading(false); return }

    const err = await signUp(email, password, name.trim(), 'student')
    if (err) { setError('Error al registrarse: ' + err.message); setLoading(false); return }

    // Registered — now handle plan
    if (plan === 'trial') {
      navigate('/student/profile')
      return
    }

    // Paid plan — call Stripe checkout
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout', {
        body: { plan, months: plan === 'annual' ? 12 : months },
      })
      if (fnErr || !data?.url) throw new Error(fnErr?.message ?? 'Error al iniciar el pago')
      window.location.href = data.url
    } catch (ex) {
      setError(ex.message)
      setLoading(false)
    }
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
              {isLogin ? 'Iniciar sesión' : 'Crear cuenta de alumno'}
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

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">

          {/* Register fields */}
          {!isLogin && (
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Tu nombre completo" required autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle} />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required autoFocus={isLogin}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña" required
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle} />

          {error && <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>}

          {/* Plan selector — only on register */}
          {!isLogin && (
            <div className="mt-1">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Elige tu plan
              </p>

              {/* Trial */}
              <button type="button" onClick={() => setPlan('trial')}
                className="w-full rounded-xl p-3.5 text-left mb-2 transition-all flex items-center justify-between"
                style={{
                  background: plan === 'trial' ? 'rgba(249,184,0,0.1)' : 'var(--bg-card)',
                  border: `1.5px solid ${plan === 'trial' ? '#f9b800' : 'var(--border)'}`,
                }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: plan === 'trial' ? '#f9b800' : 'var(--border)' }}>
                    {plan === 'trial' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f9b800' }} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: plan === 'trial' ? 'var(--text-gold)' : 'var(--text)' }}>
                      {TRIAL_DAYS} días gratis
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin tarjeta · Decides al terminar</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(249,184,0,0.15)', color: 'var(--text-gold)' }}>
                  Gratis
                </span>
              </button>

              {/* Monthly */}
              <button type="button" onClick={() => setPlan('monthly')}
                className="w-full rounded-xl p-3.5 text-left mb-2 transition-all"
                style={{
                  background: plan === 'monthly' ? 'rgba(108,51,230,0.1)' : 'var(--bg-card)',
                  border: `1.5px solid ${plan === 'monthly' ? '#8b5cf6' : 'var(--border)'}`,
                }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: plan === 'monthly' ? '#8b5cf6' : 'var(--border)' }}>
                    {plan === 'monthly' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />}
                  </div>
                  <div className="flex items-baseline gap-2 flex-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Mensual</span>
                    <span className="text-sm font-light" style={{ color: 'var(--text-3)' }}>5 €/mes</span>
                  </div>
                </div>
                {plan === 'monthly' && (
                  <div className="pl-6">
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>¿Cuántos meses quieres pagar?</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 9, 12].map(m => (
                        <button key={m} type="button"
                          onClick={e => { e.stopPropagation(); setMonths(m) }}
                          className="py-1 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: months === m ? '#8b5cf6' : 'var(--bg-card)',
                            color: months === m ? '#fff' : 'var(--text-3)',
                            border: `1px solid ${months === m ? '#8b5cf6' : 'var(--border)'}`,
                          }}>
                          {m === 12 ? '1 año' : `${m}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </button>

              {/* Annual */}
              <button type="button" onClick={() => setPlan('annual')}
                className="w-full rounded-xl p-3.5 text-left mb-3 transition-all relative"
                style={{
                  background: plan === 'annual' ? 'rgba(249,184,0,0.07)' : 'var(--bg-card)',
                  border: `1.5px solid ${plan === 'annual' ? '#f9b800' : 'var(--border)'}`,
                }}>
                <div className="absolute -top-2.5 right-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'linear-gradient(135deg,#f9b800,#ffd54f)', color: '#0d0b1e' }}>
                    −{SAVING_PCT}%
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: plan === 'annual' ? '#f9b800' : 'var(--border)' }}>
                    {plan === 'annual' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f9b800' }} />}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Anual</span>
                    <span className="text-sm font-light" style={{ color: 'var(--text-3)' }}>50 €/año</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>= 4,17 €/mes</span>
                  </div>
                </div>
              </button>

              {/* No auto-renewal notice */}
              <div className="flex items-start gap-2 px-0.5 mb-1">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#16a34a" strokeWidth="1.2"/>
                  <path d="M4 6.5l2 2L9 4.5" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-3)' }}>Sin renovación automática.</strong>{' '}
                  Pagas una vez, decides tú si quieres renovar.
                </p>
              </div>
            </div>
          )}

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
                {plan !== 'trial' ? 'Redirigiendo al pago…' : 'Creando cuenta…'}
              </>
            ) : isLogin
              ? 'Entrar'
              : plan === 'trial'
                ? `Empezar ${TRIAL_DAYS} días gratis →`
                : `Registrarme y pagar ${price} € →`
            }
          </button>

          {/* Switch login/register */}
          <button type="button"
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="text-xs text-center py-1"
            style={{ color: t.switchText }}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>

        </form>
      </div>
    </div>
  )
}

// ── Teacher inline auth form (unchanged) ────────────────────────────────────

function SimpleAuthForm({ role, color, onCancel, onDone, t }) {
  const { signIn, signUp } = useAuth()
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
      if (!name.trim()) { setError('Escribe tu nombre'); setLoading(false); return }
      err = await signUp(email, password, name.trim(), role)
    } else {
      err = await signIn(email, password)
    }
    if (err) {
      setError(isRegister ? 'Error al registrarse: ' + err.message : 'Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-7 pb-7 flex flex-col gap-3">
      {isRegister && (
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Tu nombre completo" required autoFocus
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle} />
      )}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Email" required autoFocus={!isRegister}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={inputStyle} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
        placeholder="Contraseña" required
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={inputStyle} />
      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-xs transition-all"
          style={{ background: t.cancelBg, color: t.cancelText }}>
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: color, color: '#fff', opacity: loading ? 0.7 : 1 }}>
          {loading ? '…' : isRegister ? 'Registrarse' : 'Entrar'}
        </button>
      </div>
      <button type="button"
        onClick={() => { setIsRegister(!isRegister); setEmail(''); setPassword(''); setName('') }}
        className="text-xs text-center"
        style={{ color: t.switchText }}>
        {isRegister ? '¿Ya tienes cuenta? Entrar' : '¿Sin cuenta? Registrarse'}
      </button>
    </form>
  )
}

// ── Role card ────────────────────────────────────────────────────────────────

function RoleCard({ label, hebrew, description, color, glow, icon: Icon, expanded, onExpand, children, t, isDark }) {
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
            Entrar
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
