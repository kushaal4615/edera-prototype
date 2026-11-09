import { motion } from 'framer-motion'
import { ArrowUpRight, Bell, CalendarClock, MessageCircle, Search, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Money, Strip, Verified } from '../../components/Brand'
import { Button, IconButton } from '../../components/Button'
import { Rail } from '../../components/Media'
import { Segmented } from '../../components/Tabs'
import { addDays, ago, CLOCK, fmtDay, fmtShort, money } from '../../data/clock'
import { eventById, EVENTS, REQUESTS, RUBY, type BookingRequest, type RequestState } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { categoryById, vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, TopBar } from '../mobileShell'

/* pro.requests: every booking request on Tunde's events, with the live
   state from the store (so Bola's decision on the Vendor App flips the
   row here). Brass band of totals → event rail → segmented states →
   borderless editorial rows with the availability strip on the request
   date. Requests the client sent on one of Tunde's events are included
   and marked "Sent by …", so declined and new-date states are visible. */

type Seg = 'waiting' | 'accepted' | 'declined' | 'proposed'
type Row = { req: BookingRequest; state: RequestState; justNow?: boolean }

const segOf = (s: RequestState): Seg => (s === 'requested' ? 'waiting' : s === 'declined' || s === 'cancelled' ? 'declined' : s === 'proposed' ? 'proposed' : 'accepted')

const STATE_LABEL: Record<RequestState, string> = { requested: 'Waiting', accepted: 'Accepted', confirmed: 'Confirmed', completed: 'Completed', declined: 'Declined', cancelled: 'Cancelled', proposed: 'New date' }
const STATE_TONE: Record<RequestState, 'warn' | 'success' | 'danger' | 'info' | 'neutral'> = { requested: 'warn', accepted: 'success', confirmed: 'success', completed: 'neutral', declined: 'danger', cancelled: 'danger', proposed: 'info' }

const SHORT: Record<string, string> = { 'ev-ruby': 'Ruby anniversary', 'ev-engage': 'Tonight', 'ev-chidera': 'Chidera’s 1st', 'ev-mixer': 'Tech Mixer', 'ov-trad': 'Ola & Tomi', 'ev-ade': 'Ade’s 50th', 'ev-bisi': 'Bisi & Dami', 'ev-nkechi': 'Baby shower' }

