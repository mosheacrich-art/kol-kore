import { useState, useEffect, useRef } from 'react'
import { flattenVerses, stripHtml } from '../utils/hebrew'

// Simple in-memory cache keyed by URL
const cache = new Map()

async function fetchRef(ref) {
  const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?commentary=0&context=0&pad=0&wrapLinks=0&transLangPref=en`
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sefaria API error ${res.status}`)
  const data = await res.json()
  cache.set(url, data)
  return data
}

// Returns verses for a specific aliyah ref like "Genesis 1:1-2:3"
export function useAliyah(ref) {
  const [state, setState] = useState({ verses: [], loading: false, error: null })
  const lastRef = useRef(null)

  useEffect(() => {
    if (!ref || ref === lastRef.current) return
    lastRef.current = ref

    setState(s => ({ ...s, loading: true, error: null }))

    fetchRef(ref)
      .then(data => {
        // he can be a flat array or nested (chapter arrays)
        const heRaw = data.he || []
        const verses = flattenVerses(heRaw).map(stripHtml)
        setState({ verses, loading: false, error: null })
      })
      .catch(err => {
        setState({ verses: [], loading: false, error: err.message })
      })
  }, [ref])

  return state
}

// Returns verses for all aliyot of a parasha simultaneously (prefetching)
// We don't use this for the reader — we lazily load per aliyah
export function useAliyahText(ref, enabled = true) {
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ref || !enabled) return
    // Check cache first for instant display
    const cacheKey = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?commentary=0&context=0&pad=0&wrapLinks=0&transLangPref=en`
    if (cache.has(cacheKey)) {
      const data = cache.get(cacheKey)
      const v = flattenVerses(data.he || []).map(stripHtml)
      setVerses(v)
      return
    }

    setLoading(true)
    setError(null)

    fetchRef(ref)
      .then(data => {
        const v = flattenVerses(data.he || []).map(stripHtml)
        setVerses(v)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [ref, enabled])

  return { verses, loading, error }
}
