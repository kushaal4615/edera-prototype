import { useSyncExternalStore } from 'react'
import { CLIENT_NOTICES, PRO_NOTICES, REQUESTS, TONIGHT_CHECKED_IN, VENDOR_NOTICES, type RequestState } from '../data/events'
import type { Region } from '../data/vendors'

/* Session state shared by every screen. In the real build all of this
   lives on the server; the prototype keeps it in memory so the demo
   behaves consistently across the four platforms: a request Tunde sends
   appears in Bola's inbox, Bola's acceptance flips the role on Tunde's
   board and Adaeze's bookings list, a guest scanned at the door counts
   on the client's event, a verification Dave approves gives the vendor
   the badge. */

export type Lang = 'en' | 'yo' | 'pcm' | 'ig' | 'ha'
export type VerifyDecision = 'approved' | 'rejected' | 'info'

export type SessionState = {
  lang: Lang
  /* Client App */
  region: Region
  viewingVendor: string
  viewingPlannerListing: string
  viewingThread: string
  viewingCategory: string | null
  requestsSent: string[] // vendor ids the client/planner requested this session
  plannerRequested: string[]
  guestsAdded: { id: string; name: string; group: string; table: string }[]
  invitesSent: boolean
  readClient: string[]
  savedVendors: string[]
  /* Planner App */
  viewingEvent: string
  tasksDone: string[]
  checkedIn: string[]
  walkIns: { id: string; name: string; party: number }[]
  readPro: string[]
  proVerified: boolean
  /* Vendor App */
  viewingRequest: string
  requestDecisions: Record<string, RequestState>
  blockedDays: string[]
  unblockedDays: string[]
  listingEdited: boolean
  vendorVerificationStep: number
  readVendor: string[]
  repliedReviews: string[]
  /* Edera Admin */
  viewingCase: string
  verifyDecisions: Record<string, VerifyDecision>
  suspended: string[]
  reinstated: string[]
  reviewDecisions: Record<string, 'kept' | 'removed'>
  campaignsSent: string[]
  autoToggles: Record<string, boolean>
  commissionOn: boolean
  languagesOn: Record<string, boolean>
  categoriesAdded: string[]
}

const initial: SessionState = {
  lang: 'en',
  region: 'uk',
  viewingVendor: 'iyabola',
  viewingPlannerListing: 'bakare',
  viewingThread: 'th1',
  viewingCategory: null,
  requestsSent: [],
  plannerRequested: [],
  guestsAdded: [],
  invitesSent: false,
  readClient: [],
  savedVendors: ['djkaytee', 'geleglam'],
  viewingEvent: 'ev-ruby',
  tasksDone: [],
  checkedIn: TONIGHT_CHECKED_IN,
  walkIns: [],
  readPro: [],
  proVerified: true,
  viewingRequest: 'rq1',
  requestDecisions: {},
  blockedDays: [],
  unblockedDays: [],
  listingEdited: false,
  vendorVerificationStep: 3,
  readVendor: [],
  repliedReviews: ['r1'],
  viewingCase: 'vf1',
  verifyDecisions: {},
  suspended: [],
  reinstated: [],
  reviewDecisions: {},
  campaignsSent: [],
  autoToggles: {},
  commissionOn: false,
  languagesOn: {},
  categoriesAdded: [],
}

let state: SessionState = initial
const listeners = new Set<() => void>()

function set(patch: Partial<SessionState> | ((s: SessionState) => Partial<SessionState>)) {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export function useSession<T>(select: (s: SessionState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => select(state),
    () => select(state),
  )
}

export const getSession = () => state

const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])
const remove = (list: string[], id: string) => list.filter((x) => x !== id)

