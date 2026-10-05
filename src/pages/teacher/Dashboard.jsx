import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'

const NAVY = '#1b2f6b'
const GOLD = '#c8941f'

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const bm = new Date(dateStr); bm.setHours(0, 0, 0, 0)
  return Math.round((bm - today) / (1000 * 60 * 60 * 24))
}

function bmLabel(days) {
  if (days === null) return null
  if (days === 0) return { text: '¡Hoy!', color: '#c8941f' }
  if (days > 0) return { text: `en ${days}d`, color: days < 30 ? '#b42318' : days < 90 ? '#9a6f12' : '#6b7280' }
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

  const today = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
  const stats = [
    { label: t('active_students'), value: students.length, sub: t('registered') },
    { label: t('pending_hw_kpi'), value: pendingHw, sub: t('not_sent') },
    { label: t('next_class'), value: nextClassLabel.time, sub: nextClassLabel.sub },
  ]
  const links = [
    { label: 'Perashiot', path: '/teacher/study' },
    { label: 'Nueva clase', path: '/teacher/schedule' },
    { label: 'Ver deberes', path: '/teacher/homework' },
    { label: 'Alumnos', path: '/teacher/students' },
  ]

  return (
    <div className="px-5 sm:px-10 py-8 max-w-6xl w-full mx-auto">
      {/* Masthead */}
      <header className="flex flex-wrap items-end justify-between gap-4 pb-2 mb-8">
        <div>
          <p className="eyebrow mb-2 capitalize">{today}</p>
          <h1 className="serif text-4xl sm:text-5xl" style={{ color: NAVY, fontWeight: 600 }}>
            Shalom, {profile?.name || 'Profesor'}
          </h1>
        </div>
      </header>

      {/* Figures: one ruled strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 mb-12">
        {stats.map((k, n) => (
          <div key={k.label} className="py-5 sm:px-6 first:sm:ps-0" >
            <p className="eyebrow" style={{ color: 'var(--text-3)' }}>{k.label}</p>
            <div className="serif text-5xl mt-3" style={{ color: NAVY, fontWeight: 600 }}>{k.value}</div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        {/* Students ledger */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="serif text-2xl" style={{ color: NAVY, fontWeight: 600 }}>{t('my_students')}</h2>
            <button onClick={() => navigate('/teacher/students')} className="text-sm underline underline-offset-4" style={{ color: NAVY }}>
              Ver todos →
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#e5e7eb', borderTopColor: NAVY }} />
            </div>
          ) : sortedStudents.length === 0 ? (
            <p className="text-sm py-10" style={{ color: 'var(--text-3)', borderTop: '1px solid var(--border)' }}>{t('no_students_yet')}</p>
          ) : (
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-left" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {[t('nav_students'), t('my_parasha'), t('bar_mitzvah'), t('nav_homework')].map(h => (
                    <th key={h} className="eyebrow py-2 pe-3 font-medium" style={{ color: 'var(--text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map(s => {
                  const bm = bmLabel(daysUntil(s.bar_mitzvah))
                  const hw = pendingPerStudent[s.id] || 0
                  return (
                    <tr key={s.id} onClick={() => navigate('/teacher/students')}
                      className="cursor-pointer transition-colors hover:bg-[var(--bg-deep)]"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="py-4 pe-3 serif text-lg" style={{ color: NAVY, fontWeight: 600 }}>{s.name}</td>
                      <td className="py-4 pe-3" style={{ color: s.parasha_id ? 'var(--text-2)' : 'var(--text-muted)' }}>{s.parasha_id || '—'}</td>
                      <td className="py-4 pe-3">
                        {s.bar_mitzvah ? (
                          <>
                            <span style={{ color: 'var(--text-2)' }}>{new Date(s.bar_mitzvah).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {bm && <span className="ms-2 text-xs font-medium" style={{ color: bm.color }}>{bm.text}</span>}
                          </>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="py-4 tabular-nums" style={{ color: hw > 0 ? GOLD : 'var(--text-muted)', fontWeight: hw > 0 ? 600 : 400 }}>
                        {hw > 0 ? hw : '✓'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Margin column */}
        <aside className="flex flex-col gap-10">
          {profile?.teacher_code && (
            <div className="p-6" style={{ background: NAVY, color: '#fff', borderRadius: 4, boxShadow: `6px 6px 0 ${GOLD}` }}>
              <p className="eyebrow" style={{ color: '#e3b448' }}>{t('teacher_code')}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="serif text-4xl" style={{ letterSpacing: '0.12em', fontWeight: 600 }}>{profile.teacher_code}</span>
                <button onClick={() => navigator.clipboard.writeText(profile.teacher_code)}
                  className="text-xs underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Copiar
                </button>
              </div>
              <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('share_code')}</p>
            </div>
          )}

          <div>
            <h2 className="serif text-2xl mb-2" style={{ color: NAVY, fontWeight: 600 }}>{t('quick_actions')}</h2>
            <ul>
              {links.map(a => (
                <li key={a.label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <button onClick={() => navigate(a.path)} className="w-full flex items-center justify-between py-3.5 text-sm group" style={{ color: 'var(--text)' }}>
                    {a.label}
                    <span className="transition-transform group-hover:translate-x-1" style={{ color: GOLD }}>→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
