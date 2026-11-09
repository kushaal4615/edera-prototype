import type { Transition } from 'framer-motion'

/* Crisp-snappy motion grammar: a grot clock, not a lava lamp.
   Critically damped by default; bounce only where a gesture threw it. */

export const spring = {
  /** buttons, chips, toggles */
  ui: { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 } as Transition,
  /** screen push / pop */
  page: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 } as Transition,
  /** bottom sheets: a little give because the user may have flicked it */
  sheet: { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 } as Transition,
  /** success moments, badge pops */
  pop: { type: 'spring', stiffness: 460, damping: 18, mass: 0.7 } as Transition,
  /** viewer chrome: platform switches */
  frame: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
} as const

export const tap = { scale: 0.96 }
export const tapSoft = { scale: 0.98 }

export const easeOut = [0.23, 1, 0.32, 1] as const
