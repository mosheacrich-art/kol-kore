import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { PARASHOT } from '../../data/parashot'

function AccountSection({ user }) {
  const [section, setSection] = useState(null) // null | 'email' | 'password'
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'ok'|'err', text }

  const show = (s) => { setSection(s); setMsg(null); setNewEmail(''); setNewPass(''); setConfirmPass('') }

  const handleEmail = async (e) => {
    e.preventDefault()
    if (!newEmail.includes('@')) { setMsg({ type: 'err', text: 'Email no válido' }); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setLoading(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setMsg({ type: 'ok', text: 'Te hemos enviado un enlace de confirmación al nuevo email.' })
    setSection(null)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (newPass.length < 6) { setMsg({ type: 'err', text: 'Mínimo 6 caracteres' }); return }
    if (newPass !== confirmPass) { setMsg({ type: 'err', text: 'Las contraseñas no coinciden' }); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setLoading(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setMsg({ type: 'ok', text: 'Contraseña actualizada correctamente.' })
    setSection(null)
  }

  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>Cuenta</p>

      {msg && (
        <div className="mb-3 p-2.5 rounded-xl text-xs"
          style={{
            background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: msg.type === 'ok' ? '#16a34a' : '#ef4444',
            border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
          {msg.text}
        </div>
      )}

      {/* Email display */}
      <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-2)' }}>{user?.email}</p>
        </div>
        <button onClick={() => show(section === 'email' ? null : 'email')}
          className="text-xs px-2.5 py-1 rounded-lg transition-all"
          style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
          Cambiar
        </button>
      </div>

      {section === 'email' && (
        <form onSubmit={handleEmail} className="flex flex-col gap-2 pt-3">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="Nuevo email" required autoFocus
            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
            style={inputStyle} />
          <button type="submit" disabled={loading}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: loading ? 'var(--bg-card)' : '#6c33e6', color: loading ? 'var(--text-3)' : '#fff', border: loading ? '1px solid var(--border)' : 'none' }}>
            {loading ? '…' : 'Enviar confirmación'}
          </button>
        </form>
      )}

      {/* Password */}
      <div className="flex items-center justify-between py-2 mt-1">
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Contraseña</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-2)' }}>••••••••</p>
        </div>
        <button onClick={() => show(section === 'password' ? null : 'password')}
          className="text-xs px-2.5 py-1 rounded-lg transition-all"
          style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
          Cambiar
        </button>
      </div>

      {section === 'password' && (
        <form onSubmit={handlePassword} className="flex flex-col gap-2 pt-1">
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
            placeholder="Nueva contraseña (mín. 6)" required autoFocus
            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
            style={inputStyle} />
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
            placeholder="Repetir contraseña" required
            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
            style={inputStyle} />
          <button type="submit" disabled={loading}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: loading ? 'var(--bg-card)' : '#6c33e6', color: loading ? 'var(--text-3)' : '#fff', border: loading ? '1px solid var(--border)' : 'none' }}>
            {loading ? '…' : 'Guardar nueva contraseña'}
          </button>
        </form>
      )}
    </div>
  )
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const priorityColors = {
  high:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  text: '#dc2626', dot: '#ef4444' },
  medium: { bg: 'rgba(249,184,0,0.1)',  border: 'rgba(249,184,0,0.2)',  text: '#d97706', dot: '#f9b800' },
  low:    { bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.2)', text: '#0d9488', dot: '#2dd4bf' },
}

