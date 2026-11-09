import { motion } from 'framer-motion'
import { spring } from '../motion/springs'

/* Segmented control. Inside screens the active pill pops with scale +
   opacity; layoutId is reserved for viewer chrome only. */

export function Segmented<T extends string>({ items, value, onChange, tone = 'ink', size = 'md', full = false }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (id: T) => void; tone?: 'ink' | 'accent' | 'paper'; size?: 'sm' | 'md'; full?: boolean }) {
  const active = tone === 'paper' ? 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]' : tone === 'ink' ? 'bg-ink text-on-ink' : 'bg-accent text-on-accent'
  return (
    <div role="tablist" className={`flex gap-1 well rounded-full p-1 ${full ? 'w-full' : 'w-max'}`}>
      {items.map((it) => {
        const on = it.id === value
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => onChange(it.id)}
            className={`relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-extrabold uppercase tracking-[0.06em] ${size === 'sm' ? 'h-8 px-3 text-[11px]' : 'h-9 px-4 text-[12px]'} ${full ? 'flex-1' : ''}`}
          >
            {on && (
              <motion.span
                aria-hidden
                className={`absolute inset-0 -z-0 rounded-full ${active}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring.ui}
              />
            )}
            <span className={`relative z-10 ${on ? (tone === 'paper' ? 'text-text' : tone === 'ink' ? 'text-on-ink' : 'text-on-accent') : 'text-text-2'}`}>{it.label}</span>
            {it.count !== undefined && (
              <span className={`num relative z-10 rounded-full px-1.5 text-[11px] ${on ? (tone === 'paper' ? 'bg-[var(--surface-high)] text-text' : 'bg-[rgb(255_255_255/0.2)] text-white') : 'bg-[var(--surface)] text-text'}`}>
                {it.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
