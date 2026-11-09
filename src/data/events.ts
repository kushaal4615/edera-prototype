import { addDays, CLOCK } from './clock'
import type { MediaKey } from './media'
import type { CategoryId } from './vendors'

/* Events, booking requests, guest lists, run-of-show, messages and
   notifications. One story across the four platforms:
   · Adaeze (client) is planning her parents' ruby anniversary, 20 Feb 2027,
     180 guests, The Orangery; Tunde (planner) runs it.
   · Tonight, 21 Nov 2026, Tunde is on the door at Adaora & Kunle's
     engagement dinner at Bola's hall: QR check-in is live.
   · Bola (vendor) has Tunde's request for the anniversary waiting. */

export type EventStatus = 'planning' | 'confirmed' | 'live' | 'done'
export type EventType = 'Anniversary' | 'Wedding' | 'Traditional wedding' | 'Birthday' | 'Engagement' | 'Corporate' | 'Baby shower' | 'Naming ceremony'
export type Role = { category: CategoryId; label: string; vendorId?: string; state: 'open' | 'requested' | 'confirmed' | 'shortlist'; budget: number }
export type Event = {
  id: string
  name: string
  type: EventType
  date: string
  time: string
  city: 'London' | 'Lagos' | 'Croydon'
  venue: string
  venueId?: string
  guests: number
  budget: number
  spent: number
  currency: 'GBP' | 'NGN'
  client: string
  planner: string
  status: EventStatus
  photo: MediaKey
  colour: string
  roles: Role[]
  checklistDone: number
  checklistTotal: number
  vibe?: string
}

