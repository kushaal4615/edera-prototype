import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, ListChecks } from 'lucide-react'
import { F } from '../data/featureIndex'
import { SCREEN_FEATURES } from '../data/screenFeatures'
import type { ScreenId } from '../lib/navigation'
import { spring } from '../motion/springs'

export const PANEL_W = 300
export const PANEL_W_COLLAPSED = 44
export const PANEL_GAP = 20
export const CREDIT_ZONE = 84

/* Viewer chrome: what the open screen demonstrates, from the requirements
   document. Floats over the stage's right edge; never a flex sibling. */
export function FeaturePanel({ screen, open, onToggle }: { screen: ScreenId; open: boolean; onToggle: () => void }) {
  const entry = SCREEN_FEATURES[screen]
  return (
    <motion.aside
      aria-label="Features on this screen"
      className="glass absolute right-5 top-5 z-[6] flex flex-col overflow-hidden rounded-[20px]"
      style={{ maxHeight: `calc(100% - ${CREDIT_ZONE + 20}px)` }}
      animate={{ width: open ? PANEL_W : PANEL_W_COLLAPSED }}
      transition={spring.frame}
    >
      <div className="flex shrink-0 items-center gap-2 p-1.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? 'Collapse feature panel' : 'Expand feature panel'}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-on-ink"
        >
          <motion.span animate={{ rotate: open ? 0 : 180 }} transition={spring.ui} className="grid place-items-center">
            <ChevronRight size={16} strokeWidth={2.6} />
          </motion.span>
        </button>
        {open && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <ListChecks size={14} className="text-text-2" aria-hidden />
            <span className="label text-text-2">Features on this screen</span>
          </span>
        )}
      </div>
      {!open && (
        <div className="flex flex-1 items-start justify-center pb-3 pt-1">
          <span className="label text-text-2 [writing-mode:vertical-rl]">Features · {entry.features.length}</span>
        </div>
      )}
      {open && (
        <div className="scroll-y min-h-0 flex-1 px-4 pb-4 pt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0, transition: spring.ui }}
              exit={{ opacity: 0, x: -10, transition: { duration: 0.12 } }}
            >
              <p className="meta uppercase tracking-[0.12em] text-[var(--accent-text)]">{entry.persona}</p>
              <h2 className="grot mt-1 text-[28px] leading-[0.95]">{entry.title}</h2>
              <p className="mt-1.5 text-[12.5px] font-medium text-text-2">Requirements module: {entry.module}</p>
              <motion.ol
                className="mt-4 flex flex-col gap-2.5"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } } }}
              >
                {entry.features.map((k, i) => (
                  <motion.li
                    key={k}
                    className="flex gap-2.5"
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: spring.ui } }}
                  >
                    <span className="num mt-[1px] grid h-[20px] w-[20px] shrink-0 place-items-center rounded-[6px] bg-accent-soft text-[11px] font-bold text-[var(--on-accent-soft)]">{i + 1}</span>
                    <span className="text-[12.5px] leading-[1.4] text-text">{F[k]}</span>
                  </motion.li>
                ))}
              </motion.ol>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.aside>
  )
}
