import { Capacitor } from '@capacitor/core'

let Purchases = null

export async function setupIAP(userId) {
  if (!Capacitor.isNativePlatform()) return false
  const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY
  if (!apiKey) { console.warn('VITE_REVENUECAT_IOS_KEY not set'); return false }
  try {
    const { Purchases: P } = await import('@revenuecat/purchases-capacitor')
    Purchases = P
    await Purchases.configure({ apiKey, appUserID: userId })
    return true
  } catch (e) {
    console.error('IAP setup error:', e)
    return false
  }
}

export async function getIAPOfferings() {
  if (!Purchases) return null
  try {
    const { offerings } = await Purchases.getOfferings()
    return offerings
  } catch (e) {
    console.error('getOfferings error:', e)
    return null
  }
}

export async function purchaseIAP(pkg) {
  if (!Purchases) throw new Error('IAP not initialized')
  return Purchases.purchasePackage({ packageToPurchase: pkg })
}

export async function restoreIAP() {
  if (!Purchases) throw new Error('IAP not initialized')
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}

export function getPlanFromCustomerInfo(customerInfo) {
  if (!customerInfo?.activeSubscriptions?.length) return null
  const subs = customerInfo.activeSubscriptions
  if (subs.some(s => s.includes('annual'))) return 'annual'
  if (subs.some(s => s.includes('monthly'))) return 'monthly'
  return null
}
