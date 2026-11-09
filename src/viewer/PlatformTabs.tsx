import { motion } from 'framer-motion'
import { ListChecks, Smartphone, ClipboardList, Store, PanelsTopLeft, type LucideIcon } from 'lucide-react'
import { PLATFORMS, type Platform, type View } from '../lib/navigation'
import { spring } from '../motion/springs'

/* The platform pill: one entry per platform, then the Full Feature List. */
const ICON: Record<Platform, LucideIcon> = { app: Smartphone, pro: ClipboardList, vendor: Store, admin: PanelsTopLeft }
export function PlatformTabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const items: { id: View; label: string; icon: typeof ListChecks }[] = [
    ...PLATFORMS.map((p) => ({ id: p.id as View, label: p.label, icon: ICON[p.id] })),
  ]
  return (
    <nav aria-label="Prototype platforms" className="glass flex items-center gap-1 rounded-full p-1.5">
      {items.map((it) => {
        const on = view === it.id
        const Icon = it.icon
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            aria-current={on ? 'page' : undefined}
            className="relative flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[14px] font-bold"
          >
            {on && <motion.span layoutId="pill-active" className="absolute inset-0 -z-10 rounded-full bg-accent" transition={spring.frame} />}
            <Icon size={16} strokeWidth={2.2} className={`relative z-10 ${on ? 'text-on-accent' : 'text-text-2'}`} aria-hidden />
            <span className={`relative z-10 ${on ? 'text-on-accent' : 'text-text'}`}>{it.label}</span>
          </button>
        )
      })}
      <span aria-hidden className="mx-1.5 h-6 w-px bg-[var(--rule-strong)]" />
      <button
        type="button"
        onClick={() => onChange('features')}
        aria-current={view === 'features' ? 'page' : undefined}
        className={`relative flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold ${view === 'features' ? '' : 'ring-1 ring-inset ring-[var(--accent-text)]'}`}
      >
        {view === 'features' && <motion.span layoutId="pill-active" className="absolute inset-0 -z-10 rounded-full bg-accent" transition={spring.frame} />}
        <ListChecks size={16} strokeWidth={2.2} className={`relative z-10 ${view === 'features' ? 'text-on-accent' : 'text-text'}`} aria-hidden />
        <span className={`meta relative z-10 text-[12.5px] ${view === 'features' ? 'text-on-accent' : 'text-text'}`}>Full Feature List</span>
      </button>
    </nav>
  )
}
