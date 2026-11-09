import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, BadgeCheck, BellRing, ChevronRight, MessageSquareWarning, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar as BrandBar, Figure } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { CHART } from '../../components/Charts'
import { HeroImage, Rail } from '../../components/Media'
import { AUTO_NOTIFICATIONS, CITIES, FLAGGED, KPI, SIGNUPS, VERIFY_QUEUE } from '../../data/admin'
import { CLOCK, pct, relDay } from '../../data/clock'
import { img } from '../../data/media'
import { OWNER, personById } from '../../data/people'
import { categoryById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { ConsoleShell, openFlags, Panel, pendingCases } from '../console/shell'

/* admin.overview: a photographic header band with four oversized figures,
   then an asymmetric chart-led layout (who is joining · the queue),
   a UK · Nigeria split, the live feed and a city photo rail. */

const HEADLINE: { label: string; value: string; delta: string; up: boolean }[] = [
  { label: 'Users', value: KPI.users.toLocaleString('en-GB'), delta: '+18.4% vs last month', up: true },
  { label: 'Events planned', value: KPI.eventsPlanned.toLocaleString('en-GB'), delta: `+${KPI.eventsThisMonth} this month`, up: true },
  { label: 'Requests · 30d', value: KPI.requests30d.toLocaleString('en-GB'), delta: '+9.2% vs previous 30d', up: true },
  { label: 'Accept rate', value: `${KPI.acceptRate}%`, delta: `+3 pts · median reply ${KPI.medianReply}`, up: true },
]

const ROLE_ROWS = [
  { key: 'clients', label: 'Clients', n: KPI.clients, note: 'People planning an event', color: CHART.series.clients },
  { key: 'planners', label: 'Planners', n: KPI.planners, note: 'Do most of the work on the chain', color: CHART.series.planners },
  { key: 'vendors', label: 'Vendors', n: KPI.vendors, note: 'Caterers, DJs, photographers · venues included', color: CHART.series.vendors },
] as const

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`)

export default function AdminOverview() {
  const { navigate, toast } = useNav()
  const pending = useSession(pendingCases)
  const flags = useSession(openFlags)
  const decisions = useSession((s) => s.verifyDecisions)
  const queue = VERIFY_QUEUE.filter((v) => (v.state === 'pending' || v.state === 'info') && !decisions[v.id]).slice(0, 4)
  const live = [...AUTO_NOTIFICATIONS].filter((a) => a.on).sort((a, b) => b.sent24h - a.sent24h).slice(0, 5)
  const liveTotal = live.reduce((s, a) => s + a.sent24h, 0)
  const openCase = (id: string) => {
    session.viewCase(id)
    track('admin_open_case', id)
    navigate('admin.verification')
  }

  return (
    <ConsoleShell active="admin.overview" title="Overview" bleed>
      {/* ── Header band ── */}
      <HeroImage src="weddingConfetti" alt="" scrim="full" width={1600} position="center 35%" className="min-h-[300px] text-on-night max-md:min-h-[360px]">
        <div aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
        <div aria-hidden className="grain" />
        <motion.div variants={listParent} initial="hidden" animate="show" className="relative flex h-full flex-col justify-between px-8 pb-7 pt-6 max-md:px-4 max-md:pb-5">
          <motion.div variants={listItem} className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="meta text-on-night-2">
                Saturday 21 Nov · {CLOCK.time} London · {CLOCK.lagosTime} Lagos
              </p>
              <h1 className="grot mt-2 text-[40px] leading-[0.95] text-on-night max-md:text-[30px]">
                Good evening, {OWNER.first}. <em>{pending} cases</em> are waiting.
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="white" icon={BadgeCheck} onClick={() => navigate('admin.verification')}>
                Work the queue
              </Button>
              <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => navigate('admin.reports')} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold ring-1 ring-inset ring-[rgb(255_255_255/0.4)] hover:bg-[rgb(255_255_255/0.12)]" style={{ color: 'var(--on-night)' }}>
                Reports <ArrowUpRight size={14} aria-hidden />
              </motion.button>
            </div>
          </motion.div>

          <div className="mt-8 grid grid-cols-4 gap-6 max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-5">
            {HEADLINE.map((h) => (
              <motion.div key={h.label} variants={listItem} className="min-w-0 border-l border-[rgb(255_255_255/0.22)] pl-4">
                <span className="label text-on-night-2">{h.label}</span>
                <span className="figure num mt-1 block text-[56px] text-on-night max-md:text-[40px]">{h.value}</span>
                <span className="mt-1.5 flex items-center gap-1 truncate text-[12.5px] font-semibold text-on-night-2">
                  {h.up && <TrendingUp size={13} className="shrink-0 text-brass-light" aria-hidden />}
                  {h.delta}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </HeroImage>

      {/* ── Who is joining · the queue ── */}
      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] gap-6 px-8 pt-6 max-md:grid-cols-1 max-md:px-4">
        <Panel
          title="Who is joining"
          action={
            <span className="meta text-text-2">
              Sign-ups by role · 12 months · {SIGNUPS.reduce((s, m) => s + m.clients + m.planners + m.vendors, 0).toLocaleString('en-GB')} total
            </span>
          }
        >
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SIGNUPS} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="m" tick={CHART.axis} axisLine={false} tickLine={false} tickMargin={8} />
                <YAxis tick={CHART.axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)} width={48} />
                <Tooltip {...CHART.tooltip} formatter={(v: number, name: string) => [v.toLocaleString('en-GB'), name[0].toUpperCase() + name.slice(1)]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 6 }} formatter={(v: string) => <span style={{ color: '#4F655F' }}>{v[0].toUpperCase() + v.slice(1)}</span>} />
                <Area type="monotone" dataKey="clients" stackId="1" stroke="#FFFDF9" strokeWidth={2} fill={CHART.series.clients} fillOpacity={0.92} isAnimationActive />
                <Area type="monotone" dataKey="vendors" stackId="1" stroke="#FFFDF9" strokeWidth={2} fill={CHART.series.vendors} fillOpacity={0.92} />
                <Area type="monotone" dataKey="planners" stackId="1" stroke="#FFFDF9" strokeWidth={2} fill={CHART.series.planners} fillOpacity={0.92} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-3 w-full border-collapse text-[13px]">
            <thead>
              <tr className="label text-text-2">
                <th className="py-2 text-left font-extrabold">Role</th>
                <th className="py-2 text-right font-extrabold">Total</th>
                <th className="py-2 pl-6 text-left font-extrabold max-md:hidden">Share</th>
                <th className="py-2 text-right font-extrabold">Nov</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_ROWS.map((r) => (
                <tr key={r.key} className="border-t border-[var(--rule)]">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
                      <span>
                        <span className="block font-bold">{r.label}</span>
                        <span className="block text-[12px] text-text-2">{r.note}</span>
                      </span>
                    </span>
                  </td>
                  <td className="num py-2.5 text-right font-bold">{r.n.toLocaleString('en-GB')}</td>
                  <td className="py-2.5 pl-6 max-md:hidden">
                    <span className="flex items-center gap-2">
                      <BrandBar value={pct(r.n, KPI.users)} height={6} tone="ink" className="w-[120px]" />
                      <span className="num text-[12px] font-semibold text-text-2">{pct(r.n, KPI.users)}%</span>
                    </span>
                  </td>
                  <td className="num py-2.5 text-right font-semibold text-text-2">+{SIGNUPS[11][r.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Verification queue"
          action={
            <Badge tone="warn" icon={<BadgeCheck size={12} aria-hidden />}>
              {pending} waiting
            </Badge>
          }
        >
          <motion.ul variants={listParent} initial="hidden" animate="show" className="-mx-2 flex flex-col">
            {queue.map((c) => {
              const p = personById(c.person)
              return (
                <motion.li key={c.id} variants={listItem}>
                  <Pressable onClick={() => openCase(c.id)} className="flex min-h-[64px] items-center gap-3 rounded-[var(--r-control)] px-2 py-2 hover:bg-[var(--surface-high)]">
                    <Avatar who={p.photo} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-bold">{c.business}</span>
                        {c.state === 'info' && <Badge tone="info">Info asked</Badge>}
                      </span>
                      <span className="block truncate text-[12px] text-text-2">
                        {c.role} · {categoryById(c.category).label} · {c.city} · {relDay(c.submitted)}
                      </span>
                    </span>
                    <span className="meta shrink-0 text-text-2">{c.region.toUpperCase()}</span>
                    <ChevronRight size={16} className="shrink-0 text-text-3" aria-hidden />
                  </Pressable>
                </motion.li>
              )
            })}
            {queue.length === 0 && <li className="px-2 py-6 text-center text-[13px] text-text-2">Queue cleared. New cases arrive as vendors upload documents.</li>}
          </motion.ul>
          <Button variant="ink" block className="mt-3" trailing={ArrowRight} onClick={() => navigate('admin.verification')}>
            Open the queue · {pending}
          </Button>
          <p className="mt-3 text-[12px] leading-relaxed text-text-2">Approved cases get the Verified Professional badge on every listing. On Edera the people you find are the people you need in your industry.</p>
        </Panel>
      </div>

      {/* ── UK · Nigeria split ── */}
      <section className="mx-8 mt-6 overflow-hidden rounded-[var(--r-container)] bg-ink text-on-ink max-md:mx-4">
        <div className="grid grid-cols-[1fr_auto_1fr] max-md:grid-cols-1">
          <RegionHalf name="United Kingdom" code="UK" k={KPI.uk} other={KPI.ng} tone="uk" cities="London · Manchester · Birmingham" />
          <div className="relative flex items-center justify-center px-2 max-md:hidden">
            <span aria-hidden className="absolute inset-y-6 w-px bg-[rgb(255_255_255/0.14)]" />
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-brass text-[12px] font-extrabold text-on-brass">vs</span>
          </div>
          <RegionHalf name="Nigeria" code="NG" k={KPI.ng} other={KPI.uk} tone="ng" cities="Lagos · Abuja · Port Harcourt" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(255_255_255/0.12)] px-7 py-3 max-md:px-5">
          <p className="text-[12.5px] font-semibold text-on-ink-2">Two markets first. He is from Nigeria and based in the UK: the problem is worst in Nigeria and similar in the UK. India and others later.</p>
          <button type="button" onClick={() => navigate('admin.reports')} className="flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-bold text-brass-light hover:bg-[rgb(255_255_255/0.08)]">
            Country reports <ArrowUpRight size={15} aria-hidden />
          </button>
        </div>
      </section>

      {/* ── Live feed + flagged ── */}
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6 px-8 pt-6 max-md:grid-cols-1 max-md:px-4">
        <Panel
          title="Live right now"
          action={
            <span className="flex items-center gap-2 text-[12px] font-bold text-text-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-free opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-free" />
              </span>
              {liveTotal.toLocaleString('en-GB')} notifications in 24h
            </span>
          }
        >
          <div className="-mx-5 flex overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {live.map((a, i) => (
              <Pressable key={a.id} onClick={() => navigate('admin.notifications')} className={`min-w-[172px] flex-1 border-l px-4 py-2 first:border-l-0 first:pl-0 hover:bg-[var(--surface-high)] ${i === 0 ? 'border-transparent' : 'border-[var(--rule)]'}`}>
                <span className="label block truncate text-text-2">{a.to}</span>
                <span className="figure num mt-1 block text-[34px]">{compact(a.sent24h)}</span>
                <span className="mt-1 block text-[12.5px] font-semibold leading-snug">{a.trigger}</span>
                <span className="meta mt-1 block text-text-3">{a.channel}</span>
              </Pressable>
            ))}
          </div>
          <button type="button" onClick={() => navigate('admin.notifications')} className="mt-2 flex h-9 items-center gap-1.5 text-[13px] font-bold text-accent-ink">
            <BellRing size={14} aria-hidden /> All triggers and broadcasts
          </button>
        </Panel>

        <Pressable onClick={() => navigate('admin.reviews')} className="relative overflow-hidden rounded-[var(--r-card)] bg-danger-soft p-5 text-[var(--on-danger-soft)] shadow-[var(--shadow-raised)]">
          <span className="flex items-center justify-between">
            <span className="label">Flagged reviews</span>
            <MessageSquareWarning size={18} aria-hidden />
          </span>
          <Figure value={flags} unit="open" size={64} className="mt-3 block" />
          <span className="mt-3 block text-[13px] font-semibold leading-snug">
            {FLAGGED.filter((f) => f.state === 'open').map((f) => f.about).join(' · ')}
          </span>
          <span className="mt-4 flex items-center gap-1 text-[13px] font-bold">
            Review them <ArrowRight size={14} aria-hidden />
          </span>
        </Pressable>
      </div>

      {/* ── Cities ── */}
      <section className="pb-10 pt-7">
        <div className="flex items-end justify-between px-8 pb-3 max-md:px-4">
          <div>
            <h2 className="grot text-[22px]">Active cities</h2>
            <p className="text-[13px] text-text-2">Users and events by city · tap a city for its report</p>
          </div>
          <button type="button" onClick={() => navigate('admin.reports')} className="flex h-9 items-center gap-1 text-[13px] font-bold text-accent-ink">
            All reports <ArrowRight size={14} aria-hidden />
          </button>
        </div>
        <Rail padLeft={32} gap={12} className="max-md:[padding-left:16px] max-md:[padding-right:16px]">
          {CITIES.map((c) => (
            <Pressable key={c.city} onClick={() => { track('admin_city', c.city); navigate('admin.reports') }} className="relative h-[170px] w-[232px] shrink-0 snap-start overflow-hidden rounded-[var(--r-card)] bg-ink text-on-night">
              <img src={img(c.photo, 600)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <span aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
              <span className="relative flex h-full flex-col justify-end p-4">
                <span className="flex items-center justify-between">
                  <span className="grot text-[22px] text-on-night">{c.city}</span>
                  <span className="meta rounded-full bg-[rgb(255_255_255/0.18)] px-2 py-0.5 text-on-night">{c.region.toUpperCase()}</span>
                </span>
                <span className="mt-1 flex items-baseline gap-3 text-[12.5px] font-semibold text-on-night-2">
                  <span>
                    <span className="num text-[15px] font-bold text-on-night">{c.users.toLocaleString('en-GB')}</span> users
                  </span>
                  <span>
                    <span className="num text-[15px] font-bold text-on-night">{c.events}</span> events
                  </span>
                </span>
              </span>
            </Pressable>
          ))}
          <Pressable onClick={() => toast('Next cities on the list: Abuja is live, Birmingham growing. India considered for a later phase.', 'info')} className="grid h-[170px] w-[160px] shrink-0 snap-start place-items-center rounded-[var(--r-card)] bg-[var(--surface-high)] text-center">
            <span className="px-4">
              <span className="grot block text-[20px]">Next?</span>
              <span className="mt-1 block text-[12px] font-semibold text-text-2">A global problem: more countries later</span>
            </span>
          </Pressable>
        </Rail>
      </section>
    </ConsoleShell>
  )
}

function RegionHalf({ name, code, k, other, tone, cities }: { name: string; code: string; k: { users: number; vendors: number; events: number }; other: { users: number; vendors: number; events: number }; tone: 'uk' | 'ng'; cities: string }) {
  const fill = tone === 'uk' ? 'var(--accent)' : 'var(--brass)'
  const rows: { label: string; a: number; b: number }[] = [
    { label: 'Vendors & venues', a: k.vendors, b: other.vendors },
    { label: 'Events planned', a: k.events, b: other.events },
  ]
  return (
    <div className="px-7 pb-6 pt-6 max-md:px-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="label text-on-ink-2">{code} · {name}</span>
          <Figure value={k.users.toLocaleString('en-GB')} unit="users" size={48} className="mt-1 block text-on-ink" />
          <span className="meta mt-1 block text-on-ink-2">{cities}</span>
        </div>
        <span className="num rounded-full bg-[rgb(255_255_255/0.1)] px-3 py-1 text-[13px] font-bold text-on-ink">{pct(k.users, KPI.users)}% of users</span>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-center justify-between text-[12.5px] font-semibold">
              <span className="text-on-ink-2">{r.label}</span>
              <span className="num text-on-ink">
                {r.a.toLocaleString('en-GB')} <span className="text-on-ink-2">· {pct(r.a, r.a + r.b)}%</span>
              </span>
            </div>
            <span className="relative block h-2 w-full overflow-hidden rounded-full bg-[rgb(255_255_255/0.12)]" role="progressbar" aria-valuenow={pct(r.a, r.a + r.b)} aria-valuemin={0} aria-valuemax={100} aria-label={`${name} share of ${r.label}`}>
              <motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ background: fill }} initial={{ width: 0 }} animate={{ width: `${pct(r.a, r.a + r.b)}%` }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
