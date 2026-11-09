import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarDays, ChevronRight, Clock3, Users, Zap } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Money, StateDot, Verified } from '../../components/Brand'
import { Pressable } from '../../components/Button'
import { EmptyState } from '../../components/Media'
import { Segmented } from '../../components/Tabs'
import { ago, CLOCK, fmtDay, fmtShort } from '../../data/clock'
import { eventById, REQUESTS, type BookingRequest, type RequestState } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { availabilityOn, vendorById, type Availability, type Vendor } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, session, useSession, type SessionState } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { MobileScreen, SAFE_TOP } from '../mobileShell'

/* vendor.requests — the inbox. A brass band at the top carries the
   response-time nudge; a segmented filter; then borderless rows separated
   by rhythm, each with the event photograph, the requester's face, the
   amount and the listing's availability on the requested date. A booked
   date wears a "Date clash" pill. */

const MINE = ['iyabola', 'ola-hall']
type Tab = 'new' | 'accepted' | 'declined' | 'proposed'
const TAB_STATES: Record<Tab, RequestState[]> = {
  new: ['requested'],
  accepted: ['accepted', 'confirmed', 'completed'],
  declined: ['declined', 'cancelled'],
  proposed: ['proposed'],
}

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

export default function VendorRequests() {
  const { navigate } = useNav()
  const s = useSession((x) => x)
  const [tab, setTab] = useState<Tab>('new')

  const inbox = REQUESTS.filter((r) => MINE.includes(r.vendorId))
  const counts = (Object.keys(TAB_STATES) as Tab[]).reduce((acc, t) => ({ ...acc, [t]: inbox.filter((r) => TAB_STATES[t].includes(requestState(r.id, s))).length }), {} as Record<Tab, number>)
  const rows = inbox
    .filter((r) => TAB_STATES[tab].includes(requestState(r.id, s)))
    .sort((a, b) => (tab === 'new' ? a.sentMinutesAgo - b.sentMinutesAgo : a.date.localeCompare(b.date)))
  const listings: Record<string, Vendor> = { iyabola: withSession(vendorById('iyabola'), s), 'ola-hall': withSession(vendorById('ola-hall'), s) }

  /** Availability on the requested date, ignoring the hold this very request creates. */
  const dateState = (r: BookingRequest): Availability => {
    const v = listings[r.vendorId]
    const base = availabilityOn(v, r.date)
    const st = requestState(r.id, s)
    if (st === 'requested' && base === 'held') return vendorById(r.vendorId).calendar[r.date] === 'held' ? 'held' : 'free'
    return base
  }

  const open = (r: BookingRequest) => {
    session.viewRequest(r.id)
    track('vendor_open_request', r.id)
    navigate('vendor.request')
  }

  return (
    <MobileScreen tab="requests" bg="var(--bg)">
      {/* ── Header on paper ── */}
      <header className="px-5" style={{ paddingTop: `calc(${SAFE_TOP} + 8px)` }}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label text-brass-ink">Inbox</p>
            <h1 className="grot mt-1 text-[34px]">Requests</h1>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => navigate('vendor.calendar')} className="mb-1 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-text" style={{ boxShadow: 'inset 0 0 0 1px var(--rule-strong)' }}>
            <CalendarDays size={15} aria-hidden /> Calendar
          </motion.button>
        </div>
      </header>

      {/* ── Brass band ── */}
      <div className="relative mx-5 mt-4 overflow-hidden rounded-[var(--r-card)] bg-brass px-4 py-3 text-on-brass">
        <span aria-hidden className="dots-light" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgb(11_38_34/0.14)]">
            <Zap size={17} strokeWidth={2.4} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 text-[14px] font-bold leading-snug">
            {counts.new} new · reply within 2h keeps your badge
            <span className="block text-[12px] font-semibold text-[var(--ever-950)]/80">Your median this month: 1h 48m · faster than 82% of caterers</span>
          </p>
        </div>
      </div>

      <div className="scroll-x mt-4 flex px-5">
        <Segmented<Tab>
          items={[
            { id: 'new', label: 'New', count: counts.new },
            { id: 'accepted', label: 'Accepted', count: counts.accepted },
            { id: 'declined', label: 'Declined', count: counts.declined },
            { id: 'proposed', label: 'New date', count: counts.proposed },
          ]}
          value={tab}
          onChange={(t) => {
            setTab(t)
            track('vendor_requests_tab', t)
          }}
          size="sm"
        />
        <span aria-hidden className="w-5 shrink-0" />
      </div>

      {/* ── Rows ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul key={tab} variants={listParent} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.12 } }} className="mt-2 flex flex-col px-5" aria-label={`${tab} requests`}>
          {rows.length === 0 && (
            <li>
              <EmptyState title="Nothing here yet" body={tab === 'new' ? 'Every new request lands here. Reply within two hours to keep your fast-reply badge.' : 'Decisions you make on a request show up here and on the planner’s board.'} />
            </li>
          )}
          {rows.map((r, i) => {
            const who = personById(r.by)
            const ev = eventById(r.eventId)
            const listing = listings[r.vendorId]
            const st = requestState(r.id, s)
            const avail = dateState(r)
            const clash = st === 'requested' && (avail === 'booked' || avail === 'blocked')
            const planner = r.by === 'tunde'
            const pkg = [...vendorById('iyabola').packages, ...vendorById('ola-hall').packages].find((p) => p.id === r.packageId)
            return (
              <motion.li key={r.id} variants={listItem} className={i > 0 ? 'border-t border-[var(--rule)]' : ''}>
                <Pressable onClick={() => open(r)} className="flex gap-3 py-4">
                  <span className="relative shrink-0">
                    <img src={img(ev.photo, 200)} alt="" loading="lazy" className="h-[64px] w-[64px] rounded-[14px] object-cover" />
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-full ring-2 ring-[var(--bg)]">
                      <Avatar who={who.photo} size={28} alt={who.name} />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">
                          <span className="truncate">{who.name}</span>
                          {planner && <Verified size={14} label={false} />}
                        </span>
                        <span className="block truncate text-[13px] font-semibold text-text-2">
                          {planner ? 'Planner · ' : 'Client · '}
                          {ev.name}
                        </span>
                      </span>
                      <Money amount={r.amount} size={20} className="shrink-0 pt-0.5" />
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-text-2">
                      <span className="inline-flex items-center gap-1 text-text">
                        <CalendarDays size={13} aria-hidden /> {fmtDay(r.date, r.date.slice(0, 4) !== CLOCK.todayIso.slice(0, 4))}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} aria-hidden /> {r.headcount}
                      </span>
                      <span className="truncate">{listing.name.replace(' Catering', '')} · {pkg?.name}</span>
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {clash ? (
                          <Badge tone="danger" icon={<AlertTriangle size={11} strokeWidth={2.6} aria-hidden />}>
                            Date clash
                          </Badge>
                        ) : st === 'requested' ? (
                          <StateDot state={avail} label={avail === 'held' ? 'Held for this' : avail === 'free' ? `Free ${fmtShort(r.date)}` : undefined} />
                        ) : (
                          <Badge tone={st === 'confirmed' || st === 'accepted' ? 'success' : st === 'completed' ? 'ink' : st === 'proposed' ? 'warn' : 'danger'}>
                            {st === 'proposed' && r.proposedDate ? `Proposed ${fmtShort(r.proposedDate)}` : st}
                          </Badge>
                        )}
                      </span>
                      <span className="meta inline-flex items-center gap-1 text-text-2">
                        <Clock3 size={11} aria-hidden /> {ago(r.sentMinutesAgo)}
                        <ChevronRight size={14} className="ml-1" aria-hidden />
                      </span>
                    </span>
                  </span>
                </Pressable>
              </motion.li>
            )
          })}
        </motion.ul>
      </AnimatePresence>

      {/* ── Footer link ── */}
      <div className="mt-2 px-5">
        <Pressable onClick={() => navigate('vendor.bookings')} className="flex items-center justify-between rounded-[var(--r-card)] bg-[var(--surface-tint)] px-4 py-3">
          <span>
            <span className="block text-[14px] font-bold">Confirmed bookings</span>
            <span className="block text-[12px] font-semibold text-text-2">Quotes only · settled outside Edera · payments in a later phase</span>
          </span>
          <ChevronRight size={18} className="text-text-2" aria-hidden />
        </Pressable>
      </div>
    </MobileScreen>
  )
}
