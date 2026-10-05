import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Maximize2, Minimize2, Volume2,
} from 'lucide-react'
import { PARASHOT, ALL_PARASHOT, SEFARIM_LIST, BOOK_COLORS } from '../../data/parashot'
import { MOADIM_LIST, ALL_MOADIM } from '../../data/moadim'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { useAudio } from '../../context/AudioContext'
import { useLang } from '../../context/LangContext'
import ParashaReader from '../../components/ParashaReader'
import { BERAJOT_INLINE } from '../../hooks/useSefaria'
import { useShell } from '../../components/shell/AppShell'
import { PageHeader, SearchInput, EmptyState } from '../../components/ui'

const BERAJOT_COLOR = '#2F7F6A'

const TAAMIM = {
  id: 'taamim',
  name: 'Taamim',
  heb: 'טַעֲמֵי הַמִּקְרָא',
  color: '#2F5E93',
  availableModes: ['taamim'],
  aliyot: [{
    n: 1,
    label: 'טַעֲמֵי הַמִּקְרָא',
    heText: [
      'מֻנַּח֣ פַּשְׁטָא֙ מֻנַּח֣ זַרְקָא֘ מֻנַּח֣ סֶגּוֹל֒ מֻנַּח֣',
      'מֻנַּח֣ רְבִיעִי֗ מַהְפַּךְ֤ פַּשְׁטָא֙ זָקֵף֔-קָטֹן',
      'זָקֵף֕-גָּדוֹל מֶרְכָּא֥ טִפְחָא֖ מֻנַּח֣ אֶתְנַחְתָּא֑',
      'פָּזֵר֡ תְּלִישָׁא֩-קְטַנָּה תְּ֠לִישָׁא-גְּדוֹלָה קַדְמָא֨-וְאַזְלָא֜',
      'אַזְלָא֜-גֵּרֵשׁ֜ גֵּרְשַׁיִם֞ דַּרְגָּא֧ תְּבִיר֛',
      'יְ֚תִיב פָּסִיק ׀ סוֹף-פָּסוּק׃',
    ],
  }],
}

export default function StudentStudy({ basePath = '/student/study' }) {
  const { parashaId } = useParams()
  const parasha = parashaId === 'taamim'
    ? TAAMIM
    : parashaId?.startsWith('berajot--')
      ? (() => {
          const key = parashaId.replace('berajot--', 'berajot:')
          const data = BERAJOT_INLINE[key]
          if (!data) return null
          return { id: parashaId, name: data.name, heb: data.heTitle, color: BERAJOT_COLOR, aliyot: data.aliyot }
        })()
      : parashaId
        ? (ALL_PARASHOT.find(p => p.id === parashaId) || ALL_MOADIM.find(p => p.id === parashaId))
        : null

  if (parasha) return <ReaderView parasha={parasha} basePath={basePath} />
  return <ListView basePath={basePath} />
}

