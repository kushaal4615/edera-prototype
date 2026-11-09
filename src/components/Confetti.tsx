import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useReducedMotion } from '../motion/useReducedMotion'

/* One-shot confetti in the Edera colours. Rare moments only:
   a booking confirmed, invites sent, a verification approved. */

const COLORS = ['#C9973F', '#1C6B5A', '#B2384A', '#123C35', '#E6C27C']

export function Confetti({ count = 46, origin = 0.35 }: { count?: number; origin?: number }) {
  const reduce = useReducedMotion()
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.3
        const dist = 120 + ((i * 37) % 140)
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.7 + 260,
          r: ((i * 53) % 360) - 180,
          c: COLORS[i % COLORS.length],
          w: 5 + (i % 3) * 2,
          h: 9 + (i % 4) * 2,
          d: (i % 7) * 0.025,
        }
      }),
    [count],
  )
  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute left-1/2 block rounded-[2px]"
          style={{ top: `${origin * 100}%`, width: b.w, height: b.h, background: b.c }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: b.y, rotate: b.r * 3, opacity: 0 }}
          transition={{ duration: 1.6, delay: b.d, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}
