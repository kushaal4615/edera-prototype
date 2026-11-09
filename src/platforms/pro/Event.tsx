import { motion } from 'framer-motion'
import { CalendarDays, ChevronRight, Clock, DoorOpen, MapPin, MessageCircle, Plus, Search, Send, Users } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { Avatar, AvatarStack } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar, Figure, Money, Strip, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { BudgetBar, ProgressRing } from '../../components/Charts'
import { CheckMark, Input } from '../../components/Form'
import { BottomSheet } from '../../components/Sheet'
import { daysUntil, fmtDay, fmtShort, money, moneyShort, pct, plural, relDay, type Currency } from '../../data/clock'
import { DEMO_TASK } from '../../data/demoFill'
import { eventById, REQUESTS, RUBY_TASKS, RUBY_TOTALS, RUN_OF_SHOW, TONIGHT_CHECKED_IN, TONIGHT_TOTALS, type Event, type Role } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, SectionHead, TopBar } from '../mobileShell'

/* pro.event: the EVENT BOARD. A colour-block hero in the event's own colour
   with the photo as a duotone panel; the money strip laps it; roles as an
   asymmetric bento; guests as a split panel; run of show on a timeline
   spine; the checklist. Works for all eight events: the ruby anniversary
   has real tasks and run-of-show, the others synthesise theirs. */

const article = (label: string) => (/^[aeiou]/i.test(label) || /^MC/.test(label) ? 'an' : 'a')
const hm = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const fmtMin = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

type EffState = 'open' | 'requested' | 'confirmed' | 'shortlist' | 'declined' | 'proposed'

/** Large figure for money that stays short in both currencies. */
function Amount({ amount, currency, size = 24, tone }: { amount: number; currency: Currency; size?: number; tone?: string }) {
  if (currency === 'NGN' || amount >= 100_000) return <span className="figure num" style={{ fontSize: size, color: tone }}>{moneyShort(amount, currency)}</span>
  return <Money amount={amount} currency={currency} size={size} tone={tone} />
}

function synthRunOfShow(ev: Event) {
  const t0 = hm(ev.time)
  const by = (c: string) => ev.roles.find((r) => r.category === c)
  const who = (c: string, fallback: string) => {
    const r = by(c)
    return r?.vendorId ? vendorById(r.vendorId).name : fallback
  }
  const items: { time: string; item: string; who: string }[] = []
  items.push({ time: fmtMin(t0 - 300), item: by('decor') ? 'Decor setup begins' : 'Venue access · setup', who: by('decor') ? who('decor', 'Decor team') : 'Tunde + 1' })
  if (by('cake')) items.push({ time: fmtMin(t0 - 120), item: 'Cake delivered and set', who: who('cake', 'Cake') })
  if (by('catering')) items.push({ time: fmtMin(t0 - 90), item: 'Caterer on site', who: who('catering', 'Caterer') })
  items.push({ time: fmtMin(t0), item: 'Guests arrive · QR check-in', who: 'Tunde + 2' })
  items.push({ time: fmtMin(t0 + 60), item: by('mc') ? 'MC opens the programme' : 'Welcome and toasts', who: by('mc') ? who('mc', 'MC') : personById(ev.client).first })
  if (by('catering')) items.push({ time: fmtMin(t0 + 90), item: ev.type === 'Corporate' ? 'Canapés and networking' : 'Food served', who: who('catering', 'Caterer') })
  if (by('dj') || by('band')) items.push({ time: fmtMin(t0 + 180), item: by('band') ? 'Live band set' : 'DJ takes over', who: by('band') ? who('band', 'Band') : who('dj', 'DJ') })
  items.push({ time: fmtMin(t0 + 330), item: 'Carriages', who: 'Tunde' })
  return items.slice(0, 7)
}

