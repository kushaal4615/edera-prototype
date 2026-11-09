import { motion } from 'framer-motion'
import { BadgeCheck, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { CLOCK, dayNum, dowLabel, money, type Currency } from '../data/clock'
import { strip, type Availability, type Vendor } from '../data/vendors'
import { spring } from '../motion/springs'

/* THE SIGNATURE DEVICE: the availability strip.
   Dave's words on the call: "I can see the calendar, when the day is free
   and when it is booked, without even contacting the DJ." Every vendor card,
   every profile, every request and every admin row carries a strip of days
   in three states: free (evergreen), held (brass, a request is waiting) and
   booked (ink). The same three colours carry through every pill and chart
   that talks about a date.

   Mark:        the logo glyph: a leaf with a brass arc, in the brand's own
                shapes (taken from useedera.com's mark, redrawn).
   Wordmark:    Mark + "e-dera." with the brass dot.
   Strip:       14 days of availability for a vendor.
   StateDot:    one availability state as a dot + label.
   Money:       a figure with the currency symbol set smaller.
   Verified:    the Verified Professional check.
   Stars:       rating as stars + number.
   Stub:        a ticket stub with a notch (QR invites, bookings). */

export const AVAIL: Record<Availability, { fill: string; soft: string; onSoft: string; label: string }> = {
  free: { fill: 'var(--free)', soft: 'var(--free-soft)', onSoft: 'var(--on-free-soft)', label: 'Free' },
  held: { fill: 'var(--held)', soft: 'var(--held-soft)', onSoft: 'var(--on-held-soft)', label: 'Held' },
  booked: { fill: 'var(--booked)', soft: 'var(--booked-soft)', onSoft: 'var(--on-booked-soft)', label: 'Booked' },
  blocked: { fill: 'var(--blocked)', soft: 'var(--blocked)', onSoft: 'var(--text-2)', label: 'Unavailable' },
}

export function Mark({ size = 24, className = '', tone = 'ink' }: { size?: number; className?: string; tone?: 'ink' | 'light' | 'brass' }) {
  const leaf = tone === 'light' ? '#F7F2E8' : tone === 'brass' ? '#C9973F' : '#123C35'
  const arc = tone === 'brass' ? '#F7F2E8' : '#C9973F'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <path fillRule="evenodd" fill={leaf} d="M8 78C12 50 30 17 59 12c21-4 33 6 29 20-4 14-20 18-39 22C30 58 17 66 8 78Zm22-26c13-6 29-7 39-14 13-9 8-19-5-18-17 1-29 14-34 32Z" />
      <path fill={arc} d="M19 69c8 15 22 24 38 24 19 0 32-15 36-41-8 17-20 26-36 26-13 0-23-6-30-15Z" />
    </svg>
  )
}

export function Wordmark({ size = 22, tone = 'ink', className = '' }: { size?: number; tone?: 'ink' | 'light'; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark size={size * 1.3} tone={tone === 'light' ? 'light' : 'ink'} />
      <span className="display" style={{ fontSize: size, color: tone === 'light' ? 'var(--on-night)' : 'var(--text)' }}>
        e-dera<span style={{ color: 'var(--brass)' }}>.</span>
      </span>
    </span>
  )
}

