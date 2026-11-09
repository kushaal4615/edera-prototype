/* ZERO-TYPING DEMO DATA (v4). Every input in the prototype mounts with one
   of these values already in it, so a visitor can walk every flow with taps
   alone. All credentials are dummies; phone numbers use Ofcom's drama range
   (+44 7700 900xxx) and a fictional Nigerian range; the card is Stripe's
   test card. One consistent cast: the same people appear on every platform. */

/* ── Client App: Adaeze ── */
export const DEMO_CLIENT_LOGIN = { email: 'adaeze.nwosu@demo-edera.app', password: 'Demo@2026', remember: true }
export const DEMO_OTP = ['4', '8', '2', '6', '1', '9']
export const DEMO_EVENT = {
  name: 'Ngozi & Emeka · 40 Years',
  type: 'Anniversary',
  date: '2027-02-20',
  time: '14:00',
  city: 'London',
  guests: '180',
  budget: '18500',
  vibe: 'Ruby red and gold, Nigerian buffet, live band for the first dance, afrobeats after 9',
}
export const DEMO_SEARCH = 'Nigerian caterer'
export const DEMO_BOOKING = {
  date: '2027-02-20',
  slot: '14:00 – 23:00',
  packageId: 'buffet-premium',
  headcount: '180',
  note: 'Mixed buffet for 180 with a vegetarian table of 20. Service staff from 13:00, please. Venue is The Orangery, Royal Docks.',
  agree: true,
}
export const DEMO_GUEST = { name: 'Kelechi Okonkwo', phone: '+44 7700 900312', group: 'Family', table: 'Table 4', plusOne: true }
export const DEMO_MESSAGE_CLIENT = 'Hi Tunde, can we move the cake cutting to just after the toasts? Mum wants photos before the band.'
export const DEMO_MESSAGE_VENDOR = 'Hi Bola, is the plantain and moi moi station possible for the vegetarian table?'
export const DEMO_PLANNER_REQUEST = 'Hi, I am planning my parents’ 40th anniversary in London on 20 Feb 2027 for 180 guests. Are you available?'
export const DEMO_REVIEW = { rating: 5, text: 'Tunde and his team ran the day without a single hiccup. Mum cried, Dad danced, the jollof went in 20 minutes.' }

/* ── Planner App: Tunde ── */
export const DEMO_PRO_LOGIN = { email: 'tunde@demo-bakare-events.app', password: 'Demo@2026', remember: true }
export const DEMO_PRO_SEARCH = 'Caterer · 20 Feb · London'
export const DEMO_PRO_REQUEST_NOTE = 'Hello, Bakare Events here. Confirming availability for Sat 20 Feb 2027 at The Orangery, 180 guests, service from 13:00.'
export const DEMO_MANUAL_CHECKIN = 'Okonkwo'
export const DEMO_WALKIN = { name: 'Mrs Funke Adeyemi', party: '2', group: "Adaora's colleagues" }
export const DEMO_PRO_MESSAGE = 'Bola, doors opened 18:30, 41 guests in. Can the small chops come out at 19:15 instead of 19:30?'
export const DEMO_TASK = 'Confirm band soundcheck time with Asake Live'
export const DEMO_PRO_VERIFICATION = { business: 'Bakare Events Ltd', reg: '12947716', idType: 'UK passport', years: '9', portfolio: 'instagram.com/bakareevents' }

/* ── Vendor App: Bola ── */
export const DEMO_VENDOR_LOGIN = { email: 'bola@demo-iyabola.app', password: 'Demo@2026', remember: true }
export const DEMO_DECLINE_REASON = 'Fully booked that day: the hall has a wedding and the kitchen is at capacity. Happy to cater on 20 Dec.'
export const DEMO_PROPOSE = { date: '2026-12-20', note: 'Sunday 20 Dec is free for both the hall and catering.' }
export const DEMO_ACCEPT_NOTE = 'Confirmed. Service staff will be on site from 13:00. Final headcount by 6 Feb, please.'
export const DEMO_LISTING = {
  title: 'Ìyá Bola Catering',
  tagline: 'Nigerian and continental buffets for 40 to 600 guests',
  priceFrom: '32',
  minGuests: '40',
  travel: 'Greater London · M25 · travel beyond quoted',
  about: 'Family-run since 2015. Jollof, fried rice, asun, efo riro, small chops and a continental table on request. Halal options available.',
}
export const DEMO_PACKAGE = { name: 'Premium buffet', price: '32', unit: 'per head', includes: 'Jollof · fried rice · two proteins · efo riro · plantain · moi moi · small chops · service staff' }
export const DEMO_VENDOR_VERIFICATION = { business: 'Ìyá Bola Catering Ltd', reg: '09871223', hygiene: 'FHRS 5 · Southwark · 14 Mar 2026', idType: 'UK driving licence', insurance: 'Public liability · £5m · Hiscox' }
export const DEMO_REVIEW_REPLY = 'Thank you, Nkechi! It was a joy feeding your family. See you at the christening.'
export const DEMO_BLOCK_REASON = 'Family wedding in Lagos'
export const DEMO_VENDOR_MESSAGE = 'Hi Tunde, small chops can come out at 19:15. Asun is on the pass now.'

/* ── Edera Admin: Dave ── */
export const DEMO_ADMIN_LOGIN = { email: 'dave@demo-edera.app', password: 'Demo@2026', role: 'Platform owner' }
export const DEMO_ADMIN_SEARCH = 'Bakare'
export const DEMO_VERIFY_NOTE = 'Companies House record matches. FHRS certificate current. Approved for Verified Professional badge.'
export const DEMO_REJECT_NOTE = 'ID document is cropped: the expiry date is not visible. Please re-upload the full page.'
export const DEMO_BROADCAST = {
  title: 'Edera is live in Lagos',
  body: 'Planners in Lagos can now list availability and take requests. Tell a vendor you trust: verified listings are free during the launch.',
  audience: 'Vendors · Nigeria',
  channel: 'Push + email',
}
export const DEMO_CATEGORY = 'Aso-ebi & fabrics'
export const DEMO_COMMISSION = { rate: '8', freeUntil: '2027-11-01' }
export const DEMO_SUSPEND_REASON = 'Three guests reported the account for no-shows. Suspended pending a call.'

/* ── Shared ── */
export const DEMO_CARD = { number: '4242 4242 4242 4242', expiry: '12/29', cvc: '123', name: 'ADAEZE NWOSU' }
export const DEMO_PHONE_UK = '+44 7700 900123'
export const DEMO_PHONE_NG = '+234 0700 000 0123'
