import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarPlus, MessageCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { AvailPill, Bar, Money, Strip } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { Segmented } from '../../components/Tabs'
import { addDays, ago, daysUntil, fmtDay, fmtShort, money, pct } from '../../data/clock'
import { DEMO_BOOKING } from '../../data/demoFill'
import { REQUESTS, RUBY, THREADS, type RequestState } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, TopBar } from '../mobileShell'

/* app.bookings: "My bookings". Every request on the anniversary, live from
   the store so a decision Bola makes on the Vendor App flips the row here.
   Borderless editorial rows; the brass band on top carries the money. */

type Filter = 'all' | 'requested' | 'confirmed' | 'declined'
type Row = {
  id: string
  vendorId: string
  packageId: string
  date: string
  slot: string
  headcount: number
  amount: number
  state: RequestState
  by: string
  sentMinutesAgo: number
  note?: string
  proposedDate?: string
  justNow?: boolean
}

/* LOCAL DEMO ROW (to confirm): one declined quote so the Declined state is
   visible. The mobile-bar role is still "open" on the event, which this
   explains: the first bar declined on capacity. */
const LOCAL_DECLINED: Row = {
  id: 'rq-local-bar',
  vendorId: 'oriki',
  packageId: 'bar-4',
  date: RUBY.date,
  slot: '18:00 – 22:00',
  headcount: 180,
  amount: 2520,
  state: 'declined',
  by: 'tunde',
  sentMinutesAgo: 60 * 24 * 5,
  note: 'Declined: 180 guests is above what one bar team can serve. Happy to quote with two bars if needed.',
}

const STRIP_FROM = addDays(RUBY.date, -6)
const ORDER: Record<RequestState, number> = { proposed: 0, requested: 1, accepted: 2, confirmed: 3, completed: 4, declined: 5, cancelled: 6 }
const inFilter = (f: Filter, s: RequestState) => (f === 'all' ? true : f === 'requested' ? s === 'requested' || s === 'proposed' || s === 'accepted' : f === 'confirmed' ? s === 'confirmed' || s === 'completed' : s === 'declined' || s === 'cancelled')

function StatePill({ state }: { state: RequestState }) {
  if (state === 'confirmed' || state === 'accepted') return <AvailPill state="free">Confirmed</AvailPill>
  if (state === 'requested') return <AvailPill state="held">Requested</AvailPill>
  if (state === 'proposed') return <Badge tone="info">New date proposed</Badge>
  if (state === 'declined') return <Badge tone="danger">Declined</Badge>
  if (state === 'completed') return <Badge tone="success">Completed</Badge>
  return <Badge>Cancelled</Badge>
}

