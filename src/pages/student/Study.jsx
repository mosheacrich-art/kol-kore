import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { PARASHOT, ALL_PARASHOT, COMBINED_PARASHOT, SEFARIM_LIST, BOOK_COLORS } from '../../data/parashot'
import { MOADIM_LIST, ALL_MOADIM } from '../../data/moadim'
import { useAudio } from '../../context/AudioContext'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import ParashaReader from '../../components/ParashaReader'
import { BERAJOT_INLINE } from '../../hooks/useSefaria'

const TAAMIM = {
  id: 'taamim',
  name: 'Taamim',
  heb: 'טַעֲמֵי הַמִּקְרָא',
  color: '#1b2f6b',
  availableModes: ['taamim'],
  aliyot: [{
    n: 1,
    label: 'טַעֲמֵי הַמִּקְרָא',
    heText: [
      'מֻנַּח֣ פַּשְׁטָא֙ מֻנַּח֣ זַרְקָא֘ מֻנַּח֣ סֶגּוֹל֒ מֻנַּח֣',
      'מֻנַּח֣ רְבִיעִי֗ מַהְפַּךְ֤ פַּשְׁטָא֙ זָקֵף֔-קָטֹן',
      'זָקֵף֕-גָּדוֹל מֶרְכָּא֥ טִפְחָא֖ מֻנַּח֣ אֶתְנַחְתָּא֑',
      'פָּזֵר֡ תְּלִישָׁא֩-קְטַנָּה תְּ֠לִישָׁא-גְּדוֹלָה קַדְמָא֨-וְאַזְלָא֜',
      'אַזְלָא֜-גֵּרֵשׁ֜ גֵּרְשַׁיִם֞ דַּרְגָּא֧ תְּבִיר֛',
      'יְ֚תִיב פָּסִיק ׀ סוֹף-פָּסוּק׃',
    ],
  }],
}

export default function StudentStudy({ basePath = '/student/study' }) {
  const { parashaId } = useParams()
  const { profile } = useAuth()
  const parasha = parashaId === 'taamim'
    ? TAAMIM
    : parashaId?.startsWith('berajot--')
      ? (() => {
          const key = parashaId.replace('berajot--', 'berajot:')
          const data = BERAJOT_INLINE[key]
          if (!data) return null
          return { id: parashaId, name: data.name, heb: data.heTitle, color: '#1b2f6b', aliyot: data.aliyot }
        })()
      : parashaId
        ? (ALL_PARASHOT.find(p => p.id === parashaId) || ALL_MOADIM.find(p => p.id === parashaId))
        : null

  if (parasha) return <ReaderView parasha={parasha} basePath={basePath} />
  return <ListView basePath={basePath} />
}

