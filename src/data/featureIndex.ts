import type { ScreenId } from '../lib/navigation'

/* ─────────────────────────────────────────────────────────────
   The requirements, transcribed. Two sources:
   · chat = the Fiverr order request from deropo (Dave), 9 Nov 2026.
   · call = the 33-minute discovery call with Dave, 9 Nov 2026, in the
            words used on the call.
   Every statement is written once, here. SCREEN_FEATURES points at
   these keys, so the per-screen panel can never drift from the index.
   ───────────────────────────────────────────────────────────── */

export const DOCUMENT = {
  title: 'Edera · Fiverr order request + discovery call',
  source: 'Order request from deropo (Dave) · video call, 9 Nov 2026, 33 min',
  call: 'The written proposal (overview, features, timeline, budget, installments) follows this demo',
}

export const F = {
  // 00 The order request (chat)
  platform: 'Build Edera as a fully functional, scalable platform for iOS, Android and web',
  roles: 'An event marketplace and management platform connecting clients, event planners, vendors and venue owners',
  dashboards: 'Separate user dashboards for each type of user',
  verification: 'Professional verification',
  marketplace: 'Vendor marketplaces',
  calendars: 'Availability calendars',
  eventMgmt: 'Event management',
  bookings: 'Bookings',
  payments: 'Payments',
  guests: 'Guest management',
  qr: 'QR check-in',
  notifications: 'Real-time notifications',
  stackQuestion: 'Recommend a technology stack and explain why',
  reusePrototype: 'Work with the existing Hostinger Horizons prototype rather than rebuilding everything: audit the code and identify reusable components',
  backend: 'Develop a secure backend with role-based permissions, database management, payment integration and APIs',
  mobileTransition: 'Explain the approach to the transition to mobile applications',
  similarWork: 'Show similar marketplace or multi-user booking platforms built before, with live examples',
  phases: 'Explain the development phases, with a realistic timeline and cost breakdown',
  ownership: 'Confirm the client will own the source code, database and intellectual property after completion',
  // 01 Who Edera is for (call)
  threePeople: 'Three people are essential in the chain: the client, the event planner and the vendors, venues included',
  plannerDoesMost: 'The event planner does most of the work; the client just assigns the planner to handle the rest',
  clientSummary: 'The client sees a summary of what has happened from their own portal',
  whatsapp: 'Today organisers run everything on WhatsApp: PDFs of their vision, group chats, asking for referrals',
  instagram: 'They search Instagram or Google for a baker, a caterer, a planner; there is no one place to focus on',
  industryOnly: 'On Edera the people you find are the people you need in your industry, not just anyone',
  onePlace: '“When I need a DJ, all I need to go is this place, and I’ll find a DJ”',
  yearsOperating: 'See how long the DJ has been in operation',
  reviews: 'See other people’s reviews about the DJ',
  calendarFree: 'See the calendar: when the day is free and when it is booked',
  profileBasics: 'See the basic things you need on the profile without even contacting the vendor',
  // 02 The journey read back on the call
  clientSignup: 'The client signs up and outlines their event requirements',
  vendorProfiles: 'Vendors and venues create profiles, verify their credentials and publish their availability and services',
  browseRequest: 'The client browses the marketplace via availability calendars and sends booking requests to vendors or venues',
  vendorAccept: 'Vendors accept the request',
  milestonePay: 'The client processes milestone or full payments through a secure split payment gateway',
  guestListQr: 'The client manages a digital guest list and generates QR invites',
  scanDay: 'On the event day, planners or vendors use the mobile app to scan guest QR codes for seamless check-in',
  // 03 Money (call)
  noPaymentsNow: 'Payments are not rolled out now: the platform does not charge at launch',
  freeUntilUsers: 'Keep the app free until enough users are registered and habitual, then introduce charges later',
  commission: 'Monetisation later: a percentage commission on every transaction when a vendor or venue is booked through the app',
  threeYears: 'His rough idea: commission maybe after three years of successful transactions, based on our advice',
  // 04 Languages, markets and data (call)
  localLanguages: 'Local languages make sense: people should relate to it in their traditional language',
  ukNigeria: 'UK and Nigeria first: he is from Nigeria and based in the UK; the problem is worst in Nigeria and similar in the UK',
  global: 'A global problem: birthdays, weddings and more; it can scale to other countries, India included, later',
  seedData: 'Initial data: a little of both; a small circle of people he knows use the app first and give feedback',
  feedback: 'Work on the app with that feedback to make it better before marketing to everyone else',
  // 05 Build and delivery (call)
  stack: 'ReactJS admin panel, React Native apps for iOS and Android, Node.js + Express API, MongoDB Atlas, AWS hosting',
  team: 'A dedicated team: a senior project manager, two front-end and two back-end developers, and testers',
  support: '90 days of free support and maintenance after delivery; after that, optional maintenance or an hourly rate',
  milestones: '8 installments, 10% upfront, pay as you go after reviewing each delivery, every payment through Fiverr',
  quote: 'Rough estimate on the call: $6,000–7,000 over 3 months in 8 installments; he will review the written quotation',
  demo: 'A free demo based on the requirements before the written proposal; not the final design',
  startDecember: 'He plans to start development by December',
} as const

export type FeatureKey = keyof typeof F

export type FeatureRef = { screen: ScreenId } | { notBuilt: string }
export type IndexedFeature = { key: FeatureKey; text: string; ref: FeatureRef }
export type FeatureModule = { n: number; module: string; source: 'chat' | 'call'; summary: string; features: IndexedFeature[] }

const f = (key: FeatureKey, ref: FeatureRef): IndexedFeature => ({ key, text: F[key], ref })