export const EVENTS: Event[] = [
  {
    id: 'ev-ruby', name: 'Ngozi & Emeka · 40 Years', type: 'Anniversary', date: '2027-02-20', time: '14:00', city: 'London', venue: 'The Orangery, Royal Docks', venueId: 'orangery',
    guests: 180, budget: 18500, spent: 11270, currency: 'GBP', client: 'adaeze', planner: 'tunde', status: 'planning', photo: 'weddingGlasses', colour: '#8C2F39',
    vibe: 'Ruby red and gold, Nigerian buffet, live band for the first dance, afrobeats after 9',
    roles: [
      { category: 'venue', label: 'Venue', vendorId: 'orangery', state: 'confirmed', budget: 3200 },
      { category: 'catering', label: 'Caterer', vendorId: 'iyabola', state: 'requested', budget: 5760 },
      { category: 'photo', label: 'Photographer', vendorId: 'seyilawal', state: 'requested', budget: 1450 },
      { category: 'decor', label: 'Decor & florals', vendorId: 'luxedrape', state: 'confirmed', budget: 2400 },
      { category: 'cake', label: 'Cake', vendorId: 'sugarcraft', state: 'requested', budget: 480 },
      { category: 'dj', label: 'DJ', vendorId: 'djkaytee', state: 'shortlist', budget: 700 },
      { category: 'band', label: 'Live band', vendorId: 'asake', state: 'requested', budget: 1200 },
      { category: 'mc', label: 'MC', state: 'open', budget: 350 },
      { category: 'glam', label: 'Gele & makeup', state: 'open', budget: 320 },
      { category: 'bar', label: 'Mobile bar', state: 'open', budget: 2520 },
    ],
    checklistDone: 14, checklistTotal: 31,
  },
  {
    id: 'ev-engage', name: 'Adaora & Kunle · Engagement Dinner', type: 'Engagement', date: CLOCK.todayIso, time: '18:30', city: 'London', venue: 'Olá Event Hall, Peckham', venueId: 'ola-hall',
    guests: 90, budget: 6400, spent: 6180, currency: 'GBP', client: 'adaora', planner: 'tunde', status: 'live', photo: 'dinnerLaugh', colour: '#1C6B5A',
    roles: [
      { category: 'venue', label: 'Venue', vendorId: 'ola-hall', state: 'confirmed', budget: 1400 },
      { category: 'catering', label: 'Caterer', vendorId: 'iyabola', state: 'confirmed', budget: 2880 },
      { category: 'dj', label: 'DJ', vendorId: 'djkaytee', state: 'confirmed', budget: 450 },
      { category: 'photo', label: 'Photographer', vendorId: 'seyilawal', state: 'confirmed', budget: 650 },
      { category: 'cake', label: 'Cake', vendorId: 'sugarcraft', state: 'confirmed', budget: 320 },
      { category: 'bar', label: 'Mobile bar', vendorId: 'oriki', state: 'confirmed', budget: 480 },
    ],
    checklistDone: 28, checklistTotal: 28,
  },
  {
    id: 'ev-chidera', name: 'Chidera’s 1st Birthday', type: 'Birthday', date: addDays(CLOCK.todayIso, 7), time: '13:00', city: 'Croydon', venue: 'St Andrew’s Hall, Croydon',
    guests: 60, budget: 2900, spent: 2140, currency: 'GBP', client: 'sade', planner: 'tunde', status: 'confirmed', photo: 'birthdayCake', colour: '#C9973F',
    roles: [
      { category: 'catering', label: 'Caterer', vendorId: 'iyabola', state: 'confirmed', budget: 1440 },
      { category: 'cake', label: 'Cake', vendorId: 'sugarcraft', state: 'confirmed', budget: 180 },
      { category: 'dj', label: 'DJ', vendorId: 'djkaytee', state: 'confirmed', budget: 450 },
      { category: 'decor', label: 'Balloons & decor', state: 'open', budget: 400 },
    ],
    checklistDone: 19, checklistTotal: 22,
  },
  {
    id: 'ev-mixer', name: 'Lagos Tech Mixer', type: 'Corporate', date: addDays(CLOCK.todayIso, 14), time: '17:00', city: 'Lagos', venue: 'Eko Convention Hall, VI', venueId: 'ekohall',
    guests: 150, budget: 4800000, spent: 3650000, currency: 'NGN', client: 'ola', planner: 'tunde', status: 'confirmed', photo: 'brightHall', colour: '#123C35',
    roles: [
      { category: 'venue', label: 'Venue', vendorId: 'ekohall', state: 'confirmed', budget: 2800000 },
      { category: 'catering', label: 'Caterer', vendorId: 'jollofco', state: 'confirmed', budget: 1425000 },
      { category: 'dj', label: 'DJ', vendorId: 'djlade', state: 'requested', budget: 250000 },
      { category: 'photo', label: 'Photographer', state: 'open', budget: 350000 },
    ],
    checklistDone: 11, checklistTotal: 18,
  },
  {
    id: 'ov-trad', name: 'Ola & Tomi · Traditional Wedding', type: 'Traditional wedding', date: '2026-12-12', time: '11:00', city: 'Lagos', venue: 'Eko Convention Hall, VI', venueId: 'ekohall',
    guests: 400, budget: 14500000, spent: 9800000, currency: 'NGN', client: 'tobi', planner: 'tunde', status: 'confirmed', photo: 'weddingConfetti', colour: '#5B2A86',
    roles: [
      { category: 'venue', label: 'Venue', vendorId: 'ekohall', state: 'confirmed', budget: 2800000 },
      { category: 'catering', label: 'Caterer', vendorId: 'jollofco', state: 'confirmed', budget: 3800000 },
      { category: 'decor', label: 'Decor & florals', vendorId: 'bloom', state: 'confirmed', budget: 650000 },
      { category: 'dj', label: 'DJ', vendorId: 'djlade', state: 'confirmed', budget: 250000 },
      { category: 'photo', label: 'Photographer', vendorId: 'lensoflagos', state: 'requested', budget: 350000 },
      { category: 'cake', label: 'Cake', vendorId: 'gracecakes', state: 'confirmed', budget: 85000 },
      { category: 'mc', label: 'MC', state: 'open', budget: 200000 },
    ],
    checklistDone: 23, checklistTotal: 34,
  },
  {
    id: 'ev-ade', name: 'Ade’s 50th', type: 'Birthday', date: '2027-01-16', time: '18:00', city: 'London', venue: 'Olá Event Hall, Peckham', venueId: 'ola-hall',
    guests: 120, budget: 7200, spent: 2250, currency: 'GBP', client: 'kunle', planner: 'tunde', status: 'planning', photo: 'tipiDance', colour: '#1F4E79',
    roles: [
      { category: 'venue', label: 'Venue', vendorId: 'ola-hall', state: 'requested', budget: 1400 },
      { category: 'catering', label: 'Caterer', state: 'shortlist', budget: 3840 },
      { category: 'dj', label: 'DJ', vendorId: 'djkaytee', state: 'confirmed', budget: 700 },
      { category: 'mc', label: 'MC', vendorId: 'mcchuks', state: 'confirmed', budget: 350 },
    ],
    checklistDone: 6, checklistTotal: 24,
  },
  {
    id: 'ev-bisi', name: 'Bisi & Dami · White Wedding', type: 'Wedding', date: '2027-03-27', time: '12:00', city: 'London', venue: 'The Orangery, Royal Docks', venueId: 'orangery',
    guests: 220, budget: 32000, spent: 4100, currency: 'GBP', client: 'bisi', planner: 'tunde', status: 'planning', photo: 'weddingBalloons', colour: '#B5536A',
    roles: [
      { category: 'venue', label: 'Venue', vendorId: 'orangery', state: 'confirmed', budget: 3200 },
      { category: 'catering', label: 'Caterer', state: 'open', budget: 9900 },
      { category: 'photo', label: 'Photographer', vendorId: 'seyilawal', state: 'requested', budget: 1450 },
      { category: 'decor', label: 'Decor & florals', state: 'open', budget: 4000 },
    ],
    checklistDone: 3, checklistTotal: 36,
  },
  {
    id: 'ev-nkechi', name: 'Nkechi’s Baby Shower', type: 'Baby shower', date: '2026-10-31', time: '14:00', city: 'London', venue: 'Private residence, Ilford',
    guests: 45, budget: 1800, spent: 1760, currency: 'GBP', client: 'nkechi', planner: 'tunde', status: 'done', photo: 'balloons', colour: '#7A8F5A',
    roles: [
      { category: 'catering', label: 'Caterer', vendorId: 'iyabola', state: 'confirmed', budget: 1080 },
      { category: 'cake', label: 'Cake', vendorId: 'sugarcraft', state: 'confirmed', budget: 180 },
    ],
    checklistDone: 16, checklistTotal: 16,
  },
]
export const eventById = (id: string) => EVENTS.find((e) => e.id === id) ?? EVENTS[0]
export const RUBY = EVENTS[0]
export const TONIGHT = EVENTS[1]

