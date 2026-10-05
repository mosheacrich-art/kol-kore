import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, CheckCircle2, Lock, RotateCcw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LangContext'
import { Capacitor } from '@capacitor/core'
import { setupIAP, getIAPOfferings, purchaseIAP, restoreIAP, getPlanFromCustomerInfo } from '../../lib/iap'
import { PageHeader, Spinner } from '../../components/ui'

const MONTHLY_ID = 'pdt_0Ne7sWfihRRycFHWb1SB2'
const ANNUAL_ID  = 'pdt_0Ne7sn0u5XBSPuebqTIsh'

export default function StudentSubscription() {
  const { user, profile, setProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useLang()
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
  }, [justPaid, isActive]) // eslint-disable-line react-hooks/exhaustive-deps

  if (justPaid && !isActive) return <ActivatingView t={t} />
  if (isActive) return <ActiveView profile={profile} justPaid={justPaid} navigate={navigate} t={t} />
  if (Capacitor.isNativePlatform()) return <NativeCheckoutView user={user} profile={profile} setProfile={setProfile} t={t} />
  return <CheckoutView user={user} profile={profile} t={t} />
}

function ActivatingView({ t }) {
  return (
    <div className="page page-narrow flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
      <Spinner size={36} />
      <div>
        <p className="font-serif text-[22px] font-semibold text-ink">{t('activating_sub')}</p>
        <p className="text-sm text-ink-3 mt-1">{t('activating_desc')}</p>
      </div>
    </div>
  )
}

function FeatureList({ items, compact = false }) {
  return (
    <ul className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
      {(items || []).map(f => (
        <li key={f} className="flex items-start gap-2.5">
          <Check size={compact ? 14 : 16} strokeWidth={2.4} className="flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--success-rgb))' }} />
          <span className={`${compact ? 'text-[13px]' : 'text-[14px]'} text-ink-2 leading-snug`}>{f}</span>
        </li>
      ))}
    </ul>
  )
}