export default function AppBookings() {
  const { navigate, toast } = useNav()
  const state = useSession((s) => s)
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo<Row[]>(() => {
    const base: Row[] = REQUESTS.filter((r) => r.eventId === RUBY.id).map((r) => ({ ...r, state: requestState(r.id, state) }))
    const present = new Set(base.map((r) => r.vendorId))
    const synthetic: Row[] = state.requestsSent
      .filter((vid) => !present.has(vid))
      .map((vid) => {
        const v = vendorById(vid)
        const p = v.packages.find((x) => x.id === DEMO_BOOKING.packageId) ?? v.packages.find((x) => x.popular) ?? v.packages[0]
        const amount = p.unit === 'per head' ? p.price * Number(DEMO_BOOKING.headcount) : p.price
        return { id: `new-${vid}`, vendorId: vid, packageId: p.id, date: DEMO_BOOKING.date, slot: DEMO_BOOKING.slot, headcount: Number(DEMO_BOOKING.headcount), amount, state: 'requested', by: 'adaeze', sentMinutesAgo: 0, justNow: true }
      })
    return [...synthetic, ...base, LOCAL_DECLINED].sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.sentMinutesAgo - b.sentMinutesAgo)
  }, [state])

  const confirmed = rows.filter((r) => r.state === 'confirmed' || r.state === 'accepted' || r.state === 'completed')
  const waiting = rows.filter((r) => r.state === 'requested' || r.state === 'proposed')
  const declined = rows.filter((r) => r.state === 'declined' || r.state === 'cancelled')
  const sumConfirmed = confirmed.reduce((n, r) => n + r.amount, 0)
  const sumWaiting = waiting.reduce((n, r) => n + r.amount, 0)
  const committed = sumConfirmed + sumWaiting
  const visible = rows.filter((r) => inFilter(filter, r.state))

  const message = (row: Row) => {
    const v = vendorById(row.vendorId)
    const th = THREADS.find((t) => t.participants.includes('adaeze') && t.participants.includes(v.owner))?.id ?? 'th1'
    session.viewThread(th)
    navigate('app.thread')
  }
  const open = (row: Row) => {
    track('open_vendor_from_booking', row.vendorId)
    session.viewVendor(row.vendorId)
    navigate('app.vendor')
  }

  return (
    <MobileScreen
      header={<TopBar title="My bookings" sub={`${rows.length} vendors · ${daysUntil(RUBY.date)} days to go`} />}
      dock={
        <Dock>
          <Button block size="lg" icon={Search} onClick={() => navigate('app.explore')}>
            Request another vendor
          </Button>
        </Dock>
      }
    >
      {/* brass summary band */}
      <section className="relative mx-5 mt-1 overflow-hidden rounded-[var(--r-container)] bg-brass px-5 pb-5 pt-4 text-on-brass">
        <span className="dots-light" aria-hidden />
        <span className="grain" aria-hidden />
        <div className="relative">
          <p className="label">{RUBY.name}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <Money amount={committed} currency={RUBY.currency} size={48} tone="var(--on-brass)" />
            <div className="pb-1 text-right">
              <p className="num text-[13px] font-extrabold">
                {confirmed.length} confirmed <span className="font-semibold">· {money(sumConfirmed, RUBY.currency)}</span>
              </p>
              <p className="num text-[13px] font-extrabold">
                {waiting.length} requested <span className="font-semibold">· {money(sumWaiting, RUBY.currency)}</span>
              </p>
            </div>
          </div>
          <p className="num mt-1 text-[13px] font-semibold">
            committed of {money(RUBY.budget, RUBY.currency)} budget · {pct(committed, RUBY.budget)}%
          </p>
          <Bar value={pct(committed, RUBY.budget)} tone="ink" track="rgb(11 38 34 / 0.18)" className="mt-3" />
        </div>
      </section>

      <div className="scroll-x mt-4 px-5">
        <Segmented<Filter>
          size="sm"
          items={[
            { id: 'all', label: 'All', count: rows.length },
            { id: 'requested', label: 'Requested', count: waiting.length },
            { id: 'confirmed', label: 'Confirmed', count: confirmed.length },
            { id: 'declined', label: 'Declined', count: declined.length },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <motion.ul key={filter} variants={listParent} initial="hidden" animate="show" className="mt-2">
        {visible.map((row) => {
          const v = vendorById(row.vendorId)
          const p = v.packages.find((x) => x.id === row.packageId) ?? v.packages[0]
          const by = row.by === 'adaeze' ? 'You' : personById(row.by).first
          const dead = row.state === 'declined' || row.state === 'cancelled'
          return (
            <motion.li key={row.id} variants={listItem} className="rule-b px-5 py-4">
              <Pressable onClick={() => open(row)} aria-label={`${v.name}, ${row.state}`}>
                <div className="flex gap-3.5">
                  <div className={`relative h-[66px] w-[66px] shrink-0 overflow-hidden rounded-[14px] bg-[var(--surface-high)] ${dead ? 'saturate-50' : ''}`}>
                    <img src={img(v.photos[0], 240)} alt="" className="h-full w-full object-cover" />
                    {row.justNow && <span className="absolute inset-x-0 bottom-0 bg-accent py-0.5 text-center text-[10px] font-extrabold uppercase tracking-wide text-on-accent">New</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`truncate text-[16px] font-extrabold ${dead ? 'text-text-2 line-through decoration-[1.5px]' : ''}`}>{v.name}</p>
                      <span className={`num shrink-0 text-[16px] font-extrabold ${dead ? 'text-text-2' : ''}`}>{money(row.amount, v.currency)}</span>
                    </div>
                    <p className="truncate text-[13px] font-semibold text-text-2">
                      {p.name} · {row.headcount} guests
                    </p>
                    <p className="meta mt-0.5 text-text-2">
                      {fmtDay(row.date)} · {row.slot}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatePill state={row.state} />
                      <span className="meta text-text-2">
                        {by} · {row.justNow ? 'just now' : ago(row.sentMinutesAgo)}
                      </span>
                    </div>
                  </div>
                </div>
              </Pressable>
              {row.state === 'proposed' && row.proposedDate && <p className="mt-2.5 rounded-[var(--r-control)] bg-info-soft px-3 py-2 text-[12px] font-semibold text-on-info-soft">{v.name} proposed {fmtDay(row.proposedDate)} instead.</p>}
              {dead && row.note && <p className="mt-2.5 rounded-[var(--r-control)] bg-danger-soft px-3 py-2 text-[12px] font-semibold leading-snug text-on-danger-soft">{row.note}</p>}
              <div className="mt-3 flex items-center gap-3">
                <Strip vendor={v} from={STRIP_FROM} highlight={row.date} size="xs" className="min-w-0 flex-1" />
                <span className="meta shrink-0 text-text-2">
                  {fmtShort(STRIP_FROM)}–{fmtShort(addDays(STRIP_FROM, 13))}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="ghost" icon={MessageCircle} onClick={() => message(row)}>
                  Message
                </Button>
                {dead ? (
                  <Button size="sm" variant="paper" trailing={ArrowUpRight} onClick={() => navigate('app.explore')}>
                    Find another
                  </Button>
                ) : row.state === 'proposed' && row.proposedDate ? (
                  <Button size="sm" variant="paper" icon={CalendarPlus} onClick={() => toast(`Tunde will confirm ${fmtDay(row.proposedDate!)} with ${v.name}`)}>
                    Accept new date
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" trailing={ArrowUpRight} onClick={() => open(row)}>
                    View vendor
                  </Button>
                )}
              </div>
            </motion.li>
          )
        })}
      </motion.ul>

      <p className="mx-5 mt-5 rounded-[var(--r-card)] bg-[var(--surface-tint)] px-4 py-3 text-[12px] leading-snug text-text-2">
        <span className="font-bold text-text">Payments arrive in a later phase.</span> Quotes are the vendor’s own; once a booking is confirmed you settle directly with them. Edera doesn’t charge for this.
      </p>
    </MobileScreen>
  )
}
