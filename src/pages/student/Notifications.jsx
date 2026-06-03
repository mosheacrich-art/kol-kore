import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

export default function StudentNotifications() {
  const { profile } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [tab, setTab] = useState('homework')
  const [homework, setHomework] = useState([])
  const [evals, setEvals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('student_id', profile.id)
        .eq('type', 'homework')
        .order('created_at', { ascending: false }),
      supabase
        .from('notifications')
        .select('*')
        .eq('student_id', profile.id)
        .eq('type', 'evaluation')
        .order('created_at', { ascending: false }),
    ]).then(([hwRes, evRes]) => {
      setHomework(hwRes.data || [])
      setEvals(evRes.data || [])
      setLoading(false)
    })
  }, [profile?.id])

  const markRead = async (id, listSetter) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('student_id', profile.id)
    listSetter(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async (list, listSetter) => {
    const unreadIds = list.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)
      .eq('student_id', profile.id)
    listSetter(prev => prev.map(n => ({ ...n, read: true })))
  }

  const hwUnread = homework.filter(n => !n.read).length
  const evUnread = evals.filter(n => !n.read).length

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 fade-up-1">
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Notificaciones
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 fade-up-2">
        <button
          onClick={() => setTab('homework')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: tab === 'homework' ? 'rgba(108,51,230,0.13)' : 'var(--bg-card)',
            color: tab === 'homework' ? '#8b5cf6' : 'var(--text-3)',
            border: `1px solid ${tab === 'homework' ? 'rgba(108,51,230,0.3)' : 'var(--border)'}`,
          }}>
          Deberes
          {hwUnread > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: '#ef4444', color: '#fff' }}>
              {hwUnread > 9 ? '9+' : hwUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('evaluations')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: tab === 'evaluations' ? 'rgba(108,51,230,0.13)' : 'var(--bg-card)',
            color: tab === 'evaluations' ? '#8b5cf6' : 'var(--text-3)',
            border: `1px solid ${tab === 'evaluations' ? 'rgba(108,51,230,0.3)' : 'var(--border)'}`,
          }}>
          Evaluaciones
          {evUnread > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: '#ef4444', color: '#fff' }}>
              {evUnread > 9 ? '9+' : evUnread}
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
        </div>
      )}

      {/* ── Deberes tab ──────────────────────────────────────────────────── */}
      {!loading && tab === 'homework' && (
        <div className="fade-up-3">
          {homework.length > 0 && hwUnread > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => markAllRead(homework, setHomework)}
                className="text-xs px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                Marcar todas como leídas
              </button>
            </div>
          )}

          {homework.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="9" y="3" width="6" height="4" rx="1" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5"/>
                  <path d="M9 12h6M9 16h4" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin deberes por ahora</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Aquí aparecerán las tareas que te envíe tu profesor</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {homework.map(hw => {
              const aliyahIdx = hw.aliyah_idx ?? (hw.aliyah_label ? parseInt(hw.aliyah_label.match(/\d+/)?.[0] ?? '1', 10) - 1 : null)
              const canNavigate = !!hw.parasha_id
              return (
              <div key={hw.id}
                className={`rounded-2xl p-5 flex flex-col gap-2 relative${canNavigate ? ' cursor-pointer' : ''}`}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${!hw.read ? 'rgba(108,51,230,0.3)' : 'var(--border-subtle)'}`,
                }}
                onClick={canNavigate ? () => {
                  if (!hw.read) markRead(hw.id, setHomework)
                  navigate(`/student/study/${hw.parasha_id}?aliyah=${aliyahIdx ?? 0}`)
                } : undefined}>
                {/* Unread dot */}
                {!hw.read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full"
                    style={{ background: '#8b5cf6' }} />
                )}

                <p className="text-sm font-medium pr-5" style={{ color: 'var(--text)' }}>{hw.message}</p>

                {(hw.parasha_id || hw.aliyah_label) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hw.parasha_id && (
                      <span className="text-xs px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
                        {hw.parasha_id}
                      </span>
                    )}
                    {hw.aliyah_label && (
                      <span className="text-xs px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1px solid rgba(245,158,11,0.15)' }}>
                        {hw.aliyah_label}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(hw.created_at)}</span>
                  {!hw.read && (
                    <button
                      onClick={e => { e.stopPropagation(); markRead(hw.id, setHomework) }}
                      className="text-xs px-3 py-1 rounded-lg transition-all"
                      style={{ background: 'rgba(108,51,230,0.08)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Evaluaciones tab ─────────────────────────────────────────────── */}
      {!loading && tab === 'evaluations' && (
        <div className="fade-up-3">
          {evals.length > 0 && evUnread > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => markAllRead(evals, setEvals)}
                className="text-xs px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                Marcar todas como leídas
              </button>
            </div>
          )}

          {evals.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3L22 4" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('no_notifs')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('no_notifs_student_desc')}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {evals.map(ev => {
              let parsed = { errors: [], comment: '' }
              try { parsed = JSON.parse(ev.message) } catch {}
              const errors = parsed.errors ?? []
              const sortedErrors = [...errors].sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
              return (
                <div key={ev.id}
                  className="rounded-2xl p-5 flex flex-col gap-3 relative"
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${!ev.read ? 'rgba(108,51,230,0.3)' : 'var(--border-subtle)'}`,
                  }}>

                  {/* Unread dot */}
                  {!ev.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full"
                      style={{ background: '#8b5cf6' }} />
                  )}

                  <div className="flex items-start justify-between gap-2 pr-5">
                    <div>
                      <p className="text-sm font-medium capitalize" style={{ color: 'var(--text)' }}>
                        {ev.parasha_id} · {ev.aliyah_label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {parsed.teacherName && `De: ${parsed.teacherName} · `}{timeAgo(ev.created_at)}
                      </p>
                    </div>
                    {sortedErrors.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {sortedErrors.length} {sortedErrors.length === 1 ? 'error' : 'errores'}
                      </span>
                    )}
                  </div>

                  {ev.recording_url && (
                    <div>
                      <p className="text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{t('your_recording')}</p>
                      <audio controls src={ev.recording_url} preload="none"
                        style={{ width: '100%', height: '32px', borderRadius: '6px' }} />
                    </div>
                  )}

                  {sortedErrors.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>{t('error_words_label')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sortedErrors.map((err, i) => (
                          <div key={i}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                            <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                              {err.label}
                            </span>
                            <span className="hebrew text-base font-medium" style={{ color: '#ef4444' }}>{err.word}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsed.comment && (
                    <div className="px-3.5 py-3 rounded-xl"
                      style={{ background: 'rgba(108,51,230,0.06)', border: '1px solid rgba(108,51,230,0.14)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#8b5cf6' }}>{t('comment_label')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                        {parsed.comment}
                      </p>
                    </div>
                  )}

                  {!ev.read && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => markRead(ev.id, setEvals)}
                        className="text-xs px-3 py-1 rounded-lg transition-all"
                        style={{ background: 'rgba(108,51,230,0.08)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
                        Marcar como leída
                      </button>
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
