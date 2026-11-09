import type { MediaKey } from './media'

/* The cast. One set of people appears across all four platforms. */

export type Person = { id: string; name: string; first: string; photo: MediaKey; role: string; city: 'London' | 'Lagos' | 'Croydon' | 'Manchester' | 'Abuja'; phone: string; email?: string }

/** The client: planning her parents' ruby anniversary. */
export const CLIENT: Person & { event: string; since: string } = {
  id: 'adaeze', name: 'Adaeze Nwosu', first: 'Adaeze', photo: 'adaeze', role: 'Client', city: 'London', phone: '+44 7700 900123', email: 'adaeze.nwosu@demo-edera.app',
  event: 'ev-ruby', since: 'Oct 2026',
}

/** The planner: runs Bakare Events in London and Lagos. */
export const PLANNER: Person & { business: string; years: number; rating: number; reviews: number; eventsDone: number; verified: boolean; languages: string[]; since: string } = {
  id: 'tunde', name: 'Tunde Bakare', first: 'Tunde', photo: 'tunde', role: 'Event planner', city: 'London', phone: '+44 7700 900204', email: 'tunde@demo-bakare-events.app',
  business: 'Bakare Events', years: 9, rating: 4.9, reviews: 187, eventsDone: 312, verified: true, languages: ['English', 'Yorùbá', 'Pidgin'], since: 'Jun 2026',
}

/** The vendor: caterer who also owns a hall in Peckham. */
export const VENDOR: Person & { business: string; years: number; rating: number; reviews: number; verified: boolean; since: string } = {
  id: 'bola', name: 'Bola Fashola', first: 'Bola', photo: 'bola', role: 'Vendor · Venue owner', city: 'London', phone: '+44 7700 900318', email: 'bola@demo-iyabola.app',
  business: 'Ìyá Bola Catering', years: 11, rating: 4.9, reviews: 212, verified: true, since: 'Jul 2026',
}

/** The platform owner. */
export const OWNER: Person = { id: 'dave', name: 'Dave Babatunde', first: 'Dave', photo: 'dave', role: 'Platform owner', city: 'London', phone: '+44 7700 900001', email: 'dave@demo-edera.app' }