function ActiveView({ profile, justPaid, navigate, t }) {
  const endDate = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : null
  const daysLeft = endDate ? Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const plan = profile?.subscription_plan
  const planLabel = plan === 'annual' ? t('annual_plan') : plan === 'monthly' ? t('monthly_plan') : null

  return (
    <div className="page page-narrow">
      <PageHeader hebrew="הַרְשָׁמָה" eyebrow={t('nav_subscription')} title={t('ui_your_subscription')} />

      {justPaid && (
        <div className="mb-5 p-4 rounded-2xl flex items-center gap-3 fade-up-1" style={{ background: 'rgba(var(--success-rgb),0.08)' }}>
          <CheckCircle2 size={22} style={{ color: 'rgb(var(--success-rgb))' }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'rgb(var(--success-rgb))' }}>{t('welcome_pro')}</p>
            <p className="text-[13px] text-ink-3">{t('sub_active_now')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 fade-up-2">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <span className="badge badge-success badge-dot">{t('sub_active')}</span>
            {planLabel && <span className="badge">{planLabel}</span>}
          </div>
          <p className="text-[14px] text-ink-3">{t('full_access')}</p>
          {endDate && (
            <div className="mt-5 pt-5 flex items-end justify-between gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <p className="text-[12px] text-ink-3">{daysLeft > 0 ? t('sub_renews_on') : t('sub_expired_on')}</p>
                <p className="text-[15px] font-medium text-ink mt-0.5">
                  {endDate.toLocaleDateString(t('date_locale'), { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {daysLeft !== null && (
                <div className="text-end">
                  <p className="font-serif text-[30px] font-semibold leading-none tabular-nums"
                    style={{ color: daysLeft <= 7 ? 'rgb(var(--warning-rgb))' : 'var(--text)' }}>{Math.max(0, daysLeft)}</p>
                  <p className="text-[12px] text-ink-3">{t('days')}</p>
                </div>
              )}
            </div>
          )}
        </section>
        <section className="card p-6">
          <p className="eyebrow mb-4">{t('includes')}</p>
          <FeatureList items={t('sub_features')} />
        </section>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 fade-up-3">
        <button onClick={() => navigate('/student/study')} className="btn btn-primary btn-lg w-full sm:w-auto">
          {t('go_study')}<ArrowRight size={17} className="rtl:rotate-180" />
        </button>
        <p className="text-[12px] text-ink-3 text-center">{t('cancel_info')}</p>
      </div>
    </div>
  )
}

function PlanCard({ selected, onSelect, title, price, unit, desc, badge, tag, features }) {
  return (
    <button onClick={onSelect} aria-pressed={selected}
      className="relative text-start p-6 rounded-2xl bg-surface transition-all"
      style={{
        border: `1.5px solid ${selected ? 'rgb(var(--accent-rgb))' : 'var(--border)'}`,
        boxShadow: selected ? '0 0 0 4px rgba(var(--accent-rgb),0.07), var(--shadow-md)' : 'var(--shadow-sm)',
      }}>
      {badge && (
        <span className="absolute -top-3 end-5 btn-gold text-[12px] font-semibold h-6 px-2.5 rounded-full inline-flex items-center">{badge}</span>
      )}
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: `1.5px solid ${selected ? 'rgb(var(--accent-rgb))' : 'var(--border-strong)'}` }}>
            {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgb(var(--accent-rgb))' }} />}
          </span>
          <span className="text-[15px] font-semibold text-ink">{title}</span>
        </span>
        {tag && <span className="badge">{tag}</span>}
      </span>
      <span className="flex items-baseline gap-1 mt-5">
        <span className="font-serif text-[40px] font-semibold text-ink leading-none tracking-tight">{price}</span>
        <span className="text-[14px] text-ink-3">{unit}</span>
      </span>
      {desc && <span className="block text-[13px] text-ink-3 mt-2">{desc}</span>}
      {features && <span className="block mt-5 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}><FeatureList items={features} compact /></span>}
    </button>
  )
}

function CheckoutView({ profile, t }) {
  const [plan, setPlan] = useState('annual')
  const [paying, setPaying] = useState(false)

  const handlePay = async () => {
    setPaying(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          productId: plan === 'annual' ? ANNUAL_ID : MONTHLY_ID,
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

  return (
    <div className="page page-narrow">
      <PageHeader hebrew="הַרְשָׁמָה" eyebrow={t('nav_subscription')} title={t('choose_plan')} subtitle={t('cancel_anytime')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 fade-up-1">
        <PlanCard selected={plan === 'annual'} onSelect={() => setPlan('annual')} badge={t('save_17')}
          title={t('annual_plan')} price="$100" unit={t('year_unit')} desc={t('annual_desc')} features={t('sub_features')} />
        <PlanCard selected={plan === 'monthly'} onSelect={() => setPlan('monthly')} tag={t('flexible')}
          title={t('monthly_plan')} price="$10" unit={t('month_unit')} desc={t('monthly_desc')} features={t('sub_features')} />
      </div>

      <section className="card p-5 sm:p-6 fade-up-2">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-[15px] font-semibold text-ink">{plan === 'annual' ? t('plan_annual') : t('plan_monthly')}</p>
            <p className="text-[13px] text-ink-3 mt-0.5">{t('auto_renew')}</p>
          </div>
          <p className="font-serif text-[28px] font-semibold text-ink">{plan === 'annual' ? '$99,99' : '$9,99'}</p>
        </div>
        <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg w-full">
          {paying ? <><Spinner size={16} />{t('redirecting_payment')}</> : t('subscribe_btn')}
        </button>
        <p className="text-[12px] text-ink-3 text-center mt-3 inline-flex items-center justify-center gap-1.5 w-full">
          <Lock size={12} />{t('secure_payment')}
        </p>
      </section>
    </div>
  )
}

// ── Native IAP checkout (iOS only — Dodo not used) ───────────────────────────

function NativeCheckoutView({ user, setProfile, t }) {
  const [plan, setPlan]             = useState('annual')
  const [offerings, setOfferings]   = useState(null)
  const [loadingIAP, setLoadingIAP] = useState(true)
  const [paying, setPaying]         = useState(false)
  const [restoring, setRestoring]   = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function init() {
      await setupIAP(user.id)
      const off = await getIAPOfferings()
      setOfferings(off)
      setLoadingIAP(false)
    }
    init()
  }, [user.id])

  const monthlyPkg   = offerings?.current?.monthly
  const annualPkg    = offerings?.current?.annual
  const monthlyPrice = monthlyPkg?.product?.priceString ?? '$9.99'
  const annualPrice  = annualPkg?.product?.priceString  ?? '$99.99'

  const handlePurchase = async () => {
    const pkg = plan === 'annual' ? annualPkg : monthlyPkg
    if (!pkg) { setError('Plans not loaded. Please try again.'); return }
    setPaying(true); setError('')
    try {
      const { customerInfo } = await purchaseIAP(pkg)
      const detectedPlan = getPlanFromCustomerInfo(customerInfo)
      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_plan: detectedPlan || plan,
      }).eq('id', user.id)
      setProfile(prev => ({ ...prev, subscription_status: 'active', subscription_plan: detectedPlan || plan }))
    } catch (e) {
      if (!String(e?.message).toLowerCase().includes('cancel')) {
        setError(e?.message || 'Purchase failed. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true); setError('')
    try {
      const customerInfo = await restoreIAP()
      const detectedPlan = getPlanFromCustomerInfo(customerInfo)
      if (detectedPlan) {
        await supabase.from('profiles').update({
          subscription_status: 'active',
          subscription_plan: detectedPlan,
        }).eq('id', user.id)
        setProfile(prev => ({ ...prev, subscription_status: 'active', subscription_plan: detectedPlan }))
      } else {
        setError('No active subscription found.')
      }
    } catch (e) {
      setError(e?.message || 'Restore failed.')
    } finally {
      setRestoring(false)
    }
  }

  if (loadingIAP) return <div className="page flex items-center justify-center min-h-[60vh]"><Spinner size={32} /></div>

  return (
    <div className="page page-narrow">
      <PageHeader hebrew="הַרְשָׁמָה" eyebrow={t('nav_subscription')} title={t('choose_plan')} subtitle={t('cancel_anytime')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 fade-up-1">
        <PlanCard selected={plan === 'annual'} onSelect={() => setPlan('annual')} badge={t('save_17')}
          title={t('annual_plan')} price={annualPrice} unit={t('year_unit')} desc={t('annual_desc')} />
        <PlanCard selected={plan === 'monthly'} onSelect={() => setPlan('monthly')}
          title={t('monthly_plan')} price={monthlyPrice} unit={t('month_unit')} desc={t('monthly_desc')} />
      </div>

      {error && <p className="text-[13px] mb-3 text-center text-danger">{error}</p>}

      <section className="card p-5 sm:p-6 fade-up-2">
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="text-[15px] font-semibold text-ink">{plan === 'annual' ? t('plan_annual') : t('plan_monthly')}</p>
          <p className="font-serif text-[28px] font-semibold text-ink">{plan === 'annual' ? annualPrice : monthlyPrice}</p>
        </div>
        <button onClick={handlePurchase} disabled={paying || !offerings} className="btn btn-primary btn-lg w-full">
          {paying ? <><Spinner size={16} />{t('redirecting_payment')}</> : t('subscribe_btn')}
        </button>
        <p className="text-[12px] text-ink-3 text-center mt-3">{t('auto_renew')}</p>
      </section>

      <button onClick={handleRestore} disabled={restoring} className="btn btn-secondary w-full mt-4">
        <RotateCcw size={15} />{restoring ? '…' : 'Restore purchases'}
      </button>

      <p className="text-[12px] text-ink-3 text-center mt-4">
        To cancel go to Settings → your name → Subscriptions on your device.
      </p>
    </div>
  )
}
