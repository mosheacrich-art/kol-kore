import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Award, BookOpen, CalendarHeart, Check, CheckCircle2, ChevronRight, ClipboardList, Flame,
  Headphones, Library, Link2, Mic, Radio, Sparkles, Star, Trophy, Zap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { PARASHOT } from '../../data/parashot'
import { Avatar, CardHeader, EmptyState, IconTile, PageHeader, Progress } from '../../components/ui'
import { resolveParasha, bookColor, capitalize } from '../../utils/parasha'

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
    if (!newEmail.includes('@')) { setMsg({ type: 'err', text: t('ui_invalid_email') }); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setLoading(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setMsg({ type: 'ok', text: t('ui_email_confirm_sent') })
    setSection(null)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (newPass.length < 6) { setMsg({ type: 'err', text: t('pwd_too_short') }); return }
    if (newPass !== confirmPass) { setMsg({ type: 'err', text: t('pwd_mismatch') }); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setLoading(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setMsg({ type: 'ok', text: t('pwd_changed_ok') })
    setSection(null)
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="section-title mb-3">{t('account')}</h2>
      {msg && (
        <p className="mb-3 px-3.5 py-2.5 rounded-xl text-[13px]"
          style={msg.type === 'ok'
            ? { background: 'rgba(var(--success-rgb),0.08)', color: 'rgb(var(--success-rgb))' }
            : { background: 'rgba(var(--danger-rgb),0.07)', color: 'rgb(var(--danger-rgb))' }}>
          {msg.text}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="min-w-0">
          <p className="text-[12px] text-ink-3">{t('email')}</p>
          <p className="text-[14px] font-medium text-ink truncate">{user?.email}</p>
        </div>
        <button onClick={() => show(section === 'email' ? null : 'email')} className="btn btn-ghost btn-sm text-accent">{t('change')}</button>
      </div>
      {section === 'email' && (
        <form onSubmit={handleEmail} className="flex flex-col gap-2 pt-3">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={t('new_email')} required autoFocus className="input" />
          <button type="submit" disabled={loading} className="btn btn-primary">{loading ? '…' : t('send_confirm')}</button>
        </form>
      )}

      <div className="flex items-center justify-between gap-3 py-3">
        <div>
          <p className="text-[12px] text-ink-3">{t('password')}</p>
          <p className="text-[14px] font-medium text-ink">••••••••</p>
        </div>
        <button onClick={() => show(section === 'password' ? null : 'password')} className="btn btn-ghost btn-sm text-accent">{t('change')}</button>
      </div>
      {section === 'password' && (
        <form onSubmit={handlePassword} className="flex flex-col gap-2">
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder={t('new_password')} required autoFocus className="input" />
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder={t('repeat_password')} required className="input" />
          <button type="submit" disabled={loading} className="btn btn-primary">{loading ? '…' : t('save_password')}</button>
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
  { id: 'first_listen', icon: Headphones,   labelKey: 'ach_first_listen_label', descKey: 'ach_first_listen_desc', check: (s) => s.totalListens >= 1 },
  { id: 'listen_10',    icon: Radio,        labelKey: 'ach_listen_10_label',    descKey: 'ach_listen_10_desc',    check: (s) => s.totalListens >= 10 },
  { id: 'listen_50',    icon: Sparkles,     labelKey: 'ach_listen_50_label',    descKey: 'ach_listen_50_desc',    check: (s) => s.totalListens >= 50 },
  { id: 'first_hw',     icon: CheckCircle2, labelKey: 'ach_first_hw_label',     descKey: 'ach_first_hw_desc',     check: (s) => s.homeworkDone >= 1 },
  { id: 'hw_5',         icon: Library,      labelKey: 'ach_hw_5_label',         descKey: 'ach_hw_5_desc',         check: (s) => s.homeworkDone >= 5 },
  { id: 'hw_20',        icon: Trophy,       labelKey: 'ach_hw_20_label',        descKey: 'ach_hw_20_desc',        check: (s) => s.homeworkDone >= 20 },
  { id: 'streak_3',     icon: Flame,        labelKey: 'ach_streak_3_label',     descKey: 'ach_streak_3_desc',     check: (s) => s.streak >= 3 },
  { id: 'streak_7',     icon: Zap,          labelKey: 'ach_streak_7_label',     descKey: 'ach_streak_7_desc',     check: (s) => s.streak >= 7 },
  { id: 'streak_30',    icon: Star,         labelKey: 'ach_streak_30_label',    descKey: 'ach_streak_30_desc',    check: (s) => s.streak >= 30 },
]

export default function StudentProfile() {
  const navigate = useNavigate()
  const { profile, setProfile, user } = useAuth()
  const { t } = useLang()
  const locale = t('date_locale')
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
        if (mounted && data) setTotalListens(data.reduce((sum, row) => sum + (row.count || 0), 0))
      })

    if (profile.teacher_id) {
      supabase.from('profiles').select('name').eq('id', profile.teacher_id).single()
        .then(({ data }) => { if (mounted) setTeacherName(data?.name || null) })
    }

    return () => { mounted = false }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const pending = deberes.length - done
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

  const assigned = [profile.parasha_id, ...(profile.extra_parasha_ids || [])].filter(Boolean)
  const resolved = assigned.map(id => ({ id, p: resolveParasha(id) }))
  const today = capitalize(new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }))

  return (
    <div className="page">
      <PageHeader hebrew="בְּרוּכִים הַבָּאִים" eyebrow={t('ui_home')}
        title={`Shalom, ${profile.name?.split(' ')[0] || ''}`}
        subtitle={t('ui_student_home_subtitle')}
        aside={<p className="hidden sm:block text-sm text-ink-3 pb-1">{today}</p>} />

      {/* My parasha — editorial hero */}
      {resolved.length > 0 ? (
        <div className={`grid gap-4 mb-6 fade-up-1 ${resolved.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {resolved.map(({ id, p }, i) => {
            const color = bookColor(p)
            return (
              <button key={id} onClick={() => p && navigate(`/student/study/${p.id}`)}
                className="card card-interactive group overflow-hidden text-start grid grid-cols-[1fr_auto]">
                <div className="p-6 sm:p-7">
                  <p className="eyebrow mb-2">{i === 0 ? t('my_parasha') : t('special_reading')}</p>
                  <p className="font-serif text-[30px] font-semibold text-ink leading-tight">{p?.name || id}</p>
                  <p className="text-[14px] text-ink-3 mt-1">{t('assigned_parasha')}</p>
                  <span className="inline-flex items-center gap-1.5 mt-5 text-[14px] font-medium text-ink group-hover:gap-2.5 transition-all">
                    {t('go_my_parasha')}<ArrowRight size={16} className="rtl:rotate-180" />
                  </span>
                </div>
                <div className="relative w-36 sm:w-56 flex items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--parchment), var(--parchment-2))' }} aria-hidden="true">
                  <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 23px, var(--parchment-line) 23px 24px)' }} />
                  <span className="relative hebrew text-[34px] sm:text-[44px] px-3 text-center leading-tight" style={{ color, fontWeight: 400 }}>{p?.heb || ''}</span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="card mb-6 fade-up-1">
          <EmptyState icon={BookOpen} title={t('ui_no_parasha_yet')} description={t('ui_no_parasha_yet_desc')}
            action={<button onClick={() => navigate('/student/study')} className="btn btn-secondary">{t('all_parashot_btn')}</button>} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 fade-up-2">
        <div className="card p-5 flex items-center gap-4">
          <IconTile icon={CalendarHeart} tone="gold" size={46} />
          <div className="min-w-0">
            <p className="text-[28px] font-semibold text-ink leading-none tabular-nums">{days !== null && days >= 0 ? days : '—'}</p>
            <p className="text-[13px] text-ink-2 mt-1.5">{t('bar_mitzvah')} · {t('days_left')}</p>
            {profile.bar_mitzvah && (
              <p className="text-[12px] text-ink-3 truncate">{new Date(profile.bar_mitzvah).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            )}
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <IconTile icon={ClipboardList} tone="accent" size={46} />
          <div className="min-w-0 flex-1">
            <p className="text-[28px] font-semibold text-ink leading-none tabular-nums">{progress}%</p>
            <p className="text-[13px] text-ink-2 mt-1.5">{t('hw_done')} · {done}/{deberes.length}</p>
            <Progress value={progress} className="mt-2" label={t('hw_done')} />
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <IconTile icon={Headphones} tone="neutral" size={46} />
          <div className="min-w-0">
            <p className="text-[28px] font-semibold text-ink leading-none tabular-nums">{totalListens}</p>
            <p className="text-[13px] text-ink-2 mt-1.5">{t('listens')}</p>
            <p className="text-[12px] text-ink-3 inline-flex items-center gap-1"><Flame size={12} />{profile.streak || 0} {t('days')} · {t('streak').toLowerCase()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Homework */}
        <section className="card xl:col-span-7 fade-up-3 self-start">
          <div className="p-5 sm:p-6 pb-3">
            <CardHeader title={t('my_homework')}
              action={<span className={`badge ${pending ? 'badge-warning' : 'badge-success'} badge-dot`}>{pending} {t('pending')}</span>} />
          </div>
          {deberes.length === 0 ? (
            <EmptyState icon={ClipboardList} title={t('no_hw')} className="pt-4" />
          ) : (
            <ul>
              {deberes.map(deber => {
                const isDone = deber.status === 'submitted'
                const parasha = deber.parasha_id ? PARASHOT.find(p => p.id === deber.parasha_id) : null
                const aliyahN = parasha && deber.aliyah_idx != null ? parasha.aliyot[deber.aliyah_idx]?.n : null
                return (
                  <li key={deber.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => handleDeberClick(deber)} disabled={!deber.parasha_id}
                      className={`w-full flex items-start gap-3.5 px-5 sm:px-6 py-4 text-start transition-colors ${deber.parasha_id ? 'hover:bg-surface-2' : 'cursor-default'}`}>
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={isDone
                          ? { background: 'rgb(var(--success-rgb))', color: '#fff' }
                          : { border: '1.5px solid var(--border-strong)' }}>
                        {isDone && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-[14px] font-medium ${isDone ? 'text-ink-3 line-through' : 'text-ink'}`}>{deber.task}</span>
                        <span className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[12px]">
                          {parasha && (
                            <span className="badge">
                              <span className="hebrew-ui text-[13px]">{parasha.heb}</span>
                              {aliyahN != null && <span>· {aliyahN === 8 ? 'Maftir' : `${aliyahN}ª`}</span>}
                              {deber.require_audio && !isDone && <Mic size={11} />}
                            </span>
                          )}
                          {deber.subject && <span className="badge max-w-[240px] truncate">{deber.subject}</span>}
                          {deber.due && (
                            <span className="text-ink-3">{t('hw_due_short')}: {new Date(deber.due).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                          )}
                        </span>
                      </span>
                      {deber.parasha_id && <ChevronRight size={16} className="text-ink-4 mt-1 rtl:rotate-180" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <aside className="xl:col-span-5 flex flex-col gap-6 fade-up-4">
          {/* Teacher */}
          <section className="card p-5 sm:p-6">
            <h2 className="section-title mb-4">{t('my_teacher')}</h2>
            {teacherName ? (
              <div className="flex items-center gap-3.5">
                <Avatar name={teacherName} size={44} />
                <div>
                  <p className="text-[15px] font-medium text-ink">{teacherName}</p>
                  <p className="text-[13px] text-ink-3 inline-flex items-center gap-1"><Link2 size={13} />{t('linked')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="text-[13px] text-ink-3">{t('link_teacher')}</p>
                <div className="flex gap-2">
                  <input value={teacherCode} maxLength={6} placeholder="AB3X7K" aria-label={t('teacher_code')}
                    onChange={e => { setTeacherCode(e.target.value.toUpperCase()); setLinkStatus(null) }}
                    onKeyDown={e => e.key === 'Enter' && linkTeacher()}
                    className="input flex-1 font-mono tracking-[0.25em] uppercase" dir="ltr"
                    style={linkStatus === 'error' ? { borderColor: 'rgb(var(--danger-rgb))' } : undefined} />
                  <button onClick={linkTeacher} disabled={linkStatus === 'loading' || !teacherCode} className="btn btn-primary">
                    {linkStatus === 'loading' ? '…' : t('join')}
                  </button>
                </div>
                {linkStatus === 'error' && <p className="text-[13px] text-danger">{t('code_not_found')}</p>}
              </div>
            )}
          </section>

          {/* Achievements — quiet, informative */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{t('achievements')}</h2>
              <Award size={18} className="text-ink-4" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.map(a => {
                const unlocked = a.check({ totalListens, homeworkDone: done, streak: profile.streak || 0 })
                const Icon = a.icon
                return (
                  <div key={a.id} title={t(a.descKey)}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center"
                    style={unlocked
                      ? { background: 'rgba(var(--gold-rgb),0.1)', color: 'var(--text-gold)' }
                      : { background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    <Icon size={18} strokeWidth={1.7} />
                    <span className="text-[11px] leading-tight" style={{ color: unlocked ? 'var(--text-2)' : 'var(--text-muted)' }}>{t(a.labelKey)}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <AccountSection user={user} />
        </aside>
      </div>
    </div>
  )
}
