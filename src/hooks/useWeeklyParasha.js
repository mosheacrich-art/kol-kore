import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { PARASHOT, COMBINED_PARASHOT } from '../data/parashot'

// Hebcal spellings that differ from our parasha ids (after normalisation)
const ALIASES = {
  shmini: 'shemini',
  chayeisara: 'chayeisarah',
  behaalotcha: 'behaalotecha',
  shlach: 'shelach',
  eikev: 'ekev',
  kiteitzei: 'kitetzei',
  achreimot: 'achreimot',
  vezothaberakhah: 'vezothaberakhah',
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')

function matchParasha(title) {
  const key = norm(title.replace(/^Parashat\s+/i, ''))
  const target = ALIASES[key] || key
  const all = [...PARASHOT, ...COMBINED_PARASHOT]
  return all.find(p => norm(p.id) === target) || all.find(p => norm(p.name) === target) || null
}

function hebcalUrl(d) {
  const qs = `cfg=json&gy=${d.getFullYear()}&gm=${d.getMonth() + 1}&gd=${d.getDate()}&M=on`
  return Capacitor.isNativePlatform()
    ? `https://www.hebcal.com/shabbat?${qs}`
    : `/api/hebcal?endpoint=shabbat&${qs}`
}

/** Upcoming Shabbat's parasha (via Hebcal). Returns { parasha, loading }. */
export function useWeeklyParasha() {
  const [state, setState] = useState(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem('weeklyParasha') || 'null')
      if (cached && cached.day === new Date().toDateString()) {
        const p = [...PARASHOT, ...COMBINED_PARASHOT].find(x => x.id === cached.id)
        if (p) return { parasha: p, loading: false }
      }
    } catch { /* ignore */ }
    return { parasha: null, loading: true }
  })

  useEffect(() => {
    if (!state.loading) return
    let alive = true
    fetch(hebcalUrl(new Date()))
      .then(r => r.json())
      .then(data => {
        const item = data.items?.find(i => i.category === 'parashat')
        const p = item ? matchParasha(item.title) : null
        if (!alive) return
        setState({ parasha: p, loading: false })
        if (p) {
          try { sessionStorage.setItem('weeklyParasha', JSON.stringify({ id: p.id, day: new Date().toDateString() })) } catch { /* ignore */ }
        }
      })
      .catch(() => alive && setState({ parasha: null, loading: false }))
    return () => { alive = false }
  }, [state.loading])

  return state
}
