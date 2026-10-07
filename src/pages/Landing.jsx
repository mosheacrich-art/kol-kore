import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, AudioLines, Users, CalendarHeart, ArrowRight, ChevronDown } from 'lucide-react'
import LangToggle from '../components/LangToggle'
import { LogoMark } from '../components/Logo'
import { useLang } from '../context/LangContext'

const NAVY = '#1b2f6b'
const NAVY_DEEP = '#121f4a'
const GOLD = '#c8941f'
const GOLD_SOFT = '#e3b448'
const IVORY = '#fbf8f1'
const DISPLAY = "'Playfair Display', Georgia, 'Times New Roman', serif"

const FEATURES = [
  [BookOpen, 'feat1_title', 'feat1_desc'],
  [AudioLines, 'feat2_title', 'feat2_desc'],
  [Users, 'feat3_title', 'feat3_desc'],
  [CalendarHeart, 'feat4_title', 'feat4_desc'],
]

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useLang()
  const go = () => navigate('/login')

  return (
    <div style={{ background: IVORY, color: '#1f2937' }}>
      {/* Entrance */}
      <section className="relative flex flex-col overflow-hidden" style={{ minHeight: '100svh' }}>
        {/* soft gold glow */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 42%, rgba(227,180,72,0.18), transparent 70%)' }} />
        {/* thin sefer-style frame */}
        <div aria-hidden className="absolute pointer-events-none hidden sm:block" style={{ inset: 20, border: '1px solid rgba(200,148,31,0.35)', borderRadius: 2 }} />

        <header className="relative z-10 flex items-center justify-end px-6 sm:px-12 pt-6 sm:pt-10">
          <LangToggle compact />
        </header>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          <motion.div {...rise(0)}>
            <LogoMark size={104} />
          </motion.div>

          <motion.h1 {...rise(0.12)} className="mt-7"
            style={{ fontFamily: DISPLAY, color: NAVY, fontWeight: 600, fontSize: 'clamp(3.25rem, 11vw, 6.5rem)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            Parashapp
          </motion.h1>

          <motion.div {...rise(0.22)} className="mt-6 flex items-center gap-4" style={{ color: GOLD }}>
            <span style={{ width: 40, height: 1, background: 'currentColor', opacity: 0.6 }} />
            <span className="hebrew" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', lineHeight: 1 }}>פָּרָשָׁה</span>
            <span style={{ width: 40, height: 1, background: 'currentColor', opacity: 0.6 }} />
          </motion.div>

          <motion.p {...rise(0.32)} className="mt-7 max-w-md text-base sm:text-lg leading-relaxed" style={{ color: '#4b5563' }}>
            {t('hero_tagline')}
          </motion.p>

          <motion.button {...rise(0.44)} onClick={go}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            className="mt-10 inline-flex items-center gap-3 px-12 py-4 text-base"
            style={{ background: NAVY, color: '#fff', fontWeight: 600, borderRadius: 999, boxShadow: '0 14px 34px -10px rgba(27,47,107,0.55)' }}>
            {t('enter')}
            <ArrowRight size={18} strokeWidth={2.2} />
          </motion.button>
        </div>

        <a href="#about" aria-label={t('landing_features_title')}
          className="relative z-10 mx-auto mb-8" style={{ color: NAVY, opacity: 0.5 }}>
          <ChevronDown size={24} className="animate-bounce" />
        </a>
      </section>

      {/* What we do */}
      <section id="about" style={{ background: '#fff' }}>
        <div className="max-w-5xl mx-auto px-6 py-24 sm:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="eyebrow mb-4">{t('landing_study_label')}</p>
            <h2 style={{ fontFamily: DISPLAY, color: NAVY, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1 }}>
              {t('landing_features_title')}
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: '#6b7280' }}>{t('landing_features_desc')}</p>
          </div>

          <div className="mt-16 grid sm:grid-cols-2 gap-5">
            {FEATURES.map(([Icon, a, b]) => (
              <div key={a} className="p-7 sm:p-8 transition-shadow hover:shadow-lg"
                style={{ background: IVORY, borderRadius: 18, border: '1px solid #efe7d6' }}>
                <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 14, background: NAVY, color: GOLD_SOFT }}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <h3 className="mt-5" style={{ fontFamily: DISPLAY, color: NAVY, fontWeight: 600, fontSize: 22 }}>{t(a)}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: '#4b5563' }}>{t(b)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, color: '#fff' }}>
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 0%, rgba(227,180,72,0.18), transparent 70%)' }} />
        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', lineHeight: 1.15 }}>
            {t('landing_cta_title')} <em style={{ color: GOLD_SOFT, fontWeight: 500 }}>{t('landing_study_label')}</em>
          </h2>
          <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.72)' }}>{t('landing_cta_desc')}</p>
          <button onClick={go} className="mt-9 inline-flex items-center gap-3 px-12 py-4 text-base transition-transform hover:-translate-y-0.5"
            style={{ background: GOLD_SOFT, color: NAVY_DEEP, fontWeight: 700, borderRadius: 999, boxShadow: '0 14px 34px -12px rgba(227,180,72,0.6)' }}>
            {t('enter')}
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>
        </div>
      </section>

      <footer style={{ background: NAVY_DEEP, color: 'rgba(255,255,255,0.55)' }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span>{t('landing_footer_credits')}</span>
          <span className="flex gap-5">
            <button className="hover:text-white" onClick={() => navigate('/privacy')}>{t('landing_footer_privacy')}</button>
            <button className="hover:text-white" onClick={() => navigate('/terms')}>{t('landing_footer_terms')}</button>
          </span>
        </div>
      </footer>
    </div>
  )
}
