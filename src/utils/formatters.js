/**
 * Formatting helpers for dates and clinical values.
 */

/**
 * Format an ISO/SQL datetime string into a readable local date-time.
 */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Relative time (e.g. "hace 3h") for recent events.
 */
export function timeAgo(value) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const units = [
    ['a', 31536000], ['m', 2592000], ['d', 86400],
    ['h', 3600], ['min', 60],
  ]
  for (const [label, secs] of units) {
    const amount = Math.floor(seconds / secs)
    if (amount >= 1) return `hace ${amount}${label}`
  }
  return 'justo ahora'
}

/**
 * Compute age in years from a date-of-birth string. The age is never stored;
 * it is always derived, per the data model rules.
 */
export function ageFromDate(dateOfBirth) {
  if (!dateOfBirth) return '—'
  const dob = new Date(dateOfBirth.replace(' ', 'T'))
  if (Number.isNaN(dob.getTime())) return '—'
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}