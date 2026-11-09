import { addDays, CLOCK, type Currency } from './clock'
import type { MediaKey } from './media'

/* The marketplace: vendors and venues in London and Lagos, their packages,
   reviews and availability. Availability is the product's signature: every
   vendor carries a strip of days that are free, held (a request is waiting)
   or booked, so a client can see "when the day is free and when it is
   booked" without contacting anyone. All prices are demo values. */

export type Region = 'uk' | 'ng'
export type CategoryId = 'planner' | 'venue' | 'catering' | 'cake' | 'dj' | 'mc' | 'band' | 'photo' | 'decor' | 'glam' | 'bar'

export const CATEGORIES: { id: CategoryId; label: string; plural: string; photo: MediaKey; count: number }[] = [
  { id: 'venue', label: 'Venue', plural: 'Venues', photo: 'ballroom', count: 184 },
  { id: 'catering', label: 'Caterer', plural: 'Caterers', photo: 'buffetTrays', count: 326 },
  { id: 'planner', label: 'Planner', plural: 'Planners', photo: 'weddingGlasses', count: 142 },
  { id: 'dj', label: 'DJ', plural: 'DJs', photo: 'djClub', count: 211 },
  { id: 'photo', label: 'Photographer', plural: 'Photographers', photo: 'cameraHand', count: 263 },
  { id: 'decor', label: 'Decor & florals', plural: 'Decor & florals', photo: 'barnDrapes', count: 198 },
  { id: 'cake', label: 'Cakes', plural: 'Cakes', photo: 'tieredCake', count: 157 },
  { id: 'mc', label: 'MC', plural: 'MCs', photo: 'micStage', count: 96 },
  { id: 'band', label: 'Live band', plural: 'Live bands', photo: 'concertYellow', count: 71 },
  { id: 'glam', label: 'Gele & makeup', plural: 'Gele & makeup', photo: 'bouquet', count: 134 },
  { id: 'bar', label: 'Mobile bar', plural: 'Mobile bars', photo: 'cocktailPour', count: 88 },
]
export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!

export type Availability = 'free' | 'held' | 'booked' | 'blocked'
export type Package = { id: string; name: string; price: number; unit: 'per head' | 'flat' | 'per hour' | 'per day'; includes: string; popular?: boolean }
export type Review = { id: string; by: string; event: string; date: string; rating: number; text: string; reply?: string }
export type Vendor = {
  id: string
  name: string
  owner: string
  category: CategoryId
  region: Region
  area: string
  currency: Currency
  priceFrom: number
  priceUnit: Package['unit']
  years: number
  rating: number
  reviews: number
  bookings: number
  verified: boolean
  responseTime: string
  capacity?: number
  tags: string[]
  photos: MediaKey[]
  about: string
  packages: Package[]
  /** iso → state, for dates that are not free; everything else is free */
  calendar: Record<string, Availability>
  languages: string[]
  featured?: boolean
}

const d = (n: number) => addDays(CLOCK.todayIso, n)

