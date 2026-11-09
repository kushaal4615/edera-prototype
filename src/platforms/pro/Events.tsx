import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Plus, QrCode, Users } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { Input, TextArea } from '../../components/Form'
import { BottomSheet } from '../../components/Sheet'
import { Segmented } from '../../components/Tabs'
import { daysUntil, fmtDay, MONTH_LONG, moneyShort, parseIso, pct, plural, relDay } from '../../data/clock'
import { EVENTS, type Event, type EventStatus } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { useNav } from '../../lib/navigation'
import { session } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { MobileScreen, TopBar } from '../mobileShell'

/* pro.events: all eight events as a borderless editorial list, filtered
   Live / Upcoming / Planning / Done, with a colour-block divider per month
   coloured by the first event of that month. */

type Filter = 'all' | 'live' | 'upcoming' | 'planning' | 'done'
const GROUP: Record<EventStatus, Exclude<Filter, 'all'>> = { live: 'live', confirmed: 'upcoming', planning: 'planning', done: 'done' }
const STATUS_LABEL: Record<EventStatus, string> = { live: 'Live now', confirmed: 'Confirmed', planning: 'Planning', done: 'Done' }
const STATUS_TONE: Record<EventStatus, 'danger' | 'success' | 'neutral' | 'ink'> = { live: 'danger', confirmed: 'success', planning: 'neutral', done: 'ink' }