export default function StudentProfile() {
  const navigate = useNavigate()
  const { profile, setProfile, user } = useAuth()
  const [deberes, setDeberes] = useState([])
  const [teacherCode, setTeacherCode] = useState('')
  const [teacherName, setTeacherName] = useState(null)
  const [linkStatus, setLinkStatus] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true

    supabase.from('profiles').select('*').eq('id', profile.id).single()
      .then(({ data }) => { if (data && mounted) setProfile(data) })

    supabase
      .from('homework')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (mounted) setDeberes(data || []) })

    if (profile.teacher_id) {
      supabase.from('profiles').select('name').eq('id', profile.teacher_id).single()
        .then(({ data }) => { if (mounted) setTeacherName(data?.name || null) })
    }

    return () => { mounted = false }
  }, [profile?.id])

  const linkTeacher = async () => {
    const code = teacherCode.trim().toUpperCase()
    if (!code) return
    setLinkStatus('loading')
    const { data: teacher, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('teacher_code', code)
      .eq('role', 'teacher')
      .single()
    if (error || !teacher) { setLinkStatus('error'); return }
    await supabase.from('profiles').update({ teacher_id: teacher.id }).eq('id', profile.id)
    setProfile(prev => ({ ...prev, teacher_id: teacher.id }))
    setTeacherName(teacher.name)
    setLinkStatus('ok')
    setTeacherCode('')
  }

  const days = daysUntil(profile?.bar_mitzvah)
  const done = deberes.filter(d => d.status === 'submitted').length
  const progress = deberes.length ? Math.round((done / deberes.length) * 100) : 0

  const handleDeberClick = (deber) => {
    if (deber.parasha_id) {
      const aliyah = deber.aliyah_idx ?? 0
      navigate(`/student/study/${deber.parasha_id}?aliyah=${aliyah}`)
    }
  }

  if (!profile) return null

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          פְּרוֹפִיל · Mi Perfil
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Shalom, {profile.name?.split(' ')[0] || 'Alumno'} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Perashá <span className="hebrew" style={{ color: 'var(--text-gold)' }}>{profile.parasha_id || '—'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 fade-up-2">
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(108,51,230,0.2) 0%, rgba(108,51,230,0.06) 100%)', border: '1px solid rgba(108,51,230,0.25)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #6c33e6, transparent)', filter: 'blur(20px)', transform: 'translate(30%, -30%)' }} />
          <p className="text-xs mb-2" style={{ color: 'rgba(108,51,230,0.7)' }}>Bar Mitzvá</p>
          {days !== null ? (
            <>
              <div className="text-5xl font-light mb-1" style={{ color: '#6c33e6' }}>{days}</div>
              <p className="text-xs" style={{ color: 'rgba(108,51,230,0.5)' }}>días restantes</p>
            </>
          ) : (
            <div className="text-2xl font-light" style={{ color: '#6c33e6' }}>—</div>
          )}
          {profile.bar_mitzvah && (
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-3)' }}>
              {new Date(profile.bar_mitzvah).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(249,184,0,0.12) 0%, rgba(249,184,0,0.04) 100%)', border: '1px solid rgba(249,184,0,0.2)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-gold)' }}>Tu Perashá</p>
          <div className="text-3xl font-light mb-1" style={{ color: '#d97706' }}>
            {profile.parasha_id || '—'}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Perashá asignada</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>Deberes completados</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-light" style={{ color: '#0d9488' }}>{progress}%</span>
            <span className="text-xs pb-1.5" style={{ color: 'var(--text-muted)' }}>{done}/{deberes.length}</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6c33e6, #2dd4bf)' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 fade-up-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Mis deberes</h2>
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(108,51,230,0.12)', color: '#6c33e6', border: '1px solid rgba(108,51,230,0.2)' }}>
              {deberes.filter(d => d.status !== 'submitted').length} pendientes
            </span>
          </div>
          {deberes.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay deberes asignados aún</p>
          )}
          <div className="flex flex-col gap-2.5">
            {deberes.map(deber => {
              const isDone = deber.status === 'submitted'
              const p = priorityColors.medium
              return (
                <div key={deber.id}
                  onClick={() => handleDeberClick(deber)}
                  className={`flex items-start gap-3.5 p-4 rounded-xl transition-all duration-200 ${deber.parasha_id ? 'cursor-pointer' : ''}`}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isDone ? 'var(--border-subtle)' : 'var(--border)'}`,
                    opacity: isDone ? 0.55 : 1,
                  }}>
                  <div className="mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: isDone ? '#6c33e6' : 'var(--border)', background: isDone ? '#6c33e6' : 'transparent' }}>
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {deber.task}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {(() => {
                        const parasha = deber.parasha_id ? PARASHOT.find(p => p.id === deber.parasha_id) : null
                        const aliyahN = parasha && deber.aliyah_idx != null ? parasha.aliyot[deber.aliyah_idx]?.n : null
                        if (!parasha) return null
                        return (
                          <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                            style={{ background: 'rgba(108,51,230,0.1)', color: '#6c33e6', border: '1px solid rgba(108,51,230,0.2)' }}>
                            <span className="hebrew">{parasha.heb}</span>
                            {aliyahN != null && <span>· {aliyahN === 8 ? 'Maftir' : `${aliyahN}ª`}</span>}
                            {deber.require_audio && !isDone && (
                              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ marginLeft: 2 }}>
                                <rect x="3" y="0.5" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                                <path d="M1 4.5c0 1.9 1.6 3.5 3.5 3.5S8 6.4 8 4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                              </svg>
                            )}
                          </span>
                        )
                      })()}
                      {deber.subject && (
                        <span className="text-xs px-2 py-0.5 rounded-md"
                          style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.text }}>
                          {deber.subject}
                        </span>
                      )}
                      {deber.due && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Entrega: {new Date(deber.due).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-5 fade-up-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Mis datos</p>
            <div className="flex flex-col gap-0">
              {[
                { label: 'Nombre', value: profile.name },
                { label: 'Bar Mitzvá', value: profile.bar_mitzvah ? new Date(profile.bar_mitzvah).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { label: 'Perashá', value: profile.parasha_id || '—' },
                { label: 'Progreso', value: `${profile.progress || 0}%` },
                { label: 'Racha', value: `${profile.streak || 0} días 🔥` },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>Mi profesor</p>
            {teacherName ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(249,184,0,0.2)', color: '#d97706' }}>
                  {teacherName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{teacherName}</div>
                  <div className="text-xs" style={{ color: 'var(--text-gold)' }}>מוֹרֶה · Vinculado</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Introduce el código de tu profesor para vincularte
                </p>
                <div className="flex gap-2">
                  <input
                    value={teacherCode}
                    onChange={e => { setTeacherCode(e.target.value.toUpperCase()); setLinkStatus(null) }}
                    placeholder="Ej: AB3X7K"
                    maxLength={6}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-mono tracking-widest outline-none"
                    style={{ background: 'var(--bg-card)', border: `1px solid ${linkStatus === 'error' ? '#ef4444' : 'var(--border)'}`, color: 'var(--text)' }}
                    onKeyDown={e => e.key === 'Enter' && linkTeacher()}
                  />
                  <button onClick={linkTeacher} disabled={linkStatus === 'loading' || !teacherCode}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(108,51,230,0.15)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.25)', opacity: !teacherCode ? 0.5 : 1 }}>
                    {linkStatus === 'loading' ? '…' : 'Unirse'}
                  </button>
                </div>
                {linkStatus === 'error' && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>Código no encontrado. Compruébalo con tu profesor.</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, rgba(249,184,0,0.1), rgba(249,184,0,0.03))', border: '1px solid rgba(249,184,0,0.15)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--text-gold)' }}>Racha de estudio</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              <div>
                <span className="text-2xl font-light" style={{ color: '#d97706' }}>{profile.streak || 0} días</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {(profile.streak || 0) > 5 ? '¡Sigue así!' : 'Empieza tu racha'}
                </p>
              </div>
            </div>
          </div>

          <AccountSection user={user} />
        </div>
      </div>
    </div>
  )
}
