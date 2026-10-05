import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { PARASHOT } from '../../data/parashot'
import { ALL_MOADIM } from '../../data/moadim'

function resolveAnyParasha(idOrName) {
  if (!idOrName) return null
  const lower = idOrName.toLowerCase().replace(/[\s-]/g, '')
  return PARASHOT.find(p =>
    p.id === idOrName ||
    p.name.toLowerCase() === idOrName.toLowerCase() ||
    p.id.replace(/-/g, '') === lower
  ) || ALL_MOADIM.find(m => m.id === idOrName || m.name === idOrName) || null
}

function AccountSection({ user }) {
  const { t } = useLang()
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
    <section>
      <p className="eyebrow pb-3 mb-1" style={{ borderBottom: '2px solid #1b2f6b' }}>{t('account')}</p>

      {msg && (
        <div className="mb-3 p-2.5 text-xs"
          style={{
            background: '#fff',
            color: msg.type === 'ok' ? '#1b2f6b' : '#b42318',
            borderLeft: `3px solid ${msg.type === 'ok' ? '#c8941f' : '#b42318'}`,
          }}>
          {msg.text}
        </div>
      )}

      {/* Email display */}
      <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('email')}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-2)' }}>{user?.email}</p>
        </div>
        <button onClick={() => show(section === 'email' ? null : 'email')}
          className="text-xs px-2.5 py-1 rounded-lg transition-all"
          style={{ color: '#1b2f6b', border: '1px solid var(--border)' }}>
          {t('change')}
        </button>
      </div>

      {section === 'email' && (
        <form onSubmit={handleEmail} className="flex flex-col gap-2 pt-3">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder={t('new_email')} required autoFocus
            className="w-full px-3 py-2 text-xs outline-none"
            style={inputStyle} />
          <button type="submit" disabled={loading}
            className="w-full py-2 text-xs font-semibold transition-all"
            style={{ background: loading ? 'var(--bg-card)' : '#1b2f6b', color: loading ? 'var(--text-3)' : '#fff', border: loading ? '1px solid var(--border)' : 'none' }}>
            {loading ? '…' : t('send_confirm')}
          </button>
        </form>
      )}

      {/* Password */}
      <div className="flex items-center justify-between py-2 mt-1">
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('password')}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-2)' }}>••••••••</p>
        </div>
        <button onClick={() => show(section === 'password' ? null : 'password')}
          className="text-xs px-2.5 py-1 rounded-lg transition-all"
          style={{ color: '#1b2f6b', border: '1px solid var(--border)' }}>
          {t('change')}
        </button>
      </div>

      {section === 'password' && (
        <form onSubmit={handlePassword} className="flex flex-col gap-2 pt-1">
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
            placeholder={t('new_password')} required autoFocus
            className="w-full px-3 py-2 text-xs outline-none"
            style={inputStyle} />
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
            placeholder={t('repeat_password')} required
            className="w-full px-3 py-2 text-xs outline-none"
            style={inputStyle} />
          <button type="submit" disabled={loading}
            className="w-full py-2 text-xs font-semibold transition-all"
            style={{ background: loading ? 'var(--bg-card)' : '#1b2f6b', color: loading ? 'var(--text-3)' : '#fff', border: loading ? '1px solid var(--border)' : 'none' }}>
            {loading ? '…' : t('save_password')}
          </button>
        </form>
      )}
    </section>
  )
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const ACHIEVEMENTS = [
  { id: 'first_listen', icon: '🎧', labelKey: 'ach_first_listen_label', descKey: 'ach_first_listen_desc', check: (s) => s.totalListens >= 1 },
  { id: 'listen_10',   icon: '📻', labelKey: 'ach_listen_10_label',    descKey: 'ach_listen_10_desc',    check: (s) => s.totalListens >= 10 },
  { id: 'listen_50',   icon: '🎶', labelKey: 'ach_listen_50_label',    descKey: 'ach_listen_50_desc',    check: (s) => s.totalListens >= 50 },
  { id: 'first_hw',    icon: '✅', labelKey: 'ach_first_hw_label',     descKey: 'ach_first_hw_desc',     check: (s) => s.homeworkDone >= 1 },
  { id: 'hw_5',        icon: '📚', labelKey: 'ach_hw_5_label',         descKey: 'ach_hw_5_desc',         check: (s) => s.homeworkDone >= 5 },
  { id: 'hw_20',       icon: '🏆', labelKey: 'ach_hw_20_label',        descKey: 'ach_hw_20_desc',        check: (s) => s.homeworkDone >= 20 },
  { id: 'streak_3',    icon: '🔥', labelKey: 'ach_streak_3_label',     descKey: 'ach_streak_3_desc',     check: (s) => s.streak >= 3 },
  { id: 'streak_7',    icon: '⚡', labelKey: 'ach_streak_7_label',     descKey: 'ach_streak_7_desc',     check: (s) => s.streak >= 7 },
  { id: 'streak_30',   icon: '🌟', labelKey: 'ach_streak_30_label',    descKey: 'ach_streak_30_desc',    check: (s) => s.streak >= 30 },
]

