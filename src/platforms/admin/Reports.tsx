import { motion } from 'framer-motion'
import { Download, Globe2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Bar as RBar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../components/Badge'
import { Bar, Figure } from '../../components/Brand'
import { Button } from '../../components/Button'
import { CHART } from '../../components/Charts'
import { Segmented } from '../../components/Tabs'
import { CATEGORY_HEALTH, CITIES, EVENT_MIX, KPI, REQUEST_WEEKS, SIGNUPS } from '../../data/admin'
import { CLOCK, pct } from '../../data/clock'
import { img } from '../../data/media'
import { useNav } from '../../lib/navigation'
import { tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { ConsoleShell, Panel } from '../console/shell'

/* admin.reports: chart-led. UK against Nigeria month by month, what people
   are celebrating, where supply is thin, requests against acceptances,
   the cities, and the markets that could come next. */

type Range = '30d' | '90d' | '12m'

/** Events per month by market, 12 months (demo values that sum to KPI.uk.events / KPI.ng.events). */
const UK_EVENTS = [28, 34, 41, 47, 52, 58, 66, 74, 88, 96, 101, 105]
const NG_EVENTS = [0, 0, 6, 14, 22, 31, 42, 55, 78, 96, 112, 128]
const EVENTS_BY_MONTH = SIGNUPS.map((s, i) => ({ m: s.m, uk: UK_EVENTS[i], ng: NG_EVENTS[i] }))

const RANGE_META: Record<Range, { label: string; reply: string; accept: number; rating: number; verified: number; events: number }> = {
  '30d': { label: '22 Oct – 21 Nov 2026', reply: '1h 48m', accept: 71, rating: 4.8, verified: 1088, events: 212 },
  '90d': { label: '23 Aug – 21 Nov 2026', reply: '2h 05m', accept: 68, rating: 4.8, verified: 1088, events: 561 },
  '12m': { label: 'Dec 2025 – Nov 2026', reply: '2h 40m', accept: 64, rating: 4.7, verified: 1088, events: 1374 },
}

const TARGET_FILL = 70
/** Short x-axis labels for the fill-rate chart; the tooltip carries the full name. */
const SHORT: Record<string, string> = { catering: 'Cater', venue: 'Venue', dj: 'DJ', photo: 'Photo', decor: 'Decor', planner: 'Plan', cake: 'Cake', glam: 'Glam', mc: 'MC', bar: 'Bar', band: 'Band' }

const MARKETS: { id: string; name: string; cities: string; readiness: 'Ready to test' | 'Watching' | 'Diaspora first'; note: string; waitlist: number }[] = [
  { id: 'gh', name: 'Ghana', cities: 'Accra · Kumasi', readiness: 'Ready to test', note: 'Same event culture, English-speaking, 41 vendors already asked to list.', waitlist: 318 },
  { id: 'ke', name: 'Kenya', cities: 'Nairobi · Mombasa', readiness: 'Watching', note: 'Strong M-Pesa habits; payments phase would need a local rail.', waitlist: 142 },
  { id: 'in', name: 'India', cities: 'Mumbai · Delhi · Bengaluru', readiness: 'Watching', note: 'Weddings at scale; Hindi, Tamil and Punjabi templates needed before launch.', waitlist: 506 },
  { id: 'us', name: 'USA · diaspora', cities: 'Houston · Atlanta · New York', readiness: 'Diaspora first', note: 'Nigerian and Ghanaian communities planning owambes with UK-based planners.', waitlist: 227 },
]

const READINESS_TONE: Record<(typeof MARKETS)[number]['readiness'], string> = { 'Ready to test': 'bg-brass text-on-brass', Watching: 'bg-[rgb(255_255_255/0.14)] text-on-ink', 'Diaspora first': 'bg-accent text-on-accent' }

export default function AdminReports() {
  const { toast, navigate } = useNav()
  const [range, setRange] = useState<Range>('30d')
  const [watch, setWatch] = useState<string[]>(['gh'])
  const meta = RANGE_META[range]
  const totalEvents = CITIES.reduce((s, c) => s + c.events, 0)
  const mixSorted = [...EVENT_MIX].sort((a, b) => b.n - a.n)

  return (
    <ConsoleShell
      active="admin.reports"
      title="Reports"
      sub={`${meta.label} · UK + Nigeria · all figures are demo values`}
      actions={
        <>
          <Segmented<Range> size="sm" items={[{ id: '30d', label: '30d' }, { id: '90d', label: '90d' }, { id: '12m', label: '12m' }]} value={range} onChange={setRange} />
          <Button size="sm" icon={Download} onClick={() => toast(`Exporting the ${range} report · PDF + CSV · ${CLOCK.date}`, 'accent')}>
            Export
          </Button>
        </>
      }
    >
      {/* ── KPI strip ── */}
      <div className="mx-8 grid grid-cols-4 divide-x divide-[var(--rule)] rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)] max-md:mx-4 max-md:grid-cols-2 max-md:divide-x-0 max-md:divide-y">
        {[
          { label: 'Median first reply', value: meta.reply, sub: 'vendor to a booking request' },
          { label: 'Accept rate', value: `${meta.accept}%`, sub: `${meta.events.toLocaleString('en-GB')} events in range` },
          { label: 'Average rating', value: meta.rating.toFixed(1), sub: `${KPI.reviews30d.toLocaleString('en-GB')} reviews · 30d` },
          { label: 'Verified professionals', value: `${meta.verified.toLocaleString('en-GB')}`, sub: `of ${(KPI.planners + KPI.vendors).toLocaleString('en-GB')} planners, vendors and venues`, bar: pct(meta.verified, KPI.planners + KPI.vendors) },
        ].map((k) => (
          <div key={k.label} className="flex flex-col gap-1.5 px-5 py-4 max-md:px-4">
            <span className="label text-text-2">{k.label}</span>
            <motion.span key={k.value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Figure value={k.value} size={34} />
            </motion.span>
            <span className="text-[12px] font-semibold text-text-2">{k.sub}</span>
            {k.bar !== undefined && <Bar value={k.bar} height={5} className="mt-1" />}
          </div>
        ))}
      </div>

      {/* ── 2×2 asymmetric chart grid ── */}
      <div className="grid grid-cols-12 gap-6 px-8 pt-6 max-md:grid-cols-1 max-md:px-4">
        <Panel className="col-span-8 min-w-0 max-md:col-span-1" title="Events per month · UK vs Nigeria" action={<span className="meta text-text-2">12 months · Lagos launched in Feb</span>}>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EVENTS_BY_MONTH} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="m" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis tick={CHART.axis} axisLine={false} tickLine={false} width={44} />
                <Tooltip {...CHART.tooltip} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 6 }} formatter={(v: string) => <span style={{ color: '#123C35' }}>{v}</span>} />
                <Line type="monotone" dataKey="uk" name="United Kingdom" stroke={CHART.series.uk} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }} isAnimationActive={false}>
                  <LabelList dataKey="uk" position="top" content={(p) => (p.index === 11 ? <text x={Number(p.x)} y={Number(p.y) - 10} textAnchor="end" fontSize={11} fontWeight={700} fill="#123C35">{`UK ${p.value}`}</text> : null)} />
                </Line>
                <Line type="monotone" dataKey="ng" name="Nigeria" stroke={CHART.series.ng} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }} isAnimationActive={false}>
                  <LabelList dataKey="ng" position="top" content={(p) => (p.index === 11 ? <text x={Number(p.x)} y={Number(p.y) - 10} textAnchor="end" fontSize={11} fontWeight={700} fill="#123C35">{`NG ${p.value}`}</text> : null)} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="meta mt-1 text-text-2">Nigeria passed the UK in November: {NG_EVENTS[11]} against {UK_EVENTS[11]} events.</p>
        </Panel>

        <Panel className="col-span-4 min-w-0 max-md:col-span-1" title="What people celebrate" action={<span className="meta text-text-2">90 days</span>}>
          <div className="h-[262px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mixSorted} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={6}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="type" tick={{ ...CHART.axis, fontFamily: 'Manrope, sans-serif', fontWeight: 600, fill: '#123C35' }} axisLine={false} tickLine={false} width={128} />
                <Tooltip {...CHART.tooltip} cursor={{ fill: 'rgb(18 60 53 / 0.06)' }} />
                <RBar dataKey="n" name="Events" fill={CHART.series.primary} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="n" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#4F655F', fontFamily: 'DM Mono, monospace' }} />
                </RBar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="col-span-5 min-w-0 max-md:col-span-1" title="Category fill rate" action={<span className="meta text-text-2">requests answered with a confirmed booking</span>}>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_HEALTH} margin={{ top: 8, right: 64, left: -6, bottom: 0 }} barCategoryGap={5}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="category" tick={{ ...CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-40} textAnchor="end" height={40} tickFormatter={(v: string) => SHORT[v] ?? v} />
                <YAxis domain={[0, 100]} tick={CHART.axis} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip {...CHART.tooltip} cursor={{ fill: 'rgb(18 60 53 / 0.06)' }} formatter={(v) => [`${v}% filled`, 'Fill rate']} labelFormatter={(l: string) => CATEGORY_HEALTH.find((c) => c.category === l)?.label ?? l} />
                <ReferenceLine y={TARGET_FILL} stroke={CHART.series.ink} strokeWidth={1.5} label={{ value: `Target ${TARGET_FILL}%`, position: 'right', fontSize: 11, fontWeight: 700, fill: '#123C35' }} />
                <RBar dataKey="fill" name="Fill rate" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {CATEGORY_HEALTH.map((c) => (
                    <Cell key={c.category} fill={c.fill >= TARGET_FILL ? CHART.series.primary : CHART.series.held} />
                  ))}
                </RBar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] font-semibold">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.series.primary }} /> At or above target</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.series.held }} /> Below target · recruit vendors</span>
            <button type="button" onClick={() => navigate('admin.marketplace')} className="ml-auto font-bold text-accent-ink">
              {CATEGORY_HEALTH.filter((c) => c.fill < TARGET_FILL).length} categories need supply →
            </button>
          </div>
        </Panel>

        <Panel className="col-span-7 min-w-0 max-md:col-span-1" title="Requests vs accepted" action={<span className="meta text-text-2">14 weeks</span>}>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REQUEST_WEEKS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2} barCategoryGap={8}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="w" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis tick={CHART.axis} axisLine={false} tickLine={false} width={44} />
                <Tooltip {...CHART.tooltip} cursor={{ fill: 'rgb(18 60 53 / 0.06)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 6 }} formatter={(v: string) => <span style={{ color: '#123C35' }}>{v}</span>} />
                <RBar dataKey="requests" name="Requests" fill={CHART.series.ink} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <RBar dataKey="accepted" name="Accepted" fill={CHART.series.secondary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── Cities · where next ── */}
      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6 px-8 pb-12 pt-6 max-md:grid-cols-1 max-md:px-4">
        <Panel title="Cities" pad={false} className="min-w-0 overflow-hidden" action={<span className="meta text-text-2">{CITIES.length} live · share of events</span>}>
          <table className="mt-1 w-full border-collapse text-[13px] max-md:hidden">
            <thead>
              <tr className="label text-text-2">
                <th className="px-5 pb-2 text-left font-extrabold">City</th>
                <th className="pb-2 text-right font-extrabold">Users</th>
                <th className="pb-2 text-right font-extrabold">Vendors</th>
                <th className="pb-2 text-right font-extrabold">Events</th>
                <th className="px-5 pb-2 text-left font-extrabold">Share</th>
              </tr>
            </thead>
            <motion.tbody variants={listParent} initial="hidden" animate="show">
              {CITIES.map((c) => (
                <motion.tr key={c.city} variants={listItem} className="border-t border-[var(--rule)]">
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-3">
                      <img src={img(c.photo, 120)} alt="" className="h-10 w-14 rounded-[8px] object-cover" loading="lazy" />
                      <span>
                        <span className="block font-bold">{c.city}</span>
                        <Badge tone={c.region === 'uk' ? 'accent' : 'warn'}>{c.region === 'uk' ? 'United Kingdom' : 'Nigeria'}</Badge>
                      </span>
                    </span>
                  </td>
                  <td className="num py-2.5 pr-3 text-right font-semibold">{c.users.toLocaleString('en-GB')}</td>
                  <td className="num py-2.5 pr-3 text-right font-semibold">{c.vendors.toLocaleString('en-GB')}</td>
                  <td className="num py-2.5 pr-3 text-right font-semibold">{c.events.toLocaleString('en-GB')}</td>
                  <td className="w-[180px] px-5 py-2.5">
                    <span className="num mb-1 block text-[12px] font-bold">{pct(c.events, totalEvents)}%</span>
                    <Bar value={pct(c.events, totalEvents)} height={5} tone={c.region === 'uk' ? 'accent' : 'brass'} />
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          <ul className="mt-1 md:hidden">
            {CITIES.map((c) => (
              <li key={c.city} className="flex items-center gap-3 border-t border-[var(--rule)] px-4 py-3">
                <img src={img(c.photo, 120)} alt="" className="h-11 w-14 rounded-[8px] object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold">{c.city}</span>
                  <span className="block text-[12px] font-semibold text-text-2">
                    {c.users.toLocaleString('en-GB')} users · {c.vendors} vendors · {c.events} events
                  </span>
                  <span className="mt-1.5 block">
                    <Bar value={pct(c.events, totalEvents)} height={4} tone={c.region === 'uk' ? 'accent' : 'brass'} />
                  </span>
                </span>
                <span className="num text-[13px] font-extrabold">{pct(c.events, totalEvents)}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        <section className="relative overflow-hidden rounded-[var(--r-container)] bg-ink p-6 text-on-ink">
          <span aria-hidden className="arc" style={{ width: '64%', right: '-20%', bottom: '-30%' }} />
          <span aria-hidden className="grain" />
          <div className="relative">
            <p className="label inline-flex items-center gap-1.5 text-on-ink-2">
              <Globe2 size={13} aria-hidden /> Where next
            </p>
            <h2 className="grot mt-1 text-[26px]">
              A global problem, <em className="text-brass-light">two markets at a time</em>
            </h2>
            <p className="mt-2 text-[13px] font-medium text-on-ink-2">UK and Nigeria first. Birthdays, weddings and naming ceremonies happen everywhere; these are the markets asking.</p>
            <ul className="mt-5 flex flex-col divide-y divide-[rgb(255_255_255/0.12)]">
              {MARKETS.map((m) => {
                const on = watch.includes(m.id)
                return (
                  <li key={m.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold">{m.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${READINESS_TONE[m.readiness]}`}>{m.readiness}</span>
                      </div>
                      <p className="meta mt-0.5 text-on-ink-2">{m.cities} · {m.waitlist} on the waitlist</p>
                      <p className="mt-1 text-[12px] font-medium leading-snug text-on-ink-2">{m.note}</p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={tap}
                      onClick={() => {
                        if (on) {
                          setWatch((w) => w.filter((x) => x !== m.id))
                          toast(`${m.name} removed from the watchlist`, 'neutral')
                        } else {
                          setWatch((w) => [...w, m.id])
                          toast(`${m.name} added to the watchlist · weekly signals in this report`, 'accent')
                        }
                      }}
                      className={`inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-[12px] font-bold ${on ? 'bg-brass text-on-brass' : 'bg-[rgb(255_255_255/0.12)] text-on-ink'}`}
                    >
                      {on ? 'On watchlist' : <><Plus size={13} strokeWidth={2.8} aria-hidden /> Add to watchlist</>}
                    </motion.button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </div>
    </ConsoleShell>
  )
}