const monthKey = (iso: string) => iso.slice(0, 7)
const monthTitle = (iso: string) => {
  const d = parseIso(iso)
  return `${MONTH_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

const DEMO_NEW_EVENT = { name: 'Ade’s 50th · after-party', type: 'Birthday', date: '2027-01-17', time: '21:00', city: 'London', guests: '60', budget: '2400', note: 'After-party for the 50th the night before. Olá Hall late licence, DJ Kaytee to stay on.' }

export default function ProEvents() {
  const { navigate, toast } = useNav()
  const [filter, setFilter] = useState<Filter>('all')
  const [sheet, setSheet] = useState(false)
  const [draft, setDraft] = useState(DEMO_NEW_EVENT)

  const counts = { live: 0, upcoming: 0, planning: 0, done: 0 } as Record<Exclude<Filter, 'all'>, number>
  for (const e of EVENTS) counts[GROUP[e.status]] += 1

  /* chronological from today; what is already done goes to the end */
  const sorted = [...EVENTS].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || a.date.localeCompare(b.date))
  const list = filter === 'all' ? sorted : sorted.filter((e) => GROUP[e.status] === filter)
  const totalGuests = EVENTS.filter((e) => e.status !== 'done').reduce((n, e) => n + e.guests, 0)

  const open = (e: Event) => {
    track('open_event', e.id)
    session.viewEvent(e.id)
    navigate('pro.event')
  }

  /* group rows by month, keeping order */
  const months: { key: string; title: string; events: Event[] }[] = []
  for (const e of list) {
    const k = monthKey(e.date)
    const last = months[months.length - 1]
    if (last && last.key === k) last.events.push(e)
    else months.push({ key: k, title: monthTitle(e.date), events: [e] })
  }

  return (
    <MobileScreen
      tab="events"
      header={
        <TopBar
          back={false}
          large
          title={
            <>
              My <em>events</em>
            </>
          }
          sub={`${EVENTS.length} events · ${totalGuests.toLocaleString('en-GB')} guests still to host · 1 live tonight`}
          right={
            <Button size="sm" variant="ink" icon={Plus} onClick={() => setSheet(true)}>
              New event
            </Button>
          }
        />
      }
      overlay={
        <BottomSheet open={sheet} onClose={() => setSheet(false)} title="New event" tall>
          <div className="flex flex-col gap-3 pt-1">
            <Input label="Event name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              <Input label="Start" type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} />
              <Input label="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
              <Input label="Guests" inputMode="numeric" value={draft.guests} onChange={(e) => setDraft({ ...draft, guests: e.target.value })} />
            </div>
            <Input label="Budget (£)" inputMode="numeric" value={draft.budget} hint="Settled outside Edera · payments in a later phase" onChange={(e) => setDraft({ ...draft, budget: e.target.value })} />
            <TextArea label="Notes for the board" rows={3} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            <div className="flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface-raised)] p-3">
              <Avatar who="kunle" size={36} alt="Kunle Adewale" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold">Client · Kunle Adewale</p>
                <p className="text-[12px] text-text-2">Already on Edera · sees the summary in his portal</p>
              </div>
              <Badge tone="accent">Linked</Badge>
            </div>
            <Button
              size="lg"
              block
              className="mt-1"
              onClick={() => {
                track('create_event', draft.name)
                setSheet(false)
                toast(`“${draft.name}” created · ${fmtDay(draft.date)} · ${draft.guests} guests`, 'accent')
              }}
            >
              Create event
            </Button>
          </div>
        </BottomSheet>
      }
    >
      <div className="scroll-x flex px-5 pt-1" style={{ scrollSnapType: 'none' }}>
        <Segmented<Filter>
          size="sm"
          tone="ink"
          items={[
            { id: 'all', label: 'All' },
            { id: 'live', label: 'Live', count: counts.live },
            { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { id: 'planning', label: 'Planning', count: counts.planning },
            { id: 'done', label: 'Done', count: counts.done },
          ]}
          value={filter}
          onChange={(f) => { setFilter(f); track('filter_events', f) }}
        />
      </div>

      <motion.div key={filter} variants={listParent} initial="hidden" animate="show" className="mt-3">
        {months.map((m) => {
          const lead = m.events[0]
          const guests = m.events.reduce((n, e) => n + e.guests, 0)
          return (
            <section key={m.key}>
              {/* colour-block month divider */}
              <motion.div variants={listItem} className="relative mx-5 mt-4 overflow-hidden rounded-[var(--r-card)] px-4 py-3" style={{ background: lead.colour, color: '#fff' }}>
                <span aria-hidden className="dots-light" />
                <div className="relative flex items-end justify-between">
                  <span className="grot text-[22px]">{m.title}</span>
                  <span className="text-[12px] font-semibold" style={{ color: 'rgb(255 255 255 / 0.82)' }}>
                    {plural(m.events.length, 'event')} · {guests.toLocaleString('en-GB')} guests
                  </span>
                </div>
              </motion.div>

              {m.events.map((e) => {
                const client = personById(e.client)
                const filled = e.roles.filter((r) => r.state === 'confirmed').length
                const committed = e.spent
                const d = daysUntil(e.date)
                return (
                  <motion.div key={e.id} variants={listItem}>
                    <Pressable onClick={() => open(e)} className="px-5 py-4">
                      <div className="flex gap-3.5">
                        <span className="relative block h-[84px] w-[112px] shrink-0 overflow-hidden rounded-[var(--r-control)] bg-[var(--surface-high)]">
                          <img src={img(e.photo, 400)} alt="" className="h-full w-full object-cover" loading="lazy" style={e.status === 'done' ? { filter: 'grayscale(0.7)' } : undefined} />
                          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5" style={{ background: e.colour }} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                            <span className="meta truncate text-text-2">{e.status === 'done' ? `${-d} days ago` : d === 0 ? 'today' : relDay(e.date)}</span>
                          </span>
                          <span className="grot mt-1.5 block text-[20px] leading-[1.05]">{e.name}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] font-semibold text-text-2">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={12} aria-hidden />
                              {fmtDay(e.date)} · {e.time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} aria-hidden />
                              {e.city}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users size={12} aria-hidden />
                              {e.guests}
                            </span>
                          </span>
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar who={client.photo} size={24} alt={client.name} />
                        <span className="truncate text-[12px] font-semibold text-text-2">{client.first}</span>
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <Bar value={pct(filled, e.roles.length)} height={4} tone={filled === e.roles.length ? 'accent' : 'brass'} />
                          <span className="meta shrink-0 text-text-2">
                            {filled}/{e.roles.length} roles
                          </span>
                        </span>
                        <span className="num shrink-0 text-[12px] font-bold">
                          {moneyShort(committed, e.currency)} <span className="font-semibold text-text-2">/ {moneyShort(e.budget, e.currency)}</span>
                        </span>
                      </div>
                    </Pressable>
                    {e.status === 'live' && (
                      <div className="px-5 pb-3">
                        <motion.button
                          type="button"
                          whileTap={tap}
                          transition={spring.ui}
                          onClick={() => { track('open_door', e.id); navigate('pro.checkin') }}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent pl-3 pr-4 text-[13px] font-bold text-on-accent shadow-[var(--glow-accent)]"
                        >
                          <QrCode size={16} aria-hidden />
                          On the door tonight · open scanner
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </section>
          )
        })}
      </motion.div>

      <p className="mt-6 px-5 text-center text-[12px] font-semibold text-text-2">
        Quotes shown are demo values · bookings end at Confirmed, settled outside Edera
      </p>
    </MobileScreen>
  )
}
