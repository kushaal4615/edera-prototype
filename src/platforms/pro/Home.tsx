import { motion } from 'framer-motion'
import { Bell, ChevronRight, DoorOpen, MessageCircle, QrCode } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Strip, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { ProgressRing } from '../../components/Charts'
import { CheckMark } from '../../components/Form'
import { HeroImage, Rail } from '../../components/Media'
import { ago, CLOCK, daysUntil, dayNum, dowLabel, fmtShort, money, moneyShort, pct, plural, relDay } from '../../data/clock'
import { EVENTS, eventById, REQUESTS, RUBY, RUBY_TASKS, TONIGHT, TONIGHT_CHECKED_IN, TONIGHT_TOTALS, type Role } from '../../data/events'
import { img } from '../../data/media'
import { personById, PLANNER } from '../../data/people'
import { categoryById, vendorById, type CategoryId } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, unreadPro, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* pro.home: Tunde's "Today". The live engagement dinner is a photographic
   hero lapping the top of the frame; then the requests he is waiting on
   bleed off the right edge; this week's events as an editorial list; open
   roles as a photographic bento; the ruby checklist's next four tasks. */

const article = (label: string) => (/^[aeiou]/i.test(label) || /^MC/.test(label) ? 'an' : 'a')

type OpenRole = { category: CategoryId; label: string; count: number; events: string[] }

