import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'

const COLORS = ['#6c33e6', '#f9b800', '#2dd4bf', '#f87171', '#a78bfa']

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const bm = new Date(dateStr); bm.setHours(0, 0, 0, 0)
  return Math.round((bm - today) / (1000 * 60 * 60 * 24))
}

function bmLabel(days) {
  if (days === null) return null
  if (days === 0) return { text: '¡Hoy!', color: '#f9b800' }
  if (days > 0) return { text: `en ${days}d`, color: days < 30 ? '#f87171' : days < 90 ? '#f9b800' : '#2dd4bf' }
  return { text: `hace ${Math.abs(days)}d`, color: 'var(--text-muted)' }
}

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { t } = useLang()
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

  const nextClassLabel = nextClass
    ? (() => {
        const d = new Date(nextClass.scheduled_at)
        const today = new Date()
        const isToday = d.toDateString() === today.toDateString()
        const h = d.getHours().toString().padStart(2, '0')
        const m = d.getMinutes().toString().padStart(2, '0')
        return { time: `${h}:${m}`, sub: isToday ? `${t('today')} · ${nextClass.student_name}` : `${d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })} · ${nextClass.student_name}` }
      })()
    : { time: '—', sub: t('no_classes') }

  const sortedStudents = [...students].sort((a, b) => {
    const da = daysUntil(a.bar_mitzvah)
    const db = daysUntil(b.bar_mitzvah)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    const fa = da >= 0 ? da : Infinity
    const fb = db >= 0 ? db : Infinity
    if (fa !== fb) return fa - fb
    return da - db
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          לוּחַ · Dashboard
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Shalom, {profile?.name || 'Profesor'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          {students.length} active student{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 fade-up-2">
        {[
          { label: t('active_students'), value: students.length, sub: t('registered'), color: '#6c33e6', glow: 'rgba(108,51,230,0.15)' },
          { label: t('pending_hw_kpi'), value: pendingHw, sub: t('not_sent'), color: '#2dd4bf', glow: 'rgba(45,212,191,0.12)' },
          { label: t('next_class'), value: nextClassLabel.time, sub: nextClassLabel.sub, color: '#f87171', glow: 'rgba(248,113,113,0.12)' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: `radial-gradient(ellipse at 20% 20%, ${kpi.glow}, var(--bg-card) 60%)`, border: `1px solid ${kpi.color}20` }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-15 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${kpi.color}, transparent)`, filter: 'blur(16px)', transform: 'translate(25%, -25%)' }} />
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{kpi.label}</p>
            <div className="text-3xl font-light" style={{ color: kpi.color }}>{kpi.value}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Students panel */}
        <div className="xl:col-span-2 fade-up-3">
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('my_students')}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('my_parasha')} · {t('bar_mitzvah')} · {t('nav_homework')}</p>
              </div>
              <button onClick={() => navigate('/teacher/students')}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                Ver todos
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
              </div>
            ) : sortedStudents.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>{t('no_students_yet')}</p>
            ) : (
              <>
                {/* Header row */}
                <div className="grid gap-3 px-3 pb-2 text-xs" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', color: 'var(--text-muted)' }}>
                  <span>{t('nav_students')}</span>
                  <span>{t('my_parasha')}</span>
                  <span>{t('bar_mitzvah')}</span>
                  <span>{t('nav_homework')}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {sortedStudents.map((s, i) => {
                    const color = COLORS[i % COLORS.length]
                    const days = daysUntil(s.bar_mitzvah)
                    const bm = bmLabel(days)
                    const hw = pendingPerStudent[s.id] || 0
                    return (
                      <div key={s.id}
                        className="grid items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all"
                        style={{ gridTemplateColumns: '1fr 1fr 1fr auto', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                        onClick={() => navigate('/teacher/students')}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40` }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}>

                        {/* Name */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                            {s.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{s.name}</span>
                        </div>

                        {/* Parasha */}
                        <span className="text-xs truncate" style={{ color: s.parasha_id ? 'var(--text-2)' : 'var(--text-muted)' }}>
                          {s.parasha_id || '—'}
                        </span>

                        {/* Bar Mitzvah */}
                        <div className="flex flex-col gap-0.5">
                          {s.bar_mitzvah ? (
                            <>
                              <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                                {new Date(s.bar_mitzvah).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {bm && <span className="text-xs font-medium" style={{ color: bm.color }}>{bm.text}</span>}
                            </>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>

                        {/* Pending HW */}
                        {hw > 0 ? (
                          <span className="text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center font-medium"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {hw}
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)' }}>
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <path d="M1.5 4.5l2 2 4-4" stroke="#2dd4bf" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="fade-up-4">
          {profile?.teacher_code && (
            <div className="rounded-2xl p-5 mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(249,184,0,0.12), rgba(249,184,0,0.04))', border: '1px solid rgba(249,184,0,0.25)' }}>
              <h2 className="text-xs mb-3" style={{ color: 'var(--text-gold)' }}>{t('teacher_code')}</h2>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-mono font-bold tracking-widest" style={{ color: '#d97706', letterSpacing: '6px' }}>
                  {profile.teacher_code}
                </div>
                <button onClick={() => navigator.clipboard.writeText(profile.teacher_code)}
                  title="Copiar código"
                  className="ml-auto p-2 rounded-lg transition-all"
                  style={{ background: 'rgba(249,184,0,0.15)', color: '#d97706', border: '1px solid rgba(249,184,0,0.25)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M4 3V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M2 4h2M2 4v8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('share_code')}</p>
            </div>
          )}

          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('quick_actions')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Perashiot', color: '#6c33e6', path: '/teacher/study' },
                { label: 'Nueva clase', color: '#f9b800', path: '/teacher/schedule' },
                { label: 'Ver deberes', color: '#2dd4bf', path: '/teacher/homework' },
                { label: 'Alumnos', color: '#f87171', path: '/teacher/students' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  className="p-3 rounded-xl text-xs font-medium text-left transition-all"
                  style={{ background: `${a.color}10`, border: `1px solid ${a.color}20`, color: a.color }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${a.color}20` }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${a.color}10` }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
