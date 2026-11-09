import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { img, type MediaKey } from '../data/media'
import { Mark } from './Brand'

/* Imagery and the small structural pieces around it. */

/** Photograph with a real scrim. Text placed over it is checked against the scrimmed image. */
export function HeroImage({ src, alt, className = '', scrim = 'b', children, width = 900, position = 'center' }: { src: MediaKey; alt: string; className?: string; scrim?: 'b' | 't' | 'both' | 'none' | 'full'; children?: ReactNode; width?: number; position?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--surface-high)] ${className}`}>
      <img src={img(src, width)} alt={alt} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} loading="lazy" />
      {(scrim === 'b' || scrim === 'both') && <div className="scrim-b pointer-events-none absolute inset-0" />}
      {(scrim === 't' || scrim === 'both') && <div className="scrim-t pointer-events-none absolute inset-x-0 top-0 h-[45%]" />}
      {scrim === 'full' && <div className="pointer-events-none absolute inset-0 bg-[rgb(11_38_34/0.62)]" />}
      {children && <div className="relative h-full">{children}</div>}
    </div>
  )
}

/** Horizontal snap rail that bleeds off the right edge so the next card peeks. */
export function Rail({ children, gap = 12, padLeft = 20, className = '' }: { children: ReactNode; gap?: number; padLeft?: number; className?: string }) {
  return (
    <div className={`scroll-x flex ${className}`} style={{ gap, paddingLeft: padLeft, paddingRight: padLeft, scrollPaddingLeft: padLeft }}>
      {children}
    </div>
  )
}

export function StatTile({ label, value, sub, tone = 'plain', children }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'plain' | 'ink' | 'accent' | 'warn' | 'danger'; children?: ReactNode }) {
  const tones = {
    plain: 'bg-[var(--surface)] text-text',
    ink: 'bg-ink text-on-ink',
    accent: 'bg-accent text-on-accent',
    warn: 'bg-warn text-on-warn',
    danger: 'bg-danger text-on-danger',
  } as const
  const subCls = tone === 'plain' || tone === 'ink' ? 'text-text-2' : tone === 'accent' ? 'text-[var(--on-accent-2)]' : 'text-[color-mix(in_oklch,currentColor_82%,transparent)]'
  return (
    <div className={`flex flex-col justify-between gap-2 p-4 ${tones[tone]}`}>
      <span className="label">{label}</span>
      <span className="figure num text-[40px]">{value}</span>
      {sub && <span className={`text-[13px] font-semibold ${subCls}`}>{sub}</span>}
      {children}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--r-control)] bg-[var(--surface-high)] ${className}`}>
      <motion.div
        aria-hidden
        className="absolute inset-y-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.6),transparent)]"
        initial={{ x: '-100%' }}
        animate={{ x: '220%' }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

/** Empty state in the Edera language: the mark on soft paper. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-6 py-10 text-center">
      <div className="well relative mb-5 grid h-[96px] w-[150px] place-items-center rounded-[var(--r-card)]">
        <Mark size={48} />
      </div>
      <p className="grot text-[22px]">{title}</p>
      <p className="mt-1.5 max-w-[30ch] text-[15px] text-text-2">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
