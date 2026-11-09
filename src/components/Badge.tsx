import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'solid' | 'ink' | 'warn' | 'danger' | 'info' | 'success'

const TONES: Record<Tone, string> = {
  neutral: 'bg-[var(--surface-high)] text-text',
  accent: 'bg-accent-soft text-[var(--on-accent-soft)]',
  solid: 'bg-accent text-on-accent',
  ink: 'bg-ink text-on-ink',
  warn: 'bg-warn-soft text-[var(--on-warn-soft)]',
  danger: 'bg-danger-soft text-[var(--on-danger-soft)]',
  info: 'bg-info-soft text-[var(--on-info-soft)]',
  success: 'bg-success-soft text-[var(--on-success-soft)]',
}

export function Badge({ tone = 'neutral', children, icon, className = '' }: { tone?: Tone; children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span className={`label inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 ${TONES[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  )
}

/** Outlined chip: activities, filters, lifestyle tags. */
export function Chip({ children, on = false, icon, className = '' }: { children: ReactNode; on?: boolean; icon?: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold ${on ? 'bg-accent text-on-accent' : 'text-text'} ${className}`}
      style={on ? undefined : { boxShadow: 'inset 0 0 0 1px var(--rule-strong)' }}
    >
      {icon}
      {children}
    </span>
  )
}