/* ── Accordion section (book / chag / berajot) ─────────────────────────── */
export function Section({ color, title, heb, subtitle, count, open, onToggle, children, forceOpen = false }) {
  const isOpen = open || forceOpen
  return (
    <div className="card overflow-hidden transition-[border-color] duration-200"
      style={isOpen ? { borderColor: `${color}40` } : undefined}>
      <button onClick={onToggle} aria-expanded={isOpen}
        className="w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-start transition-colors hover:bg-surface-2"
        style={isOpen ? { background: `${color}08` } : undefined}>
        <span className="w-[3px] self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="flex-1 min-w-0">
          <span className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-serif text-[18px] font-semibold text-ink">{title}</span>
            <span className="hebrew-ui text-[17px]" style={{ color }}>{heb}</span>
          </span>
          {subtitle && <span className="block text-[13px] text-ink-3 mt-0.5">{subtitle}</span>}
        </span>
        {count != null && (
          <span className="min-w-[28px] h-6 px-2 rounded-full text-[12px] font-semibold flex items-center justify-center tabular-nums"
            style={{ background: `${color}14`, color }}>{count}</span>
        )}
        <ChevronDown size={18} strokeWidth={1.8} className={`text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="px-3 sm:px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ItemCard({ color, heb, name, meta, num, badge, active, audio, onClick, cta }) {
  return (
    <button onClick={onClick}
      className="group relative text-start p-3.5 rounded-xl bg-surface transition-all duration-150 hover:shadow-pop"
      style={{
        border: `1px solid ${active ? `${color}66` : 'var(--border-subtle)'}`,
        boxShadow: active ? `0 0 0 3px ${color}14` : undefined,
      }}>
      <span className="flex items-start justify-between gap-2">
        <span className="hebrew-ui text-[16px] leading-tight" style={{ color }}>{heb}</span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          {audio && <Volume2 size={13} strokeWidth={2} className="text-ink-4" aria-label="Audio" />}
          {badge
            ? <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md" style={{ background: `${color}14`, color }}>{badge}</span>
            : num != null && <span className="text-[12px] text-ink-4 tabular-nums">{num}</span>}
        </span>
      </span>
      <span className="block text-[14px] font-medium text-ink mt-1">{name}</span>
      <span className="flex items-center gap-1 text-[12px] mt-1 text-ink-3 group-hover:text-ink-2 transition-colors">
        <ArrowRight size={12} className="rtl:rotate-180" />{meta || cta}
      </span>
    </button>
  )
}

function ListView({ basePath }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('all')
  const [openBook, setOpenBook] = useState('bereshit')
  const [openChag, setOpenChag] = useState(null)
  const [openBerajot, setOpenBerajot] = useState(false)
  const [previewId, setPreviewId] = useState('bereshit')
  const { hasAny } = useAudio()

  const [isWide, setIsWide] = useState(() => window.matchMedia('(min-width: 1280px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const on = () => setIsWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const filtered = useMemo(() => {
    if (!search) return ALL_PARASHOT
    const q = search.toLowerCase()
    return ALL_PARASHOT.filter(p => p.name.toLowerCase().includes(q) || p.heb.includes(search) || p.book.includes(q))
  }, [search])

  const byBook = useMemo(() => SEFARIM_LIST.map(s => ({ ...s, parashot: filtered.filter(p => p.book === s.id) }))
    .filter(s => s.parashot.length > 0), [filtered])

  const byChag = useMemo(() => {
    const q = search.toLowerCase()
    const list = search ? ALL_MOADIM.filter(p => p.name.toLowerCase().includes(q) || p.heb.includes(search)) : ALL_MOADIM
    return MOADIM_LIST.map(m => ({ ...m, readings: list.filter(p => p.chag === m.id) })).filter(m => m.readings.length > 0)
  }, [search])

  const open = (id) => navigate(`${basePath}/${id}`)
  const pick = (id) => (isWide ? setPreviewId(id) : open(id))
  const preview = ALL_PARASHOT.find(p => p.id === previewId) || ALL_MOADIM.find(p => p.id === previewId)
  const showTorah = scope === 'all' || SEFARIM_LIST.some(s => s.id === scope)
  const showSpecial = scope === 'all' || scope === 'special'

  return (
    <div className="page">
      <PageHeader
        hebrew="לִמּוּד הַתּוֹרָה"
        eyebrow={t('ui_section_study')}
        title={t('study_title')}
        subtitle={t('study_subtitle')}
        aside={
          <a href="https://www.sefaria.org/texts/Tanakh/Torah" target="_blank" rel="noreferrer" className="btn btn-secondary">
            {t('ui_view_on_sefaria')}<ExternalLink size={15} />
          </a>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6 fade-up-1">
        <SearchInput value={search} onChange={setSearch} placeholder={t('search_parasha')} className="flex-1 sm:max-w-md" />
        <select value={scope} onChange={e => setScope(e.target.value)} className="input sm:w-auto sm:min-w-[220px]" aria-label={t('ui_sections')}>
          <option value="all">{t('ui_all_sections')}</option>
          {SEFARIM_LIST.map(s => <option key={s.id} value={s.id}>{s.name} · {s.heb}</option>)}
          <option value="special">{t('special_readings')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 flex flex-col gap-3 fade-up-2 min-w-0">
          {!search && scope === 'all' && (
            <>
              <Section color={BERAJOT_COLOR} title="Berajot" heb="בְּרָכוֹת"
                subtitle={t('berajot_sections').replace('{n}', Object.keys(BERAJOT_INLINE).length)}
                count={Object.keys(BERAJOT_INLINE).length} open={openBerajot} onToggle={() => setOpenBerajot(o => !o)}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(BERAJOT_INLINE).map(([key, data]) => (
                    <ItemCard key={key} color={BERAJOT_COLOR} heb={data.heTitle} name={data.name}
                      meta={`${data.aliyot.length} ${t('section').toLowerCase()}`}
                      onClick={() => open(key.replace('berajot:', 'berajot--'))} />
                  ))}
                </div>
              </Section>

              <button onClick={() => open('taamim')}
                className="card card-interactive w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-start">
                <span className="w-[3px] self-stretch rounded-full flex-shrink-0" style={{ background: TAAMIM.color }} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="font-serif text-[18px] font-semibold text-ink">Taamim</span>
                    <span className="hebrew-ui text-[17px]" style={{ color: TAAMIM.color }}>טַעֲמֵי הַמִּקְרָא</span>
                  </span>
                  <span className="block text-[13px] text-ink-3 mt-0.5">{t('trop_subtitle')}</span>
                </span>
                <ChevronRight size={18} className="text-ink-3 rtl:rotate-180" />
              </button>
            </>
          )}

          {showTorah && byBook.filter(b => scope === 'all' || b.id === scope).map(book => {
            const color = BOOK_COLORS[book.id]
            return (
              <Section key={book.id} color={color} title={book.name} heb={book.heb}
                subtitle={`${book.en} · ${book.parashot.length} ${t('ui_parashot_lower')}`}
                count={book.parashot.length}
                open={openBook === book.id} forceOpen={!!search || scope === book.id}
                onToggle={() => setOpenBook(openBook === book.id ? null : book.id)}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {book.parashot.map(p => (
                    <ItemCard key={p.id} color={color} heb={p.heb} name={p.name} num={p.num}
                      badge={p.combined ? t('double_label') : null} audio={hasAny(p.id)}
                      active={isWide && previewId === p.id} cta={t('read_parasha')}
                      onClick={() => pick(p.id)} />
                  ))}
                </div>
              </Section>
            )
          })}

          {showSpecial && byChag.length > 0 && (
            <>
              <div className="flex items-center gap-4 mt-6 mb-1 px-1">
                <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
                <p className="eyebrow flex items-center gap-2">
                  <span className="hebrew-ui normal-case tracking-normal text-[13px]">מוֹעֲדִים</span>·<span>{t('ui_special_parashot')}</span>
                </p>
                <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
              </div>
              {byChag.map(chag => (
                <Section key={chag.id} color={chag.color} title={chag.name} heb={chag.heb}
                  subtitle={`${chag.en ? chag.en + ' · ' : ''}${chag.readings.length} ${t('ui_readings')}`}
                  count={chag.readings.length}
                  open={openChag === chag.id} forceOpen={!!search}
                  onToggle={() => setOpenChag(openChag === chag.id ? null : chag.id)}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {chag.readings.map(p => (
                      <ItemCard key={p.id} color={chag.color} heb={p.heb} name={p.name}
                        meta={`${p.aliyot.length} aliyot`} active={isWide && previewId === p.id}
                        onClick={() => pick(p.id)} />
                    ))}
                  </div>
                </Section>
              ))}
            </>
          )}

          {byBook.length === 0 && byChag.length === 0 && (
            <div className="card"><EmptyState title={t('no_results')} /></div>
          )}
        </div>

        {/* Preview (desktop) */}
        <aside className="hidden xl:block xl:col-span-5 sticky top-6 fade-up-3">
          {preview && <ParashaPreview key={preview.id} parasha={preview} onOpen={(aliyah) => navigate(`${basePath}/${preview.id}${aliyah != null ? `?aliyah=${aliyah}` : ''}`)} t={t} hasAudio={hasAny(preview.id)} />}
        </aside>
      </div>
    </div>
  )
}

function ParashaPreview({ parasha, onOpen, t, hasAudio }) {
  const [tab, setTab] = useState('aliyot')
  const color = parasha.color || BOOK_COLORS[parasha.book] || '#2F5E93'
  const book = SEFARIM_LIST.find(s => s.id === parasha.book)
  const haftara = ALL_HAFTAROT.find(h => h.parasha === parasha.id)

  return (
    <section className="card overflow-hidden">
      <div className="relative px-6 pt-6 pb-5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--surface) 40%, var(--parchment) 100%)' }}>
        <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true"
          style={{ backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 23px, var(--parchment-line) 23px 24px)', maskImage: 'linear-gradient(90deg, transparent 35%, #000 100%)' }} />
        <p className="relative eyebrow mb-2">
          <span className="hebrew-ui normal-case tracking-normal text-[13px]">פָּרָשָׁה</span>
          {parasha.num ? ` · ${parasha.num}` : ''}
        </p>
        <div className="relative flex items-baseline justify-between gap-4 flex-wrap">
          <h2 className="font-serif text-[34px] font-semibold text-ink tracking-[-0.02em] leading-none">{parasha.name}</h2>
          <span className="hebrew text-[34px] leading-none" style={{ color, fontWeight: 400 }}>{parasha.heb}</span>
        </div>
        <p className="relative text-[14px] text-ink-3 mt-2 flex items-center gap-2">
          {book?.en || parasha.en || ''}{parasha.ref ? ` · ${parasha.ref}` : ''}
          {hasAudio && <span className="badge badge-accent h-5 text-[11px]"><Volume2 size={11} />Audio</span>}
        </p>
      </div>

      <div className="px-6">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'aliyot'} onClick={() => setTab('aliyot')}>{t('ui_aliyot')}</button>
          {haftara && <button role="tab" aria-selected={tab === 'haftara'} onClick={() => setTab('haftara')}>{t('ui_haftara')}</button>}
        </div>
      </div>

      <div className="p-3 max-h-[52vh] overflow-y-auto">
        {tab === 'aliyot' && parasha.aliyot.map((a, i) => (
          <button key={i} onClick={() => onOpen(i)}
            className="group w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-start transition-colors hover:bg-surface-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 bg-surface-2 text-ink-2 group-hover:bg-surface"
              style={{ border: '1px solid var(--border-subtle)' }}>
              {a.n === 8 ? 'M' : a.n}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-medium text-ink">{a.n === 8 ? 'Maftir' : a.label}</span>
              <span className="block text-[12px] text-ink-3 truncate" dir="ltr">{a.ref}</span>
            </span>
            <ChevronRight size={16} className="text-ink-4 group-hover:text-ink rtl:rotate-180" />
          </button>
        ))}
        {tab === 'haftara' && haftara && (
          <div className="p-3">
            <p className="hebrew-ui text-[22px] text-ink">{haftara.heb}</p>
            <p className="text-[14px] text-ink-2 mt-1">{haftara.name}</p>
            <p className="text-[13px] text-ink-3" dir="ltr">{haftara.aliyot?.[0]?.ref}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={() => onOpen(null)} className="btn btn-primary flex-1">{t('read_parasha')}<ArrowRight size={16} className="rtl:rotate-180" /></button>
        {parasha.sefaria && (
          <a href={`https://www.sefaria.org/${parasha.sefaria}`} target="_blank" rel="noreferrer" className="btn btn-secondary" aria-label={t('ui_view_on_sefaria')}>
            Sefaria<ExternalLink size={14} />
          </a>
        )}
      </div>
    </section>
  )
}