/* ── Booking requests: what a client or planner sends a vendor ── */
export type RequestState = 'requested' | 'accepted' | 'declined' | 'proposed' | 'confirmed' | 'completed' | 'cancelled'
export type BookingRequest = {
  id: string
  vendorId: string
  eventId: string
  by: string
  packageId: string
  date: string
  slot: string
  headcount: number
  amount: number
  state: RequestState
  sentMinutesAgo: number
  note?: string
  proposedDate?: string
}

export const REQUESTS: BookingRequest[] = [
  { id: 'rq1', vendorId: 'iyabola', eventId: 'ev-ruby', by: 'tunde', packageId: 'buffet-premium', date: '2027-02-20', slot: '13:00 – 23:00', headcount: 180, amount: 5760, state: 'requested', sentMinutesAgo: 47, note: 'Premium buffet for 180 with a vegetarian table of 20. Service staff from 13:00. Venue is The Orangery, Royal Docks.' },
  { id: 'rq2', vendorId: 'ola-hall', eventId: 'ev-ade', by: 'tunde', packageId: 'hall-day', date: '2027-01-16', slot: '10:00 – 01:00', headcount: 120, amount: 1400, state: 'requested', sentMinutesAgo: 190, note: 'Ade’s 50th. Full day hire; caterer to be confirmed, may take the Hall + buffet package.' },
  { id: 'rq3', vendorId: 'iyabola', eventId: 'ev-chidera', by: 'tunde', packageId: 'buffet-classic', date: addDays(CLOCK.todayIso, 7), slot: '12:00 – 18:00', headcount: 60, amount: 1440, state: 'confirmed', sentMinutesAgo: 60 * 24 * 12 },
  { id: 'rq4', vendorId: 'iyabola', eventId: 'ev-engage', by: 'tunde', packageId: 'buffet-premium', date: CLOCK.todayIso, slot: '18:00 – 23:30', headcount: 90, amount: 2880, state: 'confirmed', sentMinutesAgo: 60 * 24 * 26 },
  { id: 'rq5', vendorId: 'iyabola', eventId: 'ov-trad', by: 'ronke', packageId: 'owambe', date: '2026-12-12', slot: '11:00 – 22:00', headcount: 300, amount: 13500, state: 'requested', sentMinutesAgo: 60 * 5, note: 'Traditional wedding in Woolwich, 300 guests, full owambe service. Can you do 12 Dec?' },
  { id: 'rq6', vendorId: 'seyilawal', eventId: 'ev-ruby', by: 'tunde', packageId: 'ph-10', date: '2027-02-20', slot: '12:00 – 23:00', headcount: 180, amount: 1450, state: 'requested', sentMinutesAgo: 60 * 3 },
  { id: 'rq7', vendorId: 'sugarcraft', eventId: 'ev-ruby', by: 'adaeze', packageId: 'cake-4', date: '2027-02-20', slot: 'Delivery by 12:00', headcount: 180, amount: 480, state: 'requested', sentMinutesAgo: 60 * 26 },
  { id: 'rq8', vendorId: 'asake', eventId: 'ev-ruby', by: 'tunde', packageId: 'band-2', date: '2027-02-20', slot: '19:00 – 21:30', headcount: 180, amount: 1200, state: 'requested', sentMinutesAgo: 60 * 49 },
  { id: 'rq9', vendorId: 'luxedrape', eventId: 'ev-ruby', by: 'tunde', packageId: 'decor-full', date: '2027-02-20', slot: 'Setup from 08:00', headcount: 180, amount: 2400, state: 'confirmed', sentMinutesAgo: 60 * 24 * 9 },
  { id: 'rq10', vendorId: 'orangery', eventId: 'ev-ruby', by: 'adaeze', packageId: 'or-day', date: '2027-02-20', slot: '09:00 – 00:00', headcount: 180, amount: 3200, state: 'confirmed', sentMinutesAgo: 60 * 24 * 31 },
  { id: 'rq11', vendorId: 'djkaytee', eventId: 'ev-engage', by: 'tunde', packageId: 'dj-5h', date: CLOCK.todayIso, slot: '19:00 – 00:00', headcount: 90, amount: 450, state: 'confirmed', sentMinutesAgo: 60 * 24 * 20 },
  { id: 'rq12', vendorId: 'iyabola', eventId: 'ev-nkechi', by: 'tunde', packageId: 'buffet-classic', date: '2026-10-31', slot: '13:00 – 18:00', headcount: 45, amount: 1080, state: 'completed', sentMinutesAgo: 60 * 24 * 40 },
  { id: 'rq13', vendorId: 'iyabola', eventId: 'ev-bisi', by: 'bisi', packageId: 'owambe', date: '2027-03-27', slot: '11:00 – 23:00', headcount: 220, amount: 9900, state: 'declined', sentMinutesAgo: 60 * 24 * 3, note: 'Declined: the hall is booked for a wedding on 27 Mar and the kitchen is at capacity.' },
  { id: 'rq14', vendorId: 'ola-hall', eventId: 'ev-chidera', by: 'sade', packageId: 'hall-eve', date: addDays(CLOCK.todayIso, 13), slot: '17:00 – 01:00', headcount: 60, amount: 850, state: 'proposed', sentMinutesAgo: 60 * 24 * 2, proposedDate: addDays(CLOCK.todayIso, 14), note: 'Proposed Sunday instead: Saturday is held for another family.' },
  { id: 'rq15', vendorId: 'djlade', eventId: 'ev-mixer', by: 'tunde', packageId: 'lade-full', date: addDays(CLOCK.todayIso, 14), slot: '17:00 – 23:00', headcount: 150, amount: 250000, state: 'requested', sentMinutesAgo: 60 * 8 },
  { id: 'rq16', vendorId: 'lensoflagos', eventId: 'ov-trad', by: 'tunde', packageId: 'lol-full', date: '2026-12-12', slot: '09:00 – 22:00', headcount: 400, amount: 350000, state: 'requested', sentMinutesAgo: 60 * 30 },
  { id: 'rq17', vendorId: 'iyabola', eventId: 'ev-ade', by: 'kunle', packageId: 'hall-plus', date: '2027-01-16', slot: '18:00 – 01:00', headcount: 120, amount: 6960, state: 'requested', sentMinutesAgo: 60 * 24 * 1 + 30, note: 'Hall + Premium buffet for Ade’s 50th. Tunde is our planner.' },
]
export const requestById = (id: string) => REQUESTS.find((r) => r.id === id) ?? REQUESTS[0]
export const requestsForVendor = (ownerId: string, vendorIds: string[]) => REQUESTS.filter((r) => vendorIds.includes(r.vendorId) && ownerId)
export const requestsForEvent = (eventId: string) => REQUESTS.filter((r) => r.eventId === eventId)

