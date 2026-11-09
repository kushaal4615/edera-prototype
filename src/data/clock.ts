/* The demo's clock and formatting helpers.
   Today is Saturday 21 November 2026, 18:42 in London (GMT). Lagos is one
   hour ahead (WAT). Tonight Bola's hall is hosting Adaora & Kunle's
   engagement dinner (doors 18:30), so the planner's check-in screen is live. */

export const CLOCK = {
  todayIso: '2026-11-21',
  date: 'Sat 21 Nov 2026',
  time: '18:42',
  tz: 'London · GMT',
  lagosTime: '19:42',
  nowMin: 18 * 60 + 42,
}

export type Currency = 'GBP' | 'NGN'

/** £5,760 · ₦850,000 (no decimals: event quotes are whole numbers) */
export const money = (n: number, cur: Currency = 'GBP') =>
  cur === 'GBP' ? `£${Math.round(n).toLocaleString('en-GB')}` : `₦${Math.round(n).toLocaleString('en-NG')}`
export const gbp = (n: number) => money(n, 'GBP')
export const ngn = (n: number) => money(n, 'NGN')
/** £5.8k · ₦2.4m, for tight tiles */
export const moneyShort = (n: number, cur: Currency = 'GBP') => {
  const sym = cur === 'GBP' ? '£' : '₦'
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m`
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `${sym}${n}`
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export const toIso = (d: Date) => d.toISOString().slice(0, 10)
export const addDays = (iso: string, n: number) => {
  const d = parseIso(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return toIso(d)
}
/** "Sat 20 Feb" · with year "Sat 20 Feb 2027" */
export const fmtDay = (iso: string, year = false) => {
  const d = parseIso(iso)
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}${year ? ` ${d.getUTCFullYear()}` : ''}`
}
/** "20 Feb" */
export const fmtShort = (iso: string) => {
  const d = parseIso(iso)
  return `${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}`
}
export const dayNum = (iso: string) => parseIso(iso).getUTCDate()
export const dowLabel = (iso: string) => DOW[parseIso(iso).getUTCDay()]
export const monthLabel = (iso: string) => MONTH[parseIso(iso).getUTCMonth()]
/** whole days from today to `iso` (negative = past) */
export const daysUntil = (iso: string) => Math.round((parseIso(iso).getTime() - parseIso(CLOCK.todayIso).getTime()) / 86_400_000)
/** "in 91 days" · "today" · "3 days ago" */
export const relDay = (iso: string) => {
  const n = daysUntil(iso)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}
/** "2m ago" · "3h ago" · "Tue" · "14 Oct" — for feeds; minutesAgo relative to CLOCK */
export const ago = (minutes: number) => {
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${Math.round(minutes)}m ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`
  const days = Math.round(minutes / 60 / 24)
  if (days < 7) return `${days}d ago`
  return fmtShort(addDays(CLOCK.todayIso, -days))
}
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
