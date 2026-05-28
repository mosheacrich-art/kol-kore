import { useState, useEffect, useRef } from 'react'
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
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export default function TeacherNotifications() {
  const { profile } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoverItem, setHoverItem] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [newArrivedId, setNewArrivedId] = useState(null)
  const newArrivedTimer = useRef(null)

  // Contact messages state
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null) // contact message id
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [hoverContact, setHoverContact] = useState(null)
  const [deletingContact, setDeletingContact] = useState(null)

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

  // Real-time: incoming audio submissions from students
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`teacher-notifs-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `teacher_id=eq.${profile.id}`,
      }, ({ new: row }) => {
        setNotifs(prev => [row, ...prev])
        clearTimeout(newArrivedTimer.current)
        setNewArrivedId(row.id)
        newArrivedTimer.current = setTimeout(() => setNewArrivedId(null), 4000)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch); clearTimeout(newArrivedTimer.current) }
  }, [profile?.id])

  useEffect(() => {
    supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setContacts(data || [])
        setContactsLoading(false)
      })
  }, [])

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

  const markContactRead = async (id) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', id)
    setContacts(prev => prev.map(c => c.id === id ? { ...c, read: true } : c))
  }

  const deleteContact = async (id) => {
    setDeletingContact(id)
    await supabase.from('contact_messages').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
    setDeletingContact(null)
  }

  const sendReply = async (contact) => {
    if (!replyText.trim() || !contact.user_id) return
    setSendingReply(true)
    await supabase.from('notifications').insert({
      teacher_id: profile.id,
      student_id: contact.user_id,
      student_name: contact.name,
      type: 'contact_reply',
      message: replyText.trim(),
      read: false,
    })
    // Mark contact as read after replying
    await supabase.from('contact_messages').update({ read: true }).eq('id', contact.id)
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, read: true } : c))
    setReplyText('')
    setReplyingTo(null)
    setSendingReply(false)
  }

  const unreadCount = notifs.filter(n => !n.read).length
  const unreadContacts = contacts.filter(c => !c.read).length

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הוֹדָעוֹת · Notificaciones
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
            {t('notif_title')}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
              {t('mark_all_read')}
            </button>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          {unreadCount > 0 ? `${unreadCount} ${t('unread_n')}` : t('up_to_date')}
        </p>
      </div>

      {/* ── Contact messages section ─────────────────────────────────────── */}
      <div className="mb-8 fade-up-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
          <div className="flex items-center gap-2">
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-gold)' }}>
              {t('contact_msgs_title')}
            </p>
            {unreadContacts > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: '#10b981', color: '#fff', fontSize: '9px' }}>
                {unreadContacts}
              </span>
            )}
          </div>
          <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
        </div>

        {contactsLoading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(16,185,129,0.2)', borderTopColor: '#10b981' }} />
          </div>
        )}

        {!contactsLoading && contacts.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            {t('contact_no_msgs')}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {contacts.map(c => (
            <div key={c.id}
              onMouseEnter={() => setHoverContact(c.id)}
              onMouseLeave={() => setHoverContact(null)}
              className="relative rounded-2xl p-4 transition-all duration-200"
              style={{
                background: c.read ? 'var(--bg-card)' : 'rgba(16,185,129,0.07)',
                border: `1px solid ${c.read ? 'var(--border-subtle)' : 'rgba(16,185,129,0.25)'}`,
              }}>

              {/* Delete button */}
              <button
                onClick={() => deleteContact(c.id)}
                disabled={deletingContact === c.id}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  opacity: hoverContact === c.id ? 1 : 0,
                  pointerEvents: hoverContact === c.id ? 'auto' : 'none',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#ef4444',
                }}>
                {deletingContact === c.id ? (
                  <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(239,68,68,0.3)', borderTopColor: '#ef4444' }} />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 3h8M3.5 3V2h4v1M4 5v3M7 5v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    <path d="M2.5 3l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: c.read ? 'var(--bg-card)' : 'rgba(16,185,129,0.15)',
                    border: `1px solid ${c.read ? 'var(--border-subtle)' : 'rgba(16,185,129,0.3)'}`,
                  }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke={c.read ? 'var(--text-muted)' : '#10b981'} strokeWidth="1.2"/>
                    <path d="M1 4.5l6 4.5 6-4.5" stroke={c.read ? 'var(--text-muted)' : '#10b981'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: c.read ? 'var(--text-2)' : 'var(--text)' }}>
                      {c.name}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {timeAgo(c.created_at)}
                    </span>
                    {!c.read && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)', whiteSpace: 'pre-wrap' }}>
                    {c.message}
                  </p>

                  {/* Reply area */}
                  {replyingTo === c.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={t('contact_reply_placeholder')}
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                        style={{ background: 'var(--bg-deep)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--text)' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText('') }}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                          {t('cancel')}
                        </button>
                        <button
                          onClick={() => sendReply(c)}
                          disabled={sendingReply || !replyText.trim() || !c.user_id}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={{
                            background: !replyText.trim() || sendingReply ? 'var(--bg-card)' : 'rgba(16,185,129,0.15)',
                            color: !replyText.trim() || sendingReply ? 'var(--text-muted)' : '#10b981',
                            border: `1px solid ${!replyText.trim() || sendingReply ? 'var(--border-subtle)' : 'rgba(16,185,129,0.3)'}`,
                          }}>
                          {sendingReply ? (
                            <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                              style={{ borderColor: 'rgba(16,185,129,0.3)', borderTopColor: '#10b981' }} />
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M1 5.5h9M6.5 2l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {t('contact_reply_send')}
                        </button>
                        {!c.user_id && (
                          <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
                            (usuario anónimo, no se puede responder)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => { setReplyingTo(c.id); setReplyText(''); if (!c.read) markContactRead(c.id) }}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M10 2H1v6h3l2 2 2-2h2V2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                        </svg>
                        {t('contact_reply')}
                      </button>
                      {!c.read && (
                        <button onClick={() => markContactRead(c.id)}
                          className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Marcar leído
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Student activity notifications ───────────────────────────────── */}
      <div className="fade-up-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-gold)' }}>
            {t('notif_title')}
          </p>
          <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.15)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C8 3 5 6 5 10v5l-2 2v1h18v-1l-2-2v-5c0-4-3-7-7-7z" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M10 20a2 2 0 004 0" stroke="rgba(108,51,230,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('no_notifs')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('no_notifs_desc')}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notifs.map(n => (
            <div key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              onMouseEnter={() => setHoverItem(n.id)}
              onMouseLeave={() => setHoverItem(null)}
              className="relative group flex items-start gap-4 p-4 rounded-2xl transition-all duration-200"
              style={{
                background: newArrivedId === n.id
                  ? 'rgba(108,51,230,0.14)'
                  : n.read ? 'var(--bg-card)' : 'rgba(108,51,230,0.07)',
                border: `1px solid ${newArrivedId === n.id ? 'rgba(108,51,230,0.4)' : n.read ? 'var(--border-subtle)' : 'rgba(108,51,230,0.2)'}`,
                cursor: n.read ? 'default' : 'pointer',
                boxShadow: newArrivedId === n.id ? '0 0 0 2px rgba(108,51,230,0.15)' : 'none',
              }}>

              {/* Delete button */}
              <button
                onClick={e => { e.stopPropagation(); deleteNotif(n.id) }}
                disabled={deleting === n.id}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  opacity: hoverItem === n.id ? 1 : 0,
                  pointerEvents: hoverItem === n.id ? 'auto' : 'none',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#ef4444',
                }}>
                {deleting === n.id ? (
                  <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(239,68,68,0.3)', borderTopColor: '#ef4444' }} />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 3h8M3.5 3V2h4v1M4 5v3M7 5v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    <path d="M2.5 3l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

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
                    <span className="ml-auto text-xs" style={{ color: '#8b5cf6' }}>{t('click_mark_read')}</span>
                  )}
                </div>
                {n.type === 'audio' && n.recording_url && (
                  <div className="mt-2 flex flex-col gap-2">
                    <audio controls src={n.recording_url} preload="none"
                      style={{ width: '100%', height: '32px', borderRadius: '6px' }}
                      onClick={e => e.stopPropagation()} />
                    {n.parasha_id && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/teacher/study/${n.parasha_id}?aliyah=${n.aliyah_idx ?? 0}`)
                        }}
                        className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(108,51,230,0.12)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.25)' }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M1.5 5.5h8M6 2l3.5 3.5L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {t('read_parasha')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!n.read && (
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#6c33e6' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
