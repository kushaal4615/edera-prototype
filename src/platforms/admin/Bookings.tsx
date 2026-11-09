import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Download, Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Avatar, AvatarStack } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar, Figure } from '../../components/Brand'
import { Button } from '../../components/Button'
import { CHART, Sparkline } from '../../components/Charts'
import { HeroImage } from '../../components/Media'
import { Drawer } from '../../components/Sheet'
import { KPI } from '../../data/admin'
import { addDays, CLOCK, daysUntil, dayNum, dowLabel, fmtDay, fmtShort, money, moneyShort, pct, relDay } from '../../data/clock'
import { EVENTS, REQUESTS, RUBY_TOTALS, RUN_OF_SHOW, TONIGHT_TOTALS, type Event, type RequestState } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, useSession } from '../../lib/store'
import { tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { ConsoleShell, Panel } from '../console/shell'

/* admin.bookings: Events & bookings.
   A 14-day timeline band, the events table with an inspector drawer, the
   requests picture by state, and the quiet reminder that money is not
   collected in this phase. */

/** Platform-wide events per day for the next 14 days (demo values; the named EVENTS sit inside these counts). */
const PLATFORM_EVENTS_PER_DAY = [9, 3, 2, 4, 3, 6, 11, 8, 2, 3, 5, 6, 12, 7]
const FIG_TREND = {
  events: [8, 9, 11, 12, 12, 14, 15, 17, 18, 19, 21, 22],
  requests: [140, 162, 171, 190, 204, 221, 236, 250, 262, 281, 290, 304],
  checkins: [900, 1040, 1180, 1250, 1390, 1420, 1510, 1600, 1680, 1790, 1880, 1990],
}

type StateFilter = 'all' | RequestState
const FILTERS: { id: StateFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'requested', label: 'Requested' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'proposed', label: 'New date' },
  { id: 'declined', label: 'Declined' },
  { id: 'completed', label: 'Completed' },
]

/** Group accepted with confirmed and cancelled with declined: five states the owner cares about. */
const bucket = (s: RequestState): Exclude<StateFilter, 'all'> => (s === 'accepted' ? 'confirmed' : s === 'cancelled' ? 'declined' : s)

const STATE_TONE: Record<string, { tone: 'neutral' | 'accent' | 'warn' | 'danger' | 'info' | 'ink' | 'solid'; label: string; colour: string }> = {
  requested: { tone: 'warn', label: 'Requested', colour: CHART.series.held },
  confirmed: { tone: 'accent', label: 'Confirmed', colour: CHART.series.primary },
  accepted: { tone: 'accent', label: 'Confirmed', colour: CHART.series.primary },
  proposed: { tone: 'info', label: 'New date', colour: '#5B2A86' },
  declined: { tone: 'danger', label: 'Declined', colour: CHART.series.danger },
  completed: { tone: 'ink', label: 'Completed', colour: CHART.series.booked },
  cancelled: { tone: 'danger', label: 'Cancelled', colour: CHART.series.danger },
  shortlist: { tone: 'neutral', label: 'Shortlisted', colour: CHART.series.muted },
  open: { tone: 'neutral', label: 'Open', colour: CHART.series.muted },
}

const EVENT_TONE: Record<Event['status'], { tone: 'neutral' | 'accent' | 'solid' | 'ink'; label: string }> = {
  planning: { tone: 'neutral', label: 'Planning' },
  confirmed: { tone: 'accent', label: 'Confirmed' },
  live: { tone: 'solid', label: 'Live' },
  done: { tone: 'ink', label: 'Done' },
}

const rolesFilled = (ev: Event) => ev.roles.filter((r) => r.state === 'confirmed').length

/** Effective state of a role after this session's vendor decisions. */
const roleState = (ev: Event, vendorId: string | undefined, fallback: string): string => {
  if (!vendorId) return fallback
  const rq = REQUESTS.find((r) => r.eventId === ev.id && r.vendorId === vendorId)
  return rq ? requestState(rq.id) : fallback
}

