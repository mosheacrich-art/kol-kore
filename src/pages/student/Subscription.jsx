import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const MONTHLY = 5
const ANNUAL = 50
const TRIAL_DAYS = 7
const SAVING_PCT = Math.round(100 - (ANNUAL / (MONTHLY * 12)) * 100) // 17%

function fmtDate(d) {
  return d?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) ?? ''
}

export default function StudentSubscription() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState('monthly')
  const [months, setMonths] = useState(1)
  const [paying, setPaying] = useState(false)
  const justPaid = searchParams.get('success') === '1'

  // Trial info
  const createdAt = profile?.created_at ? new Date(profile.created_at) : null
  const trialEnd = createdAt ? new Date(+createdAt + TRIAL_DAYS * 86400000) : null
  const now = new Date()
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : 0
  const inTrial = trialDaysLeft > 0

  // Active subscription
  const subExpires = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const isActive = subExpires && subExpires > now

  const price = plan === 'annual' ? ANNUAL : MONTHLY * months
  const accessUntil = plan === 'annual'
    ? new Date(+now + 365 * 86400000)
    : new Date(+now + months * 30 * 86400000)

  const handlePay = async () => {
    setPaying(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, months: plan === 'annual' ? 12 : months },
      })
      if (error || !data?.url) throw new Error(error?.message ?? 'Error al iniciar el pago')
      window.location.href = data.url
    } catch (err) {
      alert(err.message)
      setPaying(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הַרְשָׁמָה · Suscripción
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Tu suscripción
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Acceso completo a Perashá · Sin cargos automáticos
        </p>
      </div>

      {/* Success banner */}
      {justPaid && (
        <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 fade-up-1"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#16a34a" strokeWidth="1.3"/>
              <path d="M4 7l2.5 2.5L10 5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>¡Pago completado!</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Tu suscripción ya está activa. Disfruta del acceso completo.</p>
          </div>
        </div>
      )}

      {/* Current status */}
      <div className="mb-6 fade-up-2">
        {isActive ? (
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>Suscripción activa</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Vence el {fmtDate(subExpires)}</p>
            </div>
          </div>
        ) : inTrial ? (
          <div className="p-4 rounded-2xl"
            style={{ background: 'rgba(249,184,0,0.07)', border: '1px solid rgba(249,184,0,0.2)' }}>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#f9b800' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-gold)' }}>
                Prueba gratuita · {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}
              </p>
            </div>
            <p className="text-xs pl-5 mb-3" style={{ color: 'var(--text-3)' }}>
              Tu prueba vence el {fmtDate(trialEnd)}. Suscríbete antes para no perder el acceso.
            </p>
            <div className="pl-5">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(249,184,0,0.15)' }}>
                <div className="h-full rounded-full"
                  style={{
                    width: `${(trialDaysLeft / TRIAL_DAYS) * 100}%`,
                    background: 'linear-gradient(90deg, #f9b800, #ffd54f)',
                    transition: 'width 1s ease',
                  }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>Sin suscripción activa</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Elige un plan para recuperar el acceso completo</p>
            </div>
          </div>
        )}
      </div>

      {/* Plan selector */}
      <div className="fade-up-3">
        <p className="text-xs mb-4 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          Elige tu plan
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

          {/* Monthly */}
          <button onClick={() => setPlan('monthly')}
            className="rounded-2xl p-5 text-left transition-all"
            style={{
              background: plan === 'monthly' ? 'rgba(108,51,230,0.1)' : 'var(--bg-card)',
              border: `1.5px solid ${plan === 'monthly' ? '#8b5cf6' : 'var(--border)'}`,
            }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: plan === 'monthly' ? '#8b5cf6' : 'var(--border)' }}>
                  {plan === 'monthly' && <div className="w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }} />}
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Mensual</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(108,51,230,0.12)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
                Flexible
              </span>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-light" style={{ color: 'var(--text)' }}>5€</span>
              <span className="text-sm ml-1" style={{ color: 'var(--text-3)' }}>/mes</span>
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>¿Cuántos meses quieres pagar?</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 9, 12].map(m => (
                  <button key={m}
                    onClick={e => { e.stopPropagation(); setPlan('monthly'); setMonths(m) }}
                    className="py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: plan === 'monthly' && months === m ? '#8b5cf6' : 'var(--bg-card)',
                      color: plan === 'monthly' && months === m ? '#fff' : 'var(--text-3)',
                      border: `1px solid ${plan === 'monthly' && months === m ? '#8b5cf6' : 'var(--border)'}`,
                    }}>
                    {m === 12 ? '1 año' : `${m}m`}
                  </button>
                ))}
              </div>
            </div>
          </button>

          {/* Annual */}
          <button onClick={() => setPlan('annual')}
            className="rounded-2xl p-5 text-left transition-all relative"
            style={{
              background: plan === 'annual' ? 'rgba(249,184,0,0.07)' : 'var(--bg-card)',
              border: `1.5px solid ${plan === 'annual' ? '#f9b800' : 'var(--border)'}`,
            }}>
            <div className="absolute -top-3 right-4">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: 'linear-gradient(135deg, #f9b800, #ffd54f)', color: '#0d0b1e' }}>
                Ahorra {SAVING_PCT}%
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ borderColor: plan === 'annual' ? '#f9b800' : 'var(--border)' }}>
                {plan === 'annual' && <div className="w-2 h-2 rounded-full" style={{ background: '#f9b800' }} />}
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Anual</span>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-light" style={{ color: 'var(--text)' }}>50€</span>
              <span className="text-sm ml-1" style={{ color: 'var(--text-3)' }}>/año</span>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
              = 4,17 €/mes · Acceso 12 meses
            </p>

            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#f9b800" strokeWidth="1.2"/>
                <path d="M3.5 6l2 2L8.5 4" stroke="#f9b800" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs" style={{ color: 'var(--text-gold)' }}>La opción más económica</span>
            </div>
          </button>
        </div>

        {/* No auto-renewal notice */}
        <div className="p-4 rounded-2xl mb-5 flex items-start gap-3"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="6.5" stroke="#16a34a" strokeWidth="1.3"/>
            <path d="M5.5 8l2 2L10.5 6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>Sin renovación automática</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>
              Pagas una sola vez y tienes acceso durante el periodo elegido.
              Cuando venza, decides tú si quieres renovar.{' '}
              <strong style={{ color: 'var(--text-2)' }}>No te cobraremos nada sin que tú lo autorices.</strong>
            </p>
          </div>
        </div>

        {/* Summary + Pay button */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {plan === 'annual'
                  ? 'Acceso anual · 12 meses'
                  : `Acceso mensual · ${months} mes${months > 1 ? 'es' : ''}`}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Acceso hasta el {fmtDate(accessUntil)} · Pago único
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-3xl font-light" style={{ color: 'var(--text)' }}>{price}€</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>una vez</p>
            </div>
          </div>

          <button onClick={handlePay} disabled={paying}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            style={{
              background: paying ? 'var(--bg-card)' : 'linear-gradient(135deg, #6c33e6, #8b5cf6)',
              color: paying ? 'var(--text-3)' : '#fff',
              border: paying ? '1px solid var(--border)' : 'none',
              boxShadow: paying ? 'none' : '0 4px 20px rgba(108,51,230,0.35)',
            }}>
            {paying ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#8b5cf6' }} />
                Redirigiendo al pago…
              </>
            ) : (
              `Pagar ${price} € →`
            )}
          </button>

          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
            Pago seguro vía Stripe · Tarjeta, SEPA o Bizum
          </p>
        </div>

        {/* Skip button */}
        <div className="mt-5 text-center">
          <button onClick={() => navigate('/student/profile')}
            className="text-xs py-2 px-4 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            Saltar por ahora →
          </button>
        </div>
      </div>
    </div>
  )
}