/* ── Guests ── */
export type Rsvp = 'yes' | 'no' | 'pending'
export type Guest = { id: string; name: string; group: string; table?: string; rsvp: Rsvp; plusOne?: boolean; dietary?: string; qr: string; photo?: MediaKey; phone: string }

const GROUPS_RUBY = ['Family', 'Church', 'Emeka’s colleagues', 'Ngozi’s friends', 'Neighbours', 'Kids']
const RUBY_NAMES = [
  ['Chioma Nwosu', 'Family', 'Table 1', 'yes', 'chioma'], ['Obi Nwosu', 'Family', 'Table 1', 'yes', 'obi'], ['Uncle Ikenna Nwosu', 'Family', 'Table 1', 'yes'], ['Aunty Ebele Okafor', 'Family', 'Table 2', 'yes'],
  ['Chidi Okonkwo', 'Family', 'Table 2', 'pending'], ['Ifeoma Okonkwo', 'Family', 'Table 2', 'yes'], ['Pastor Femi Adeyemi', 'Church', 'Table 3', 'yes'], ['Mrs Adeyemi', 'Church', 'Table 3', 'yes'],
  ['Deaconess Grace Udo', 'Church', 'Table 3', 'pending'], ['Brother Sam Oladele', 'Church', 'Table 4', 'no'], ['Ife Balogun', 'Emeka’s colleagues', 'Table 5', 'yes', 'ife'], ['Amaka Eze', 'Ngozi’s friends', 'Table 6', 'yes', 'amaka'],
  ['Yemi Adesanya', 'Ngozi’s friends', 'Table 6', 'yes', 'yemi'], ['Sade Ojo', 'Ngozi’s friends', 'Table 6', 'pending', 'sade'], ['Uche Nnamdi', 'Emeka’s colleagues', 'Table 5', 'yes', 'uche'], ['Nneka Obi', 'Neighbours', 'Table 7', 'yes', 'nneka'],
  ['Tayo Akinyemi', 'Neighbours', 'Table 7', 'no', 'tayo'], ['Zara Mensah', 'Ngozi’s friends', 'Table 8', 'yes', 'zara'], ['Lola Fadipe', 'Ngozi’s friends', 'Table 8', 'pending', 'lola'], ['Ebuka Nwankwo', 'Emeka’s colleagues', 'Table 5', 'yes', 'ebuka'],
  ['Ruth Chukwu', 'Church', 'Table 4', 'yes', 'ruth'], ['Mr & Mrs Oyelaran', 'Neighbours', 'Table 7', 'yes'], ['Dr Kelechi Anya', 'Emeka’s colleagues', 'Table 9', 'pending'], ['Nkem & kids', 'Kids', 'Kids table', 'yes'],
] as const