export default function AdminBookings() {
  const { toast, navigate } = useNav()
  const decisions = useSession((s) => s.requestDecisions)
  const checkedIn = useSession((s) => s.checkedIn.length + s.walkIns.length)
  const [open, setOpen] = useState<Event | null>(null)
  const [filter, setFilter] = useState<StateFilter>('all')
  const [page, setPage] = useState(0)
  const PER = 8

  const requests = useMemo(
    () =>
      REQUESTS.map((r) => ({ ...r, live: requestState(r.id) }))
        .sort((a, b) => a.sentMinutesAgo - b.sentMinutesAgo)
        .filter((r) => filter === 'all' || bucket(r.live) === filter),
    // decisions is read so the list re-sorts when a vendor decides in another platform
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, decisions],
  )
  const pages = Math.max(1, Math.ceil(requests.length / PER))
  const pageRows = requests.slice(page * PER, page * PER + PER)

  const byState = useMemo(() => {
    const counts: Record<string, number> = { requested: 0, confirmed: 0, proposed: 0, declined: 0, completed: 0 }
    REQUESTS.forEach((r) => {
      counts[bucket(requestState(r.id))] += 1
    })
    return (Object.keys(counts) as Exclude<StateFilter, 'all'>[]).map((k) => ({ id: k, name: STATE_TONE[k].label, value: counts[k], colour: STATE_TONE[k].colour }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions])

  const days = Array.from({ length: 14 }, (_, i) => {
    const iso = addDays(CLOCK.todayIso, i)
    const named = EVENTS.filter((e) => e.date === iso)
    return { iso, n: PLATFORM_EVENTS_PER_DAY[i], named }
  })
  const maxDay = Math.max(...PLATFORM_EVENTS_PER_DAY)

  const setFilterAndReset = (f: StateFilter) => {
    setFilter(f)
    setPage(0)
  }

  return (
    <ConsoleShell
      active="admin.bookings"
      title="Events & bookings"
      sub={`${EVENTS.length} events on the books · ${REQUESTS.length} booking requests · bookings end at Confirmed in this phase`}
      actions={
        <>
          <Button size="sm" variant="outline" icon={Download} onClick={() => toast('Exporting events and requests as CSV · 2 files', 'accent')}>
            Export CSV
          </Button>
          <Button size="sm" variant="ink" icon={Settings2} onClick={() => navigate('admin.settings')}>
            Commission switch
          </Button>
        </>
      }
    >
      {/* ── Timeline band ── */}
      <section className="relative mx-8 overflow-hidden rounded-[var(--r-container)] bg-ink text-on-ink max-md:mx-4">
        <span aria-hidden className="arc" style={{ right: '-9%', bottom: '-150%', width: '30%' }} />
        <span aria-hidden className="dots-light" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-8 p-6 max-md:grid-cols-1 max-md:p-4">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="label text-on-ink-2">Next 14 days · events across the platform</p>
              <span className="meta text-on-ink-2">{fmtShort(CLOCK.todayIso)} – {fmtShort(addDays(CLOCK.todayIso, 13))}</span>
            </div>
            <div className="scroll-x -mx-1 flex gap-1 px-1">
              {days.map((d, i) => {
                const live = i === 0
                return (
                  <motion.button
                    key={d.iso}
                    type="button"
                    whileTap={tap}
                    onClick={() =>
                      toast(
                        d.named.length ? `${d.n} events on ${fmtDay(d.iso)} · includes ${d.named.map((e) => e.name).join(', ')}` : `${d.n} events on ${fmtDay(d.iso)}`,
                        'neutral',
                      )
                    }
                    className={`flex min-w-0 flex-1 flex-col items-center rounded-[var(--r-control)] px-0.5 pb-2 pt-2 ${live ? 'bg-[rgb(255_255_255/0.1)]' : 'hover:bg-[rgb(255_255_255/0.06)]'}`}
                    aria-label={`${fmtDay(d.iso)}: ${d.n} events`}
                  >
                    <span className="meta text-on-ink-2">{dowLabel(d.iso)[0]}</span>
                    <span className={`num mt-0.5 text-[15px] font-extrabold ${live ? 'text-brass-light' : 'text-on-ink'}`}>{dayNum(d.iso)}</span>
                    <span className="mt-2 flex h-[44px] w-full items-end justify-center">
                      <span className="w-[14px] rounded-t-[4px]" style={{ height: `${Math.max(10, (d.n / maxDay) * 100)}%`, background: d.named.length ? 'var(--brass)' : 'rgb(255 255 255 / 0.45)' }} />
                    </span>
                    <span className="num mt-1.5 text-[12px] font-bold text-on-ink">{d.n}</span>
                    {live ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brass px-1 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-on-brass">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-brass opacity-60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-on-brass" />
                        </span>
                        Live
                      </span>
                    ) : (
                      <span className="mt-1 h-[18px]" style={{ fontSize: 10 }}>
                        {d.named.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-brass" style={{ display: 'inline-block' }} />}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
            <p className="meta mt-2 text-on-ink-2">Brass bar = a day with one of the events named below · tonight: {EVENTS[1].name} at {EVENTS[1].venue.split(',')[0]}</p>
          </div>
          <div className="grid grid-cols-3 gap-5 border-l border-[rgb(255_255_255/0.14)] pl-6 max-md:grid-cols-3 max-md:gap-3 max-md:border-l-0 max-md:border-t max-md:pl-0 max-md:pt-4">
            {[
              { label: 'Events this month', value: KPI.eventsThisMonth.toLocaleString('en-GB'), sub: '+14% vs Oct', trend: FIG_TREND.events },
              { label: 'Requests · 30d', value: KPI.requests30d.toLocaleString('en-GB'), sub: `${KPI.acceptRate}% accepted`, trend: FIG_TREND.requests },
              { label: 'Check-ins · 30d', value: KPI.checkins30d.toLocaleString('en-GB'), sub: 'QR at the door', trend: FIG_TREND.checkins },
            ].map((f) => (
              <div key={f.label} className="flex min-w-0 flex-col justify-between gap-3">
                <p className="label text-on-ink-2">{f.label}</p>
                <Figure value={f.value} size={34} tone="var(--on-ink)" />
                <div className="flex items-center gap-2">
                  <Sparkline data={f.trend} width={52} height={20} color="var(--brass)" />
                  <span className="text-[12px] font-semibold text-on-ink-2">{f.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Split: events (left) · requests (right) ── */}
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6 px-8 pb-10 pt-6 max-md:grid-cols-1 max-md:px-4">
        <Panel title="Events" action={<span className="meta text-text-2">{EVENTS.length} events · tap a row to inspect</span>} pad={false} className="min-w-0 overflow-hidden">
          <table className="w-full table-fixed border-collapse text-[13px] max-md:hidden">
            <colgroup>
              <col style={{ width: '34%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr className="label whitespace-nowrap text-text-2">
                <th className="px-5 pb-2 text-left font-extrabold">Event</th>
                <th className="pb-2 pr-3 text-left font-extrabold">Date</th>
                <th className="pb-2 pr-3 text-right font-extrabold">Guests</th>
                <th className="pb-2 pr-3 text-left font-extrabold">People</th>
                <th className="pb-2 pr-3 text-left font-extrabold">Roles</th>
                <th className="pb-2 pr-3 text-right font-extrabold">Committed</th>
                <th className="pb-2 pr-4 text-right font-extrabold">Status</th>
              </tr>
            </thead>
            <motion.tbody variants={listParent} initial="hidden" animate="show">
              {EVENTS.map((ev) => {
                const filled = rolesFilled(ev)
                const st = EVENT_TONE[ev.status]
                return (
                  <motion.tr key={ev.id} variants={listItem} onClick={() => setOpen(ev)} className="cursor-pointer border-t border-[var(--rule)] hover:bg-[var(--surface-raised)]">
                    <td className="px-5 py-2.5">
                      <button type="button" onClick={() => setOpen(ev)} className="flex w-full min-w-0 items-center gap-3 text-left">
                        <img src={img(ev.photo, 120)} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover" loading="lazy" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{ev.name}</span>
                          <span className="block truncate text-[12px] font-semibold text-text-2">
                            {ev.type} · {ev.city}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3">
                      <span className="num block font-semibold">{fmtShort(ev.date)}</span>
                      <span className="meta text-text-2">{relDay(ev.date)}</span>
                    </td>
                    <td className="num py-2.5 pr-3 text-right font-semibold">{ev.guests}</td>
                    <td className="py-2.5 pr-3">
                      <AvatarStack people={[personById(ev.planner).photo, personById(ev.client).photo]} size={24} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="num mb-1 block text-[12px] font-bold">
                        {filled}/{ev.roles.length}
                      </span>
                      <Bar value={pct(filled, ev.roles.length)} height={5} tone={filled === ev.roles.length ? 'accent' : 'brass'} />
                    </td>
                    <td className="num whitespace-nowrap py-2.5 pr-3 text-right font-semibold">
                      {moneyShort(ev.spent, ev.currency)}
                      <span className="block text-[11px] font-semibold text-text-2">of {moneyShort(ev.budget, ev.currency)}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <Badge tone={st.tone} icon={ev.status === 'live' ? <span className="relative mr-0.5 flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" /></span> : undefined}>
                        {st.label}
                      </Badge>
                    </td>
                  </motion.tr>
                )
              })}
            </motion.tbody>
          </table>
          {/* phone: stacked cards */}
          <ul className="md:hidden">
            {EVENTS.map((ev) => {
              const filled = rolesFilled(ev)
              const st = EVENT_TONE[ev.status]
              return (
                <li key={ev.id} className="border-t border-[var(--rule)]">
                  <button type="button" onClick={() => setOpen(ev)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <img src={img(ev.photo, 120)} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{ev.name}</span>
                      <span className="block text-[12px] font-semibold text-text-2">
                        {fmtShort(ev.date)} · {ev.guests} guests · {moneyShort(ev.spent, ev.currency)} committed
                      </span>
                      <span className="mt-1.5 block w-[120px]">
                        <Bar value={pct(filled, ev.roles.length)} height={4} tone="brass" />
                      </span>
                    </span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Requests by state" action={<span className="meta text-text-2">{REQUESTS.length} total</span>}>
            <div className="flex items-center gap-4">
              <div className="relative h-[150px] w-[150px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byState} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="var(--surface)" strokeWidth={2} isAnimationActive={false}>
                      {byState.map((s) => (
                        <Cell key={s.id} fill={s.colour} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART.tooltip} cursor={false} formatter={(v: number, n: string) => [`${v} requests`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="text-center">
                    <span className="figure num block text-[30px]">{REQUESTS.length}</span>
                    <span className="label text-text-2">requests</span>
                  </span>
                </span>
              </div>
              <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
                {byState.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setFilterAndReset(filter === s.id ? 'all' : s.id)} className={`flex w-full items-center gap-2 rounded-[8px] px-2 py-1 text-[13px] font-semibold ${filter === s.id ? 'bg-[var(--surface-high)]' : 'hover:bg-[var(--surface-raised)]'}`}>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.colour }} />
                      <span className="flex-1 text-left">{s.name}</span>
                      <span className="num text-text-2">{s.value}</span>
                      <span className="num w-9 text-right text-text-2">{pct(s.value, REQUESTS.length)}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel title="Requests" pad={false} className="min-w-0 overflow-hidden">
            <div className="flex flex-wrap gap-1.5 px-5 pb-3 pt-3">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" onClick={() => setFilterAndReset(f.id)} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-bold ${filter === f.id ? 'bg-ink text-on-ink' : 'text-text ring-1 ring-inset ring-[var(--rule-strong)]'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <ul>
              {pageRows.map((r) => {
                const v = vendorById(r.vendorId)
                const ev = EVENTS.find((e) => e.id === r.eventId)
                const st = STATE_TONE[r.live]
                return (
                  <li key={r.id} className="border-t border-[var(--rule)]">
                    <button type="button" onClick={() => ev && setOpen(ev)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-[var(--surface-raised)]">
                      <Avatar who={personById(r.by).photo} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold">{v.name}</span>
                        <span className="block truncate text-[12px] font-semibold text-text-2">
                          {ev?.name ?? r.eventId} · {personById(r.by).first} · {fmtShort(r.date)}
                        </span>
                      </span>
                      <span className="num shrink-0 text-right text-[13px] font-bold">{money(r.amount, v.currency)}</span>
                      <Badge tone={st.tone} className="shrink-0">
                        {st.label}
                      </Badge>
                    </button>
                  </li>
                )
              })}
              {pageRows.length === 0 && <li className="px-5 py-6 text-center text-[13px] font-semibold text-text-2">No requests in this state.</li>}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--rule)] px-5 py-2.5">
              <span className="meta text-text-2">
                {requests.length === 0 ? '0' : `${page * PER + 1}–${Math.min(requests.length, (page + 1) * PER)}`} of {requests.length}
              </span>
              <span className="flex items-center gap-1">
                <button type="button" aria-label="Previous page" onClick={() => (page === 0 ? toast('Already on the first page', 'neutral') : setPage((p) => p - 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--surface-high)]">
                  <ChevronLeft size={16} />
                </button>
                <span className="num text-[12px] font-bold">
                  {page + 1} / {pages}
                </span>
                <button type="button" aria-label="Next page" onClick={() => (page >= pages - 1 ? toast('That is the last page', 'neutral') : setPage((p) => p + 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--surface-high)]">
                  <ChevronRight size={16} />
                </button>
              </span>
            </div>
          </Panel>

          <section className="rounded-[var(--r-card)] bg-[var(--surface-tint)] p-5">
            <p className="label text-text-2">Gross booking value · confirmed in-app · 30d</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <Figure value={money(KPI.gbv30d)} size={36} />
              <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[12px] font-bold text-text-2">No commission in this phase</span>
            </div>
            <p className="mt-3 text-[13px] leading-snug text-text-2">Vendors are paid outside Edera for now. Commission is a switch in settings, turned off until payments ship.</p>
            <button type="button" onClick={() => navigate('admin.settings')} className="mt-3 inline-flex h-9 items-center gap-1.5 text-[13px] font-bold text-accent-ink">
              Open the commission switch <ArrowRight size={15} />
            </button>
          </section>
        </div>
      </div>

      <EventDrawer ev={open} onClose={() => setOpen(null)} checkedIn={checkedIn} />
    </ConsoleShell>
  )
}

function EventDrawer({ ev, onClose, checkedIn }: { ev: Event | null; onClose: () => void; checkedIn: number }) {
  const { toast } = useNav()
  const e = ev
  return (
    <Drawer open={!!e} onClose={onClose} title="Event" width={480}>
      {e && (
        <div className="-mx-6 -mt-6">
          <HeroImage src={e.photo} alt={e.name} className="h-[200px]" scrim="b">
            <div className="flex h-full flex-col justify-end p-6">
              <Badge tone={EVENT_TONE[e.status].tone} className="mb-2 w-max">
                {EVENT_TONE[e.status].label}
              </Badge>
              <h3 className="grot text-[28px] text-white">{e.name}</h3>
              <p className="mt-1 text-[13px] font-semibold text-white/90">
                {fmtDay(e.date, true)} · {e.time} · {e.venue}
              </p>
            </div>
          </HeroImage>
          <div className="px-6 pb-6">
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="label text-text-2">Guests</p>
                <Figure value={e.guests} size={28} />
              </div>
              <div>
                <p className="label text-text-2">Committed</p>
                <Figure value={moneyShort(e.spent, e.currency)} size={28} />
              </div>
              <div>
                <p className="label text-text-2">Budget</p>
                <Figure value={moneyShort(e.budget, e.currency)} size={28} />
              </div>
            </div>
            <Bar value={pct(e.spent, e.budget)} height={6} className="mt-3" />
            <p className="mt-1.5 text-[12px] font-semibold text-text-2">{pct(e.spent, e.budget)}% of budget committed · settled outside Edera · payments in a later phase</p>

            <div className="mt-5 flex items-center gap-3">
              <Avatar who={personById(e.planner).photo} size={36} verified />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold">{personById(e.planner).name}</span>
                <span className="block text-[12px] font-semibold text-text-2">Planner · runs the event</span>
              </span>
              <Avatar who={personById(e.client).photo} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold">{personById(e.client).name}</span>
                <span className="block text-[12px] font-semibold text-text-2">Client · sees the summary</span>
              </span>
            </div>

            <h4 className="label mt-6 text-text-2">Roles · {rolesFilled(e)} of {e.roles.length} confirmed</h4>
            <ul className="mt-2 divide-y divide-[var(--rule)]">
              {e.roles.map((r) => {
                const st = roleState(e, r.vendorId, r.state)
                const t = STATE_TONE[st] ?? STATE_TONE.open
                return (
                  <li key={r.category + r.label} className="flex items-center gap-3 py-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.colour }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold">{r.label}</span>
                      <span className="block truncate text-[12px] font-semibold text-text-2">{r.vendorId ? vendorById(r.vendorId).name : 'No vendor yet'}</span>
                    </span>
                    <span className="num text-[12px] font-bold text-text-2">{money(r.budget, e.currency)}</span>
                    <Badge tone={t.tone}>{t.label}</Badge>
                  </li>
                )
              })}
            </ul>

            <h4 className="label mt-6 text-text-2">Guests</h4>
            {e.id === 'ev-ruby' && (
              <GuestTotals rows={[
                { label: 'Yes', n: RUBY_TOTALS.yes, tone: 'var(--free)' },
                { label: 'No', n: RUBY_TOTALS.no, tone: 'var(--danger)' },
                { label: 'Pending', n: RUBY_TOTALS.pending, tone: 'var(--held)' },
              ]} total={RUBY_TOTALS.invited} foot={`${RUBY_TOTALS.invitesSent} QR invites sent · ${RUBY_TOTALS.tables} tables · ${daysUntil(e.date)} days to go`} />
            )}
            {e.id === 'ev-engage' && (
              <GuestTotals rows={[
                { label: 'Checked in', n: checkedIn, tone: 'var(--free)' },
                { label: 'Walk-ins', n: TONIGHT_TOTALS.walkIns, tone: 'var(--held)' },
                { label: 'Flagged scans', n: TONIGHT_TOTALS.flagged, tone: 'var(--danger)' },
              ]} total={TONIGHT_TOTALS.expected} foot={`Doors ${TONIGHT_TOTALS.doors} · live from the Planner App's door scanner`} live />
            )}
            {e.id !== 'ev-ruby' && e.id !== 'ev-engage' && (
              <GuestTotals rows={[
                { label: 'Yes', n: Math.round(e.guests * (e.status === 'done' ? 0.93 : 0.58)), tone: 'var(--free)' },
                { label: 'No', n: Math.round(e.guests * 0.07), tone: 'var(--danger)' },
                { label: 'Pending', n: e.status === 'done' ? 0 : Math.round(e.guests * 0.35), tone: 'var(--held)' },
              ]} total={e.guests} foot={e.status === 'done' ? 'Event completed · check-ins closed' : `${e.checklistDone} of ${e.checklistTotal} checklist items done`} />
            )}

            {e.id === 'ev-ruby' && (
              <>
                <h4 className="label mt-6 text-text-2">Run of show</h4>
                <ol className="relative mt-3 ml-[7px] border-l-2 border-[var(--rule-strong)] pl-5">
                  {RUN_OF_SHOW.map((s) => (
                    <li key={s.time} className="relative pb-3 last:pb-0">
                      <span aria-hidden className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-brass ring-2 ring-[var(--surface)]" />
                      <span className="meta text-text-2">{s.time}</span>
                      <span className="block text-[13px] font-bold">{s.item}</span>
                      <span className="block text-[12px] font-semibold text-text-2">{s.who}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            <div className="mt-6 flex gap-2">
              <Button block variant="ink" onClick={() => toast(`Message sent to ${personById(e.planner).first} about ${e.name}`, 'accent')}>
                Message planner
              </Button>
              <Button block variant="outline" onClick={() => toast(`Audit log for ${e.name} · ${e.roles.length} roles, ${REQUESTS.filter((r) => r.eventId === e.id).length} requests`, 'neutral')}>
                Audit log
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}

function GuestTotals({ rows, total, foot, live = false }: { rows: { label: string; n: number; tone: string }[]; total: number; foot: string; live?: boolean }) {
  return (
    <div className="mt-2 rounded-[var(--r-card)] bg-[var(--surface-raised)] p-4">
      <div className="flex items-end justify-between">
        <span className="figure num text-[34px]">
          {rows[0].n}
          <span className="unit">of {total}</span>
        </span>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-free-soft px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-on-free-soft">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-free opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-free" />
            </span>
            Live
          </span>
        )}
      </div>
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-[var(--surface-high)]" style={{ gap: 2 }}>
        {rows.map((r) => (
          <span key={r.label} style={{ width: `${pct(r.n, total)}%`, background: r.tone }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {rows.map((r) => (
          <span key={r.label} className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <span className="h-2 w-2 rounded-full" style={{ background: r.tone }} />
            {r.label} <span className="num text-text-2">{r.n}</span>
          </span>
        ))}
      </div>
      <p className="meta mt-2 text-text-2">{foot}</p>
    </div>
  )
}
