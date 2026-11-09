import { createContext, useContext } from 'react'

/* ─────────────────────────────────────────────────────────────
   The typed screen graph. Every screen the prototype can show is
   listed here. navigate() accepts only these IDs, so a typo or an
   unregistered screen fails the TypeScript build.
   ───────────────────────────────────────────────────────────── */

export const APP_SCREENS = [
  'app.welcome',
  'app.signin',
  'app.otp',
  'app.home',
  'app.event',
  'app.planner',
  'app.explore',
  'app.vendor',
  'app.booking',
  'app.bookings',
  'app.guests',
  'app.invite',
  'app.messages',
  'app.thread',
  'app.notifications',
  'app.profile',
] as const

export const PRO_SCREENS = [
  'pro.signin',
  'pro.home',
  'pro.events',
  'pro.event',
  'pro.calendar',
  'pro.vendors',
  'pro.requests',
  'pro.guests',
  'pro.checkin',
  'pro.verification',
  'pro.messages',
  'pro.profile',
] as const

export const VENDOR_SCREENS = [
  'vendor.signin',
  'vendor.home',
  'vendor.requests',
  'vendor.request',
  'vendor.calendar',
  'vendor.listings',
  'vendor.listing',
  'vendor.bookings',
  'vendor.reviews',
  'vendor.verification',
  'vendor.profile',
] as const

export const ADMIN_SCREENS = [
  'admin.signin',
  'admin.overview',
  'admin.verification',
  'admin.users',
  'admin.marketplace',
  'admin.bookings',
  'admin.reviews',
  'admin.notifications',
  'admin.reports',
  'admin.settings',
] as const

export type AppScreenId = (typeof APP_SCREENS)[number]
export type ProScreenId = (typeof PRO_SCREENS)[number]
export type VendorScreenId = (typeof VENDOR_SCREENS)[number]
export type AdminScreenId = (typeof ADMIN_SCREENS)[number]
/** any screen that renders inside the iPhone frame */
export type MobileScreenId = AppScreenId | ProScreenId | VendorScreenId
/** any screen that renders inside the browser frame */
export type ConsoleScreenId = AdminScreenId
export type ScreenId = AppScreenId | ProScreenId | VendorScreenId | AdminScreenId

export type Platform = 'app' | 'pro' | 'vendor' | 'admin'
export type View = Platform | 'features'

export const ALL_SCREENS: readonly ScreenId[] = [...APP_SCREENS, ...PRO_SCREENS, ...VENDOR_SCREENS, ...ADMIN_SCREENS]

export const PLATFORMS: { id: Platform; label: string; sub: string; entry: ScreenId; frame: 'phone' | 'browser'; domain: string }[] = [
  { id: 'app', label: 'Client App', sub: 'Adaeze: her event, her planner, the marketplace, guests and invites', entry: 'app.welcome', frame: 'phone', domain: 'app.useedera.com' },
  { id: 'pro', label: 'Planner App', sub: 'Tunde: events, vendors, requests, and the door on the night', entry: 'pro.signin', frame: 'phone', domain: 'pro.useedera.com' },
  { id: 'vendor', label: 'Vendor App', sub: 'Bola: requests, availability, listings, reviews and verification', entry: 'vendor.signin', frame: 'phone', domain: 'pro.useedera.com' },
  { id: 'admin', label: 'Edera Admin', sub: 'Dave: verification, users, listings, notifications and the commission switch', entry: 'admin.signin', frame: 'browser', domain: 'admin.useedera.com' },
]

export function platformOf(id: ScreenId): Platform {
  return id.split('.')[0] as Platform
}

export const frameOf = (p: Platform) => PLATFORMS.find((x) => x.id === p)!.frame
export const domainOf = (p: Platform) => PLATFORMS.find((x) => x.id === p)!.domain

export function isScreenId(value: string): value is ScreenId {
  return (ALL_SCREENS as readonly string[]).includes(value)
}

/* Hash form: #/app/home · #/admin/users · #/features */
export function screenToHash(id: ScreenId): string {
  const [p, s] = id.split('.')
  return `#/${p}/${s}`
}

