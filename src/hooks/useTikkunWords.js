import { useState, useEffect, useRef } from 'react'

const BASE = import.meta.env.BASE_URL

export default function useTikkunWords(parashaId, parts) {
  const [words, setWords] = useState(null)
  const [error, setError] = useState(null)
  const keyRef = useRef(null)

  useEffect(() => {
    if (!parashaId) return
    const ids = parts ?? [parashaId]
    const key = ids.join(',')
    if (keyRef.current === key) return
    keyRef.current = key
    setWords(null)
    setError(null)

    Promise.all(ids.map(id =>
      fetch(`${BASE}tikkun-words/${id}.json`).then(r => {
        if (!r.ok) throw new Error(`${id}: ${r.status}`)
        return r.json()
      })
    ))
      .then(results => setWords(results.flat()))
      .catch(err => setError(err.message))
  }, [parashaId, parts?.join?.(',')])

  return { words, error }
}