function ListView({ basePath }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [openBook, setOpenBook] = useState('bereshit')
  const { hasAny } = useAudio()

  const filtered = useMemo(() => {
    if (!search) return ALL_PARASHOT
    const q = search.toLowerCase()
    return ALL_PARASHOT.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.heb.includes(search) ||
      p.book.includes(q)
    )
  }, [search])

  const byBook = useMemo(() => {
    return SEFARIM_LIST.map(s => ({
      ...s,
      parashot: filtered.filter(p => p.book === s.id),
    })).filter(s => s.parashot.length > 0)
  }, [filtered])

  const filteredMoadim = useMemo(() => {
    if (!search) return ALL_MOADIM
    const q = search.toLowerCase()
    return ALL_MOADIM.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.heb.includes(search)
    )
  }, [search])

  const byChag = useMemo(() => {
    return MOADIM_LIST.map(m => ({
      ...m,
      readings: filteredMoadim.filter(p => p.chag === m.id),
    })).filter(m => m.readings.length > 0)
  }, [filteredMoadim])

  const [picked, setPicked] = useState(null)
  const openParasha = (p) => {
    if (p.aliyot?.length > 1) setPicked(p)
    else navigate(`${basePath}/${p.id}`)
  }

  const [openChag, setOpenChag] = useState(null)
  const [openBerajot, setOpenBerajot] = useState(false)

  const cardDefault = isDark
    ? { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)' }
    : { bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.07)' }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          לִמּוּד תּוֹרָה · Estudio
        </p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          {t('study_title')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          {t('study_subtitle')}
        </p>
      </div>

      <div className="relative mb-7 fade-up-2">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4" stroke="var(--text-3)" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12 12" stroke="var(--text-3)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('search_parasha')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }} />
      </div>

      <div className="flex flex-col gap-2.5 fade-up-3">
        {/* ── Berajot ── */}
        {!search && (
          <div className="rounded-2xl overflow-hidden mb-1 transition-all"
            style={{ border: `1px solid ${openBerajot ? 'rgba(27,47,107,0.3)' : 'var(--border)'}` }}>
            <button onClick={() => setOpenBerajot(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              style={{ background: openBerajot ? 'rgba(27,47,107,0.06)' : 'var(--bg-card)' }}>
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 flex-shrink-0" style={{ background: '#1b2f6b' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>Berajot</span>
                    <span className="hebrew text-sm" style={{ color: '#1b2f6b' }}>בְּרָכוֹת</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('berajot_sections').replace('{n}', Object.keys(BERAJOT_INLINE).length)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-sm"
                  style={{ background: 'rgba(27,47,107,0.15)', color: '#1b2f6b', border: '1px solid rgba(27,47,107,0.2)' }}>
                  {Object.keys(BERAJOT_INLINE).length}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ transform: openBerajot ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: 'var(--text-muted)' }}>
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            {openBerajot && (
              <div className="px-4 pb-3 pt-1" style={{ background: 'var(--bg-card)' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                  {Object.entries(BERAJOT_INLINE).map(([key, data]) => {
                    const studyId = key.replace('berajot:', 'berajot--')
                    return (
                      <button key={key} onClick={() => navigate(`${basePath}/${studyId}`)}
                        className="text-left p-3 rounded-xl transition-all duration-200"
                        style={{ background: 'rgba(27,47,107,0.04)', border: '1px solid rgba(27,47,107,0.12)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,47,107,0.1)'; e.currentTarget.style.borderColor = 'rgba(27,47,107,0.28)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(27,47,107,0.04)'; e.currentTarget.style.borderColor = 'rgba(27,47,107,0.12)' }}>
                        <div className="hebrew text-sm mb-1 leading-tight" style={{ color: '#1b2f6b' }}>{data.heTitle}</div>
                        <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{data.name}</div>
                        <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 4h6M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {data.aliyot.length} secciones
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Taamim card — before Bereshit */}
        {!search && (
          <button onClick={() => navigate(`${basePath}/taamim`)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-200 mb-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(27,47,107,0.3)'; e.currentTarget.style.background = 'rgba(27,47,107,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-card)' }}>
            <div className="w-1 h-10 flex-shrink-0" style={{ background: '#1b2f6b' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>Taamim</span>
                <span className="hebrew text-sm" style={{ color: '#1b2f6b' }}>טַעֲמֵי הַמִּקְרָא</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>סִימָנִים · {t('trop_subtitle')}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {byBook.map(book => {
          const isOpen = openBook === book.id || !!search
          const color = BOOK_COLORS[book.id] || '#1b2f6b'
          return (
            <div key={book.id} className="rounded-2xl overflow-hidden transition-all"
              style={{ border: `1px solid ${isOpen ? color + '30' : 'var(--border)'}` }}>
              <button onClick={() => !search && setOpenBook(isOpen ? null : book.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                style={{ background: isOpen ? `${color}0d` : 'var(--bg-card)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 flex-shrink-0" style={{ background: color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{book.name}</span>
                      <span className="hebrew text-sm" style={{ color }}>{book.heb}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{book.en} · {book.parashot.length} perashiot</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-sm"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}20` }}>
                    {book.parashot.length}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: 'var(--text-muted)' }}>
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pt-1" style={{ background: 'var(--bg-card)' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                    {book.parashot.map(p => {
                      const hasAudio = hasAny(p.id)
                      return (
                        <button key={p.id} onClick={() => openParasha(p)}
                          className="text-left p-3 rounded-xl transition-all duration-200 group relative"
                          style={{ background: cardDefault.bg, border: `1px solid ${cardDefault.border}` }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = `${color}12`
                            e.currentTarget.style.borderColor = `${color}30`
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = cardDefault.bg
                            e.currentTarget.style.borderColor = cardDefault.border
                          }}>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="hebrew text-sm" style={{ color }}>{p.heb}</span>
                            <div className="flex items-center gap-1">
                              {hasAudio && (
                                <span title="Audio disponible">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 3.5v3L5 8V2L2 3.5z" fill="#1b2f6b"/>
                                    <path d="M7 3.5c.6.4 1 1.1 1 1.5s-.4 1.1-1 1.5" stroke="#1b2f6b" strokeWidth="0.8" strokeLinecap="round"/>
                                  </svg>
                                </span>
                              )}
                              {p.combined
                                ? <span className="text-xs px-1.5 py-0.5 rounded-sm font-medium"
                                    style={{ background: `${color}20`, color, fontSize: '9px' }}>{t('double_label')}</span>
                                : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.num}</span>
                              }
                            </div>
                          </div>
                          <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{p.name}</div>
                          <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4h6M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('read_parasha')}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Moadim / Perashiot especiales ────────────────────────────────── */}
      {byChag.length > 0 && (
        <div className="mt-6 fade-up-3">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-gold)' }}>
              מוֹעֲדִים · Perashiot especiales
            </p>
            <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
          </div>
          <div className="flex flex-col gap-2.5">
            {byChag.map(chag => {
              const isOpen = openChag === chag.id || !!search
              return (
                <div key={chag.id} className="rounded-2xl overflow-hidden transition-all"
                  style={{ border: `1px solid ${isOpen ? chag.color + '30' : 'var(--border)'}` }}>
                  <button onClick={() => !search && setOpenChag(isOpen ? null : chag.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    style={{ background: isOpen ? `${chag.color}0d` : 'var(--bg-card)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-10 flex-shrink-0" style={{ background: chag.color }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{chag.name}</span>
                          <span className="hebrew text-sm" style={{ color: chag.color }}>{chag.heb}</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{chag.readings.length} lecturas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-sm"
                        style={{ background: `${chag.color}15`, color: chag.color, border: `1px solid ${chag.color}20` }}>
                        {chag.readings.length}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: 'var(--text-muted)' }}>
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3 pt-1" style={{ background: 'var(--bg-card)' }}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                        {chag.readings.map(p => (
                          <button key={p.id} onClick={() => openParasha(p)}
                            className="text-left p-3 rounded-xl transition-all duration-200"
                            style={{ background: cardDefault.bg, border: `1px solid ${cardDefault.border}` }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = `${chag.color}12`
                              e.currentTarget.style.borderColor = `${chag.color}30`
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = cardDefault.bg
                              e.currentTarget.style.borderColor = cardDefault.border
                            }}>
                            <div className="hebrew text-sm mb-1" style={{ color: chag.color }}>{p.heb}</div>
                            <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{p.name}</div>
                            <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1 4h6M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              {p.aliyot.length} aliyot
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {picked && (
        <div className="fixed inset-0 z-[200]" onClick={() => setPicked(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(17,24,39,0.35)' }} />
          <aside onClick={e => e.stopPropagation()}
            className="absolute top-0 right-0 h-full w-full max-w-sm flex flex-col"
            style={{ background: '#fff', borderLeft: '1px solid var(--border)', boxShadow: '-12px 0 32px rgba(17,24,39,0.12)' }}>
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <p className="eyebrow mb-2">{picked.heb}</p>
                <h2 className="text-2xl">{picked.name}</h2>
                {picked.ref && <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{picked.ref}</p>}
              </div>
              <button onClick={() => setPicked(null)} aria-label="Cerrar" className="text-xl leading-none px-2" style={{ color: '#6b7280' }}>×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              {picked.aliyot.map((a, i) => (
                <button key={i} onClick={() => navigate(`${basePath}/${picked.id}?aliyah=${i}`)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3.5 text-left rounded transition-colors hover:bg-[#f6f7f9]"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>
                    <span className="block text-sm font-medium" style={{ color: '#1b2f6b' }}>{a.label || (a.n === 8 ? 'Maftir' : `${a.n}ª Aliyá`)}</span>
                    {a.ref && <span className="block text-xs mt-0.5" style={{ color: '#6b7280' }}>{a.ref}</span>}
                  </span>
                  <span style={{ color: '#c8941f' }}>→</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function ReaderView({ parasha, basePath }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const [searchParams] = useSearchParams()
  const [isMobileUI, setIsMobileUI] = useState(Capacitor.isNativePlatform())
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      const check = () => setIsMobileUI(window.innerWidth < 768)
      check()
      window.addEventListener('resize', check)
      return () => window.removeEventListener('resize', check)
    }
  }, [])
  const initialAliyah = Math.min(
    Math.max(0, parseInt(searchParams.get('aliyah') || '0', 10)),
    parasha.aliyot.length - 1
  )
  const color = parasha.color || BOOK_COLORS[parasha.book] || '#1b2f6b'

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ height: '100%' }}>
      <div className={`${isMobileUI ? 'hidden' : 'hidden md:flex'} flex-shrink-0 items-center gap-3 px-6 py-3`}
        style={{ background: 'var(--overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate(basePath)}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('all_parashot_btn')}
        </button>
        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {parasha.id === 'taamim' ? 'Taamim · טַעֲמֵי הַמִּקְרָא' : parasha.combined ? t('parasha_double_label') : parasha.num ? t('parasha_n_of_54').replace('{n}', parasha.num) : t('special_reading')}
        </span>

        <div className="ml-auto flex gap-2">
          {!parasha.combined && parasha.num > 1 && (
            <button
              onClick={() => navigate(`${basePath}/${PARASHOT[parasha.num - 2].id}`)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              ← {PARASHOT[parasha.num - 2].name}
            </button>
          )}
          {!parasha.combined && parasha.num < 54 && (
            <button
              onClick={() => navigate(`${basePath}/${PARASHOT[parasha.num].id}`)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
              {PARASHOT[parasha.num].name} →
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ParashaReader parasha={parasha} initialAliyah={initialAliyah} availableModes={parasha.availableModes} />
      </div>
    </div>
  )
}
