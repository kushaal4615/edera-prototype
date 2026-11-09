import { motion } from 'framer-motion'
import { ChevronDown, Download, Eye, Plus, Sparkles, Star, Store } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Bar as RBar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar as BrandBar, Stars, StarRow, Strip, StripLegend, Verified } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { CHART, ProgressRing } from '../../components/Charts'
import { Input, Toggle } from '../../components/Form'
import { Rail } from '../../components/Media'
import { Drawer, Modal } from '../../components/Sheet'
import { CATEGORY_HEALTH } from '../../data/admin'
import { fmtShort, money, pct } from '../../data/clock'
import { DEMO_CATEGORY } from '../../data/demoFill'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { CATEGORIES, categoryById, reviewsFor, VENDORS, type CategoryId, type Region, type Vendor } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { ConsoleShell, Panel } from '../console/shell'

/* admin.marketplace: "Listings & categories". Category health (chart +
   compact table), a photo-tile bento of categories with an "Add category"
   tile, and the listings table carrying the availability strip. */

/* Local demo values: hours since each listing's calendar was last updated (deterministic from the id). */
const hoursSince = (id: string) => {
  let h = 7
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  const bands = [2, 5, 9, 14, 26, 41, 70, 120, 190, 260, 330]
  return bands[h % bands.length]
}
const freshLabel = (h: number) => (h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`)
const FRESH_LIMIT_H = 7 * 24

const PARENTS = ['Beauty & styling', 'Food & drink', 'Venues & spaces', 'Music & entertainment', 'Planning', 'Decor & photography'] as const
const ICONS = ['Sparkles', 'Scissors', 'Shirt', 'Gem', 'Camera', 'Music'] as const
const DEMO_NEW_CATEGORY = { name: DEMO_CATEGORY, parent: PARENTS[0], icon: ICONS[0] }

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onClick} aria-pressed={on} className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors ${on ? 'bg-ink text-on-ink' : 'text-text hover:bg-[var(--surface-high)]'}`} style={on ? undefined : { boxShadow: 'inset 0 0 0 1px var(--rule-strong)' }}>
      {children}
    </motion.button>
  )
}

