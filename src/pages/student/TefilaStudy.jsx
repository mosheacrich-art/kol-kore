import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import ParashaReader from '../../components/ParashaReader'
import AdminAudioUpload from '../../components/AdminAudioUpload'
import { useSiddurIndex, useSiddurShabbatIndex, BERAJOT_INLINE } from '../../hooks/useSefaria'
import HomeworkQuickModal from '../../components/HomeworkQuickModal'
import { tSef } from '../../data/sefariaTitles'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'

export default function TefilaStudy({ basePath = '/student/tefila' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()

  const nusach = searchParams.get('n')  // 'ashkenaz' | 'sefard' | null
  const day    = searchParams.get('d')  // 'semana' | 'shabat' | null
  const sefRef = searchParams.get('r')  // full Sefaria ref | null
  const q      = searchParams.get('q')  // global search pre-fill | null

  const isTeacher = profile?.role === 'teacher'
  const isSubscribed = isTeacher || profile?.subscription_status === 'active'
  const isGuest = basePath.startsWith('/guest')
  const guestMode = isGuest || !isSubscribed

  const searchGlobal  = useCallback(query => setSearchParams({ n: 'ashkenaz', d: 'semana', q: query }), [setSearchParams])
  const selectNusach  = useCallback(n => setSearchParams({ n }), [setSearchParams])
  const selectDay     = useCallback(d => setSearchParams({ n: nusach, d }), [setSearchParams, nusach])
  const selectSection = useCallback(r => setSearchParams({ n: nusach, d: day, r }), [setSearchParams, nusach, day])
  const backToList    = useCallback(() => setSearchParams({ n: nusach, d: day }), [setSearchParams, nusach, day])
  const changeNusach  = useCallback(() => setSearchParams({}), [setSearchParams])
  const changeDay     = useCallback(() => setSearchParams({ n: nusach }), [setSearchParams, nusach])

  if (!nusach) return <NusachPicker onSelect={selectNusach} onSearch={searchGlobal} />
  if (!day)    return <DayPicker nusach={nusach} onSelect={selectDay} onBack={changeNusach} />
  if (sefRef) return (
    <SiddurReaderView
      nusach={nusach} day={day} sefRef={sefRef}
      guestMode={guestMode} isSubscribed={isSubscribed}
      isTeacher={isTeacher}
      onBack={backToList}
      onNavigate={r => setSearchParams({ n: nusach, d: day, r })}
    />
  )
  if (day === 'shabat')
    return <SiddurShabbatListView nusach={nusach} onSelectRef={selectSection} onChangeNusach={changeNusach} onChangeDay={changeDay} initialSearch={q || ''} />
  return <SiddurListView nusach={nusach} onSelectRef={selectSection} onChangeNusach={changeNusach} onChangeDay={changeDay} initialSearch={q || ''} />
}

// ── Nusach Picker ─────────────────────────────────────────────────────────

function NusachCard({ title, heb, subtitle, desc, color, onClick }) {
  const { t } = useLang()
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="text-left p-6 rounded-2xl transition-all duration-200 w-full"
      style={{
        background: hovered ? `${color}10` : 'var(--bg-card)',
        border: `1px solid ${hovered ? `${color}45` : 'var(--border)'}`,
      }}>
      <div className="hebrew text-2xl mb-2 leading-snug" style={{ color }}>{heb}</div>
      <div className="font-semibold text-base mb-0.5" style={{ color: 'var(--text)' }}>{title}</div>
      <div className="text-xs mb-3" style={{ color }}>{subtitle}</div>
      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{desc}</div>
      <div className="mt-5 flex items-center gap-1 text-xs font-medium" style={{ color }}>
        {t('siddur_select')}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  )
}

