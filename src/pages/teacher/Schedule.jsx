import { useState } from 'react'

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DATES = [21, 22, 23, 24, 25, 26, 27]
const TODAY = 21

const CLASSES = [
  { id: 1, day: 0, time: '18:00', duration: 60, student: 'Avraham Cohen', type: 'Trop', color: '#6c33e6', avatar: 'A' },
  { id: 2, day: 1, time: '17:30', duration: 45, student: 'Yaakov Katz', type: 'Lectura', color: '#2dd4bf', avatar: 'K' },
  { id: 3, day: 3, time: '17:30', duration: 60, student: 'Yitzhak Levy', type: 'Repaso', color: '#f9b800', avatar: 'Y' },
  { id: 4, day: 4, time: '16:00', duration: 45, student: 'Moshe Goldberg', type: 'Inicio', color: '#f87171', avatar: 'M' },
  { id: 5, day: 1, time: '19:30', duration: 60, student: 'Avraham Cohen', type: 'Repaso Brajot', color: '#6c33e6', avatar: 'A' },
]

export default function TeacherSchedule() {
  const [view, setView] = useState('week')
  const [selectedDay, setSelectedDay] = useState(0)

  const dayClasses = CLASSES.filter(c => c.day === selectedDay)

  return (
    <div className="p-8">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          שִׁעוּרִים · Clases
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Calendario de clases
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Semana del 21–27 de Abril, 2026
        </p>
      </div>

      {/* Week strip */}
      <div className="rounded-2xl p-5 mb-6 fade-up-2"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-7 gap-2">
          {WEEK_DAYS.map((day, i) => {
            const hasClass = CLASSES.some(c => c.day === i)
            const isToday = DATES[i] === TODAY
            const isSelected = selectedDay === i
            return (
              <button key={day} onClick={() => setSelectedDay(i)}
                className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: isSelected ? 'rgba(249,184,0,0.15)' : isToday ? 'var(--bg-card)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(249,184,0,0.3)' : isToday ? 'var(--border)' : 'transparent'}`,
                }}>
                <span className="text-xs" style={{ color: isSelected ? '#f9b800' : 'var(--text-3)' }}>{day}</span>
                <span className="text-lg font-light" style={{ color: isSelected ? '#f9b800' : isToday ? 'var(--text)' : 'var(--text-2)' }}>
                  {DATES[i]}
                </span>
                {hasClass ? (
                  <div className="flex gap-1">
                    {CLASSES.filter(c => c.day === i).map(c => (
                      <div key={c.id} className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    ))}
                  </div>
                ) : (
                  <div className="h-1.5" />
                )}
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
                {WEEK_DAYS[selectedDay]} {DATES[selectedDay]} Abril
                {DATES[selectedDay] === TODAY && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(45,212,191,0.15)', color: '#0d9488' }}>Hoy</span>
                )}
              </h2>
              <button className="btn-gold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Añadir
              </button>
            </div>

            {dayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--text-muted)' }}>
                    <rect x="2" y="3" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M6 2v2M14 2v2M2 8h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin clases este día</p>
              </div>
            ) : (
              <div className="relative">
                {['15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => (
                  <div key={t} className="flex items-start gap-3 mb-6">
                    <span className="text-xs w-10 flex-shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>{t}</span>
                    <div className="flex-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      {dayClasses.filter(c => c.time.startsWith(t.split(':')[0])).map(cls => (
                        <div key={cls.id} className="rounded-xl p-4 mt-1 mb-2"
                          style={{
                            background: `linear-gradient(135deg, ${cls.color}20, ${cls.color}08)`,
                            border: `1px solid ${cls.color}30`,
                          }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                                style={{ background: `${cls.color}30`, color: cls.color }}>
                                {cls.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{cls.student}</p>
                                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{cls.time} · {cls.duration}min · {cls.type}</p>
                              </div>
                            </div>
                            <button className="text-xs px-3 py-1.5 rounded-lg"
                              style={{ background: `${cls.color}18`, color: cls.color, border: `1px solid ${cls.color}25` }}>
                              Ver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Week summary */}
        <div className="fade-up-4">
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text)' }}>Resumen semana</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Clases', value: CLASSES.length, color: '#f9b800' },
                { label: 'Horas', value: `${Math.round(CLASSES.reduce((s, c) => s + c.duration, 0) / 60 * 10) / 10}h`, color: '#6c33e6' },
                { label: 'Alumnos', value: [...new Set(CLASSES.map(c => c.student))].length, color: '#2dd4bf' },
                { label: 'Completadas', value: 2, color: '#a78bfa' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: `${s.color}10`, border: `1px solid ${s.color}18` }}>
                  <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Clases por alumno</p>
              {[
                { name: 'Avraham Cohen', count: 2, color: '#6c33e6' },
                { name: 'Yaakov Katz', count: 1, color: '#2dd4bf' },
                { name: 'Yitzhak Levy', count: 1, color: '#f9b800' },
                { name: 'Moshe Goldberg', count: 1, color: '#f87171' },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs" style={{ color: 'var(--text-2)' }}>{s.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-xs" style={{ color: s.color }}>{s.count} clase{s.count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
