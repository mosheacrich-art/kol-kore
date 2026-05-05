import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { motion, useInView } from 'framer-motion'
import LangToggle from '../components/LangToggle'

const STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.4,
  duration: Math.random() * 5 + 2,
  delay: Math.random() * 6,
}))

const FEATURES = [
  {
    icon: BookIcon,
    title: 'Texto completo',
    heb: 'כָּל הַתּוֹרָה',
    desc: 'Las 54 perashiot con texto de Sefaria — taamim, nikkud o llano. Modo Sefer con diseño de Tikkun real.',
    color: '#6c33e6',
  },
  {
    icon: WaveIcon,
    title: 'Audio sincronizado',
    heb: 'שִׁמְעוּ וּרְאוּ',
    desc: 'Cada palabra se ilumina al ritmo del audio gracias a Whisper. Graba tu lectura y escúchala en cualquier momento.',
    color: '#2dd4bf',
  },
  {
    icon: LinkIcon,
    title: 'Maestro y alumno',
    heb: 'רַב וְתַלְמִיד',
    desc: 'El profesor sube audios por aliyá, asigna deberes y recibe notificaciones en tiempo real de la actividad del alumno.',
    color: '#f9b800',
  },
  {
    icon: StarIcon,
    title: 'Bar Mitzvá',
    heb: 'בַּר מִצְוָה',
    desc: 'Calculadora de fecha hebrea, perashá asignada y seguimiento de progreso semana a semana.',
    color: '#f87171',
  },
]

const STEPS = [
  { n: '01', title: 'Crea tu cuenta', desc: 'Regístrate como alumno o profesor en segundos.', color: '#6c33e6' },
  { n: '02', title: 'Conecta con tu rav', desc: 'Usa el código único del profesor para vincularte.', color: '#2dd4bf' },
  { n: '03', title: 'Estudia y progresa', desc: 'Lee, escucha, graba y sigue tu avance en tiempo real.', color: '#f9b800' },
]

const ROLES = [
  {
    role: 'Alumno',
    heb: 'תַּלְמִיד',
    color: '#6c33e6',
    bg: 'rgba(108,51,230,0.08)',
    border: 'rgba(108,51,230,0.2)',
    items: [
      'Accede a las 54 perashiot completas',
      'Sigue las palabras con el audio',
      'Graba tu lectura y envíala al profesor',
      'Consulta tus deberes y progreso',
      'Calcula tu fecha de Bar Mitzvá',
    ],
    cta: 'Soy alumno →',
  },
  {
    role: 'Profesor',
    heb: 'מוֹרֶה',
    color: '#f9b800',
    bg: 'rgba(249,184,0,0.08)',
    border: 'rgba(249,184,0,0.2)',
    items: [
      'Sube audios por aliyá con sincronización',
      'Gestiona todos tus alumnos',
      'Asigna deberes y controla el estado',
      'Recibe notificaciones de actividad',
      'Dashboard con métricas de estudio',
    ],
    cta: 'Soy profesor →',
  },
]

const PARASHOT_TICKER = [
  'בְּרֵאשִׁית', 'נֹחַ', 'לֶךְ לְךָ', 'וַיֵּרָא', 'חַיֵּי שָׂרָה',
  'תּוֹלְדוֹת', 'וַיֵּצֵא', 'וַיִּשְׁלַח', 'וַיֵּשֶׁב', 'מִקֵּץ',
  'וַיִּגַּשׁ', 'וַיְחִי', 'שְׁמוֹת', 'וָאֵרָא', 'בֹּא', 'בְּשַׁלַּח',
  'יִתְרוֹ', 'מִשְׁפָּטִים', 'תְּרוּמָה', 'תְּצַוֶּה', 'כִּי תִשָּׂא',
]