function NusachPicker({ onSelect, onSearch }) {
  const { t } = useLang()
  const [searchQ, setSearchQ] = useState('')
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) onSearch(searchQ.trim())
  }
  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          סִדּוּר · Siddur
        </p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>{t('nav_tefila')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('siddur_pick_subtitle')}</p>
      </div>

      {/* Global search */}
      <form onSubmit={handleSearch} className="relative mb-8 fade-up-2">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4" stroke="var(--text-3)" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12 12" stroke="var(--text-3)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder={t('siddur_search')}
          className="w-full pl-10 pr-24 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        {searchQ && (
          <button type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
            Buscar →
          </button>
        )}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-up-3">
        <NusachCard
          title="Ashkenaz" heb="נוּסַח אַשְׁכְּנַז" subtitle="Siddur Ashkenaz"
          desc={t('siddur_ashkenaz_desc')}
          color="#f59e0b" onClick={() => onSelect('ashkenaz')}
        />
        <NusachCard
          title="Sefard" heb="נוּסַח סְפָרַד" subtitle="Siddur Sefard"
          desc={t('siddur_sefard_desc')}
          color="#8b5cf6" onClick={() => onSelect('sefard')}
        />
      </div>
    </div>
  )
}

// ── Day Picker ─────────────────────────────────────────────────────────────