export const RUBY_GUESTS: Guest[] = RUBY_NAMES.map((g, i) => ({
  id: `g${i + 1}`, name: g[0], group: g[1], table: g[2], rsvp: g[3] as Rsvp, plusOne: i % 3 === 0, dietary: i % 7 === 0 ? 'Vegetarian' : i % 11 === 0 ? 'No pork' : undefined,
  qr: `EDR-RUBY-${String(1041 + i * 7).padStart(4, '0')}`, photo: g[4] as MediaKey | undefined, phone: `+44 7700 9003${String(10 + i).padStart(2, '0')}`,
}))
export const RUBY_TOTALS = { invited: 180, yes: 112, no: 23, pending: 45, invitesSent: 135, tables: 18, groups: GROUPS_RUBY }
export const RUBY_GROUPS = GROUPS_RUBY

/** Tonight's engagement dinner: 90 guests; 41 scanned in before the demo starts. */
const TONIGHT_NAMES = ['Adaora Okeke', 'Kunle Adewale', 'Mrs Funke Okeke', 'Chief Adewale', 'Bisi Alabi', 'Dami Alabi', 'Ronke Adeyinka', 'Ife Balogun', 'Amaka Eze', 'Yemi Adesanya', 'Uche Nnamdi', 'Nneka Obi', 'Tayo Akinyemi', 'Zara Mensah', 'Lola Fadipe', 'Ebuka Nwankwo', 'Ruth Chukwu', 'Sade Ojo', 'Chidi Okonkwo', 'Ifeoma Okonkwo', 'Tunji Bello', 'Morenike Bello', 'Kemi Olawale', 'Seun Ajayi', 'Tope Ajayi', 'Bimpe Ladipo', 'Dotun Ladipo', 'Hauwa Sani', 'Emeka Nwosu', 'Ngozi Nwosu']
const TONIGHT_PHOTOS: (MediaKey | undefined)[] = ['adaora', 'kunle', undefined, undefined, 'bisi', 'dami', 'ronke', 'ife', 'amaka', 'yemi', 'uche', 'nneka', 'tayo', 'zara', 'lola', 'ebuka', 'ruth', 'sade']
export const TONIGHT_GUESTS: Guest[] = TONIGHT_NAMES.map((name, i) => ({
  id: `t${i + 1}`, name, group: i < 4 ? 'Couple & parents' : i < 12 ? 'Adaora’s friends' : i < 20 ? 'Kunle’s friends' : 'Family', table: `Table ${1 + Math.floor(i / 8)}`, rsvp: 'yes', plusOne: i % 4 === 1,
  qr: `EDR-ENG-${String(2201 + i * 3).padStart(4, '0')}`, photo: TONIGHT_PHOTOS[i], phone: `+44 7700 9004${String(10 + i).padStart(2, '0')}`,
}))
/** ids already scanned before the demo opens (first 41 of 90; the list shows the first 30 names, the rest are "+ 60 more") */
export const TONIGHT_CHECKED_IN = TONIGHT_GUESTS.slice(0, 18).map((g) => g.id)
export const TONIGHT_TOTALS = { expected: 90, checkedIn: 41, walkIns: 2, flagged: 1, doors: '18:30' }
/** scan log: last events on the door, newest first (minutes ago) */
export const SCAN_LOG: { id: string; guest: string; result: 'ok' | 'duplicate' | 'walkin' | 'notfound'; minutesAgo: number; table: string }[] = [
  { id: 's1', guest: 'Ruth Chukwu', result: 'ok', minutesAgo: 1, table: 'Table 3' },
  { id: 's2', guest: 'Ebuka Nwankwo', result: 'ok', minutesAgo: 2, table: 'Table 2' },
  { id: 's3', guest: 'Lola Fadipe', result: 'duplicate', minutesAgo: 3, table: 'Table 2' },
  { id: 's4', guest: 'Mrs Funke Adeyemi (+1)', result: 'walkin', minutesAgo: 5, table: 'Table 9' },
  { id: 's5', guest: 'Zara Mensah', result: 'ok', minutesAgo: 6, table: 'Table 2' },
  { id: 's6', guest: 'Tayo Akinyemi', result: 'ok', minutesAgo: 8, table: 'Table 2' },
  { id: 's7', guest: 'Unknown code', result: 'notfound', minutesAgo: 9, table: '–' },
  { id: 's8', guest: 'Nneka Obi', result: 'ok', minutesAgo: 10, table: 'Table 2' },
  { id: 's9', guest: 'Uche Nnamdi', result: 'ok', minutesAgo: 11, table: 'Table 2' },
  { id: 's10', guest: 'Yemi Adesanya', result: 'ok', minutesAgo: 12, table: 'Table 2' },
]

