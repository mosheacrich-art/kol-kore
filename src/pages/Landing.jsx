import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LangToggle from '../components/LangToggle'
import Logo from '../components/Logo'
import { useLang } from '../context/LangContext'

const NAVY = '#1b2f6b'
const GOLD = '#c8941f'
const VERSE = ['בְּרֵאשִׁית', 'בָּרָא', 'אֱלֹהִים', 'אֵת', 'הַשָּׁמַיִם', 'וְאֵת', 'הָאָרֶץ']

const FEATURES = [
  ['feat1_title', 'feat1_desc'],
  ['feat2_title', 'feat2_desc'],
  ['feat3_title', 'feat3_desc'],
  ['feat4_title', 'feat4_desc'],
]
const STEPS = [
  ['step1_title', 'step1_desc'],
  ['step2_title', 'step2_desc'],
  ['step3_title', 'step3_desc'],
]

function SyncDemo() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % (VERSE.length + 1)), 650)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ border: `1px solid ${NAVY}`, borderRadius: 4, background: '#fff', boxShadow: `6px 6px 0 ${GOLD}`, maxWidth: 340, width: '100%', overflow: 'hidden', justifySelf: 'center' }}>
      <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <span className="eyebrow">Bereshit · 1:1</span>
        <span className="text-xs tabular-nums" style={{ color: '#6b7280' }}>0:0{Math.min(i, 9)}</span>
      </div>
      <p dir="rtl" className="hebrew px-4 py-4 text-xl leading-[1.7] flex flex-wrap justify-center gap-y-1" style={{ color: NAVY }}>
        {VERSE.map((w, k) => (
          <span key={k} role="button" tabIndex={0}
            onClick={() => setI(k)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setI(k)}
            style={{
            cursor: 'pointer',
            marginInlineStart: 8,
            padding: '0 3px',
            borderBottom: `3px solid ${k === i ? GOLD : 'transparent'}`,
            color: k < i ? '#9ca3af' : NAVY,
            transition: 'all .2s',
          }}>{w}</span>
        ))}
      </p>
      <div className="h-1" style={{ background: '#eef0f3' }}>
        <div style={{ height: '100%', width: `${(i / VERSE.length) * 100}%`, background: NAVY, transition: 'width .6s linear' }} />
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useLang()
  const go = () => navigate('/login')

  return (
    <div style={{ background: '#fff', color: '#111827', minHeight: '100svh' }}>
      {/* Masthead */}
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Logo size={30} />
        <div className="flex items-center gap-4">
          <LangToggle compact />
          <button onClick={go} className="btn-line text-sm px-4 py-2">{t('start_free')}</button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: 'url(/entrada-bg.webp)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.09 }} />
      <section className="relative max-w-6xl mx-auto px-6 pt-14 pb-20 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div>
          <p className="eyebrow mb-6">{t('landing_study_label')}</p>
          <h1 className="serif text-5xl sm:text-6xl lg:text-6xl leading-[1.02]" style={{ color: NAVY, fontWeight: 600 }}>
            Parashapp
          </h1>
          <p className="hebrew text-3xl mt-3" style={{ color: GOLD, textAlign: "left", direction: "ltr" }}>פָּרָשָׁה</p>
          <p className="mt-8 text-lg leading-relaxed max-w-md" style={{ color: '#374151' }}>{t('hero_tagline')}</p>
          <div className="mt-10 flex items-center gap-5">
            <button onClick={go} className="btn-navy px-7 py-3.5 text-sm">{t('start_free')}</button>
            <a href="#features" className="text-sm underline underline-offset-4" style={{ color: NAVY }}>{t('landing_features_title')} ↓</a>
          </div>
        </div>
        <SyncDemo />
      </section>
      </div>

      {/* Features: numbered ledger */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20" style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
          <div>
            <p className="eyebrow mb-4">{t('landing_features_eyebrow')}</p>
            <h2 className="serif text-4xl leading-tight" style={{ color: NAVY, fontWeight: 600 }}>{t('landing_features_title')}</h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#6b7280' }}>{t('landing_features_desc')}</p>
          </div>
          <ol>
            {FEATURES.map(([a, b], n) => (
              <li key={a} className="grid grid-cols-[48px_1fr] gap-4 py-7" style={{ borderTop: n ? '1px solid #e5e7eb' : 'none' }}>
                <span className="serif text-2xl" style={{ color: GOLD }}>0{n + 1}</span>
                <div>
                  <h3 className="serif text-2xl" style={{ color: NAVY, fontWeight: 600 }}>{t(a)}</h3>
                  <p className="mt-2 text-sm leading-relaxed max-w-xl" style={{ color: '#4b5563' }}>{t(b)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Steps + roles on navy band */}
      <section style={{ background: NAVY, color: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="eyebrow mb-4" style={{ color: '#e3b448' }}>{t('landing_steps_eyebrow')}</p>
          <h2 className="serif text-4xl mb-12" style={{ fontWeight: 600 }}>{t('landing_steps_title')}</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map(([a, b], n) => (
              <div key={a} style={{ borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 20 }}>
                <span className="serif text-sm" style={{ color: '#e3b448' }}>{n + 1} / 3</span>
                <h3 className="serif text-xl mt-3" style={{ fontWeight: 600 }}>{t(a)}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{t(b)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="eyebrow mb-4">{t('landing_roles_eyebrow')}</p>
        <h2 className="serif text-4xl mb-12" style={{ color: NAVY, fontWeight: 600 }}>{t('landing_roles_title')}</h2>
        <div className="grid md:grid-cols-2" style={{ border: '1px solid #e5e7eb', borderRadius: 4 }}>
          {['student', 'teacher'].map((r, n) => (
            <div key={r} className="p-8" style={{ borderInlineStart: n ? '1px solid #e5e7eb' : 'none' }}>
              <div className="flex items-baseline justify-between">
                <h3 className="serif text-2xl" style={{ color: NAVY, fontWeight: 600 }}>{t(`role_${r}_label`)}</h3>
                <span className="hebrew text-lg" style={{ color: GOLD }}>{r === 'student' ? 'תַּלְמִיד' : 'מוֹרֶה'}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {(t(`role_${r}_items`) || []).map(it => (
                  <li key={it} className="text-sm flex gap-3" style={{ color: '#374151' }}>
                    <span style={{ color: GOLD }}>—</span>{it}
                  </li>
                ))}
              </ul>
              <button onClick={go} className="mt-8 text-sm underline underline-offset-4" style={{ color: NAVY }}>{t(`role_${r}_cta`)}</button>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="py-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8" style={{ borderTop: `2px solid ${NAVY}` }}>
          <div>
            <p className="eyebrow mb-3">{t('landing_cta_eyebrow')}</p>
            <h2 className="serif text-4xl sm:text-5xl" style={{ color: NAVY, fontWeight: 600 }}>
              {t('landing_cta_title')} <span style={{ color: GOLD }}>{t('landing_study_label')}</span>
            </h2>
            <p className="mt-3 text-sm" style={{ color: '#6b7280' }}>{t('landing_cta_desc')}</p>
          </div>
          <button onClick={go} className="btn-navy px-8 py-4 text-sm self-start md:self-auto">{t('create_account_free')}</button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderTop: '1px solid #e5e7eb', color: '#6b7280' }}>
        <Logo size={20} word={false} />
        <span>{t('landing_footer_credits')}</span>
        <span className="flex gap-4">
          <button onClick={() => navigate('/privacy')}>{t('landing_footer_privacy')}</button>
          <button onClick={() => navigate('/terms')}>{t('landing_footer_terms')}</button>
        </span>
      </footer>
    </div>
  )
}