export function hashToRoute(hash: string): { view: View; screen?: ScreenId } | null {
  const clean = hash.replace(/^#\/?/, '')
  if (!clean) return null
  if (clean === 'features') return { view: 'features' }
  const [p, s] = clean.split('/')
  const candidate = `${p}.${s}`
  if (isScreenId(candidate)) return { view: platformOf(candidate), screen: candidate }
  if (import.meta.env.DEV) console.error(`[NAV] unknown hash route "${hash}"`)
  return null
}

/* ─── Runtime navigation API, provided by the viewer ─── */

export type ToastTone = 'neutral' | 'accent' | 'warn' | 'danger' | 'info'

export type NavApi = {
  current: ScreenId
  /** push a screen onto its platform's stack (switches platform if needed) */
  navigate: (id: ScreenId) => void
  /** pop the current platform's stack */
  back: () => void
  /** replace the whole stack of the screen's platform with [id] (tab bars, sign-out) */
  reset: (id: ScreenId) => void
  canGoBack: boolean
  toast: (message: string, tone?: ToastTone) => void
}

export const NavContext = createContext<NavApi | null>(null)

export function useNav(): NavApi {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used inside the PrototypeViewer')
  return ctx
}

/* ─── Static link map: every navigate() target each screen exposes.
   Used by the reachability assertion (lib/reachability.ts) so the
   graph is proved connected without a browser. Keep in step with
   the screens' own onClick handlers. ─── */
export const APP_TABS: AppScreenId[] = ['app.home', 'app.explore', 'app.event', 'app.guests', 'app.messages']
export const PRO_TABS: ProScreenId[] = ['pro.home', 'pro.events', 'pro.checkin', 'pro.calendar', 'pro.messages']
export const VENDOR_TABS: VendorScreenId[] = ['vendor.home', 'vendor.requests', 'vendor.calendar', 'vendor.listings', 'vendor.profile']
const AT = APP_TABS
const PT = PRO_TABS
const VT = VENDOR_TABS
const ADMIN_NAV: AdminScreenId[] = ['admin.overview', 'admin.verification', 'admin.users', 'admin.marketplace', 'admin.bookings', 'admin.reviews', 'admin.notifications', 'admin.reports', 'admin.settings', 'admin.signin']

export const LINKS: Record<ScreenId, ScreenId[]> = {
  'app.welcome': ['app.signin'],
  'app.signin': ['app.otp', 'app.home'],
  'app.otp': ['app.home'],
  'app.home': ['app.event', 'app.planner', 'app.bookings', 'app.vendor', 'app.guests', 'app.invite', 'app.notifications', 'app.profile', 'app.thread', 'app.explore', ...AT],
  'app.event': ['app.bookings', 'app.vendor', 'app.explore', 'app.planner', 'app.guests', 'app.thread', ...AT],
  'app.planner': ['app.thread', 'app.event', 'app.explore'],
  'app.explore': ['app.vendor', 'app.planner', 'app.booking', ...AT],
  'app.vendor': ['app.booking', 'app.thread', 'app.explore'],
  'app.booking': ['app.bookings', 'app.vendor', 'app.thread'],
  'app.bookings': ['app.vendor', 'app.thread', 'app.explore', 'app.booking'],
  'app.guests': ['app.invite', 'app.event', ...AT],
  'app.invite': ['app.guests', 'app.event'],
  'app.messages': ['app.thread', 'app.planner', ...AT],
  'app.thread': ['app.vendor', 'app.bookings', 'app.planner', 'app.event'],
  'app.notifications': ['app.bookings', 'app.thread', 'app.guests', 'app.invite', 'app.planner', 'app.event'],
  'app.profile': ['app.notifications', 'app.bookings', 'app.planner', 'app.welcome', 'app.event'],

  'pro.signin': ['pro.home'],
  'pro.home': ['pro.event', 'pro.checkin', 'pro.requests', 'pro.messages', 'pro.verification', 'pro.profile', 'pro.vendors', 'pro.guests', ...PT],
  'pro.events': ['pro.event', 'pro.checkin', 'pro.calendar', ...PT],
  'pro.event': ['pro.vendors', 'pro.requests', 'pro.guests', 'pro.checkin', 'pro.messages', 'pro.calendar'],
  'pro.calendar': ['pro.event', 'pro.events', 'pro.requests', ...PT],
  'pro.vendors': ['pro.requests', 'pro.event', 'pro.messages'],
  'pro.requests': ['pro.vendors', 'pro.event', 'pro.messages'],
  'pro.guests': ['pro.checkin', 'pro.event'],
  'pro.checkin': ['pro.guests', 'pro.event', 'pro.messages', ...PT],
  'pro.verification': ['pro.profile', 'pro.home'],
  'pro.messages': ['pro.event', 'pro.requests', 'pro.checkin', ...PT],
  'pro.profile': ['pro.verification', 'pro.calendar', 'pro.events', 'pro.signin'],

  'vendor.signin': ['vendor.home'],
  'vendor.home': ['vendor.request', 'vendor.requests', 'vendor.calendar', 'vendor.bookings', 'vendor.reviews', 'vendor.verification', 'vendor.listings', 'vendor.profile', ...VT],
  'vendor.requests': ['vendor.request', 'vendor.calendar', 'vendor.bookings', ...VT],
  'vendor.request': ['vendor.calendar', 'vendor.bookings', 'vendor.requests'],
  'vendor.calendar': ['vendor.request', 'vendor.bookings', 'vendor.listings', ...VT],
  'vendor.listings': ['vendor.listing', 'vendor.calendar', 'vendor.reviews', 'vendor.verification', ...VT],
  'vendor.listing': ['vendor.listings', 'vendor.calendar', 'vendor.reviews'],
  'vendor.bookings': ['vendor.request', 'vendor.calendar', 'vendor.reviews'],
  'vendor.reviews': ['vendor.bookings', 'vendor.listing'],
  'vendor.verification': ['vendor.listings', 'vendor.profile'],
  'vendor.profile': ['vendor.verification', 'vendor.reviews', 'vendor.listings', 'vendor.bookings', 'vendor.signin', ...VT],

  'admin.signin': ['admin.overview'],
  'admin.overview': [...ADMIN_NAV],
  'admin.verification': [...ADMIN_NAV],
  'admin.users': [...ADMIN_NAV],
  'admin.marketplace': [...ADMIN_NAV],
  'admin.bookings': [...ADMIN_NAV],
  'admin.reviews': [...ADMIN_NAV],
  'admin.notifications': [...ADMIN_NAV],
  'admin.reports': [...ADMIN_NAV],
  'admin.settings': [...ADMIN_NAV],
}