function DayPicker({ nusach, onSelect, onBack }) {
  const { t } = useLang()
  const nusachHeb   = nusach === 'ashkenaz' ? 'אַשְׁכְּנַז' : 'סְפָרַד'
  const nusachLabel = nusach === 'ashkenaz' ? 'Ashkenaz' : 'Sefard'
  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-10 fade-up-1">
        <button onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M7 2L3 5l4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('siddur_change_nusach')}
        </button>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          סִדּוּר · Siddur
        </p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>{t('nav_tefila')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          {t('siddur_nusach_label')} <span className="hebrew">{nusachHeb}</span> · {nusachLabel} · {t('siddur_day_subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-up-2">
        <NusachCard
          title={t('siddur_semana_title')} heb="יְמוֹת הַשָּׁבוּעַ" subtitle="Shajarit · Minjá · Arvit"
          desc={t('siddur_semana_desc')}
          color="#f59e0b" onClick={() => onSelect('semana')}
        />
        <NusachCard
          title={t('siddur_shabat_title')} heb="שַׁבָּת קֹדֶשׁ" subtitle="Kabalat Shabat · Shajarit · Musaf · Minjá"
          desc={t('siddur_shabat_desc')}
          color="#6366f1" onClick={() => onSelect('shabat')}
        />
      </div>
    </div>
  )
}

// ── Siddur List View ──────────────────────────────────────────────────────

function SiddurListView({ nusach, onSelectRef, onChangeNusach, onChangeDay, initialSearch = '' }) {
  const { isDark } = useTheme()
  const { t, lang } = useLang()
  const [search, setSearch] = useState(initialSearch)
  const [openService, setOpenService] = useState('shacharit')
  const [openSub, setOpenSub] = useState(null)

  const { services, loading, error } = useSiddurIndex(nusach)

  const cardDefault = isDark
    ? { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)' }
    : { bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.07)' }

  const filteredServices = useMemo(() => {
    if (!services) return []
    if (!search) return services
    const q = search.toLowerCase()
    return services.map(srv => {
      const filteredSubs = srv.subsections
        .map(sub => ({
          ...sub,
          items: sub.items.filter(item =>
            item.title.toLowerCase().includes(q) || item.heTitle.includes(search)
          ),
        }))
        .filter(sub => sub.items.length > 0)
      const total = filteredSubs.reduce((n, s) => n + s.items.length, 0)
      return { ...srv, subsections: filteredSubs, total }
    }).filter(srv => srv.total > 0)
  }, [services, search])

  const nusachHeb   = nusach === 'ashkenaz' ? 'אַשְׁכְּנַז' : 'סְפָרַד'
  const nusachLabel = nusach === 'ashkenaz' ? 'Ashkenaz' : 'Sefard'

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8 fade-up-1">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button onClick={onChangeDay}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7 2L3 5l4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('siddur_change_day')}
          </button>
          <button onClick={onChangeNusach}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {t('siddur_change_nusach')}
          </button>
        </div>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          סִדּוּר · Siddur
        </p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>{t('nav_tefila')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          {t('siddur_nusach_label')} <span className="hebrew">{nusachHeb}</span> · {nusachLabel} · {t('siddur_semana_title')}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-7 fade-up-2">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4" stroke="var(--text-3)" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12 12" stroke="var(--text-3)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('siddur_search')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 fade-up-3">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(245,158,11,0.25)', borderTopColor: '#f59e0b' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('siddur_loading')}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="py-10 text-center fade-up-3">
          <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t('siddur_error')}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{error}</p>
        </div>
      )}

      {/* Services accordion */}
      {!loading && !error && (
        <div className="flex flex-col gap-2.5 fade-up-3">
          {filteredServices.map(srv => {
            const isOpen = openService === srv.id || !!search
            return (
              <div key={srv.id} className="rounded-2xl overflow-hidden transition-all"
                style={{ border: `1px solid ${isOpen ? srv.color + '30' : 'var(--border)'}` }}>

                {/* Service header */}
                <button
                  onClick={() => !search && setOpenService(isOpen ? null : srv.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{ background: isOpen ? `${srv.color}0d` : 'var(--bg-card)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: srv.color }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{srv.name}</span>
                        <span className="hebrew text-sm" style={{ color: srv.color }}>{srv.heb}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{srv.total} {t('siddur_sections')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${srv.color}15`, color: srv.color, border: `1px solid ${srv.color}20` }}>
                      {srv.total}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: 'var(--text-muted)' }}>
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>

                {/* Subsections + items */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-2" style={{ background: 'var(--bg-card)' }}>
                    {srv.subsections.map(sub => {
                      const subKey = `${srv.id}:${sub.name}`
                      const subOpen = openSub === subKey || !!search || !sub.name
                      return (
                        <div key={sub.name || '__root'} className="mb-3">
                          {sub.name && (
                            <button
                              onClick={() => !search && setOpenSub(subOpen ? null : subKey)}
                              className="w-full flex items-center gap-2 mb-2 text-left">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                                style={{ transform: subOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                                <path d="M3 2l4 3-4 3" stroke={srv.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="text-xs font-semibold tracking-wide uppercase"
                                style={{ color: srv.color, opacity: 0.8 }}>
                                {tSef(sub.name, lang)}
                              </span>
                              <div className="h-px flex-1" style={{ background: `${srv.color}20` }} />
                              <span className="text-xs" style={{ color: srv.color, opacity: 0.5 }}>{sub.items.length}</span>
                            </button>
                          )}
                          {(subOpen || !sub.name) && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {sub.items.map(item => (
                                <button key={item.ref} onClick={() => onSelectRef(item.ref)}
                                  className="text-left p-3 rounded-xl transition-all duration-200"
                                  style={{ background: cardDefault.bg, border: `1px solid ${cardDefault.border}` }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = `${srv.color}12`
                                    e.currentTarget.style.borderColor = `${srv.color}30`
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = cardDefault.bg
                                    e.currentTarget.style.borderColor = cardDefault.border
                                  }}>
                                  {item.heTitle && (
                                    <div className="hebrew text-sm mb-1 leading-tight" style={{ color: srv.color }}>{item.heTitle}</div>
                                  )}
                                  <div className="text-xs font-medium" style={{ color: item.heTitle ? 'var(--text-2)' : 'var(--text)' }}>
                                    {tSef(item.title, lang)}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Siddur Shabbat List View ──────────────────────────────────────────────

function SiddurShabbatListView({ nusach, onSelectRef, onChangeNusach, onChangeDay, initialSearch = '' }) {
  const { isDark } = useTheme()
  const { t, lang } = useLang()
  const [search, setSearch] = useState(initialSearch)
  const [openService, setOpenService] = useState(null)
  const [openSub, setOpenSub] = useState(null)

  const { services, loading, error } = useSiddurShabbatIndex(nusach)

  const filteredServices = useMemo(() => {
    if (!services) return []
    if (!search) return services
    const q = search.toLowerCase()
    return services.map(srv => {
      const filteredSubs = srv.subsections
        .map(sub => ({
          ...sub,
          items: sub.items.filter(item =>
            item.title.toLowerCase().includes(q) || item.heTitle.includes(search)
          ),
        }))
        .filter(sub => sub.items.length > 0)
      const total = filteredSubs.reduce((n, s) => n + s.items.length, 0)
      return { ...srv, subsections: filteredSubs, total }
    }).filter(srv => srv.total > 0)
  }, [services, search])

  const cardDefault = isDark
    ? { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)' }
    : { bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.07)' }

  const nusachHeb   = nusach === 'ashkenaz' ? 'אַשְׁכְּנַז' : 'סְפָרַד'
  const nusachLabel = nusach === 'ashkenaz' ? 'Ashkenaz' : 'Sefard'

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-8 fade-up-1">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button onClick={onChangeDay}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7 2L3 5l4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('siddur_change_day')}
          </button>
          <button onClick={onChangeNusach}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {t('siddur_change_nusach')}
          </button>
        </div>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          סִדּוּר · Siddur
        </p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>{t('nav_tefila')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          {t('siddur_nusach_label')} <span className="hebrew">{nusachHeb}</span> · {nusachLabel} · <span style={{ color: '#6366f1' }}>{t('siddur_shabat_title')}</span>
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-7 fade-up-2">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4" stroke="var(--text-3)" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12 12" stroke="var(--text-3)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('siddur_search')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 fade-up-3">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(99,102,241,0.25)', borderTopColor: '#6366f1' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('siddur_loading')}</p>
        </div>
      )}

      {error && !loading && (
        <div className="py-10 text-center fade-up-3">
          <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t('siddur_error')}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && filteredServices.length === 0 && (
        <div className="py-10 text-center fade-up-3">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{search ? t('siddur_no_results') || 'Sin resultados' : 'No se encontraron tefilot de Shabat en este siddur.'}</p>
        </div>
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <div className="flex flex-col gap-2.5 fade-up-3">
          {filteredServices.map(srv => {
            const isOpen = openService === srv.id || !!search
            return (
              <div key={srv.id} className="rounded-2xl overflow-hidden transition-all"
                style={{ border: `1px solid ${isOpen ? srv.color + '30' : 'var(--border)'}` }}>
                <button
                  onClick={() => setOpenService(isOpen ? null : srv.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{ background: isOpen ? `${srv.color}0d` : 'var(--bg-card)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: srv.color }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{srv.name}</span>
                        <span className="hebrew text-sm" style={{ color: srv.color }}>{srv.heb}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{srv.total} {t('siddur_sections')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${srv.color}15`, color: srv.color, border: `1px solid ${srv.color}20` }}>
                      {srv.total}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: 'var(--text-muted)' }}>
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2" style={{ background: 'var(--bg-card)' }}>
                    {srv.subsections.map(sub => {
                      const subKey = `${srv.id}:${sub.name}`
                      const subOpen = openSub === subKey || !sub.name
                      return (
                        <div key={sub.name || '__root'} className="mb-3">
                          {sub.name && (
                            <button
                              onClick={() => setOpenSub(subOpen ? null : subKey)}
                              className="w-full flex items-center gap-2 mb-2 text-left">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                                style={{ transform: subOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                                <path d="M3 2l4 3-4 3" stroke={srv.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="text-xs font-semibold tracking-wide uppercase"
                                style={{ color: srv.color, opacity: 0.8 }}>
                                {tSef(sub.name, lang)}
                              </span>
                              <div className="h-px flex-1" style={{ background: `${srv.color}20` }} />
                              <span className="text-xs" style={{ color: srv.color, opacity: 0.5 }}>{sub.items.length}</span>
                            </button>
                          )}
                          {(subOpen || !sub.name) && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {sub.items.map(item => (
                                <button key={item.ref} onClick={() => onSelectRef(item.ref)}
                                  className="text-left p-3 rounded-xl transition-all duration-200"
                                  style={{ background: cardDefault.bg, border: `1px solid ${cardDefault.border}` }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = `${srv.color}12`
                                    e.currentTarget.style.borderColor = `${srv.color}30`
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = cardDefault.bg
                                    e.currentTarget.style.borderColor = cardDefault.border
                                  }}>
                                  {item.heTitle && (
                                    <div className="hebrew text-sm mb-1 leading-tight" style={{ color: srv.color }}>{item.heTitle}</div>
                                  )}
                                  <div className="text-xs font-medium" style={{ color: item.heTitle ? 'var(--text-2)' : 'var(--text)' }}>
                                    {tSef(item.title, lang)}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Siddur Reader View ────────────────────────────────────────────────────

function SiddurReaderView({ nusach, day, sefRef, guestMode, isSubscribed, onBack, onNavigate, isTeacher }) {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const isAdmin = user?.id === ADMIN_USER_ID
  const [hwOpen, setHwOpen] = useState(false)
  const [adminUploadOpen, setAdminUploadOpen] = useState(false)
  const { services: weekdayServices } = useSiddurIndex(nusach)
  const { services: shabbatServices } = useSiddurShabbatIndex(nusach)
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
  const displayName = berajotData?.name || tSef(section?.title, lang) || sefRef.split(', ').pop()
  const displayHeb  = berajotData?.heTitle || section?.heTitle || ''
  const color       = service?.color || '#10b981'

  const aliyot = useMemo(() => {
    if (berajotData) return berajotData.aliyot
    return [{ n: 1, label: displayName, ref: sefRef }]
  }, [sefRef, displayName, berajotData])

  const parasha = useMemo(() => ({
    id: sefRef,
    name: displayName,
    heb: displayHeb,
    color,
    aliyot,
  }), [sefRef, displayName, displayHeb, color, aliyot])

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ height: '100%' }}>
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 flex-wrap"
        style={{ background: 'var(--overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={onBack}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('nav_tefila')}
        </button>
        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {service?.name && `${service.name} · `}
          <span className="hebrew" style={{ color }}>{displayHeb || displayName}</span>
        </span>

        <div className="ml-auto flex gap-2 items-center">
          {isAdmin && (
            <button onClick={() => setAdminUploadOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v6M2.5 4l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Audio admin
            </button>
          )}
          {isTeacher && !isBerajot && (
            <button onClick={() => setHwOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
              style={{ background: 'rgba(108,51,230,0.12)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.3)' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 10l1.5-3.5L9 2 9.5 2.5 3 9.5 1 10z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                <path d="M7 2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              Deber
            </button>
          )}
          {prev && (
            <button onClick={() => onNavigate(prev.ref)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              ← {tSef(prev.title, lang)}
            </button>
          )}
          {next && (
            <button onClick={() => onNavigate(next.ref)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
              {tSef(next.title, lang)} →
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ParashaReader
          parasha={parasha}
          guestMode={guestMode}
          isSubscribed={isSubscribed}
          initialAliyah={0}
          availableModes={['nikkud', 'audio']}
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
      {adminUploadOpen && (
        <AdminAudioUpload
          parashaId={sefRef}
          aliyahIdx={0}
          aliyahRef={sefRef}
          onClose={() => setAdminUploadOpen(false)}
          onSaved={() => setAdminUploadOpen(false)}
        />
      )}
    </div>
  )
}
