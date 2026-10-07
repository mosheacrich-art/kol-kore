const LEAD = 0.25 // seconds of breath before the first word

// Proportional fallback timing: spread `duration` over words[start..end] by letter count.
// Everything outside the range stays null (the reader interpolates gaps).
export function buildRangeTimestamps(allWords, start, end, duration) {
  const out = new Array(allWords.length).fill(null)
  const span = Math.max(0.1, duration - LEAD)
  const weights = []
  let total = 0
  for (let i = start; i <= end; i++) {
    const w = (allWords[i].match(/[א-ת]/g) || []).length + 1
    weights.push(w); total += w
  }
  let t = LEAD
  for (let i = start; i <= end; i++) {
    const d = (weights[i - start] / total) * span
    out[i] = { start: +t.toFixed(3), end: +(t + d).toFixed(3) }
    t += d
  }
  return out
}

// Words of the range for Whisper alignment, with their index in the full aliyah.
// Only Hebrew tokens are sent, matching what the sync API keeps.
export function buildSyncRange(allWords, start, end) {
  const words = [], indices = []
  for (let i = start; i <= end; i++) {
    if (/[א-ת]/.test(allWords[i])) { words.push(allWords[i]); indices.push(i) }
  }
  return words.length ? { words, indices, size: allWords.length } : null
}
