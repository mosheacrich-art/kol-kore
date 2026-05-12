import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'

export default function AccountSettings() {
  const { profile, signOut } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const isTeacher = profile?.role === 'teacher'

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
        throw new Error(body.error || 'Error al eliminar la cuenta')
      }
      await signOut()
      navigate('/login')
    } catch (err) {
      setDeleteError(err.message)
      setDeletePhase('confirm')
    }
  }

  const accent = isTeacher ? '#f9b800' : '#8b5cf6'
  const accentBg = isTeacher ? 'rgba(249,184,0,0.1)' : 'rgba(108,51,230,0.1)'
  const accentBorder = isTeacher ? 'rgba(249,184,0,0.2)' : 'rgba(108,51,230,0.2)'

  return (
    <div className="flex-1 overflow-auto px-4 py-6 max-w-lg mx-auto w-full">
      <h1 className="text-lg font-semibold mb-6" style={{ color: 'var(--text)' }}>
        {t('nav_account')}
      </h1>

      {/* ── Change password ─────────────────────────────────────────────── */}
      <section className="rounded-2xl p-5 mb-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
          {t('change_password')}
        </h2>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder={t('new_password')}
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <input
            type="password"
            placeholder={t('repeat_password')}
            value={repeatPwd}
            onChange={e => setRepeatPwd(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />

          {pwdMsg && (
            <p className="text-xs px-3 py-2 rounded-lg"
              style={{
                color: pwdMsg.ok ? '#22c55e' : '#ef4444',
                background: pwdMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${pwdMsg.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}`,
              }}>
              {pwdMsg.text}
            </p>
          )}

          <button type="submit" disabled={pwdLoading || !newPwd}
            className="py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: pwdLoading || !newPwd ? 'var(--bg)' : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: pwdLoading || !newPwd ? 'var(--text-3)' : isTeacher ? '#0d0b1e' : '#fff',
              border: `1px solid ${pwdLoading || !newPwd ? 'var(--border)' : accent}`,
            }}>
            {pwdLoading ? '…' : t('save_password')}
          </button>
        </form>
      </section>

      {/* ── Danger zone: delete account ─────────────────────────────────── */}
      <section className="rounded-2xl p-5"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <h2 className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
          {t('delete_account')}
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
          {t('delete_account_desc')}
        </p>

        {deletePhase === 'idle' && (
          <button onClick={() => setDeletePhase('confirm')}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {t('delete_account')}
          </button>
        )}

        {(deletePhase === 'confirm' || deletePhase === 'deleting') && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
              {t('delete_account_confirm').replace('{word}', CONFIRM_WORD)}
            </p>
            <input
              type="text"
              placeholder={CONFIRM_WORD}
              value={deleteConfirm}
              onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(null) }}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--text)' }}
            />
            {deleteError && (
              <p className="text-xs" style={{ color: '#ef4444' }}>{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setDeletePhase('idle'); setDeleteConfirm(''); setDeleteError(null) }}
                disabled={deletePhase === 'deleting'}
                className="flex-1 py-2 rounded-xl text-xs transition-all"
                style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {t('cancel') || 'Cancelar'}
              </button>
              <button onClick={handleDeleteAccount}
                disabled={deletePhase === 'deleting'}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ color: '#fff', background: '#ef4444', border: '1px solid #ef4444' }}>
                {deletePhase === 'deleting' ? '…' : t('delete_account_btn')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
