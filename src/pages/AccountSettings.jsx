import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, Monitor, Moon, Sun, Trash2, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import LangToggle from '../components/LangToggle'
import { Avatar, PageHeader } from '../components/ui'

function Group({ icon: Icon, title, description, children, tone }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        {Icon && (
          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={tone === 'danger'
              ? { background: 'rgba(var(--danger-rgb),0.08)', color: 'rgb(var(--danger-rgb))' }
              : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>
            <Icon size={17} strokeWidth={1.8} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className={`text-[16px] font-semibold ${tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{title}</h2>
          {description && <p className="text-[13px] text-ink-3 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Message({ msg }) {
  if (!msg) return null
  return (
    <p role="status" className="text-[13px] px-3.5 py-2.5 rounded-xl"
      style={msg.ok
        ? { color: 'rgb(var(--success-rgb))', background: 'rgba(var(--success-rgb),0.08)' }
        : { color: 'rgb(var(--danger-rgb))', background: 'rgba(var(--danger-rgb),0.07)' }}>
      {msg.text}
    </p>
  )
}

export default function AccountSettings() {
  const { user, profile, setProfile, signOut } = useAuth()
  const { t } = useLang()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const isTeacher = profile?.role === 'teacher'

  // ── Change display name ──────────────────────────────────────────────────
  const [displayName, setDisplayName]     = useState(profile?.name || '')
  const [nameLoading, setNameLoading]     = useState(false)
  const [nameMsg, setNameMsg]             = useState(null) // { ok: bool, text: string }

  const handleSaveName = async (e) => {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) { setNameMsg({ ok: false, text: t('ui_name_empty') }); return }
    if (trimmed === profile?.name) { setNameMsg({ ok: false, text: t('ui_name_same') }); return }
    setNameLoading(true)
    setNameMsg(null)
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', profile.id)
    setNameLoading(false)
    if (error) {
      setNameMsg({ ok: false, text: error.message })
    } else {
      setProfile(p => ({ ...p, name: trimmed }))
      setNameMsg({ ok: true, text: t('ui_name_updated') })
    }
  }

  // ── Reset password ───────────────────────────────────────────────────────
  const [newPwd, setNewPwd]         = useState('')
  const [repeatPwd, setRepeatPwd]   = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg]         = useState(null) // { ok: bool, text: string }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPwd.length < 6) { setPwdMsg({ ok: false, text: t('pwd_too_short') }); return }
    if (newPwd !== repeatPwd) { setPwdMsg({ ok: false, text: t('pwd_mismatch') }); return }
    setPwdLoading(true)
    setPwdMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdLoading(false)
    if (error) {
      setPwdMsg({ ok: false, text: error.message })
    } else {
      setPwdMsg({ ok: true, text: t('pwd_changed_ok') })
      setNewPwd('')
      setRepeatPwd('')
    }
  }

  // ── Delete account ───────────────────────────────────────────────────────
  const [deletePhase, setDeletePhase]     = useState('idle') // idle | confirm | deleting
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError]     = useState(null)

  const CONFIRM_WORD = t('delete_account_word') || 'ELIMINAR'

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== CONFIRM_WORD) {
      setDeleteError(t('delete_account_word_mismatch'))
      return
    }
    setDeletePhase('deleting')
    setDeleteError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const debugInfo = body.debug ? ` | debug: ${JSON.stringify(body.debug)}` : ''
        throw new Error((body.error || 'Error al eliminar la cuenta') + debugInfo)
      }
      await signOut()
      navigate('/login')
    } catch (err) {
      setDeleteError(err.message)
      setDeletePhase('confirm')
    }
  }

  return (
    <div className="page page-narrow">
      <PageHeader hebrew="חֶשְׁבּוֹן" eyebrow={t('nav_account')} title={t('nav_account')} subtitle={t('ui_account_subtitle')} />

      {/* Identity */}
      <section className="card p-5 sm:p-6 mb-5 flex items-center gap-5 fade-up-1">
        <Avatar name={profile?.name || ''} size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[24px] font-semibold text-ink truncate">{profile?.name}</p>
          <p className="text-[14px] text-ink-3 truncate">
            {isTeacher ? t('role_teacher_label') : t('role_student_label')}{user?.email ? ` · ${user.email}` : ''}
          </p>
        </div>
        {isTeacher && profile?.teacher_code && (
          <div className="hidden sm:block text-end">
            <p className="eyebrow mb-1">{t('teacher_code')}</p>
            <p className="font-mono text-[18px] font-semibold tracking-[0.2em] text-ink" dir="ltr">{profile.teacher_code}</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-up-2">
        <Group icon={UserRound} title={t('ui_profile')} description={t('ui_display_name_desc')}>
          <form onSubmit={handleSaveName} className="flex flex-col gap-3">
            <label className="label" htmlFor="acc-name">{t('ui_display_name')}</label>
            <input id="acc-name" type="text" value={displayName} className="input -mt-2"
              onChange={e => { setDisplayName(e.target.value); setNameMsg(null) }} />
            <Message msg={nameMsg} />
            <button type="submit" disabled={nameLoading || !displayName.trim()} className="btn btn-primary self-start">
              {nameLoading ? t('saving') : t('ui_save')}
            </button>
          </form>
        </Group>

        <Group icon={Monitor} title={t('ui_preferences')} description={t('ui_preferences_desc')}>
          <p className="label">{t('language')}</p>
          <LangToggle variant="list" />
          <p className="label mt-5">{t('ui_appearance')}</p>
          <div className="segmented w-full">
            <button aria-pressed={!isDark} onClick={() => isDark && toggle()} className="flex-1 inline-flex items-center justify-center gap-1.5">
              <Sun size={14} />{t('light_mode')}
            </button>
            <button aria-pressed={isDark} onClick={() => !isDark && toggle()} className="flex-1 inline-flex items-center justify-center gap-1.5">
              <Moon size={14} />{t('dark_mode')}
            </button>
          </div>
        </Group>

        <Group icon={KeyRound} title={t('change_password')} description={t('ui_security_desc')}>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <input type="password" autoComplete="new-password" placeholder={t('new_password')} aria-label={t('new_password')}
              value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input" />
            <input type="password" autoComplete="new-password" placeholder={t('repeat_password')} aria-label={t('repeat_password')}
              value={repeatPwd} onChange={e => setRepeatPwd(e.target.value)} className="input" />
            <Message msg={pwdMsg} />
            <button type="submit" disabled={pwdLoading || !newPwd} className="btn btn-primary self-start">
              {pwdLoading ? t('saving') : t('save_password')}
            </button>
          </form>
        </Group>

        <Group icon={LogOut} title={t('ui_session')} description={t('ui_session_desc')}>
          <button onClick={async () => { await signOut(); navigate('/login') }} className="btn btn-secondary">
            <LogOut size={16} className="rtl:rotate-180" />{t('logout')}
          </button>
        </Group>
      </div>

      <div className="mt-5 fade-up-3">
        <Group icon={Trash2} tone="danger" title={t('delete_account')} description={t('delete_account_desc')}>
          {deletePhase === 'idle' && (
            <button onClick={() => setDeletePhase('confirm')} className="btn btn-danger">{t('delete_account')}</button>
          )}
          {(deletePhase === 'confirm' || deletePhase === 'deleting') && (
            <div className="flex flex-col gap-3 max-w-md">
              <p className="text-[13px] font-medium text-ink-2">{t('delete_account_confirm').replace('{word}', CONFIRM_WORD)}</p>
              <input type="text" placeholder={CONFIRM_WORD} value={deleteConfirm} className="input"
                style={{ borderColor: 'rgba(var(--danger-rgb),0.35)' }}
                onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(null) }} />
              {deleteError && <p className="text-[13px] text-danger">{deleteError}</p>}
              <div className="flex gap-2.5">
                <button onClick={() => { setDeletePhase('idle'); setDeleteConfirm(''); setDeleteError(null) }}
                  disabled={deletePhase === 'deleting'} className="btn btn-secondary">
                  {t('cancel') || 'Cancelar'}
                </button>
                <button onClick={handleDeleteAccount} disabled={deletePhase === 'deleting'} className="btn"
                  style={{ background: 'rgb(var(--danger-rgb))', color: '#fff' }}>
                  {deletePhase === 'deleting' ? '…' : t('delete_account_btn')}
                </button>
              </div>
            </div>
          )}
        </Group>
      </div>
    </div>
  )
}
