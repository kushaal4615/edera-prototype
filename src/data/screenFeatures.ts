import type { ScreenId } from '../lib/navigation'
import { F, FEATURE_INDEX, MODULES, type FeatureKey } from './featureIndex'

/* What each screen demonstrates, shown in the viewer's FEATURE PANEL.
   Features are keys into the requirements index, so every statement is
   the chat's or the call's own wording. Exhaustive by type: a screen
   without an entry fails the build. */

export type Persona = 'Client App' | 'Planner App' | 'Vendor App' | 'Edera Admin'
export type ScreenFeatures = { persona: Persona; title: string; module: string; features: FeatureKey[] }

const app = (title: string, module: string, features: FeatureKey[]): ScreenFeatures => ({ persona: 'Client App', title, module, features })
const pro = (title: string, module: string, features: FeatureKey[]): ScreenFeatures => ({ persona: 'Planner App', title, module, features })
const vendor = (title: string, module: string, features: FeatureKey[]): ScreenFeatures => ({ persona: 'Vendor App', title, module, features })
const admin = (title: string, module: string, features: FeatureKey[]): ScreenFeatures => ({ persona: 'Edera Admin', title, module, features })

const M = MODULES

export const SCREEN_FEATURES: Record<ScreenId, ScreenFeatures> = {
  'app.welcome': app('Welcome', M.request, ['platform', 'mobileTransition', 'roles', 'localLanguages', 'demo']),
  'app.signin': app('Sign in', M.request, ['backend', 'dashboards', 'platform']),
  'app.otp': app('Verify your phone', M.request, ['backend', 'notifications', 'platform']),
  'app.home': app('My event', M.who, ['clientSummary', 'dashboards', 'plannerDoesMost', 'eventMgmt', 'notifications']),
  'app.event': app('Event details', M.journey, ['clientSignup', 'eventMgmt', 'clientSummary', 'plannerDoesMost']),
  'app.planner': app('Your planner', M.who, ['plannerDoesMost', 'threePeople', 'yearsOperating', 'reviews', 'verification']),
  'app.explore': app('Explore the marketplace', M.who, ['marketplace', 'instagram', 'industryOnly', 'calendars', 'ukNigeria']),
  'app.vendor': app('Vendor profile', M.who, ['profileBasics', 'yearsOperating', 'reviews', 'calendarFree', 'verification', 'onePlace']),
  'app.booking': app('Send a booking request', M.journey, ['browseRequest', 'bookings', 'calendars', 'noPaymentsNow']),
  'app.bookings': app('My bookings', M.request, ['bookings', 'clientSummary', 'vendorAccept', 'notifications']),
  'app.guests': app('Guest list', M.request, ['guests', 'guestListQr', 'eventMgmt']),
  'app.invite': app('QR invite', M.journey, ['guestListQr', 'qr', 'guests']),
  'app.messages': app('Inbox', M.who, ['whatsapp', 'notifications', 'plannerDoesMost']),
  'app.thread': app('Conversation', M.who, ['whatsapp', 'notifications', 'clientSummary']),
  'app.notifications': app('Notifications', M.request, ['notifications', 'bookings', 'guests']),
  'app.profile': app('Profile & language', M.markets, ['localLanguages', 'ukNigeria', 'global', 'dashboards']),

  'pro.signin': pro('Planner sign in', M.request, ['backend', 'dashboards', 'verification']),
  'pro.home': pro('Today', M.who, ['plannerDoesMost', 'dashboards', 'eventMgmt', 'notifications', 'qr']),
  'pro.events': pro('My events', M.request, ['eventMgmt', 'plannerDoesMost', 'threePeople']),
  'pro.event': pro('Event board', M.request, ['eventMgmt', 'bookings', 'plannerDoesMost', 'calendars', 'guests']),
  'pro.calendar': pro('Calendar', M.request, ['calendars', 'eventMgmt', 'calendarFree']),
  'pro.vendors': pro('Find a vendor', M.who, ['onePlace', 'industryOnly', 'calendarFree', 'yearsOperating', 'marketplace']),
  'pro.requests': pro('Booking requests', M.journey, ['browseRequest', 'vendorAccept', 'bookings', 'notifications']),
  'pro.guests': pro('Guest list', M.request, ['guests', 'guestListQr', 'eventMgmt']),
  'pro.checkin': pro('Door · QR check-in', M.journey, ['scanDay', 'qr', 'guests', 'notifications']),
  'pro.verification': pro('Professional verification', M.request, ['verification', 'vendorProfiles', 'industryOnly']),
  'pro.messages': pro('Inbox', M.who, ['whatsapp', 'notifications', 'threePeople']),
  'pro.profile': pro('Public profile', M.who, ['yearsOperating', 'reviews', 'verification', 'localLanguages']),

  'vendor.signin': vendor('Vendor sign in', M.request, ['backend', 'dashboards', 'roles']),
  'vendor.home': vendor('Today', M.journey, ['vendorAccept', 'dashboards', 'calendars', 'notifications', 'noPaymentsNow']),
  'vendor.requests': vendor('Requests', M.journey, ['vendorAccept', 'bookings', 'browseRequest', 'notifications']),
  'vendor.request': vendor('One request', M.journey, ['vendorAccept', 'bookings', 'calendarFree', 'noPaymentsNow']),
  'vendor.calendar': vendor('Availability', M.request, ['calendars', 'calendarFree', 'vendorProfiles']),
  'vendor.listings': vendor('My listings', M.journey, ['vendorProfiles', 'marketplace', 'roles', 'profileBasics']),
  'vendor.listing': vendor('Edit listing', M.journey, ['vendorProfiles', 'profileBasics', 'marketplace', 'yearsOperating']),
  'vendor.bookings': vendor('Bookings', M.money, ['noPaymentsNow', 'bookings', 'freeUntilUsers']),
  'vendor.reviews': vendor('Reviews', M.who, ['reviews', 'profileBasics', 'feedback']),
  'vendor.verification': vendor('Get verified', M.request, ['verification', 'vendorProfiles', 'industryOnly']),
  'vendor.profile': vendor('Account', M.markets, ['localLanguages', 'roles', 'dashboards']),

  'admin.signin': admin('Admin sign in', M.request, ['backend', 'dashboards', 'roles']),
  'admin.overview': admin('Platform overview', M.who, ['roles', 'threePeople', 'ukNigeria', 'dashboards', 'notifications']),
  'admin.verification': admin('Verification queue', M.request, ['verification', 'vendorProfiles', 'industryOnly', 'backend']),
  'admin.users': admin('Users & roles', M.request, ['backend', 'seedData', 'roles', 'dashboards']),
  'admin.marketplace': admin('Listings & categories', M.request, ['marketplace', 'industryOnly', 'calendars', 'vendorProfiles']),
  'admin.bookings': admin('Events & bookings', M.request, ['bookings', 'eventMgmt', 'guests', 'noPaymentsNow']),
  'admin.reviews': admin('Reviews & reports', M.markets, ['feedback', 'reviews', 'seedData']),
  'admin.notifications': admin('Notifications', M.request, ['notifications', 'seedData', 'localLanguages']),
  'admin.reports': admin('Reports', M.markets, ['ukNigeria', 'global', 'roles', 'bookings']),
  'admin.settings': admin('Platform settings', M.money, ['commission', 'freeUntilUsers', 'noPaymentsNow', 'localLanguages', 'ukNigeria']),
}

export const featureText = (k: FeatureKey) => F[k]

/* Dev-time drift check: every module used on a screen exists in the index,
   and every feature a screen claims is in the index. */
if (import.meta.env.DEV) {
  const keys = new Set(FEATURE_INDEX.flatMap((m) => m.features.map((x) => x.key)))
  const modules = new Set(FEATURE_INDEX.map((m) => m.module))
  for (const [id, s] of Object.entries(SCREEN_FEATURES)) {
    if (!modules.has(s.module)) console.error(`[FEATURES] ${id} uses unknown module "${s.module}"`)
    for (const k of s.features) if (!keys.has(k)) console.error(`[FEATURES] ${id} claims "${k}", which is not in FEATURE_INDEX`)
    if (s.features.length < 3 || s.features.length > 7) console.error(`[FEATURES] ${id} has ${s.features.length} features (3–7 required)`)
  }
}