export const VENDORS: Vendor[] = [
  {
    id: 'iyabola', name: 'Ìyá Bola Catering', owner: 'bola', category: 'catering', region: 'uk', area: 'Peckham, London', currency: 'GBP', priceFrom: 24, priceUnit: 'per head',
    years: 11, rating: 4.9, reviews: 212, bookings: 486, verified: true, responseTime: 'within 2 hours', tags: ['Nigerian', 'Continental', 'Halal options', '40–600 guests'],
    photos: ['buffetTrays', 'grillPlatter', 'stewPan', 'canapes'],
    about: 'Family-run since 2015. Jollof, fried rice, asun, efo riro, small chops and a continental table on request. Service staff included from 100 guests.',
    packages: [
      { id: 'buffet-classic', name: 'Classic buffet', price: 24, unit: 'per head', includes: 'Jollof · fried rice · one protein · plantain · salad' },
      { id: 'buffet-premium', name: 'Premium buffet', price: 32, unit: 'per head', includes: 'Jollof · fried rice · two proteins · efo riro · plantain · moi moi · small chops · service staff', popular: true },
      { id: 'small-chops', name: 'Small chops station', price: 9, unit: 'per head', includes: 'Puff puff · samosa · spring rolls · peppered gizzard · suya skewers' },
      { id: 'owambe', name: 'Owambe full service', price: 45, unit: 'per head', includes: 'Premium buffet · small chops · dessert table · waiters · cutlery and crockery' },
    ],
    calendar: { [d(0)]: 'booked', [d(7)]: 'booked', [d(13)]: 'held', [d(21)]: 'booked', [d(22)]: 'blocked', [d(23)]: 'blocked', [d(24)]: 'blocked', [d(28)]: 'booked', [d(34)]: 'booked', [d(35)]: 'held', [d(42)]: 'booked', [d(57)]: 'booked', [d(63)]: 'held', [d(70)]: 'booked', '2027-02-20': 'held', '2027-02-13': 'booked', '2027-02-27': 'booked', '2027-03-06': 'booked', '2027-03-27': 'booked' },
    languages: ['English', 'Yorùbá'], featured: true,
  },
  {
    id: 'ola-hall', name: 'Olá Event Hall', owner: 'bola', category: 'venue', region: 'uk', area: 'Peckham, London', currency: 'GBP', priceFrom: 1400, priceUnit: 'per day',
    years: 6, rating: 4.7, reviews: 64, bookings: 139, verified: true, responseTime: 'within 2 hours', capacity: 120, tags: ['120 seated', 'In-house catering', 'Licensed until 1am', 'Step-free'],
    photos: ['barnDrapes', 'tableGreenery', 'brightHall'],
    about: 'A 120-seat hall above the kitchen, dressed in white drapes and warm bulbs. Sound system, dance floor and a bridal room. Pairs with Ìyá Bola Catering or bring your own caterer.',
    packages: [
      { id: 'hall-day', name: 'Full day hire', price: 1400, unit: 'per day', includes: '10:00 – 01:00 · tables and chairs · sound · dance floor · bridal room', popular: true },
      { id: 'hall-eve', name: 'Evening hire', price: 850, unit: 'flat', includes: '17:00 – 01:00 · tables and chairs · sound' },
      { id: 'hall-plus', name: 'Hall + Premium buffet', price: 58, unit: 'per head', includes: 'Full day hire · Premium buffet · service staff · min 80 guests' },
    ],
    calendar: { [d(0)]: 'booked', [d(7)]: 'booked', [d(14)]: 'booked', [d(21)]: 'booked', [d(22)]: 'blocked', [d(23)]: 'blocked', [d(24)]: 'blocked', [d(28)]: 'booked', [d(35)]: 'held', [d(49)]: 'booked', '2027-02-13': 'booked' },
    languages: ['English', 'Yorùbá'],
  },
  {
    id: 'orangery', name: 'The Orangery, Royal Docks', owner: 'dapo', category: 'venue', region: 'uk', area: 'Royal Docks, London', currency: 'GBP', priceFrom: 3200, priceUnit: 'per day',
    years: 14, rating: 4.8, reviews: 171, bookings: 402, verified: true, responseTime: 'within a day', capacity: 250, tags: ['250 seated', 'Waterside', 'Parking 80', 'Outside caterers welcome'],
    photos: ['ballroom', 'glassHall', 'weddingGlasses', 'londonThames'],
    about: 'A glass-roofed hall on the water with room for 250 seated and 350 standing. Outside caterers welcome, dedicated events manager on the day.',
    packages: [
      { id: 'or-day', name: 'Full day hire', price: 3200, unit: 'per day', includes: '09:00 – 00:00 · furniture · lighting rig · events manager · 80 parking', popular: true },
      { id: 'or-half', name: 'Half day', price: 1900, unit: 'flat', includes: '6 hours · furniture · events manager' },
    ],
    calendar: { '2027-02-20': 'booked', '2027-02-06': 'booked', '2027-02-27': 'booked', '2027-03-13': 'booked', [d(7)]: 'booked', [d(14)]: 'booked', [d(28)]: 'held' },
    languages: ['English'], featured: true,
  },
  {
    id: 'djkaytee', name: 'DJ Kaytee', owner: 'kayode', category: 'dj', region: 'uk', area: 'Lewisham, London', currency: 'GBP', priceFrom: 450, priceUnit: 'flat',
    years: 7, rating: 4.8, reviews: 156, bookings: 318, verified: true, responseTime: 'within an hour', tags: ['Afrobeats', 'Amapiano', 'Old-school', 'Own sound & lights'],
    photos: ['djClub', 'djMixer', 'danceFloor'],
    about: 'Afrobeats, amapiano, highlife and the old-school set your aunties want. Own PA for up to 300, lights and a wireless mic for the MC.',
    packages: [
      { id: 'dj-5h', name: '5-hour set', price: 450, unit: 'flat', includes: 'DJ · PA for 150 · lights · wireless mic' },
      { id: 'dj-8h', name: 'Full event (8h)', price: 700, unit: 'flat', includes: 'DJ · PA for 300 · lights · wireless mics ×2 · first-dance edit', popular: true },
    ],
    calendar: { [d(0)]: 'booked', [d(7)]: 'booked', [d(14)]: 'held', [d(21)]: 'booked', [d(28)]: 'booked', [d(35)]: 'booked', '2027-02-20': 'free', '2027-02-13': 'booked', '2027-02-14': 'booked' },
    languages: ['English', 'Pidgin'], featured: true,
  },
  {
    id: 'sugarcraft', name: 'Sugarcraft by Funmi', owner: 'funmi', category: 'cake', region: 'uk', area: 'Greenwich, London', currency: 'GBP', priceFrom: 180, priceUnit: 'flat',
    years: 6, rating: 5.0, reviews: 98, bookings: 241, verified: true, responseTime: 'within 3 hours', tags: ['Tiered cakes', 'Sugar flowers', 'Dessert tables', 'Delivery & setup'],
    photos: ['tieredCake', 'chocolateCake', 'dripCake', 'cakeSlice'],
    about: 'Celebration cakes with hand-made sugar flowers. Tasting box posted before you decide. Delivery and on-site setup across London.',
    packages: [
      { id: 'cake-3', name: '3-tier celebration cake', price: 320, unit: 'flat', includes: 'Serves 90 · two flavours · sugar flowers · delivery' , popular: true },
      { id: 'cake-4', name: '4-tier showpiece', price: 480, unit: 'flat', includes: 'Serves 150 · three flavours · gold leaf · setup' },
      { id: 'dessert', name: 'Dessert table', price: 6, unit: 'per head', includes: 'Cupcakes · chin chin · puff puff · macarons · stand hire' },
    ],
    calendar: { [d(7)]: 'booked', [d(14)]: 'booked', [d(21)]: 'booked', [d(28)]: 'booked', '2027-02-20': 'held', '2027-02-13': 'booked' },
    languages: ['English', 'Yorùbá'],
  },
  {
    id: 'luxedrape', name: 'Luxe Drape Decor', owner: 'kemi', category: 'decor', region: 'uk', area: 'Barking, London', currency: 'GBP', priceFrom: 900, priceUnit: 'flat',
    years: 8, rating: 4.7, reviews: 143, bookings: 276, verified: true, responseTime: 'within a day', tags: ['Drapes', 'Florals', 'Stage & backdrop', 'Table styling'],
    photos: ['barnDrapes', 'tableGreenery', 'tableFlowers', 'bouquet'],
    about: 'Ceiling drapes, stage backdrops, centrepieces and florals. Mood board within 48 hours of a confirmed booking.',
    packages: [
      { id: 'decor-std', name: 'Hall dressing', price: 900, unit: 'flat', includes: 'Ceiling drapes · fairy lights · head-table backdrop · 20 centrepieces' },
      { id: 'decor-full', name: 'Full styling', price: 2400, unit: 'flat', includes: 'Hall dressing · stage · florals · chair covers for 200 · setup and strike', popular: true },
    ],
    calendar: { [d(7)]: 'booked', [d(21)]: 'booked', [d(28)]: 'booked', [d(35)]: 'held', '2027-02-20': 'booked', '2027-02-21': 'free' },
    languages: ['English'],
  },
  {
    id: 'seyilawal', name: 'Seyi Lawal Photography', owner: 'seyi', category: 'photo', region: 'uk', area: 'Hackney, London', currency: 'GBP', priceFrom: 650, priceUnit: 'flat',
    years: 10, rating: 4.9, reviews: 301, bookings: 512, verified: true, responseTime: 'within 2 hours', tags: ['Weddings', 'Anniversaries', 'Same-day edits', 'Video add-on'],
    photos: ['cameraHand', 'weddingConfetti', 'studioLights', 'coupleHill'],
    about: 'Ten years of owambes, white weddings and quiet dinners. Same-day highlight edit for the family group chat; full gallery in 14 days.',
    packages: [
      { id: 'ph-6', name: '6 hours', price: 650, unit: 'flat', includes: 'One photographer · 400 edited photos · online gallery' },
      { id: 'ph-10', name: 'Full day + video', price: 1450, unit: 'flat', includes: 'Two shooters · video highlight · 800 edited photos · same-day edit', popular: true },
    ],
    calendar: { [d(0)]: 'booked', [d(7)]: 'booked', [d(14)]: 'booked', [d(21)]: 'booked', '2027-02-20': 'held', '2027-02-27': 'booked' },
    languages: ['English', 'Yorùbá'], featured: true,
  },
  {
    id: 'mcchuks', name: 'MC Chuks', owner: 'chuks', category: 'mc', region: 'uk', area: 'Thamesmead, London', currency: 'GBP', priceFrom: 350, priceUnit: 'flat',
    years: 12, rating: 4.8, reviews: 87, bookings: 203, verified: true, responseTime: 'within 4 hours', tags: ['Bilingual', 'Owambe', 'Corporate', 'Comedy'],
    photos: ['micStage', 'micBlue', 'rooftopParty'],
    about: 'Compère in English, Igbo and Pidgin. Keeps the programme to time and the aunties entertained.',
    packages: [{ id: 'mc-ev', name: 'Full programme', price: 350, unit: 'flat', includes: 'Up to 6 hours · run-of-show call the week before', popular: true }],
    calendar: { [d(7)]: 'booked', [d(14)]: 'booked', '2027-02-20': 'free' },
    languages: ['English', 'Igbo', 'Pidgin'],
  },
  {
    id: 'asake', name: 'Asake Live Band', owner: 'chuks', category: 'band', region: 'uk', area: 'Croydon, London', currency: 'GBP', priceFrom: 1200, priceUnit: 'flat',
    years: 5, rating: 4.6, reviews: 64, bookings: 118, verified: false, responseTime: 'within a day', tags: ['Highlife', 'Juju', 'Afrobeats', '7-piece'],
    photos: ['concertYellow', 'concertLights', 'studioGuitars'],
    about: 'Seven-piece highlife and juju band. Two 45-minute sets and a first-dance arrangement of your song.',
    packages: [{ id: 'band-2', name: 'Two sets', price: 1200, unit: 'flat', includes: '2 × 45 min · own backline · first-dance arrangement', popular: true }],
    calendar: { [d(7)]: 'booked', [d(28)]: 'booked', '2027-02-20': 'held' },
    languages: ['English', 'Yorùbá'],
  },
  {
    id: 'geleglam', name: 'Gele & Glam by Tola', owner: 'tola', category: 'glam', region: 'uk', area: 'Stratford, London', currency: 'GBP', priceFrom: 60, priceUnit: 'per head',
    years: 4, rating: 4.9, reviews: 122, bookings: 338, verified: true, responseTime: 'within an hour', tags: ['Gele tying', 'Bridal makeup', 'Mobile', 'Group bookings'],
    photos: ['bouquet', 'ringsHands', 'weddingBalloons'],
    about: 'Gele tying and makeup at your venue or home. Group rates for the aso-ebi table.',
    packages: [
      { id: 'gele-1', name: 'Gele + makeup', price: 60, unit: 'per head', includes: 'One look · lashes · gele', popular: true },
      { id: 'gele-bride', name: 'Bride + mothers', price: 320, unit: 'flat', includes: 'Bride trial · bride · two mothers · touch-up kit' },
    ],
    calendar: { [d(7)]: 'booked', [d(14)]: 'booked', '2027-02-20': 'free' },
    languages: ['English', 'Yorùbá'],
  },
  {
    id: 'oriki', name: 'Oriki Cocktails', owner: 'femi', category: 'bar', region: 'uk', area: 'Brixton, London', currency: 'GBP', priceFrom: 14, priceUnit: 'per head',
    years: 3, rating: 4.7, reviews: 58, bookings: 97, verified: true, responseTime: 'within 3 hours', tags: ['Mobile bar', 'Chapman & zobo', 'Mocktails', 'Licensed'],
    photos: ['cocktailPour', 'drinksToast', 'barLights'],
    about: 'A licensed mobile bar with chapman, zobo, palm-wine spritz and the classics. Mocktail menu for the church table.',
    packages: [{ id: 'bar-4', name: '4-hour bar', price: 14, unit: 'per head', includes: 'Two bartenders · glassware · ice · 4 signature drinks', popular: true }],
    calendar: { [d(7)]: 'booked', [d(21)]: 'booked', '2027-02-20': 'free' },
    languages: ['English'],
  },
  /* Lagos */
  {
    id: 'jollofco', name: 'Jollof & Co.', owner: 'tomi', category: 'catering', region: 'ng', area: 'Lekki Phase 1, Lagos', currency: 'NGN', priceFrom: 9500, priceUnit: 'per head',
    years: 9, rating: 4.8, reviews: 264, bookings: 611, verified: true, responseTime: 'within an hour', tags: ['Party jollof', 'Small chops', 'Ofada', '100–1,500 guests'],
    photos: ['stewPan', 'buffetTrays', 'grillPlatter', 'platedMeat'],
    about: 'Party jollof the way Lagos expects it. Buffet or plated, from 100 to 1,500 guests, with servers in uniform.',
    packages: [
      { id: 'jc-buffet', name: 'Buffet', price: 9500, unit: 'per head', includes: 'Jollof · fried rice · two proteins · salad · plantain · servers', popular: true },
      { id: 'jc-plated', name: 'Plated service', price: 14500, unit: 'per head', includes: 'Three courses · servers · crockery' },
    ],
    calendar: { [d(0)]: 'booked', [d(7)]: 'booked', [d(14)]: 'booked', [d(21)]: 'booked', [d(28)]: 'held', [d(35)]: 'booked' },
    languages: ['English', 'Yorùbá', 'Pidgin'], featured: true,
  },
  {
    id: 'ekohall', name: 'Eko Convention Hall', owner: 'musa', category: 'venue', region: 'ng', area: 'Victoria Island, Lagos', currency: 'NGN', priceFrom: 2800000, priceUnit: 'per day',
    years: 12, rating: 4.6, reviews: 142, bookings: 358, verified: true, responseTime: 'within a day', capacity: 600, tags: ['600 seated', 'Generator backup', 'Parking 200', 'Bridal suites ×2'],
    photos: ['communityHall', 'brightHall', 'lagosWaterfront'],
    about: 'Six hundred seated, full generator backup and two bridal suites. Outside caterers welcome; in-house decor partner available.',
    packages: [{ id: 'eko-day', name: 'Full day hire', price: 2800000, unit: 'per day', includes: '08:00 – 00:00 · chairs and tables · generator · 200 parking', popular: true }],
    calendar: { [d(7)]: 'booked', [d(14)]: 'booked', [d(21)]: 'booked', [d(28)]: 'booked', '2026-12-12': 'booked' },
    languages: ['English', 'Yorùbá', 'Hausa'],
  },
  {
    id: 'djlade', name: 'DJ Lade', owner: 'lade', category: 'dj', region: 'ng', area: 'Ikeja, Lagos', currency: 'NGN', priceFrom: 250000, priceUnit: 'flat',
    years: 8, rating: 4.7, reviews: 188, bookings: 402, verified: true, responseTime: 'within an hour', tags: ['Afrobeats', 'Amapiano', 'Fuji', 'Own PA'],
    photos: ['danceFloor', 'djMixer', 'djClub'],
    about: 'Lagos owambe DJ. Afrobeats, amapiano and fuji; own PA for 500.',
    packages: [{ id: 'lade-full', name: 'Full event', price: 250000, unit: 'flat', includes: 'DJ · PA for 500 · lights · 2 mics', popular: true }],
    calendar: { [d(0)]: 'booked', [d(7)]: 'booked', [d(14)]: 'booked', [d(21)]: 'booked' },
    languages: ['English', 'Yorùbá', 'Pidgin'],
  },
  {
    id: 'bloom', name: 'Bloom by Ngozi', owner: 'ngoziB', category: 'decor', region: 'ng', area: 'Ikoyi, Lagos', currency: 'NGN', priceFrom: 650000, priceUnit: 'flat',
    years: 7, rating: 4.9, reviews: 97, bookings: 201, verified: true, responseTime: 'within 3 hours', tags: ['Florals', 'Stage design', 'Centrepieces'],
    photos: ['bouquet', 'tableFlowers', 'callaLilies', 'tableGlasses'],
    about: 'Fresh florals flown in weekly, stage design and centrepieces for halls up to 800.',
    packages: [{ id: 'bloom-full', name: 'Hall florals', price: 650000, unit: 'flat', includes: 'Stage · 40 centrepieces · aisle · setup and strike', popular: true }],
    calendar: { [d(7)]: 'booked', [d(14)]: 'held', [d(21)]: 'booked' },
    languages: ['English', 'Igbo'],
  },
  {
    id: 'lensoflagos', name: 'Lens of Lagos', owner: 'wale', category: 'photo', region: 'ng', area: 'Yaba, Lagos', currency: 'NGN', priceFrom: 350000, priceUnit: 'flat',
    years: 6, rating: 4.8, reviews: 139, bookings: 287, verified: false, responseTime: 'within 2 hours', tags: ['Weddings', 'Drone', 'Same-day edits'],
    photos: ['weddingConfetti', 'cameraBody', 'studioLights'],
    about: 'Two shooters and a drone. Same-day edit for the family group, full gallery in 10 days.',
    packages: [{ id: 'lol-full', name: 'Full day', price: 350000, unit: 'flat', includes: 'Two shooters · drone · 600 photos · same-day edit', popular: true }],
    calendar: { [d(7)]: 'booked', [d(21)]: 'booked' },
    languages: ['English', 'Yorùbá'],
  },
  {
    id: 'gracecakes', name: 'Grace Cakes Lagos', owner: 'grace', category: 'cake', region: 'ng', area: 'Surulere, Lagos', currency: 'NGN', priceFrom: 85000, priceUnit: 'flat',
    years: 5, rating: 4.9, reviews: 76, bookings: 164, verified: true, responseTime: 'within 3 hours', tags: ['Tiered cakes', 'Fondant', 'Delivery'],
    photos: ['dripCake', 'sprinkleCake', 'pinkCupcakes'],
    about: 'Fondant and buttercream tiers delivered and set up across Lagos mainland and island.',
    packages: [{ id: 'gc-3', name: '3-tier cake', price: 85000, unit: 'flat', includes: 'Serves 100 · two flavours · delivery', popular: true }],
    calendar: { [d(7)]: 'booked', [d(14)]: 'booked' },
    languages: ['English', 'Igbo'],
  },
]

