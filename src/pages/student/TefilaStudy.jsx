import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Maximize2, Minimize2, PenLine } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import ParashaReader from '../../components/ParashaReader'
import { useSiddurIndex, useSiddurShabbatIndex, BERAJOT_INLINE, SHEMA_TITLES } from '../../hooks/useSefaria'
import HomeworkQuickModal from '../../components/HomeworkQuickModal'
import { tSef } from '../../data/sefariaTitles'
import { useShell } from '../../components/shell/AppShell'
import { EmptyState, PageHeader, SearchInput, Spinner } from '../../components/ui'
import { Section, ItemCard } from './Study'

const GOLD = '#B7862E'
const TEAL = '#2F7F6A'

const IMPRESCINDIBLES = [
  { ref: 'I Chronicles 16:8-36',  name: 'Hodu',      heTitle: 'הוֹדוּ',      color: GOLD },
  { ref: 'Psalms 145',            name: 'Ashrei',     heTitle: 'אַשְׁרֵי',     color: GOLD },
  { ref: 'Psalms 150',            name: 'Halleluyah', heTitle: 'הַלְלוּיָהּ', color: GOLD },
  { ref: 'Exodus 15:1-19',        name: 'Az Yashir',  heTitle: 'אָז יָשִׁיר', color: GOLD },
  { ref: 'Deuteronomy 6:5-9',     name: "Ve'ahavta",  heTitle: 'וְאָהַבְתָּ', color: TEAL },
  { ref: 'Deuteronomy 11:13-21',  name: 'Vehaya',     heTitle: 'וְהָיָה',     color: TEAL },
  { ref: 'Numbers 15:37-41',      name: 'Vayomer',    heTitle: 'וַיֹּאמֶר',   color: TEAL },
]
const IMPRESCINDIBLES_MAP = Object.fromEntries(IMPRESCINDIBLES.map(s => [s.ref, s]))

export default function TefilaStudy({ basePath = '/student/tefila' }) { // eslint-disable-line no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()

  // Everything is Siddur Sefard now. First choose the day, then the section.
  const day    = searchParams.get('d')  // 'semana' | 'shabat' | 'imprescindibles' | null
  const sefRef = searchParams.get('r')  // full Sefaria ref | null
  const q      = searchParams.get('q')  // search pre-fill | null

  const isTeacher = profile?.role === 'teacher'
  const toChooser = useCallback(() => setSearchParams({}), [setSearchParams])

  // 1. Day chooser
  if (!day) return <DayChooser onPick={d => setSearchParams({ d })} />

  // 2. Imprescindibles (curated biblical texts with taamim)
  if (day === 'imprescindibles') {
    if (sefRef) return (
      <SiddurReaderView
        nusach={null} day={null} sefRef={sefRef} isTeacher={isTeacher}
        onBack={() => setSearchParams({ d: 'imprescindibles' })}
        onNavigate={r => setSearchParams({ d: 'imprescindibles', r })}
      />
    )
    return <ImprescindiblesListView onSelectRef={r => setSearchParams({ d: 'imprescindibles', r })} onChangeDay={toChooser} />
  }

  // 3. Reader for one section / trozo
  if (sefRef) return (
    <SiddurReaderView
      nusach="sefard" day={day} sefRef={sefRef} isTeacher={isTeacher}
      onBack={() => setSearchParams({ d: day })}
      onNavigate={r => setSearchParams({ d: day, r })}
    />
  )

  // 4. Section list (Shabbat or weekday)
  return (
    <SiddurListView key={day} shabbat={day === 'shabat'} nusach="sefard"
      onSelectRef={r => setSearchParams({ d: day, r })}
      onChangeDay={toChooser} initialSearch={q || ''} />
  )
}

// ── Day chooser (Siddur Sefard) ───────────────────────────────────────────

