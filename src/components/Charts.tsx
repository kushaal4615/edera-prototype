import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../motion/useReducedMotion'

/* Micro-charts. Thin marks, 2px lines, rounded data ends, no tracks
   behind progress. Text never wears the series colour. */

export function Sparkline({ data, width = 96, height = 28, color = 'var(--accent)', fill = true, strokeWidth = 2 }: { data: number[]; width?: number; height?: number; color?: string; fill?: boolean; strokeWidth?: number }) {
  const reduce = useReducedMotion()
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 6)] as const)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L${width} ${height} L0 ${height} Z`
  const last = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 overflow-visible" aria-hidden>
      {fill && <path d={area} fill={color} opacity={0.1} />}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  )
}

export function ProgressRing({ value, size = 56, stroke = 6, color = 'var(--accent)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const reduce = useReducedMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </span>
  )
}

/** Tiny vertical bar strip: the last N outcomes, up = accepted, down = declined / missed. */
export function BarStrip({ results, height = 22 }: { results: ('W' | 'L')[]; height?: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" style={{ height }} role="img" aria-label={`Last ${results.length}: ${results.map((r) => (r === 'W' ? 'accepted' : 'declined')).join(', ')}`}>
      {results.map((r, i) => (
        <span
          key={i}
          className={`block w-[5px] rounded-full ${r === 'W' ? 'self-start bg-ink' : 'self-end bg-brass'}`}
          style={{ height: r === 'W' ? height * 0.78 : height * 0.42 }}
        />
      ))}
    </span>
  )
}

/** Budget bar: spent vs committed, with a marker line (default at 100%). */
export function BudgetBar({ regular, overtime = 0, max = 100, height = 10, marker = 100 }: { regular: number; overtime?: number; max?: number; height?: number; marker?: number }) {
  const r = Math.min(100, (regular / max) * 100)
  const o = Math.min(100 - r, (overtime / max) * 100)
  const line = (marker / max) * 100
  return (
    <span className="relative block w-full overflow-visible rounded-full bg-[var(--surface-high)]" style={{ height }} role="img" aria-label={`${regular} spent${overtime ? ` and ${overtime} pending` : ''}`}>
      <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${r}%` }} />
      {o > 0 && <span className="absolute inset-y-0 rounded-r-full bg-brass" style={{ left: `${r}%`, width: `${o}%` }} />}
      <span aria-hidden className="absolute -top-1 -bottom-1 w-[2px] bg-[var(--ink)]" style={{ left: `${line}%` }} />
    </span>
  )
}

/* Recharts styling shared by the admin console. */
export const CHART = {
  grid: 'rgb(18 60 53 / 0.08)',
  axis: { fontSize: 11, fill: '#4F655F', fontFamily: 'DM Mono, monospace' },
  series: {
    primary: '#1C6B5A',
    secondary: '#C9973F',
    tertiary: '#123C35',
    free: '#2E9C85',
    held: '#C9973F',
    booked: '#123C35',
    clients: '#1C6B5A',
    planners: '#C9973F',
    vendors: '#123C35',
    uk: '#1C6B5A',
    ng: '#C9973F',
    warn: '#8A5E14',
    danger: '#B2384A',
    ink: '#123C35',
    muted: '#E1D6C2',
  },
  tooltip: {
    contentStyle: {
      background: '#123C35',
      border: 'none',
      borderRadius: 12,
      color: '#F7F2E8',
      fontSize: 12,
      fontFamily: 'Manrope, sans-serif',
      boxShadow: '0 12px 30px -12px rgb(18 60 53 / 0.5)',
      padding: '8px 12px',
    },
    labelStyle: { color: '#B9CBC4', fontSize: 11, marginBottom: 4 },
    itemStyle: { color: '#F7F2E8', padding: 0 },
    cursor: { stroke: 'rgb(18 60 53 / 0.3)', strokeWidth: 1 },
  },
}
