import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, AudioLines, BookOpen, Check, Moon, Play, Star, Sun, Users } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LangToggle from '../components/LangToggle'
import { useLang } from '../context/LangContext'
import { Logo } from '../components/ui'
import { PARASHOT } from '../data/parashot'

const FEATURES = [
  { icon: BookOpen,   heb: 'כָּל הַתּוֹרָה', k: ['feat1_title', 'feat1_desc'] },
  { icon: AudioLines, heb: 'שִׁמְעוּ וּרְאוּ', k: ['feat2_title', 'feat2_desc'] },
  { icon: Users,      heb: 'רַב וְתַלְמִיד', k: ['feat3_title', 'feat3_desc'] },
  { icon: Star,       heb: 'בַּר מִצְוָה',   k: ['feat4_title', 'feat4_desc'] },
]

const STEPS = [
  { n: '01', k: ['step1_title', 'step1_desc'] },
  { n: '02', k: ['step2_title', 'step2_desc'] },
  { n: '03', k: ['step3_title', 'step3_desc'] },
]

const ROLES = [
  { heb: 'תַּלְמִיד', labelKey: 'role_student_label', itemsKey: 'role_student_items', ctaKey: 'role_student_cta', primary: false },
  { heb: 'מוֹרֶה',   labelKey: 'role_teacher_label', itemsKey: 'role_teacher_items', ctaKey: 'role_teacher_cta', primary: true },
]

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

function SectionHead({ eyebrow, title, desc }) {
  return (
    <FadeIn className="text-center max-w-2xl mx-auto mb-14">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-serif font-semibold text-ink tracking-[-0.02em]" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1 }}>{title}</h2>
      {desc && <p className="text-[16px] text-ink-3 mt-4 leading-relaxed">{desc}</p>}
    </FadeIn>
  )
}

