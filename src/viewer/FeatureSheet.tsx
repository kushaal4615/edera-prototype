import { AnimatePresence, motion, useAnimationControls, useDragControls, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { F } from '../data/featureIndex'
import { SCREEN_FEATURES } from '../data/screenFeatures'
import type { ScreenId } from '../lib/navigation'
import { spring } from '../motion/springs'

/* Phone-mode viewer sheets. Draggable, snap at 55% and 92% of the screen,
   flick down to close. z 80 while open. The presenter credit lives in
   every sheet's footer: it never floats over the app on a phone. */

export function PhoneSheet({ open, onClose, title, children, tall = false, label }: { open: boolean; onClose: () => void; title: string; children: ReactNode; tall?: boolean; label: string }) {
  const controls = useAnimationControls()
  /* drag only from the handle and the title row: a tap on a list row must stay a tap (iOS swallowed row taps as tiny drags) */
  const drag = useDragControls()
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const low = vh * (1 - (tall ? 0.92 : 0.55))
  const high = vh * 0.08

  useEffect(() => {
    if (open) controls.start({ y: low, transition: spring.sheet })
  }, [open, low, controls])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const y = info.point.y
    if (info.velocity.y > 600 || y > vh * 0.82) return onClose()
    if (info.velocity.y < -400 || y < vh * 0.3) return controls.start({ y: high, transition: spring.sheet })
    controls.start({ y: low, transition: spring.sheet })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[rgb(11_38_34/0.5)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="glass absolute inset-x-0 top-0 flex flex-col rounded-t-[26px]"
            style={{ height: vh - high }}
            initial={{ y: vh }}
            animate={controls}
            exit={{ y: vh, transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: high, bottom: vh }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="flex shrink-0 cursor-grab justify-center pb-1 pt-2.5" onPointerDown={(e) => drag.start(e)} style={{ touchAction: 'none' }}>
              <span className="h-[5px] w-10 rounded-full bg-[var(--paper-400)]" />
            </div>
            <div className="flex shrink-0 items-center justify-between px-5 pb-2" onPointerDown={(e) => drag.start(e)} style={{ touchAction: 'none' }}>
              <h2 className="grot text-[22px]">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--surface-high)]">
                <X size={20} />
              </button>
            </div>
            <div className="scroll-y min-h-0 flex-1 px-5" style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }} onPointerDownCapture={(e) => e.stopPropagation()}>
              {children}
              <PresenterLine />
              <div style={{ height: `calc(${tall ? 0 : vh * 0.37}px + max(env(safe-area-inset-bottom), 12px))` }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function PresenterLine() {
  return (
    <div className="mt-6 flex items-center gap-3 border-t border-[var(--rule)] pt-4 pb-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-black text-on-accent">K</span>
      <span className="text-[12.5px] leading-snug">
        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-text-2">Presented by</span>
        <span className="font-bold text-text">Kushaal Khanna</span>
        <span className="text-text-2"> · Business Development Manager</span>
      </span>
    </div>
  )
}

/** The desktop feature panel's content, as a sheet body. */
export function FeatureSheetBody({ screen }: { screen: ScreenId }) {
  const entry = SCREEN_FEATURES[screen]
  return (
    <motion.div key={screen} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0, transition: spring.ui }}>
      <p className="meta uppercase tracking-[0.12em] text-[var(--accent-text)]">{entry.persona}</p>
      <h3 className="grot mt-1 text-[22px] leading-[1.05]">{entry.title}</h3>
      <p className="mt-1.5 text-[13px] font-medium text-text-2">Requirements module: {entry.module}</p>
      <motion.ol className="mt-4 flex flex-col gap-3" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}>
        {entry.features.map((k, i) => (
          <motion.li key={k} className="flex gap-3" variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: spring.ui } }}>
            <span className="num mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-accent-soft text-[12px] font-bold text-[var(--on-accent-soft)]">{i + 1}</span>
            <span className="text-[15px] leading-[1.4] text-text">{F[k]}</span>
          </motion.li>
        ))}
      </motion.ol>
    </motion.div>
  )
}