export const vendorById = (id: string) => VENDORS.find((v) => v.id === id) ?? VENDORS[0]
export const vendorsIn = (region: Region) => VENDORS.filter((v) => v.region === region)
export const vendorsByCategory = (c: CategoryId, region?: Region) => VENDORS.filter((v) => v.category === c && (!region || v.region === region))

/** Availability for a given day: free unless the calendar says otherwise. Past days read as 'blocked'. */
export const availabilityOn = (v: Vendor, iso: string): Availability => (iso < CLOCK.todayIso ? 'blocked' : v.calendar[iso] ?? 'free')
/** The next `n` days as a strip, starting today. */
export const strip = (v: Vendor, n = 14, from = CLOCK.todayIso) => Array.from({ length: n }, (_, i) => ({ iso: addDays(from, i), state: availabilityOn(v, addDays(from, i)) }))

/** Planners on the marketplace (for the client's "assign a planner" shortlist). The vendor list above is services; planners are people. */
export type PlannerListing = { id: string; person: string; business: string; area: string; region: Region; years: number; rating: number; reviews: number; events: number; verified: boolean; from: number; currency: Currency; speciality: string; photo: MediaKey; languages: string[] }
export const PLANNERS: PlannerListing[] = [
  { id: 'bakare', person: 'tunde', business: 'Bakare Events', area: 'London & Lagos', region: 'uk', years: 9, rating: 4.9, reviews: 187, events: 312, verified: true, from: 1800, currency: 'GBP', speciality: 'Owambe, anniversaries, traditional weddings', photo: 'weddingGlasses', languages: ['English', 'Yorùbá', 'Pidgin'] },
  { id: 'umeh', person: 'nkechi', business: 'Umeh & Co. Events', area: 'East London', region: 'uk', years: 6, rating: 4.8, reviews: 96, events: 148, verified: true, from: 1500, currency: 'GBP', speciality: 'Weddings, christenings', photo: 'tableGreenery', languages: ['English', 'Igbo'] },
  { id: 'oyelaran', person: 'segun', business: 'SO Occasions', area: 'Manchester', region: 'uk', years: 11, rating: 4.7, reviews: 203, events: 390, verified: true, from: 1200, currency: 'GBP', speciality: 'Corporate, milestone birthdays', photo: 'rooftopParty', languages: ['English', 'Yorùbá'] },
  { id: 'yusuf', person: 'halima', business: 'Halima Yusuf Events', area: 'Abuja', region: 'ng', years: 8, rating: 4.9, reviews: 141, events: 256, verified: true, from: 850000, currency: 'NGN', speciality: 'Weddings, naming ceremonies', photo: 'tableFlowers', languages: ['English', 'Hausa'] },
  { id: 'martins', person: 'ayo', business: 'Ayo Martins Planning', area: 'Lagos Island', region: 'ng', years: 5, rating: 4.6, reviews: 58, events: 97, verified: false, from: 600000, currency: 'NGN', speciality: 'Parties, launches', photo: 'confettiCrowd', languages: ['English', 'Pidgin'] },
]
export const plannerById = (id: string) => PLANNERS.find((p) => p.id === id) ?? PLANNERS[0]