/** Product preview built from real data only (names + aliyah refs). */
function HeroPreview() {
  const p = PARASHOT[0]
  const bars = [8, 14, 22, 12, 28, 18, 34, 20, 26, 12, 30, 16, 24, 10, 20, 28, 14, 22, 8, 18, 26, 12, 30, 16]
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[32px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(var(--gold-rgb),0.16), transparent 70%)' }} />
      <div className="relative card overflow-hidden shadow-modal">
        <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, var(--surface) 30%, var(--parchment) 100%)' }}>
          <p className="eyebrow mb-2">Parashá · 1</p>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-serif text-[30px] font-semibold text-ink leading-none">{p.name}</p>
            <p className="hebrew text-[32px] leading-none text-gold-ink" style={{ fontWeight: 400 }}>{p.heb}</p>
          </div>
          <p className="text-[13px] text-ink-3 mt-2" dir="ltr" style={{ textAlign: 'start' }}>{p.ref}</p>
        </div>
        <div className="px-4 py-3">
          {p.aliyot.slice(0, 4).map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5 rounded-xl" style={i === 0 ? { background: 'rgba(var(--accent-rgb),0.06)' } : undefined}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold bg-surface-2 text-ink-2">{a.n}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium text-ink">{a.label}</span>
                <span className="block text-[12px] text-ink-3" dir="ltr" style={{ textAlign: 'start' }}>{a.ref}</span>
              </span>
              {i === 0 && <span className="badge badge-accent h-5 text-[11px]">Audio</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}>
            <Play size={15} fill="currentColor" />
          </span>
          <div className="flex items-end gap-[3px] h-9 flex-1 overflow-hidden">
            {bars.map((h, i) => (
              <span key={i} className="flex-1 rounded-full" style={{ height: h, background: i < 9 ? 'rgb(var(--gold-rgb))' : 'var(--border-strong)' }} />
            ))}
          </div>
          <span className="text-[12px] text-ink-3 tabular-nums">0:42</span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()
  const { t: tl } = useLang()

  return (
    <div className="bg-canvas text-ink min-h-[100svh]">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-40 app-header"
        style={{ background: 'color-mix(in srgb, var(--bg) 86%, transparent)', backdropFilter: 'saturate(1.4) blur(14px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-16">
          <Logo size={32} />
          <nav className="hidden md:flex items-center gap-1 ms-6 text-[14px]" aria-label="Sections">
            <a href="#features" className="btn btn-ghost btn-sm">{tl('landing_features_eyebrow')}</a>
            <a href="#steps" className="btn btn-ghost btn-sm">{tl('landing_steps_eyebrow')}</a>
            <a href="#roles" className="btn btn-ghost btn-sm">{tl('landing_roles_eyebrow')}</a>
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <LangToggle />
            <button onClick={toggle} className="btn btn-ghost btn-icon" aria-label={isDark ? tl('light_mode') : tl('dark_mode')}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm ms-1">{tl('enter')}</button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-full pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 10%, rgba(var(--gold-rgb),0.10), transparent 70%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          <div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="eyebrow flex items-center gap-2 mb-6">
              <span>{tl('landing_study_label')}</span><span className="text-ink-4">·</span>
              <span className="hebrew-ui normal-case tracking-normal text-[14px]">לִמּוּד תּוֹרָה</span>
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif font-semibold text-ink tracking-[-0.03em]" style={{ fontSize: 'clamp(48px, 7vw, 84px)', lineHeight: 0.98 }}>
              Parashapp
              <span className="block mt-3" style={{ fontSize: '0.6em' }}><span className="hebrew text-gold-ink" style={{ fontWeight: 400, letterSpacing: 0 }}>פָּרָשָׁה</span></span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
              className="text-[18px] sm:text-[19px] text-ink-2 leading-relaxed mt-7 max-w-xl">
              {tl('hero_tagline')}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
              className="flex flex-wrap items-center gap-3 mt-9">
              <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg">
                {tl('start_free')}<ArrowRight size={17} className="rtl:rotate-180" />
              </button>
              <a href="#features" className="btn btn-secondary btn-lg">{tl('landing_features_eyebrow')}</a>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
            <HeroPreview />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-surface" style={{ borderBlock: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto">
          <SectionHead eyebrow={tl('landing_features_eyebrow')} title={tl('landing_features_title')} desc={tl('landing_features_desc')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <FadeIn key={i} delay={i * 0.06}>
                  <div className="h-full p-7 rounded-2xl bg-canvas" style={{ border: '1px solid var(--border-subtle)' }}>
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={i % 2 ? { background: 'rgba(var(--gold-rgb),0.12)', color: 'var(--text-gold)' } : { background: 'rgba(var(--accent-rgb),0.07)', color: 'rgb(var(--accent-rgb))' }}>
                      <Icon size={20} strokeWidth={1.7} />
                    </span>
                    <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                      <h3 className="font-serif text-[21px] font-semibold text-ink">{tl(f.k[0])}</h3>
                      <span className="hebrew-ui text-[15px] text-gold-ink">{f.heb}</span>
                    </div>
                    <p className="text-[15px] text-ink-3 leading-relaxed">{tl(f.k[1])}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="steps" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHead eyebrow={tl('landing_steps_eyebrow')} title={tl('landing_steps_title')} />
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <li className="h-full p-7 rounded-2xl bg-surface list-none" style={{ border: '1px solid var(--border)' }}>
                  <span className="font-serif text-[40px] font-semibold text-gold-ink leading-none">{s.n}</span>
                  <h3 className="text-[17px] font-semibold text-ink mt-5">{tl(s.k[0])}</h3>
                  <p className="text-[15px] text-ink-3 leading-relaxed mt-1.5">{tl(s.k[1])}</p>
                </li>
              </FadeIn>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" className="py-24 px-4 sm:px-6 bg-surface" style={{ borderBlock: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto">
          <SectionHead eyebrow={tl('landing_roles_eyebrow')} title={tl('landing_roles_title')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ROLES.map((r, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="h-full p-8 rounded-2xl flex flex-col bg-canvas"
                  style={{ border: `1px solid ${r.primary ? 'rgba(var(--gold-rgb),0.35)' : 'var(--border)'}` }}>
                  <div className="flex items-baseline gap-3 mb-6">
                    <h3 className="font-serif text-[28px] font-semibold text-ink">{tl(r.labelKey)}</h3>
                    <span className="hebrew-ui text-[18px] text-gold-ink">{r.heb}</span>
                  </div>
                  <ul className="flex flex-col gap-3 flex-1 mb-8">
                    {(tl(r.itemsKey) || []).map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-[15px] text-ink-2">
                        <Check size={17} strokeWidth={2.2} className="flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--gold-rgb))' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/login')} className={`btn btn-lg w-full ${r.primary ? 'btn-primary' : 'btn-secondary'}`}>
                    {tl(r.ctaKey)}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(var(--gold-rgb),0.10), transparent 70%)' }} />
        <FadeIn className="relative max-w-2xl mx-auto text-center">
          <p className="eyebrow mb-4">{tl('landing_cta_eyebrow')}</p>
          <h2 className="font-serif font-semibold text-ink tracking-[-0.02em]" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.08 }}>
            {tl('landing_cta_title')}
            <span className="block hebrew text-gold-ink mt-2" style={{ fontWeight: 400 }}>כָּאן וְעַכְשָׁו</span>
          </h2>
          <p className="text-[16px] text-ink-3 mt-5 max-w-md mx-auto">{tl('landing_cta_desc')}</p>
          <button onClick={() => navigate('/login')} className="btn btn-gold btn-lg mt-9 px-8">
            {tl('create_account_free')}<ArrowRight size={17} className="rtl:rotate-180" />
          </button>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-4 sm:px-6 py-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Logo size={26} />
          <p className="text-[13px] text-ink-3">{tl('landing_footer_credits')}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/privacy')} className="btn btn-ghost btn-sm text-ink-3">{tl('landing_footer_privacy')}</button>
            <button onClick={() => navigate('/terms')} className="btn btn-ghost btn-sm text-ink-3">{tl('landing_footer_terms')}</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
