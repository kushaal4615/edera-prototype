import { AnimatePresence, motion } from 'framer-motion'
import { CalendarPlus, ChevronRight, Lock, LockOpen, Users } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { AVAIL, AvailPill, Money, Strip } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { Input } from '../../components/Form'
import { BottomSheet } from '../../components/Sheet'
import { Segmented } from '../../components/Tabs'
import { addDays, CLOCK, dayNum, fmtDay, fmtShort, MONTH_LONG, relDay, toIso } from '../../data/clock'
import { DEMO_BLOCK_REASON } from '../../data/demoFill'
import { eventById, EVENTS, REQUESTS, type BookingRequest } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { availabilityOn, vendorById, type Availability, type Vendor } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, session, useSession, type SessionState } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* vendor.calendar — availability, the product's signature in full. One
   listing at a time (Catering / Hall): the 14-day strip as a band, then
   November and December as month grids whose cells wear the three
   states, a counts strip, and the upcoming confirmed bookings. Tapping a
   day opens the booking, blocks a free day or unblocks a blocked one. */

const MINE = ['iyabola', 'ola-hall'] as const
type ListingId = (typeof MINE)[number]

function withSession(v: Vendor, s: SessionState): Vendor {
  const cal: Record<string, Availability> = { ...v.calendar }
  for (const iso of s.unblockedDays) if (cal[iso] === 'blocked') delete cal[iso]
  for (const iso of s.blockedDays) cal[iso] = 'blocked'
  for (const r of REQUESTS) {
    if (r.vendorId !== v.id) continue
    const st = requestState(r.id, s)
    if (st === 'confirmed' || st === 'accepted' || st === 'completed') cal[r.date] = 'booked'
    else if ((st === 'declined' || st === 'proposed') && cal[r.date] === 'held') delete cal[r.date]
    else if (st === 'requested' && !cal[r.date]) cal[r.date] = 'held'
  }
  return { ...v, calendar: cal }
}

/** Month grid cells, Monday first, with leading blanks. */
function monthCells(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => toIso(new Date(Date.UTC(year, month, i + 1))))]
}

