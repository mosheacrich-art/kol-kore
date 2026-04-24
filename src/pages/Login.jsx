import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const navigate = useNavigate()
  const { profile, signIn, signUp } = useAuth()
  const { isDark } = useTheme()
  const [expanded, setExpanded] = useState(null)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/student/profile')
  }, [profile, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    let err
    if (isRegister) {
      if (!name.trim()) { setError('Escribe tu nombre'); setLoading(false); return }
      err = await signUp(email, password, name.trim(), expanded)
    } else {
      err = await signIn(email, password)
    }
    if (err) {
      setError(isRegister ? 'Error al registrarse: ' + err.message : 'Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  const expand = (role) => {
    setExpanded(role)
    setIsRegister(false)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
  }

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
          <div className="hebrew text-2xl mb-3" style={{ color: t.subtitle }}>
            בְּחַר אֶת תַּפְקִידְךָ
          </div>
          <h1 className="text-4xl md:text-5xl font-light" style={{ letterSpacing: '-1.5px', color: t.title }}>
            ¿Cómo entras hoy?
          </h1>
          <p className="mt-3 text-sm" style={{ color: t.desc }}>
            Elige tu rol para acceder a tu espacio personalizado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 fade-up-2">
          <RoleCard id="teacher" label="Profesor" hebrew="מּוֹרֶה"
            description="Gestiona alumnos, clases, deberes y estadísticas"
            color="#f9b800" glow="rgba(249,184,0,0.25)" icon={TeacherIcon}
            expanded={expanded === 'teacher'} onExpand={() => expand('teacher')} t={t} isDark={isDark}>
            {expanded === 'teacher' && (
              <AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword}
                name={name} setName={setName} isRegister={isRegister} setIsRegister={setIsRegister}
                error={error} loading={loading} color="#f9b800" onSubmit={handleSubmit}
                onCancel={() => setExpanded(null)} t={t} />
            )}
          </RoleCard>

          <RoleCard id="student" label="Alumno" hebrew="תַּלְמִיד"
            description="Accede a tu perfil, deberes y estudio de la Perashá"
            color="#6c33e6" glow="rgba(108,51,230,0.25)" icon={StudentIcon}
            expanded={expanded === 'student'} onExpand={() => expand('student')} t={t} isDark={isDark}>
            {expanded === 'student' && (
              <AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword}
                name={name} setName={setName} isRegister={isRegister} setIsRegister={setIsRegister}
                error={error} loading={loading} color="#6c33e6" onSubmit={handleSubmit}
                onCancel={() => setExpanded(null)} t={t} />
            )}
          </RoleCard>

          <RoleCard id="guest" label="Invitado" hebrew="אוֹרֵחַ"
            description="Explora la plataforma sin necesidad de cuenta"
            color="#2dd4bf" glow="rgba(45,212,191,0.2)" icon={GuestIcon}
            expanded={false} onExpand={() => navigate('/guest/study')} t={t} isDark={isDark} />
        </div>

        <p className="text-center mt-10 text-xs fade-up-3" style={{ color: t.footer }}>
          Sistema de estudio de Torá · Kehilá
        </p>
      </div>
    </div>
  )
}

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

function AuthForm({ email, setEmail, password, setPassword, name, setName, isRegister, setIsRegister, error, loading, color, onSubmit, onCancel, t }) {
  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.inputText,
  }
  return (
    <form onSubmit={onSubmit} className="px-7 pb-7 flex flex-col gap-3">
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
