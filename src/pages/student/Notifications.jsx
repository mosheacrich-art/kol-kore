import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

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
  const [evals, setEvals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('notifications')
      .select('*')
      .eq('student_id', profile.id)
      .eq('type', 'evaluation')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEvals(data || [])
        setLoading(false)
        const unread = (data || []).filter(e => !e.read).map(e => e.id)
        if (unread.length) {
          supabase.from('notifications').update({ read: true }).in('id', unread)
        }
      })
  }, [profile?.id])

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הֲעָרוֹת · Correcciones
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Mis evaluaciones
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Correcciones enviadas por tu profesor
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
        </div>
      )}

      {!loading && evals.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.15)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3L22 4" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin evaluaciones aún</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tu profesor te enviará correcciones aquí</p>
        </div>
      )}

      <div className="flex flex-col gap-4 fade-up-2">
        {evals.map(ev => {
          let parsed = { errors: [], comment: '' }
          try { parsed = JSON.parse(ev.message) } catch {}
          const errors = parsed.errors ?? []
          const sortedErrors = [...errors].sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
          return (
            <div key={ev.id}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>

              <div className="flex items-start justify-between gap-2">
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
                  <p className="text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Tu grabación:</p>
                  <audio controls src={ev.recording_url} preload="none"
                    style={{ width: '100%', height: '32px', borderRadius: '6px' }} />
                </div>
              )}

              {sortedErrors.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Palabras con errores:</p>
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
                  <p className="text-xs font-semibold mb-1" style={{ color: '#8b5cf6' }}>Comentario:</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                    {parsed.comment}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