function DayChooser({ onPick }) {
  const { t } = useLang()
  const cards = [
    { key: 'semana', title: t('siddur_semana_title'), heb: 'יְמוֹת הַשָּׁבוּעַ', subtitle: 'Shajarit · Minjá · Arvit', desc: t('siddur_semana_desc'), color: GOLD },
    { key: 'shabat', title: t('siddur_shabat_title'), heb: 'שַׁבָּת קֹדֶשׁ', subtitle: 'Arvit · Shajarit · Musaf · Minjá', desc: t('siddur_shabat_desc'), color: '#3E5A9A' },
    { key: 'imprescindibles', title: 'Imprescindibles', heb: 'עִקָּרִים', subtitle: "Ve'ahavta · Vehaya · Vayomer · Az Yashir", desc: t('ui_essentials_desc'), color: TEAL },
  ]
  return (
    <div className="page page-narrow">
      <PageHeader hebrew="סִדּוּר" eyebrow="Siddur Sefard" title={t('nav_tefila')} subtitle={t('siddur_day_subtitle')} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up-1">
        {cards.map(c => (
          <button key={c.key} onClick={() => onPick(c.key)}
            className="card card-interactive group relative overflow-hidden text-start p-6 flex flex-col min-h-[260px]">
            <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: c.color }} />
            <span className="hebrew text-[30px] leading-tight" style={{ color: c.color, fontWeight: 400 }}>{c.heb}</span>
            <span className="font-serif text-[20px] font-semibold text-ink mt-3">{c.title}</span>
            <span className="text-[12px] text-ink-3 mt-1">{c.subtitle}</span>
            <span className="text-[14px] text-ink-2 leading-relaxed mt-4 flex-1">{c.desc}</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium mt-5 text-ink-2 group-hover:text-ink">
              {t('siddur_select')}<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Siddur List View (weekday + Shabbat share one layout) ─────────────────

function SiddurListView({ shabbat, nusach, onSelectRef, onChangeDay, initialSearch = '' }) {
  const { t, lang } = useLang()
  const [search, setSearch] = useState(initialSearch)
  const [openService, setOpenService] = useState(shabbat ? null : 'shacharit')
  const [openSub, setOpenSub] = useState(null)

  const weekday = useSiddurIndex(shabbat ? null : nusach)
  const shab = useSiddurShabbatIndex(shabbat ? nusach : null)
  const { services, loading: hookLoading, error } = shabbat ? shab : weekday
  const loading = hookLoading || (!services && !error)

  const filteredServices = useMemo(() => {
    if (!services) return []
    if (!search) return services
    const q = search.toLowerCase()
    return services.map(srv => {
      const filteredSubs = srv.subsections
        .map(sub => ({ ...sub, items: sub.items.filter(item => item.title.toLowerCase().includes(q) || item.heTitle.includes(search)) }))
        .filter(sub => sub.items.length > 0)
      const total = filteredSubs.reduce((n, s) => n + s.items.length, 0)
      return { ...srv, subsections: filteredSubs, total }
    }).filter(srv => srv.total > 0)
  }, [services, search])

  return (
    <div className="page page-narrow">
      <button onClick={onChangeDay} className="btn btn-ghost btn-sm -ms-3 mb-4 text-ink-3">
        <ArrowLeft size={16} className="rtl:rotate-180" />{t('siddur_change_day')}
      </button>
      <PageHeader hebrew="סִדּוּר" eyebrow="Siddur Sefard" title={t('nav_tefila')}
        subtitle={<>{t('siddur_nusach_label')} <span className="hebrew-ui">סְפָרַד</span> · Sefard · <span className="text-ink-2 font-medium">{shabbat ? t('siddur_shabat_title') : t('siddur_semana_title')}</span></>} />

      <SearchInput value={search} onChange={setSearch} placeholder={t('siddur_search')} className="mb-6 sm:max-w-md fade-up-1" />

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Spinner />
          <p className="text-sm text-ink-3">{t('siddur_loading')}</p>
        </div>
      )}

      {error && !loading && <div className="card"><EmptyState title={t('siddur_error')} description={error} /></div>}

      {!loading && !error && filteredServices.length === 0 && (
        <div className="card"><EmptyState title={t('siddur_no_results') || t('no_results')} /></div>
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <div className="flex flex-col gap-3 fade-up-2">
          {filteredServices.map(srv => (
            <Section key={srv.id} color={srv.color} title={srv.name} heb={srv.heb}
              subtitle={`${srv.total} ${t('siddur_sections')}`} count={srv.total}
              open={openService === srv.id} forceOpen={!!search}
              onToggle={() => setOpenService(openService === srv.id ? null : srv.id)}>
              {srv.subsections.map(sub => {
                const subKey = `${srv.id}:${sub.name}`
                const subOpen = openSub === subKey || !!search || !sub.name
                return (
                  <div key={sub.name || '__root'} className="mb-3 last:mb-0">
                    {sub.name && (
                      <button onClick={() => !search && setOpenSub(subOpen ? null : subKey)} aria-expanded={subOpen}
                        className="w-full flex items-center gap-2.5 py-2 px-1 text-start group">
                        <ChevronRight size={14} strokeWidth={2} className={`transition-transform rtl:rotate-180 ${subOpen ? 'rotate-90 rtl:rotate-90' : ''}`} style={{ color: srv.color }} />
                        <span className="eyebrow group-hover:text-ink" style={{ color: srv.color }}>{tSef(sub.name, lang)}</span>
                        <span className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                        <span className="text-[12px] text-ink-4 tabular-nums">{sub.items.length}</span>
                      </button>
                    )}
                    <AnimatePresence initial={false}>
                      {subOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                            {sub.items.map(item => (
                              <ItemCard key={item.ref} color={srv.color} heb={item.heTitle} name={tSef(item.title, lang)}
                                cta={t('ui_read')} onClick={() => onSelectRef(item.ref)} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </Section>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Imprescindibles List View ─────────────────────────────────────────────

function ImprescindiblesListView({ onSelectRef, onChangeDay }) {
  const { t } = useLang()
  return (
    <div className="page page-narrow">
      <button onClick={onChangeDay} className="btn btn-ghost btn-sm -ms-3 mb-4 text-ink-3">
        <ArrowLeft size={16} className="rtl:rotate-180" />{t('siddur_change_day')}
      </button>
      <PageHeader hebrew="עִקָּרִים" eyebrow="Siddur" title="Imprescindibles" subtitle={t('ui_essentials_subtitle')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 fade-up-1">
        {IMPRESCINDIBLES.map(item => (
          <button key={item.ref} onClick={() => onSelectRef(item.ref)}
            className="card card-interactive group text-start p-5 relative overflow-hidden">
            <span className="absolute inset-y-0 start-0 w-[3px]" style={{ background: item.color }} />
            <span className="block hebrew text-[26px] leading-snug" style={{ color: item.color, fontWeight: 400 }}>{item.heTitle}</span>
            <span className="block font-medium text-[15px] text-ink mt-1">{item.name}</span>
            <span className="block text-[12px] text-ink-3 mt-0.5" dir="ltr" style={{ textAlign: 'start' }}>{item.ref}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Siddur Reader View ────────────────────────────────────────────────────

function SiddurReaderView({ nusach, day, sefRef, onBack, onNavigate, isTeacher }) {
  const { t, lang } = useLang()
  const { focusMode, setFocusMode } = useShell()
  const [hwOpen, setHwOpen] = useState(false)
  const siddurNusach = (nusach === 'imprescindibles' || !nusach) ? null : nusach
  const { services: weekdayServices } = useSiddurIndex(siddurNusach)
  const { services: shabbatServices } = useSiddurShabbatIndex(siddurNusach)
  const services = day === 'shabat' ? shabbatServices : weekdayServices

  const { service, section, prev, next } = useMemo(() => {
    if (!services) return {}
    for (const srv of services) {
      const flat = srv.allSections
      const idx = flat.findIndex(item => item.ref === sefRef)
      if (idx >= 0) return { service: srv, section: flat[idx], prev: flat[idx - 1], next: flat[idx + 1] }
    }
    return {}
  }, [services, sefRef])

  const isBerajot   = sefRef.startsWith('berajot:')
  const berajotData = isBerajot ? BERAJOT_INLINE[sefRef] : null
  const impMeta     = IMPRESCINDIBLES_MAP[sefRef]
  const isShema     = !isBerajot && !impMeta && SHEMA_TITLES.has(section?.title)
  const hasTaamim   = isShema || !!impMeta
  const displayName = berajotData?.name || impMeta?.name || tSef(section?.title, lang) || sefRef.split(', ').pop()
  const displayHeb  = berajotData?.heTitle || impMeta?.heTitle || section?.heTitle || ''
  const color       = impMeta?.color || service?.color || TEAL

  const aliyot = useMemo(() => {
    if (berajotData) return berajotData.aliyot
    if (isShema) return [
      { n: 1, label: "Ve'ahavta", ref: 'Deuteronomy 6:5-9'    },
      { n: 2, label: 'Vehaya',    ref: 'Deuteronomy 11:13-21' },
      { n: 3, label: 'Vayomer',   ref: 'Numbers 15:37-41'     },
    ]
    return [{ n: 1, label: displayName, ref: sefRef }]
  }, [sefRef, displayName, berajotData, isShema])

  const parasha = useMemo(() => ({
    id: sefRef,
    name: displayName,
    heb: displayHeb,
    color,
    aliyot,
  }), [sefRef, displayName, displayHeb, color, aliyot])

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ height: '100%' }}>
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 h-14 bg-surface"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm text-ink-3">
          <ArrowLeft size={16} className="rtl:rotate-180" /><span className="hidden sm:inline">{t('nav_tefila')}</span>
        </button>
        <span className="w-px h-5 hidden sm:block" style={{ background: 'var(--border)' }} />
        <div className="flex items-baseline gap-2 min-w-0">
          {service?.name && <span className="hidden md:inline text-[13px] text-ink-3">{service.name} ·</span>}
          <span className="font-serif text-[16px] font-semibold text-ink truncate">{displayName}</span>
          {displayHeb && <span className="hebrew-ui text-[16px] truncate hidden sm:inline" style={{ color }}>{displayHeb}</span>}
        </div>

        <div className="ms-auto flex gap-1.5 items-center">
          {isTeacher && !isBerajot && (
            <button onClick={() => setHwOpen(true)} className="btn btn-secondary btn-sm">
              <PenLine size={14} /><span className="hidden sm:inline">{t('ui_assign_hw')}</span>
            </button>
          )}
          {prev && (
            <button onClick={() => onNavigate(prev.ref)} className="btn btn-ghost btn-sm text-ink-3" title={tSef(prev.title, lang)}>
              <ChevronLeft size={16} className="rtl:rotate-180" /><span className="hidden xl:inline max-w-[140px] truncate">{tSef(prev.title, lang)}</span>
            </button>
          )}
          {next && (
            <button onClick={() => onNavigate(next.ref)} className="btn btn-secondary btn-sm" title={tSef(next.title, lang)}>
              <span className="hidden xl:inline max-w-[140px] truncate">{tSef(next.title, lang)}</span><ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          )}
          <button onClick={() => setFocusMode(f => !f)} className="btn btn-ghost btn-sm btn-icon hidden md:inline-flex"
            aria-pressed={focusMode} aria-label={focusMode ? t('ui_exit_focus') : t('ui_focus_mode')}>
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ParashaReader
          parasha={parasha}
          initialAliyah={0}
          availableModes={hasTaamim ? ['taamim', 'nikkud', 'audio'] : ['nikkud', 'audio']}
          adminSync={false}
        />
      </div>

      {hwOpen && (
        <HomeworkQuickModal
          onClose={() => setHwOpen(false)}
          preType="tefila"
          preRef={sefRef}
          preName={`${service?.name ? service.name + ' · ' : ''}${displayName}`}
          preHeb={displayHeb || service?.heb || ''}
        />
      )}
    </div>
  )
}
