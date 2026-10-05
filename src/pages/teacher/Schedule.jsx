import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Repeat, Trash2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { EmptyState, Modal, PageHeader, Spinner, toneFor } from '../../components/ui'
import { Toggle } from '../../components/homework/HomeworkComposer'
import { capitalize } from '../../utils/parasha'

const HOUR_PX = 64

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
const dayIndex = (d) => (d.getDay() === 0 ? 6 : d.getDay() - 1)
const pad = (n) => String(n).padStart(2, '0')
const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function TeacherSchedule() {
  const { profile } = useAuth()
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const WEEK_DAYS = t('week_days') || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const CLASS_TYPES = t('class_types') || ['Clase', 'Trop', 'Lectura', 'Repaso', 'Maftir', 'Brajot']
  const locale = t('schedule_locale') || 'es'

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => dayIndex(new Date()))
  const [view, setView] = useState('day')
  const [classes, setClasses] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(params.get('new') === '1')
  const [detail, setDetail] = useState(null)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const selectedDate = weekDays[selectedDay]

  useEffect(() => {
    if (!profile) return
    supabase.from('profiles').select('id, name').eq('teacher_id', profile.id).eq('role', 'student')
      .then(({ data }) => setStudents(data || []))
  }, [profile])

  const loadUpcoming = () => {
    supabase.from('classes').select('*').eq('teacher_id', profile.id)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true }).limit(5)
      .then(({ data }) => setUpcoming(data || []))
  }
  useEffect(() => { if (profile) loadUpcoming() }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    supabase.from('classes').select('*').eq('teacher_id', profile.id)
      .gte('scheduled_at', weekStart.toISOString()).lt('scheduled_at', addDays(weekStart, 7).toISOString())
      .order('scheduled_at')
      .then(({ data }) => { setClasses(data || []); setLoading(false) })
  }, [profile, weekStart])

  const classesOn = (d) => classes.filter(c => new Date(c.scheduled_at).toDateString() === d.toDateString())
  const dayClasses = classesOn(selectedDate)

  const goToday = () => { setWeekStart(getWeekStart(new Date())); setSelectedDay(dayIndex(new Date())) }

  const handleDelete = async (id) => {
    await supabase.from('classes').delete().eq('id', id)
    setClasses(prev => prev.filter(c => c.id !== id))
    setUpcoming(prev => prev.filter(c => c.id !== id))
    setDetail(null)
  }

  const closeModal = () => {
    setShowModal(false)
    if (params.get('new') || params.get('student')) {
      params.delete('new'); params.delete('student'); setParams(params, { replace: true })
    }
  }

  const weekLabel = `${weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`
  const uniqueStudents = [...new Set(classes.map(c => c.student_name))]
  const totalMinutes = classes.reduce((s, c) => s + (c.duration_min || 0), 0)
  const todayCount = classes.filter(c => new Date(c.scheduled_at).toDateString() === today.toDateString()).length

  // Visible hour range for the timeline
  const [startHour, endHour] = useMemo(() => {
    const list = view === 'day' ? dayClasses : classes
    let lo = 8, hi = 21
    list.forEach(c => {
      const d = new Date(c.scheduled_at)
      lo = Math.min(lo, d.getHours())
      hi = Math.max(hi, Math.ceil(d.getHours() + (d.getMinutes() + (c.duration_min || 60)) / 60))
    })
    return [lo, Math.min(24, hi)]
  }, [classes, dayClasses, view])

  const fmtTime = (iso, mins = 0) => {
    const d = new Date(new Date(iso).getTime() + mins * 60000)
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="page">
      <PageHeader
        hebrew="שִׁעוּרִים"
        eyebrow={t('nav_schedule')}
        title={t('schedule_heading')}
        subtitle={weekLabel}
        actions={
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
            <Plus size={18} strokeWidth={2} />{t('new_class')}
          </button>
        }
      />

      {/* Week strip */}
      <div className="card p-2.5 sm:p-3 mb-6 flex items-center gap-2 fade-up-1">
        <button onClick={() => setWeekStart(w => addDays(w, -7))} className="btn btn-secondary btn-icon flex-shrink-0" aria-label={t('ui_prev_week')}>
          <ChevronLeft size={18} className="rtl:rotate-180" />
        </button>
        <div className="flex-1 grid grid-cols-7 gap-1 min-w-0" role="tablist" aria-label={weekLabel}>
          {weekDays.map((d, i) => {
            const count = classesOn(d)
            const isToday = d.toDateString() === today.toDateString()
            const isSelected = selectedDay === i
            return (
              <button key={i} role="tab" aria-selected={isSelected} onClick={() => { setSelectedDay(i); setView('day') }}
                className="flex flex-col items-center gap-1 py-2 sm:py-2.5 rounded-xl transition-colors hover:bg-surface-2"
                style={isSelected ? { background: 'rgba(var(--accent-rgb),0.07)' } : undefined}>
                <span className={`text-[11px] sm:text-[12px] ${isSelected ? 'text-accent font-medium' : 'text-ink-3'}`}>{WEEK_DAYS[i]}</span>
                <span className={`text-[17px] sm:text-[19px] leading-none tabular-nums ${isSelected ? 'text-accent font-semibold' : isToday ? 'text-ink font-semibold' : 'text-ink-2'}`}>
                  {d.getDate()}
                </span>
                <span className="h-1.5 flex gap-0.5">
                  {count.slice(0, 3).map(c => <span key={c.id} className="w-1.5 h-1.5 rounded-full" style={{ background: toneFor(c.student_name) }} />)}
                  {!count.length && isToday && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                </span>
              </button>
            )
          })}
        </div>
        <button onClick={goToday} className="btn btn-secondary hidden sm:inline-flex flex-shrink-0">{t('today_btn')}</button>
        <button onClick={() => setWeekStart(w => addDays(w, 7))} className="btn btn-secondary btn-icon flex-shrink-0" aria-label={t('ui_next_week')}>
          <ChevronRight size={18} className="rtl:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Timeline */}
        <section className="card xl:col-span-8 overflow-hidden fade-up-2">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-serif text-[20px] text-ink tracking-[-0.01em] min-w-0 truncate">
              {view === 'day' ? (
                <>
                  <span className="font-semibold">{capitalize(selectedDate.toLocaleDateString(locale, { weekday: 'long' }))}</span>
                  <span className="text-ink-2">, {selectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </>
              ) : <span className="font-semibold">{weekLabel}</span>}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={goToday} className="btn btn-secondary btn-sm sm:hidden">{t('today_btn')}</button>
              <div className="segmented hidden md:inline-flex">
                <button aria-pressed={view === 'day'} onClick={() => setView('day')}>{t('ui_day')}</button>
                <button aria-pressed={view === 'week'} onClick={() => setView('week')}>{t('ui_week')}</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : view === 'day' && dayClasses.length === 0 ? (
            <EmptyState icon={CalendarDays} title={t('no_classes_day')} description={t('ui_no_classes_day_desc')}
              action={<button onClick={() => setShowModal(true)} className="btn btn-secondary"><Plus size={16} />{t('add_class_btn')}</button>} />
          ) : (
            <>
              {/* Mobile agenda */}
              <ul className="md:hidden p-3 flex flex-col gap-2">
                {dayClasses.map(c => (
                  <li key={c.id}><ClassBlock cls={c} fmtTime={fmtTime} onClick={() => setDetail(c)} /></li>
                ))}
              </ul>
              {/* Desktop timeline */}
              <div className="hidden md:block overflow-x-auto">
                {view === 'week' && (
                  <div className="grid sticky top-0 z-10 bg-surface" style={{ gridTemplateColumns: '64px repeat(7, minmax(110px, 1fr))', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span />
                    {weekDays.map((d, i) => (
                      <button key={i} onClick={() => { setSelectedDay(i); setView('day') }}
                        className={`py-2.5 text-[12px] text-center hover:text-ink ${d.toDateString() === today.toDateString() ? 'text-accent font-semibold' : 'text-ink-3'}`}>
                        {WEEK_DAYS[i]} {d.getDate()}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative grid py-3" style={{ gridTemplateColumns: view === 'week' ? '64px repeat(7, minmax(110px, 1fr))' : '64px 1fr' }}>
                  {/* hour labels */}
                  <div className="relative" style={{ height: (endHour - startHour) * HOUR_PX }}>
                    {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
                      <span key={i} className="absolute end-3 text-[12px] text-ink-4 tabular-nums -translate-y-1/2" style={{ top: i * HOUR_PX }}>
                        {pad(startHour + i)}:00
                      </span>
                    ))}
                  </div>
                  {(view === 'week' ? weekDays : [selectedDate]).map((d, col) => (
                    <div key={col} className="relative me-4" style={{ height: (endHour - startHour) * HOUR_PX, borderInlineStart: view === 'week' ? '1px solid var(--border-subtle)' : undefined }}>
                      {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
                        <div key={i} className="absolute inset-x-0" style={{ top: i * HOUR_PX, borderTop: '1px solid var(--border-subtle)' }} />
                      ))}
                      {d.toDateString() === new Date().toDateString() && <NowLine startHour={startHour} />}
                      {classesOn(d).map(c => {
                        const s = new Date(c.scheduled_at)
                        const top = ((s.getHours() - startHour) * 60 + s.getMinutes()) / 60 * HOUR_PX
                        const height = Math.max(36, (c.duration_min || 60) / 60 * HOUR_PX - 4)
                        return (
                          <div key={c.id} className="absolute inset-x-1.5" style={{ top: top + 2, height }}>
                            <ClassBlock cls={c} fmtTime={fmtTime} compact={view === 'week'} onClick={() => setDetail(c)} fill />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Side column */}
        <aside className="xl:col-span-4 flex flex-col gap-6 fade-up-3">
          <section className="card p-5 sm:p-6">
            <h2 className="section-title mb-4">{t('week_summary')}</h2>
            <div className="grid grid-cols-4">
              {[
                { icon: CalendarDays, label: t('classes_label'), value: classes.length },
                { icon: Clock, label: t('hours_label'), value: `${+(totalMinutes / 60).toFixed(1)}h` },
                { icon: Users, label: t('students_label'), value: uniqueStudents.length },
                { icon: CalendarDays, label: t('today'), value: todayCount },
              ].map((s, i) => (
                <div key={s.label} className="px-2 first:ps-0" style={i ? { borderInlineStart: '1px solid var(--border-subtle)' } : undefined}>
                  <s.icon size={16} strokeWidth={1.7} className="text-ink-3" />
                  <p className="font-serif text-[26px] font-semibold text-ink mt-2 leading-none tabular-nums">{s.value}</p>
                  <p className="text-[12px] text-ink-3 mt-1.5 truncate">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="section-title mb-2">{t('ui_upcoming_classes')}</h2>
            {upcoming.length === 0 ? (
              <div className="flex items-center gap-3 py-4">
                <CalendarDays size={18} className="text-ink-4" />
                <p className="text-[13px] text-ink-3 flex-1">{t('no_classes_week')}</p>
                <button onClick={() => setShowModal(true)} className="btn btn-secondary btn-sm"><Plus size={14} />{t('new_class')}</button>
              </div>
            ) : upcoming.map(c => {
              const d = new Date(c.scheduled_at)
              const tone = toneFor(c.student_name)
              return (
                <button key={c.id} onClick={() => setDetail(c)} className="w-full flex items-center gap-4 py-3 text-start group" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: `${tone}12`, color: tone }}>
                    <span className="text-[16px] font-semibold leading-none">{pad(d.getDate())}</span>
                    <span className="text-[10px] uppercase mt-0.5">{d.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] text-ink-3 tabular-nums">{fmtTime(c.scheduled_at)} – {fmtTime(c.scheduled_at, c.duration_min || 60)}</span>
                    <span className="block text-[14px] font-medium text-ink truncate">{c.student_name}</span>
                    <span className="block text-[12px] text-ink-3 truncate">{c.type}{c.notes ? ` · ${c.notes}` : ''}</span>
                  </span>
                  <ChevronRight size={16} className="text-ink-4 group-hover:text-ink rtl:rotate-180" />
                </button>
              )
            })}
          </section>

          {uniqueStudents.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="section-title mb-2">{t('classes_by_student')}</h2>
              {uniqueStudents.map(name => {
                const count = classes.filter(c => c.student_name === name).length
                return (
                  <div key={name} className="flex items-center justify-between py-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="flex items-center gap-2.5 text-[14px] text-ink-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: toneFor(name) }} />
                      <span className="truncate">{name}</span>
                    </span>
                    <span className="text-[13px] text-ink-3 tabular-nums">{count} {t('classes_label').toLowerCase()}</span>
                  </div>
                )
              })}
            </section>
          )}
        </aside>
      </div>

      {showModal && (
        <AddClassModal
          profile={profile} students={students} classTypes={CLASS_TYPES} t={t}
          defaultDay={selectedDate} defaultStudent={params.get('student')}
          onClose={closeModal}
          onSaved={(rows) => {
            setClasses(prev => [...prev, ...rows.filter(r => {
              const d = new Date(r.scheduled_at); return d >= weekStart && d < addDays(weekStart, 7)
            })].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)))
            loadUpcoming()
          }}
        />
      )}

      {detail && (
        <ClassDetailModal cls={detail} t={t} locale={locale} fmtTime={fmtTime}
          onClose={() => setDetail(null)} onDelete={() => handleDelete(detail.id)} />
      )}
    </div>
  )
}

function NowLine({ startHour }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id) }, [])
  const mins = (now.getHours() - startHour) * 60 + now.getMinutes()
  if (mins < 0) return null
  return (
    <div className="absolute inset-x-0 z-[5] pointer-events-none" style={{ top: mins / 60 * HOUR_PX }}>
      <div className="relative h-px" style={{ background: 'rgb(var(--danger-rgb))' }}>
        <span className="absolute -start-1 -top-[3px] w-[7px] h-[7px] rounded-full" style={{ background: 'rgb(var(--danger-rgb))' }} />
      </div>
    </div>
  )
}

function ClassBlock({ cls, fmtTime, onClick, compact = false, fill = false }) {
  const tone = toneFor(cls.student_name)
  return (
    <button onClick={onClick}
      className={`w-full text-start rounded-lg px-3 py-2 overflow-hidden transition-shadow hover:shadow-pop ${fill ? 'h-full' : ''}`}
      style={{ background: `${tone}14`, borderInlineStart: `3px solid ${tone}` }}>
      <p className="text-[13px] font-semibold text-ink truncate">{cls.student_name}</p>
      {!compact && <p className="text-[12px] text-ink-2 truncate">{cls.type}{cls.notes ? ` · ${cls.notes}` : ''}</p>}
      <p className="text-[11px] text-ink-3 tabular-nums">{fmtTime(cls.scheduled_at)} – {fmtTime(cls.scheduled_at, cls.duration_min || 60)}</p>
    </button>
  )
}

function ClassDetailModal({ cls, t, locale, fmtTime, onClose, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const d = new Date(cls.scheduled_at)
  return (
    <Modal open onClose={onClose} size="sm" title={cls.student_name}
      subtitle={`${capitalize(d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${fmtTime(cls.scheduled_at)} – ${fmtTime(cls.scheduled_at, cls.duration_min || 60)}`}
      footer={confirming ? (
        <>
          <span className="me-auto text-[13px] text-ink-2">{t('delete_class_confirm') || '¿Eliminar esta clase?'}</span>
          <button onClick={() => setConfirming(false)} className="btn btn-secondary btn-sm">{t('cancel')}</button>
          <button onClick={onDelete} className="btn btn-sm" style={{ background: 'rgb(var(--danger-rgb))', color: '#fff' }}>{t('ui_delete')}</button>
        </>
      ) : (
        <>
          <button onClick={() => setConfirming(true)} className="btn btn-danger me-auto"><Trash2 size={15} />{t('ui_delete')}</button>
          <button onClick={onClose} className="btn btn-secondary">{t('close')}</button>
        </>
      )}>
      <dl className="rounded-xl bg-surface-2" style={{ border: '1px solid var(--border-subtle)' }}>
        {[
          [t('type_label'), cls.type],
          [t('duration_label'), `${cls.duration_min || 60} min`],
          cls.notes && [t('ui_notes'), cls.notes],
        ].filter(Boolean).map(([k, v], i) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3" style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
            <dt className="text-[13px] text-ink-3">{k}</dt>
            <dd className="text-[14px] text-ink text-end">{v}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

function AddClassModal({ profile, students, defaultDay, defaultStudent, classTypes, t, onClose, onSaved }) {
  const base = defaultDay instanceof Date ? defaultDay : new Date()
  const [studentId, setStudentId] = useState(defaultStudent || '')
  const [customName, setCustomName] = useState('')
  const [type, setType] = useState(classTypes[0] || 'Clase')
  const [date, setDate] = useState(toDateInput(base))
  const [time, setTime] = useState('18:00')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [weeks, setWeeks] = useState(4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const endTime = (() => {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + duration
    return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
  })()
  const setEndTime = (v) => {
    const [h1, m1] = time.split(':').map(Number)
    const [h2, m2] = v.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (diff > 0) setDuration(diff)
  }

  const studentName = studentId ? students.find(s => s.id === studentId)?.name || customName : customName

  const handleSave = async (e) => {
    e.preventDefault()
    if (!studentName.trim()) { setError(t('student_name_error')); return }
    setSaving(true)
    setError('')
    const count = repeat ? Math.max(1, Math.min(52, weeks)) : 1
    const first = new Date(`${date}T${time}:00`)
    const rows = Array.from({ length: count }, (_, i) => ({
      teacher_id: profile.id,
      student_id: studentId || null,
      student_name: studentName.trim(),
      type,
      scheduled_at: addDays(first, i * 7).toISOString(),
      duration_min: duration,
      notes: notes || null,
    }))
    const { data, error: err } = await supabase.from('classes').insert(rows).select()
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data || [])
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="md" title={t('new_class')}
      footer={<>
        <button type="button" onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
        <button type="submit" form="add-class" disabled={saving} className="btn btn-primary">
          {saving ? t('saving') : repeat && weeks > 1 ? t('ui_save_n_classes').replace('{n}', weeks) : t('save_class')}
        </button>
      </>}>
      <form id="add-class" onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <span className="label">{t('type_label')}</span>
          <div className="flex flex-wrap gap-1.5">
            {classTypes.map(ct => (
              <button key={ct} type="button" onClick={() => setType(ct)} aria-pressed={type === ct}
                className="h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors"
                style={type === ct
                  ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }
                  : { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)' }}>
                {ct}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="cls-student">{t('student_label')}</label>
          {students.length > 0 && (
            <select id="cls-student" value={studentId} onChange={e => setStudentId(e.target.value)} className="input">
              <option value="">{t('write_manually')}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {!studentId && (
            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
              placeholder={t('student_name_placeholder')} required className={`input ${students.length ? 'mt-2' : ''}`} aria-label={t('student_label')} />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="cls-date">{t('date_label')}</label>
            <input id="cls-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="cls-start">{t('ui_start')}</label>
            <input id="cls-start" type="time" value={time} onChange={e => setTime(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="cls-end">{t('ui_end')}</label>
            <input id="cls-end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="input" />
          </div>
        </div>

        <div className="segmented w-full">
          {[30, 45, 60, 90].map(d => (
            <button key={d} type="button" aria-pressed={duration === d} onClick={() => setDuration(d)} className="flex-1">{d} min</button>
          ))}
        </div>

        <button type="button" role="switch" aria-checked={repeat} onClick={() => setRepeat(r => !r)}
          className="flex items-center gap-3 p-3.5 rounded-xl text-start bg-surface-2" style={{ border: '1px solid var(--border-subtle)' }}>
          <Repeat size={17} className="text-ink-3" />
          <span className="flex-1 text-[14px] text-ink">{t('ui_repeat_weekly')}</span>
          <Toggle on={repeat} />
        </button>
        {repeat && (
          <div className="flex items-center gap-3 -mt-1">
            <label htmlFor="cls-weeks" className="text-[13px] text-ink-3">{t('ui_weeks')}</label>
            <input id="cls-weeks" type="number" min={2} max={52} value={weeks} onChange={e => setWeeks(Number(e.target.value) || 1)} className="input w-24" />
          </div>
        )}

        <div>
          <label className="label" htmlFor="cls-notes">{t('notes_optional')}</label>
          <textarea id="cls-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={t('notes_placeholder')} className="input" />
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
