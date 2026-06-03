import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { PARASHOT } from '../../data/parashot'

const ADMIN_USER_ID = '1f4d0329-ddf5-48a4-965f-5f37d7416447'
const LABELS = ['Ashkenazi', 'Sefardi', 'Mizrahi', 'Yemenite']

export default function AdminPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()
  const { t } = useLang()

  const [tab, setTab] = useState('users')

  // ── Users ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState({})
  const [results, setResults] = useState({})

  // ── Audios ─────────────────────────────────────────────────────────────────
  const [audios, setAudios] = useState([])
  const [audiosFetching, setAudiosFetching] = useState(true)
  const [audioFilter, setAudioFilter] = useState('')

  // Upload form
  const [upParasha, setUpParasha] = useState('')
  const [upAliyah, setUpAliyah] = useState(0)
  const [upLabel, setUpLabel] = useState('Ashkenazi')
  const [upFile, setUpFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [upError, setUpError] = useState('')
  const [upSuccess, setUpSuccess] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user || user.id !== ADMIN_USER_ID) { navigate('/login', { replace: true }); return }
    loadUsers()
    loadAudios()
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

  async function loadAudios() {
    setAudiosFetching(true)
    const { data } = await supabase
      .from('public_audios')
      .select('parasha_id, aliyah_idx, label, anchor_pct, needs_review, public_url')
      .order('parasha_id').order('aliyah_idx').order('label')
    setAudios(data || [])
    setAudiosFetching(false)
  }

  async function sendWelcome(userId, plan) {
    setSending(s => ({ ...s, [userId]: true }))
    setResults(r => ({ ...r, [userId]: null }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
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

  async function handleUpload(e) {
    e.preventDefault()
    if (!upFile || !upParasha) { setUpError('Elige parashá y archivo'); return }
    setUploading(true)
    setUpError('')
    setUpSuccess('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }

      // 1. Get signed upload URL
      const urlRes = await fetch('/api/admin-audio-upload-url', {
        method: 'POST', headers,
        body: JSON.stringify({ parashaId: upParasha, aliyahIdx: upAliyah, label: upLabel }),
      })
      const urlData = await urlRes.json()
      if (!urlRes.ok || urlData.error) throw new Error(urlData.error || 'Error obteniendo URL')

      // 2. Upload file directly to Supabase storage
      const { error: uploadErr } = await supabase.storage
        .from('public-audios')
        .uploadToSignedUrl(urlData.storagePath, urlData.token, upFile, { upsert: true })
      if (uploadErr) throw new Error(uploadErr.message)

      // 3. Save DB record
      const saveRes = await fetch('/api/admin-audio-save', {
        method: 'POST', headers,
        body: JSON.stringify({ parashaId: upParasha, aliyahIdx: upAliyah, label: upLabel, publicUrl: urlData.publicUrl }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || saveData.error) throw new Error(saveData.error || 'Error guardando')

      const parashaName = PARASHOT.find(p => p.id === upParasha)?.name || upParasha
      setUpSuccess(`✓ ${parashaName} aliyá ${upAliyah + 1} (${upLabel}) subido. Marca needs_review=true — ejecuta el script de resync para añadir timestamps.`)
      setUpFile(null)
      await loadAudios()
    } catch (err) {
      setUpError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
  })
  const sorted = [...filteredUsers.filter(u => u.role === 'student'), ...filteredUsers.filter(u => u.role === 'teacher')]

  const filteredAudios = useMemo(() => {
    if (!audioFilter) return audios
    const q = audioFilter.toLowerCase()
    return audios.filter(a => a.parasha_id.includes(q) || a.label.toLowerCase().includes(q))
  }, [audios, audioFilter])

  const parashaName = (id) => PARASHOT.find(p => p.id === id)?.name || id
  const anchorColor = (pct) => {
    if (pct == null) return 'var(--text-muted)'
    if (pct >= 0.7) return '#22c55e'
    if (pct >= 0.4) return '#f59e0b'
    return '#ef4444'
  }

  const selectedParasha = PARASHOT.find(p => p.id === upParasha)

  if (loading || (!user && !loading)) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-gold)' }}>Admin · Perashapp</p>
            <h1 className="text-2xl font-light" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>{t('admin_panel_title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-xl text-xs"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={tab === 'users' ? loadUsers : loadAudios} disabled={fetching || audiosFetching}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
              <RefreshIcon spinning={fetching || audiosFetching} />
              {t('admin_refresh')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {[['users', t('admin_users_tab')], ['audios', t('admin_audios_tab')]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                background: tab === id ? 'rgba(108,51,230,0.15)' : 'transparent',
                color: tab === id ? '#8b5cf6' : 'var(--text-3)',
                border: tab === id ? '1px solid rgba(108,51,230,0.25)' : '1px solid transparent',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: t('admin_total_users'), value: users.length },
                { label: t('role_student_label'), value: users.filter(u => u.role === 'student').length },
                { label: t('admin_subscribed'), value: users.filter(u => u.subscription_status === 'active').length },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="text-2xl font-light mb-0.5" style={{ color: 'var(--text)' }}>{s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="relative mb-4">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="var(--text-3)" strokeWidth="1.3"/>
                  <path d="M9 9L12 12" stroke="var(--text-3)" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('admin_search_users')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-20"><Spinner /></div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
                      {[t('admin_col_user'), 'Email', t('admin_col_role'), t('admin_col_subscription'), t('admin_col_plan'), t('admin_col_action')].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((u, i) => {
                      const isActive = u.subscription_status === 'active'
                      const result = results[u.id]
                      return (
                        <tr key={u.id} style={{
                          borderBottom: i < sorted.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent',
                        }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: 'rgba(108,51,230,0.2)', color: '#a78bfa' }}>
                                {u.name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <span className="font-medium text-xs" style={{ color: 'var(--text)' }}>{u.name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text-3)' }}>{u.email ?? '—'}</span></td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: u.role === 'teacher' ? 'rgba(34,197,94,0.1)' : 'rgba(108,51,230,0.1)', color: u.role === 'teacher' ? '#22c55e' : '#8b5cf6' }}>
                              {u.role === 'teacher' ? t('role_teacher_label') : t('role_student_label')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,100,100,0.1)', color: isActive ? '#22c55e' : 'var(--text-muted)' }}>
                              {u.subscription_status ?? t('admin_no_subscription')}
                            </span>
                          </td>
                          <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text-3)' }}>{u.subscription_plan === 'annual' ? t('annual_plan') : u.subscription_plan === 'monthly' ? t('monthly_plan') : '—'}</span></td>
                          <td className="px-4 py-3">
                            {u.role === 'student' ? (
                              <div className="flex items-center gap-2">
                                <button disabled={sending[u.id]} onClick={() => sendWelcome(u.id, u.subscription_plan || 'monthly')}
                                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5"
                                  style={{ background: sending[u.id] ? 'var(--bg-deep)' : 'rgba(108,51,230,0.1)', color: sending[u.id] ? 'var(--text-muted)' : '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)', opacity: sending[u.id] ? 0.7 : 1 }}>
                                  {sending[u.id] ? <><MiniSpinner /> {t('admin_sending')}</> : <>✉️ {t('admin_send_welcome')}</>}
                                </button>
                                {result === 'ok' && <span className="text-xs" style={{ color: '#22c55e' }}>{t('admin_sent_ok')}</span>}
                                {result === 'error' && <span className="text-xs" style={{ color: '#ef4444' }}>✗ Error</span>}
                              </div>
                            ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                    {sorted.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('admin_no_users')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── AUDIOS TAB ────────────────────────────────────────────────────── */}
        {tab === 'audios' && (
          <>
            {/* Upload form */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('admin_upload_audio')}</h2>
              <form onSubmit={handleUpload} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Parasha */}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>{t('parasha_label')}</label>
                    <select value={upParasha} onChange={e => setUpParasha(e.target.value)} required
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                      <option value="">{t('choose_option')}</option>
                      {PARASHOT.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {p.heb}</option>
                      ))}
                    </select>
                  </div>

                  {/* Aliyah */}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>{t('aliyah_form_label')}</label>
                    <select value={upAliyah} onChange={e => setUpAliyah(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                      {(selectedParasha?.aliyot || Array.from({ length: 7 }, (_, i) => ({ n: i + 1, label: `${i + 1}ª Aliyá` }))).map((a, i) => (
                        <option key={i} value={i}>{a.label}{a.ref ? ` (${a.ref})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Label */}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>{t('nusach_label')}</label>
                    <select value={upLabel} onChange={e => setUpLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                      {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* File */}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>{t('audio_file_label')}</label>
                  <input type="file" accept="audio/*,.m4a,.mp3,.webm"
                    onChange={e => setUpFile(e.target.files?.[0] || null)}
                    className="w-full text-xs"
                    style={{ color: 'var(--text)' }} />
                  {upFile && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{upFile.name} — {(upFile.size / 1e6).toFixed(1)} MB</p>}
                </div>

                {upError && <p className="text-xs px-1" style={{ color: '#ef4444' }}>{upError}</p>}
                {upSuccess && <p className="text-xs px-1" style={{ color: '#22c55e' }}>{upSuccess}</p>}

                <button type="submit" disabled={uploading || !upFile || !upParasha}
                  className="self-start text-xs px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
                  style={{
                    background: uploading || !upFile || !upParasha ? 'var(--bg-deep)' : 'rgba(108,51,230,0.15)',
                    color: uploading || !upFile || !upParasha ? 'var(--text-muted)' : '#8b5cf6',
                    border: '1px solid rgba(108,51,230,0.25)',
                    opacity: uploading || !upFile || !upParasha ? 0.6 : 1,
                  }}>
                  {uploading ? <><MiniSpinner /> {t('admin_uploading')}</> : t('admin_upload_btn')}
                </button>
              </form>
            </div>

            {/* Audios table */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {t('admin_audios_count').replace('{n}', audios.length)}
              </p>
              <div className="relative">
                <input value={audioFilter} onChange={e => setAudioFilter(e.target.value)}
                  placeholder={t('admin_filter_audios')}
                  className="pl-8 pr-4 py-2 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', width: 220 }} />
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <circle cx="5.5" cy="5.5" r="3.5" stroke="var(--text-3)" strokeWidth="1.2"/>
                  <path d="M8 8L11 11" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {audiosFetching ? (
              <div className="flex items-center justify-center py-20"><Spinner /></div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
                      {[t('parasha_label'), t('aliyah_form_label'), 'Label', 'Anchor %', 'Review', 'URL'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudios.map((a, i) => (
                      <tr key={`${a.parasha_id}-${a.aliyah_idx}-${a.label}`}
                        style={{
                          borderBottom: i < filteredAudios.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent',
                        }}>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{parashaName(a.parasha_id)}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                            {a.aliyah_idx + 1}ª
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.15)' }}>
                            {a.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium" style={{ color: anchorColor(a.anchor_pct) }}>
                            {a.anchor_pct != null ? `${Math.round(a.anchor_pct * 100)}%` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {a.needs_review
                            ? <span className="text-xs" style={{ color: '#f59e0b' }}>⚠ Revisar</span>
                            : <span className="text-xs" style={{ color: '#22c55e' }}>✓ OK</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <a href={a.public_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs underline" style={{ color: 'var(--text-3)' }}>
                            Abrir
                          </a>
                        </td>
                      </tr>
                    ))}
                    {filteredAudios.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('admin_no_audios')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
