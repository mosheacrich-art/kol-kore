// Streak shown to users: if the last study day was before yesterday, the streak is broken.
export function currentStreak(p) {
  if (!p) return 0
  const streak = p.streak || 0
  if (!p.streak_last_date) return streak
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const [y, m, d] = p.streak_last_date.split('-').map(Number)
  return new Date(y, m - 1, d) < yesterday ? 0 : streak
}
