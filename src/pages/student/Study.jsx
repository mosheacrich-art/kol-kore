import { useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PARASHOT, ALL_PARASHOT, COMBINED_PARASHOT, SEFARIM_LIST, BOOK_COLORS } from '../../data/parashot'
import { useAudio } from '../../context/AudioContext'
import { useTheme } from '../../context/ThemeContext'
import ParashaReader from '../../components/ParashaReader'

export default function StudentStudy({ basePath = '/student/study' }) {
  const { parashaId } = useParams()
  const parasha = parashaId ? ALL_PARASHOT.find(p => p.id === parashaId) : null

  const guestMode = basePath.startsWith('/guest')
  if (parasha) return <ReaderView parasha={parasha} basePath={basePath} guestMode={guestMode} />
  return <ListView basePath={basePath} guestMode={guestMode} />
}

function ListView({ basePath, guestMode }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
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
          Todas las Perashiot
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          54 perashiot · Texto completo con Sefaria · Selecciona para leer
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
          placeholder="Buscar perashá"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }} />
      </div>

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
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{book.en} · {book.parashot.length} perashiot</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
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
                        <button key={p.id} onClick={() => navigate(`${basePath}/${p.id}`)}
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
                              {hasAudio && !guestMode && (
                                <span title="Audio disponible">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 3.5v3L5 8V2L2 3.5z" fill="#6c33e6"/>
                                    <path d="M7 3.5c.6.4 1 1.1 1 1.5s-.4 1.1-1 1.5" stroke="#6c33e6" strokeWidth="0.8" strokeLinecap="round"/>
                                  </svg>
                                </span>
                              )}
                              {p.combined
                                ? <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                    style={{ background: `${color}20`, color, fontSize: '9px' }}>Doble</span>
                                : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.num}</span>
                              }
                            </div>
                          </div>
                          <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{p.name}</div>
                          <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4h6M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Leer
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
    </div>
  )
}

function ReaderView({ parasha, basePath, guestMode }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialAliyah = Math.min(
    Math.max(0, parseInt(searchParams.get('aliyah') || '0', 10)),
    parasha.aliyot.length - 1
  )
  const color = BOOK_COLORS[parasha.book] || '#6c33e6'

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
          Todas las perashiot
        </button>
        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {parasha.combined ? 'Perashá doble' : `Perashá ${parasha.num} de 54`}
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
        <ParashaReader parasha={parasha} guestMode={guestMode} initialAliyah={initialAliyah} />
      </div>
    </div>
  )
}
