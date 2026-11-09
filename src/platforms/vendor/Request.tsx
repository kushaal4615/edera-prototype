import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Lock, MapPin, MessageCircle, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { AvailPill, Money, StateDot, Strip, StripLegend, Verified } from '../../components/Brand'
import { Button, IconButton } from '../../components/Button'
import { Confetti } from '../../components/Confetti'
import { Input, TextArea } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { addDays, ago, CLOCK, daysUntil, fmtDay, fmtShort, money } from '../../data/clock'
import { DEMO_ACCEPT_NOTE, DEMO_DECLINE_REASON, DEMO_PROPOSE } from '../../data/demoFill'
import { eventById, REQUESTS, requestById, type RequestState } from '../../data/events'
import { personById, PLANNER } from '../../data/people'
import { availabilityOn, vendorById, type Availability, type Vendor } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, session, useSession, type SessionState } from '../../lib/store'
import { track } from '../../lib/tracker'
import { tap } from '../../motion/springs'
import { fadeUp } from '../../motion/transitions'
import { Dock, MobileScreen, SAFE_TOP } from '../mobileShell'

/* vendor.request — one request. The event photograph runs behind the
   status bar with scrim buttons over it; the event name is set in
   Fraunces with the state pill. Then the requester, the DATE block with
   the listing's strip around the requested day, the package maths, the
   note as a quote, and a dock whose buttons follow the request's state. */

const MINE = ['iyabola', 'ola-hall']

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

