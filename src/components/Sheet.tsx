import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { overlayClosed, overlayOpened } from '../lib/tracker'
import { useViewerMode } from '../viewer/useViewerMode'
import { spring } from '../motion/springs'
import { useReducedMotion } from '../motion/useReducedMotion'
import { IconButton } from './Button'

/* Journey logging: an open overlay is part of the screen name ("app:vendor+send-a-booking-request"). */
function useOverlayLog(open: boolean, name: string) {
  useEffect(() => {
    if (!open) return
    overlayOpened(name)
    return () => overlayClosed(name)
  }, [open, name])
}

/* Overlays. Each one unmounts on exit (AnimatePresence), so nothing
   invisible is ever left catching clicks. Z scale: sheet/drawer 40,
   modal 50. */

/** Bottom sheet inside the phone. Drag down or flick to dismiss; rubber-bands upward. */
export function BottomSheet({ open, onClose, title, children, tall = false }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; tall?: boolean }) {
  const reduce = useReducedMotion()
  useOverlayLog(open, title ?? 'sheet')
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 520) onClose()
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[rgb(11_38_34/0.4)]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[28px] bg-[var(--surface)] shadow-[var(--shadow-floating)] ${tall ? 'max-h-[82%]' : 'max-h-[70%]'}`}
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%', transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
            transition={spring.sheet}
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.06, bottom: 0.7 }}
            onDragEnd={onDragEnd}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-2.5">
              <span className="h-[5px] w-10 rounded-full bg-[var(--paper-400)]" />
            </div>
            {title && (
              <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-1">
                <h3 className="grot text-[22px]">{title}</h3>
                <IconButton icon={X} label="Close" size={36} tone="plain" onClick={onClose} />
              </div>
            )}
            <div className="scroll-y min-h-0 flex-1 px-5 pb-[42px]">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Admin overlays render at the console root (AdminShell's [data-admin-root]),
   not inside the scrolling <main>, so they always cover the visible frame. */
function AdminLayer({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<Element | null>(null)
  useEffect(() => {
    setHost(document.querySelector('[data-stage-frame] [data-admin-root]') ?? document.querySelector('[data-admin-root]'))
  }, [])
  return host ? createPortal(children, host) : <>{children}</>
}

/** Centred modal for the admin console. */
export function Modal({ open, onClose, title, children, width = 520 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  useOverlayLog(open, title)
  const phone = useViewerMode() === 'phone'
  if (phone) return <AdminLayer><PhoneOverlay open={open} onClose={onClose} title={title}>{children}</PhoneOverlay></AdminLayer>
  return (
    <AdminLayer>
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-50 grid place-items-center p-8">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[rgb(11_38_34/0.38)]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative rounded-[var(--r-container)] bg-[var(--surface)] p-7 shadow-[var(--shadow-floating)]"
            style={{ width }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
            transition={spring.ui}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="grot text-[34px]">{title}</h3>
              <IconButton icon={X} label="Close" size={36} onClick={onClose} />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </AdminLayer>
  )
}

/** Right-side inspector drawer for the admin console. Enters and exits the same edge. */
export function Drawer({ open, onClose, title, children, width = 440 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  useOverlayLog(open, title)
  const phone = useViewerMode() === 'phone'
  if (phone) return <AdminLayer><PhoneOverlay open={open} onClose={onClose} title={title} tall>{children}</PhoneOverlay></AdminLayer>
  return (
    <AdminLayer>
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[rgb(11_38_34/0.26)]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          />
          <motion.aside
            role="dialog"
            aria-label={title}
            className="absolute bottom-0 right-0 top-0 flex flex-col bg-[var(--surface)] shadow-[var(--shadow-floating)]"
            style={{ width }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%', transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
            transition={spring.sheet}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--rule)] px-6 py-4">
              <h3 className="grot text-[22px]">{title}</h3>
              <IconButton icon={X} label="Close" size={36} onClick={onClose} />
            </div>
            <div className="scroll-y min-h-0 flex-1 p-6">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
    </AdminLayer>
  )
}

/** Phone-browser view: admin modals and drawers become draggable bottom sheets (55% / 92%). */
function PhoneOverlay({ open, onClose, title, children, tall = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; tall?: boolean }) {
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 550) onClose()
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-50">
          <motion.button type="button" aria-label="Close" className="absolute inset-0 bg-[rgb(11_38_34/0.5)]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[26px] bg-[var(--surface)] shadow-[var(--shadow-floating)] ${tall ? 'h-[92%]' : 'max-h-[92%] min-h-[55%]'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
            transition={spring.sheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDragEnd={onDragEnd}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-2.5">
              <span className="h-[5px] w-10 rounded-full bg-[var(--paper-400)]" />
            </div>
            <div className="flex shrink-0 items-center justify-between px-5 pb-2">
              <h3 className="grot text-[22px]">{title}</h3>
              <IconButton icon={X} label="Close" size={44} onClick={onClose} />
            </div>
            <div className="scroll-y min-h-0 flex-1 px-5" style={{ overscrollBehavior: 'contain', paddingBottom: 'calc(var(--safe-bottom, 0px) + 20px)' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