/* ── Reader wrapper ────────────────────────────────────────────────────── */
function ReaderView({ parasha, basePath }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const { focusMode, setFocusMode } = useShell()
  const [searchParams] = useSearchParams()
  const initialAliyah = Math.min(
    Math.max(0, parseInt(searchParams.get('aliyah') || '0', 10)),
    parasha.aliyot.length - 1
  )
  const color = parasha.color || BOOK_COLORS[parasha.book] || '#2F5E93'
  const prev = !parasha.combined && parasha.num > 1 ? PARASHOT[parasha.num - 2] : null
  const next = !parasha.combined && parasha.num < 54 && parasha.num ? PARASHOT[parasha.num] : null
  const context = parasha.id === 'taamim' ? 'Taamim'
    : parasha.combined ? t('parasha_double_label')
    : parasha.num ? t('parasha_n_of_54').replace('{n}', parasha.num)
    : t('special_reading')

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ height: '100%' }}>
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 h-14 bg-surface"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate(basePath)} className="btn btn-ghost btn-sm text-ink-3" aria-label={t('all_parashot_btn')}>
          <ArrowLeft size={16} className="rtl:rotate-180" />
          <span className="hidden sm:inline">{t('all_parashot_btn')}</span>
        </button>
        <span className="w-px h-5 hidden sm:block" style={{ background: 'var(--border)' }} />
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-serif text-[17px] font-semibold text-ink truncate">{parasha.name}</span>
          <span className="hebrew-ui text-[17px] truncate" style={{ color }}>{parasha.heb}</span>
          <span className="hidden md:inline text-[12px] text-ink-3 ms-1">{context}</span>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          {prev && (
            <button onClick={() => navigate(`${basePath}/${prev.id}`)} className="btn btn-ghost btn-sm text-ink-3" title={prev.name}>
              <ChevronLeft size={16} className="rtl:rotate-180" /><span className="hidden lg:inline">{prev.name}</span>
            </button>
          )}
          {next && (
            <button onClick={() => navigate(`${basePath}/${next.id}`)} className="btn btn-secondary btn-sm" title={next.name}>
              <span className="hidden lg:inline">{next.name}</span><ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          )}
          <button onClick={() => setFocusMode(f => !f)} className="btn btn-ghost btn-sm btn-icon hidden md:inline-flex"
            aria-pressed={focusMode} title={focusMode ? t('ui_exit_focus') : t('ui_focus_mode')} aria-label={focusMode ? t('ui_exit_focus') : t('ui_focus_mode')}>
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ParashaReader parasha={parasha} initialAliyah={initialAliyah} availableModes={parasha.availableModes} />
      </div>
    </div>
  )
}