/** Fourteen days of availability. `highlight` draws a ring on one date (the event's date). */
export function Strip({
  vendor,
  days = 14,
  from = CLOCK.todayIso,
  highlight,
  size = 'sm',
  labels = false,
  tone = 'paper',
  className = '',
  onPick,
}: {
  vendor: Vendor
  days?: number
  from?: string
  highlight?: string
  size?: 'xs' | 'sm' | 'md'
  labels?: boolean
  tone?: 'paper' | 'ink'
  className?: string
  onPick?: (iso: string, state: Availability) => void
}) {
  const cells = strip(vendor, days, from)
  const h = size === 'xs' ? 6 : size === 'sm' ? 10 : 30
  const gap = size === 'md' ? 4 : 3
  return (
    <div className={`flex flex-col ${className}`} role="img" aria-label={`Availability for the next ${days} days: ${cells.filter((c) => c.state === 'free').length} free, ${cells.filter((c) => c.state === 'held').length} held, ${cells.filter((c) => c.state === 'booked').length} booked`}>
      <div className="flex w-full" style={{ gap }}>
        {cells.map((c) => {
          const on = c.iso === highlight
          const cell = (
            <span
              className="relative block flex-1 overflow-hidden"
              style={{
                height: h,
                borderRadius: size === 'md' ? 8 : 3,
                background: c.state === 'blocked' && tone === 'ink' ? 'rgb(255 255 255 / 0.12)' : AVAIL[c.state].fill,
                opacity: c.state === 'blocked' ? 0.7 : 1,
                boxShadow: on ? `0 0 0 2px ${tone === 'ink' ? 'var(--night)' : 'var(--surface)'}, 0 0 0 4px var(--brass)` : undefined,
              }}
            >
              {size === 'md' && (
                <span className={`absolute inset-0 grid place-items-center text-[11px] font-extrabold ${c.state === 'booked' ? 'text-on-ink' : c.state === 'held' ? 'text-on-brass' : c.state === 'free' ? 'text-white' : 'text-text-2'}`}>{dayNum(c.iso)}</span>
              )}
            </span>
          )
          return onPick ? (
            <motion.button key={c.iso} type="button" whileTap={{ scale: 0.9 }} transition={spring.ui} aria-label={`${dowLabel(c.iso)} ${dayNum(c.iso)}: ${AVAIL[c.state].label}`} onClick={() => onPick(c.iso, c.state)} className="flex min-w-0 flex-1" style={{ minHeight: 44, alignItems: 'center' }}>
              {cell}
            </motion.button>
          ) : (
            <span key={c.iso} className="flex min-w-0 flex-1">
              {cell}
            </span>
          )
        })}
      </div>
      {labels && (
        <div className="mt-1.5 flex w-full" style={{ gap }}>
          {cells.map((c) => (
            <span key={c.iso} className={`meta flex-1 text-center ${tone === 'ink' ? 'text-on-ink-2' : 'text-text-2'}`} style={{ fontSize: 9.5 }}>
              {dowLabel(c.iso)[0]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Legend or inline state: dot + label. */
export function StateDot({ state, label, size = 'sm', className = '' }: { state: Availability; label?: string; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${size === 'sm' ? 'text-[12px]' : 'text-[13px]'} font-semibold ${className}`}>
      <span className="inline-block rounded-full" style={{ width: size === 'sm' ? 8 : 10, height: size === 'sm' ? 8 : 10, background: AVAIL[state].fill }} />
      {label ?? AVAIL[state].label}
    </span>
  )
}

export function StripLegend({ tone = 'paper', className = '' }: { tone?: 'paper' | 'ink'; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${tone === 'ink' ? 'text-on-ink-2' : 'text-text-2'} ${className}`}>
      <StateDot state="free" />
      <StateDot state="held" />
      <StateDot state="booked" />
    </div>
  )
}

/** Availability as a pill: "Free on Sat 20 Feb". */
export function AvailPill({ state, children, className = '' }: { state: Availability; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-bold ${className}`} style={{ background: AVAIL[state].soft, color: AVAIL[state].onSoft }}>
      <span className="h-2 w-2 rounded-full" style={{ background: AVAIL[state].fill }} />
      {children}
    </span>
  )
}

/** Money as a figure: £5,760 with the symbol smaller. */
export function Money({ amount, currency = 'GBP', size = 44, className = '', tone }: { amount: number; currency?: Currency; size?: number; className?: string; tone?: string }) {
  const s = money(amount, currency)
  const sym = s[0]
  const rest = s.slice(1)
  return (
    <span className={`figure num ${className}`} style={{ fontSize: size, color: tone }}>
      <span className="unit" style={{ verticalAlign: '0.35em', marginInlineEnd: '0.04em', marginInlineStart: 0 }}>{sym}</span>
      {rest}
    </span>
  )
}

/** A big number with a small unit: 91 days, 112 guests. */
export function Figure({ value, unit, size = 56, className = '', tone }: { value: ReactNode; unit?: string; size?: number; className?: string; tone?: string }) {
  return (
    <span className={`figure num ${className}`} style={{ fontSize: size, color: tone }}>
      {value}
      {unit && <span className="unit">{unit}</span>}
    </span>
  )
}

/** Verified Professional check. */
export function Verified({ size = 16, label = true, tone = 'accent', className = '' }: { size?: number; label?: boolean; tone?: 'accent' | 'light' | 'brass'; className?: string }) {
  const color = tone === 'light' ? 'var(--on-ink)' : tone === 'brass' ? 'var(--brass-text)' : 'var(--accent-text)'
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-bold ${className}`} style={{ color }}>
      <BadgeCheck size={size} strokeWidth={2.4} aria-hidden />
      {label && 'Verified'}
    </span>
  )
}

/** Rating as a brass star + number + count. */
export function Stars({ rating, count, size = 13, tone = 'paper', className = '' }: { rating: number; count?: number; size?: number; tone?: 'paper' | 'ink'; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap font-bold ${className}`} style={{ fontSize: size }}>
      <Star size={size} strokeWidth={0} fill="var(--brass)" aria-hidden />
      <span className={tone === 'ink' ? 'text-on-ink' : 'text-text'}>{rating.toFixed(1)}</span>
      {count !== undefined && <span className={`font-semibold ${tone === 'ink' ? 'text-on-ink-2' : 'text-text-2'}`}>({count})</span>}
    </span>
  )
}

/** Five stars for a review. */
export function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} strokeWidth={0} fill={i <= rating ? 'var(--brass)' : 'var(--paper-300)'} aria-hidden />
      ))}
    </span>
  )
}

/** A ticket stub: a card with a perforated notch line. The QR invite and bookings use it. */
export function Stub({ top, bottom, tone = 'surface', className = '' }: { top: ReactNode; bottom: ReactNode; tone?: 'surface' | 'ink' | 'brass'; className?: string }) {
  const bg = tone === 'ink' ? 'var(--ink)' : tone === 'brass' ? 'var(--brass)' : 'var(--surface)'
  const fg = tone === 'ink' ? 'text-on-ink' : tone === 'brass' ? 'text-on-brass' : 'text-text'
  return (
    <div className={`relative overflow-hidden rounded-[var(--r-card)] ${fg} ${className}`} style={{ background: bg, boxShadow: 'var(--shadow-raised)' }}>
      <div className="relative">{top}</div>
      <div className="relative flex items-center">
        <span aria-hidden className="h-6 w-6 shrink-0 -translate-x-1/2 rounded-full" style={{ background: 'var(--bg)' }} />
        <span aria-hidden className={`${tone === 'surface' ? 'perf' : 'perf-ink'} flex-1`} />
        <span aria-hidden className="h-6 w-6 shrink-0 translate-x-1/2 rounded-full" style={{ background: 'var(--bg)' }} />
      </div>
      <div className="relative">{bottom}</div>
    </div>
  )
}

/** Inline SVG QR-like code (deterministic from a seed), for invites and the door. */
export function QrCode({ seed, size = 160, dark = 'var(--ink)', light = 'var(--surface)' }: { seed: string; size?: number; dark?: string; light?: string }) {
  const n = 21
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const rnd = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return (h >>> 0) / 4294967295
  }
  const cells: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.5))
  const finder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const edge = i === 0 || i === 6 || j === 0 || j === 6
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4
        cells[r + i][c + j] = edge || core
      }
    for (let i = -1; i <= 7; i++)
      for (let j = -1; j <= 7; j++) {
        const rr = r + i
        const cc = c + j
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue
        if (i === -1 || i === 7 || j === -1 || j === 7) cells[rr][cc] = false
      }
  }
  finder(0, 0)
  finder(0, n - 7)
  finder(n - 7, 0)
  const unit = size / n
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`QR code ${seed}`} style={{ background: light, borderRadius: 8 }}>
      {cells.flatMap((row, r) => row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c * unit} y={r * unit} width={unit + 0.3} height={unit + 0.3} fill={dark} /> : null)))}
    </svg>
  )
}

/** Progress as a thin brass bar on paper or ink. */
export function Bar({ value, tone = 'accent', height = 6, className = '', track }: { value: number; tone?: 'accent' | 'brass' | 'ink' | 'danger'; height?: number; className?: string; track?: string }) {
  const fill = tone === 'brass' ? 'var(--brass)' : tone === 'ink' ? 'var(--ink)' : tone === 'danger' ? 'var(--danger)' : 'var(--accent)'
  return (
    <span className={`relative block w-full overflow-hidden rounded-full ${className}`} style={{ height, background: track ?? 'var(--surface-high)' }} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ background: fill }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} />
    </span>
  )
}
