import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import ParashaReader from '../../components/ParashaReader'
import { useSiddurIndex, BERAJOT_INLINE } from '../../hooks/useSefaria'

export default function TefilaStudy({ basePath = '/student/tefila' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()

  const nusach = searchParams.get('n')  // 'ashkenaz' | 'sefard' | null
  const sefRef = searchParams.get('r')  // full Sefaria ref | null

  const isTeacher = profile?.role === 'teacher'
  const isSubscribed = isTeacher || profile?.subscription_status === 'active'
  const isGuest = basePath.startsWith('/guest')
  const guestMode = isGuest || !isSubscribed

  const selectNusach = useCallback(n => setSearchParams({ n }), [setSearchParams])
  const selectSection = useCallback(r => setSearchParams({ n: nusach, r }), [setSearchParams, nusach])
  const backToList   = useCallback(() => setSearchParams({ n: nusach }), [setSearchParams, nusach])
  const changeNusach = useCallback(() => setSearchParams({}), [setSearchParams])

  if (!nusach) return <NusachPicker onSelect={selectNusach} />
  if (sefRef) return (
    <SiddurReaderView
      nusach={nusach} sefRef={sefRef}
      guestMode={guestMode} isSubscribed={isSubscribed}
      onBack={backToList}
      onNavigate={r => setSearchParams({ n: nusach, r })}
    />
  )
  return <SiddurListView nusach={nusach} onSelectRef={selectSection} onChangeNusach={changeNusach} />
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

function NusachPicker({ onSelect }) {
  const { t } = useLang()
  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          סִדּוּר · Siddur
        </p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>{t('nav_tefila')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('siddur_pick_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 fade-up-2">
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

// ── Siddur List View ──────────────────────────────────────────────────────

function SiddurListView({ nusach, onSelectRef, onChangeNusach }) {
  const { isDark } = useTheme()
  const { t } = useLang()
  const [search, setSearch] = useState('')
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
        <button onClick={onChangeNusach}
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
          {t('siddur_nusach_label')} <span className="hebrew">{nusachHeb}</span> · {nusachLabel}
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
                                {sub.name}
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
                                    {item.title}
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

function SiddurReaderView({ nusach, sefRef, guestMode, isSubscribed, onBack, onNavigate }) {
  const { t } = useLang()
  const { services } = useSiddurIndex(nusach)

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
  const displayName = berajotData?.name || section?.title || sefRef.split(', ').pop()
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

        <div className="ml-auto flex gap-2">
          {prev && (
            <button onClick={() => onNavigate(prev.ref)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              ← {prev.title}
            </button>
          )}
          {next && (
            <button onClick={() => onNavigate(next.ref)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
              {next.title} →
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
          availableModes={['nikkud']}
        />
      </div>
    </div>
  )
}
