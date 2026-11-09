import { AnimatePresence, motion } from 'framer-motion'
import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { BROWSER_FRAME, MacBookBrowser } from '../frames/MacBookBrowser'
import { IPhone16Pro, PHONE_FRAME } from '../frames/IPhone16Pro'
import { NavContext, PLATFORMS, domainOf, frameOf, hashToRoute, platformOf, screenToHash, type NavApi, type Platform, type ScreenId, type ToastTone, type View } from '../lib/navigation'
import { SCREENS } from '../lib/registry'
import { spring } from '../motion/springs'
import { reducedScreenVariants, screenVariants } from '../motion/transitions'
import { useReducedMotion } from '../motion/useReducedMotion'
import { setScreen, track } from '../lib/tracker'
import { getSession } from '../lib/store'
import { FeaturePanel, PANEL_GAP, PANEL_W, PANEL_W_COLLAPSED } from './FeaturePanel'
import { FullFeatureList } from './FullFeatureList'
import { PlatformTabs } from './PlatformTabs'
import { PresenterCredit } from './PresenterCredit'
import { MobileViewer } from './MobileViewer'
import { useViewerMode } from './useViewerMode'

const PAD = 28

type Stacks = Record<Platform, ScreenId[]>

const ENTRY: Record<Platform, ScreenId> = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.entry])) as Record<Platform, ScreenId>

function initialState(): { view: View; stacks: Stacks } {
  const stacks = Object.fromEntries(PLATFORMS.map((p) => [p.id, [p.entry]])) as Stacks
  const route = typeof window !== 'undefined' ? hashToRoute(window.location.hash) : null
  if (!route) return { view: 'app', stacks }
  if (route.view === 'features') return { view: 'features', stacks }
  if (route.screen) {
    const p = platformOf(route.screen)
    stacks[p] = route.screen === ENTRY[p] ? [route.screen] : [ENTRY[p], route.screen]
  }
  return { view: route.view, stacks }
}

function readPanelOpen(): boolean {
  try {
    return sessionStorage.getItem('edera.panel') !== 'closed'
  } catch {
    return true
  }
}

