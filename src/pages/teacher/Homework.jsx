import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { PARASHOT } from '../../data/parashot'

const statusStyle = {
  pending:   { bg: 'var(--bg-card)', color: 'var(--text-3)', label: 'Pendiente' },
  submitted: { bg: 'rgba(45,212,191,0.1)', color: '#0d9488', label: 'Entregado' },
  late:      { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Tarde' },
}

const ALIYAH_LABELS = ['1ª Aliyá', '2ª Aliyá', '3ª Aliyá', '4ª Aliyá', '5ª Aliyá', '6ª Aliyá', '7ª Aliyá', 'Maftir']

export default function TeacherHomework() {
  const { isDark } = useTheme()
  const { profile } = useAuth()
  const [composing, setComposing] = useState(false)
  const [sent, setSent] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({
    to: '', task: '', subject: '', due: '',
    parasha_id: '', aliyah_idx: 0, require_audio: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('homework')
      .select('*, student:student_id(name)')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSent(data || []))

    supabase
      .from('profiles')
      .select('id, name')
      .eq('teacher_id', profile.id)
      .eq('role', 'student')
      .then(({ data }) => {
        setStudents(data || [])
        if (data?.length) setForm(f => ({ ...f, to: data[0].id }))
      })
  }, [profile])

  const selectedParasha = PARASHOT.find(p => p.id === form.parasha_id)

  const sendHomework = async () => {
    if (!form.task) return
    setSaving(true)
    const { data } = await supabase.from('homework').insert({
      teacher_id: profile.id,
      student_id: form.to || null,
      task: form.task,
      subject: form.subject || null,
      due: form.due || null,
      parasha_id: form.parasha_id || null,
      aliyah_idx: form.parasha_id ? form.aliyah_idx : null,
      require_audio: form.parasha_id ? form.require_audio : false,
      status: 'pending',
    }).select('*, student:student_id(name)').single()

    if (data) setSent(prev => [data, ...prev])
    setComposing(false)
    setForm(f => ({ ...f, task: '', subject: '', due: '', parasha_id: '', aliyah_idx: 0, require_audio: false }))
    setSaving(false)
  }

  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          שִׁעוּרֵי בַּיִת · Deberes
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Gestión de Deberes
        </h1>
      </div>

      <div className="flex items-center justify-between mb-6 fade-up-2">
        <div />
        <button onClick={() => setComposing(true)}
          className="btn-gold px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Nuevo deber
        </button>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Enviar deber</h2>
              <button onClick={() => setComposing(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Alumno */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Para</label>
                <select value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Tarea */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Tarea</label>
                <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
                  placeholder="Descripción del deber..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>

              {/* Perashá */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>
                  Perashá <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
                </label>
                <select value={form.parasha_id}
                  onChange={e => setForm(f => ({ ...f, parasha_id: e.target.value, aliyah_idx: 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                  <option value="">— Sin perashá específica —</option>
                  {PARASHOT.map(p => (
                    <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>
                  ))}
                </select>
              </div>

              {/* Aliyá — solo si hay perashá */}
              {form.parasha_id && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Trozo (Aliyá)</label>
                  <select value={form.aliyah_idx}
                    onChange={e => setForm(f => ({ ...f, aliyah_idx: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                    {(selectedParasha?.aliyot || []).map((a, i) => (
                      <option key={i} value={i}>{a.n === 8 ? 'Maftir' : `${a.n}ª Aliyá`} — {a.ref}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Requiere audio — solo si hay perashá */}
              {form.parasha_id && (
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, require_audio: !f.require_audio }))}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                  style={{
                    background: form.require_audio ? 'rgba(108,51,230,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${form.require_audio ? 'rgba(108,51,230,0.3)' : 'var(--border)'}`,
                    color: 'var(--text)',
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: form.require_audio ? 'rgba(108,51,230,0.2)' : 'var(--border-subtle)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="5" y="1" width="4" height="7" rx="2"
                        stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2"/>
                      <path d="M2 7c0 2.8 2.2 5 5 5s5-2.2 5-5"
                        stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M7 12v1" stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: form.require_audio ? '#6c33e6' : 'var(--text)' }}>
                      Requiere grabación de audio
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {form.require_audio ? 'El alumno debe grabar esta aliyá' : 'Sin audio obligatorio'}
                    </div>
                  </div>
                  <div className="ml-auto w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: form.require_audio ? '#6c33e6' : 'var(--border)', background: form.require_audio ? '#6c33e6' : 'transparent' }}>
                    {form.require_audio && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Materia</label>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Ej: Trop"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Fecha límite</label>
                  <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setComposing(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                Cancelar
              </button>
              <button onClick={sendHomework} disabled={saving || !form.task}
                className="flex-1 btn-gold py-2.5 rounded-xl text-xs font-semibold"
                style={{ opacity: saving || !form.task ? 0.6 : 1 }}>
                {saving ? 'Enviando…' : 'Enviar deber'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="fade-up-3 flex flex-col gap-3">
        {sent.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay deberes enviados aún
          </div>
        )}
        {sent.map(item => {
          const s = statusStyle[item.status] || statusStyle.pending
          const parasha = item.parasha_id ? PARASHOT.find(p => p.id === item.parasha_id) : null
          const aliyahLabel = parasha && item.aliyah_idx != null
            ? (parasha.aliyot[item.aliyah_idx]?.n === 8 ? 'Maftir' : `${parasha.aliyot[item.aliyah_idx]?.n}ª Aliyá`)
            : null

          return (
            <div key={item.id} className="flex items-start gap-4 p-5 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(108,51,230,0.15)', color: '#6c33e6' }}>
                {item.student?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {item.student?.name || 'Todos'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{item.task}</p>

                {/* Parasha + aliyah badge */}
                {parasha && aliyahLabel && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                      style={{ background: 'rgba(108,51,230,0.1)', color: '#6c33e6', border: '1px solid rgba(108,51,230,0.2)' }}>
                      <span className="hebrew">{parasha.heb}</span>
                      <span>·</span>
                      <span>{aliyahLabel}</span>
                    </span>
                    {item.require_audio && (
                      <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <rect x="3" y="0.5" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                          <path d="M1 4.5c0 1.9 1.6 3.5 3.5 3.5S8 6.4 8 4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                        Audio requerido
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {item.subject && (
                    <span className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                      {item.subject}
                    </span>
                  )}
                  {item.due && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Límite {new Date(item.due).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