/* ── Run of show / checklist for the ruby anniversary ── */
export type Task = { id: string; title: string; due: string; done: boolean; owner: 'tunde' | 'adaeze' | 'vendor'; role?: CategoryId }
export const RUBY_TASKS: Task[] = [
  { id: 'k1', title: 'Confirm venue and pay deposit', due: '2026-10-28', done: true, owner: 'adaeze', role: 'venue' },
  { id: 'k2', title: 'Assign planner', due: '2026-10-30', done: true, owner: 'adaeze' },
  { id: 'k3', title: 'Decor mood board approved', due: '2026-11-12', done: true, owner: 'tunde', role: 'decor' },
  { id: 'k4', title: 'Caterer request sent', due: '2026-11-21', done: true, owner: 'tunde', role: 'catering' },
  { id: 'k5', title: 'Caterer confirmed', due: '2026-11-28', done: false, owner: 'vendor', role: 'catering' },
  { id: 'k6', title: 'Photographer confirmed', due: '2026-11-28', done: false, owner: 'vendor', role: 'photo' },
  { id: 'k7', title: 'Cake tasting box delivered', due: '2026-12-05', done: false, owner: 'vendor', role: 'cake' },
  { id: 'k8', title: 'Choose DJ (Kaytee shortlisted)', due: '2026-12-05', done: false, owner: 'tunde', role: 'dj' },
  { id: 'k9', title: 'Band first-dance song agreed', due: '2026-12-12', done: false, owner: 'adaeze', role: 'band' },
  { id: 'k10', title: 'Send QR invites (135 of 180 sent)', due: '2026-12-20', done: false, owner: 'adaeze' },
  { id: 'k11', title: 'Book MC', due: '2027-01-09', done: false, owner: 'tunde', role: 'mc' },
  { id: 'k12', title: 'Gele & makeup for Mum and sisters', due: '2027-01-16', done: false, owner: 'tunde', role: 'glam' },
  { id: 'k13', title: 'Final headcount to caterer', due: '2027-02-06', done: false, owner: 'tunde', role: 'catering' },
  { id: 'k14', title: 'Table plan locked', due: '2027-02-13', done: false, owner: 'adaeze' },
]
export const RUN_OF_SHOW: { time: string; item: string; who: string }[] = [
  { time: '08:00', item: 'Decor setup begins', who: 'Luxe Drape' },
  { time: '12:00', item: 'Cake delivered and set', who: 'Sugarcraft' },
  { time: '13:00', item: 'Caterer on site', who: 'Ìyá Bola' },
  { time: '14:00', item: 'Guests arrive · QR check-in', who: 'Tunde + 2' },
  { time: '15:00', item: 'Grand entrance · MC opens', who: 'MC' },
  { time: '15:30', item: 'Buffet opens', who: 'Ìyá Bola' },
  { time: '17:00', item: 'Toasts and tributes', who: 'Family' },
  { time: '17:45', item: 'Cake cutting', who: 'Ngozi & Emeka' },
  { time: '18:00', item: 'First dance · live band set 1', who: 'Asake Live' },
  { time: '19:30', item: 'Band set 2', who: 'Asake Live' },
  { time: '21:00', item: 'DJ takes over', who: 'DJ' },
  { time: '23:00', item: 'Carriages', who: 'Tunde' },
]