/** Everyone else: guests, vendors' owners, other planners, other clients. */
export const PEOPLE: Record<string, Person> = {
  adaeze: CLIENT,
  tunde: PLANNER,
  bola: VENDOR,
  dave: OWNER,
  kayode: { id: 'kayode', name: 'Kayode Williams', first: 'Kayode', photo: 'kayode', role: 'DJ', city: 'London', phone: '+44 7700 900410' },
  funmi: { id: 'funmi', name: 'Funmi Adeyemi', first: 'Funmi', photo: 'funmi', role: 'Cake designer', city: 'London', phone: '+44 7700 900422' },
  kemi: { id: 'kemi', name: 'Kemi Olawale', first: 'Kemi', photo: 'kemi', role: 'Decor & florals', city: 'London', phone: '+44 7700 900433' },
  seyi: { id: 'seyi', name: 'Seyi Lawal', first: 'Seyi', photo: 'seyi', role: 'Photographer', city: 'London', phone: '+44 7700 900447' },
  chuks: { id: 'chuks', name: 'Chukwuemeka Obi', first: 'Chuks', photo: 'chuks', role: 'MC', city: 'London', phone: '+44 7700 900451' },
  dapo: { id: 'dapo', name: 'Dapo Adebayo', first: 'Dapo', photo: 'dapo', role: 'Venue manager', city: 'London', phone: '+44 7700 900460' },
  tola: { id: 'tola', name: 'Tola Bankole', first: 'Tola', photo: 'tola', role: 'Gele & makeup', city: 'London', phone: '+44 7700 900471' },
  femi: { id: 'femi', name: 'Femi Ogundipe', first: 'Femi', photo: 'femi', role: 'Mobile bar', city: 'London', phone: '+44 7700 900488' },
  lade: { id: 'lade', name: 'Lade Afolabi', first: 'Lade', photo: 'lade', role: 'DJ', city: 'Lagos', phone: '+234 0700 000 0411' },
  ngoziB: { id: 'ngoziB', name: 'Ngozi Bello', first: 'Ngozi', photo: 'ngoziB', role: 'Florist', city: 'Lagos', phone: '+234 0700 000 0422' },
  wale: { id: 'wale', name: 'Wale Adeniran', first: 'Wale', photo: 'wale', role: 'Photographer', city: 'Lagos', phone: '+234 0700 000 0436' },
  tomi: { id: 'tomi', name: 'Tomi Eze', first: 'Tomi', photo: 'tomi', role: 'Caterer', city: 'Lagos', phone: '+234 0700 000 0449' },
  musa: { id: 'musa', name: 'Musa Ibrahim', first: 'Musa', photo: 'musa', role: 'Venue manager', city: 'Lagos', phone: '+234 0700 000 0450' },
  grace: { id: 'grace', name: 'Grace Okafor', first: 'Grace', photo: 'grace', role: 'Cake designer', city: 'Lagos', phone: '+234 0700 000 0463' },
  /* other planners on the marketplace */
  nkechi: { id: 'nkechi', name: 'Nkechi Umeh', first: 'Nkechi', photo: 'nkechi', role: 'Event planner', city: 'London', phone: '+44 7700 900502' },
  segun: { id: 'segun', name: 'Segun Oyelaran', first: 'Segun', photo: 'segun', role: 'Event planner', city: 'Manchester', phone: '+44 7700 900511' },
  halima: { id: 'halima', name: 'Halima Yusuf', first: 'Halima', photo: 'halima', role: 'Event planner', city: 'Abuja', phone: '+234 0700 000 0520' },
  ayo: { id: 'ayo', name: 'Ayo Martins', first: 'Ayo', photo: 'ayo', role: 'Event planner', city: 'Lagos', phone: '+234 0700 000 0533' },
  /* the family and guests */
  emeka: { id: 'emeka', name: 'Emeka Nwosu', first: 'Emeka', photo: 'emeka', role: 'Guest of honour', city: 'London', phone: '+44 7700 900130' },
  ngozi: { id: 'ngozi', name: 'Ngozi Nwosu', first: 'Ngozi', photo: 'ngozi', role: 'Guest of honour', city: 'London', phone: '+44 7700 900131' },
  chioma: { id: 'chioma', name: 'Chioma Nwosu', first: 'Chioma', photo: 'chioma', role: 'Sister', city: 'London', phone: '+44 7700 900132' },
  obi: { id: 'obi', name: 'Obi Nwosu', first: 'Obi', photo: 'obi', role: 'Brother', city: 'Manchester', phone: '+44 7700 900133' },
  ife: { id: 'ife', name: 'Ife Balogun', first: 'Ife', photo: 'ife', role: 'Guest', city: 'London', phone: '+44 7700 900140' },
  amaka: { id: 'amaka', name: 'Amaka Eze', first: 'Amaka', photo: 'amaka', role: 'Guest', city: 'London', phone: '+44 7700 900141' },
  yemi: { id: 'yemi', name: 'Yemi Adesanya', first: 'Yemi', photo: 'yemi', role: 'Guest', city: 'London', phone: '+44 7700 900142' },
  sade: { id: 'sade', name: 'Sade Ojo', first: 'Sade', photo: 'sade', role: 'Guest', city: 'Croydon', phone: '+44 7700 900143' },
  ronke: { id: 'ronke', name: 'Ronke Adeyinka', first: 'Ronke', photo: 'ronke', role: 'Client', city: 'London', phone: '+44 7700 900144' },
  bisi: { id: 'bisi', name: 'Bisi Alabi', first: 'Bisi', photo: 'bisi', role: 'Client', city: 'London', phone: '+44 7700 900145' },
  dami: { id: 'dami', name: 'Dami Alabi', first: 'Dami', photo: 'dami', role: 'Client', city: 'London', phone: '+44 7700 900146' },
  kunle: { id: 'kunle', name: 'Kunle Adewale', first: 'Kunle', photo: 'kunle', role: 'Client', city: 'London', phone: '+44 7700 900147' },
  adaora: { id: 'adaora', name: 'Adaora Okeke', first: 'Adaora', photo: 'adaora', role: 'Client', city: 'London', phone: '+44 7700 900148' },
  uche: { id: 'uche', name: 'Uche Nnamdi', first: 'Uche', photo: 'uche', role: 'Guest', city: 'London', phone: '+44 7700 900149' },
  nneka: { id: 'nneka', name: 'Nneka Obi', first: 'Nneka', photo: 'nneka', role: 'Guest', city: 'London', phone: '+44 7700 900150' },
  tayo: { id: 'tayo', name: 'Tayo Akinyemi', first: 'Tayo', photo: 'tayo', role: 'Guest', city: 'London', phone: '+44 7700 900151' },
  zara: { id: 'zara', name: 'Zara Mensah', first: 'Zara', photo: 'zara', role: 'Guest', city: 'London', phone: '+44 7700 900152' },
  lola: { id: 'lola', name: 'Lola Fadipe', first: 'Lola', photo: 'lola', role: 'Guest', city: 'London', phone: '+44 7700 900153' },
  ola: { id: 'ola', name: 'Ola Odunsi', first: 'Ola', photo: 'ola', role: 'Client', city: 'Lagos', phone: '+234 0700 000 0154' },
  tobi: { id: 'tobi', name: 'Tobi Odunsi', first: 'Tobi', photo: 'tobi', role: 'Client', city: 'Lagos', phone: '+234 0700 000 0155' },
  ebuka: { id: 'ebuka', name: 'Ebuka Nwankwo', first: 'Ebuka', photo: 'ebuka', role: 'Guest', city: 'London', phone: '+44 7700 900156' },
  ruth: { id: 'ruth', name: 'Ruth Chukwu', first: 'Ruth', photo: 'ruth', role: 'Guest', city: 'London', phone: '+44 7700 900157' },
}

export const personById = (id: string): Person => PEOPLE[id] ?? CLIENT
