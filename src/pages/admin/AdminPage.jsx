import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()

  const [users, setUsers] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState({})   // { [userId]: true/false }
  const [results, setResults] = useState({})   // { [userId]: 'ok'|'error' }

  useEffect(() => {
    if (loading) return
    if (!user || user.id !== ADMIN_USER_ID) { navigate('/login', { replace: true }); return }
    loadUsers()
  }, [user, loading])

  async function loadUsers() {
    setFetching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin-users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  async function sendWelcome(userId, plan) {
    setSending(s => ({ ...s, [userId]: true }))
    setResults(r => ({ ...r, [userId]: null }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/send-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, plan }),
      })
      const data = await res.json()
      setResults(r => ({ ...r, [userId]: res.ok ? 'ok' : 'error' }))
      if (!res.ok) console.error(data)
    } catch {
      setResults(r => ({ ...r, [userId]: 'error' }))
    } finally {
      setSending(s => ({ ...s, [userId]: false }))
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  const students = filtered.filter(u => u.role === 'student')
  const teachers = filtered.filter(u => u.role === 'teacher')
  const sorted = [...students, ...teachers]

  if (loading || (!user && !loading)) return <Spinner />

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-gold)' }}>
              Admin · Perashapp
            </p>
            <h1 className="text-2xl font-light" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
              Usuarios
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-xl text-xs"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={loadUsers} disabled={fetching}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
              <RefreshIcon spinning={fetching} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total usuarios', value: users.length },
            { label: 'Alumnos', value: users.filter(u => u.role === 'student').length },
            { label: 'Suscritos', value: users.filter(u => u.subscription_status === 'active').length },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-2xl font-light mb-0.5" style={{ color: 'var(--text)' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4" stroke="var(--text-3)" strokeWidth="1.3"/>
              <path d="M9 9L12 12" stroke="var(--text-3)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o rol…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        {/* Table */}
        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
                  {['Usuario', 'Email', 'Rol', 'Suscripción', 'Plan', 'Acción'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                      style={{ color: 'var(--text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((u, i) => {
                  const isActive = u.subscription_status === 'active'
                  const result = results[u.id]
                  return (
                    <tr key={u.id}
                      style={{
                        borderBottom: i < sorted.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent',
                      }}>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(108,51,230,0.2)', color: '#a78bfa' }}>
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium text-xs" style={{ color: 'var(--text)' }}>
                            {u.name ?? '—'}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {u.email ?? '—'}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: u.role === 'teacher' ? 'rgba(34,197,94,0.1)' : 'rgba(108,51,230,0.1)',
                            color: u.role === 'teacher' ? '#22c55e' : '#8b5cf6',
                          }}>
                          {u.role === 'teacher' ? 'Profesor' : 'Alumno'}
                        </span>
                      </td>

                      {/* Subscription */}
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,100,100,0.1)',
                            color: isActive ? '#22c55e' : 'var(--text-muted)',
                          }}>
                          {u.subscription_status ?? 'Sin suscripción'}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {u.subscription_plan === 'annual' ? 'Anual' : u.subscription_plan === 'monthly' ? 'Mensual' : '—'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        {u.role === 'student' ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={sending[u.id]}
                              onClick={() => sendWelcome(u.id, u.subscription_plan || 'monthly')}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5"
                              style={{
                                background: sending[u.id] ? 'var(--bg-deep)' : 'rgba(108,51,230,0.1)',
                                color: sending[u.id] ? 'var(--text-muted)' : '#8b5cf6',
                                border: '1px solid rgba(108,51,230,0.2)',
                                opacity: sending[u.id] ? 0.7 : 1,
                              }}>
                              {sending[u.id] ? (
                                <><MiniSpinner /> Enviando…</>
                              ) : (
                                <>✉️ Enviar bienvenida</>
                              )}
                            </button>
                            {result === 'ok' && (
                              <span className="text-xs" style={{ color: '#22c55e' }}>✓ Enviado</span>
                            )}
                            {result === 'error' && (
                              <span className="text-xs" style={{ color: '#ef4444' }}>✗ Error</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No hay usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
      style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#6c33e6' }} />
  )
}

function MiniSpinner() {
  return (
    <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
      style={{ borderColor: 'rgba(139,92,246,0.4)', borderTopColor: '#8b5cf6' }} />
  )
}

function RefreshIcon({ spinning }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
      style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}>
      <path d="M11 6.5A4.5 4.5 0 112 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M11 3v3.5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