/** Reviews, keyed by vendor or planner listing id. */
export const REVIEWS: Record<string, Review[]> = {
  iyabola: [
    { id: 'r1', by: 'nkechi', event: 'Christening · 60 guests', date: '2026-11-08', rating: 5, text: 'The jollof went in twenty minutes and the aunties asked for the caterer’s number. Staff were polite and quick.', reply: 'Thank you, Nkechi! It was a joy feeding your family.' },
    { id: 'r2', by: 'kunle', event: '50th birthday · 140 guests', date: '2026-10-24', rating: 5, text: 'Asun was the talk of the night. Vegetarian table was properly done, not an afterthought.' },
    { id: 'r3', by: 'ronke', event: 'Traditional wedding · 300 guests', date: '2026-10-03', rating: 4, text: 'Food was excellent. Service started 20 minutes late because the hall lift broke, Bola’s team recovered well.' },
    { id: 'r4', by: 'ife', event: 'Office party · 80 guests', date: '2026-09-19', rating: 5, text: 'Small chops station was a hit with colleagues who had never had puff puff.' },
    { id: 'r5', by: 'amaka', event: 'Baby shower · 45 guests', date: '2026-09-06', rating: 5, text: 'Everything arrived hot and on time. The moi moi!' },
    { id: 'r6', by: 'yemi', event: 'Memorial · 200 guests', date: '2026-08-15', rating: 5, text: 'Handled a difficult day with care. Thank you.' },
    { id: 'r7', by: 'sade', event: 'Graduation · 70 guests', date: '2026-07-26', rating: 4, text: 'Great food, would book again. Would love more dessert options.' },
    { id: 'r8', by: 'uche', event: 'Engagement · 90 guests', date: '2026-07-11', rating: 5, text: 'Quoted within the hour and delivered exactly what was quoted.' },
  ],
  djkaytee: [
    { id: 'r9', by: 'dami', event: 'Wedding · 220 guests', date: '2026-11-01', rating: 5, text: 'Read the room perfectly: highlife for the elders, amapiano after ten.' },
    { id: 'r10', by: 'chioma', event: '30th birthday · 90 guests', date: '2026-10-11', rating: 5, text: 'Own lights and a mic for our MC. Sorted.' },
    { id: 'r11', by: 'tayo', event: 'Corporate · 150 guests', date: '2026-09-27', rating: 4, text: 'Great set, slightly loud for the speeches.' },
  ],
  bakare: [
    { id: 'r12', by: 'ronke', event: 'Traditional wedding · 300 guests', date: '2026-10-03', rating: 5, text: 'Tunde ran the day without a hiccup. Every vendor knew where to be and when.' },
    { id: 'r13', by: 'kunle', event: '50th birthday · 140 guests', date: '2026-10-24', rating: 5, text: 'He found a hall, a caterer and a band in a week and stayed under budget.' },
    { id: 'r14', by: 'bisi', event: 'Engagement · 120 guests', date: '2026-08-29', rating: 4, text: 'Brilliant on the day. Replies could be a little quicker in the weeks before.' },
  ],
}
export const reviewsFor = (id: string) => REVIEWS[id] ?? REVIEWS.iyabola
