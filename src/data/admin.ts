import { addDays, CLOCK } from './clock'
import type { MediaKey } from './media'
import type { CategoryId, Region } from './vendors'

/* The platform owner's view: launch-phase numbers for a marketplace that
   is free to use, in two countries, with a verification queue to work
   through. Every figure is a demo value. */

export const KPI = {
  users: 4812,
  usersDelta: '+18.4% vs last month',
  clients: 2960,
  planners: 412,
  vendors: 1440,
  verifiedPros: 1088,
  pendingVerification: 23,
  eventsPlanned: 1374,
  eventsThisMonth: 212,
  requests30d: 2891,
  acceptRate: 71,
  medianReply: '1h 48m',
  gbv30d: 486200, // gross booking value, £ equivalent, confirmed in-app (no commission yet)
  checkins30d: 18640,
  reviews30d: 1312,
  avgRating: 4.8,
  uk: { users: 2744, vendors: 812, events: 790 },
  ng: { users: 2068, vendors: 628, events: 584 },
}

/** 12 months of signups by role, with a visible launch bump in Aug–Sep (UK) and Oct–Nov (Lagos). */
export const SIGNUPS = [
  { m: 'Dec', clients: 40, planners: 6, vendors: 22 },
  { m: 'Jan', clients: 62, planners: 9, vendors: 31 },
  { m: 'Feb', clients: 88, planners: 12, vendors: 44 },
  { m: 'Mar', clients: 110, planners: 15, vendors: 58 },
  { m: 'Apr', clients: 134, planners: 19, vendors: 66 },
  { m: 'May', clients: 171, planners: 22, vendors: 84 },
  { m: 'Jun', clients: 206, planners: 31, vendors: 102 },
  { m: 'Jul', clients: 248, planners: 38, vendors: 129 },
  { m: 'Aug', clients: 391, planners: 52, vendors: 188 },
  { m: 'Sep', clients: 447, planners: 61, vendors: 203 },
  { m: 'Oct', clients: 486, planners: 69, vendors: 241 },
  { m: 'Nov', clients: 577, planners: 78, vendors: 272 },
]
/** Requests and acceptances by week, 14 weeks */
export const REQUEST_WEEKS = Array.from({ length: 14 }, (_, i) => {
  const base = 120 + i * 38 + (i % 3 === 0 ? 40 : 0) + (i === 9 ? 90 : 0)
  return { w: `W${35 + i}`, requests: base, accepted: Math.round(base * (0.62 + (i % 4) * 0.03)), declined: Math.round(base * 0.11) }
})
/** Events by type, last 90 days */
export const EVENT_MIX: { type: string; n: number }[] = [
  { type: 'Weddings', n: 318 },
  { type: 'Birthdays', n: 402 },
  { type: 'Traditional weddings', n: 156 },
  { type: 'Anniversaries', n: 88 },
  { type: 'Corporate', n: 141 },
  { type: 'Naming & christenings', n: 97 },
  { type: 'Memorials', n: 44 },
  { type: 'Other', n: 128 },
]
/** Category demand vs supply (requests per vendor), to spot gaps */
export const CATEGORY_HEALTH: { category: CategoryId; label: string; vendors: number; requests30d: number; fill: number }[] = [
  { category: 'catering', label: 'Caterers', vendors: 326, requests30d: 884, fill: 74 },
  { category: 'venue', label: 'Venues', vendors: 184, requests30d: 612, fill: 69 },
  { category: 'dj', label: 'DJs', vendors: 211, requests30d: 403, fill: 81 },
  { category: 'photo', label: 'Photographers', vendors: 263, requests30d: 398, fill: 77 },
  { category: 'decor', label: 'Decor & florals', vendors: 198, requests30d: 287, fill: 66 },
  { category: 'planner', label: 'Planners', vendors: 142, requests30d: 241, fill: 58 },
  { category: 'cake', label: 'Cakes', vendors: 157, requests30d: 190, fill: 83 },
  { category: 'glam', label: 'Gele & makeup', vendors: 134, requests30d: 171, fill: 79 },
  { category: 'mc', label: 'MCs', vendors: 96, requests30d: 128, fill: 62 },
  { category: 'bar', label: 'Mobile bars', vendors: 88, requests30d: 97, fill: 71 },
  { category: 'band', label: 'Live bands', vendors: 71, requests30d: 84, fill: 49 },
]
/** Active cities */
export const CITIES: { city: string; region: Region; users: number; vendors: number; events: number; photo: MediaKey }[] = [
  { city: 'London', region: 'uk', users: 2210, vendors: 684, events: 648, photo: 'londonThames' },
  { city: 'Lagos', region: 'ng', users: 1690, vendors: 521, events: 471, photo: 'lagosWaterfront' },
  { city: 'Manchester', region: 'uk', users: 318, vendors: 84, events: 92, photo: 'rooftopParty' },
  { city: 'Abuja', region: 'ng', users: 262, vendors: 78, events: 81, photo: 'brightHall' },
  { city: 'Birmingham', region: 'uk', users: 216, vendors: 44, events: 50, photo: 'tipiDance' },
  { city: 'Port Harcourt', region: 'ng', users: 116, vendors: 29, events: 32, photo: 'communityHall' },
]