export default function AdminMarketplace() {
  const { toast } = useNav()
  const added = useSession((s) => s.categoriesAdded)
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const [region, setRegion] = useState<Region | 'all'>('all')
  const [featured, setFeatured] = useState<string[]>(VENDORS.filter((v) => v.featured).map((v) => v.id))
  const [view, setView] = useState<Vendor | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const rows = useMemo(() => VENDORS.filter((v) => (cat === 'all' || v.category === cat) && (region === 'all' || v.region === region)), [cat, region])
  const fresh = VENDORS.filter((v) => hoursSince(v.id) <= FRESH_LIMIT_H).length
  const freshPct = pct(fresh, VENDORS.length)
  const health = [...CATEGORY_HEALTH].sort((a, b) => b.requests30d - a.requests30d)
  const totalListings = CATEGORIES.reduce((s, c) => s + c.count, 0)

  const toggleFeature = (id: string, on: boolean) => {
    setFeatured((f) => (on ? [...f, id] : f.filter((x) => x !== id)))
    track('admin_feature_listing', on)
    toast(on ? 'Featured · shown first in Explore for its category' : 'Removed from featured', on ? 'accent' : 'neutral')
  }

  return (
    <ConsoleShell
      active="admin.marketplace"
      title="Listings & categories"
      sub={`${totalListings.toLocaleString('en-GB')} listings in ${CATEGORIES.length + added.length} categories · ${VENDORS.length} shown in this demo`}
      actions={
        <>
          <Button size="sm" variant="outline" icon={Download} onClick={() => toast('Exported listings.csv with availability freshness', 'accent')}>
            Export listings
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>
            Add category
          </Button>
        </>
      }
    >
      <div className="px-8 pb-10 max-md:px-4">
        {/* ── Category health ── */}
        <Panel title="Category health" action={<span className="meta text-text-2">Requests in 30 days vs listings · fill = requests that found a vendor</span>}>
          <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6 max-md:grid-cols-1">
            <div className="h-[392px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={health} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 0 }} barCategoryGap={8}>
                  <CartesianGrid stroke={CHART.grid} horizontal={false} />
                  <XAxis type="number" tick={CHART.axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)} />
                  <YAxis type="category" dataKey="label" tick={{ ...CHART.axis, fontFamily: 'Manrope, sans-serif', fontWeight: 600, fill: '#123C35' }} axisLine={false} tickLine={false} width={108} />
                  <Tooltip {...CHART.tooltip} cursor={{ fill: 'rgb(18 60 53 / 0.05)' }} formatter={(v: number) => [v.toLocaleString('en-GB'), 'Requests · 30d']} />
                  <RBar dataKey="requests30d" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive>
                    {health.map((h) => (
                      <Cell key={h.category} fill={h.fill < 60 ? CHART.series.secondary : CHART.series.primary} />
                    ))}
                    <LabelList dataKey="requests30d" position="right" formatter={(v: number) => v.toLocaleString('en-GB')} style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#4F655F' }} />
                  </RBar>
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 flex items-center gap-4 text-[12px] font-semibold text-text-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.series.primary }} aria-hidden /> Requests · 30 days
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.series.secondary }} aria-hidden /> Fill under 60%: needs more vendors
                </span>
              </p>
            </div>
            <table className="w-full border-collapse self-start text-[13px]">
              <thead>
                <tr className="label text-text-2">
                  <th className="py-2 text-left font-extrabold">Category</th>
                  <th className="py-2 text-right font-extrabold">Vendors</th>
                  <th className="py-2 text-right font-extrabold">Requests</th>
                  <th className="py-2 pl-4 text-left font-extrabold">Fill</th>
                </tr>
              </thead>
              <tbody>
                {health.map((h) => (
                  <tr key={h.category} className="border-t border-[var(--rule)]">
                    <td className="py-1.5 font-semibold">
                      <button type="button" onClick={() => setCat(h.category)} className="flex h-8 items-center gap-2 text-left hover:text-accent-ink">
                        {h.label}
                        {h.fill < 60 && <Badge tone="warn">Gap</Badge>}
                      </button>
                    </td>
                    <td className="num py-1.5 text-right text-text-2">{h.vendors}</td>
                    <td className="num py-1.5 text-right font-bold">{h.requests30d}</td>
                    <td className="py-1.5 pl-4">
                      <span className="flex items-center gap-2">
                        <BrandBar value={h.fill} height={5} tone={h.fill < 60 ? 'brass' : 'accent'} className="w-[64px]" />
                        <span className="num w-8 text-[12px] font-semibold text-text-2">{h.fill}%</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ── Categories bento + freshness ── */}
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_280px] gap-6 max-md:grid-cols-1">
          <section>
            <div className="flex items-end justify-between pb-3">
              <div>
                <h2 className="grot text-[22px]">Categories</h2>
                <p className="text-[13px] text-text-2">The people you need in your industry, not just anyone. Tap a tile to filter the listings.</p>
              </div>
              <span className="meta text-text-2">{CATEGORIES.length + added.length} live</span>
            </div>
            <motion.div variants={listParent} initial="hidden" animate="show" className="grid grid-cols-6 gap-2.5 max-md:grid-cols-2">
              {CATEGORIES.map((c, i) => {
                const big = i === 0 || i === 1
                const on = cat === c.id
                return (
                  <motion.div key={c.id} variants={listItem} className={big ? 'col-span-2 row-span-2' : ''}>
                    <Pressable onClick={() => { setCat(on ? 'all' : c.id); track('admin_filter_category', c.id) }} aria-pressed={on} className={`relative overflow-hidden rounded-[var(--r-card)] bg-ink text-on-night ${big ? 'h-full min-h-[188px]' : 'h-[92px]'} ${on ? 'ring-2 ring-[var(--brass)] ring-offset-2 ring-offset-[var(--bg)]' : ''}`}>
                      <img src={img(c.photo, big ? 700 : 400)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      <span aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
                      <span className={`relative flex h-full flex-col justify-end ${big ? 'p-4' : 'p-2.5'}`}>
                        <span className={`grot block truncate text-on-night ${big ? 'text-[24px]' : 'text-[14px]'}`}>{c.plural}</span>
                        <span className={`num block text-on-night-2 ${big ? 'text-[13px]' : 'text-[11px]'} font-semibold`}>
                          {c.count} listings{big ? ` · ${CATEGORY_HEALTH.find((h) => h.category === c.id)?.requests30d ?? 0} requests · 30d` : ''}
                        </span>
                      </span>
                    </Pressable>
                  </motion.div>
                )
              })}
              {added.map((name) => (
                <motion.div key={name} variants={listItem} initial="hidden" animate="show">
                  <Pressable onClick={() => toast(`${name} is live · vendors can pick it when they list`, 'accent')} className="relative h-[92px] w-full overflow-hidden rounded-[var(--r-card)] bg-ink text-on-night">
                    <img src={img('bouquet', 400)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <span aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
                    <span className="absolute left-2 top-2">
                      <Badge tone="solid">New</Badge>
                    </span>
                    <span className="relative flex h-full flex-col justify-end p-2.5">
                      <span className="grot block truncate text-[14px] text-on-night">{name}</span>
                      <span className="num block text-[11px] font-semibold text-on-night-2">0 listings · just added</span>
                    </span>
                  </Pressable>
                </motion.div>
              ))}
              <motion.div variants={listItem}>
                <Pressable onClick={() => setAddOpen(true)} className="grid h-[92px] w-full place-items-center rounded-[var(--r-card)] border-2 border-dashed border-[var(--rule-strong)] text-center hover:bg-[var(--surface-high)]">
                  <span>
                    <Plus size={20} className="mx-auto text-accent-ink" aria-hidden />
                    <span className="mt-1 block text-[12.5px] font-bold">Add category</span>
                  </span>
                </Pressable>
              </motion.div>
            </motion.div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
              <span className="label text-on-ink-2">Availability freshness</span>
              <div className="mt-3 flex items-center gap-4">
                <ProgressRing value={freshPct} size={84} stroke={8} color="var(--free)">
                  <span className="figure num text-[22px] text-on-ink">{freshPct}%</span>
                </ProgressRing>
                <div className="min-w-0">
                  <span className="block text-[14px] font-bold leading-snug">
                    {fresh} of {VENDORS.length} listings updated their calendar in the last 7 days
                  </span>
                  <span className="mt-1 block text-[12px] text-on-ink-2">A stale calendar is the one thing that breaks “see when the day is free”.</span>
                </div>
              </div>
              <Button size="sm" variant="white" block className="mt-4" onClick={() => toast(`Nudge sent to ${VENDORS.length - fresh} vendors with a calendar older than 7 days`, 'accent')}>
                Nudge the {VENDORS.length - fresh} stale
              </Button>
            </div>
            <div className="rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
              <span className="label text-text-2">Strip legend</span>
              <StripLegend className="mt-2" />
              <p className="mt-2 text-[12px] leading-snug text-text-2">Every listing carries the next 14 days. Held means a request is waiting on the vendor.</p>
            </div>
          </section>
        </div>

        {/* ── Listings ── */}
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
            <div>
              <h2 className="grot text-[22px]">Listings</h2>
              <p className="text-[13px] text-text-2">
                {rows.length} of {VENDORS.length} · {featured.length} featured
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'uk', 'ng'] as const).map((r) => (
                <Chip key={r} on={region === r} onClick={() => setRegion(r)}>
                  {r === 'all' ? 'Both markets' : r === 'uk' ? 'UK · GBP' : 'NG · NGN'}
                </Chip>
              ))}
            </div>
          </div>
          <div className="-mx-8 flex gap-1.5 overflow-x-auto px-8 pb-3 [scrollbar-width:none] max-md:-mx-4 max-md:px-4">
            <Chip on={cat === 'all'} onClick={() => setCat('all')}>
              All categories
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
                {c.plural}
              </Chip>
            ))}
          </div>

          {/* table (desktop) */}
          <div className="overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)] max-md:hidden">
            <table className="w-full table-fixed border-collapse text-[13px]">
              <colgroup>
                <col style={{ width: 290 }} />
                <col style={{ width: 118 }} />
                <col style={{ width: 112 }} />
                <col style={{ width: 70 }} />
                <col style={{ width: 54 }} />
                <col style={{ width: 86 }} />
                <col />
                <col style={{ width: 78 }} />
                <col style={{ width: 84 }} />
              </colgroup>
              <thead>
                <tr className="label border-b border-[var(--rule)] text-left text-text-2">
                  <th className="py-2.5 pl-4">Listing</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">From</th>
                  <th className="py-2.5">Rating</th>
                  <th className="py-2.5 text-right">Years</th>
                  <th className="py-2.5 pl-3">Verified</th>
                  <th className="py-2.5 pl-3">Next 14 days</th>
                  <th className="py-2.5 text-center">Feature</th>
                  <th className="py-2.5 pr-4" />
                </tr>
              </thead>
              <motion.tbody key={`${cat}-${region}`} variants={listParent} initial="hidden" animate="show">
                {rows.map((v) => {
                  const o = personById(v.owner)
                  const h = hoursSince(v.id)
                  const isF = featured.includes(v.id)
                  return (
                    <motion.tr key={v.id} variants={listItem} className="border-b border-[var(--rule)] last:border-b-0 hover:bg-[var(--surface-raised)]">
                      <td className="py-2 pl-4">
                        <button type="button" onClick={() => setView(v)} className="flex min-h-[48px] w-full items-center gap-3 text-left">
                          <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-[8px] bg-[var(--surface-high)]">
                            <img src={img(v.photos[0], 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                            <Avatar who={o.photo} size={20} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[var(--surface)]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-bold">{v.name}</span>
                            <span className="block truncate text-[12px] text-text-2">
                              {o.name} · {v.area}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="py-2">
                        <span className="flex flex-col">
                          <span className="truncate font-semibold">{categoryById(v.category).label}</span>
                          <span className="meta text-text-2">{v.region.toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="num block truncate font-bold">{money(v.priceFrom, v.currency)}</span>
                        <span className="block text-[11.5px] text-text-2">{v.priceUnit}</span>
                      </td>
                      <td className="py-2">
                        <Stars rating={v.rating} count={v.reviews} size={12} />
                      </td>
                      <td className="num py-2 text-right">{v.years}</td>
                      <td className="py-2 pl-3">{v.verified ? <Verified size={14} /> : <Badge tone="warn">Pending</Badge>}</td>
                      <td className="py-2 pl-3 pr-2">
                        <Strip vendor={v} size="xs" />
                        <span className={`meta mt-1 block ${h > FRESH_LIMIT_H ? 'text-brass-ink' : 'text-text-2'}`}>calendar updated {freshLabel(h)}</span>
                      </td>
                      <td className="py-2">
                        <span className="flex justify-center">
                          <span className="scale-[0.8]">
                            <Toggle on={isF} onChange={(on) => toggleFeature(v.id, on)} label={`Feature ${v.name}`} />
                          </span>
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Button size="sm" variant="outline" icon={Eye} onClick={() => setView(v)} aria-label={`View ${v.name}`}>
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  )
                })}
              </motion.tbody>
            </table>
            {rows.length === 0 && <p className="px-5 py-10 text-center text-[13px] text-text-2">No listings in this category for this market yet.</p>}
          </div>

          {/* cards (phone) */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((v) => {
              const o = personById(v.owner)
              const h = hoursSince(v.id)
              return (
                <div key={v.id} className="rounded-[var(--r-card)] bg-[var(--surface)] p-3 shadow-[var(--shadow-raised)]">
                  <button type="button" onClick={() => setView(v)} className="flex w-full items-center gap-3 text-left">
                    <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[8px]">
                      <img src={img(v.photos[0], 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] font-bold">{v.name}</span>
                        {v.verified && <Verified size={13} label={false} />}
                      </span>
                      <span className="block truncate text-[12px] text-text-2">
                        {categoryById(v.category).label} · {o.name} · {v.region.toUpperCase()}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[12px]">
                        <span className="num font-bold">{money(v.priceFrom, v.currency)}</span>
                        <Stars rating={v.rating} count={v.reviews} size={11} />
                      </span>
                    </span>
                  </button>
                  <div className="mt-2.5 flex items-center gap-3">
                    <Strip vendor={v} size="xs" className="min-w-0 flex-1" />
                    <span className="meta shrink-0 text-text-2">{freshLabel(h)}</span>
                    <Toggle on={featured.includes(v.id)} onChange={(on) => toggleFeature(v.id, on)} label={`Feature ${v.name}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <ListingDrawer v={view} onClose={() => setView(null)} featured={view ? featured.includes(view.id) : false} onFeature={toggleFeature} />
      <AddCategoryModal open={addOpen} onClose={() => setAddOpen(false)} />
    </ConsoleShell>
  )
}

function ListingDrawer({ v, onClose, featured, onFeature }: { v: Vendor | null; onClose: () => void; featured: boolean; onFeature: (id: string, on: boolean) => void }) {
  const { toast } = useNav()
  const reviews = v ? reviewsFor(v.id).slice(0, 3) : []
  return (
    <Drawer open={!!v} onClose={onClose} title="Listing" width={480}>
      {v && (
        <div className="-mx-6">
          <Rail padLeft={24} gap={8}>
            {v.photos.map((ph, i) => (
              <img key={ph + i} src={img(ph, 500)} alt="" loading="lazy" className={`h-[150px] shrink-0 snap-start rounded-[var(--r-card)] object-cover ${i === 0 ? 'w-[240px]' : 'w-[150px]'}`} />
            ))}
          </Rail>
          <div className="px-6">
            <div className="mt-4 flex items-start gap-3">
              <Avatar who={personById(v.owner).photo} size={48} verified={v.verified} />
              <div className="min-w-0 flex-1">
                <h4 className="grot truncate text-[24px]">{v.name}</h4>
                <p className="truncate text-[13px] text-text-2">
                  {personById(v.owner).name} · {v.area} · {v.years} yrs in operation
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Stars rating={v.rating} count={v.reviews} />
                  {v.verified ? <Verified size={13} /> : <Badge tone="warn">Verification pending</Badge>}
                  <Badge tone="neutral">{v.bookings} bookings</Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-3">
              <div className="flex items-center justify-between">
                <span className="label text-text-2">Next 14 days</span>
                <span className="meta text-text-2">replies {v.responseTime}</span>
              </div>
              <Strip vendor={v} size="md" labels className="mt-2" />
            </div>

            <h5 className="label mt-5 text-text-2">Packages</h5>
            <ul className="mt-2 flex flex-col divide-y divide-[var(--rule)]">
              {v.packages.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[14px] font-bold">
                      {p.name}
                      {p.popular && <Badge tone="accent">Popular</Badge>}
                    </span>
                    <span className="block text-[12px] leading-snug text-text-2">{p.includes}</span>
                  </span>
                  <span className="num shrink-0 text-right">
                    <span className="block text-[15px] font-extrabold">{money(p.price, v.currency)}</span>
                    <span className="block text-[11px] text-text-2">{p.unit}</span>
                  </span>
                </li>
              ))}
            </ul>

            <h5 className="label mt-5 text-text-2">Recent reviews</h5>
            <ul className="mt-2 flex flex-col gap-2">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-[var(--r-control)] bg-[var(--surface-raised)] p-3">
                  <div className="flex items-center gap-2">
                    <Avatar who={personById(r.by).photo} size={24} />
                    <span className="text-[13px] font-bold">{personById(r.by).first}</span>
                    <StarRow rating={r.rating} />
                    <span className="meta ml-auto text-text-2">{fmtShort(r.date)}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-text-2">{r.text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between rounded-[var(--r-card)] bg-[var(--surface-raised)] p-3">
              <span className="flex items-center gap-2 text-[13px] font-bold">
                <Star size={15} fill="var(--brass)" strokeWidth={0} aria-hidden /> Featured in Explore
              </span>
              <Toggle on={featured} onChange={(on) => onFeature(v.id, on)} label={`Feature ${v.name}`} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" block icon={Store} onClick={() => toast(`Opening ${v.name} as a client would see it`, 'neutral')}>
                Open as client
              </Button>
              <Button variant="danger" onClick={() => toast(`${v.name} hidden from the marketplace until the owner is contacted`, 'warn')}>
                Hide
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}

function AddCategoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useNav()
  const [name, setName] = useState(DEMO_NEW_CATEGORY.name)
  const [parent, setParent] = useState<string>(DEMO_NEW_CATEGORY.parent)
  const [icon, setIcon] = useState<string>(DEMO_NEW_CATEGORY.icon)
  const [error, setError] = useState<string | undefined>()
  const add = () => {
    if (!name.trim()) return setError('Give the category a name vendors will recognise')
    setError(undefined)
    session.addCategory(name.trim())
    track('admin_add_category', name.trim())
    onClose()
    toast(`${name.trim()} added under ${parent} · vendors can list in it now`, 'accent')
  }
  return (
    <Modal open={open} onClose={onClose} title="Add a category">
      <p className="text-[14px] text-text-2">New categories appear in Explore and in the vendor listing form straight away. Keep them to the event industry.</p>
      <div className="mt-4 flex flex-col gap-4">
        <Input label="Category name" value={name} onChange={(e) => setName(e.target.value)} error={error} leading={<Sparkles size={16} />} />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-bold">
            Parent group
            <span className="relative">
              <select value={parent} onChange={(e) => setParent(e.target.value)} className="well h-12 w-full appearance-none rounded-[var(--r-control)] px-3.5 pr-9 text-[15px] font-semibold outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                {PARENTS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold">
            Icon
            <span className="relative">
              <select value={icon} onChange={(e) => setIcon(e.target.value)} className="well h-12 w-full appearance-none rounded-[var(--r-control)] px-3.5 pr-9 text-[15px] font-semibold outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                {ICONS.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
            </span>
          </label>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button icon={Plus} onClick={add}>
          Add category
        </Button>
      </div>
    </Modal>
  )
}