const STATE_LABEL: Record<RequestState, string> = { requested: 'New request', accepted: 'Accepted', declined: 'Declined', proposed: 'New date proposed', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' }
const STATE_TONE: Record<RequestState, 'warn' | 'success' | 'danger' | 'info' | 'ink'> = { requested: 'warn', accepted: 'success', confirmed: 'success', completed: 'ink', declined: 'danger', cancelled: 'danger', proposed: 'info' }

type SheetKind = 'accept' | 'decline' | 'propose' | null

export default function VendorRequest() {
  const { navigate, back, toast } = useNav()
  const s = useSession((x) => x)
  const r = requestById(s.viewingRequest)
  const st = requestState(r.id, s)
  const ev = eventById(r.eventId)
  const who = personById(r.by)
  const planner = r.by === 'tunde'
  const baseListing = vendorById(r.vendorId)
  const listing = withSession(baseListing, s)
  const pkg = baseListing.packages.find((p) => p.id === r.packageId) ?? baseListing.packages[0]
  const other = MINE.filter((id) => id !== r.vendorId).map((id) => withSession(vendorById(id), s))[0]

  /* The date's state, excluding the hold this request itself creates. */
  const rawDay = availabilityOn(listing, r.date)
  const dayState: Availability = st === 'requested' && rawDay === 'held' && baseListing.calendar[r.date] !== 'held' ? 'free' : rawDay
  const clash = st === 'requested' && (dayState === 'booked' || dayState === 'blocked')
  const clashWith = REQUESTS.find((x) => x.id !== r.id && MINE.includes(x.vendorId) && x.date === r.date && ['confirmed', 'accepted', 'completed'].includes(requestState(x.id, s)))
  const clashText = dayState === 'blocked' ? (s.blockedDays.includes(r.date) ? 'you blocked this day' : 'you are unavailable that day') : clashWith ? `${eventById(clashWith.eventId).name} is booked` : 'the hall has a wedding booked and the kitchen is at capacity'
  const perUnit = pkg.unit === 'per head' ? `${money(pkg.price, baseListing.currency)} × ${r.headcount} guests` : pkg.unit === 'per day' ? `${money(pkg.price, baseListing.currency)} per day` : money(pkg.price, baseListing.currency)

  const [sheet, setSheet] = useState<SheetKind>(null)
  const [acceptNote, setAcceptNote] = useState(DEMO_ACCEPT_NOTE)
  const [declineReason, setDeclineReason] = useState(DEMO_DECLINE_REASON)
  const [proposeDate, setProposeDate] = useState(DEMO_PROPOSE.date)
  const [proposeNote, setProposeNote] = useState(DEMO_PROPOSE.note)
  const [confetti, setConfetti] = useState(false)
  useEffect(() => {
    if (!confetti) return
    const t = setTimeout(() => setConfetti(false), 1900)
    return () => clearTimeout(t)
  }, [confetti])

  const decide = (d: RequestState) => {
    if (d === 'proposed' && availabilityOn(listing, proposeDate) === 'blocked' && proposeDate >= CLOCK.todayIso) session.toggleDay(proposeDate, true)
    session.decideRequest(r.id, d)
    setSheet(null)
    track('vendor_decide_request', d, { id: r.id })
    if (d === 'confirmed') {
      setConfetti(true)
      toast(`Booking confirmed · ${who.first} has been notified`, 'accent')
    } else if (d === 'declined') toast(`Declined · ${who.first} has been told`, 'neutral')
    else toast(`Proposed ${fmtDay(proposeDate)} to ${who.first}`, 'info')
  }

  const proposeState = availabilityOn(listing, proposeDate)

  return (
    <MobileScreen
      cap="var(--night)"
      dockHeight={st === 'requested' ? 128 : 84}
      overlay={
        <>
          {/* scrim buttons over the hero */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3" style={{ paddingTop: `calc(${SAFE_TOP} + 6px)` }}>
            <IconButton icon={ChevronLeft} label="Back" tone="scrim" className="pointer-events-auto" onClick={() => back()} />
            <IconButton icon={MessageCircle} label={`Message ${who.first}`} tone="scrim" className="pointer-events-auto" onClick={() => toast(`Thread opens in Inbox: ${who.name}`, 'info')} />
          </div>
          <AnimatePresence>{confetti && <Confetti key="c" origin={0.3} />}</AnimatePresence>

          <BottomSheet open={sheet === 'accept'} onClose={() => setSheet(null)} title="Accept request">
            <div className="flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-3">
              <Avatar who={who.photo} size={40} alt="" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold">{ev.name}</span>
                <span className="block text-[12px] font-semibold text-text-2">
                  {fmtDay(r.date, true)} · {r.headcount} guests · {pkg.name}
                </span>
              </span>
              <Money amount={r.amount} currency={baseListing.currency} size={22} />
            </div>
            <div className="mt-4">
              <TextArea label={`Note to ${who.first}`} value={acceptNote} onChange={(e) => setAcceptNote(e.target.value)} rows={3} hint="Sent with the confirmation. The date flips to Booked on your calendar." />
            </div>
            <p className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-text-2">
              <Lock size={13} aria-hidden /> Settled outside Edera · payments in a later phase
            </p>
            <Button size="lg" block className="mt-4" icon={Check} onClick={() => decide('confirmed')}>
              Confirm booking
            </Button>
          </BottomSheet>

          <BottomSheet open={sheet === 'decline'} onClose={() => setSheet(null)} title="Decline request">
            <p className="text-[14px] text-text-2">
              {who.first} will see your reason and can send a new request. {dayState === 'booked' ? 'The date stays booked.' : 'The hold on this date is released.'}
            </p>
            <div className="mt-4">
              <TextArea label="Reason" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={3} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" block onClick={() => setSheet('propose')}>
                Propose a date instead
              </Button>
              <Button variant="danger" block onClick={() => decide('declined')}>
                Send decline
              </Button>
            </div>
          </BottomSheet>

          <BottomSheet open={sheet === 'propose'} onClose={() => setSheet(null)} title="Propose a new date">
            <Input label="New date" type="date" value={proposeDate} min={CLOCK.todayIso} onChange={(e) => setProposeDate(e.target.value)} leading={<CalendarDays size={16} aria-hidden />} />
            <div className="mt-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-bold">{listing.name} around {fmtShort(proposeDate)}</span>
                <AvailPill state={proposeState}>{proposeState === 'free' ? 'Free' : proposeState === 'held' ? 'Held' : proposeState === 'booked' ? 'Booked' : 'Unavailable'}</AvailPill>
              </div>
              <Strip vendor={listing} size="md" labels from={addDays(proposeDate, -3)} days={7} highlight={proposeDate} />
              {proposeState === 'blocked' && <p className="mt-2 text-[12px] font-semibold text-text-2">Marked unavailable on your calendar. Proposing it unblocks the day for both listings.</p>}
              {proposeState === 'booked' && <p className="mt-2 text-[12px] font-semibold text-danger-text">Already booked. Pick another date.</p>}
            </div>
            <div className="mt-3">
              <TextArea label={`Note to ${who.first}`} value={proposeNote} onChange={(e) => setProposeNote(e.target.value)} rows={2} />
            </div>
            <Button size="lg" block className="mt-4" trailing={ChevronRight} onClick={() => decide('proposed')}>
              Propose {fmtDay(proposeDate)}
            </Button>
          </BottomSheet>
        </>
      }
      dock={
        <Dock tone={st === 'requested' ? 'glass' : 'surface'}>
          {st === 'requested' ? (
            <div className="flex w-full flex-col gap-2">
              <div className="flex gap-2">
                {clash ? (
                  <>
                    <Button variant="danger" size="lg" block icon={X} onClick={() => setSheet('decline')}>
                      Decline
                    </Button>
                    <Button size="lg" block icon={CalendarDays} onClick={() => setSheet('propose')}>
                      Propose new date
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="lg" block onClick={() => setSheet('decline')}>
                      Decline
                    </Button>
                    <Button size="lg" block icon={Check} onClick={() => setSheet('accept')}>
                      Accept
                    </Button>
                  </>
                )}
              </div>
              {clash ? (
                <Button variant="ghost" size="sm" block onClick={() => setSheet('accept')}>
                  Accept anyway
                </Button>
              ) : (
                <Button variant="ghost" size="sm" block icon={CalendarDays} onClick={() => setSheet('propose')}>
                  Propose new date
                </Button>
              )}
            </div>
          ) : st === 'confirmed' || st === 'accepted' || st === 'completed' ? (
            <Button variant="ink" size="lg" block icon={Check} trailing={ChevronRight} onClick={() => navigate('vendor.bookings')}>
              Confirmed · View bookings
            </Button>
          ) : st === 'proposed' ? (
            <Button variant="ink" size="lg" block icon={CalendarDays} trailing={ChevronRight} onClick={() => navigate('vendor.requests')}>
              Proposed {fmtShort(r.proposedDate ?? proposeDate)} · Back to inbox
            </Button>
          ) : (
            <Button variant="outline" size="lg" block trailing={ChevronRight} onClick={() => navigate('vendor.requests')}>
              Declined · Back to inbox
            </Button>
          )}
        </Dock>
      }
    >
      {/* ── Hero ── */}
      <HeroImage src={ev.photo} alt={ev.name} className="h-[320px] w-full" scrim="both" position="center 35%">
        <div className="flex h-full flex-col justify-end px-5 pb-5 text-on-night">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center gap-2">
            <Badge tone={STATE_TONE[st]}>{STATE_LABEL[st]}</Badge>
            <span className="meta text-on-night-2">
              {ev.type} · {ev.city} · sent {ago(r.sentMinutesAgo)}
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="show" className="grot mt-2 text-[32px]" style={{ textShadow: '0 2px 16px rgb(11 38 34 / 0.5)' }}>
            {ev.name}
          </motion.h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-on-night-2">
            <MapPin size={13} aria-hidden /> {ev.venue}
          </p>
        </div>
      </HeroImage>

      {/* ── Requester ── */}
      <section className="flex items-center gap-3 px-5 pt-5">
        <Avatar who={who.photo} size={56} ring alt={who.name} verified={planner} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[17px] font-bold">
            {who.name} {planner && <Verified />}
          </p>
          <p className="text-[13px] font-semibold text-text-2">{planner ? `${PLANNER.business} · planner · ${PLANNER.eventsDone} events on Edera` : `Client · ${who.city} · first request`}</p>
        </div>
        <motion.button type="button" whileTap={tap} onClick={() => toast(`Thread opens in Inbox: ${who.name}`, 'info')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--surface)] shadow-[var(--shadow-raised)]" aria-label={`Message ${who.first}`}>
          <MessageCircle size={19} aria-hidden />
        </motion.button>
      </section>

      {/* ── THE DATE ── */}
      <section className="mx-5 mt-5 overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]" aria-label="Requested date">
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="label text-brass-ink">Requested date · {listing.name.replace(' Catering', '')}</p>
            <AvailPill state={dayState} className="!h-8 !text-[13px]">
              {dayState === 'free' ? 'Free' : dayState === 'held' ? 'Held for this' : dayState === 'booked' ? 'Booked' : 'Unavailable'}
            </AvailPill>
          </div>
          <p className="grot mt-1.5 text-[28px]">{fmtDay(r.date, true)}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-text-2">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock3 size={13} aria-hidden /> {r.slot}
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Users size={13} aria-hidden /> {r.headcount} guests
            </span>
            <span className="whitespace-nowrap">{daysUntil(r.date) === 0 ? 'today' : `in ${daysUntil(r.date)} days`}</span>
          </p>
        </div>
        <div className="px-5 pb-4 pt-4">
          <Strip vendor={listing} size="md" labels highlight={r.date} from={addDays(r.date, -6)} />
          <div className="mt-3 flex items-center justify-between">
            <StripLegend />
            <span className="meta text-text-2">
              {fmtShort(addDays(r.date, -6))} – {fmtShort(addDays(r.date, 7))}
            </span>
          </div>
        </div>
        {clash && (
          <div className="flex items-start gap-3 bg-danger-soft px-5 py-3 text-on-danger-soft">
            <AlertTriangle size={18} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden />
            <p className="text-[13px] font-semibold leading-snug">
              <span className="font-extrabold">Clash:</span> {clashText}. Decline, or propose a new date: {fmtDay(DEMO_PROPOSE.date)} is free.
            </p>
          </div>
        )}
        {other && !clash && (
          <div className="flex items-center justify-between bg-[var(--surface-tint)] px-5 py-3">
            <span className="text-[13px] font-semibold text-text-2">Your other listing that day</span>
            <StateDot state={availabilityOn(other, r.date)} label={`${other.name.replace(' Catering', '')} · ${availabilityOn(other, r.date) === 'free' ? 'free' : availabilityOn(other, r.date)}`} />
          </div>
        )}
      </section>

      {/* ── Package maths ── */}
      <section className="mt-6 px-5">
        <div className="flex items-end justify-between">
          <p className="label text-brass-ink">Package</p>
          {pkg.popular && <Badge tone="accent">Most booked</Badge>}
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="grot text-[24px]">{pkg.name}</p>
            <p className="mt-1.5 text-[13px] leading-snug text-text-2">{pkg.includes}</p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-[var(--rule)] pt-4">
          <div>
            <p className="meta text-text-2">{perUnit}</p>
            <p className="mt-1 text-[12px] font-semibold text-text-2">Quote · no deposit taken on Edera</p>
          </div>
          <Money amount={r.amount} currency={baseListing.currency} size={44} />
        </div>
        <p className="mt-3 flex items-center gap-2 rounded-[var(--r-control)] bg-[var(--surface-high)] px-3 py-2 text-[12px] font-semibold text-text-2">
          <Lock size={13} aria-hidden /> Settled outside Edera · payments in a later phase
        </p>
      </section>

      {/* ── Note ── */}
      {(r.note || st === 'proposed') && (
        <section className="mt-6 px-5">
          <p className="label text-brass-ink">Note from {who.first}</p>
          <blockquote className="mt-2 border-l-[3px] border-brass pl-4">
            <p className="grot text-[19px] leading-[1.2]">“{r.note ?? 'No note.'}”</p>
            <footer className="mt-2 flex items-center gap-2">
              <Avatar who={who.photo} size={22} alt="" />
              <span className="meta text-text-2">
                {who.first} · {ago(r.sentMinutesAgo)}
              </span>
            </footer>
          </blockquote>
        </section>
      )}

      {/* ── Decision summary once made ── */}
      <AnimatePresence>
        {st !== 'requested' && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-5 mt-6 rounded-[var(--r-card)] bg-ink p-4 text-on-ink">
            <p className="label text-brass-light">Your reply</p>
            <p className="mt-1.5 text-[14px] font-semibold leading-snug">
              {st === 'confirmed' || st === 'accepted' ? acceptNote : st === 'declined' ? (r.note?.startsWith('Declined') ? r.note : declineReason) : st === 'proposed' ? `${fmtDay(r.proposedDate ?? proposeDate, true)} · ${r.proposedDate ? r.note : proposeNote}` : 'Completed. Ask for a review.'}
            </p>
            <p className="mt-2 text-[12px] font-semibold text-on-ink-2">{st === 'confirmed' ? `Shows as Confirmed on ${who.first}’s board and the client’s bookings.` : 'Visible to the requester now.'}</p>
          </motion.section>
        )}
      </AnimatePresence>
      <div className="h-4" />
    </MobileScreen>
  )
}