export default function ProRequests() {
  const { navigate, toast } = useNav()
  const requestsSent = useSession((s) => s.requestsSent)
  const decisions = useSession((s) => s.requestDecisions)
  const [local, setLocal] = useState<Record<string, RequestState>>({})
  const [seg, setSeg] = useState<Seg>('waiting')
  const [eventFilter, setEventFilter] = useState<string | null>(null)

  const rows = useMemo<Row[]>(() => {
    const mine = REQUESTS.filter((r) => r.by === 'tunde' || r.by === eventById(r.eventId).client)
    const synthetic: Row[] = requestsSent
      .filter((vid) => !mine.some((r) => r.vendorId === vid && r.eventId === RUBY.id))
      .map((vid) => {
        const v = vendorById(vid)
        const pkg = v.packages.find((p) => p.popular) ?? v.packages[0]
        const amount = pkg.unit === 'per head' ? pkg.price * RUBY.guests : pkg.price
        return { req: { id: `sent-${vid}`, vendorId: vid, eventId: RUBY.id, by: 'tunde', packageId: pkg.id, date: RUBY.date, slot: '14:00 – 23:00', headcount: RUBY.guests, amount, state: 'requested', sentMinutesAgo: 0 }, state: 'requested', justNow: true }
      })
    const all: Row[] = [...synthetic, ...mine.map((r) => ({ req: r, state: local[r.id] ?? (decisions[r.id] ?? requestState(r.id)) }))]
    return all.sort((a, b) => a.req.sentMinutesAgo - b.req.sentMinutesAgo)
  }, [requestsSent, decisions, local])

  const counts = { waiting: 0, accepted: 0, declined: 0, proposed: 0 } as Record<Seg, number>
  rows.forEach((r) => counts[segOf(r.state)]++)
  const waiting = rows.filter((r) => segOf(r.state) === 'waiting')
  const gbpWaiting = waiting.filter((r) => vendorById(r.req.vendorId).currency === 'GBP').reduce((a, r) => a + r.req.amount, 0)
  const ngnWaiting = waiting.filter((r) => vendorById(r.req.vendorId).currency === 'NGN').reduce((a, r) => a + r.req.amount, 0)

  const eventsWithRequests = EVENTS.filter((e) => rows.some((r) => r.req.eventId === e.id))
  const visible = rows.filter((r) => segOf(r.state) === seg && (!eventFilter || r.req.eventId === eventFilter))

  const flip = (id: string, to: RequestState) => setLocal((l) => ({ ...l, [id]: to }))

  return (
    <MobileScreen
      header={<TopBar title="Requests" sub={`${rows.length} across ${eventsWithRequests.length} events · replies land here live`} right={<IconButton icon={Bell} label="Alerts" badge={counts.waiting} onClick={() => toast(`Alerts on · you’ll hear the moment a vendor replies`, 'info')} />} />}
      dock={
        <Dock>
          <Button variant="accent" block icon={Search} onClick={() => { session.setCategory(null); track('new_request'); navigate('pro.vendors') }}>
            Send a new request
          </Button>
        </Dock>
      }
    >
      {/* Brass band: what is out there waiting */}
      <section className="relative mx-4 mt-2 overflow-hidden rounded-[var(--r-container)] bg-brass p-5 text-on-brass">
        <div className="grain" aria-hidden />
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full border-[12px] border-[rgb(11_38_34/0.12)]" />
        <p className="label text-[rgb(11_38_34/0.7)]">Waiting on vendors</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <Money amount={gbpWaiting} currency="GBP" size={44} />
            {ngnWaiting > 0 && <p className="num mt-0.5 text-[13px] font-bold text-[rgb(11_38_34/0.75)]">+ {money(ngnWaiting, 'NGN')} in Lagos</p>}
          </div>
          <div className="num grid grid-cols-3 gap-x-4 text-right">
            {(['waiting', 'accepted', 'declined'] as Seg[]).map((k) => (
              <div key={k}>
                <p className="figure text-[24px]">{counts[k]}</p>
                <p className="label text-[10px] text-[rgb(11_38_34/0.7)]">{k}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-[rgb(11_38_34/0.12)] px-3 py-1.5 text-[12px] font-bold">
          <Zap size={13} strokeWidth={2.6} aria-hidden /> Most of these vendors reply within 2 hours
        </div>
      </section>

      {/* Event rail: filter */}
      <Rail className="mt-5 pb-1" gap={8}>
        <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => setEventFilter(null)} className={`flex h-10 shrink-0 snap-start items-center rounded-full px-4 text-[13px] font-bold ${eventFilter === null ? 'bg-ink text-on-ink' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}>
          All events
        </motion.button>
        {eventsWithRequests.map((e) => {
          const n = rows.filter((r) => r.req.eventId === e.id && segOf(r.state) === 'waiting').length
          const on = eventFilter === e.id
          return (
            <motion.button key={e.id} type="button" whileTap={tap} transition={spring.ui} onClick={() => setEventFilter(on ? null : e.id)} className={`flex h-10 shrink-0 snap-start items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] font-bold ${on ? 'bg-ink text-on-ink' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}>
              <img src={img(e.photo, 80)} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="whitespace-nowrap">{SHORT[e.id] ?? e.name}</span>
              {n > 0 && <span className={`num rounded-full px-1.5 text-[11px] ${on ? 'bg-brass text-on-brass' : 'bg-brass-soft text-on-brass-soft'}`}>{n}</span>}
            </motion.button>
          )
        })}
      </Rail>

      <div className="mt-4 px-4">
        <Segmented<Seg>
          full
          size="sm"
          tone="paper"
          value={seg}
          onChange={setSeg}
          items={[
            { id: 'waiting', label: 'Waiting' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'declined', label: 'Declined' },
            { id: 'proposed', label: 'New date' },
          ]}
        />
      </div>

      {/* Editorial rows */}
      <motion.ul key={seg + (eventFilter ?? '')} variants={listParent} initial="hidden" animate="show" className="mt-2">
        {visible.length === 0 && (
          <li className="px-5 py-10 text-center">
            <p className="grot text-[22px]">Nothing {seg === 'proposed' ? 'proposed' : seg} here</p>
            <p className="mt-1 text-[14px] text-text-2">Try another event or state above.</p>
          </li>
        )}
        {visible.map((row, i) => {
          const r = row.req
          const v = vendorById(r.vendorId)
          const ev = eventById(r.eventId)
          const pkg = v.packages.find((p) => p.id === r.packageId) ?? v.packages[0]
          const owner = personById(v.owner)
          const from = addDays(r.date, -6) < CLOCK.todayIso ? CLOCK.todayIso : addDays(r.date, -6)
          const s = segOf(row.state)
          return (
            <motion.li key={r.id} variants={listItem} className="px-5 py-4" style={i > 0 ? { boxShadow: 'inset 0 1px 0 var(--rule)' } : undefined}>
              <div className="flex gap-3">
                <img src={img(v.photos[0], 160)} alt="" className="h-[60px] w-[60px] shrink-0 rounded-[14px] object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1.5 text-[15px] font-bold">
                      <span className="truncate">{v.name}</span>
                      {v.verified && <Verified size={14} label={false} />}
                    </p>
                    <span className="meta shrink-0 text-text-2">{row.justNow ? 'just now' : ago(r.sentMinutesAgo)}</span>
                  </div>
                  <p className="truncate text-[13px] font-semibold text-text-2">{ev.name}</p>
                  <p className="mt-0.5 text-[13px] text-text-2">
                    {fmtDay(r.date)} · {pkg.name}
                    {r.by !== 'tunde' && <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--surface-high)] px-1.5 py-[1px] text-[11px] font-bold text-text">Sent by {personById(r.by).first}</span>}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-end gap-4 pl-[72px]">
                <div className="min-w-0 flex-1">
                  <Strip vendor={v} size="xs" from={from} highlight={r.date} />
                  <p className="meta mt-1 whitespace-nowrap text-text-2">14 days · ring = {fmtShort(r.date)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Money amount={r.amount} currency={v.currency} size={22} />
                  <div className="mt-1 flex justify-end">
                    <Badge tone={STATE_TONE[row.state]}>{STATE_LABEL[row.state]}</Badge>
                  </div>
                </div>
              </div>

              {s === 'proposed' && (
                <div className="ml-[72px] mt-3 rounded-[var(--r-card)] bg-info-soft p-3 text-on-info-soft">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold">
                    <CalendarClock size={14} aria-hidden /> {owner.first} proposed {fmtDay(r.proposedDate ?? r.date)}
                  </p>
                  {r.note && <p className="mt-1 text-[12px] leading-snug">{r.note}</p>}
                </div>
              )}
              {s === 'declined' && r.note && (
                <div className="ml-[72px] mt-3 rounded-[var(--r-card)] bg-danger-soft p-3 text-[12px] leading-snug text-on-danger-soft">{r.note}</div>
              )}

              <div className="mt-3 flex flex-wrap gap-2 pl-[72px]">
                {s === 'waiting' && (
                  <>
                    <Button size="sm" variant="outline" icon={Bell} onClick={() => { track('nudge_vendor', v.id); toast(`Nudged ${owner.first} · usually replies ${v.responseTime}`) }}>
                      Nudge
                    </Button>
                    <Button size="sm" variant="ghost" icon={MessageCircle} onClick={() => navigate('pro.messages')}>
                      Message
                    </Button>
                  </>
                )}
                {s === 'proposed' && (
                  <>
                    <Button size="sm" variant="accent" onClick={() => { flip(r.id, 'confirmed'); track('accept_new_date', r.id); toast(`Confirmed for ${fmtDay(r.proposedDate ?? r.date)} · ${ev.name}`, 'accent') }}>
                      Accept new date
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { flip(r.id, 'declined'); toast(`Declined · ${owner.first} has been told`) }}>
                      Decline
                    </Button>
                  </>
                )}
                {s === 'declined' && (
                  <>
                    <Button size="sm" variant="ink" icon={Search} onClick={() => { session.setCategory(v.category); track('find_another', v.category); navigate('pro.vendors') }}>
                      Find another {categoryById(v.category).label.toLowerCase()}
                    </Button>
                    <Button size="sm" variant="ghost" icon={MessageCircle} onClick={() => navigate('pro.messages')}>
                      Message
                    </Button>
                  </>
                )}
                {s === 'accepted' && (
                  <>
                    <Button size="sm" variant="paper" icon={ArrowUpRight} onClick={() => { session.viewEvent(ev.id); navigate('pro.event') }}>
                      Open event
                    </Button>
                    <Button size="sm" variant="ghost" icon={MessageCircle} onClick={() => navigate('pro.messages')}>
                      Message
                    </Button>
                  </>
                )}
              </div>
            </motion.li>
          )
        })}
      </motion.ul>

      <p className="meta mx-5 mt-4 rounded-[var(--r-card)] bg-[var(--surface-high)] px-3 py-2 text-center text-text-2">Quotes only · settled outside Edera · payments in a later phase</p>
    </MobileScreen>
  )
}
