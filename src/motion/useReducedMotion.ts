import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/** True when the viewer asked for less motion. Content must render fully visible immediately. */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false
}