/* ── Messages ── */
export type Message = { id: string; from: string; text: string; minutesAgo: number; attachment?: MediaKey }
export type Thread = { id: string; participants: string[]; eventId: string; subject: string; unread: number; messages: Message[] }
export const THREADS: Thread[] = [
  {
    id: 'th1', participants: ['adaeze', 'tunde'], eventId: 'ev-ruby', subject: 'Ngozi & Emeka · 40 Years', unread: 2,
    messages: [
      { id: 'm1', from: 'tunde', text: 'Decor mood board is approved, Kemi starts sourcing the ruby drapes this week.', minutesAgo: 60 * 24 * 2 },
      { id: 'm2', from: 'adaeze', text: 'Love it. Mum wants the gold a bit warmer, less yellow.', minutesAgo: 60 * 24 * 2 - 40 },
      { id: 'm3', from: 'tunde', text: 'Noted, I’ll pass it on. Caterer request has gone to Ìyá Bola: Premium buffet for 180, vegetarian table of 20.', minutesAgo: 47 },
      { id: 'm4', from: 'tunde', text: 'Also sent the photographer request to Seyi. Both usually reply within a couple of hours.', minutesAgo: 44, attachment: 'buffetTrays' },
    ],
  },
  {
    id: 'th2', participants: ['adaeze', 'funmi'], eventId: 'ev-ruby', subject: 'Sugarcraft by Funmi', unread: 1,
    messages: [
      { id: 'm5', from: 'adaeze', text: 'Hi Funmi, I’ve sent a request for the 4-tier showpiece for 20 Feb. Ruby and gold if possible.', minutesAgo: 60 * 26 },
      { id: 'm6', from: 'funmi', text: 'Hi Adaeze! Ruby and gold is beautiful. I’ll post a tasting box this week: red velvet, vanilla and chocolate.', minutesAgo: 60 * 3 },
    ],
  },
  {
    id: 'th3', participants: ['tunde', 'bola'], eventId: 'ev-engage', subject: 'Tonight · Adaora & Kunle', unread: 1,
    messages: [
      { id: 'm7', from: 'tunde', text: 'Doors opened 18:30, 41 guests in. Can the small chops come out at 19:15 instead of 19:30?', minutesAgo: 9 },
      { id: 'm8', from: 'bola', text: 'Yes, 19:15 works. Asun is on the pass now.', minutesAgo: 4 },
    ],
  },
  {
    id: 'th4', participants: ['tunde', 'kayode'], eventId: 'ev-ruby', subject: 'DJ Kaytee · 20 Feb', unread: 0,
    messages: [
      { id: 'm9', from: 'tunde', text: 'Kaytee, holding you on the shortlist for 20 Feb, Royal Docks. Full event package. Will confirm after the band is locked.', minutesAgo: 60 * 24 * 4 },
      { id: 'm10', from: 'kayode', text: 'No wahala. 20 Feb is free on my side, I’ll keep it open till the 5th.', minutesAgo: 60 * 24 * 4 - 30 },
    ],
  },
  {
    id: 'th5', participants: ['tunde', 'dapo'], eventId: 'ev-ruby', subject: 'The Orangery · access times', unread: 0,
    messages: [
      { id: 'm11', from: 'dapo', text: 'Confirming access from 08:00 for decor on 20 Feb. Loading bay is on the east side.', minutesAgo: 60 * 24 * 6 },
      { id: 'm12', from: 'tunde', text: 'Perfect, thanks Dapo.', minutesAgo: 60 * 24 * 6 - 15 },
    ],
  },
  {
    id: 'th6', participants: ['tunde', 'sade'], eventId: 'ev-chidera', subject: 'Chidera’s 1st · next Saturday', unread: 1,
    messages: [
      { id: 'm13', from: 'sade', text: 'Can we add a balloon arch at the entrance? Budget around £400.', minutesAgo: 60 * 6 },
    ],
  },
  {
    id: 'th7', participants: ['bola', 'ronke'], eventId: 'ov-trad', subject: 'Traditional wedding · 12 Dec', unread: 1,
    messages: [
      { id: 'm14', from: 'ronke', text: 'Hi Bola, 300 guests in Woolwich on 12 Dec, full owambe service. Are you free?', minutesAgo: 60 * 5 },
    ],
  },
  {
    id: 'th8', participants: ['bola', 'kunle'], eventId: 'ev-ade', subject: 'Ade’s 50th · hall + buffet', unread: 0,
    messages: [
      { id: 'm15', from: 'kunle', text: 'Request sent for 16 Jan, hall plus Premium buffet for 120. Tunde is planning.', minutesAgo: 60 * 25 },
      { id: 'm16', from: 'bola', text: 'Received, Kunle. I’ll confirm once I check the hall diary with Tunde’s other request.', minutesAgo: 60 * 24 },
    ],
  },
  {
    id: 'th9', participants: ['adaeze', 'bola'], eventId: 'ev-ruby', subject: 'Ìyá Bola Catering', unread: 0,
    messages: [
      { id: 'm17', from: 'adaeze', text: 'Hi Bola, Tunde has sent you our request for 20 Feb. Is a plantain and moi moi station possible for the vegetarian table?', minutesAgo: 60 * 24 * 1 },
      { id: 'm18', from: 'bola', text: 'Hello Adaeze! Yes, that is one of my favourites. I will reply to Tunde’s request today.', minutesAgo: 60 * 20 },
    ],
  },
]
export const threadById = (id: string) => THREADS.find((t) => t.id === id) ?? THREADS[0]
export const threadsFor = (person: string) => THREADS.filter((t) => t.participants.includes(person))

