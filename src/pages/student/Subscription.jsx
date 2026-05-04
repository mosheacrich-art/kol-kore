import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const MONTHLY_ID = 'pdt_0Ne7sWfihRRycFHWb1SB2'
const ANNUAL_ID  = 'pdt_0Ne7sn0u5XBSPuebqTIsh'

export default function StudentSubscription() {
  const { user, profile, setProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const justPaid = searchParams.get('success') === '1'

  const isActive = profile?.subscription_status === 'active'

  // After payment: poll until subscription_status = active (webhook may take a few seconds)
  useEffect(() => {
    if (!justPaid || isActive) return
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      const { data } = await supabase.from('profiles').select('subscription_status, subscription_id').eq('id', user.id).maybeSingle()
      if (data?.subscription_status === 'active') {
        setProfile(prev => ({ ...prev, ...data }))
        clearInterval(interval)
      }
      if (attempts >= 15) clearInterval(interval) // stop after ~45s
    }, 3000)
    return () => clearInterval(interval)
  }, [justPaid, isActive])

  if (justPaid && !isActive) {
    return <ActivatingView />
  }

  if (isActive) {
    return <ActiveView profile={profile} justPaid={justPaid} navigate={navigate} />
  }

  return <CheckoutView user={user} profile={profile} />
}

function ActivatingView() {
  return (
    <div className="p-8 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(108,51,230,0.2)', borderTopColor: '#6c33e6' }} />
      <div className="text-center">
        <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>Activando tu suscripción…</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Esto tarda unos segundos. No cierres la página.</p>
      </div>
    </div>
  )
}

function ActiveView({ profile, justPaid, navigate }) {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הַרְשָׁמָה · Suscripción
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Tu suscripción
        </h1>
      </div>

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
            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>¡Bienvenido a Perashapp Pro!</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Tu suscripción ya está activa. Los primeros 14 días son gratis.</p>
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl mb-6 fade-up-2"
        style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>Suscripción activa</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Tienes acceso completo a Perashapp Pro
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl mb-6 fade-up-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>Incluye</p>
        <ul className="flex flex-col gap-2">
          {['Audio del profesor sincronizado palabra a palabra', 'Todas las parashas del año', 'Taamim, nikkud y modo sefer', 'Envío de grabaciones al profesor'].map(item => (
            <li key={item} className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="6" cy="6" r="5" stroke="#22c55e" strokeWidth="1.2"/>
                <path d="M3.5 6l2 2L8.5 4" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={() => navigate('/student/study')}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'linear-gradient(135deg, #6c33e6, #8b5cf6)', color: '#fff', boxShadow: '0 4px 20px rgba(108,51,230,0.3)' }}>
        Ir a estudiar →
      </button>

      <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
        Para cancelar tu suscripción escríbenos a soporte@perashapp.com
      </p>
    </div>
  )
}

const FEATURES = [
  'Audio del profesor sincronizado palabra a palabra',
  'Todas las parashas del año',
  'Taamim, nikkud y modo sefer',
  'Envío de grabaciones al profesor',
  'Acceso desde cualquier dispositivo',
]

function CheckoutView({ user, profile }) {
  const [plan, setPlan] = useState('annual')
  const [paying, setPaying] = useState(false)

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: plan === 'annual' ? ANNUAL_ID : MONTHLY_ID,
          userId: user?.id,
          email: user?.email,
          name: profile?.name,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Error al iniciar el pago')
      window.location.href = data.url
    } catch (err) {
      alert(err.message)
      setPaying(false)
    }
  }

  const Spinner = () => (
    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
      style={{ borderColor: 'rgba(108,51,230,0.3)', borderTopColor: '#8b5cf6' }} />
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הַרְשָׁמָה · Suscripción
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          Elige tu plan
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          14 días gratis · Cancela cuando quieras
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 fade-up-2">

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
              Ahorra 17%
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: plan === 'annual' ? '#f9b800' : 'var(--border)' }}>
              {plan === 'annual' && <div className="w-2 h-2 rounded-full" style={{ background: '#f9b800' }} />}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Anual</span>
          </div>
          <div className="mb-0.5">
            <span className="text-3xl font-light" style={{ color: 'var(--text)' }}>$99</span>
            <span className="text-sm ml-1" style={{ color: 'var(--text-3)' }}>/año</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>= $8,25/mes · La opción más económica</p>
          <ul className="flex flex-col gap-1.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-1.5">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="5.5" cy="5.5" r="4.5" stroke="#f9b800" strokeWidth="1"/>
                  <path d="M3.5 5.5l1.5 1.5L7.5 4" stroke="#f9b800" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-2)', lineHeight: '1.3' }}>{f}</span>
              </li>
            ))}
          </ul>
        </button>

        {/* Monthly */}
        <button onClick={() => setPlan('monthly')}
          className="rounded-2xl p-5 text-left transition-all"
          style={{
            background: plan === 'monthly' ? 'rgba(108,51,230,0.08)' : 'var(--bg-card)',
            border: `1.5px solid ${plan === 'monthly' ? '#8b5cf6' : 'var(--border)'}`,
          }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: plan === 'monthly' ? '#8b5cf6' : 'var(--border)' }}>
                {plan === 'monthly' && <div className="w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }} />}
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Mensual</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(108,51,230,0.1)', color: '#8b5cf6', border: '1px solid rgba(108,51,230,0.2)' }}>
              Flexible
            </span>
          </div>
          <div className="mb-0.5">
            <span className="text-3xl font-light" style={{ color: 'var(--text)' }}>$9,99</span>
            <span className="text-sm ml-1" style={{ color: 'var(--text-3)' }}>/mes</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>Cancela en cualquier momento</p>
          <ul className="flex flex-col gap-1.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-1.5">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="5.5" cy="5.5" r="4.5" stroke="#8b5cf6" strokeWidth="1"/>
                  <path d="M3.5 5.5l1.5 1.5L7.5 4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-2)', lineHeight: '1.3' }}>{f}</span>
              </li>
            ))}
          </ul>
        </button>
      </div>

      {/* Summary + CTAs */}
      <div className="rounded-2xl p-5 fade-up-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {plan === 'annual' ? 'Plan Anual' : 'Plan Mensual'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              14 días gratis · Se renueva automáticamente
            </p>
          </div>
          <p className="text-2xl font-light" style={{ color: 'var(--text)' }}>
            {plan === 'annual' ? '$99' : '$9,99'}
          </p>
        </div>

        {/* Primary CTA — trial */}
        <button onClick={handlePay} disabled={paying}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-2"
          style={{
            background: paying ? 'var(--bg-card)' : 'linear-gradient(135deg, #6c33e6, #8b5cf6)',
            color: paying ? 'var(--text-3)' : '#fff',
            border: paying ? '1px solid var(--border)' : 'none',
            boxShadow: paying ? 'none' : '0 4px 20px rgba(108,51,230,0.35)',
          }}>
          {paying ? <><Spinner /> Redirigiendo al pago…</> : 'Probar gratis 14 días →'}
        </button>

        {/* Secondary CTA — subscribe directly */}
        <button onClick={handlePay} disabled={paying}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          style={{
            background: 'transparent',
            color: paying ? 'var(--text-muted)' : 'var(--text-2)',
            border: '1px solid var(--border)',
          }}>
          {paying ? <><Spinner /> Redirigiendo al pago…</> : 'Suscribirse ahora'}
        </button>

        <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
          Pago seguro · Los primeros 14 días son gratis · Cancela cuando quieras
        </p>
      </div>
    </div>
  )
}