export default function StudentProfile() {
  const navigate = useNavigate()
  const { profile, setProfile, user } = useAuth()
  const { t } = useLang()
  const [deberes, setDeberes] = useState([])
  const [teacherCode, setTeacherCode] = useState('')
  const [teacherName, setTeacherName] = useState(null)
  const [linkStatus, setLinkStatus] = useState(null)
  const [totalListens, setTotalListens] = useState(0)

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

    supabase
      .from('audio_listens')
      .select('count')
      .eq('student_id', profile.id)
      .then(({ data }) => {
        if (mounted && data) {
          const total = data.reduce((sum, row) => sum + (row.count || 0), 0)
          setTotalListens(total)
        }
      })

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
    if (!deber.parasha_id) return
    const ref = deber.parasha_id
    if (/[\s,]/.test(ref)) {
      // tefila homework — ref is a Sefaria siddur ref
      const d = /Shabbat Siddur/i.test(ref) ? 'shabat' : 'semana'
      navigate(`/student/tefila?d=${d}&r=${encodeURIComponent(ref)}`)
    } else {
      navigate(`/student/study/${ref}?aliyah=${deber.aliyah_idx ?? 0}`)
    }
  }

  if (!profile) return null

  const NAVY = '#1b2f6b'
  const GOLD = '#c8941f'
  const allIds = [profile.parasha_id, ...(profile.extra_parasha_ids || [])].filter(Boolean)
  const resolved = allIds.map(id => resolveAnyParasha(id)).filter(Boolean)
  const pending = deberes.filter(d => d.status !== 'submitted').length
  const dateFmt = { day: 'numeric', month: 'long', year: 'numeric' }

  return (
    <div className="p-4 sm:p-10 max-w-5xl">
      <header className="mb-10 fade-up-1">
        <p className="eyebrow mb-3">פְּרוֹפִיל · {t('profile_title')}</p>
        <h1 className="serif text-4xl sm:text-5xl" style={{ color: NAVY }}>
          Shalom, {profile.name?.split(' ')[0] || 'Alumno'}
        </h1>
        <p className="text-sm mt-2" style={{ color: GOLD }}>
          {allIds.length
            ? allIds.map((id, i) => (
                <span key={id}>{i > 0 && <span style={{ color: '#9ca3af' }}> · </span>}{resolveAnyParasha(id)?.name || id}</span>
              ))
            : '—'}
        </p>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 mb-10 fade-up-2" style={{ borderTop: `2px solid ${NAVY}`, borderBottom: '1px solid var(--border)' }}>
        <div className="py-6 sm:pr-6">
          <p className="eyebrow mb-3">{t('bar_mitzvah')}</p>
          {days !== null ? (
            <>
              <div className="serif text-6xl leading-none" style={{ color: NAVY }}>{days}</div>
              <p className="text-xs mt-2" style={{ color: '#6b7280' }}>{t('days_left')}</p>
            </>
          ) : (
            <div className="serif text-4xl" style={{ color: NAVY }}>—</div>
          )}
          {profile.bar_mitzvah && (
            <p className="text-sm mt-4" style={{ color: NAVY }}>
              {new Date(profile.bar_mitzvah).toLocaleDateString(t('date_locale'), dateFmt)}
            </p>
          )}
        </div>

        <div className="py-6 sm:px-6" style={{ borderInlineStart: '1px solid var(--border)' }}>
          <p className="eyebrow mb-3">{t('my_parasha')}</p>
          {resolved.length ? resolved.map((p, i) => (
            <div key={p.id} className={i ? 'mt-3' : ''}>
              <div className="serif leading-tight" style={{ color: NAVY, fontSize: resolved.length > 1 ? '1.5rem' : '2.5rem' }}>{p.name}</div>
              {p.heb && <div className="hebrew text-base mt-1" style={{ color: GOLD, textAlign: 'left', direction: 'ltr' }}>{p.heb}</div>}
            </div>
          )) : <div className="serif text-4xl" style={{ color: NAVY }}>—</div>}
          <p className="text-xs mt-4" style={{ color: '#6b7280' }}>{t('assigned_parasha')}</p>
        </div>

        <div className="py-6 sm:pl-6" style={{ borderInlineStart: '1px solid var(--border)' }}>
          <p className="eyebrow mb-3">{t('hw_done')}</p>
          <div className="flex items-baseline gap-2">
            <span className="serif text-6xl leading-none" style={{ color: NAVY }}>{progress}%</span>
            <span className="text-xs" style={{ color: '#6b7280' }}>{done}/{deberes.length}</span>
          </div>
          <div className="w-full h-1 mt-5" style={{ background: '#eef0f3' }}>
            <div className="h-full transition-all duration-700" style={{ width: `${progress}%`, background: NAVY }} />
          </div>
        </div>
      </div>

      {/* Go to parasha */}
      {resolved.length > 0 && (
        <div className={`mb-10 fade-up-3 ${resolved.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}`}>
          {resolved.map((p, i) => (
            <button key={p.id} onClick={() => navigate(`/student/study/${p.id}`)}
              className="btn-navy w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
              <span>
                <span className="block text-xs uppercase tracking-widest" style={{ color: '#e3b448' }}>
                  {i === 0 ? t('go_my_parasha') : 'Ir a mi perashá'}
                </span>
                <span className="serif block text-2xl mt-1">{p.name}</span>
              </span>
              <span className="text-xl" style={{ color: '#e3b448' }}>→</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Homework ledger */}
        <section className="lg:col-span-3 fade-up-3">
          <div className="flex items-baseline justify-between pb-3" style={{ borderBottom: `2px solid ${NAVY}` }}>
            <h2 className="serif text-2xl">{t('my_homework')}</h2>
            <span className="text-xs" style={{ color: GOLD }}>{pending} {t('pending')}</span>
          </div>
          {deberes.length === 0 && (
            <p className="text-sm py-6" style={{ color: '#6b7280' }}>{t('no_hw')}</p>
          )}
          <ol>
            {deberes.map((deber, n) => {
              const isDone = deber.status === 'submitted'
              const parasha = deber.parasha_id ? PARASHOT.find(p => p.id === deber.parasha_id) : null
              const aliyahN = parasha && deber.aliyah_idx != null ? parasha.aliyot[deber.aliyah_idx]?.n : null
              return (
                <li key={deber.id}
                  onClick={() => handleDeberClick(deber)}
                  className={`grid grid-cols-[32px_1fr_auto] gap-3 py-4 items-start ${deber.parasha_id ? 'cursor-pointer hover:bg-[#f6f7f9]' : ''}`}
                  style={{ borderBottom: '1px solid var(--border-subtle)', opacity: isDone ? 0.5 : 1 }}>
                  <span className="serif text-sm pt-0.5" style={{ color: GOLD }}>{String(n + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#111827', textDecoration: isDone ? 'line-through' : 'none' }}>{deber.task}</p>
                    <p className="text-xs mt-1.5" style={{ color: '#6b7280' }}>
                      {parasha && (
                        <span>
                          <span className="hebrew" style={{ color: NAVY }}>{parasha.heb}</span>
                          {aliyahN != null && <span> · {aliyahN === 8 ? 'Maftir' : `${aliyahN}ª`}</span>}
                          {deber.require_audio && !isDone && <span> · 🎙</span>}
                        </span>
                      )}
                      {deber.subject && <span>{parasha ? ' · ' : ''}{deber.subject}</span>}
                      {deber.due && <span>{(parasha || deber.subject) ? ' · ' : ''}{t('hw_due_short')}: {new Date(deber.due).toLocaleDateString(t('date_locale'), { day: 'numeric', month: 'short' })}</span>}
                    </p>
                  </div>
                  <span className="text-xs pt-0.5" style={{ color: isDone ? NAVY : '#9ca3af' }}>{isDone ? '✓' : '○'}</span>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Side column */}
        <aside className="lg:col-span-2 flex flex-col gap-10 fade-up-4">
          <section>
            <p className="eyebrow pb-3" style={{ borderBottom: `2px solid ${NAVY}` }}>{t('my_data')}</p>
            {[
              { label: t('name'), value: profile.name },
              { label: t('bar_mitzvah'), value: profile.bar_mitzvah ? new Date(profile.bar_mitzvah).toLocaleDateString(t('date_locale'), dateFmt) : '—' },
              { label: 'Perashá', value: resolved.map(p => p.name).join(' + ') || '—' },
              { label: t('progress'), value: `${profile.progress || 0}%` },
              { label: t('streak'), value: `${profile.streak || 0} ${t('days')}` },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-baseline py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="text-xs" style={{ color: '#6b7280' }}>{item.label}</span>
                <span className="text-sm text-right" style={{ color: NAVY }}>{item.value}</span>
              </div>
            ))}
          </section>

          <section>
            <p className="eyebrow pb-3" style={{ borderBottom: `2px solid ${NAVY}` }}>{t('my_teacher')}</p>
            {teacherName ? (
              <div className="py-4">
                <div className="serif text-xl" style={{ color: NAVY }}>{teacherName}</div>
                <div className="text-xs mt-0.5" style={{ color: GOLD }}>מוֹרֶה · {t('linked')}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4">
                <p className="text-xs" style={{ color: '#6b7280' }}>{t('link_teacher')}</p>
                <div className="flex gap-2">
                  <input
                    value={teacherCode}
                    onChange={e => { setTeacherCode(e.target.value.toUpperCase()); setLinkStatus(null) }}
                    placeholder="Ej: AB3X7K"
                    maxLength={6}
                    className="flex-1 px-3 py-2 text-sm font-mono tracking-widest outline-none"
                    style={{ background: '#fff', border: `1px solid ${linkStatus === 'error' ? '#b42318' : 'var(--border)'}`, color: '#111827' }}
                    onKeyDown={e => e.key === 'Enter' && linkTeacher()}
                  />
                  <button onClick={linkTeacher} disabled={linkStatus === 'loading' || !teacherCode}
                    className="btn-navy px-4 py-2 text-xs"
                    style={{ opacity: !teacherCode ? 0.4 : 1 }}>
                    {linkStatus === 'loading' ? '…' : t('join')}
                  </button>
                </div>
                {linkStatus === 'error' && <p className="text-xs" style={{ color: '#b42318' }}>{t('code_not_found')}</p>}
              </div>
            )}
          </section>

          <section>
            <p className="eyebrow pb-3" style={{ borderBottom: `2px solid ${NAVY}` }}>{t('study_streak')}</p>
            <div className="flex items-baseline gap-3 py-4">
              <span className="serif text-5xl leading-none" style={{ color: NAVY }}>{profile.streak || 0}</span>
              <span className="text-sm" style={{ color: GOLD }}>{t('days')}</span>
            </div>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              {(profile.streak || 0) > 5 ? t('keep_going') : t('start_streak')}
            </p>
          </section>

          <AccountSection user={user} />

          <section>
            <p className="eyebrow pb-3" style={{ borderBottom: `2px solid ${NAVY}` }}>{t('achievements')}</p>
            <div className="grid grid-cols-3 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <StatPill value={totalListens} label="escuchas" />
              <StatPill value={done} label="deberes" />
              <StatPill value={profile.streak || 0} label="días racha" />
            </div>
            <ul className="mt-2">
              {ACHIEVEMENTS.map(a => {
                const unlocked = a.check({ totalListens, homeworkDone: done, streak: profile.streak || 0 })
                return (
                  <li key={a.id} title={t(a.descKey)} className="flex items-center gap-3 py-2"
                    style={{ borderBottom: '1px solid var(--border-subtle)', opacity: unlocked ? 1 : 0.4 }}>
                    <span className="w-2 h-2 rotate-45 flex-shrink-0" style={{ background: unlocked ? GOLD : 'transparent', border: `1px solid ${unlocked ? GOLD : '#9ca3af'}` }} />
                    <span className="text-xs" style={{ color: unlocked ? NAVY : '#6b7280' }}>{t(a.labelKey)}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

function StatPill({ value, label }) {
  return (
    <div className="flex flex-col items-start">
      <span className="serif text-3xl" style={{ color: '#1b2f6b' }}>{value}</span>
      <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
    </div>
  )
}
