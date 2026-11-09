import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, ListChecks, Smartphone, ClipboardList, Store, PanelsTopLeft, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { SCREEN_FEATURES } from '../data/screenFeatures'
import { PLATFORMS, frameOf, type Platform, type ScreenId, type ToastTone, type View } from '../lib/navigation'
import { track } from '../lib/tracker'
import { spring } from '../motion/springs'
import { FeatureSheetBody, PhoneSheet } from './FeatureSheet'
import { FullFeatureList } from './FullFeatureList'

/* PHONE-BROWSER VIEW (v5). The same screens, navigation and data as the
   desktop viewer, in a shell built for a real phone: no device frame, real
   safe areas, the app filling the screen, and the viewer chrome reduced to
   two thumb controls at the bottom (platform capsule left, Features button
   right) that sit above the app's tab bar or action dock. */

const TONE_DOT: Record<ToastTone, string> = { neutral: '#F7F2E8', accent: '#4CA58C', warn: '#E6C27C', danger: '#F08A96', info: '#C9B3E6' }
const ICON: Record<Platform, LucideIcon> = { app: Smartphone, pro: ClipboardList, vendor: Store, admin: PanelsTopLeft }

export function MobileViewer({
  view,
  platform,
  current,
  screenNode,
  onChangeView,
  onJump,
  toast,
}: {
  view: View
  platform: Platform
  current: ScreenId
  screenNode: ReactNode
  onChangeView: (v: View) => void
  onJump: (id: ScreenId) => void
  toast: { id: number; message: string; tone: ToastTone } | null
}) {
  const [platformsOpen, setPlatformsOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const scrollTimer = useRef<number | undefined>(undefined)
  const count = SCREEN_FEATURES[current].features.length
  const label = view === 'features' ? 'Full Feature List' : PLATFORMS.find((p) => p.id === platform)!.label

  /* the capsule shrinks to a dot while any in-app list is scrolling */
  useEffect(() => {
    const onScroll = () => {
      setScrolling(true)
      window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => setScrolling(false), 650)
    }
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.clearTimeout(scrollTimer.current)
    }
  }, [])

  const vars = {
    '--safe-top': 'max(env(safe-area-inset-top), 12px)',
    '--safe-bottom': 'max(env(safe-area-inset-bottom), 12px)',
    '--chrome-space': '60px',
  } as CSSProperties

  /* Sit just above whatever the screen has at the bottom (tab bar, CTA dock,
     admin tab bar). Measured from elements marked data-dock; when a screen has
     none, sit where a tab bar would be. */
  const [dockGap, setDockGap] = useState<number | null>(null)
  useEffect(() => {
    if (view === 'features') return setDockGap(null)
    const measure = () => {
      const docks = Array.from(document.querySelectorAll<HTMLElement>('[data-dock]')).filter((d) => d.getBoundingClientRect().height > 0)
      if (!docks.length) return setDockGap(null)
      const top = Math.min(...docks.map((d) => d.getBoundingClientRect().top))
      setDockGap(Math.max(0, window.innerHeight - top + 10))
    }
    const t1 = window.setTimeout(measure, 60)
    const t2 = window.setTimeout(measure, 420)
    window.addEventListener('resize', measure)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', measure)
    }
  }, [current, view, platform])
  const chromeBottom = dockGap !== null ? `${dockGap}px` : 'calc(max(env(safe-area-inset-bottom), 12px) + 64px + 12px)'

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--bg)] text-text" style={{ ...vars, height: '100dvh' }}>
      {view === 'features' ? (
        <div className="absolute inset-0">
          <FullFeatureList onJump={onJump} phone />
        </div>
      ) : (
        <div data-stage-frame data-phone-app className={`relative mx-auto h-full w-full ${frameOf(platform) === 'phone' ? 'max-w-[430px]' : 'max-w-[720px]'}`}>
          {screenNode}
        </div>
      )}

      {/* toasts: top, under the real status bar */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ top: 'calc(max(env(safe-area-inset-top), 12px) + 6px)' }}>
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, transition: { duration: 0.15 } }}
              transition={spring.ui}
              className="flex max-w-[420px] items-center gap-3 rounded-[18px] bg-ink px-4 py-3 text-[14px] font-semibold text-on-ink shadow-[var(--shadow-floating)]"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TONE_DOT[toast.tone] }} />
              <span className="line-clamp-2">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* chrome: platform capsule (left) and Features button (right), above the tab bar / dock */}
      <motion.div className="pointer-events-none fixed inset-x-0 z-[70] flex items-center justify-between px-3" initial={false} animate={{ bottom: chromeBottom }} transition={spring.ui}>
        <motion.button
          type="button"
          data-viewer-chrome
          onClick={() => {
            track('open_platform_sheet', label)
            setPlatformsOpen(true)
          }}
          aria-label={`Platform: ${label}. Switch platform`}
          className="glass pointer-events-auto flex h-11 items-center gap-2 overflow-hidden rounded-full text-[13px] font-bold"
          animate={{ width: scrolling ? 44 : 'auto', paddingLeft: scrolling ? 16 : 14, paddingRight: scrolling ? 16 : 12 }}
          transition={spring.ui}
          whileTap={{ scale: 0.95 }}
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent-text)]" />
          {!scrolling && (
            <>
              <span className="whitespace-nowrap">{label}</span>
              <ChevronUp size={15} strokeWidth={2.6} className="shrink-0 text-text-2" />
            </>
          )}
        </motion.button>
        {view !== 'features' && (
          <motion.button
            type="button"
            data-viewer-chrome
            onClick={() => {
              track('open_features_sheet', current)
              setFeaturesOpen(true)
            }}
            aria-label={`Features on this screen (${count})`}
            className="glass pointer-events-auto relative grid h-11 w-11 place-items-center rounded-full"
            whileTap={{ scale: 0.92 }}
          >
            <ListChecks size={19} strokeWidth={2.3} />
            <motion.span
              key={`${current}-${count}`}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={spring.pop}
              className="num absolute -right-1 -top-1 grid h-[20px] min-w-[20px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent"
            >
              {count}
            </motion.span>
          </motion.button>
        )}
      </motion.div>

      <PhoneSheet open={platformsOpen} onClose={() => setPlatformsOpen(false)} title="View" label="Switch platform">
        <ul className="flex flex-col gap-2">
          {[...PLATFORMS.map((p) => ({ id: p.id as View, name: p.label, sub: p.sub, icon: ICON[p.id] })), { id: 'features' as View, name: 'Full Feature List', sub: 'Every requirement, and the screen that shows it', icon: ListChecks }].map((it) => {
            const on = it.id === view
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => {
                    track('switch_platform', it.id)
                    onChangeView(it.id)
                    setPlatformsOpen(false)
                  }}
                  className={`flex min-h-[52px] w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left ${on ? 'bg-accent text-on-accent' : 'bg-[var(--surface-high)]'}`}
                >
                  <it.icon size={20} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-extrabold">{it.name}</span>
                    <span className={`block text-[13px] ${on ? 'text-[var(--on-accent-2)]' : 'text-text-2'}`}>{it.sub}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </PhoneSheet>

      <PhoneSheet open={featuresOpen} onClose={() => setFeaturesOpen(false)} title="Features on this screen" label="Features on this screen">
        <FeatureSheetBody screen={current} />
      </PhoneSheet>
    </div>
  )
}
