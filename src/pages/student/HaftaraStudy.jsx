import { useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { BOOK_COLORS, SEFARIM_LIST } from '../../data/parashot'
import { MOADIM_LIST } from '../../data/moadim'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import ParashaReader from '../../components/ParashaReader'

const HAFTARA_BOOKS = SEFARIM_LIST.map(s => s.id)

export default function HaftaraStudy({ basePath = '/student/haftara' }) {
  const { haftaraId } = useParams()
  const { profile } = useAuth()
  const haftara = haftaraId ? ALL_HAFTAROT.find(h => h.id === haftaraId) : null

  const isTeacher = profile?.role === 'teacher'
  const isSubscribed = isTeacher || profile?.subscription_status === 'active'
  const isGuest = basePath.startsWith('/guest')
  const guestMode = isGuest || !isSubscribed

  if (haftara) return <ReaderView haftara={haftara} basePath={basePath} guestMode={guestMode} isSubscribed={isSubscribed} />
  return <ListView basePath={basePath} guestMode={guestMode} />
}

function ListView({ basePath }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [openBook, setOpenBook] = useState('bereshit')
  const [openChag, setOpenChag] = useState(null)

  const weeklyHaftarot = useMemo(() => ALL_HAFTAROT.filter(h => !h.chag), [])
  const holidayHaftarot = useMemo(() => ALL_HAFTAROT.filter(h => !!h.chag), [])

  const filteredWeekly = useMemo(() => {
    if (!search) return weeklyHaftarot
    const q = search.toLowerCase()
    return weeklyHaftarot.filter(h =>
      h.name.toLowerCase().includes(q) || h.heb.includes(search)
    )
  }, [search, weeklyHaftarot])

  const filteredHoliday = useMemo(() => {
    if (!search) return holidayHaftarot
    const q = search.toLowerCase()
    return holidayHaftarot.filter(h =>
      h.name.toLowerCase().includes(q) || h.heb.includes(search)
    )
  }, [search, holidayHaftarot])

  const byBook = useMemo(() => {
    return SEFARIM_LIST.map(s => ({
      ...s,
      haftarot: filteredWeekly.filter(h => h.book === s.id),
    })).filter(s => s.haftarot.length > 0)
  }, [filteredWeekly])

  const byChag = useMemo(() => {
    return MOADIM_LIST.map(m => ({
      ...m,
      haftarot: filteredHoliday.filter(h => h.chag === m.id),
    })).filter(m => m.haftarot.length > 0)
  }, [filteredHoliday])

  const cardDefault = isDark
    ? { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)' }
    : { bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.07)' }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הַפְטָרָה · Profetas
        </p>
        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Estudiar Haftará
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Las 54 haftarot semanales y las lecturas de festividades
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
          placeholder="Buscar haftará..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
      </div>

      {/* ── Haftarot semanales por libro ─────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 fade-up-3">
        {byBook.map(book => {
          const isOpen = openBook === book.id || !!search
          const color = BOOK_COLORS[book.id] || '#6c33e6'
          return (
            <div key={book.id} className="rounded-2xl overflow-hidden transition-all"
              style={{ border: `1px solid ${isOpen ? color + '30' : 'var(--border)'}` }}>
              <button onClick={() => !search && setOpenBook(isOpen ? null : book.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                style={{ background: isOpen ? `${color}0d` : 'var(--bg-card)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{book.name}</span>
                      <span className="hebrew text-sm" style={{ color }}>{book.heb}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {book.haftarot.length} haftarot
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}20` }}>
                    {book.haftarot.length}
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
                    {book.haftarot.map(h => (
                      <button key={h.id} onClick={() => navigate(`${basePath}/${h.id}`)}
                        className="text-left p-3 rounded-xl transition-all duration-200"
                        style={{ background: cardDefault.bg, border: `1px solid ${cardDefault.border}` }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = `${color}12`
                          e.currentTarget.style.borderColor = `${color}30`
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = cardDefault.bg
                          e.currentTarget.style.borderColor = cardDefault.border
                        }}>
                        <div className="hebrew text-sm mb-1" style={{ color }}>{h.heb}</div>
                        <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{h.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {h.aliyot[0]?.ref}
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

      {/* ── Haftarot de festividades ─────────────────────────────────────── */}
      {byChag.length > 0 && (
        <div className="mt-6 fade-up-3">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-gold)' }}>
              מוֹעֲדִים · Haftarot de festividades
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
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: chag.color }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{chag.name}</span>
                          <span className="hebrew text-sm" style={{ color: chag.color }}>{chag.heb}</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {chag.haftarot.length} haftarot
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${chag.color}15`, color: chag.color, border: `1px solid ${chag.color}20` }}>
                        {chag.haftarot.length}
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
                        {chag.haftarot.map(h => (
                          <button key={h.id} onClick={() => navigate(`${basePath}/${h.id}`)}
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
                            <div className="hebrew text-sm mb-1" style={{ color: chag.color }}>{h.heb}</div>
                            <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{h.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {h.aliyot[0]?.ref}
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
    </div>
  )
}

function ReaderView({ haftara, basePath, guestMode, isSubscribed }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialAliyah = Math.min(
    Math.max(0, parseInt(searchParams.get('aliyah') || '0', 10)),
    haftara.aliyot.length - 1
  )
  const color = haftara.color || BOOK_COLORS[haftara.book] || '#6c33e6'

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ height: '100%' }}>
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3"
        style={{ background: 'var(--overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate(basePath)}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Todas las haftarot
        </button>
        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {haftara.chag ? 'Haftará de festividad · מוֹעֲדִים' : 'Haftará semanal · הַפְטָרָה'}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <ParashaReader parasha={haftara} guestMode={guestMode} isSubscribed={isSubscribed} initialAliyah={initialAliyah} availableModes={['nikkud']} />
      </div>
    </div>
  )
}
