import { motion } from 'framer-motion'
import { ChevronRight, Inbox, MapPin, Pin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { AVAIL, Figure, StateDot } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { BottomSheet } from '../../components/Sheet'
import { Segmented } from '../../components/Tabs'
import { addDays, CLOCK, daysUntil, dayNum, dowLabel, fmtDay, MONTH_LONG, parseIso, plural, relDay, toIso } from '../../data/clock'
import { EVENTS, REQUESTS, type Event } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { MobileScreen, SectionHead, TopBar } from '../mobileShell'
import type { Availability } from '../../data/vendors'

/* pro.calendar: Tunde's own diary. A 14-day availability band for the
   planner himself (built from his events, not from a vendor listing), then
   month grids (Mon first) with event dots in each event's colour and a
   brass ring on today, or an agenda. Tap a day for its events. */

/** Pencilled holds in Tunde's own diary (demo values: site visit, travel). */
const PENCILS: { iso: string; title: string; where: string }[] = [
  { iso: addDays(CLOCK.todayIso, 3), title: 'Orangery site visit with Adaeze', where: 'Royal Docks' },
  { iso: addDays(CLOCK.todayIso, 10), title: 'Travel day · London → Lagos', where: 'LHR → LOS' },
  { iso: '2026-12-05', title: 'Sugarcraft tasting box · decide DJ', where: 'Greenwich' },
  { iso: '2027-01-09', title: 'MC auditions', where: 'Peckham' },
]

const eventsOn = (iso: string) => EVENTS.filter((e) => e.date === iso)
const pencilsOn = (iso: string) => PENCILS.filter((p) => p.iso === iso)
const stateOn = (iso: string): Availability => {
  const evs = eventsOn(iso)
  if (evs.some((e) => e.status !== 'planning')) return 'booked'
  if (evs.length || pencilsOn(iso).length) return 'held'
  return 'free'
}

type Cell = { iso: string | null; n: number }
function monthCells(year: number, month: number): Cell[] {
  const first = new Date(Date.UTC(year, month, 1))
  const offset = (first.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: Cell[] = Array.from({ length: offset }, () => ({ iso: null, n: 0 }))
  for (let d = 1; d <= days; d++) cells.push({ iso: toIso(new Date(Date.UTC(year, month, d))), n: d })
  while (cells.length % 7) cells.push({ iso: null, n: 0 })
  return cells
}

const MONTHS: [number, number][] = [
  [2026, 10],
  [2026, 11],
  [2027, 0],
  [2027, 1],
  [2027, 2],
]

export default function ProCalendar() {
  const { navigate } = useNav()
  const decisions = useSession((s) => s.requestDecisions)
  const [view, setView] = useState<'month' | 'agenda'>('month')
  const [day, setDay] = useState<string | null>(null)

  const waiting = REQUESTS.filter((r) => r.by === 'tunde' && (decisions[r.id] ?? r.state) === 'requested').length
  const upcoming = useMemo(() => [...EVENTS].filter((e) => daysUntil(e.date) >= 0 && e.status !== 'done').sort((a, b) => a.date.localeCompare(b.date)), [])
  const band = Array.from({ length: 14 }, (_, i) => addDays(CLOCK.todayIso, i))

  const openEvent = (e: Event) => {
    track('open_event', e.id)
    session.viewEvent(e.id)
    setDay(null)
    navigate('pro.event')
  }

  const dayEvents = day ? eventsOn(day) : []
  const dayPencils = day ? pencilsOn(day) : []

  return (
    <MobileScreen
      tab="calendar"
      header={
        <TopBar
          back={false}
          large
          title={<>Calendar</>}
          sub={`${CLOCK.date} · ${CLOCK.time} London · ${CLOCK.lagosTime} Lagos`}
          right={<Segmented<'month' | 'agenda'> size="sm" items={[{ id: 'month', label: 'Month' }, { id: 'agenda', label: 'Agenda' }]} value={view} onChange={(v) => { setView(v); track('calendar_view', v) }} />}
        />
      }
      overlay={
        <BottomSheet open={day !== null} onClose={() => setDay(null)} title={day ? fmtDay(day, true) : undefined}>
          {day && (
            <div className="flex flex-col gap-3 pt-1 pb-2">
              <div className="flex items-center gap-2">
                <StateDot state={stateOn(day)} label={stateOn(day) === 'booked' ? 'Event day' : stateOn(day) === 'held' ? 'Pencilled' : 'Free'} size="md" />
                <span className="text-[13px] font-semibold text-text-2">· {day === CLOCK.todayIso ? 'today' : relDay(day)}</span>
              </div>
              {dayEvents.map((e) => {
                const client = personById(e.client)
                return (
                  <Pressable key={e.id} onClick={() => openEvent(e)} className="flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface-raised)] p-3">
                    <span className="relative block h-[56px] w-[72px] shrink-0 overflow-hidden rounded-[var(--r-control)]">
                      <img src={img(e.photo, 300)} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1" style={{ background: e.colour }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{e.name}</span>
                      <span className="block truncate text-[12px] font-semibold text-text-2">
                        {e.time} · {e.venue} · {plural(e.guests, 'guest')}
                      </span>
                    </span>
                    <Avatar who={client.photo} size={28} alt={client.name} />
                    <ChevronRight size={18} className="text-text-2" aria-hidden />
                  </Pressable>
                )
              })}
              {dayPencils.map((p) => (
                <div key={p.title} className="flex items-center gap-3 rounded-[var(--r-card)] bg-held-soft p-3">
                  <Pin size={18} className="shrink-0 text-on-held-soft" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-on-held-soft">{p.title}</span>
                    <span className="block text-[12px] font-semibold text-on-held-soft">{p.where} · pencilled</span>
                  </span>
                </div>
              ))}
              {dayEvents.length === 0 && dayPencils.length === 0 && (
                <div className="rounded-[var(--r-card)] bg-free-soft p-4 text-on-free-soft">
                  <p className="grot text-[20px]">Nothing booked</p>
                  <p className="mt-1 text-[13px] font-semibold">Clients browsing planners will see you free on this day.</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" block onClick={() => { setDay(null); navigate('pro.events') }}>
                  All events
                </Button>
                {dayEvents.length > 0 ? (
                  <Button block onClick={() => openEvent(dayEvents[0])}>
                    Open board
                  </Button>
                ) : (
                  <Button block onClick={() => { setDay(null); navigate('pro.requests') }}>
                    Requests waiting
                  </Button>
                )}
              </div>
            </div>
          )}
        </BottomSheet>
      }
    >
      {/* ── Tunde's own 14-day band ── */}
      <section className="relative mx-5 mt-1 overflow-hidden rounded-[var(--r-container)] bg-ink p-4 text-on-ink">
        <span aria-hidden className="dots-light" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="label text-brass-light">Your next 14 days</p>
            <p className="mt-0.5 text-[13px] font-semibold text-on-ink-2">
              {band.filter((d) => stateOn(d) === 'free').length} free · {band.filter((d) => stateOn(d) === 'held').length} pencilled · {band.filter((d) => stateOn(d) === 'booked').length} event days
            </p>
          </div>
          <Figure value={band.filter((d) => stateOn(d) === 'free').length} unit="free" size={34} tone="var(--on-ink)" />
        </div>
        <div className="relative mt-3 flex gap-[3px]">
          {band.map((iso) => {
            const st = stateOn(iso)
            const today = iso === CLOCK.todayIso
            return (
              <motion.button
                key={iso}
                type="button"
                whileTap={{ scale: 0.92 }}
                transition={spring.ui}
                onClick={() => setDay(iso)}
                aria-label={`${fmtDay(iso)}: ${st === 'booked' ? 'event day' : st === 'held' ? 'pencilled' : 'free'}`}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <span className="grid h-[34px] w-full place-items-center rounded-[6px] text-[11px] font-extrabold" style={{ background: AVAIL[st].fill, color: st === 'held' ? 'var(--on-brass)' : '#fff', boxShadow: today ? '0 0 0 2px var(--ink), 0 0 0 4px var(--brass)' : st === 'booked' ? 'inset 0 0 0 1px rgb(255 255 255 / 0.25)' : undefined }}>
                  {dayNum(iso)}
                </span>
                <span className="meta text-on-ink-2" style={{ fontSize: 9.5 }}>
                  {dowLabel(iso)[0]}
                </span>
              </motion.button>
            )
          })}
        </div>
        <div className="relative mt-2.5 flex items-center gap-3 text-on-ink-2">
          <StateDot state="free" />
          <StateDot state="held" label="Pencilled" />
          <StateDot state="booked" label="Event day" />
        </div>
      </section>

      {/* ── Requests waiting ── */}
      <Pressable onClick={() => navigate('pro.requests')} className="mx-5 mt-3 flex items-center gap-3 rounded-[var(--r-card)] bg-brass-soft px-4 py-3 text-on-brass-soft">
        <Inbox size={18} aria-hidden />
        <span className="flex-1 text-[14px] font-bold">
          {plural(waiting, 'request')} waiting on vendors
        </span>
        <span className="text-[12px] font-semibold">dates held</span>
        <ChevronRight size={16} aria-hidden />
      </Pressable>

      {view === 'month' ? (
        <>
          {MONTHS.map(([y, m]) => {
            const cells = monthCells(y, m)
            const count = EVENTS.filter((e) => e.date.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).length
            return (
              <section key={`${y}-${m}`} className="mt-7 px-5">
                <div className="flex items-end justify-between">
                  <h2 className="grot text-[22px]">
                    {MONTH_LONG[m]} <em>{y}</em>
                  </h2>
                  <span className="meta text-text-2">{count ? plural(count, 'event') : 'no events'}</span>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-y-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={d + i} className="meta pb-1 text-center text-text-2">
                      {d}
                    </span>
                  ))}
                  {cells.map((c, i) => {
                    if (!c.iso) return <span key={`b${i}`} aria-hidden />
                    const evs = eventsOn(c.iso)
                    const pens = pencilsOn(c.iso)
                    const today = c.iso === CLOCK.todayIso
                    const past = c.iso < CLOCK.todayIso
                    const weekend = i % 7 >= 5
                    return (
                      <motion.button
                        key={c.iso}
                        type="button"
                        whileTap={tap}
                        transition={spring.ui}
                        onClick={() => { track('calendar_day', c.iso); setDay(c.iso!) }}
                        aria-label={`${fmtDay(c.iso)}${evs.length ? `, ${plural(evs.length, 'event')}` : ''}`}
                        className={`relative flex h-[46px] flex-col items-center justify-start rounded-[10px] pt-1 ${weekend && !past ? 'bg-[var(--surface-raised)]' : ''}`}
                      >
                        <span className={`num grid h-[24px] w-[24px] place-items-center rounded-full text-[13px] ${today ? 'bg-brass font-extrabold text-on-brass' : past ? 'font-semibold text-text-2' : 'font-bold'}`} style={today ? { boxShadow: '0 0 0 2px var(--bg), 0 0 0 3.5px var(--brass)' } : undefined}>
                          {c.n}
                        </span>
                        <span className="mt-1 flex h-[10px] items-center gap-[3px]">
                          {evs.slice(0, 3).map((e) => (
                            <span key={e.id} className="block h-[7px] w-[7px] rounded-full" style={{ background: e.colour, opacity: e.status === 'planning' ? 0.6 : 1, outline: e.status === 'planning' ? `1.5px solid ${e.colour}` : undefined, outlineOffset: -1 }} />
                          ))}
                          {pens.length > 0 && evs.length === 0 && <span className="block h-[5px] w-[5px] rounded-full bg-brass" />}
                          {evs.length > 1 && <span className="num ml-0.5 text-[10px] font-extrabold text-text-2">{evs.length}</span>}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {/* ── Next up ── */}
          <SectionHead className="mt-8" eyebrow={`${upcoming.length} ahead`} title={<>Next <em>up</em></>} action="All events" onAction={() => navigate('pro.events')} />
          <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-2">
            {upcoming.map((e) => {
              const d = daysUntil(e.date)
              return (
                <motion.li key={e.id} variants={listItem}>
                  <Pressable onClick={() => openEvent(e)} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-[64px] shrink-0 text-left">
                      <Figure value={d === 0 ? 'now' : d} unit={d === 0 ? undefined : d === 1 ? 'day' : 'days'} size={d === 0 ? 24 : 30} tone={d === 0 ? 'var(--danger)' : undefined} />
                    </span>
                    <span className="block h-[40px] w-[4px] shrink-0 rounded-full" style={{ background: e.colour }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{e.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[12px] font-semibold text-text-2">
                        {fmtDay(e.date)} · {e.time} <MapPin size={11} aria-hidden /> {e.city}
                      </span>
                    </span>
                    <Badge tone={e.status === 'live' ? 'danger' : e.status === 'confirmed' ? 'success' : 'neutral'}>{e.status === 'live' ? 'Live' : e.status === 'confirmed' ? 'Confirmed' : 'Planning'}</Badge>
                  </Pressable>
                </motion.li>
              )
            })}
          </motion.ul>
        </>
      ) : (
        <motion.div key="agenda" variants={listParent} initial="hidden" animate="show" className="mt-5">
          {MONTHS.map(([y, m]) => {
            const key = `${y}-${String(m + 1).padStart(2, '0')}`
            const items = [
              ...EVENTS.filter((e) => e.date.startsWith(key)).map((e) => ({ iso: e.date, kind: 'event' as const, e })),
              ...PENCILS.filter((p) => p.iso.startsWith(key)).map((p) => ({ iso: p.iso, kind: 'pencil' as const, p })),
            ].sort((a, b) => a.iso.localeCompare(b.iso))
            if (!items.length) return null
            return (
              <section key={key} className="mb-2">
                <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--bg)] px-5 py-2">
                  <h2 className="grot text-[20px]">
                    {MONTH_LONG[m]} <em>{y}</em>
                  </h2>
                  <span className="meta text-text-2">{plural(items.length, 'entry', 'entries')}</span>
                </div>
                {items.map((it) => {
                  const past = it.iso < CLOCK.todayIso
                  const today = it.iso === CLOCK.todayIso
                  return it.kind === 'event' ? (
                    <motion.div key={it.e.id} variants={listItem}>
                      <Pressable onClick={() => openEvent(it.e)} className="flex items-center gap-3 px-5 py-3">
                        <span className="flex w-[44px] shrink-0 flex-col items-center rounded-[var(--r-control)] py-1" style={{ background: today ? it.e.colour : 'var(--surface-high)', color: today ? '#fff' : past ? 'var(--text-2)' : 'var(--text)' }}>
                          <span className="label" style={{ fontSize: 9.5, color: today ? 'rgb(255 255 255 / 0.8)' : 'var(--text-2)' }}>{dowLabel(it.iso)}</span>
                          <span className="figure num text-[22px]">{dayNum(it.iso)}</span>
                        </span>
                        <span className="relative block h-[52px] w-[64px] shrink-0 overflow-hidden rounded-[var(--r-control)]">
                          <img src={img(it.e.photo, 300)} alt="" className="h-full w-full object-cover" loading="lazy" style={past ? { filter: 'grayscale(0.8)' } : undefined} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[15px] font-bold ${past ? 'text-text-2' : ''}`}>{it.e.name}</span>
                          <span className="block truncate text-[12px] font-semibold text-text-2">
                            {it.e.time} · {it.e.venue}
                          </span>
                        </span>
                        <Badge tone={it.e.status === 'live' ? 'danger' : it.e.status === 'confirmed' ? 'success' : it.e.status === 'done' ? 'ink' : 'neutral'}>{it.e.status === 'live' ? 'Live' : it.e.status === 'confirmed' ? 'Confirmed' : it.e.status === 'done' ? 'Done' : 'Planning'}</Badge>
                      </Pressable>
                    </motion.div>
                  ) : (
                    <motion.div key={it.p.title} variants={listItem}>
                      <Pressable onClick={() => setDay(it.iso)} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="flex w-[44px] shrink-0 flex-col items-center py-1 text-text-2">
                          <span className="label" style={{ fontSize: 9.5 }}>{dowLabel(it.iso)}</span>
                          <span className="figure num text-[22px]">{dayNum(it.iso)}</span>
                        </span>
                        <span className="block h-[36px] w-[3px] shrink-0 rounded-full bg-brass" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{it.p.title}</span>
                          <span className="block truncate text-[12px] font-semibold text-text-2">{it.p.where} · pencilled</span>
                        </span>
                      </Pressable>
                    </motion.div>
                  )
                })}
              </section>
            )
          })}
        </motion.div>
      )}

      <p className="mt-6 px-5 text-center text-[12px] font-semibold text-text-2">
        Your free days are what clients see when they browse planners · {parseIso(CLOCK.todayIso).getUTCFullYear()} diary
      </p>
    </MobileScreen>
  )
}