function openRoles(): OpenRole[] {
  const map = new Map<CategoryId, OpenRole>()
  for (const ev of EVENTS) {
    if (ev.status === 'done') continue
    for (const r of ev.roles as Role[]) {
      if (r.state !== 'open') continue
      const cur = map.get(r.category) ?? { category: r.category, label: categoryById(r.category).label, count: 0, events: [] }
      cur.count += 1
      cur.events.push(ev.name.split(' · ')[0])
      map.set(r.category, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export default function ProHome() {
  const { navigate, toast } = useNav()
  const checkedIn = useSession((s) => s.checkedIn)
  const walkIns = useSession((s) => s.walkIns)
  const tasksDone = useSession((s) => s.tasksDone)
  const requestsSent = useSession((s) => s.requestsSent)
  const decisions = useSession((s) => s.requestDecisions)
  const unread = useSession((s) => unreadPro(s))

  const live = TONIGHT_TOTALS.checkedIn + (checkedIn.length - TONIGHT_CHECKED_IN.length) + walkIns.length
  const livePct = pct(live, TONIGHT_TOTALS.expected)

  const waiting = REQUESTS.filter((r) => r.by === 'tunde' && (decisions[r.id] ?? r.state) === 'requested')
  const sentThisSession = requestsSent.length

  const week = EVENTS.filter((e) => {
    const d = daysUntil(e.date)
    return d >= 0 && d <= 14
  }).sort((a, b) => a.date.localeCompare(b.date))

  const roles = openRoles()
  const totalOpen = roles.reduce((n, r) => n + r.count, 0)
  const tasks = RUBY_TASKS.filter((t) => !t.done && !tasksDone.includes(t.id)).slice(0, 4)
  const doneCount = RUBY_TASKS.filter((t) => t.done || tasksDone.includes(t.id)).length

  const open = (id: string) => {
    session.viewEvent(id)
    navigate('pro.event')
  }

  return (
    <MobileScreen tab="today" cap="var(--night)">
      {/* ── LIVE hero, photographic, lapping the status bar ── */}
      <HeroImage src="dinnerLaugh" alt="Guests laughing around a long dinner table" scrim="both" className="w-full" position="center 40%">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]" style={{ background: 'linear-gradient(to top, rgb(11 38 34 / 0.55) 0%, rgb(11 38 34 / 0.35) 55%, transparent 100%)' }} />
        <div className="relative flex flex-col px-5 pb-6" style={{ paddingTop: `calc(${SAFE_TOP} + 6px)`, minHeight: 470 }}>
          {/* header row */}
          <div className="flex items-center gap-2">
            <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => navigate('pro.profile')} aria-label="Your profile" className="rounded-full">
              <Avatar who={PLANNER.photo} size={40} ring alt="Tunde Bakare" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={tap}
              transition={spring.ui}
              onClick={() => navigate('pro.verification')}
              className="flex h-9 items-center gap-1.5 rounded-full pl-2 pr-3 text-[12px] font-bold text-on-night"
              style={{ background: 'rgb(11 38 34 / 0.45)', backdropFilter: 'blur(10px)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.16)' }}
            >
              <Verified size={15} label={false} tone="brass" />
              Verified Professional
            </motion.button>
            <span className="flex-1" />
            <IconButton icon={Bell} label={unread ? `Inbox, ${unread} new` : 'Inbox'} tone="scrim" badge={unread} onClick={() => navigate('pro.messages')} />
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-danger px-2.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-on-danger">
                <motion.span aria-hidden className="h-2 w-2 rounded-full bg-white" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                Live
              </span>
              <span className="text-[12px] font-semibold text-on-night-2">
                {CLOCK.time} · doors {TONIGHT_TOTALS.doors} · {TONIGHT.venue}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="grot text-[34px] text-on-night">
                  Adaora &amp; Kunle
                  <br />
                  <em>Engagement dinner</em>
                </h1>
                <p className="mt-2 text-[13px] font-semibold text-on-night-2">
                  {plural(live, 'guest')} in of {TONIGHT_TOTALS.expected} · {TONIGHT_TOTALS.walkIns + walkIns.length} walk-ins · {TONIGHT_TOTALS.flagged} duplicate scan
                </p>
              </div>
              <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => navigate('pro.checkin')} aria-label={`${live} of ${TONIGHT_TOTALS.expected} checked in. Open the door`} className="shrink-0 rounded-full">
                <ProgressRing value={livePct} size={84} stroke={7} color="var(--brass)">
                  <span className="flex flex-col items-center leading-none">
                    <span className="figure num text-[26px] text-on-night">{live}</span>
                    <span className="meta mt-0.5 text-on-night-2" style={{ fontSize: 10 }}>
                      of {TONIGHT_TOTALS.expected}
                    </span>
                  </span>
                </ProgressRing>
              </motion.button>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="accent" size="lg" block icon={QrCode} onClick={() => { track('open_door'); navigate('pro.checkin') }}>
                Open the door
              </Button>
              <Button variant="white" size="lg" icon={MessageCircle} onClick={() => { session.viewThread('th3'); navigate('pro.messages') }}>
                Message Bola
              </Button>
            </div>
          </div>
        </div>
      </HeroImage>

      {/* ── Waiting on vendors: rail bleeding right ── */}
      <SectionHead
        className="mt-7"
        eyebrow={`${waiting.length} waiting${sentThisSession ? ` · ${sentThisSession} sent just now` : ''}`}
        title={
          <>
            Waiting on <em>vendors</em>
          </>
        }
        action="All requests"
        onAction={() => navigate('pro.requests')}
      />
      <Rail className="mt-4 pb-1" gap={12}>
        {waiting.map((r, i) => {
          const v = vendorById(r.vendorId)
          const ev = eventById(r.eventId)
          const owner = personById(v.owner)
          const stale = r.sentMinutesAgo > 60 * 24
          return (
            <motion.div key={r.id} variants={listItem} initial="hidden" animate="show" transition={{ delay: 0.05 * i }} className="shrink-0 snap-start">
              <Pressable onClick={() => { track('open_requests', r.id); navigate('pro.requests') }} className="w-[228px] overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
                <div className="relative h-[108px]">
                  <img src={img(v.photos[0], 500)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <div aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
                  <span className="absolute left-3 top-3">
                    <Badge tone={stale ? 'warn' : 'neutral'}>{stale ? 'Still waiting' : 'Waiting'}</Badge>
                  </span>
                  <div className="absolute inset-x-3 bottom-2.5 flex items-center gap-2">
                    <Avatar who={owner.photo} size={26} alt={owner.name} />
                    <span className="truncate text-[13px] font-bold text-on-night">{v.name}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-[12px] font-semibold text-text-2">{ev.name}</p>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="num text-[17px] font-bold">{money(r.amount, v.currency)}</span>
                    <span className="meta text-text-2">sent {ago(r.sentMinutesAgo)}</span>
                  </div>
                  <Strip vendor={v} size="xs" highlight={r.date} className="mt-2.5" />
                </div>
              </Pressable>
            </motion.div>
          )
        })}
        {/* peeking tail card */}
        <Pressable onClick={() => navigate('pro.requests')} className="grid w-[120px] shrink-0 snap-start place-items-center rounded-[var(--r-card)] text-center" style={{ boxShadow: 'inset 0 0 0 1.5px var(--rule-strong)' }}>
          <span className="flex flex-col items-center gap-1 text-text-2">
            <ChevronRight size={20} aria-hidden />
            <span className="text-[12px] font-bold">All {REQUESTS.filter((r) => r.by === 'tunde').length}</span>
          </span>
        </Pressable>
      </Rail>

      {/* ── This week: editorial list ── */}
      <SectionHead className="mt-8" eyebrow="Next 14 days" title={<>This <em>week</em></>} action="Calendar" onAction={() => navigate('pro.calendar')} />
      <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-2">
        {week.map((e) => {
          const client = personById(e.client)
          const isLive = e.status === 'live'
          return (
            <motion.li key={e.id} variants={listItem}>
              <Pressable onClick={() => open(e.id)} className="flex items-center gap-4 px-5 py-3.5">
                <span className="flex w-[48px] shrink-0 flex-col items-center rounded-[var(--r-control)] py-1.5" style={{ background: isLive ? e.colour : 'var(--surface-high)', color: isLive ? '#fff' : 'var(--text)' }}>
                  <span className="label" style={{ fontSize: 10, color: isLive ? 'rgb(255 255 255 / 0.8)' : 'var(--text-2)' }}>{dowLabel(e.date)}</span>
                  <span className="figure num text-[24px]">{dayNum(e.date)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold">{e.name}</span>
                  <span className="mt-0.5 block truncate text-[12px] font-semibold text-text-2">
                    {e.time} · {e.venue} · {plural(e.guests, 'guest')}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5">
                    {isLive ? <Badge tone="danger">Live now</Badge> : <Badge tone={e.status === 'confirmed' ? 'success' : 'neutral'}>{e.status === 'confirmed' ? 'Confirmed' : 'Planning'}</Badge>}
                    <span className="meta text-text-2">{isLive ? 'today' : relDay(e.date)}</span>
                  </span>
                </span>
                <Avatar who={client.photo} size={34} alt={client.name} />
              </Pressable>
            </motion.li>
          )
        })}
      </motion.ul>

      {/* ── Open roles: photographic bento ── */}
      <SectionHead className="mt-6" eyebrow={`${totalOpen} roles across ${new Set(roles.flatMap((r) => r.events)).size} events`} title={<>Open <em>roles</em></>} action="Find a vendor" onAction={() => { session.setCategory(null); navigate('pro.vendors') }} />
      <div className="mt-4 grid grid-cols-6 gap-2 px-5" style={{ gridAutoRows: 96 }}>
        {roles.map((r, i) => {
          const cat = categoryById(r.category)
          const rest = roles.length - 2
          const smallSpan = rest % 3 === 0 ? 'col-span-2' : rest % 2 === 0 ? 'col-span-3' : i === roles.length - 1 ? 'col-span-6' : 'col-span-2'
          const span = i === 0 ? 'col-span-4 row-span-2' : i === 1 ? 'col-span-2 row-span-2' : `${smallSpan} row-span-1`
          const big = i < 2
          return (
            <motion.button
              key={r.category}
              type="button"
              whileTap={tap}
              transition={spring.ui}
              onClick={() => { track('find_vendor', r.category); session.setCategory(r.category); navigate('pro.vendors') }}
              className={`relative overflow-hidden rounded-[var(--r-card)] text-left ${span}`}
              aria-label={`Find ${article(r.label)} ${r.label}: ${r.count} open`}
            >
              <img src={img(cat.photo, 500)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[rgb(11_38_34/0.5)]" />
              <div aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
              <div className={`relative flex h-full flex-col justify-end ${big ? 'p-3.5' : 'p-2.5'}`}>
                <span className={`figure num text-on-night ${big ? 'text-[34px]' : 'text-[22px]'}`}>{r.count}</span>
                <span className={`font-bold leading-tight text-on-night ${big ? 'text-[15px]' : 'truncate text-[12px]'}`}>{r.label}</span>
                {big && <span className="mt-0.5 truncate text-[11px] font-semibold text-on-night-2">{r.events.join(' · ')}</span>}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* ── Tasks due: the ruby checklist ── */}
      <SectionHead
        className="mt-8"
        eyebrow={`${RUBY.name} · ${doneCount} of ${RUBY_TASKS.length} done`}
        title={<>Tasks <em>due</em></>}
        action="Event board"
        onAction={() => open(RUBY.id)}
      />
      <div className="mx-5 mt-4 rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
        {tasks.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="grot text-[20px]">All caught up</p>
            <p className="mt-1 text-[13px] text-text-2">Nothing due on the anniversary this week.</p>
          </div>
        )}
        {tasks.map((t, i) => {
          const owner = t.owner === 'tunde' ? PLANNER : t.owner === 'adaeze' ? personById('adaeze') : null
          const overdue = daysUntil(t.due) < 0
          return (
            <motion.button
              key={t.id}
              type="button"
              whileTap={{ scale: 0.99 }}
              transition={spring.ui}
              onClick={() => { session.toggleTask(t.id); toast(`“${t.title}” marked done`, 'accent') }}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? 'border-t border-[var(--rule)]' : ''}`}
            >
              <CheckMark on={false} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{t.title}</span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className={`meta ${overdue ? 'text-danger-text' : 'text-text-2'}`}>
                    {overdue ? 'overdue · ' : 'due '}
                    {fmtShort(t.due)}
                  </span>
                  {t.role && <Badge tone="neutral">{categoryById(t.role).label}</Badge>}
                </span>
              </span>
              {owner ? <Avatar who={owner.photo} size={26} alt={owner.name} /> : <span className="label rounded-full bg-brass-soft px-2 py-1 text-on-brass-soft" style={{ fontSize: 10 }}>Vendor</span>}
            </motion.button>
          )
        })}
      </div>

      {/* ── Footer: the live room in one line ── */}
      <Pressable onClick={() => navigate('pro.guests')} className="mx-5 mt-5 flex items-center gap-3 rounded-[var(--r-card)] bg-ink px-4 py-3.5 text-on-ink">
        <DoorOpen size={20} aria-hidden className="text-brass-light" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold">Tonight’s guest list</span>
          <span className="block text-[12px] font-semibold text-on-ink-2">
            {TONIGHT_TOTALS.expected} expected · {moneyShort(TONIGHT.spent, TONIGHT.currency)} committed · settled outside Edera
          </span>
        </span>
        <ChevronRight size={18} aria-hidden className="text-on-ink-2" />
      </Pressable>
    </MobileScreen>
  )
}
