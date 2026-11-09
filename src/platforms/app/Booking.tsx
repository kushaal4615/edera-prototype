import { motion } from 'framer-motion'
import { ArrowRight, Check, Clock3, MessageCircle, Minus, Plus, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { AvailPill, Money, Stars, Strip, StripLegend, Verified } from '../../components/Brand'
import { Button } from '../../components/Button'
import { Confetti } from '../../components/Confetti'
import { CheckMark, TextArea } from '../../components/Form'
import { Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { addDays, dayNum, daysUntil, dowLabel, fmtDay, fmtShort, money, monthLabel, parseIso } from '../../data/clock'
import { DEMO_BOOKING } from '../../data/demoFill'
import { RUBY, THREADS } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { availabilityOn, categoryById, vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, StepBar } from '../mobileShell'

/* app.booking: "Send a booking request". The request is the whole journey
   in v1: no payment step follows. The vendor's availability strip sits
   here as a band so the visitor can move the date and watch the quote. */

const SLOTS = ['12:00 – 21:00', '13:00 – 22:00', DEMO_BOOKING.slot, '15:00 – 00:00', '16:00 – 01:00']
const STRIP_FROM = addDays(RUBY.date, -5)

export default function AppBooking() {
  const { navigate, toast } = useNav()
  const vendorId = useSession((s) => s.viewingVendor)
  const vendor = vendorById(vendorId)
  const owner = personById(vendor.owner)
  const category = categoryById(vendor.category)

  const [date, setDate] = useState(DEMO_BOOKING.date)
  const [pkgId, setPkgId] = useState(() => (vendor.packages.find((p) => p.id === DEMO_BOOKING.packageId) ?? vendor.packages.find((p) => p.popular) ?? vendor.packages[0]).id)
  const [headcount, setHeadcount] = useState(Number(DEMO_BOOKING.headcount))
  const [slot, setSlot] = useState(DEMO_BOOKING.slot)
  const [note, setNote] = useState(DEMO_BOOKING.note)
  const [agree, setAgree] = useState(DEMO_BOOKING.agree)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const pkg = vendor.packages.find((p) => p.id === pkgId) ?? vendor.packages[0]
  const perHead = pkg.unit === 'per head'
  const amount = perHead ? pkg.price * headcount : pkg.unit === 'per hour' ? pkg.price * 8 : pkg.price
  const avail = availabilityOn(vendor, date)
  const year = parseIso(date).getUTCFullYear()
  const threadId = THREADS.find((t) => t.participants.includes('adaeze') && t.participants.includes(vendor.owner))?.id ?? 'th2'

  /* a short "Sending…" beat, then the confirmation sheet */
  useEffect(() => {
    if (!sending) return
    const id = window.setTimeout(() => {
      session.sendRequest(vendor.id)
      setSending(false)
      setSent(true)
    }, 1100)
    return () => window.clearTimeout(id)
  }, [sending, vendor.id])

  const send = () => {
    if (sending) return
    if (!agree) {
      toast('Tick the booking terms to send your request', 'warn')
      return
    }
    if (avail === 'booked' || avail === 'blocked') {
      toast(`${owner.first} is not available on ${fmtDay(date)}. Pick another day on the strip.`, 'warn')
      return
    }
    track('send_booking_request', vendor.id)
    setSending(true)
  }

  const pick = (iso: string, state: ReturnType<typeof availabilityOn>) => {
    if (state === 'booked' || state === 'blocked') {
      toast('Already booked that day', 'warn')
      return
    }
    setDate(iso)
    toast(`Date moved to ${fmtDay(iso)}${state === 'held' ? ' · another request is waiting that day' : ''}`)
  }

  return (
    <MobileScreen
      header={<StepBar step={2} total={3} label="Send a booking request" />}
      dock={
        <Dock>
          <Button block size="lg" trailing={ArrowRight} onClick={send} aria-label={sending ? 'Sending request' : 'Send request'}>
            {sending ? 'Sending…' : 'Send request'}
          </Button>
        </Dock>
      }
      overlay={
        <BottomSheet open={sent} onClose={() => setSent(false)} title="Request sent" tall>
          <Confetti origin={0.12} count={54} />
          <div className="relative overflow-hidden rounded-[var(--r-container)] bg-[var(--surface-high)] p-5">
            <span className="arc" style={{ top: '82%', bottom: 'auto', right: '-26%', width: '76%' }} aria-hidden />
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.pop} className="grid h-12 w-12 place-items-center rounded-full bg-accent text-on-accent">
              <Check size={26} strokeWidth={3} aria-hidden />
            </motion.span>
            <p className="grot mt-4 text-[28px]">
              Request sent to <em>{vendor.name}</em>
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar who={owner.photo} size={44} ring />
              <p className="text-[13px] text-text-2">
                <span className="font-bold text-text">{owner.first}</span> usually replies {vendor.responseTime}. You’ll get a notification when the booking moves to <span className="font-bold text-text">Confirmed</span>.
              </p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 px-1">
            <div>
              <dt className="label text-text-2">Date</dt>
              <dd className="mt-0.5 text-[15px] font-bold">{fmtDay(date, true)}</dd>
            </div>
            <div>
              <dt className="label text-text-2">Time</dt>
              <dd className="mt-0.5 text-[15px] font-bold">{slot}</dd>
            </div>
            <div>
              <dt className="label text-text-2">Package</dt>
              <dd className="mt-0.5 text-[15px] font-bold">{pkg.name}</dd>
            </div>
            <div>
              <dt className="label text-text-2">Quote</dt>
              <dd className="mt-0.5 text-[15px] font-bold num">
                {money(amount, vendor.currency)} <span className="font-semibold text-text-2">· {headcount} guests</span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-[var(--r-control)] bg-accent-soft px-3 py-2 text-[12px] font-semibold text-on-accent-soft">No payment now. You settle with {owner.first} outside Edera in this phase.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button className="w-full" size="lg" onClick={() => navigate('app.bookings')}>
              View my bookings
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              icon={MessageCircle}
              onClick={() => {
                session.viewThread(threadId)
                navigate('app.thread')
              }}
            >
              Message {owner.first}
            </Button>
          </div>
        </BottomSheet>
      }
    >
      {/* split top: vendor on the left, the date on the right */}
      <section className="flex gap-4 px-5 pt-2">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="relative h-[124px] overflow-hidden rounded-[var(--r-card)] bg-[var(--surface-high)]">
            <img src={img(vendor.photos[0], 480)} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-2.5 top-2.5">
              <Badge tone="ink">{category.label}</Badge>
            </span>
          </div>
          <div className="min-w-0">
            <p className="grot text-[22px] leading-[1.05]">{vendor.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {vendor.verified && <Verified />}
              <Stars rating={vendor.rating} count={vendor.reviews} />
            </div>
            <p className="meta mt-1.5 text-text-2">
              {vendor.years} yrs · {vendor.area}
            </p>
          </div>
        </div>
        <div className="flex w-[124px] shrink-0 flex-col items-center justify-between rounded-[var(--r-card)] bg-[var(--surface)] px-2 py-3 text-center shadow-[var(--shadow-raised)]">
          <p className="label text-brass-ink">{dowLabel(date)}</p>
          <span className="figure num text-[64px]">{dayNum(date)}</span>
          <p className="text-[13px] font-bold">
            {monthLabel(date)} {year}
          </p>
          <AvailPill state={avail} className="mt-2">
            {avail === 'free' ? 'Free' : avail === 'held' ? 'Held' : avail === 'booked' ? 'Booked' : 'Closed'}
          </AvailPill>
          <p className="meta mt-1.5 text-text-2">in {daysUntil(date)} days</p>
        </div>
      </section>

      {/* the strip as a band: tap a day to move the request */}
      <section className="mt-5 bg-[var(--surface-tint)] px-5 py-4">
        <div className="flex items-end justify-between">
          <p className="label text-text-2">Change the date</p>
          <p className="meta text-text-2">
            {fmtShort(STRIP_FROM)} – {fmtShort(addDays(STRIP_FROM, 13))}
          </p>
        </div>
        <Strip vendor={vendor} from={STRIP_FROM} highlight={date} size="md" labels className="mt-2" onPick={pick} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <StripLegend />
          <p className="text-[11px] font-semibold text-text-2">{avail === 'held' ? 'Held = a request is waiting. Yours can still go in.' : 'Booked days can’t be requested.'}</p>
        </div>
      </section>

      {/* package picker: radio rows, no card boxes */}
      <section className="mt-6 px-5">
        <div className="flex items-end justify-between">
          <h2 className="grot text-[22px]">Package</h2>
          <p className="meta text-text-2">{vendor.packages.length} options</p>
        </div>
        <ul className="mt-2">
          {vendor.packages.map((p) => {
            const on = p.id === pkg.id
            return (
              <li key={p.id} className="rule-b">
                <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring.ui} onClick={() => setPkgId(p.id)} aria-pressed={on} className="flex w-full items-start gap-3 py-3.5 text-left">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${on ? 'bg-accent text-on-accent' : 'ring-1 ring-inset ring-[var(--rule-strong)]'}`}>{on && <Check size={14} strokeWidth={3.2} aria-hidden />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`text-[15px] ${on ? 'font-extrabold' : 'font-bold'}`}>{p.name}</span>
                      {p.popular && <Badge tone="accent">Popular</Badge>}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-text-2">{p.includes}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="num block text-[15px] font-extrabold">{money(p.price, vendor.currency)}</span>
                    <span className="meta block text-text-2">{p.unit === 'per head' ? '/ head' : p.unit}</span>
                  </span>
                </motion.button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* headcount + time */}
      <section className="mt-5 flex items-stretch gap-3 px-5">
        <div className="flex flex-1 flex-col justify-between rounded-[var(--r-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
          <div className="flex items-center gap-1.5 text-text-2">
            <Users size={14} strokeWidth={2.4} aria-hidden />
            <span className="label">Guests</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => setHeadcount((n) => Math.max(10, n - 10))} aria-label="Ten fewer guests" className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-high)]">
              <Minus size={18} strokeWidth={2.6} aria-hidden />
            </motion.button>
            <span className="figure num text-[34px]">{headcount}</span>
            <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => setHeadcount((n) => Math.min(600, n + 10))} aria-label="Ten more guests" className="grid h-11 w-11 place-items-center rounded-full bg-ink text-on-ink">
              <Plus size={18} strokeWidth={2.6} aria-hidden />
            </motion.button>
          </div>
          <p className="meta mt-2 text-text-2">{headcount === RUBY.guests ? 'matches your guest list' : `guest list says ${RUBY.guests}`}</p>
        </div>
        <div className="w-[128px] shrink-0 rounded-[var(--r-card)] bg-ink p-4 text-on-ink">
          <div className="flex items-center gap-1.5 text-on-ink-2">
            <Clock3 size={14} strokeWidth={2.4} aria-hidden />
            <span className="label">Service</span>
          </div>
          <p className="num mt-3 text-[20px] font-extrabold leading-tight">{slot.split(' – ')[0]}</p>
          <p className="num text-[13px] font-semibold text-on-ink-2">to {slot.split(' – ')[1]}</p>
          <p className="meta mt-3 text-brass-light">{RUBY.time} doors</p>
        </div>
      </section>
      <Rail className="mt-3" gap={8}>
        {SLOTS.map((s) => {
          const on = s === slot
          return (
            <motion.button key={s} type="button" whileTap={tap} transition={spring.ui} onClick={() => setSlot(s)} aria-pressed={on} className={`num h-10 shrink-0 snap-start rounded-full px-4 text-[13px] font-bold ${on ? 'bg-accent text-on-accent' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}>
              {s}
            </motion.button>
          )
        })}
      </Rail>

      {/* note */}
      <section className="mt-6 px-5">
        <TextArea label={`A note for ${owner.first}`} rows={4} value={note} onChange={(e) => setNote(e.target.value)} hint="Dietary tables, access times, anything the quote should cover." />
      </section>

      {/* the quote: ink block with the arc */}
      <section className="relative mx-5 mt-6 overflow-hidden rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
        <span className="arc" style={{ top: '58%', bottom: 'auto', right: '-22%', width: '72%' }} aria-hidden />
        <span className="grain" aria-hidden />
        <p className="label text-brass-light">Your quote</p>
        <div className="mt-2">
          <Money amount={amount} currency={vendor.currency} size={48} tone="var(--on-ink)" />
        </div>
        <p className="num mt-1 text-[13px] font-semibold text-on-ink-2">{perHead ? `${money(pkg.price, vendor.currency)} per head × ${headcount} guests` : pkg.unit === 'per hour' ? `${money(pkg.price, vendor.currency)} per hour × 8 hours` : `${pkg.name} · ${pkg.unit === 'per day' ? 'day rate' : 'flat rate'}`}</p>
        <div className="relative mt-4 flex gap-3 rounded-[var(--r-card)] bg-[rgb(255_255_255/0.08)] p-3.5">
          <ShieldCheck size={20} strokeWidth={2.2} className="mt-0.5 shrink-0 text-brass-light" aria-hidden />
          <p className="text-[13px] leading-snug">No payment now. The vendor confirms first; you settle outside Edera in this phase.</p>
        </div>
      </section>

      <button type="button" onClick={() => setAgree((a) => !a)} aria-pressed={agree} className="mt-4 flex w-full items-start gap-3 px-5 py-3 text-left">
        <CheckMark on={agree} />
        <span className="text-[13px] leading-snug text-text-2">
          I agree to Edera’s booking terms. <span className="font-bold text-text">{owner.first}</span> can accept, decline or propose a new date; nothing is charged.
        </span>
      </button>
    </MobileScreen>
  )
}
