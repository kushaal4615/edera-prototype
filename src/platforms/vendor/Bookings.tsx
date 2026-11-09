import { motion } from 'framer-motion'
import { CalendarDays, Check, ChevronRight, MessageSquare, Star, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Money } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { Sparkline } from '../../components/Charts'
import { HeroImage } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { Segmented } from '../../components/Tabs'
import { CLOCK, MONTH_LONG, addDays, fmtDay, money, parseIso, plural } from '../../data/clock'
import { REQUESTS, TONIGHT, eventById } from '../../data/events'
import { img, type MediaKey } from '../../data/media'
import { personById } from '../../data/people'
import { useNav } from '../../lib/navigation'
import { requestState, session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { MobileScreen, TopBar } from '../mobileShell'

/* vendor.bookings: confirmed and completed bookings across Bola's two
   listings. The money block at the top is a quote total, never a payout:
   bookings end at Confirmed in this phase and are settled outside Edera. */

type Listing = 'Catering' | 'Hall' | 'Hall + catering'
type Booking = {
  id: string
  requestId?: string
  name: string
  photo: MediaKey
  by: string
  date: string
  slot: string
  listing: Listing
  headcount: number
  amount: number
  done: boolean
  live?: boolean
}

const MINE = ['iyabola', 'ola-hall']
const listingOf = (vendorId: string, packageId: string): Listing => (packageId === 'hall-plus' ? 'Hall + catering' : vendorId === 'ola-hall' ? 'Hall' : 'Catering')
const d = (n: number) => addDays(CLOCK.todayIso, n)

/* Bookings that exist only in the vendor's own history (no live request record in the demo).
   They line up with the hall and kitchen calendars and with the reviews on vendor.reviews. */
const HISTORY: Booking[] = [
  { id: 'h1', name: 'Okafor family · Naming ceremony', photo: 'balloons', by: 'ebuka', date: d(7), slot: '10:00 – 01:00', listing: 'Hall', headcount: 100, amount: 1400, done: false },
  { id: 'h2', name: 'Peckham Rotary · Christmas dinner', photo: 'tableGreenery', by: 'tayo', date: d(14), slot: '17:00 – 01:00', listing: 'Hall', headcount: 80, amount: 850, done: false },
  { id: 'h3', name: 'Mensah & Co · End-of-year party', photo: 'rooftopParty', by: 'zara', date: d(21), slot: '18:00 – 01:00', listing: 'Hall + catering', headcount: 90, amount: 5220, done: false },
  { id: 'h4', name: 'Fadipe · 60th birthday', photo: 'tipiDance', by: 'lola', date: d(28), slot: '13:00 – 20:00', listing: 'Catering', headcount: 110, amount: 2640, done: false },
  { id: 'h5', name: 'Ruth & Ebuka · Wedding reception', photo: 'weddingBalloons', by: 'ruth', date: '2027-02-13', slot: '10:00 – 01:00', listing: 'Hall + catering', headcount: 120, amount: 6960, done: false },
  { id: 'h6', name: 'Ade’s 50th · Kunle Adewale', photo: 'tipiDance', by: 'kunle', date: '2026-10-24', slot: '18:00 – 00:00', listing: 'Catering', headcount: 140, amount: 4480, done: true },
  { id: 'h7', name: 'Ronke & Femi · Traditional wedding', photo: 'weddingConfetti', by: 'ronke', date: '2026-10-03', slot: '11:00 – 22:00', listing: 'Catering', headcount: 300, amount: 13500, done: true },
  { id: 'h8', name: 'Balogun Partners · Office party', photo: 'drinksToast', by: 'ife', date: '2026-09-19', slot: '18:00 – 22:00', listing: 'Hall + catering', headcount: 80, amount: 4640, done: true },
  { id: 'h9', name: 'Amaka’s baby shower', photo: 'balloons', by: 'amaka', date: '2026-09-06', slot: '13:00 – 17:00', listing: 'Catering', headcount: 45, amount: 1080, done: true },
  { id: 'h10', name: 'Adesanya memorial', photo: 'communityHall', by: 'yemi', date: '2026-08-15', slot: '12:00 – 18:00', listing: 'Hall + catering', headcount: 200, amount: 11600, done: true },
  { id: 'h11', name: 'Sade’s graduation', photo: 'confettiCrowd', by: 'sade', date: '2026-07-26', slot: '14:00 – 20:00', listing: 'Catering', headcount: 70, amount: 1680, done: true },
  { id: 'h12', name: 'Uche & Nneka · Engagement', photo: 'dinnerLaugh', by: 'uche', date: '2026-07-11', slot: '17:00 – 23:00', listing: 'Hall + catering', headcount: 90, amount: 5220, done: true },
]

/* 12 weeks of bookings across both listings (demo values) */
const WEEKS = [3, 2, 4, 3, 5, 4, 6, 5, 4, 7, 5, 6]
const WEEKS_TOTAL = WEEKS.reduce((a, b) => a + b, 0)

const LISTING_TONE: Record<Listing, 'accent' | 'ink' | 'warn'> = { Catering: 'accent', Hall: 'ink', 'Hall + catering': 'warn' }
const MONTH_BLOCK = [
  { bg: 'var(--ink)', fg: 'var(--on-ink)' },
  { bg: 'var(--brass)', fg: 'var(--on-brass)' },
  { bg: 'var(--accent)', fg: 'var(--on-accent)' },
]

function LivePill() {
  return (
    <span className="label inline-flex h-6 items-center gap-1.5 rounded-full bg-accent px-2 text-on-accent">
      <span className="relative grid h-2 w-2 place-items-center">
        <motion.span aria-hidden className="absolute h-2 w-2 rounded-full bg-white" animate={{ scale: [1, 2.2], opacity: [0.7, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }} />
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
      Live
    </span>
  )
}

function SettlePill({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={tap}
      transition={spring.ui}
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12px] font-bold ${on ? 'bg-accent-soft text-on-accent-soft' : 'text-text-2'}`}
      style={on ? undefined : { boxShadow: 'inset 0 0 0 1px var(--rule-strong)' }}
    >
      <span className={`grid h-4 w-4 place-items-center rounded-full ${on ? 'bg-accent text-on-accent' : 'bg-[var(--surface-high)]'}`}>{on && <Check size={11} strokeWidth={3.2} aria-hidden />}</span>
      {on ? 'Settled outside Edera' : 'Mark as settled'}
    </motion.button>
  )
}

export default function VendorBookings() {
  const { navigate, toast } = useNav()
  const decisions = useSession((s) => s.requestDecisions)
  const [view, setView] = useState<'upcoming' | 'done'>('upcoming')
  const [settled, setSettled] = useState<string[]>(['h6', 'h7', 'h8', 'h9', 'h10', 'h11', 'h12'])
  const [open, setOpen] = useState<Booking | null>(null)

  const all = useMemo<Booking[]>(() => {
    const fromRequests: Booking[] = REQUESTS.filter((r) => MINE.includes(r.vendorId))
      .filter((r) => ['confirmed', 'completed', 'accepted'].includes(requestState(r.id)))
      .map((r) => {
        const ev = eventById(r.eventId)
        const st = requestState(r.id)
        return {
          id: r.id,
          requestId: r.id,
          name: ev.name,
          photo: ev.photo,
          by: r.by,
          date: r.date,
          slot: r.slot,
          listing: listingOf(r.vendorId, r.packageId),
          headcount: r.headcount,
          amount: r.amount,
          done: st === 'completed' || r.date < CLOCK.todayIso,
          live: r.eventId === TONIGHT.id,
        }
      })
    return [...fromRequests, ...HISTORY]
    // decisions is read so the list re-derives after an accept on vendor.request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions])

  const upcoming = all.filter((b) => !b.done).sort((a, b) => a.date.localeCompare(b.date))
  const done = all.filter((b) => b.done).sort((a, b) => b.date.localeCompare(a.date))
  const rows = view === 'upcoming' ? upcoming : done

  const in30 = upcoming.filter((b) => b.date < d(30))
  const next30 = in30.reduce((a, b) => a + b.amount, 0)
  const prev30 = done.filter((b) => b.date >= d(-30)).reduce((a, b) => a + b.amount, 0)
  const delta = next30 - prev30

  /* group by month */
  const groups: { key: string; label: string; items: Booking[] }[] = []
  for (const b of rows) {
    const key = b.date.slice(0, 7)
    let g = groups.find((x) => x.key === key)
    if (!g) {
      const dt = parseIso(b.date)
      g = { key, label: `${MONTH_LONG[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`, items: [] }
      groups.push(g)
    }
    g.items.push(b)
  }

  const openRow = (b: Booking) => {
    if (b.requestId) {
      session.viewRequest(b.requestId)
      track('booking_opened', b.requestId)
      navigate('vendor.request')
    } else setOpen(b)
  }
  const toggleSettled = (id: string) => {
    const on = settled.includes(id)
    setSettled((s) => (on ? s.filter((x) => x !== id) : [...s, id]))
    toast(on ? 'Marked as not yet settled' : 'Marked as settled · no fee in this phase', on ? 'neutral' : 'accent')
  }

  return (
    <MobileScreen header={<TopBar title="Bookings" sub="Ìyá Bola Catering · Olá Event Hall" right={<IconButton icon={CalendarDays} label="Calendar" onClick={() => navigate('vendor.calendar')} />} />}>
      {/* Oversized money block */}
      <section className="px-5 pb-6 pt-2">
        <p className="label text-brass-ink">Confirmed value · next 30 days</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <Money amount={next30} size={58} />
          <div className="pb-1 text-right">
            <Sparkline data={WEEKS} width={124} height={38} />
            <p className="meta mt-1 text-text-2">12 weeks · {WEEKS_TOTAL} bookings</p>
          </div>
        </div>
        <p className="mt-2.5 text-[13px] font-semibold text-text-2">
          <span className={`num ${delta >= 0 ? 'text-accent-ink' : 'text-danger-text'}`}>
            {delta >= 0 ? '+' : '−'}
            {money(Math.abs(delta))}
          </span>{' '}
          vs the 30 days before · {plural(in30.length, 'event')} · best week {Math.max(...WEEKS)}
        </p>
        <p className="mt-1 text-[12px] text-text-2">Quotes only · settled outside Edera · payments in a later phase</p>
      </section>

      <div className="px-5">
        <Segmented
          full
          value={view}
          onChange={setView}
          items={[
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { id: 'done', label: 'Completed', count: done.length },
          ]}
        />
      </div>

      {/* Month-grouped rows */}
      <ul className="mt-2">
        {groups.map((g, gi) => {
          const tone = MONTH_BLOCK[gi % MONTH_BLOCK.length]
          const total = g.items.reduce((a, b) => a + b.amount, 0)
          return (
            <li key={g.key} className={gi === 0 ? 'mt-3' : 'mt-5'}>
              <div className="flex items-center gap-3 px-5">
                <span className="label rounded-[8px] px-2.5 py-1.5" style={{ background: tone.bg, color: tone.fg }}>
                  {g.label}
                </span>
                <span aria-hidden className="h-px flex-1 bg-[var(--rule-strong)]" />
                <span className="meta text-text-2">
                  {plural(g.items.length, 'event')} · {money(total)}
                </span>
              </div>
              <ul className="mt-1">
                {g.items.map((b) => {
                  const who = personById(b.by)
                  const isSettled = settled.includes(b.id)
                  return (
                    <li key={b.id} className={`px-5 ${b.live ? 'bg-[var(--surface-tint)]' : ''}`}>
                      <Pressable onClick={() => openRow(b)} className="flex gap-3 pt-3.5">
                        <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--surface-high)]">
                          <img src={img(b.photo, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-[15px] font-bold leading-tight">{b.name}</p>
                            <Money amount={b.amount} size={18} className="shrink-0" />
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-text-2">
                            <Avatar who={who.photo} size={18} />
                            <span className="truncate">{who.name}</span>
                            <span aria-hidden>·</span>
                            <span className="shrink-0">{fmtDay(b.date)}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {b.live && <LivePill />}
                            <Badge tone={LISTING_TONE[b.listing]}>{b.listing}</Badge>
                            <span className="meta text-text-2">
                              {b.headcount} guests · {b.slot}
                            </span>
                          </div>
                        </div>
                      </Pressable>
                      <div className="flex items-center gap-2 pb-3.5 pl-[76px] pt-2">
                        <SettlePill on={isSettled} onClick={() => toggleSettled(b.id)} />
                        {b.done ? (
                          <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => toast(`Review request sent to ${who.first}`, 'accent')} className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-bold text-accent-ink">
                            <MessageSquare size={13} strokeWidth={2.4} aria-hidden /> Ask for a review
                          </motion.button>
                        ) : (
                          <span className="meta whitespace-nowrap text-text-2">{b.live ? 'Doors 18:30 · live' : 'Quote · no fee'}</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>

      {/* The money decision from the call */}
      <div className="relative mx-5 mt-8 overflow-hidden rounded-[var(--r-container)] bg-brass-soft p-5 text-on-brass-soft">
        <Wallet size={22} strokeWidth={2} aria-hidden />
        <p className="grot mt-3 text-[20px]">Payments and payouts arrive in a later phase.</p>
        <p className="mt-1.5 text-[13px] font-semibold leading-snug">Edera is free to use while the community grows. Bookings end at Confirmed; you settle with the client as you do today.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="ink" size="sm" icon={CalendarDays} onClick={() => navigate('vendor.calendar')}>
            Calendar
          </Button>
          <Button variant="outline" size="sm" icon={Star} onClick={() => navigate('vendor.reviews')}>
            Reviews
          </Button>
        </div>
      </div>

      {/* Detail for bookings without a request record */}
      <BottomSheet open={open !== null} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <div className="pt-1">
            <HeroImage src={open.photo} alt="" className="h-[150px] rounded-[var(--r-card)]" scrim="b">
              <div className="flex h-full flex-col justify-end p-4">
                <div className="flex items-center gap-2">
                  <Badge tone={LISTING_TONE[open.listing]}>{open.listing}</Badge>
                  <span className="text-[13px] font-bold text-on-ink">{fmtDay(open.date, true)}</span>
                </div>
              </div>
            </HeroImage>
            <div className="mt-4 flex items-center gap-3">
              <Avatar who={personById(open.by).photo} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">{personById(open.by).name}</p>
                <p className="text-[13px] text-text-2">
                  {open.headcount} guests · {open.slot}
                </p>
              </div>
              <div className="text-right">
                <Money amount={open.amount} size={24} />
                <p className="meta text-text-2">quote</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--r-card)] bg-[var(--surface-high)] p-3.5">
              <p className="text-[13px] font-semibold text-text-2">Settled outside Edera · payments in a later phase</p>
              <SettlePill on={settled.includes(open.id)} onClick={() => toggleSettled(open.id)} />
            </div>
            <Button
              block
              size="lg"
              variant="ink"
              className="mt-4"
              trailing={ChevronRight}
              onClick={() => {
                setOpen(null)
                navigate('vendor.calendar')
              }}
            >
              Open this day in Calendar
            </Button>
          </div>
        )}
      </BottomSheet>
    </MobileScreen>
  )
}