/* ── Notifications, per persona ── */
export type Notice = { id: string; title: string; body: string; minutesAgo: number; unread: boolean; kind: 'booking' | 'message' | 'guest' | 'verify' | 'system' | 'review'; to?: string }
export const CLIENT_NOTICES: Notice[] = [
  { id: 'n1', title: 'Tunde sent the caterer request', body: 'Ìyá Bola Catering · Premium buffet for 180 · £5,760. Usually replies within 2 hours.', minutesAgo: 47, unread: true, kind: 'booking', to: 'app.bookings' },
  { id: 'n2', title: 'Funmi replied', body: 'Tasting box this week: red velvet, vanilla and chocolate.', minutesAgo: 60 * 3, unread: true, kind: 'message', to: 'app.thread' },
  { id: 'n3', title: '3 new RSVPs', body: 'Amaka Eze, Zara Mensah and Ruth Chukwu said yes. 112 of 180 confirmed.', minutesAgo: 60 * 5, unread: true, kind: 'guest', to: 'app.guests' },
  { id: 'n4', title: 'Decor confirmed', body: 'Luxe Drape Decor accepted Full styling · £2,400 · setup from 08:00.', minutesAgo: 60 * 24 * 2, unread: false, kind: 'booking', to: 'app.bookings' },
  { id: 'n5', title: 'Photographer request sent', body: 'Seyi Lawal Photography · Full day + video · £1,450.', minutesAgo: 60 * 3 + 10, unread: false, kind: 'booking', to: 'app.bookings' },
  { id: 'n6', title: 'Pastor Adeyemi RSVP’d yes (+1)', body: 'Added to Table 3.', minutesAgo: 60 * 24 * 1, unread: false, kind: 'guest', to: 'app.guests' },
  { id: 'n7', title: 'Brother Sam declined', body: 'He will be in Lagos that week.', minutesAgo: 60 * 24 * 1 + 50, unread: false, kind: 'guest', to: 'app.guests' },
  { id: 'n8', title: 'Invites sent', body: '135 QR invites delivered by WhatsApp and email. 45 still to send.', minutesAgo: 60 * 24 * 3, unread: false, kind: 'guest', to: 'app.invite' },
  { id: 'n9', title: 'Venue confirmed', body: 'The Orangery, Royal Docks · Full day hire · £3,200.', minutesAgo: 60 * 24 * 31, unread: false, kind: 'booking', to: 'app.bookings' },
  { id: 'n10', title: 'Tunde Bakare is your planner', body: 'Bakare Events accepted. You’ll see every booking and update here.', minutesAgo: 60 * 24 * 22, unread: false, kind: 'system', to: 'app.planner' },
  { id: 'n11', title: 'Welcome to Edera', body: 'Your event is set up. Add your guests when you are ready.', minutesAgo: 60 * 24 * 24, unread: false, kind: 'system', to: 'app.event' },
]
export const PRO_NOTICES: Notice[] = [
  { id: 'p1', title: 'Duplicate scan at the door', body: 'Lola Fadipe’s code was scanned twice. Check the +1.', minutesAgo: 3, unread: true, kind: 'guest', to: 'pro.checkin' },
  { id: 'p2', title: 'Bola replied', body: 'Small chops at 19:15. Asun is on the pass now.', minutesAgo: 4, unread: true, kind: 'message', to: 'pro.messages' },
  { id: 'p3', title: 'Walk-in added', body: 'Mrs Funke Adeyemi (+1) seated at Table 9.', minutesAgo: 5, unread: true, kind: 'guest', to: 'pro.checkin' },
  { id: 'p4', title: 'Request waiting on Bola', body: 'Ngozi & Emeka · Premium buffet · £5,760 · sent 47m ago.', minutesAgo: 47, unread: false, kind: 'booking', to: 'pro.requests' },
  { id: 'p5', title: 'Sade asked for a balloon arch', body: 'Chidera’s 1st · budget about £400.', minutesAgo: 60 * 6, unread: true, kind: 'message', to: 'pro.messages' },
  { id: 'p6', title: 'Olá Hall proposed a new date', body: 'Chidera’s 1st · Sunday instead of Saturday.', minutesAgo: 60 * 24 * 2, unread: false, kind: 'booking', to: 'pro.requests' },
  { id: 'p7', title: 'Verification renewed', body: 'Your Verified Professional badge runs to Nov 2027.', minutesAgo: 60 * 24 * 5, unread: false, kind: 'verify', to: 'pro.verification' },
  { id: 'p8', title: 'New review · 5 stars', body: 'Kunle Adewale: “He found a hall, a caterer and a band in a week.”', minutesAgo: 60 * 24 * 27, unread: false, kind: 'review', to: 'pro.profile' },
]
export const VENDOR_NOTICES: Notice[] = [
  { id: 'v1', title: 'New request · Bakare Events', body: 'Ngozi & Emeka · 20 Feb 2027 · Premium buffet for 180 · £5,760.', minutesAgo: 47, unread: true, kind: 'booking', to: 'vendor.request' },
  { id: 'v2', title: 'Tunde messaged', body: 'Can the small chops come out at 19:15?', minutesAgo: 9, unread: true, kind: 'message', to: 'vendor.home' },
  { id: 'v3', title: 'New request · Ronke Adeyinka', body: 'Traditional wedding · 12 Dec · Owambe full service for 300 · £13,500. Your hall is booked that day.', minutesAgo: 60 * 5, unread: true, kind: 'booking', to: 'vendor.requests' },
  { id: 'v4', title: 'New request · Kunle Adewale', body: 'Ade’s 50th · 16 Jan · Hall + Premium buffet for 120 · £6,960.', minutesAgo: 60 * 25, unread: false, kind: 'booking', to: 'vendor.requests' },
  { id: 'v5', title: 'New review · 5 stars', body: 'Nkechi Umeh: “The jollof went in twenty minutes.”', minutesAgo: 60 * 24 * 13, unread: false, kind: 'review', to: 'vendor.reviews' },
  { id: 'v6', title: 'Hygiene certificate expires in 112 days', body: 'Upload the renewed FHRS certificate to keep your badge.', minutesAgo: 60 * 24 * 1, unread: false, kind: 'verify', to: 'vendor.verification' },
  { id: 'v7', title: 'Booking completed', body: 'Nkechi’s Baby Shower · 31 Oct · £1,080. Ask for a review.', minutesAgo: 60 * 24 * 20, unread: false, kind: 'booking', to: 'vendor.bookings' },
]