const PROPOSAL = 'Answered in the written proposal, not by a screen in the app'

export const MODULES = {
  request: 'The order request (Fiverr chat)',
  who: 'Who Edera is for',
  journey: 'The journey read back on the call',
  money: 'Money',
  markets: 'Languages, markets and data',
  delivery: 'Build and delivery',
} as const

export const FEATURE_INDEX: FeatureModule[] = [
  {
    n: 0, module: MODULES.request, source: 'chat',
    summary: 'What Dave wrote in the Fiverr order request: the platform, its ten capabilities, and the questions about stack, reuse, examples, phases and ownership.',
    features: [
      f('platform', { screen: 'app.welcome' }),
      f('roles', { screen: 'admin.overview' }),
      f('dashboards', { screen: 'app.home' }),
      f('verification', { screen: 'admin.verification' }),
      f('marketplace', { screen: 'app.explore' }),
      f('calendars', { screen: 'vendor.calendar' }),
      f('eventMgmt', { screen: 'pro.event' }),
      f('bookings', { screen: 'vendor.request' }),
      f('payments', { notBuilt: 'Kept out of the first release on the call; bookings confirm without payment and the admin shows where it switches on later' }),
      f('guests', { screen: 'app.guests' }),
      f('qr', { screen: 'pro.checkin' }),
      f('notifications', { screen: 'admin.notifications' }),
      f('stackQuestion', { notBuilt: 'Answered on the call and in the proposal: React, React Native, Node/Express, MongoDB Atlas, AWS' }),
      f('reusePrototype', { notBuilt: 'The Horizons code audit is the first week of the build; the proposal describes the approach' }),
      f('backend', { screen: 'admin.users' }),
      f('mobileTransition', { screen: 'app.welcome' }),
      f('similarWork', { notBuilt: 'Shown on the call (music-creator marketplace, food delivery) and shared as case studies in the chat' }),
      f('phases', { notBuilt: PROPOSAL }),
      f('ownership', { notBuilt: 'Confirmed on the call and in the proposal: Dave is the sole owner of the codebase, database and IP' }),
    ],
  },
  {
    n: 1, module: MODULES.who, source: 'call',
    summary: '“When I need a DJ, all I need to go is this place.” The three people in the chain, and what a profile must show without a single message being sent.',
    features: [
      f('threePeople', { screen: 'admin.overview' }),
      f('plannerDoesMost', { screen: 'pro.home' }),
      f('clientSummary', { screen: 'app.home' }),
      f('whatsapp', { screen: 'app.messages' }),
      f('instagram', { screen: 'app.explore' }),
      f('industryOnly', { screen: 'app.explore' }),
      f('onePlace', { screen: 'pro.vendors' }),
      f('yearsOperating', { screen: 'app.vendor' }),
      f('reviews', { screen: 'vendor.reviews' }),
      f('calendarFree', { screen: 'app.vendor' }),
      f('profileBasics', { screen: 'app.vendor' }),
    ],
  },
  {
    n: 2, module: MODULES.journey, source: 'call',
    summary: 'The user journey Kushal read back and Dave agreed to, from sign-up to the scan at the door.',
    features: [
      f('clientSignup', { screen: 'app.event' }),
      f('vendorProfiles', { screen: 'vendor.listing' }),
      f('browseRequest', { screen: 'app.booking' }),
      f('vendorAccept', { screen: 'vendor.request' }),
      f('milestonePay', { notBuilt: 'Deferred on the call: no payments at launch. The booking flow ends at confirmation' }),
      f('guestListQr', { screen: 'app.invite' }),
      f('scanDay', { screen: 'pro.checkin' }),
    ],
  },
  {
    n: 3, module: MODULES.money, source: 'call',
    summary: 'Free at launch, commission later. The admin carries the switch, turned off.',
    features: [
      f('noPaymentsNow', { screen: 'vendor.bookings' }),
      f('freeUntilUsers', { screen: 'admin.settings' }),
      f('commission', { screen: 'admin.settings' }),
      f('threeYears', { notBuilt: 'A timing decision for Dave; the admin shows the commission switch, turned off' }),
    ],
  },
  {
    n: 4, module: MODULES.markets, source: 'call',
    summary: 'UK and Nigeria first, in local languages, seeded by people Dave knows.',
    features: [
      f('localLanguages', { screen: 'app.profile' }),
      f('ukNigeria', { screen: 'admin.reports' }),
      f('global', { screen: 'admin.reports' }),
      f('seedData', { screen: 'admin.users' }),
      f('feedback', { screen: 'admin.reviews' }),
    ],
  },
  {
    n: 5, module: MODULES.delivery, source: 'call',
    summary: 'How the build runs and how the engagement works, as explained on the call.',
    features: [
      f('stack', { notBuilt: 'Architecture, not a screen; this prototype runs on local demo data' }),
      f('team', { notBuilt: PROPOSAL }),
      f('support', { notBuilt: PROPOSAL }),
      f('milestones', { notBuilt: PROPOSAL }),
      f('quote', { notBuilt: PROPOSAL }),
      f('demo', { screen: 'app.welcome' }),
      f('startDecember', { notBuilt: 'A date on Dave’s side; the proposal carries the schedule from kick-off' }),
    ],
  },
]

export const INDEX_COUNTS = (() => {
  const all = FEATURE_INDEX.flatMap((m) => m.features)
  const mapped = all.filter((x) => 'screen' in x.ref)
  return { modules: FEATURE_INDEX.length, features: all.length, mapped: mapped.length, notBuilt: all.length - mapped.length }
})()