export const session = {
  set,
  reset: () => set(initial),
  setLang: (lang: Lang) => set({ lang }),
  /* Client App */
  setRegion: (region: Region) => set({ region }),
  viewVendor: (id: string) => set({ viewingVendor: id }),
  viewPlannerListing: (id: string) => set({ viewingPlannerListing: id }),
  viewThread: (id: string) => set({ viewingThread: id }),
  setCategory: (id: string | null) => set({ viewingCategory: id }),
  sendRequest: (vendorId: string) => set((s) => ({ requestsSent: add(s.requestsSent, vendorId) })),
  requestPlanner: (id: string) => set((s) => ({ plannerRequested: add(s.plannerRequested, id) })),
  addGuest: (g: { name: string; group: string; table: string }) => set((s) => ({ guestsAdded: [{ id: `new-${Date.now()}`, ...g }, ...s.guestsAdded] })),
  sendInvites: () => set({ invitesSent: true }),
  readClient: (id: string) => set((s) => ({ readClient: add(s.readClient, id) })),
  readAllClient: () => set({ readClient: CLIENT_NOTICES.map((n) => n.id) }),
  toggleSaved: (id: string) => set((s) => ({ savedVendors: s.savedVendors.includes(id) ? remove(s.savedVendors, id) : add(s.savedVendors, id) })),
  /* Planner App */
  viewEvent: (id: string) => set({ viewingEvent: id }),
  toggleTask: (id: string) => set((s) => ({ tasksDone: s.tasksDone.includes(id) ? remove(s.tasksDone, id) : add(s.tasksDone, id) })),
  checkIn: (guestId: string) => set((s) => ({ checkedIn: add(s.checkedIn, guestId) })),
  addWalkIn: (name: string, party: number) => set((s) => ({ walkIns: [{ id: `w-${Date.now()}`, name, party }, ...s.walkIns] })),
  readPro: (id: string) => set((s) => ({ readPro: add(s.readPro, id) })),
  readAllPro: () => set({ readPro: PRO_NOTICES.map((n) => n.id) }),
  /* Vendor App */
  viewRequest: (id: string) => set({ viewingRequest: id }),
  decideRequest: (id: string, d: RequestState) => set((s) => ({ requestDecisions: { ...s.requestDecisions, [id]: d } })),
  toggleDay: (iso: string, currentlyBlocked: boolean) =>
    set((s) =>
      currentlyBlocked
        ? { unblockedDays: add(s.unblockedDays, iso), blockedDays: remove(s.blockedDays, iso) }
        : { blockedDays: add(s.blockedDays, iso), unblockedDays: remove(s.unblockedDays, iso) },
    ),
  editListing: () => set({ listingEdited: true }),
  setVendorVerificationStep: (n: number) => set({ vendorVerificationStep: n }),
  readVendor: (id: string) => set((s) => ({ readVendor: add(s.readVendor, id) })),
  readAllVendor: () => set({ readVendor: VENDOR_NOTICES.map((n) => n.id) }),
  replyReview: (id: string) => set((s) => ({ repliedReviews: add(s.repliedReviews, id) })),
  /* Edera Admin */
  viewCase: (id: string) => set({ viewingCase: id }),
  decideVerification: (id: string, d: VerifyDecision) => set((s) => ({ verifyDecisions: { ...s.verifyDecisions, [id]: d } })),
  suspend: (userId: string) => set((s) => ({ suspended: add(s.suspended, userId), reinstated: remove(s.reinstated, userId) })),
  reinstate: (userId: string) => set((s) => ({ reinstated: add(s.reinstated, userId), suspended: remove(s.suspended, userId) })),
  decideReview: (id: string, d: 'kept' | 'removed') => set((s) => ({ reviewDecisions: { ...s.reviewDecisions, [id]: d } })),
  sendCampaign: (id: string) => set((s) => ({ campaignsSent: add(s.campaignsSent, id) })),
  toggleAuto: (id: string, on: boolean) => set((s) => ({ autoToggles: { ...s.autoToggles, [id]: on } })),
  setCommission: (on: boolean) => set({ commissionOn: on }),
  toggleLanguage: (code: string, on: boolean) => set((s) => ({ languagesOn: { ...s.languagesOn, [code]: on } })),
  addCategory: (name: string) => set((s) => ({ categoriesAdded: add(s.categoriesAdded, name) })),
}

/** The effective state of a booking request after this session's decisions. */
export const requestState = (id: string, s: SessionState = state): RequestState => s.requestDecisions[id] ?? REQUESTS.find((r) => r.id === id)?.state ?? 'requested'

/** Unread counts after this session's reads */
export const unreadClient = (s: SessionState = state) => CLIENT_NOTICES.filter((n) => n.unread && !s.readClient.includes(n.id)).length
export const unreadPro = (s: SessionState = state) => PRO_NOTICES.filter((n) => n.unread && !s.readPro.includes(n.id)).length
export const unreadVendor = (s: SessionState = state) => VENDOR_NOTICES.filter((n) => n.unread && !s.readVendor.includes(n.id)).length

/* ─── Language ───
   const { t, lang } = useLang(); t('My event', 'Ayẹyẹ mi', 'My event')
   English, Yorùbá and Nigerian Pidgin are translated where a screen calls
   t(); Igbo and Hausa are selectable and fall back to English in the demo. */
export const LANG_LABEL: Record<Lang, { name: string; native: string }> = {
  en: { name: 'English', native: 'English' },
  yo: { name: 'Yorùbá', native: 'Yorùbá' },
  pcm: { name: 'Nigerian Pidgin', native: 'Naijá' },
  ig: { name: 'Igbo', native: 'Asụsụ Igbo' },
  ha: { name: 'Hausa', native: 'Hausa' },
}
export function useLang() {
  const lang = useSession((s) => s.lang)
  const t = (en: string, yo?: string, pcm?: string) => (lang === 'yo' && yo ? yo : lang === 'pcm' && pcm ? pcm : en)
  return { lang, t, label: LANG_LABEL[lang] }
}
