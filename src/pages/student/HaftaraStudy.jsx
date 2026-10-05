import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { BOOK_COLORS, SEFARIM_LIST, PARASHOT } from '../../data/parashot'
import { MOADIM_LIST } from '../../data/moadim'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useAliyahText } from '../../hooks/useSefaria'
import { processVerse } from '../../utils/hebrew'
import ParashaReader from '../../components/ParashaReader'
import { EmptyState, PageHeader, SearchInput, Spinner } from '../../components/ui'
import { Section, ItemCard } from './Study'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'

const WEEKLY = ALL_HAFTAROT.filter(h => !h.chag)

export default function HaftaraStudy({ basePath = '/student/haftara' }) {
  const { haftaraId } = useParams()
  const haftara = haftaraId ? ALL_HAFTAROT.find(h => h.id === haftaraId) : null

  if (haftara) return <ReaderView haftara={haftara} basePath={basePath} />
  return <ListView basePath={basePath} />
}

function ListView({ basePath }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('all')
  const [openBook, setOpenBook] = useState('bereshit')
  const [openChag, setOpenChag] = useState(null)
  const [previewId, setPreviewId] = useState(WEEKLY[0]?.id)

  const [isWide, setIsWide] = useState(() => window.matchMedia('(min-width: 1280px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const on = () => setIsWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const match = (h) => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.heb.includes(search)
  const byBook = useMemo(() => SEFARIM_LIST.map(s => ({ ...s, haftarot: WEEKLY.filter(h => h.book === s.id && match(h)) }))
    .filter(s => s.haftarot.length > 0), [search]) // eslint-disable-line react-hooks/exhaustive-deps
  const byChag = useMemo(() => MOADIM_LIST.map(m => ({ ...m, haftarot: ALL_HAFTAROT.filter(h => h.chag === m.id && match(h)) }))
    .filter(m => m.haftarot.length > 0), [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (id) => navigate(`${basePath}/${id}`)
  const pick = (id) => (isWide ? setPreviewId(id) : open(id))
  const preview = ALL_HAFTAROT.find(h => h.id === previewId)
  const showWeekly = scope === 'all' || SEFARIM_LIST.some(s => s.id === scope)
  const showHoliday = scope === 'all' || scope === 'special'

  return (
    <div className="page">
      <PageHeader
        hebrew="הַפְטָרָה"
        eyebrow={t('ui_section_study')}
        title={t('nav_haftara')}
        subtitle={t('haftara_subtitle')}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6 fade-up-1">
        <SearchInput value={search} onChange={setSearch} placeholder={t('haftara_search')} className="flex-1 sm:max-w-md" />
        <select value={scope} onChange={e => setScope(e.target.value)} className="input sm:w-auto sm:min-w-[220px]" aria-label={t('ui_sections')}>
          <option value="all">{t('ui_all_sections')}</option>
          {SEFARIM_LIST.map(s => <option key={s.id} value={s.id}>{s.name} · {s.heb}</option>)}
          <option value="special">{t('haftara_holiday_section')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 flex flex-col gap-3 fade-up-2 min-w-0">
          {showWeekly && byBook.filter(b => scope === 'all' || b.id === scope).map(book => {
            const color = BOOK_COLORS[book.id]
            return (
              <Section key={book.id} color={color} title={book.name} heb={book.heb}
                subtitle={`${book.haftarot.length} ${t('haftara_count')}`}
                count={book.haftarot.length}
                open={openBook === book.id} forceOpen={!!search || scope === book.id}
                onToggle={() => setOpenBook(openBook === book.id ? null : book.id)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {book.haftarot.map(h => (
                    <ItemCard key={h.id} color={color} heb={h.heb} name={h.name}
                      num={PARASHOT.find(p => p.id === h.parasha)?.num}
                      meta={h.aliyot[0]?.ref} active={isWide && previewId === h.id}
                      onClick={() => pick(h.id)} />
                  ))}
                </div>
              </Section>
            )
          })}

          {showHoliday && byChag.length > 0 && (
            <>
              <div className="flex items-center gap-4 mt-6 mb-1 px-1">
                <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
                <p className="eyebrow flex items-center gap-2">
                  <span className="hebrew-ui normal-case tracking-normal text-[13px]">מוֹעֲדִים</span>·<span>{t('haftara_holiday_section')}</span>
                </p>
                <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
              </div>
              {byChag.map(chag => (
                <Section key={chag.id} color={chag.color} title={chag.name} heb={chag.heb}
                  subtitle={`${chag.haftarot.length} ${t('haftara_count')}`} count={chag.haftarot.length}
                  open={openChag === chag.id} forceOpen={!!search}
                  onToggle={() => setOpenChag(openChag === chag.id ? null : chag.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {chag.haftarot.map(h => (
                      <ItemCard key={h.id} color={chag.color} heb={h.heb} name={h.name}
                        meta={h.aliyot[0]?.ref} active={isWide && previewId === h.id} onClick={() => pick(h.id)} />
                    ))}
                  </div>
                </Section>
              ))}
            </>
          )}

          {byBook.length === 0 && byChag.length === 0 && <div className="card"><EmptyState title={t('no_results')} /></div>}
        </div>

        <aside className="hidden xl:block xl:col-span-5 sticky top-6 fade-up-3">
          {preview && <HaftaraPreview haftara={preview} t={t} onOpen={() => open(preview.id)} onPick={setPreviewId} />}
        </aside>
      </div>
    </div>
  )
}

function HaftaraPreview({ haftara, t, onOpen, onPick }) {
  const ref = haftara.aliyot?.[0]?.ref
  const { verses, loading } = useAliyahText(ref, true, null)
  const [mode, setMode] = useState('nikkud')
  const color = haftara.color || BOOK_COLORS[haftara.book] || '#2F5E93'
  const parasha = PARASHOT.find(p => p.id === haftara.parasha)
  const idx = WEEKLY.findIndex(h => h.id === haftara.id)
  const prev = idx > 0 ? WEEKLY[idx - 1] : null
  const next = idx >= 0 && idx < WEEKLY.length - 1 ? WEEKLY[idx + 1] : null

  return (
    <section className="card overflow-hidden flex flex-col max-h-[calc(100svh-120px)]">
      <div className="relative px-6 pt-6 pb-5 overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--surface) 40%, var(--parchment) 100%)' }}>
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow">
            <span className="hebrew-ui normal-case tracking-normal text-[13px]">{parasha?.heb || 'הַפְטָרָה'}</span>
            {parasha?.num ? ` · ${parasha.num}` : ''}
          </p>
          <div className="flex gap-1.5">
            <button onClick={() => prev && onPick(prev.id)} disabled={!prev} className="btn btn-secondary btn-sm btn-icon" aria-label={t('ui_previous')}>
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>
            <button onClick={() => next && onPick(next.id)} disabled={!next} className="btn btn-secondary btn-sm btn-icon" aria-label={t('ui_next')}>
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
        <h2 className="hebrew text-[32px] mt-2 leading-tight" style={{ color: 'var(--text)', fontWeight: 400 }}>{haftara.heb}</h2>
        <p className="font-serif text-[18px] text-ink-2 mt-1">{haftara.name}</p>
        <p className="text-[14px] text-ink-3 mt-0.5" dir="ltr" style={{ textAlign: 'start' }}>{ref}</p>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="segmented">
          <button aria-pressed={mode === 'nikkud'} onClick={() => setMode('nikkud')}>{t('mode_nikkud') || 'Nikud'}</button>
          <button aria-pressed={mode === 'plain'} onClick={() => setMode('plain')}>{t('mode_plain') || 'Texto'}</button>
        </div>
        <span className="text-[12px] text-ink-4">Sefaria</span>
      </div>

      {/* Authoritative text from Sefaria — rendered as received, never edited */}
      <div className="flex-1 overflow-y-auto px-6 py-4" style={{ background: 'var(--parchment)' }}>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <ol className="hebrew-reader" dir="rtl" style={{ color: 'var(--parchment-ink)', fontSize: 21, lineHeight: 2 }}>
            {verses.map((v, i) => (
              <li key={i} className="flex gap-3 py-1" style={i ? { borderTop: '1px solid var(--parchment-line)' } : undefined}>
                <span className="text-[12px] font-sans pt-2 flex-shrink-0 w-5 tabular-nums" style={{ color: color }}>{i + 1}</span>
                <span className="flex-1">{processVerse(v, mode)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={onOpen} className="btn btn-primary flex-1">{t('ui_read_haftara')}<ArrowRight size={16} className="rtl:rotate-180" /></button>
      </div>
    </section>
  )
}

/* ── Reader (unchanged from main) ───────────────────────────────────────── */
function ReaderView({ haftara, basePath }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const { user } = useAuth()
  const isAdmin = user?.id === ADMIN_USER_ID
  const [searchParams] = useSearchParams()
  const initialAliyah = Math.min(
    Math.max(0, parseInt(searchParams.get('aliyah') || '0', 10)),
    haftara.aliyot.length - 1
  )
  const color = haftara.color || BOOK_COLORS[haftara.book] || '#1b2f6b'

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ height: '100%' }}>
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 flex-wrap"
        style={{ background: 'var(--overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate(basePath)}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('haftara_all')}
        </button>
        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {haftara.chag ? `${t('haftara_holiday_label')} · מוֹעֲדִים` : `${t('haftara_weekly_label')} · הַפְטָרָה`}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <ParashaReader parasha={haftara} initialAliyah={initialAliyah} availableModes={['nikkud', 'audio']} />
      </div>

    </div>
  )
}
