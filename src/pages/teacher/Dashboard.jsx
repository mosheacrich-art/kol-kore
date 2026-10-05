import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, ClipboardList, Copy, Plus, Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useWeeklyParasha } from '../../hooks/useWeeklyParasha'
import { Avatar, CardHeader, EmptyState, IconTile, PageHeader, Spinner } from '../../components/ui'
import { capitalize, daysUntil, displayParashaName } from '../../utils/parasha'

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { t } = useLang()
  const locale = t('date_locale') || 'es-ES'
  const { parasha: weekly } = useWeeklyParasha()

  const [students, setStudents] = useState([])
  const [pendingHw, setPendingHw] = useState(0)
  const [pendingPerStudent, setPendingPerStudent] = useState({})
  const [nextClass, setNextClass] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      setLoading(true)

      const { data: studs } = await supabase
        .from('profiles')
        .select('id, name, parasha_id, bar_mitzvah, listens')
        .eq('teacher_id', profile.id)
        .eq('role', 'student')
      const studentList = studs || []
      setStudents(studentList)

      if (studentList.length > 0) {
        const ids = studentList.map(s => s.id)
        const { data: hwRows } = await supabase
          .from('homework')
          .select('student_id')
          .in('student_id', ids)
          .eq('status', 'pending')
        const hwData = hwRows || []
        const perStudent = {}
        hwData.forEach(r => { perStudent[r.student_id] = (perStudent[r.student_id] || 0) + 1 })
        setPendingPerStudent(perStudent)
        setPendingHw(hwData.length)
      }

      const { data: nc } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', profile.id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      setNextClass(nc)

      setLoading(false)
    }
    load()
  }, [profile])

  const nextClassInfo = nextClass
    ? (() => {
        const d = new Date(nextClass.scheduled_at)
        const isToday = d.toDateString() === new Date().toDateString()
        const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
        const when = isToday ? t('today') : capitalize(d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' }))
        return { value: time, sub: `${when} · ${nextClass.student_name}` }
      })()
    : { value: '—', sub: t('no_classes') }

  const sortedStudents = [...students].sort((a, b) => {
    const da = daysUntil(a.bar_mitzvah)
    const db = daysUntil(b.bar_mitzvah)
    if (da === null && db === null) return (a.name || '').localeCompare(b.name || '')
    if (da === null) return 1
    if (db === null) return -1
    const fa = da >= 0 ? da : Infinity
    const fb = db >= 0 ? db : Infinity
    if (fa !== fb) return fa - fb
    return da - db
  })

  const today = capitalize(new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

  const kpis = [
    { icon: Users, tone: 'accent', value: students.length, label: t('active_students'), sub: t('registered'), to: '/teacher/students' },
    { icon: ClipboardList, tone: 'gold', value: pendingHw, label: t('pending_hw_kpi'), sub: t('not_sent'), to: '/teacher/homework' },
    { icon: CalendarDays, tone: 'accent', value: nextClassInfo.value, label: t('next_class'), sub: nextClassInfo.sub, to: '/teacher/schedule' },
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title={`Shalom, ${profile?.name || ''}`}
        subtitle={t('ui_dash_subtitle')}
        aside={<p className="hidden sm:block text-sm text-ink-3 pb-1">{today}</p>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ── Main column ──────────────────────────────────────────── */}
        <div className="xl:col-span-8 flex flex-col gap-6 min-w-0">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up-1">
            {kpis.map(k => (
              <button key={k.label} onClick={() => navigate(k.to)}
                className="card card-interactive group p-4 sm:p-5 text-start flex items-center gap-4 min-w-0">
                <IconTile icon={k.icon} tone={k.tone} size={48} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[28px] leading-none font-semibold text-ink tracking-tight tabular-nums">
                    {loading ? <span className="inline-block w-8 h-6 rounded-md bg-surface-2 animate-pulse align-middle" /> : k.value}
                  </span>
                  <span className="block text-[14px] font-medium text-ink-2 mt-2 truncate">{k.label}</span>
                  <span className="block text-[12px] text-ink-3 mt-0.5 truncate">{k.sub}</span>
                </span>
                <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-ink-3 transition-colors group-hover:text-ink"
                  style={{ border: '1px solid var(--border)' }}>
                  <ArrowRight size={15} strokeWidth={1.8} className="rtl:rotate-180" />
                </span>
              </button>
            ))}
          </div>

          {/* Students */}
          <section className="card p-5 sm:p-6 fade-up-2" aria-labelledby="dash-students">
            <CardHeader
              title={<span id="dash-students">{t('my_students')}</span>}
              subtitle={`${t('my_parasha')} · ${t('bar_mitzvah')} · ${t('nav_homework')}`}
              action={
                <button onClick={() => navigate('/teacher/students')} className="btn btn-secondary btn-sm">
                  {t('ui_view_all')}
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </button>
              }
              className="mb-5"
            />

            {loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : sortedStudents.length === 0 ? (
              <EmptyState icon={Users} title={t('no_students_yet')} description={t('share_code')} />
            ) : (
              <div role="table" aria-labelledby="dash-students">
                <div role="row" className="hidden md:grid table-head px-3 pb-3"
                  style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1.1fr) 72px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span role="columnheader">{t('nav_students')}</span>
                  <span role="columnheader">{t('my_parasha')}</span>
                  <span role="columnheader">{t('bar_mitzvah')}</span>
                  <span role="columnheader" className="text-center">{t('nav_homework')}</span>
                </div>
                <ul>
                  {sortedStudents.map(s => {
                    const days = daysUntil(s.bar_mitzvah)
                    const hw = pendingPerStudent[s.id] || 0
                    return (
                      <li key={s.id} role="row" style={{ borderBottom: '1px solid var(--border-subtle)' }} className="last:border-0">
                        <button onClick={() => navigate(`/teacher/students?s=${s.id}`)}
                          className="row-hover w-full grid items-center gap-3 px-3 py-3.5 rounded-xl text-start grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_72px]">
                          <span role="cell" className="flex items-center gap-3 min-w-0">
                            <Avatar name={s.name} size={36} single />
                            <span className="min-w-0">
                              <span className="block text-[14px] font-medium text-ink truncate">{s.name}</span>
                              <span className="block md:hidden text-[12px] text-ink-3 truncate">
                                {s.parasha_id ? displayParashaName(s.parasha_id) : '—'}
                              </span>
                            </span>
                          </span>
                          <span role="cell" className="hidden md:block text-[14px] truncate" style={{ color: s.parasha_id ? 'var(--text-2)' : 'var(--text-muted)' }}>
                            {s.parasha_id ? displayParashaName(s.parasha_id) : '—'}
                          </span>
                          <span role="cell" className="hidden md:flex flex-col min-w-0">
                            {s.bar_mitzvah ? (
                              <>
                                <span className="text-[13px] text-ink-2">
                                  {new Date(s.bar_mitzvah).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <BarMitzvahCountdown days={days} t={t} />
                              </>
                            ) : <span className="text-ink-4">—</span>}
                          </span>
                          <span role="cell" className="flex justify-center">
                            <HomeworkIndicator count={hw} t={t} />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* Editorial study banner */}
          <WeeklyStudyBanner parasha={weekly} t={t} onOpen={() => navigate(weekly ? `/teacher/study/${weekly.id}` : '/teacher/study')} />
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <aside className="xl:col-span-4 flex flex-col gap-6 fade-up-3">
          {profile?.teacher_code && <TeacherCodeCard code={profile.teacher_code} t={t} />}

          <section className="card p-5 sm:p-6">
            <h2 className="section-title mb-4">{t('quick_actions')}</h2>
            <div className="flex flex-col gap-2">
              <QuickAction primary icon={Plus} label={t('new_class')} onClick={() => navigate('/teacher/schedule?new=1')} />
              <QuickAction icon={ClipboardList} label={t('ui_view_homework')} onClick={() => navigate('/teacher/homework')} />
              <QuickAction icon={BookOpen} label={t('nav_parashot')} onClick={() => navigate('/teacher/study')} />
              <QuickAction icon={Users} label={t('nav_students')} onClick={() => navigate('/teacher/students')} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function BarMitzvahCountdown({ days, t }) {
  if (days === null) return null
  if (days === 0) return <span className="text-[12px] font-medium text-gold-ink">{t('ui_today_excl')}</span>
  if (days > 0) {
    const cls = days < 30 ? 'text-danger' : days < 90 ? 'text-gold-ink' : 'text-ink-3'
    return <span className={`text-[12px] font-medium ${cls}`}>{t('ui_in_days').replace('{n}', days)}</span>
  }
  return <span className="text-[12px] text-ink-4">{t('ui_days_ago').replace('{n}', Math.abs(days))}</span>
}

export function HomeworkIndicator({ count, t }) {
  if (count > 0) {
    return (
      <span className="min-w-[26px] h-[26px] px-2 rounded-full flex items-center justify-center text-[12px] font-semibold"
        style={{ background: 'rgba(var(--danger-rgb), 0.09)', color: 'rgb(var(--danger-rgb))' }}
        aria-label={`${count} ${t('pending_hw_kpi')}`}>
        {count}
      </span>
    )
  }
  return (
    <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
      style={{ background: 'rgba(var(--success-rgb), 0.1)', color: 'rgb(var(--success-rgb))' }}
      aria-label={t('ui_up_to_date')}>
      <Check size={14} strokeWidth={2.4} />
    </span>
  )
}

function TeacherCodeCard({ code, t }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(code) } catch { /* clipboard unavailable */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <section className="rounded-2xl p-5 sm:p-6"
      style={{
        background: 'linear-gradient(180deg, rgba(var(--gold-rgb), 0.09), rgba(var(--gold-rgb), 0.04))',
        border: '1px solid rgba(var(--gold-rgb), 0.22)',
      }}>
      <div className="flex items-start gap-3 mb-5">
        <IconTile icon={Users} tone="gold" size={40} />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{t('teacher_code')}</h2>
          <p className="text-[13px] text-ink-3 mt-1 leading-snug">{t('share_code')}</p>
        </div>
      </div>
      <div className="flex items-stretch gap-2.5">
        <div className="flex-1 flex items-center justify-center h-14 rounded-xl bg-surface font-mono text-[24px] font-semibold text-ink tracking-[0.32em] ps-[0.32em] select-all"
          style={{ border: '1px solid var(--border)' }} dir="ltr">
          {code}
        </div>
        <button onClick={copy} className="btn btn-gold h-14 w-14 p-0 rounded-xl" aria-label={t('ui_copy_code')} title={t('ui_copy_code')}>
          {copied ? <Check size={20} strokeWidth={2.2} /> : <Copy size={19} strokeWidth={1.9} />}
        </button>
      </div>
      <p className={`text-[12px] mt-2 h-4 transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`} style={{ color: 'rgb(var(--success-rgb))' }} aria-live="polite">
        {copied ? t('ui_copied') : ''}
      </p>
    </section>
  )
}

function QuickAction({ icon: Icon, label, onClick, primary = false }) {
  return (
    <button onClick={onClick}
      className={`group flex items-center gap-3.5 h-[52px] px-4 rounded-xl text-[14px] font-medium transition-colors ${primary ? '' : 'hover:bg-surface-2'}`}
      style={primary
        ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }
        : { border: '1px solid var(--border)', color: 'var(--text)' }}>
      <Icon size={18} strokeWidth={1.8} className={primary ? '' : 'text-ink-3'} />
      <span className="flex-1 text-start">{label}</span>
      <ChevronRight size={16} strokeWidth={1.8} className={`rtl:rotate-180 transition-transform group-hover:translate-x-0.5 ${primary ? 'opacity-80' : 'text-ink-4'}`} />
    </button>
  )
}

function WeeklyStudyBanner({ parasha, t, onOpen }) {
  return (
    <section className="card overflow-hidden fade-up-3">
      <button onClick={onOpen} className="group w-full grid grid-cols-1 sm:grid-cols-[1fr_minmax(0,1.05fr)] text-start">
        <div className="p-6 sm:p-7 flex flex-col justify-center gap-1.5">
          <p className="eyebrow">{t('ui_continue_study')}</p>
          <h2 className="font-serif text-[26px] font-semibold text-ink tracking-[-0.015em] leading-tight">{t('ui_weekly_parasha')}</h2>
          <p className="text-[15px] text-ink-3">{parasha?.name || '—'}</p>
          <span className="mt-4 w-11 h-11 rounded-full btn-gold inline-flex items-center justify-center transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={18} strokeWidth={2} className="rtl:rotate-180" />
          </span>
        </div>
        {/* Decorative photo (Torah reading with yad) */}
        <div className="relative min-h-[150px] sm:min-h-full overflow-hidden mask-fade-start" aria-hidden="true">
          <img src="/banner-torah.webp" alt="" draggable="false"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ objectPosition: '60% 55%' }} />
        </div>
      </button>
    </section>
  )
}
