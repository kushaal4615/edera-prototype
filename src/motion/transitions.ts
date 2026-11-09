import type { Variants } from 'framer-motion'
import { easeOut, spring } from './springs'

/* List entrances: mount-triggered (whileInView does not see a scaled
   frame's scroll root), always resolving to opacity 1. */
export const listParent: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.06, staggerChildren: 0.04 } },
}

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOut } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
}

/* Screen push: direction-aware, exit faster than enter */
export const screenVariants: Variants = {
  initial: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 28 : -28 }),
  enter: { opacity: 1, x: 0, transition: { ...spring.page, opacity: { duration: 0.18 } } },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -18 : 18, transition: { duration: 0.14, ease: easeOut } }),
}

export const reducedScreenVariants: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}
