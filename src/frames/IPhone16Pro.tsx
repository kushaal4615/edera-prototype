import { AnimatePresence, motion } from 'framer-motion'
import { BatteryFull, Signal, Wifi } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ToastTone } from '../lib/navigation'
import { spring } from '../motion/springs'

/* iPhone 16 Pro, drawn in CSS. Logical screen 393 × 852, titanium
   bezel, live status bar, a Dynamic Island that expands to carry the
   app's toasts, and the home indicator. All chrome is pointer-events-none. */

export const PHONE = { screenW: 393, screenH: 852, bezel: 13 }
export const PHONE_FRAME = { w: PHONE.screenW + PHONE.bezel * 2, h: PHONE.screenH + PHONE.bezel * 2 }

const TONE_DOT: Record<ToastTone, string> = {
  neutral: '#F7F2E8',
  accent: '#4CA58C',
  warn: '#E6C27C',
  danger: '#F08A96',
  info: '#C9B3E6',
}

export function IPhone16Pro({ children, statusTone = 'dark', island }: { children: ReactNode; statusTone?: 'dark' | 'light'; island?: { id: number; message: string; tone: ToastTone } | null }) {
  const fg = statusTone === 'light' ? '#FFFFFF' : '#11131A'
  return (
    <div
      className="relative"
      style={{
        width: PHONE_FRAME.w,
        height: PHONE_FRAME.h,
        borderRadius: 68,
        padding: PHONE.bezel,
        background: 'linear-gradient(145deg, #8E8A84 0%, #5E5B57 18%, #3A3836 50%, #605D59 82%, #9A968F 100%)',
        boxShadow:
          '0 0 0 1px rgb(0 0 0 / 0.35), inset 0 0 0 1.5px rgb(255 255 255 / 0.22), 0 2px 4px rgb(0 0 0 / 0.08), 0 30px 60px -20px rgb(17 19 26 / 0.45), 0 60px 120px -40px rgb(17 19 26 / 0.35)',
      }}
    >
      {/* side buttons */}
      <span aria-hidden className="pointer-events-none absolute -left-[3px] top-[150px] h-[34px] w-[4px] rounded-l-[2px] bg-[#55524E]" />
      <span aria-hidden className="pointer-events-none absolute -left-[3px] top-[210px] h-[62px] w-[4px] rounded-l-[2px] bg-[#55524E]" />
      <span aria-hidden className="pointer-events-none absolute -left-[3px] top-[284px] h-[62px] w-[4px] rounded-l-[2px] bg-[#55524E]" />
      <span aria-hidden className="pointer-events-none absolute -right-[3px] top-[236px] h-[96px] w-[4px] rounded-r-[2px] bg-[#55524E]" />

      <div className="relative h-full w-full overflow-hidden bg-black" style={{ borderRadius: 55, boxShadow: '0 0 0 4px #0b0b0d' }}>
        {/* the app */}
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 55 }}>
          {children}
        </div>

        {/* status bar */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[70] flex h-[54px] items-center justify-between px-[34px] pt-[6px]" style={{ color: fg }}>
          <span className="w-[72px] text-center text-[16px] font-semibold tracking-[-0.01em]" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
            9:41
          </span>
          <span className="flex w-[78px] items-center justify-end gap-[5px]">
            <Signal size={17} strokeWidth={2.6} />
            <Wifi size={17} strokeWidth={2.6} />
            <BatteryFull size={25} strokeWidth={1.8} />
          </span>
        </div>

        {/* Dynamic Island: idle pill, expands to carry toasts */}
        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[11px] z-[80] flex justify-center">
          <motion.div
            layout
            transition={spring.pop}
            className="flex items-center overflow-hidden bg-black text-white"
            style={{ borderRadius: 22, minHeight: 37 }}
            animate={{ width: island ? 352 : 125, height: island ? 64 : 37 }}
          >
            <AnimatePresence mode="wait">
              {island && (
                <motion.div
                  key={island.id}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)', transition: { delay: 0.12, duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="flex w-full items-center gap-3 px-4"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TONE_DOT[island.tone] }} />
                  <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{island.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* home indicator */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[8px] z-[70] flex justify-center">
          <span className="h-[5px] w-[134px] rounded-full" style={{ background: statusTone === 'light' ? 'rgb(255 255 255 / 0.85)' : 'rgb(17 19 26 / 0.85)' }} />
        </div>

        {/* glass sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[90]" style={{ borderRadius: 55, background: 'linear-gradient(125deg, rgb(255 255 255 / 0.05) 0%, transparent 30%)' }} />
      </div>
    </div>
  )
}
