import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const COLORS = ['#6c33e6', '#f9b800', '#2dd4bf', '#f87171', '#a78bfa']
const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function getLastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
}

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [dailyListens, setDailyListens] = useState(Array(7).fill(0))
  const [pendingHw, setPendingHw] = useState(0)
  const [nextClass, setNextClass] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const load = async () => {
      setLoading(true)

      // Students
      const { data: studs } = await supabase
        .from('profiles')
        .select('id, name, listens, progress, parasha_id')
        .eq('teacher_id', profile.id)
        .eq('role', 'student')
      const studentList = studs || []
      setStudents(studentList)

      // Daily listens from notifications (last 7 days)
      const since = new Date()
      since.setDate(since.getDate() - 6)
      since.setHours(0, 0, 0, 0)
      const { data: listenEvents } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('teacher_id', profile.id)
        .eq('type', 'listen')
        .gte('created_at', since.toISOString())

      const counts = Array(7).fill(0)
      const days = getLastSevenDays()
      listenEvents?.forEach(ev => {
        const evDate = new Date(ev.created_at).toDateString()
        const idx = days.findIndex(d => d.toDateString() === evDate)
        if (idx >= 0) counts[idx]++
      })
      setDailyListens(counts)

      // Pending homework for teacher's students
      if (studentList.length > 0) {
        const { count } = await supabase
          .from('homework')
          .select('*', { count: 'exact', head: true })
          .in('student_id', studentList.map(s => s.id))
          .eq('status', 'pending')
        setPendingHw(count || 0)
      }

      // Next scheduled class
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

  const totalListens = students.reduce((s, a) => s + (a.listens || 0), 0)
  const avgProgress = students.length
    ? Math.round(students.reduce((s, a) => s + (a.progress || 0), 0) / students.length)
    : 0
  const maxListens = Math.max(...dailyListens, 1)
  const days = getLastSevenDays()

  const nextClassLabel = nextClass
    ? (() => {
        const d = new Date(nextClass.scheduled_at)
        const today = new Date()
        const isToday = d.toDateString() === today.toDateString()
        const h = d.getHours().toString().padStart(2, '0')
        const m = d.getMinutes().toString().padStart(2, '0')
        return { time: `${h}:${m}`, sub: isToday ? `Hoy · ${nextClass.student_name}` : `${d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })} · ${nextClass.student_name}` }
      })()
    : { time: '—', sub: 'Sin clases programadas' }

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
          {students.length} alumno{students.length !== 1 ? 's' : ''} activo{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 fade-up-2">
        {[
          { label: 'Alumnos activos', value: students.length, sub: 'registrados', color: '#6c33e6', glow: 'rgba(108,51,230,0.15)' },
          { label: 'Escuchas totales', value: totalListens, sub: 'acumuladas', color: '#f9b800', glow: 'rgba(249,184,0,0.12)' },
          { label: 'Deberes pendientes', value: pendingHw, sub: 'sin enviar', color: '#2dd4bf', glow: 'rgba(45,212,191,0.12)' },
          { label: 'Próxima clase', value: nextClassLabel.time, sub: nextClassLabel.sub, color: '#f87171', glow: 'rgba(248,113,113,0.12)' },
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
        {/* Audio chart */}
        <div className="xl:col-span-2 fade-up-3">
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Escuchas de audios</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Todos los alumnos · últimos 7 días</p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                Total: {dailyListens.reduce((a, b) => a + b, 0)}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center" style={{ height: '120px' }}>
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2" style={{ height: '120px' }}>
                {days.map((d, i) => {
                  const count = dailyListens[i]
                  const label = DAY_LABELS[d.getDay()]
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-gold)' }}>{count > 0 ? count : ''}</span>
                      <div className="w-full rounded-t-lg transition-all"
                        style={{
                          height: count > 0 ? `${(count / maxListens) * 80}px` : '4px',
                          background: count > 0 ? 'linear-gradient(to top, rgba(108,51,230,0.8), rgba(249,184,0,0.6))' : 'var(--border)',
                          minHeight: '4px',
                        }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {students.length > 0 && (
              <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Por alumno</p>
                <div className="flex flex-col gap-2.5">
                  {students.map((s, i) => {
                    const color = COLORS[i % COLORS.length]
                    return (
                      <div key={s.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                          {s.name?.charAt(0)}
                        </div>
                        <span className="text-xs w-24 flex-shrink-0 truncate" style={{ color: 'var(--text-2)' }}>{s.name?.split(' ')[0]}</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${Math.min(100, totalListens > 0 ? ((s.listens || 0) / Math.max(...students.map(x => x.listens || 0), 1)) * 100 : 0)}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                        </div>
                        <span className="text-xs w-8 text-right" style={{ color }}>{s.listens || 0}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {students.length === 0 && !loading && (
              <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
                Sin alumnos aún. Comparte tu código de profesor para que se unan.
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="fade-up-4">
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text)' }}>Mis alumnos</h2>
            {students.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No hay alumnos aún</p>
            ) : (
              <div className="flex flex-col gap-3">
                {students.map((s, i) => {
                  const color = COLORS[i % COLORS.length]
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${color}20`, color }}>
                        {s.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{s.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-3)' }}>{s.parasha_id || '—'}</div>
                      </div>
                      <span className="text-xs" style={{ color }}>{s.listens || 0} esc.</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {profile?.teacher_code && (
            <div className="rounded-2xl p-5 mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(249,184,0,0.12), rgba(249,184,0,0.04))', border: '1px solid rgba(249,184,0,0.25)' }}>
              <h2 className="text-xs mb-3" style={{ color: 'var(--text-gold)' }}>Tu código de profesor</h2>
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
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Comparte este código con tus alumnos para vincularse
              </p>
            </div>
          )}

          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Acciones rápidas</h2>
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
