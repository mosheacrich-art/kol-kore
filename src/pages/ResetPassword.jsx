import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { clearRecovery } = useAuth()
  const { isDark } = useTheme()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const bg = isDark
    ? 'radial-gradient(ellipse at 50% 0%, #1a0f3e 0%, #0d0b1e 100%)'
    : 'radial-gradient(ellipse at 50% 0%, #e0d5be 0%, #f5f0e4 100%)'

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.9)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
    color: 'var(--text)',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: bg }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs hebrew mb-2" style={{ color: 'var(--text-gold)' }}>שִׁנּוּי סִיסְמָה</p>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Nueva contraseña
          </h1>
        </div>

        <div className="rounded-2xl p-6"
          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#16a34a" strokeWidth="1.5"/>
                  <path d="M6 10l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>Contraseña actualizada</p>
              <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>Redirigiendo a tu perfil…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)" required autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle} />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repetir contraseña" required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle} />
              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm mt-1 transition-all"
                style={{
                  background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, #6c33e6, #8b5cf6)',
                  color: loading ? 'var(--text-3)' : '#fff',
                  border: loading ? '1px solid var(--border)' : 'none',
                }}>
                {loading ? '…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
