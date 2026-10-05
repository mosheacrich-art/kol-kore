import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CheckCheck, Headphones, Mic, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { EmptyState, PageHeader, PageSpinner } from '../../components/ui'
import NotificationGroups from '../../components/NotificationGroups'
import { displayParashaName, timeAgo } from '../../utils/parasha'

export default function TeacherNotifications() {
  const { profile } = useAuth()
  const { t } = useLang()
  const locale = t('date_locale') || undefined
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [newArrivedId, setNewArrivedId] = useState(null)
  const newArrivedTimer = useRef(null)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('notifications')
      .select('*')
      .eq('teacher_id', profile.id)
      .in('type', ['audio', 'listen'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotifs(data || [])
        setLoading(false)
      })
  }, [profile])

  // Real-time: incoming audio submissions from students
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`teacher-notifs-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `teacher_id=eq.${profile.id}`,
      }, ({ new: row }) => {
        if (!['audio', 'listen'].includes(row.type)) return
        setNotifs(prev => [row, ...prev])
        clearTimeout(newArrivedTimer.current)
        setNewArrivedId(row.id)
        newArrivedTimer.current = setTimeout(() => setNewArrivedId(null), 4000)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch); clearTimeout(newArrivedTimer.current) }
  }, [profile?.id])

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true })
      .eq('id', id).eq('teacher_id', profile.id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true })
      .in('id', unreadIds).eq('teacher_id', profile.id)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotif = async (id) => {
    setDeleting(id)
    await supabase.from('notifications').delete().eq('id', id).eq('teacher_id', profile.id)
    setNotifs(prev => prev.filter(n => n.id !== id))
    setDeleting(null)
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className="page page-narrow">
      <PageHeader
        hebrew="הוֹדָעוֹת"
        eyebrow={t('nav_notifications')}
        title={t('notif_title')}
        subtitle={unreadCount > 0 ? `${unreadCount} ${t('unread_n')}` : t('up_to_date')}
        actions={unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary"><CheckCheck size={16} />{t('mark_all_read')}</button>
        )}
      />

      <div className="fade-up-1">
        {loading ? <PageSpinner /> : notifs.length === 0 ? (
          <div className="card"><EmptyState icon={Bell} title={t('no_notifs')} description={t('no_notifs_desc')} /></div>
        ) : (
          <NotificationGroups items={notifs} renderItem={n => {
            const Icon = n.type === 'audio' ? Mic : Headphones
            return (
              <article onClick={() => !n.read && markRead(n.id)}
                className={`group relative flex items-start gap-4 px-4 sm:px-5 py-4 transition-colors ${n.read ? '' : 'cursor-pointer'}`}
                style={{
                  background: newArrivedId === n.id ? 'rgba(var(--gold-rgb),0.1)' : n.read ? undefined : 'rgba(var(--accent-rgb),0.035)',
                }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: n.read ? 'var(--surface-2)' : 'rgba(var(--accent-rgb),0.08)', color: n.read ? 'var(--text-3)' : 'rgb(var(--accent-rgb))' }}>
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`text-[14px] ${n.read ? 'text-ink-2' : 'text-ink font-semibold'}`}>{n.student_name}</p>
                    <span className="text-[12px] text-ink-4 flex-shrink-0">{timeAgo(n.created_at, locale)}</span>
                  </div>
                  <p className="text-[14px] text-ink-3 mt-0.5">{n.message}</p>
                  {(n.parasha_id || n.aliyah_label) && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {n.parasha_id && <span className="badge">{displayParashaName(n.parasha_id)}</span>}
                      {n.aliyah_label && <span className="badge">{n.aliyah_label}</span>}
                    </div>
                  )}
                  {n.type === 'audio' && n.recording_url && (
                    <div className="mt-3 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                      <audio controls src={n.recording_url} preload="none" className="w-full h-9" />
                      {n.parasha_id && (
                        <button onClick={() => navigate(`/teacher/study/${n.parasha_id}?aliyah=${n.aliyah_idx ?? 0}`)}
                          className="btn btn-secondary btn-sm self-start">
                          {t('read_parasha')}<ArrowRight size={14} className="rtl:rotate-180" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-gold mt-1.5" aria-label={t('unread_n')} />}
                  <button onClick={e => { e.stopPropagation(); deleteNotif(n.id) }} disabled={deleting === n.id}
                    className="btn btn-ghost btn-sm btn-icon text-ink-4 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label={t('ui_delete')}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            )
          }} />
        )}
      </div>
    </div>
  )
}
