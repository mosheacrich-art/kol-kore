import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, ChevronRight, ClipboardCheck, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { EmptyState, PageHeader, PageSpinner } from '../../components/ui'
import NotificationGroups from '../../components/NotificationGroups'
import { displayParashaName, timeAgo } from '../../utils/parasha'

export default function StudentNotifications() {
  const { profile } = useAuth()
  const { t } = useLang()
  const locale = t('date_locale') || undefined
  const navigate = useNavigate()
  const [tab, setTab] = useState('homework')
  const [homework, setHomework] = useState([])
  const [evals, setEvals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    Promise.all([
      supabase.from('notifications').select('*').eq('student_id', profile.id).eq('type', 'homework').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('student_id', profile.id).eq('type', 'evaluation').order('created_at', { ascending: false }),
    ]).then(([hwRes, evRes]) => {
      setHomework(hwRes.data || [])
      setEvals(evRes.data || [])
      setLoading(false)
    })
  }, [profile?.id])

  const markRead = async (id, listSetter) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('student_id', profile.id)
    listSetter(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async (list, listSetter) => {
    const unreadIds = list.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds).eq('student_id', profile.id)
    listSetter(prev => prev.map(n => ({ ...n, read: true })))
  }

  const openHomework = (hw) => {
    if (!hw.read) markRead(hw.id, setHomework)
    const aliyahIdx = hw.aliyah_idx ?? (hw.aliyah_label ? parseInt(hw.aliyah_label.match(/\d+/)?.[0] ?? '1', 10) - 1 : null)
    const ref = hw.parasha_id
    if (/[\s,]/.test(ref)) {
      // tefila homework — ref is a Sefaria siddur ref, open the Tefilá reader
      const d = /Shabbat Siddur/i.test(ref) ? 'shabat' : 'semana'
      navigate(`/student/tefila?d=${d}&r=${encodeURIComponent(ref)}`)
    } else {
      navigate(`/student/study/${ref}?aliyah=${aliyahIdx ?? 0}`)
    }
  }

  const hwUnread = homework.filter(n => !n.read).length
  const evUnread = evals.filter(n => !n.read).length
  const list = tab === 'homework' ? homework : evals
  const unread = tab === 'homework' ? hwUnread : evUnread

  return (
    <div className="page page-narrow">
      <PageHeader hebrew="הוֹדָעוֹת" eyebrow={t('nav_notifications')} title={t('nav_notifications')}
        subtitle={hwUnread + evUnread > 0 ? `${hwUnread + evUnread} ${t('unread_n')}` : t('up_to_date')}
        actions={unread > 0 && (
          <button onClick={() => markAllRead(list, tab === 'homework' ? setHomework : setEvals)} className="btn btn-secondary">
            <CheckCheck size={16} />{t('mark_all_read')}
          </button>
        )} />

      <div className="tabs mb-6" role="tablist">
        {[['homework', t('nav_homework'), hwUnread], ['evaluations', t('ui_evaluations'), evUnread]].map(([k, l, c]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {l}{c > 0 && <span className="ms-2 badge badge-gold h-5 px-1.5 text-[11px]">{c > 9 ? '9+' : c}</span>}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : (
        <div className="fade-up-1">
          {tab === 'homework' && (homework.length === 0 ? (
            <div className="card"><EmptyState icon={ClipboardList} title={t('ui_no_homework')} description={t('ui_no_homework_desc')} /></div>
          ) : (
            <NotificationGroups items={homework} renderItem={hw => {
              const canNavigate = !!hw.parasha_id
              return (
                <article onClick={canNavigate ? () => openHomework(hw) : undefined}
                  className={`group flex items-start gap-4 px-4 sm:px-5 py-4 transition-colors ${canNavigate ? 'cursor-pointer hover:bg-surface-2' : ''}`}
                  style={!hw.read ? { background: 'rgba(var(--accent-rgb),0.035)' } : undefined}>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: hw.read ? 'var(--surface-2)' : 'rgba(var(--gold-rgb),0.14)', color: hw.read ? 'var(--text-3)' : 'var(--text-gold)' }}>
                    <ClipboardList size={17} strokeWidth={1.8} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`text-[14px] ${hw.read ? 'text-ink-2' : 'text-ink font-semibold'}`}>{hw.message}</p>
                      <span className="text-[12px] text-ink-4 flex-shrink-0">{timeAgo(hw.created_at, locale)}</span>
                    </div>
                    {(hw.parasha_id || hw.aliyah_label) && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {hw.parasha_id && <span className="badge max-w-[260px] truncate">{displayParashaName(hw.parasha_id)}</span>}
                        {hw.aliyah_label && <span className="badge">{hw.aliyah_label}</span>}
                      </div>
                    )}
                    {!hw.read && (
                      <button onClick={e => { e.stopPropagation(); markRead(hw.id, setHomework) }} className="btn btn-ghost btn-sm -ms-3 mt-1.5 text-ink-3">
                        {t('ui_mark_read')}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                    {!hw.read && <span className="w-2 h-2 rounded-full bg-gold" />}
                    {canNavigate && <ChevronRight size={16} className="text-ink-4 group-hover:text-ink rtl:rotate-180" />}
                  </div>
                </article>
              )
            }} />
          ))}

          {tab === 'evaluations' && (evals.length === 0 ? (
            <div className="card"><EmptyState icon={ClipboardCheck} title={t('no_notifs')} description={t('no_notifs_student_desc')} /></div>
          ) : (
            <NotificationGroups items={evals} renderItem={ev => {
              let parsed = { errors: [], comment: '' }
              try { parsed = JSON.parse(ev.message) } catch { parsed = { errors: [], comment: ev.message || '' } }
              const sortedErrors = [...(parsed.errors ?? [])].sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
              return (
                <article className="flex flex-col gap-3 px-4 sm:px-5 py-4" style={!ev.read ? { background: 'rgba(var(--accent-rgb),0.035)' } : undefined}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-ink">{displayParashaName(ev.parasha_id)} · {ev.aliyah_label}</p>
                      <p className="text-[12px] text-ink-3 mt-0.5">
                        {parsed.teacherName && `${parsed.teacherName} · `}{timeAgo(ev.created_at, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sortedErrors.length > 0 && <span className="badge badge-danger">{sortedErrors.length} {t('ui_errors')}</span>}
                      {!ev.read && <span className="w-2 h-2 rounded-full bg-gold" />}
                    </div>
                  </div>

                  {ev.recording_url && (
                    <div>
                      <p className="text-[12px] text-ink-3 mb-1.5">{t('your_recording')}</p>
                      <audio controls src={ev.recording_url} preload="none" className="w-full h-9" />
                    </div>
                  )}

                  {sortedErrors.length > 0 && (
                    <div>
                      <p className="text-[13px] font-medium text-ink-2 mb-2">{t('error_words_label')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sortedErrors.map((err, i) => (
                          <span key={i} className="inline-flex items-center gap-2 h-8 px-2.5 rounded-lg"
                            style={{ background: 'rgba(var(--danger-rgb),0.06)', border: '1px solid rgba(var(--danger-rgb),0.14)' }}>
                            <span className="text-[11px] font-mono tabular-nums text-ink-3">{err.label}</span>
                            <span className="hebrew text-[17px]" style={{ color: 'rgb(var(--danger-rgb))', fontWeight: 400 }}>{err.word}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsed.comment && (
                    <blockquote className="px-4 py-3 rounded-xl bg-surface-2" style={{ borderInlineStart: '3px solid rgb(var(--gold-rgb))' }}>
                      <p className="text-[12px] font-semibold text-ink-3 mb-1">{t('comment_label')}</p>
                      <p className="text-[14px] leading-relaxed text-ink-2 whitespace-pre-wrap">{parsed.comment}</p>
                    </blockquote>
                  )}

                  {!ev.read && (
                    <button onClick={() => markRead(ev.id, setEvals)} className="btn btn-ghost btn-sm self-end text-ink-3">{t('ui_mark_read')}</button>
                  )}
                </article>
              )
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