const MONTHS: [number, number][] = [
  [2026, 10],
  [2026, 11],
]
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function VendorCalendar() {
  const { navigate, toast } = useNav()
  const s = useSession((x) => x)
  const [which, setWhich] = useState<ListingId>('iyabola')
  const [day, setDay] = useState<string | null>(null)
  const [reason, setReason] = useState(DEMO_BLOCK_REASON)

  const base = vendorById(which)
  const v = withSession(base, s)
  const stateOn = (iso: string): Availability => availabilityOn(v, iso)
  const requestOn = (iso: string): BookingRequest | undefined =>
    REQUESTS.filter((r) => r.vendorId === which && r.date === iso).sort((a, b) => (['confirmed', 'accepted', 'completed'].includes(requestState(a.id, s)) ? -1 : 1) - (['confirmed', 'accepted', 'completed'].includes(requestState(b.id, s)) ? -1 : 1))[0]
  const eventOn = (iso: string) => EVENTS.find((e) => e.date === iso && (e.venueId === which || e.roles.some((ro) => ro.vendorId === which && ro.state === 'confirmed')))

  const thisMonth = monthCells(2026, 10).filter((x): x is string => !!x)
  const counts = thisMonth.reduce(
    (acc, iso) => {
      const st = iso < CLOCK.todayIso ? 'past' : stateOn(iso)
      acc[st] = (acc[st] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const upcoming = REQUESTS.filter((r) => (MINE as readonly string[]).includes(r.vendorId) && r.date >= CLOCK.todayIso && ['confirmed', 'accepted'].includes(requestState(r.id, s))).sort((a, b) => a.date.localeCompare(b.date))

  const nextFree = (() => {
    for (let i = 1; i < 60; i++) {
      const iso = addDays(CLOCK.todayIso, i)
      if (stateOn(iso) === 'free') return iso
    }
    return addDays(CLOCK.todayIso, 1)
  })()

  const openDay = (iso: string) => {
    if (iso < CLOCK.todayIso) {
      toast(`${fmtDay(iso)} has passed · past days can’t be changed`, 'neutral')
      return
    }
    setReason(DEMO_BLOCK_REASON)
    setDay(iso)
    track('vendor_calendar_day', iso)
  }

  const dayState = day ? stateOn(day) : 'free'
  const dayRequest = day ? requestOn(day) : undefined
  const dayEvent = day ? eventOn(day) : undefined
  const userBlocked = day ? s.blockedDays.includes(day) : false

  return (
    <MobileScreen
      tab="availability"
      dockHeight={70}
      dock={
        <Dock>
          <div className="flex min-w-0 flex-1 items-center gap-3 pl-3">
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold">{v.name}</span>
              <span className="block truncate text-[11px] font-semibold text-text-2">Next free: {fmtDay(nextFree)}</span>
            </span>
          </div>
          <Button icon={CalendarPlus} onClick={() => openDay(nextFree)}>
            Block a day
          </Button>
        </Dock>
      }
      overlay={
        <BottomSheet open={!!day} onClose={() => setDay(null)} title={day ? fmtDay(day, true) : ''}>
          {day && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-2">
                  {v.name} · {relDay(day)}
                </span>
                <AvailPill state={dayState}>{AVAIL[dayState].label}</AvailPill>
              </div>

              {(dayState === 'booked' || dayState === 'held') && (dayRequest || dayEvent) && (
                <div className="mt-4 overflow-hidden rounded-[var(--r-card)] bg-[var(--surface-tint)]">
                  <div className="flex items-center gap-3 p-3">
                    <img src={img((dayRequest ? eventById(dayRequest.eventId) : dayEvent!).photo, 200)} alt="" className="h-[56px] w-[56px] shrink-0 rounded-[12px] object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{(dayRequest ? eventById(dayRequest.eventId) : dayEvent!).name}</span>
                      <span className="block text-[12px] font-semibold text-text-2">
                        {dayRequest ? `${dayRequest.slot} · ${dayRequest.headcount} guests · ${personById(dayRequest.by).name}` : `${dayEvent!.time} · ${dayEvent!.guests} guests`}
                      </span>
                    </span>
                    {dayRequest && <Money amount={dayRequest.amount} size={20} />}
                  </div>
                  {dayRequest ? (
                    <Button
                      variant="ink"
                      block
                      className="!rounded-none"
                      trailing={ChevronRight}
                      onClick={() => {
                        session.viewRequest(dayRequest.id)
                        setDay(null)
                        navigate('vendor.request')
                      }}
                    >
                      Open {requestState(dayRequest.id, s) === 'requested' ? 'request' : 'booking'}
                    </Button>
                  ) : (
                    <Button variant="ink" block className="!rounded-none" trailing={ChevronRight} onClick={() => {
                      setDay(null)
                      navigate('vendor.bookings')
                    }}>
                      Open bookings
                    </Button>
                  )}
                </div>
              )}
              {(dayState === 'booked' || dayState === 'held') && !dayRequest && !dayEvent && (
                <div className="mt-4 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
                  <p className="text-[14px] font-bold">{dayState === 'booked' ? 'Booked outside Edera' : 'Held for a request'}</p>
                  <p className="mt-1 text-[13px] text-text-2">{dayState === 'booked' ? 'Added from your diary when you listed. Clients see this day as booked without contacting you.' : 'A request is waiting on this date.'}</p>
                  <Button variant="outline" block className="mt-3" onClick={() => {
                    setDay(null)
                    navigate(dayState === 'booked' ? 'vendor.bookings' : 'vendor.requests')
                  }}>
                    {dayState === 'booked' ? 'Open bookings' : 'Open requests'}
                  </Button>
                </div>
              )}

              {dayState === 'free' && (
                <div className="mt-4">
                  <Input label="Reason (only you see this)" value={reason} onChange={(e) => setReason(e.target.value)} leading={<Lock size={15} aria-hidden />} />
                  <p className="mt-2 text-[12px] font-semibold text-text-2">Blocked days show as unavailable on your profile. Requests for this day are turned away automatically.</p>
                  <Button
                    size="lg"
                    block
                    className="mt-4"
                    icon={Lock}
                    onClick={() => {
                      session.toggleDay(day, false)
                      track('vendor_block_day', day)
                      setDay(null)
                      toast(`${fmtDay(day)} blocked · ${reason}`, 'accent')
                    }}
                  >
                    Block this day
                  </Button>
                </div>
              )}

              {dayState === 'blocked' && (
                <div className="mt-4">
                  <p className="text-[14px] text-text-2">{userBlocked ? `Blocked this session: ${reason}.` : 'Blocked when you listed. Unblock to take requests again.'}</p>
                  <Button
                    size="lg"
                    block
                    variant="ink"
                    className="mt-4"
                    icon={LockOpen}
                    onClick={() => {
                      session.toggleDay(day, true)
                      track('vendor_unblock_day', day)
                      setDay(null)
                      toast(`${fmtDay(day)} is free again`, 'accent')
                    }}
                  >
                    Unblock
                  </Button>
                </div>
              )}
            </>
          )}
        </BottomSheet>
      }
    >
      {/* ── Header ── */}
      <header className="px-5" style={{ paddingTop: `calc(${SAFE_TOP} + 8px)` }}>
        <p className="label text-brass-ink">Availability</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="grot text-[34px]">Calendar</h1>
          <Segmented<ListingId>
            items={[
              { id: 'iyabola', label: 'Catering' },
              { id: 'ola-hall', label: 'Hall' },
            ]}
            value={which}
            onChange={(id) => {
              setWhich(id)
              track('vendor_calendar_listing', id)
            }}
            size="sm"
          />
        </div>
      </header>

      {/* ── 14-day band ── */}
      <section className="relative mx-5 mt-4 overflow-hidden rounded-[var(--r-container)] bg-ink p-4 text-on-ink">
        <div className="relative flex items-center justify-between gap-3">
          <span className="label truncate text-brass-light">Next 14 days · {v.name.replace(' Catering', '')}</span>
          <span className="meta shrink-0 text-on-ink-2">
            {fmtShort(CLOCK.todayIso)} – {fmtShort(addDays(CLOCK.todayIso, 13))}
          </span>
        </div>
        <div className="relative mt-3">
          <Strip vendor={v} size="md" labels tone="ink" onPick={(iso) => openDay(iso)} />
        </div>
        <div className="relative mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex items-center gap-3 text-[12px] font-semibold text-on-ink-2">
            {(['free', 'held', 'booked'] as Availability[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: AVAIL[k].fill, boxShadow: k === 'booked' ? '0 0 0 1.5px var(--on-ink-2)' : undefined }} />
                {AVAIL[k].label}
              </span>
            ))}
          </span>
          <span className="text-[12px] font-semibold text-on-ink-2">Tap a day to block or open it</span>
        </div>
      </section>

      {/* ── Counts strip (November) ── */}
      <section className="mt-5 flex items-stretch gap-0 px-5" aria-label="November at a glance">
        {(['free', 'held', 'booked', 'blocked'] as Availability[]).map((k, i) => (
          <div key={k} className={`flex flex-1 flex-col items-start ${i > 0 ? 'border-l border-[var(--rule)] pl-3' : ''}`}>
            <span className="figure num text-[30px]" style={{ color: k === 'blocked' ? 'var(--text-2)' : AVAIL[k].fill }}>
              {counts[k] ?? 0}
            </span>
            <span className="mt-0.5 text-[11px] font-bold text-text-2">{k === 'blocked' ? 'Blocked' : AVAIL[k].label}</span>
          </div>
        ))}
        <div className="flex flex-1 flex-col items-start border-l border-[var(--rule)] pl-3">
          <span className="figure num text-[30px] text-text-3">{counts.past ?? 0}</span>
          <span className="mt-0.5 text-[11px] font-bold text-text-2">Past</span>
        </div>
      </section>

      {/* ── Month grids ── */}
      {MONTHS.map(([y, m]) => {
        const cells = monthCells(y, m)
        return (
          <section key={`${y}-${m}`} className="mt-6 px-5" aria-label={`${MONTH_LONG[m]} ${y}`}>
            <div className="flex items-end justify-between">
              <h2 className="grot text-[22px]">
                {MONTH_LONG[m]} <span className="text-text-2">{y}</span>
              </h2>
              {m === 10 && <Badge tone="accent">This month</Badge>}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {DOW.map((d, i) => (
                <span key={`${d}-${i}`} className="meta pb-1 text-center text-text-2">
                  {d}
                </span>
              ))}
              {cells.map((iso, i) => {
                if (!iso) return <span key={`blank-${i}`} aria-hidden />
                const past = iso < CLOCK.todayIso
                const st = stateOn(iso)
                const today = iso === CLOCK.todayIso
                const fill = past ? 'color-mix(in oklch, var(--surface-high) 55%, transparent)' : st === 'free' ? AVAIL.free.soft : st === 'held' ? AVAIL.held.fill : st === 'booked' ? AVAIL.booked.fill : 'var(--blocked)'
                const color = past ? 'var(--text-3)' : st === 'free' ? AVAIL.free.onSoft : st === 'held' ? 'var(--on-brass)' : st === 'booked' ? 'var(--on-ink)' : 'var(--text-2)'
                return (
                  <motion.button
                    key={iso}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    transition={spring.ui}
                    onClick={() => openDay(iso)}
                    aria-label={`${fmtDay(iso)}: ${past ? 'past' : AVAIL[st].label}`}
                    className="relative grid h-[42px] w-full place-items-center rounded-[10px] text-[14px] font-bold"
                    style={{
                      backgroundColor: fill,
                      color,
                      backgroundImage: !past && st === 'blocked' ? 'repeating-linear-gradient(135deg, transparent 0 4px, rgb(18 60 53 / 0.08) 4px 6px)' : undefined,
                      boxShadow: today ? '0 0 0 2px var(--bg), 0 0 0 4px var(--brass)' : undefined,
                      textDecoration: past ? 'line-through' : undefined,
                      textDecorationColor: 'var(--paper-400)',
                    }}
                  >
                    {dayNum(iso)}
                    {!past && (st === 'held' || st === 'booked') && requestOn(iso) && <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-70" />}
                  </motion.button>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* ── Upcoming ── */}
      <section className="mt-8">
        <SectionHead eyebrow="Confirmed" title="Upcoming" action="Bookings" onAction={() => navigate('vendor.bookings')} />
        <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-2 flex flex-col px-5">
          <AnimatePresence initial={false}>
            {upcoming.map((r, i) => {
              const ev = eventById(r.eventId)
              const who = personById(r.by)
              return (
                <motion.li key={r.id} variants={listItem} layout className={i > 0 ? 'border-t border-[var(--rule)]' : ''}>
                  <Pressable
                    onClick={() => {
                      session.viewRequest(r.id)
                      navigate('vendor.request')
                    }}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-[12px] bg-ink py-1.5 text-on-ink">
                      <span className="label text-brass-light" style={{ fontSize: 10 }}>
                        {fmtShort(r.date).split(' ')[1]}
                      </span>
                      <span className="figure num text-[22px]">{dayNum(r.date)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{ev.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[12px] font-semibold text-text-2">
                        <span className="truncate">{vendorById(r.vendorId).name.replace(' Catering', '')}</span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} aria-hidden /> {r.headcount}
                        </span>
                        <span>{relDay(r.date)}</span>
                      </span>
                    </span>
                    <Avatar who={who.photo} size={28} alt={who.name} />
                    <Money amount={r.amount} size={18} />
                  </Pressable>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </motion.ul>
        <p className="mt-2 px-5 text-[12px] font-semibold text-text-2">
          Tonight’s dinner is live at the hall · Settled outside Edera · payments in a later phase
        </p>
      </section>
    </MobileScreen>
  )
}