function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const variants = {
    hidden: { opacity: 0, y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0, x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0 },
    visible: { opacity: 1, y: 0, x: 0 },
  }
  return (
    <motion.div ref={ref} className={className}
      variants={variants} initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const { isDark: globalIsDark } = useTheme()
  const [isDark, setIsDark] = useState(false)
  const toggle = () => setIsDark(d => !d)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    return () => { document.documentElement.classList.toggle('dark', globalIsDark) }
  }, [globalIsDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    let frame = 0, animId
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.3, a: Math.random(),
    }))
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        const pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * 0.018 + p.a * 10))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? `rgba(255,202,40,${pulse * 0.5})` : `rgba(140,95,0,${pulse * 0.28})`
        ctx.fill()
      })
      frame++
      animId = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [isDark])

  const t = {
    heroBg: isDark
      ? 'radial-gradient(ellipse at 25% 15%, #1e0f45 0%, #0d0b1e 45%, #050812 100%)'
      : 'radial-gradient(ellipse at 25% 15%, #e8dfc8 0%, #f5f0e4 50%, #ece4cc 100%)',
    sectionBg: isDark ? '#07060f' : '#faf7f0',
    altBg: isDark ? '#0d0b1e' : '#f5f0e4',
    text: isDark ? 'rgba(240,239,255,0.92)' : '#1a1200',
    text2: isDark ? 'rgba(200,190,255,0.65)' : 'rgba(60,40,0,0.55)',
    gold: isDark ? 'rgba(255,202,40,0.85)' : 'rgba(140,95,0,0.9)',
    goldSubtle: isDark ? 'rgba(255,202,40,0.5)' : 'rgba(140,95,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    card: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
    toggleBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    toggleBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    toggleText: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(60,40,0,0.55)',
    bottomGrad: isDark ? 'rgba(5,8,18,0.9)' : 'rgba(245,240,228,0.9)',
  }

  return (
    <div style={{ background: t.sectionBg, color: t.text }}>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: t.heroBg, transition: 'background 0.4s' }}>

        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.9 }} />

        {STARS.map(s => (
          <div key={s.id} className="star absolute pointer-events-none"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              background: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(140,95,0,0.22)',
              borderRadius: '50%',
              '--duration': `${s.duration}s`, '--delay': `${s.delay}s`,
            }} />
        ))}

        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(108,51,230,0.14)' : 'rgba(108,51,230,0.07)'} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(249,184,0,0.09)' : 'rgba(249,184,0,0.12)'} 0%, transparent 70%)`, filter: 'blur(50px)' }} />

        {/* Theme + lang toggles */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
          <div style={{ background: t.toggleBg, border: `1px solid ${t.toggleBorder}`, borderRadius: '999px', backdropFilter: 'blur(10px)', padding: '4px' }}>
            <LangToggle compact />
          </div>
          <button onClick={toggle}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-full transition-all"
            style={{ background: t.toggleBg, border: `1px solid ${t.toggleBorder}`, color: t.toggleText, backdropFilter: 'blur(10px)' }}>
            <span style={{ fontSize: '13px' }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="mb-10 animate-float">
            <HexStar isDark={isDark} />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-xs tracking-[0.4em] uppercase mb-5 font-medium"
            style={{ color: t.goldSubtle }}>
            Estudio de Torá · לִמּוּד תּוֹרָה
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif leading-none mb-3"
            style={{ fontSize: 'clamp(64px, 12vw, 120px)', color: t.text, letterSpacing: '-3px', transition: 'color 0.4s' }}>
            Perashá
          </motion.h1>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="hebrew font-light mb-10"
            style={{ fontSize: 'clamp(32px, 6vw, 56px)', color: t.gold }}>
            פָּרָשָׁה
          </motion.h2>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-lg md:text-xl font-light max-w-xl leading-relaxed mb-12"
            style={{ color: t.text2 }}>
            La plataforma para estudiar Torah, preparar tu bar mitzvá y conectar con tu maestro —
            palabra a palabra.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 items-center">
            <button className="btn-gold px-10 py-4 rounded-full text-sm font-semibold"
              onClick={() => navigate('/login')}>
              Comenzar gratis
            </button>
          </motion.div>

          {/* Ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-2 max-w-2xl">
            {PARASHOT_TICKER.map((p, i) => (
              <span key={i} className="hebrew text-xs px-3 py-1.5 rounded-full"
                style={{
                  color: t.goldSubtle,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(140,95,0,0.07)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(140,95,0,0.12)'}`,
                }}>
                {p}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${t.bottomGrad}, transparent)` }} />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
          <div className="w-px h-10" style={{ background: `linear-gradient(to bottom, ${t.goldSubtle}, transparent)` }} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-28 px-6" style={{ background: t.sectionBg }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-xs tracking-[0.35em] uppercase font-medium mb-3" style={{ color: t.goldSubtle }}>
              Todo lo que necesitas
            </p>
            <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ color: t.text, letterSpacing: '-1px' }}>
              Diseñado para el estudio real
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: t.text2 }}>
              No es solo un visor de texto. Es una plataforma completa de aprendizaje.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <FadeIn key={i} delay={i * 0.1} direction={i % 2 === 0 ? 'left' : 'right'}>
                  <div className="p-7 rounded-2xl h-full transition-all duration-300 group"
                    style={{
                      background: t.card,
                      border: `1px solid ${t.border}`,
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = f.color + '45'
                      e.currentTarget.style.background = isDark ? f.color + '10' : f.color + '08'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = t.border
                      e.currentTarget.style.background = t.card
                    }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: f.color + '18', border: `1px solid ${f.color}25` }}>
                      <Icon color={f.color} />
                    </div>
                    <div className="flex items-baseline gap-3 mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: t.text }}>{f.title}</h3>
                      <span className="hebrew text-sm" style={{ color: f.color }}>{f.heb}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: t.text2 }}>{f.desc}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 px-6" style={{ background: t.altBg }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-xs tracking-[0.35em] uppercase font-medium mb-3" style={{ color: t.goldSubtle }}>
              Tres pasos
            </p>
            <h2 className="text-3xl md:text-4xl font-light" style={{ color: t.text, letterSpacing: '-1px' }}>
              Empieza en minutos
            </h2>
          </FadeIn>

          <div className="flex flex-col md:flex-row gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[calc(16.6%+20px)] right-[calc(16.6%+20px)] h-px"
              style={{ background: `linear-gradient(to right, #6c33e6, #2dd4bf, #f9b800)`, opacity: 0.3 }} />

            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.15} className="flex-1">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 relative"
                    style={{ background: s.color + '18', border: `2px solid ${s.color}30` }}>
                    <span className="text-xl font-bold" style={{ color: s.color }}>{s.n}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: t.text }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: t.text2 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="py-28 px-6" style={{ background: t.sectionBg }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-xs tracking-[0.35em] uppercase font-medium mb-3" style={{ color: t.goldSubtle }}>
              Para cada rol
            </p>
            <h2 className="text-3xl md:text-4xl font-light" style={{ color: t.text, letterSpacing: '-1px' }}>
              Hecho a medida para ti
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES.map((r, i) => (
              <FadeIn key={i} delay={i * 0.15} direction={i === 0 ? 'left' : 'right'}>
                <div className="p-8 rounded-2xl h-full flex flex-col"
                  style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                  <div className="flex items-baseline gap-3 mb-6">
                    <h3 className="text-2xl font-semibold" style={{ color: r.color }}>{r.role}</h3>
                    <span className="hebrew text-lg" style={{ color: r.color + 'aa' }}>{r.heb}</span>
                  </div>
                  <ul className="flex flex-col gap-3 flex-1 mb-8">
                    {r.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm" style={{ color: t.text2 }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: r.color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                    style={{ background: r.color + '20', color: r.color, border: `1px solid ${r.color}30` }}
                    onMouseEnter={e => { e.currentTarget.style.background = r.color + '30' }}
                    onMouseLeave={e => { e.currentTarget.style.background = r.color + '20' }}>
                    {r.cta}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-6 relative overflow-hidden"
        style={{ background: isDark ? '#0d0b1e' : '#f0e8d4' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 50%, ${isDark ? 'rgba(108,51,230,0.18)' : 'rgba(108,51,230,0.08)'} 0%, transparent 65%)`, filter: 'blur(40px)' }} />

        <FadeIn className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center animate-float">
            <HexStar isDark={isDark} size={56} />
          </div>
          <p className="text-xs tracking-[0.35em] uppercase font-medium mb-4" style={{ color: t.goldSubtle }}>
            Empieza hoy
          </p>
          <h2 className="text-3xl md:text-5xl font-light mb-5" style={{ color: t.text, letterSpacing: '-1.5px' }}>
            Tu estudio de Torah,<br />
            <span className="hebrew" style={{ color: t.gold }}>כָּאן וְעַכְשָׁו</span>
          </h2>
          <p className="text-base mb-10 max-w-sm mx-auto" style={{ color: t.text2 }}>
            Gratuito. Sin tarjeta de crédito. Empieza a estudiar en menos de un minuto.
          </p>
          <button className="btn-gold px-12 py-4 rounded-full text-base font-semibold"
            onClick={() => navigate('/login')}>
            Crear cuenta gratis
          </button>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <div className="py-6 px-6 flex items-center justify-between flex-wrap gap-3"
        style={{ borderTop: `1px solid ${t.border}`, background: t.sectionBg }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: t.text }}>Perashá</span>
          <span className="hebrew text-sm" style={{ color: t.goldSubtle }}>פָּרָשָׁה</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-xs" style={{ color: t.text2 }}>
            Texto de <a href="https://sefaria.org" target="_blank" rel="noreferrer"
              style={{ color: '#6c33e6', textDecoration: 'none' }}>Sefaria</a> ·
            Audio por OpenAI Whisper · Tikkun por tikkun.io
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/privacy')}
              className="text-xs transition-all" style={{ color: t.text2 }}
              onMouseEnter={e => e.target.style.color = '#6c33e6'}
              onMouseLeave={e => e.target.style.color = t.text2}>
              Privacidad
            </button>
            <span style={{ color: t.border }}>·</span>
            <button onClick={() => navigate('/terms')}
              className="text-xs transition-all" style={{ color: t.text2 }}
              onMouseEnter={e => e.target.style.color = '#6c33e6'}
              onMouseLeave={e => e.target.style.color = t.text2}>
              Términos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Icons ── */
function HexStar({ isDark, size = 72 }) {
  const stroke = isDark ? 'rgba(255,202,40,0.55)' : 'rgba(140,95,0,0.5)'
  const fill = isDark ? 'rgba(255,202,40,0.85)' : 'rgba(140,95,0,0.75)'
  const r1 = isDark ? 'rgba(255,202,40,0.14)' : 'rgba(140,95,0,0.1)'
  const r2 = isDark ? 'rgba(255,202,40,0.07)' : 'rgba(140,95,0,0.05)'
  const halo = isDark ? 'rgba(255,202,40,0.28)' : 'rgba(140,95,0,0.2)'
  const s = size, c = s / 2
  return (
    <svg width={s} height={s} viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="35" stroke={r1} strokeWidth="1" />
      <circle cx="36" cy="36" r="27" stroke={r2} strokeWidth="1" />
      <polygon points="36,12 44,26 52,26 44,36 52,46 36,40 20,46 28,36 20,26 28,26"
        fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="36,60 28,46 20,46 28,36 20,26 36,32 52,26 44,36 52,46 44,46"
        fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="36" cy="36" r="3" fill={fill} />
      <circle cx="36" cy="36" r="6" stroke={halo} strokeWidth="1" fill="none" />
    </svg>
  )
}

function BookIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 3h5l2 2h5v12H4V3z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M7 10h6M7 13h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function WaveIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2 10c1.5-4 3-4 4.5 0s3 4 4.5 0 3-4 4.5 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LinkIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="6" cy="10" r="3" stroke={color} strokeWidth="1.4"/>
      <circle cx="14" cy="6" r="2.5" stroke={color} strokeWidth="1.4"/>
      <circle cx="14" cy="14" r="2.5" stroke={color} strokeWidth="1.4"/>
      <path d="M9 10h2M9 8l3-1.5M9 12l3 1.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function StarIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <polygon points="10,3 12,8 17,8 13,11 15,16 10,13 5,16 7,11 3,8 8,8"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}
