import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { Logo, Spinner } from '../components/ui'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { clearRecovery } = useAuth()
  const { t } = useLang()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError(t('password_min_error')); return }
    if (password !== confirm) { setError(t('passwords_no_match')); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setDone(true)
    clearRecovery()
    setTimeout(() => navigate('/student/profile'), 2000)
  }

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center px-4 bg-canvas relative">
      <div className="absolute inset-x-0 top-0 h-[50vh] pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(var(--gold-rgb),0.1), transparent 70%)' }} />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8"><Logo size={34} /></div>
        <div className="card p-7">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: 'rgb(var(--success-rgb))' }} />
              <p className="text-[15px] font-semibold text-ink">{t('password_updated')}</p>
              <p className="text-[13px] text-ink-3">{t('redirecting_profile')}</p>
            </div>
          ) : (
            <>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(var(--accent-rgb),0.07)', color: 'rgb(var(--accent-rgb))' }}>
                <KeyRound size={20} strokeWidth={1.7} />
              </span>
              <p className="hebrew-ui text-[14px] text-gold-ink mb-1">שִׁנּוּי סִיסְמָה</p>
              <h1 className="font-serif text-[26px] font-semibold text-ink tracking-[-0.01em] mb-5">{t('new_password_title')}</h1>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                  placeholder={t('new_password')} aria-label={t('new_password')} required autoFocus className="input" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                  placeholder={t('repeat_password')} aria-label={t('repeat_password')} required className="input" />
                {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-1">
                  {loading ? <Spinner size={16} /> : t('save_password')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