export function PrototypeViewer() {
  const init = useMemo(initialState, [])
  const [view, setView] = useState<View>(init.view)
  const [stacks, setStacks] = useState<Stacks>(init.stacks)
  const [dir, setDir] = useState(1)
  const [panelOpen, setPanelOpen] = useState(readPanelOpen)
  const [toastState, setToast] = useState<{ id: number; message: string; tone: ToastTone; platform: Platform } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const reduce = useReducedMotion()
  const mode = useViewerMode()

  const lastPlatform = useRef<Platform>(view === 'features' ? 'app' : view)
  if (view !== 'features') lastPlatform.current = view
  const platform: Platform = view === 'features' ? lastPlatform.current : view
  const stack = stacks[platform]
  const current = stack[stack.length - 1]
  const frameKind = frameOf(platform)
  const frameW = frameKind === 'phone' ? PHONE_FRAME.w : BROWSER_FRAME.w
  const frameH = frameKind === 'phone' ? PHONE_FRAME.h : BROWSER_FRAME.h

  /* journey logging: one view event per visible screen (overlays are added by Sheet.tsx) */
  useEffect(() => {
    if (view === 'features') return setScreen('viewer:features', 'viewer')
    const [p, name] = current.split('.')
    const s = getSession()
    const detail = current === 'app.vendor' ? `:${s.viewingVendor}` : current === 'app.thread' ? `:${s.viewingThread}` : current === 'pro.event' ? `:${s.viewingEvent}` : current === 'vendor.request' ? `:${s.viewingRequest}` : current === 'admin.verification' ? `:${s.viewingCase}` : ''
    setScreen(`${p}:${name}${detail}`, p)
  }, [view, current])

  /* hash sync */
  useEffect(() => {
    const hash = view === 'features' ? '#/features' : screenToHash(current)
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [view, current])

  useEffect(() => {
    const onHash = () => {
      const r = hashToRoute(window.location.hash)
      if (!r) return
      if (r.view === 'features') return setView('features')
      if (r.screen) {
        const p = platformOf(r.screen)
        setStacks((s) => (s[p][s[p].length - 1] === r.screen ? s : { ...s, [p]: [...s[p], r.screen!] }))
        setView(p)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'neutral') => {
      window.clearTimeout(toastTimer.current)
      setToast({ id: Date.now(), message, tone, platform })
      toastTimer.current = window.setTimeout(() => setToast(null), 2600)
    },
    [platform],
  )

  const nav: NavApi = useMemo(
    () => ({
      current,
      canGoBack: stack.length > 1,
      navigate: (id: ScreenId) => {
        if (!(id in SCREENS)) {
          console.error(`[NAV] navigate() to unregistered screen "${id}"`)
          return
        }
        const p = platformOf(id)
        setDir(1)
        setStacks((s) => {
          const st = s[p]
          if (st[st.length - 1] === id) return s
          return { ...s, [p]: [...st, id] }
        })
        if (p !== view) setView(p)
      },
      back: () => {
        setDir(-1)
        setStacks((s) => (s[platform].length > 1 ? { ...s, [platform]: s[platform].slice(0, -1) } : s))
      },
      reset: (id: ScreenId) => {
        const p = platformOf(id)
        setDir(stacks[p].includes(id) ? -1 : 1)
        setStacks((s) => ({ ...s, [p]: [id] }))
        if (p !== view) setView(p)
      },
      toast,
    }),
    [current, stack.length, platform, view, stacks, toast],
  )

  const jumpTo = useCallback((id: ScreenId) => {
    track('open_feature_from_list', id)
    const p = platformOf(id)
    setDir(1)
    setStacks((s) => {
      const st = s[p]
      if (st[st.length - 1] === id) return s
      return { ...s, [p]: id === ENTRY[p] ? [id] : [ENTRY[p], id] }
    })
    setView(p)
  }, [])

  const togglePanel = () =>
    setPanelOpen((o) => {
      track(o ? 'collapse_feature_panel' : 'expand_feature_panel', current)
      try {
        sessionStorage.setItem('edera.panel', o ? 'closed' : 'open')
      } catch {
        /* storage blocked: panel state stays per-render */
      }
      return !o
    })

  /* ── fit-to-stage, centred on the window (see prompt: the centring rule) ── */
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const panelW = (panelOpen ? PANEL_W : PANEL_W_COLLAPSED) + PANEL_GAP * 2
  const creditClearance = frameKind === 'browser' ? 60 : 0

  useLayoutEffect(() => {
    if (view === 'features') return
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      const full = Math.min(1, (height - PAD * 2 - creditClearance) / frameH, (width - PAD * 2) / frameW)
      const rightEdge = width / 2 + (frameW * full) / 2
      const panelLeft = width - panelW
      if (rightEdge <= panelLeft) {
        if (Number.isFinite(full) && full > 0) {
          setScale(full)
          setOffsetX(0)
        }
        return
      }
      const avail = panelLeft
      const next = Math.min(1, (height - PAD * 2 - creditClearance) / frameH, (avail - PAD * 2) / frameW)
      if (Number.isFinite(next) && next > 0) {
        setScale(next)
        setOffsetX(-(width - avail) / 2)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [frameW, frameH, creditClearance, panelW, view, mode])

  const def = SCREENS[current]
  const ScreenComponent = def.component
  const island = toastState && frameOf(toastState.platform) === 'phone' ? toastState : null

  const screenNode = (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      <motion.div
        key={current}
        custom={dir}
        variants={reduce ? reducedScreenVariants : screenVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="absolute inset-0"
      >
        <ScreenBoundary id={current}>
          <BlankGuard id={current}>
            <ScreenComponent />
          </BlankGuard>
        </ScreenBoundary>
      </motion.div>
    </AnimatePresence>
  )

  if (mode === 'phone')
    return (
      <NavContext.Provider value={nav}>
        <MobileViewer
          view={view}
          platform={platform}
          current={current}
          screenNode={screenNode}
          onChangeView={(v) => setView(v)}
          onJump={jumpTo}
          toast={toastState}
        />
      </NavContext.Provider>
    )

  return (
    <NavContext.Provider value={nav}>
      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-stage">
        <div className="relative z-[7] flex shrink-0 justify-center pt-4">
          <PlatformTabs view={view} onChange={(v) => { track('switch_platform', v); setView(v) }} />
        </div>

        <div ref={stageRef} className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_55%_at_50%_45%,rgb(201_151_63/0.16),transparent_70%)]" />
          <div aria-hidden className="grain" />

          <AnimatePresence mode="wait" initial={false}>
            {view === 'features' ? (
              <FullFeatureList key="features" onJump={jumpTo} />
            ) : (
              <motion.div
                key={platform}
                data-stage-frame
                initial={{ opacity: 0, scale: scale * 0.94 }}
                animate={{ opacity: 1, scale, x: offsetX }}
                exit={{ opacity: 0, scale: scale * 0.94, transition: { duration: 0.16 } }}
                transition={spring.frame}
                style={{ width: frameW, height: frameH, marginBottom: creditClearance, transformOrigin: 'center' }}
                className="relative shrink-0"
              >
                {scale > 0 &&
                  (frameKind === 'phone' ? (
                    <IPhone16Pro statusTone={def.statusTone ?? 'light'} island={island}>
                      {screenNode}
                    </IPhone16Pro>
                  ) : (
                    <MacBookBrowser path={def.path ?? '/'} domain={domainOf(platform)} tab="e-dera · Admin">
                      {screenNode}
                      <AdminToast toast={toastState && frameOf(toastState.platform) === 'browser' ? toastState : null} />
                    </MacBookBrowser>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>

          {view !== 'features' && <FeaturePanel screen={current} open={panelOpen} onToggle={togglePanel} />}
          <PresenterCredit className="absolute bottom-4 right-5" />
        </div>
      </div>
    </NavContext.Provider>
  )
}

function AdminToast({ toast }: { toast: { id: number; message: string; tone: ToastTone } | null }) {
  const color: Record<ToastTone, string> = { neutral: '#F7F2E8', accent: '#4CA58C', warn: '#E6C27C', danger: '#F08A96', info: '#C9B3E6' }
  return (
    <div aria-live="polite" className="pointer-events-none absolute bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
            transition={spring.ui}
            className="flex items-center gap-3 rounded-full bg-ink py-3 pl-4 pr-5 text-[14px] font-semibold text-on-ink shadow-[var(--shadow-floating)]"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color[toast.tone] }} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* A screen that throws renders a visible red panel with its ID. */
class ScreenBoundary extends Component<{ id: ScreenId; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SCREEN ERROR] ${this.props.id}`, error, info)
  }
  componentDidUpdate(prev: { id: ScreenId }) {
    if (prev.id !== this.props.id && this.state.error) this.setState({ error: null })
  }
  render() {
    if (this.state.error)
      return (
        <div className="absolute inset-0 grid place-items-center bg-[#FDEEEE] p-6 text-center">
          <div>
            <p className="label text-[#9A2F40]">Screen failed to render</p>
            <p className="meta mt-2 text-[#123C35]">{this.props.id}</p>
            <p className="mt-2 text-[13px] text-[#4F655F]">{this.state.error.message}</p>
          </div>
        </div>
      )
    return this.props.children
  }
}

/* Dev-only emptiness assertion. */
function BlankGuard({ id, children }: { id: ScreenId; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const t = window.setTimeout(() => {
      if (ref.current && ref.current.scrollHeight < 40) console.error(`[BLANK SCREEN] ${id} rendered empty`)
    }, 400)
    return () => window.clearTimeout(t)
  }, [id])
  return (
    <div ref={ref} className="absolute inset-0">
      {children}
    </div>
  )
}