/* ── Verification queue ── */
export type VerifyState = 'pending' | 'info' | 'approved' | 'rejected'
export type VerifyCase = {
  id: string
  person: string
  business: string
  role: 'Planner' | 'Vendor' | 'Venue'
  category: CategoryId
  region: Region
  city: string
  submitted: string
  docs: { name: string; state: 'ok' | 'check' | 'missing' }[]
  checks: { label: string; ok: boolean | null }[]
  state: VerifyState
  years: number
  photo: MediaKey
  note?: string
}
export const VERIFY_QUEUE: VerifyCase[] = [
  { id: 'vf1', person: 'segun', business: 'SO Occasions', role: 'Planner', category: 'planner', region: 'uk', city: 'Manchester', submitted: addDays(CLOCK.todayIso, -1), years: 11, photo: 'rooftopParty', state: 'pending',
    docs: [{ name: 'UK passport', state: 'ok' }, { name: 'Companies House · 08811920', state: 'ok' }, { name: 'Public liability insurance', state: 'ok' }, { name: 'Portfolio · 24 events', state: 'ok' }],
    checks: [{ label: 'Companies House match', ok: true }, { label: 'ID name matches business', ok: true }, { label: 'Insurance in date', ok: true }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf2', person: 'wale', business: 'Lens of Lagos', role: 'Vendor', category: 'photo', region: 'ng', city: 'Lagos', submitted: addDays(CLOCK.todayIso, -1), years: 6, photo: 'weddingConfetti', state: 'pending',
    docs: [{ name: 'NIN slip', state: 'ok' }, { name: 'CAC certificate · BN 3391204', state: 'check' }, { name: 'Portfolio · 40 events', state: 'ok' }],
    checks: [{ label: 'CAC number format', ok: true }, { label: 'ID name matches business', ok: null }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf3', person: 'chuks', business: 'Asake Live Band', role: 'Vendor', category: 'band', region: 'uk', city: 'Croydon', submitted: addDays(CLOCK.todayIso, -2), years: 5, photo: 'concertYellow', state: 'info',
    docs: [{ name: 'UK driving licence', state: 'check' }, { name: 'Companies House', state: 'missing' }, { name: 'Portfolio · 9 events', state: 'ok' }],
    checks: [{ label: 'ID legible', ok: false }, { label: 'Business registration', ok: false }, { label: 'No duplicate account', ok: true }], note: 'ID is cropped, expiry not visible. Asked for a re-upload.' },
  { id: 'vf4', person: 'ayo', business: 'Ayo Martins Planning', role: 'Planner', category: 'planner', region: 'ng', city: 'Lagos', submitted: addDays(CLOCK.todayIso, -3), years: 5, photo: 'confettiCrowd', state: 'pending',
    docs: [{ name: 'Voter’s card', state: 'ok' }, { name: 'CAC certificate', state: 'missing' }, { name: 'Portfolio · 12 events', state: 'ok' }],
    checks: [{ label: 'ID legible', ok: true }, { label: 'Business registration', ok: false }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf5', person: 'musa', business: 'Eko Convention Hall', role: 'Venue', category: 'venue', region: 'ng', city: 'Lagos', submitted: addDays(CLOCK.todayIso, -4), years: 12, photo: 'communityHall', state: 'pending',
    docs: [{ name: 'CAC certificate · RC 229811', state: 'ok' }, { name: 'Fire safety certificate', state: 'ok' }, { name: 'Venue photos · 18', state: 'ok' }, { name: 'Manager ID', state: 'ok' }],
    checks: [{ label: 'CAC match', ok: true }, { label: 'Safety certificate in date', ok: true }, { label: 'Address verified', ok: null }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf6', person: 'femi', business: 'Oriki Cocktails', role: 'Vendor', category: 'bar', region: 'uk', city: 'Brixton', submitted: addDays(CLOCK.todayIso, -5), years: 3, photo: 'cocktailPour', state: 'approved',
    docs: [{ name: 'UK passport', state: 'ok' }, { name: 'Personal licence · Lambeth', state: 'ok' }, { name: 'Companies House', state: 'ok' }],
    checks: [{ label: 'Personal licence valid', ok: true }, { label: 'Companies House match', ok: true }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf7', person: 'tola', business: 'Gele & Glam by Tola', role: 'Vendor', category: 'glam', region: 'uk', city: 'Stratford', submitted: addDays(CLOCK.todayIso, -6), years: 4, photo: 'bouquet', state: 'approved',
    docs: [{ name: 'UK BRP', state: 'ok' }, { name: 'Sole trader UTR', state: 'ok' }, { name: 'Portfolio · 60 looks', state: 'ok' }],
    checks: [{ label: 'ID legible', ok: true }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf8', person: 'grace', business: 'Grace Cakes Lagos', role: 'Vendor', category: 'cake', region: 'ng', city: 'Surulere', submitted: addDays(CLOCK.todayIso, -6), years: 5, photo: 'dripCake', state: 'pending',
    docs: [{ name: 'NIN slip', state: 'ok' }, { name: 'CAC certificate · BN 2210933', state: 'ok' }, { name: 'NAFDAC kitchen registration', state: 'check' }],
    checks: [{ label: 'CAC match', ok: true }, { label: 'Kitchen registration', ok: null }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf9', person: 'halima', business: 'Halima Yusuf Events', role: 'Planner', category: 'planner', region: 'ng', city: 'Abuja', submitted: addDays(CLOCK.todayIso, -8), years: 8, photo: 'tableFlowers', state: 'rejected',
    docs: [{ name: 'Driver’s licence', state: 'check' }, { name: 'CAC certificate', state: 'ok' }],
    checks: [{ label: 'ID name matches business', ok: false }, { label: 'No duplicate account', ok: false }], note: 'A second account exists under the same CAC number. Asked to merge.' },
  { id: 'vf10', person: 'ngoziB', business: 'Bloom by Ngozi', role: 'Vendor', category: 'decor', region: 'ng', city: 'Ikoyi', submitted: addDays(CLOCK.todayIso, -9), years: 7, photo: 'bouquet', state: 'approved',
    docs: [{ name: 'NIN slip', state: 'ok' }, { name: 'CAC certificate', state: 'ok' }, { name: 'Portfolio · 31 events', state: 'ok' }],
    checks: [{ label: 'CAC match', ok: true }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf11', person: 'dapo', business: 'The Orangery, Royal Docks', role: 'Venue', category: 'venue', region: 'uk', city: 'London', submitted: addDays(CLOCK.todayIso, -12), years: 14, photo: 'ballroom', state: 'approved',
    docs: [{ name: 'Companies House · 05529930', state: 'ok' }, { name: 'Premises licence', state: 'ok' }, { name: 'Fire risk assessment', state: 'ok' }],
    checks: [{ label: 'Companies House match', ok: true }, { label: 'Licence in date', ok: true }, { label: 'No duplicate account', ok: true }] },
  { id: 'vf12', person: 'nkechi', business: 'Umeh & Co. Events', role: 'Planner', category: 'planner', region: 'uk', city: 'London', submitted: addDays(CLOCK.todayIso, -14), years: 6, photo: 'tableGreenery', state: 'approved',
    docs: [{ name: 'UK passport', state: 'ok' }, { name: 'Companies House', state: 'ok' }, { name: 'Portfolio · 18 events', state: 'ok' }],
    checks: [{ label: 'Companies House match', ok: true }, { label: 'No duplicate account', ok: true }] },
]
export const verifyById = (id: string) => VERIFY_QUEUE.find((v) => v.id === id) ?? VERIFY_QUEUE[0]

/* ── Users table (24 rows, paginated in the UI from a generator) ── */
export type UserRole = 'Client' | 'Planner' | 'Vendor' | 'Venue' | 'Admin'
export type UserRow = { id: string; person: string; role: UserRole; region: Region; city: string; joined: string; lastActive: string; events: number; bookings: number; state: 'active' | 'suspended' | 'invited'; verified: boolean }
export const USERS: UserRow[] = [
  { id: 'u1', person: 'adaeze', role: 'Client', region: 'uk', city: 'London', joined: '2026-10-28', lastActive: '12m ago', events: 1, bookings: 6, state: 'active', verified: false },
  { id: 'u2', person: 'tunde', role: 'Planner', region: 'uk', city: 'London', joined: '2026-06-14', lastActive: '2m ago', events: 7, bookings: 41, state: 'active', verified: true },
  { id: 'u3', person: 'bola', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-07-02', lastActive: '4m ago', events: 0, bookings: 38, state: 'active', verified: true },
  { id: 'u4', person: 'dapo', role: 'Venue', region: 'uk', city: 'London', joined: '2026-07-19', lastActive: '1h ago', events: 0, bookings: 29, state: 'active', verified: true },
  { id: 'u5', person: 'kayode', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-07-21', lastActive: '38m ago', events: 0, bookings: 33, state: 'active', verified: true },
  { id: 'u6', person: 'funmi', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-08-03', lastActive: '3h ago', events: 0, bookings: 22, state: 'active', verified: true },
  { id: 'u7', person: 'kemi', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-08-09', lastActive: '1d ago', events: 0, bookings: 17, state: 'active', verified: true },
  { id: 'u8', person: 'seyi', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-08-12', lastActive: '20m ago', events: 0, bookings: 31, state: 'active', verified: true },
  { id: 'u9', person: 'chuks', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-08-30', lastActive: '2d ago', events: 0, bookings: 9, state: 'active', verified: false },
  { id: 'u10', person: 'tola', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-09-04', lastActive: '5h ago', events: 0, bookings: 26, state: 'active', verified: true },
  { id: 'u11', person: 'femi', role: 'Vendor', region: 'uk', city: 'London', joined: '2026-09-11', lastActive: '1d ago', events: 0, bookings: 8, state: 'active', verified: true },
  { id: 'u12', person: 'nkechi', role: 'Planner', region: 'uk', city: 'London', joined: '2026-09-15', lastActive: '6h ago', events: 4, bookings: 19, state: 'active', verified: true },
  { id: 'u13', person: 'segun', role: 'Planner', region: 'uk', city: 'Manchester', joined: '2026-11-18', lastActive: '1d ago', events: 0, bookings: 0, state: 'active', verified: false },
  { id: 'u14', person: 'tomi', role: 'Vendor', region: 'ng', city: 'Lagos', joined: '2026-10-02', lastActive: '14m ago', events: 0, bookings: 44, state: 'active', verified: true },
  { id: 'u15', person: 'musa', role: 'Venue', region: 'ng', city: 'Lagos', joined: '2026-10-05', lastActive: '2h ago', events: 0, bookings: 21, state: 'active', verified: false },
  { id: 'u16', person: 'lade', role: 'Vendor', region: 'ng', city: 'Lagos', joined: '2026-10-06', lastActive: '50m ago', events: 0, bookings: 27, state: 'active', verified: true },
  { id: 'u17', person: 'ngoziB', role: 'Vendor', region: 'ng', city: 'Lagos', joined: '2026-10-09', lastActive: '3h ago', events: 0, bookings: 14, state: 'active', verified: true },
  { id: 'u18', person: 'wale', role: 'Vendor', region: 'ng', city: 'Lagos', joined: '2026-10-21', lastActive: '1h ago', events: 0, bookings: 11, state: 'active', verified: false },
  { id: 'u19', person: 'grace', role: 'Vendor', region: 'ng', city: 'Lagos', joined: '2026-10-25', lastActive: '7h ago', events: 0, bookings: 6, state: 'active', verified: false },
  { id: 'u20', person: 'halima', role: 'Planner', region: 'ng', city: 'Abuja', joined: '2026-10-27', lastActive: '2d ago', events: 2, bookings: 5, state: 'suspended', verified: false },
  { id: 'u21', person: 'ayo', role: 'Planner', region: 'ng', city: 'Lagos', joined: '2026-11-01', lastActive: '4d ago', events: 1, bookings: 2, state: 'active', verified: false },
  { id: 'u22', person: 'ola', role: 'Client', region: 'ng', city: 'Lagos', joined: '2026-10-30', lastActive: '1d ago', events: 1, bookings: 4, state: 'active', verified: false },
  { id: 'u23', person: 'ronke', role: 'Client', region: 'uk', city: 'London', joined: '2026-09-20', lastActive: '5h ago', events: 2, bookings: 3, state: 'active', verified: false },
  { id: 'u24', person: 'dave', role: 'Admin', region: 'uk', city: 'London', joined: '2026-05-01', lastActive: 'now', events: 0, bookings: 0, state: 'active', verified: true },
]

/* ── Reviews moderation ── */
export type FlaggedReview = { id: string; by: string; about: string; rating: number; text: string; reason: string; minutesAgo: number; state: 'open' | 'kept' | 'removed' }
export const FLAGGED: FlaggedReview[] = [
  { id: 'fr1', by: 'tayo', about: 'DJ Kaytee', rating: 1, text: 'Never showed up!!!', reason: 'Vendor says no booking exists for this reviewer', minutesAgo: 60 * 4, state: 'open' },
  { id: 'fr2', by: 'ronke', about: 'Ìyá Bola Catering', rating: 4, text: 'Food was excellent. Service started 20 minutes late because the hall lift broke.', reason: 'Vendor requested review of wording', minutesAgo: 60 * 24 * 2, state: 'open' },
  { id: 'fr3', by: 'uche', about: 'Asake Live Band', rating: 2, text: 'Second set was 25 minutes short and the keyboardist left early.', reason: 'Vendor disputes facts', minutesAgo: 60 * 24 * 3, state: 'open' },
  { id: 'fr4', by: 'yemi', about: 'Umeh & Co. Events', rating: 5, text: 'Best planner in London, call 07700 900xxx for a discount', reason: 'Contains a phone number', minutesAgo: 60 * 24 * 4, state: 'removed' },
  { id: 'fr5', by: 'ife', about: 'Oriki Cocktails', rating: 3, text: 'Drinks were great, queue was long for 150 people with two bartenders.', reason: 'Vendor requested review of wording', minutesAgo: 60 * 24 * 6, state: 'kept' },
]

/* ── Broadcasts / notification campaigns ── */
export type Campaign = { id: string; title: string; audience: string; channel: string; sent: string; delivered: number; opened: number; state: 'sent' | 'scheduled' | 'draft' }
export const CAMPAIGNS: Campaign[] = [
  { id: 'c1', title: 'Edera is live in Lagos', audience: 'Vendors · Nigeria', channel: 'Push + email', sent: addDays(CLOCK.todayIso, 2), delivered: 0, opened: 0, state: 'scheduled' },
  { id: 'c2', title: 'December is filling up: set your availability', audience: 'Vendors · all', channel: 'Push', sent: addDays(CLOCK.todayIso, -2), delivered: 1388, opened: 912, state: 'sent' },
  { id: 'c3', title: 'Your guests can RSVP by QR now', audience: 'Clients with an event in 60 days', channel: 'Push + email', sent: addDays(CLOCK.todayIso, -9), delivered: 1104, opened: 731, state: 'sent' },
  { id: 'c4', title: 'Verified badge: what it means', audience: 'Planners · UK', channel: 'Email', sent: addDays(CLOCK.todayIso, -16), delivered: 402, opened: 288, state: 'sent' },
  { id: 'c5', title: 'Christmas party checklist', audience: 'Clients · UK', channel: 'Push', sent: addDays(CLOCK.todayIso, -23), delivered: 2231, opened: 1340, state: 'sent' },
  { id: 'c6', title: 'Launch offer reminder: listings stay free', audience: 'Vendors · all', channel: 'Email', sent: '', delivered: 0, opened: 0, state: 'draft' },
]
/** Real-time event templates the system fires automatically */
export const AUTO_NOTIFICATIONS: { id: string; trigger: string; to: string; channel: string; sent24h: number; on: boolean }[] = [
  { id: 'a1', trigger: 'Booking request received', to: 'Vendor', channel: 'Push · in-app', sent24h: 184, on: true },
  { id: 'a2', trigger: 'Request accepted / declined / new date', to: 'Client · Planner', channel: 'Push · in-app · email', sent24h: 141, on: true },
  { id: 'a3', trigger: 'New message', to: 'Any', channel: 'Push', sent24h: 962, on: true },
  { id: 'a4', trigger: 'RSVP received', to: 'Client · Planner', channel: 'In-app', sent24h: 1206, on: true },
  { id: 'a5', trigger: 'Guest checked in', to: 'Client', channel: 'In-app', sent24h: 2210, on: true },
  { id: 'a6', trigger: 'Verification decision', to: 'Planner · Vendor', channel: 'Push · email', sent24h: 19, on: true },
  { id: 'a7', trigger: 'Document expiring in 30 days', to: 'Planner · Vendor', channel: 'Email', sent24h: 7, on: true },
  { id: 'a8', trigger: 'Event is tomorrow', to: 'Everyone on the event', channel: 'Push', sent24h: 58, on: true },
  { id: 'a9', trigger: 'Review request after the event', to: 'Client', channel: 'Push · email', sent24h: 63, on: false },
]

/* ── Settings ── */
export const LANGUAGES: { code: string; name: string; native: string; coverage: number; on: boolean }[] = [
  { code: 'en', name: 'English', native: 'English', coverage: 100, on: true },
  { code: 'yo', name: 'Yorùbá', native: 'Yorùbá', coverage: 100, on: true },
  { code: 'pcm', name: 'Nigerian Pidgin', native: 'Naijá', coverage: 100, on: true },
  { code: 'ig', name: 'Igbo', native: 'Asụsụ Igbo', coverage: 92, on: true },
  { code: 'ha', name: 'Hausa', native: 'Harshen Hausa', coverage: 88, on: true },
  { code: 'fr', name: 'French', native: 'Français', coverage: 40, on: false },
]
export const REGIONS: { id: Region; name: string; currency: string; live: boolean; cities: string[]; payments: string }[] = [
  { id: 'uk', name: 'United Kingdom', currency: 'GBP £', live: true, cities: ['London', 'Manchester', 'Birmingham'], payments: 'Later phase · Stripe' },
  { id: 'ng', name: 'Nigeria', currency: 'NGN ₦', live: true, cities: ['Lagos', 'Abuja', 'Port Harcourt'], payments: 'Later phase · Paystack / Flutterwave' },
]
