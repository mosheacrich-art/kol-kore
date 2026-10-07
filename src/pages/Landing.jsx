import { useNavigate } from 'react-router-dom'
import LangToggle from '../components/LangToggle'
import { LogoMark } from '../components/Logo'
import { useLang } from '../context/LangContext'

const NAVY = '#1b2f6b'
const GOLD = '#c8941f'

const FEATURES = [
  ['feat1_title', 'feat1_desc'],
  ['feat2_title', 'feat2_desc'],
  ['feat3_title', 'feat3_desc'],
  ['feat4_title', 'feat4_desc'],
]

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useLang()
  const go = () => navigate('/login')

  return (
    <div style={{ background: '#fff', color: '#111827' }}>
      {/* Full-screen entrance */}
      <section className="relative flex flex-col items-center justify-between text-center" style={{ minHeight: '100svh', background: '#faf7f0' }}>
        <div className="w-full flex justify-end px-6 pt-5">
          <LangToggle compact />
        </div>

        <div className="flex flex-col items-center px-6">
          <LogoMark size={84} />
          <h1 className="serif mt-6" style={{ color: NAVY, fontSize: 'clamp(3rem, 12vw, 7rem)', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em' }}>
            Parashapp
          </h1>
          <div className="mt-5" style={{ width: 56, height: 3, background: GOLD, borderRadius: 2 }} />
          <p className="hebrew mt-5" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: GOLD }}>פָּרָשָׁה</p>
        </div>

        <div className="flex flex-col items-center gap-6 px-6 pb-10">
          <button onClick={go} className="btn-navy px-16 py-4 text-base" style={{ borderRadius: 999, boxShadow: '0 8px 24px rgba(27,47,107,0.25)' }}>
            {t('enter')}
          </button>
          <a href="#about" aria-label={t('landing_features_title')} style={{ color: NAVY, opacity: 0.6, fontSize: 22 }}>↓</a>
        </div>
      </section>

      {/* What we do */}
      <section id="about" className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="eyebrow mb-4">{t('landing_study_label')}</p>
        <h2 className="serif text-3xl sm:text-4xl" style={{ color: NAVY }}>{t('landing_features_title')}</h2>
        <p className="mt-4 text-base leading-relaxed max-w-xl mx-auto" style={{ color: '#4b5563' }}>{t('hero_tagline')}</p>
        <div className="mt-14 grid sm:grid-cols-2 gap-x-12 gap-y-10 text-left">
          {FEATURES.map(([a, b]) => (
            <div key={a}>
              <h3 className="serif text-xl" style={{ color: NAVY }}>{t(a)}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: '#4b5563' }}>{t(b)}</p>
            </div>
          ))}
        </div>
        <button onClick={go} className="btn-navy px-10 py-3.5 text-sm mt-14">{t('enter')}</button>
      </section>

      <footer className="max-w-4xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderTop: '1px solid #e5e7eb', color: '#6b7280' }}>
        <span>{t('landing_footer_credits')}</span>
        <span className="flex gap-4">
          <button onClick={() => navigate('/privacy')}>{t('landing_footer_privacy')}</button>
          <button onClick={() => navigate('/terms')}>{t('landing_footer_terms')}</button>
        </span>
      </footer>
    </div>
  )
}
