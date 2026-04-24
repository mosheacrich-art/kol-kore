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
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export default function TeacherNotifications() {
  const { profile } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('notifications')
      .select('*')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotifs(data || [])
        setLoading(false)
      })
  }, [profile])

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הוֹדָעוֹת · Notificaciones
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
              Marcar todas como leídas
            </button>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
        </div>
      )}

      {!loading && notifs.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.15)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C8 3 5 6 5 10v5l-2 2v1h18v-1l-2-2v-5c0-4-3-7-7-7z" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 20a2 2 0 004 0" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin notificaciones aún</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Aquí verás cuando tus alumnos suban o graben audio
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 fade-up-2">
        {notifs.map(n => (
          <div key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-200"
            style={{
              background: n.read ? 'var(--bg-card)' : 'rgba(108,51,230,0.07)',
              border: `1px solid ${n.read ? 'var(--border-subtle)' : 'rgba(108,51,230,0.2)'}`,
              cursor: n.read ? 'default' : 'pointer',
            }}>

            {/* Icon */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: n.read ? 'var(--bg-card)' : 'rgba(108,51,230,0.15)',
                border: `1px solid ${n.read ? 'var(--border-subtle)' : 'rgba(108,51,230,0.25)'}`,
              }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3.5" y="0.5" width="4" height="6" rx="2"
                  stroke={n.read ? 'var(--text-muted)' : '#8b5cf6'} strokeWidth="1.2"/>
                <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4"
                  stroke={n.read ? 'var(--text-muted)' : '#8b5cf6'} strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M9 10l5 4M14 10l-5 4" stroke={n.read ? 'var(--text-muted)' : '#6c33e6'} strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium" style={{ color: n.read ? 'var(--text-2)' : 'var(--text)' }}>
                  {n.student_name}
                </p>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {timeAgo(n.created_at)}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{n.message}</p>
              <div className="flex items-center gap-2 mt-2">
                {n.parasha_id && (
                  <span className="text-xs px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.15)' }}>
                    {n.parasha_id}
                  </span>
                )}
                {n.aliyah_label && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.aliyah_label}</span>
                )}
                {!n.read && (
                  <span className="ml-auto text-xs" style={{ color: '#8b5cf6' }}>Clic para marcar leída</span>
                )}
              </div>
            </div>

            {/* Unread dot */}
            {!n.read && (
              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{ background: '#6c33e6' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