function synthTasks(ev: Event) {
  const caterer = ev.roles.find((r) => r.category === 'catering' && r.vendorId)
  const sent = Math.round(ev.guests * 0.72)
  const list = [
    { id: `${ev.id}-t1`, title: `Final headcount to ${caterer ? vendorById(caterer.vendorId!).name : 'the caterer'}`, due: ev.date, done: false },
    { id: `${ev.id}-t2`, title: 'Share run of show with every vendor', due: ev.date, done: false },
    { id: `${ev.id}-t3`, title: `Send QR invites (${Math.min(sent, ev.guests)} of ${ev.guests} sent)`, due: ev.date, done: false },
    { id: `${ev.id}-t4`, title: `Walk the venue · ${ev.venue.split(',')[0]}`, due: ev.date, done: false },
    { id: `${ev.id}-t5`, title: 'Lock the table plan', due: ev.date, done: false },
  ]
  const ratio = ev.checklistTotal ? ev.checklistDone / ev.checklistTotal : 0
  const doneN = Math.min(5, Math.round(ratio * 5))
  return list.map((t, i) => ({ ...t, done: i < doneN }))
}

type LocalTask = { id: string; title: string; due: string; done: boolean; owner?: string }

export default function ProEvent() {
  const { navigate, toast } = useNav()
  const id = useSession((s) => s.viewingEvent)
  const tasksDone = useSession((s) => s.tasksDone)
  const requestsSent = useSession((s) => s.requestsSent)
  const decisions = useSession((s) => s.requestDecisions)
  const checkedIn = useSession((s) => s.checkedIn)
  const walkIns = useSession((s) => s.walkIns)

  const ev = eventById(id)
  const isRuby = ev.id === 'ev-ruby'
  const isLive = ev.status === 'live'
  const client = personById(ev.client)
  const d = daysUntil(ev.date)

  /* local state: added tasks + synthesised checklist for non-ruby events */
  const [added, setAdded] = useState<LocalTask[]>([])
  const [localDone, setLocalDone] = useState<string[]>([])
  const [sheet, setSheet] = useState(false)
  const [draft, setDraft] = useState(DEMO_TASK)
  const [draftDue, setDraftDue] = useState(fmtShort(ev.date))
  const [nudged, setNudged] = useState<string[]>([])
  const synth = useMemo(() => synthTasks(ev), [ev])

  const rows: LocalTask[] = isRuby
    ? [...added, ...RUBY_TASKS.map((t) => ({ id: t.id, title: t.title, due: t.due, done: t.done || tasksDone.includes(t.id), owner: t.owner }))]
    : [...added, ...synth.map((t) => ({ ...t, done: t.done || localDone.includes(t.id), owner: 'tunde' }))]
  const doneCount = rows.filter((t) => t.done).length

  const toggle = (t: LocalTask) => {
    if (isRuby && RUBY_TASKS.some((k) => k.id === t.id)) session.toggleTask(t.id)
    else if (added.some((a) => a.id === t.id)) setAdded((l) => l.map((a) => (a.id === t.id ? { ...a, done: !a.done } : a)))
    else setLocalDone((l) => (l.includes(t.id) ? l.filter((x) => x !== t.id) : [...l, t.id]))
  }

  /* effective role state after this session's decisions */
  const eff = (r: Role): { state: EffState; waitMin?: number; rqId?: string } => {
    if (r.vendorId) {
      const rq = REQUESTS.find((q) => q.eventId === ev.id && q.vendorId === r.vendorId)
      if (rq) {
        const st = decisions[rq.id] ?? rq.state
        if (st === 'accepted' || st === 'confirmed' || st === 'completed') return { state: 'confirmed', rqId: rq.id }
        if (st === 'declined') return { state: 'declined', rqId: rq.id }
        if (st === 'proposed') return { state: 'proposed', rqId: rq.id }
        if (st === 'requested') return { state: 'requested', waitMin: rq.sentMinutesAgo, rqId: rq.id }
      }
      if (r.state === 'shortlist' && requestsSent.includes(r.vendorId)) return { state: 'requested', waitMin: 1 }
    }
    return { state: r.state, waitMin: r.state === 'requested' ? 120 : undefined }
  }
  const roles = ev.roles.map((r) => ({ role: r, ...eff(r) }))
  const confirmed = roles.filter((x) => x.state === 'confirmed')
  const pending = roles.filter((x) => x.state === 'requested' || x.state === 'proposed')
  const shortlist = roles.filter((x) => x.state === 'shortlist')
  const open = roles.filter((x) => x.state === 'open' || x.state === 'declined')

  /* committed = the event's recorded spend (quotes confirmed so far); waiting = quotes still with vendors */
  const committed = ev.spent
  const pendingSum = pending.reduce((n, x) => n + x.role.budget, 0)
  const remaining = Math.max(0, ev.budget - committed)

  /* guests */
  const live = TONIGHT_TOTALS.checkedIn + (checkedIn.length - TONIGHT_CHECKED_IN.length) + walkIns.length
  const guests = isRuby
    ? { yes: RUBY_TOTALS.yes, no: RUBY_TOTALS.no, pending: RUBY_TOTALS.pending, sent: RUBY_TOTALS.invitesSent, tables: RUBY_TOTALS.tables }
    : isLive
      ? { yes: TONIGHT_TOTALS.expected, no: 0, pending: 0, sent: TONIGHT_TOTALS.expected, tables: 12 }
      : ev.status === 'done'
        ? { yes: ev.guests, no: 0, pending: 0, sent: ev.guests, tables: Math.ceil(ev.guests / 10) }
        : { yes: Math.round(ev.guests * 0.58), no: Math.round(ev.guests * 0.09), pending: ev.guests - Math.round(ev.guests * 0.58) - Math.round(ev.guests * 0.09), sent: Math.round(ev.guests * 0.72), tables: Math.ceil(ev.guests / 10) }

  const show = isRuby ? RUN_OF_SHOW : synthRunOfShow(ev)
  const nowMin = 18 * 60 + 42

  const heroText = { '--text': '#ffffff', '--text-2': 'rgb(255 255 255 / 0.8)' } as CSSProperties

  const messageClient = () => {
    track('message_client', ev.client)
    session.viewThread(isRuby ? 'th1' : isLive ? 'th3' : ev.id === 'ev-chidera' ? 'th6' : 'th1')
    navigate('pro.messages')
  }

  return (
    <MobileScreen
      cap={ev.colour}
      dock={
        <Dock>
          <Button variant="outline" size="lg" block icon={MessageCircle} onClick={messageClient}>
            Message {client.first}
          </Button>
          <Button variant="accent" size="lg" block icon={Plus} onClick={() => setSheet(true)}>
            Add task
          </Button>
        </Dock>
      }
      overlay={
        <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Add a task">
          <div className="flex flex-col gap-3 pt-1">
            <Input label="Task" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Due" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} />
              <Input label="Owner" value="Tunde Bakare" readOnly />
            </div>
            <p className="text-[12px] font-semibold text-text-2">Linked to {ev.name}. {client.first} sees it in the client summary once it is done.</p>
            <Button
              size="lg"
              block
              icon={Plus}
              onClick={() => {
                const t: LocalTask = { id: `new-${Date.now()}`, title: draft, due: ev.date, done: false, owner: 'tunde' }
                setAdded((l) => [t, ...l])
                setSheet(false)
                track('add_task', draft)
                toast(`Task added · due ${draftDue}`, 'accent')
              }}
            >
              Add task
            </Button>
          </div>
        </BottomSheet>
      }
    >
      {/* ── Colour-block hero with duotone photo panel ── */}
      <div className="relative overflow-hidden" style={{ background: ev.colour }}>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[46%]">
          <img src={img(ev.photo, 600)} alt="" className="h-full w-full object-cover" style={{ filter: 'grayscale(1) contrast(1.15)' }} />
          <div className="absolute inset-0" style={{ background: ev.colour, mixBlendMode: 'multiply' }} />
          <div className="absolute inset-0" style={{ background: 'rgb(255 255 255 / 0.55)', mixBlendMode: 'soft-light' }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${ev.colour} 0%, transparent 42%)` }} />
        </div>
        <span aria-hidden className="arc" style={{ opacity: 0.55 }} />
        <span aria-hidden className="grain" />

        <div style={heroText} className="relative">
          <TopBar
            tone="clear"
            right={
              <>
                <IconButton icon={CalendarDays} label="Calendar" tone="scrim" size={40} onClick={() => navigate('pro.calendar')} />
                <IconButton icon={MessageCircle} label={`Message ${client.first}`} tone="scrim" size={40} onClick={messageClient} />
              </>
            }
          />
        </div>

        <div className="relative px-5 pb-7 pt-1" style={{ color: '#fff' }}>
          <div className="flex items-center gap-2">
            <span className="label rounded-full px-2.5 py-1" style={{ background: 'rgb(255 255 255 / 0.16)' }}>
              {ev.type}
            </span>
            {isLive ? (
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-white px-2.5 text-[11px] font-extrabold uppercase tracking-[0.1em]" style={{ color: ev.colour }}>
                <motion.span aria-hidden className="h-2 w-2 rounded-full" style={{ background: ev.colour }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                Live
              </span>
            ) : (
              <span className="label rounded-full bg-white px-2.5 py-1" style={{ color: ev.colour }}>
                {ev.status === 'done' ? 'Done' : ev.status === 'confirmed' ? 'Confirmed' : 'Planning'}
              </span>
            )}
          </div>
          <h1 className="grot mt-3 max-w-[70%] text-[32px]">{ev.name}</h1>
          <div className="mt-3 flex flex-col gap-1 text-[13px] font-semibold" style={{ color: 'rgb(255 255 255 / 0.86)' }}>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} aria-hidden /> {fmtDay(ev.date, true)} · {ev.time}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} aria-hidden /> {ev.venue}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} aria-hidden /> {plural(ev.guests, 'guest')} · {plural(guests.tables, 'table')}
            </span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5" style={{ background: 'rgb(255 255 255 / 0.14)' }}>
              <Avatar who={client.photo} size={32} alt={client.name} />
              <span className="leading-tight">
                <span className="block text-[13px] font-bold">{client.name}</span>
                <span className="block text-[11px] font-semibold" style={{ color: 'rgb(255 255 255 / 0.78)' }}>
                  Client · sees the summary
                </span>
              </span>
            </div>
            <span className="shrink-0 text-right">
              {isLive ? <Figure value={live} unit={`/ ${TONIGHT_TOTALS.expected} in`} size={44} tone="#fff" /> : d < 0 ? <Figure value={-d} unit="days ago" size={44} tone="#fff" /> : <Figure value={d} unit={d === 1 ? 'day' : 'days'} size={44} tone="#fff" />}
            </span>
          </div>
        </div>
      </div>

      {/* ── Money strip, lapping the hero ── */}
      <section className="relative z-10 -mt-4 mx-4 rounded-[var(--r-container)] bg-[var(--surface)] p-4 shadow-[var(--shadow-floating)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="label text-text-2">Budget</p>
            <Amount amount={ev.budget} currency={ev.currency} />
          </div>
          <div>
            <p className="label text-accent-ink">Committed</p>
            <Amount amount={committed} currency={ev.currency} tone="var(--accent-text)" />
          </div>
          <div className="text-right">
            <p className="label text-text-2">Remaining</p>
            <Amount amount={remaining} currency={ev.currency} />
          </div>
        </div>
        <div className="mt-3">
          <BudgetBar regular={committed} overtime={pendingSum} max={ev.budget} height={10} />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-text-2">
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> confirmed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brass" /> waiting {moneyShort(pendingSum, ev.currency)}
            </span>
          </span>
          <span>Settled outside Edera</span>
        </div>
      </section>

      {/* ── Roles bento ── */}
      <SectionHead className="mt-7" eyebrow={`${confirmed.length} of ${roles.length} confirmed · ${pending.length} waiting · ${open.length} open`} title={<>Roles</>} action="Requests" onAction={() => navigate('pro.requests')} />
      <motion.div variants={listParent} initial="hidden" animate="show" className="mt-3 grid grid-cols-2 gap-2.5 px-5">
        {confirmed.map(({ role }, i) => {
          const v = vendorById(role.vendorId!)
          const owner = personById(v.owner)
          if (confirmed.length > 3 && i >= 2)
            return (
              <motion.div key={role.label} variants={listItem}>
                <Pressable onClick={() => navigate('pro.requests')} className="flex h-full items-center gap-2.5 rounded-[var(--r-card)] bg-accent-soft p-3">
                  <Avatar who={owner.photo} size={34} alt={owner.name} verified />
                  <span className="min-w-0 flex-1">
                    <span className="label block text-[var(--on-accent-soft)]">{role.label}</span>
                    <span className="block truncate text-[13px] font-bold">{v.name}</span>
                    <span className="num block text-[12px] font-semibold text-text-2">{money(role.budget, ev.currency)}</span>
                  </span>
                </Pressable>
              </motion.div>
            )
          return (
            <motion.div key={role.label} variants={listItem} className="col-span-2">
              <Pressable onClick={() => navigate('pro.requests')} className="flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface)] p-3 shadow-[var(--shadow-raised)]">
                <span className="relative block h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[var(--r-control)]">
                  <img src={img(v.photos[0], 200)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-[var(--surface)]">
                    <Avatar who={owner.photo} size={24} alt={owner.name} />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="label text-text-2">{role.label}</span>
                    <Badge tone="success">Confirmed</Badge>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 truncate text-[15px] font-bold">
                    {v.name} {v.verified && <Verified size={14} label={false} />}
                  </span>
                  <Strip vendor={v} size="xs" highlight={ev.date} className="mt-2" />
                </span>
                <span className="num shrink-0 text-[14px] font-bold">{money(role.budget, ev.currency)}</span>
              </Pressable>
            </motion.div>
          )
        })}

        {pending.map(({ role, state, waitMin }) => {
          const v = vendorById(role.vendorId!)
          const proposed = state === 'proposed'
          const isNudged = nudged.includes(role.label)
          return (
            <motion.div key={role.label} variants={listItem} className="flex flex-col rounded-[var(--r-card)] bg-brass-soft p-3">
              <span className="flex items-center justify-between">
                <span className="label text-on-brass-soft">{role.label}</span>
                <span className="h-2 w-2 rounded-full bg-held" />
              </span>
              <span className="mt-1 truncate text-[14px] font-bold">{v.name}</span>
              <span className="num mt-0.5 text-[12px] font-semibold text-text-2">{money(role.budget, ev.currency)}</span>
              <span className="meta mt-2 text-on-brass-soft">{proposed ? 'new date proposed' : `waiting ${waitMin && waitMin < 60 ? `${waitMin}m` : waitMin && waitMin < 1440 ? `${Math.round(waitMin / 60)}h` : `${Math.round((waitMin ?? 0) / 1440)}d`}`}</span>
              <motion.button
                type="button"
                whileTap={tap}
                transition={spring.ui}
                onClick={() => {
                  if (proposed) {
                    navigate('pro.requests')
                    return
                  }
                  setNudged((l) => [...l, role.label])
                  track('nudge_vendor', v.id)
                  toast(`Nudge sent to ${personById(v.owner).first} · replies ${v.responseTime}`, 'accent')
                }}
                className={`mt-2.5 inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[12px] font-bold ${isNudged ? 'bg-[var(--surface)] text-text-2' : 'bg-ink text-on-ink'}`}
              >
                {proposed ? (
                  <>
                    Review date <ChevronRight size={13} aria-hidden />
                  </>
                ) : isNudged ? (
                  'Nudged'
                ) : (
                  <>
                    <Send size={13} aria-hidden /> Nudge
                  </>
                )}
              </motion.button>
            </motion.div>
          )
        })}

        {shortlist.map(({ role }) => {
          const v = vendorById(role.vendorId!)
          return (
            <motion.div key={role.label} variants={listItem} className="flex flex-col rounded-[var(--r-card)] bg-[var(--surface)] p-3 shadow-[var(--shadow-raised)]">
              <span className="flex items-center justify-between">
                <span className="label text-text-2">{role.label}</span>
                <Badge tone="info">Shortlist</Badge>
              </span>
              <span className="mt-1 flex items-center gap-2">
                <Avatar who={personById(v.owner).photo} size={22} alt="" />
                <span className="truncate text-[14px] font-bold">{v.name}</span>
              </span>
              <span className="num mt-0.5 text-[12px] font-semibold text-text-2">
                {money(role.budget, ev.currency)} · free {fmtShort(ev.date)}
              </span>
              <Button
                size="sm"
                variant="accent"
                className="mt-2.5"
                onClick={() => {
                  session.sendRequest(v.id)
                  track('confirm_shortlist', v.id)
                  toast(`Request sent to ${v.name} · ${money(role.budget, ev.currency)}`, 'accent')
                }}
              >
                Confirm
              </Button>
            </motion.div>
          )
        })}

        {open.map(({ role, state }) => {
          const declined = state === 'declined' ? vendorById(role.vendorId!) : REQUESTS.map((q) => ({ q, v: vendorById(q.vendorId) })).find((x) => x.q.eventId === ev.id && x.v.category === role.category && (decisions[x.q.id] ?? x.q.state) === 'declined')?.v
          return (
            <motion.button
              key={role.label}
              type="button"
              variants={listItem}
              whileTap={tap}
              transition={spring.ui}
              onClick={() => {
                track('find_vendor', role.category)
                session.setCategory(role.category)
                navigate('pro.vendors')
              }}
              className="flex min-h-[112px] flex-col items-start rounded-[var(--r-card)] p-3 text-left"
              style={{ border: '1.5px dashed var(--rule-strong)' }}
            >
              <span className="flex w-full items-center justify-between">
                <span className="label text-text-2">{role.label}</span>
                {declined ? <Badge tone="danger">Declined</Badge> : <Badge tone="neutral">Open</Badge>}
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-bold text-accent-ink">
                <Search size={14} aria-hidden /> Find {article(role.label)} {role.label}
              </span>
              <span className="num mt-auto pt-2 text-[12px] font-semibold text-text-2">{declined ? `${declined.name} declined` : `budget ${money(role.budget, ev.currency)}`}</span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* ── Guests: split panel ── */}
      <SectionHead className="mt-8" eyebrow={isLive ? `Doors ${TONIGHT_TOTALS.doors} · ${TONIGHT_TOTALS.walkIns + walkIns.length} walk-ins · ${TONIGHT_TOTALS.flagged} duplicate` : `${guests.sent} of ${ev.guests} QR invites sent`} title={<>Guests</>} action="Guest list" onAction={() => navigate('pro.guests')} />
      <div className="mx-5 mt-3 flex overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
        <Pressable onClick={() => navigate(isLive ? 'pro.checkin' : 'pro.guests')} className="flex w-[46%] shrink-0 flex-col justify-between bg-ink p-4 text-on-ink">
          {isLive ? (
            <>
              <ProgressRing value={pct(live, TONIGHT_TOTALS.expected)} size={76} stroke={7} color="var(--brass)">
                <span className="figure num text-[24px] text-on-ink">{live}</span>
              </ProgressRing>
              <span className="mt-3 block text-[12px] font-semibold text-on-ink-2">checked in of {TONIGHT_TOTALS.expected}</span>
            </>
          ) : (
            <>
              <Figure value={guests.yes} unit="yes" size={48} tone="var(--on-ink)" />
              <span className="my-3 block">
                <AvatarStack people={isRuby ? ['chioma', 'obi', 'ife', 'amaka'] : ['bisi', 'dami', 'uche', 'zara']} size={26} />
              </span>
              <span className="block text-[12px] font-semibold text-on-ink-2">
                of {ev.guests} invited · {pct(guests.yes, ev.guests)}% · {guests.tables} tables
              </span>
            </>
          )}
        </Pressable>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 p-4">
          {(
            [
              ['Yes', guests.yes, 'accent'],
              ['Pending', guests.pending, 'brass'],
              ['No', guests.no, 'danger'],
            ] as const
          ).map(([label, n, tone]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-[12px] font-semibold">
                <span className="text-text-2">{label}</span>
                <span className="num font-bold">{n}</span>
              </div>
              <Bar value={pct(n, ev.guests)} height={4} tone={tone} className="mt-1" />
            </div>
          ))}
          <Button size="sm" variant={isLive ? 'accent' : 'paper'} icon={DoorOpen} className="mt-1 self-start" onClick={() => navigate('pro.checkin')}>
            {isLive ? 'Door · scan' : 'Door'}
          </Button>
        </div>
      </div>

      {/* ── Run of show: timeline spine ── */}
      <SectionHead className="mt-8" eyebrow={`${show.length} calls · ${fmtDay(ev.date)}`} title={<>Run of <em>show</em></>} />
      <ol className="relative mx-5 mt-4">
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-[62px] top-3 w-[2px] bg-[var(--rule-strong)]" />
        {show.map((s, i) => {
          const past = isLive && hm(s.time) <= nowMin
          const next = isLive && !past && show.findIndex((x) => hm(x.time) > nowMin) === i
          return (
            <li key={s.time + s.item} className="relative flex items-start gap-3 py-2">
              <span className={`meta w-[48px] shrink-0 pt-1 text-right ${past ? 'text-text-2' : 'text-text'}`}>{s.time}</span>
              <span className="relative mt-[7px] grid h-[12px] w-[12px] shrink-0 place-items-center">
                <span className={`block h-[10px] w-[10px] rounded-full ring-4 ring-[var(--bg)] ${next ? 'bg-brass' : past ? 'bg-text-2' : 'bg-accent'}`} style={next ? { boxShadow: '0 0 0 4px var(--bg), 0 0 0 6px var(--brass)' } : undefined} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[14px] ${past ? 'font-semibold text-text-2 line-through decoration-[var(--rule-strong)]' : 'font-bold'}`}>{s.item}</span>
                <span className="block text-[12px] font-semibold text-text-2">
                  {s.who}
                  {next && <span className="ml-2 rounded-full bg-brass-soft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-on-brass-soft">next</span>}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      {/* ── Checklist ── */}
      <SectionHead className="mt-6" eyebrow={`${doneCount} of ${rows.length} done`} title={<>Checklist</>} action="Add task" onAction={() => setSheet(true)} />
      <div className="mx-5 mt-3">
        <Bar value={pct(doneCount, rows.length)} height={6} />
      </div>
      <ul className="mt-3 px-5">
        {rows.map((t) => {
          const owner = t.owner && t.owner !== 'vendor' ? personById(t.owner) : null
          const overdue = !t.done && daysUntil(t.due) < 0
          return (
            <li key={t.id}>
              <motion.button type="button" whileTap={{ scale: 0.99 }} transition={spring.ui} onClick={() => toggle(t)} className="flex w-full items-center gap-3 py-2.5 text-left">
                <CheckMark on={t.done} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[14px] ${t.done ? 'font-semibold text-text-2 line-through decoration-[var(--rule-strong)]' : 'font-semibold'}`}>{t.title}</span>
                  <span className={`meta ${overdue ? 'text-danger-text' : 'text-text-2'}`}>{t.done ? 'done' : overdue ? `overdue · ${fmtShort(t.due)}` : `due ${fmtShort(t.due)} · ${relDay(t.due)}`}</span>
                </span>
                {owner ? <Avatar who={owner.photo} size={24} alt={owner.name} /> : <span className="label rounded-full bg-brass-soft px-2 py-1 text-on-brass-soft" style={{ fontSize: 10 }}>Vendor</span>}
              </motion.button>
            </li>
          )
        })}
      </ul>

      {ev.vibe && (
        <div className="mx-5 mt-5 rounded-[var(--r-card)] bg-[var(--surface-raised)] p-4">
          <p className="label text-brass-ink">The brief from {client.first}</p>
          <p className="grot mt-1.5 text-[18px] leading-[1.2]">“{ev.vibe}”</p>
        </div>
      )}
    </MobileScreen>
  )
}
