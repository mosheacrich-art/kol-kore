import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const CLASS_TYPES = ['Clase', 'Trop', 'Lectura', 'Repaso', 'Maftir', 'Brajot']
const COLORS = ['#6c33e6', '#f9b800', '#2dd4bf', '#f87171', '#a78bfa', '#34d399']
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

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

function fmt(date) {
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function TeacherSchedule() {
  const { profile } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay()
    return today === 0 ? 6 : today - 1
  })
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    if (!profile) return
    supabase.from('profiles').select('id, name').eq('teacher_id', profile.id).eq('role', 'student')
      .then(({ data }) => setStudents(data || []))
  }, [profile])

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    supabase.from('classes').select('*').eq('teacher_id', profile.id)
      .gte('scheduled_at', from).lt('scheduled_at', to)
      .order('scheduled_at')
      .then(({ data }) => { setClasses(data || []); setLoading(false) })
  }, [profile, weekStart])

  const dayClasses = classes.filter(c => {
    const d = new Date(c.scheduled_at)
    const idx = d.getDay() === 0 ? 6 : d.getDay() - 1
    return idx === selectedDay
  })

  const colorFor = (name) => COLORS[Math.abs(name?.charCodeAt(0) ?? 0) % COLORS.length]

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta clase?')) return
    await supabase.from('classes').delete().eq('id', id)
    setClasses(prev => prev.filter(c => c.id !== id))
  }

  const weekLabel = `${fmt(weekStart)} – ${fmt(addDays(weekStart, 6))}`

  // Summary stats for the week
  const uniqueStudents = [...new Set(classes.map(c => c.student_name))]
  const totalMinutes = classes.reduce((s, c) => s + (c.duration_min || 0), 0)

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          שִׁעוּרִים · Clases
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
              Calendario de clases
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{weekLabel}</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #f9b800, #ffd54f)', color: '#0d0b1e', boxShadow: '0 4px 16px rgba(249,184,0,0.3)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Nueva clase
          </button>
        </div>
      </div>

      {/* Week navigation + strip */}
      <div className="rounded-2xl p-4 mb-6 fade-up-2"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekStart(w => addDays(w, -7))}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => { setWeekStart(getWeekStart(new Date())); const t = new Date().getDay(); setSelectedDay(t === 0 ? 6 : t - 1) }}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
            Hoy
          </button>
          <button onClick={() => setWeekStart(w => addDays(w, 7))}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => {
            const dayClsCount = classes.filter(c => {
              const cd = new Date(c.scheduled_at)
              return cd.toDateString() === d.toDateString()
            })
            const isToday = d.toDateString() === today.toDateString()
            const isSelected = selectedDay === i
            return (
              <button key={i} onClick={() => setSelectedDay(i)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                style={{
                  background: isSelected ? 'rgba(249,184,0,0.15)' : isToday ? 'var(--overlay)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(249,184,0,0.35)' : isToday ? 'var(--border)' : 'transparent'}`,
                }}>
                <span className="text-xs" style={{ color: isSelected ? '#f9b800' : 'var(--text-3)' }}>{WEEK_DAYS[i]}</span>
                <span className="text-base font-light" style={{ color: isSelected ? '#f9b800' : isToday ? 'var(--text)' : 'var(--text-2)' }}>
                  {d.getDate()}
                </span>
                {dayClsCount.length > 0 ? (
                  <div className="flex gap-0.5">
                    {dayClsCount.slice(0, 3).map((c, ci) => (
                      <div key={ci} className="w-1.5 h-1.5 rounded-full" style={{ background: colorFor(c.student_name) }} />
                    ))}
                  </div>
                ) : <div className="h-1.5" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Day detail */}
        <div className="xl:col-span-2 fade-up-3">
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {WEEK_DAYS[selectedDay]} {weekDays[selectedDay]?.getDate()} · {weekDays[selectedDay]?.toLocaleDateString('es', { month: 'long' })}
                {weekDays[selectedDay]?.toDateString() === today.toDateString() && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(45,212,191,0.15)', color: '#0d9488' }}>Hoy</span>
                )}
              </h2>
              <button onClick={() => setShowModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                style={{ background: 'rgba(249,184,0,0.12)', color: '#d97706', border: '1px solid rgba(249,184,0,0.25)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Añadir
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
              </div>
            ) : dayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--text-muted)' }}>
                    <rect x="2" y="3" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M6 2v2M14 2v2M2 8h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin clases este día</p>
                <button onClick={() => setShowModal(true)}
                  className="text-xs px-4 py-2 rounded-lg transition-all"
                  style={{ background: 'rgba(249,184,0,0.1)', color: '#d97706', border: '1px solid rgba(249,184,0,0.2)' }}>
                  + Añadir clase
                </button>
              </div>
            ) : (
              <div className="relative">
                {TIME_SLOTS.map(slot => {
                  const slotHour = parseInt(slot)
                  const slotClasses = dayClasses.filter(c => {
                    const h = new Date(c.scheduled_at).getHours()
                    return h === slotHour
                  })
                  if (slotClasses.length === 0) return null
                  return (
                    <div key={slot} className="flex items-start gap-3 mb-4">
                      <span className="text-xs w-10 flex-shrink-0 pt-1" style={{ color: 'var(--text-muted)' }}>{slot}</span>
                      <div className="flex-1" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                        {slotClasses.map(cls => {
                          const color = colorFor(cls.student_name)
                          const time = new Date(cls.scheduled_at)
                          const hh = time.getHours().toString().padStart(2, '0')
                          const mm = time.getMinutes().toString().padStart(2, '0')
                          return (
                            <div key={cls.id} className="rounded-xl p-4 mb-2"
                              style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)`, border: `1px solid ${color}30` }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                                    style={{ background: `${color}30`, color }}>
                                    {cls.student_name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{cls.student_name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{hh}:{mm} · {cls.duration_min}min · {cls.type}</p>
                                    {cls.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cls.notes}</p>}
                                  </div>
                                </div>
                                <button onClick={() => handleDelete(cls.id)}
                                  className="p-1.5 rounded-lg transition-all"
                                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M1.5 3h7M3.5 3V2h3v1M4 5v2.5M6 5v2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                    <path d="M2.5 3l.5 5h4l.5-5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Week summary */}
        <div className="fade-up-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text)' }}>Resumen semana</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Clases', value: classes.length, color: '#f9b800' },
                { label: 'Horas', value: `${(totalMinutes / 60).toFixed(1)}h`, color: '#6c33e6' },
                { label: 'Alumnos', value: uniqueStudents.length, color: '#2dd4bf' },
                { label: 'Hoy', value: classes.filter(c => new Date(c.scheduled_at).toDateString() === today.toDateString()).length, color: '#a78bfa' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: `${s.color}10`, border: `1px solid ${s.color}18` }}>
                  <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {uniqueStudents.length > 0 && (
              <div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Clases por alumno</p>
                {uniqueStudents.map(name => {
                  const count = classes.filter(c => c.student_name === name).length
                  const color = colorFor(name)
                  return (
                    <div key={name} className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        <span className="text-xs" style={{ color: 'var(--text-2)' }}>{name.split(' ')[0]}</span>
                      </div>
                      <span className="text-xs" style={{ color }}>{count} clase{count !== 1 ? 's' : ''}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {classes.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Sin clases esta semana
              </p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <AddClassModal
          profile={profile}
          students={students}
          defaultDay={weekDays[selectedDay]}
          onClose={() => setShowModal(false)}
          onSaved={(cls) => { setClasses(prev => [...prev, cls].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) }}
        />
      )}
    </div>
  )
}

function AddClassModal({ profile, students, defaultDay, onClose, onSaved }) {
  const defaultDate = defaultDay instanceof Date ? defaultDay : new Date()
  const pad = n => n.toString().padStart(2, '0')
  const defaultDateStr = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}`

  const [studentId, setStudentId] = useState('')
  const [customName, setCustomName] = useState('')
  const [type, setType] = useState('Clase')
  const [date, setDate] = useState(defaultDateStr)
  const [time, setTime] = useState('18:00')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const studentName = studentId
    ? students.find(s => s.id === studentId)?.name || customName
    : customName

  const handleSave = async (e) => {
    e.preventDefault()
    if (!studentName.trim()) { setError('Introduce un nombre de alumno'); return }
    setSaving(true)
    setError('')
    const scheduled_at = new Date(`${date}T${time}:00`).toISOString()
    const { data, error: err } = await supabase.from('classes').insert({
      teacher_id: profile.id,
      student_id: studentId || null,
      student_name: studentName.trim(),
      type,
      scheduled_at,
      duration_min: duration,
      notes: notes || null,
    }).select().single()

    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data)
    onClose()
  }

  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    outline: 'none',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Nueva clase</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-3">

          {/* Student picker */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Alumno</label>
            {students.length > 0 ? (
              <select value={studentId} onChange={e => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm" style={inputStyle}>
                <option value="">— Escribir nombre manualmente —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : null}
            {!studentId && (
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder="Nombre del alumno" required={!studentId}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm mt-1.5" style={inputStyle} />
            )}
          </div>

          {/* Type */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Tipo</label>
            <div className="flex flex-wrap gap-1.5">
              {CLASS_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: type === t ? '#f9b800' : 'var(--bg-card)',
                    color: type === t ? '#0d0b1e' : 'var(--text-3)',
                    border: `1px solid ${type === t ? '#f9b800' : 'var(--border)'}`,
                  }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Hora</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm" style={inputStyle} />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Duración</label>
            <div className="flex gap-2">
              {[30, 45, 60, 90].map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: duration === d ? '#6c33e6' : 'var(--bg-card)',
                    color: duration === d ? '#fff' : 'var(--text-3)',
                    border: `1px solid ${duration === d ? '#6c33e6' : 'var(--border)'}`,
                  }}>{d}min</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Notas (opcional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="ej. Traer tikún, parasha Vaera…"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm" style={inputStyle} />
          </div>

          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-1"
            style={{
              background: saving ? 'var(--bg-card)' : 'linear-gradient(135deg, #6c33e6, #8b5cf6)',
              color: saving ? 'var(--text-3)' : '#fff',
              border: saving ? '1px solid var(--border)' : 'none',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(108,51,230,0.3)',
            }}>
            {saving ? 'Guardando…' : 'Guardar clase'}
          </button>
        </form>
      </div>
    </div>
  )
}
