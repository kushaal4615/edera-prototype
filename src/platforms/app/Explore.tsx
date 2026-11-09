import { motion } from 'framer-motion'
import { Check, Heart, MessageCircle, Search, SlidersHorizontal, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { Stars, Strip, StripLegend, Verified } from '../../components/Brand'
import { IconButton, Pressable } from '../../components/Button'
import { HeroImage, Rail } from '../../components/Media'
import { Segmented } from '../../components/Tabs'
import { money } from '../../data/clock'
import { DEMO_SEARCH } from '../../data/demoFill'
import { RUBY } from '../../data/events'
import { img } from '../../data/media'
import { CATEGORIES, categoryById, vendorsIn, type CategoryId, type Region, type Vendor } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { spring, tap, tapSoft } from '../../motion/springs'
import { MobileScreen, SectionHead, TopBar } from '../mobileShell'

/* app.explore: the marketplace. Dave: "They search Instagram or Google for
   a baker, a caterer, a planner; there is no one place to focus on." Every
   row carries the availability strip, the years in operation, the rating
   and the Verified check, so a client can decide without messaging. */

const haystack = (v: Vendor) => `${v.name} ${v.area} ${v.about} ${v.tags.join(' ')} ${categoryById(v.category).label} ${categoryById(v.category).plural}`.toLowerCase()
const score = (v: Vendor, q: string) => {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return 0
  const h = haystack(v)
  return tokens.filter((t) => h.includes(t)).length
}

export default function AppExplore() {
  const { navigate, toast } = useNav()
  const region = useSession((s) => s.region)
  const category = useSession((s) => s.viewingCategory) as CategoryId | null
  const saved = useSession((s) => s.savedVendors)
  const [query, setQuery] = useState(DEMO_SEARCH)

  const pool = vendorsIn(region)
  const inCategory = category ? pool.filter((v) => v.category === category) : pool
  const ranked = [...inCategory].map((v, i) => ({ v, s: score(v, query), i })).sort((a, b) => b.s - a.s || a.i - b.i)
  const matches = ranked.filter((r) => r.s > 0).map((r) => r.v)
  const rest = ranked.filter((r) => r.s === 0).map((r) => r.v)
  const featured = pool.filter((v) => v.featured)
  const cityName = region === 'uk' ? 'London' : 'Lagos'

  const open = (v: Vendor) => {
    session.viewVendor(v.id)
    track('vendor_open', v.id)
    navigate('app.vendor')
  }
  const pickCategory = (id: CategoryId) => {
    session.setCategory(category === id ? null : id)
    track('category_pick', id)
  }
  const heart = (v: Vendor) => {
    session.toggleSaved(v.id)
    toast(saved.includes(v.id) ? `${v.name} removed from saved` : `${v.name} saved`, 'accent')
  }

  const Row = ({ v, hint }: { v: Vendor; hint?: string }) => {
    const c = categoryById(v.category)
    const on = saved.includes(v.id)
    return (
      <motion.li variants={listItem} className="flex items-start gap-1 px-5 py-3.5">
        <Pressable onClick={() => open(v)} className="flex min-w-0 flex-1 items-start gap-3">
          <img src={img(v.photos[0], 300)} alt="" loading="lazy" className="h-[84px] w-[84px] shrink-0 rounded-[var(--r-card)] object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-bold leading-tight">{v.name}</p>
              {v.verified ? <Verified size={13} label={false} /> : null}
            </div>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-text-2">
              {c.label} · {v.area}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] font-semibold text-text-2">
              <Stars rating={v.rating} count={v.reviews} size={12} />
              <span className="num">In operation {v.years} yrs</span>
              {hint ? <Badge tone="accent">{hint}</Badge> : !v.verified ? <Badge tone="neutral">Not yet verified</Badge> : null}
            </div>
            <p className="num mt-1.5 text-[13px] font-bold text-text">
              from {money(v.priceFrom, v.currency)} <span className="font-semibold text-text-2">{v.priceUnit}</span>
            </p>
            <Strip vendor={v} size="xs" highlight={RUBY.date} className="mt-2" />
          </div>
        </Pressable>
        <motion.button type="button" whileTap={tap} transition={spring.ui} aria-pressed={on} aria-label={on ? `Unsave ${v.name}` : `Save ${v.name}`} onClick={() => heart(v)} className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full">
          <Heart size={20} strokeWidth={2.2} aria-hidden fill={on ? 'var(--danger)' : 'none'} className={on ? 'text-danger' : 'text-text-2'} />
        </motion.button>
      </motion.li>
    )
  }

  return (
    <MobileScreen
      tab="explore"
      header={
        <TopBar
          large
          back={false}
          title="Explore"
          sub={`${pool.length} vendors and venues in ${cityName} · ${pool.filter((v) => v.verified).length} verified`}
          right={<IconButton icon={Heart} label={`Saved vendors, ${saved.length}`} badge={saved.length} onClick={() => toast(`${saved.length} saved: ${saved.map((id) => pool.find((v) => v.id === id)?.name ?? id).join(', ')}`, 'info')} />}
        />
      }
    >
      {/* region + search */}
      <div className="px-5">
        <Segmented<Region> full items={[{ id: 'uk', label: 'London', count: vendorsIn('uk').length }, { id: 'ng', label: 'Lagos', count: vendorsIn('ng').length }]} value={region} onChange={(r) => { session.setRegion(r); track('region', r) }} />
        <div className="well mt-3 flex h-12 items-center gap-2 rounded-[var(--r-control)] px-3.5 ring-1 ring-inset ring-[var(--rule-strong)] focus-within:ring-2 focus-within:ring-[var(--accent)]">
          <Search size={17} strokeWidth={2.3} aria-hidden className="shrink-0 text-text-2" />
          <input aria-label="Search vendors" value={query} onChange={(e) => setQuery(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-text-3" placeholder="DJ, caterer, hall…" />
          {query && (
            <motion.button type="button" whileTap={tap} transition={spring.ui} aria-label="Clear search" onClick={() => setQuery('')} className="grid h-8 w-8 place-items-center rounded-full text-text-2">
              <X size={16} strokeWidth={2.4} aria-hidden />
            </motion.button>
          )}
          <motion.button type="button" whileTap={tap} transition={spring.ui} aria-label="Filters" onClick={() => toast('Filters: free on 20 Feb · verified · price. Arrive with the build', 'info')} className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-high)] text-text">
            <SlidersHorizontal size={15} strokeWidth={2.4} aria-hidden />
          </motion.button>
        </div>
      </div>

      {/* categories */}
      <Rail className="mt-4 pb-1" gap={10}>
        <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => navigate('app.planner')} className="flex w-[84px] shrink-0 snap-start flex-col items-center gap-1.5">
          <span className="grid h-[68px] w-[68px] place-items-center rounded-[18px] bg-ink text-on-ink">
            <Users size={24} strokeWidth={2.2} aria-hidden />
          </span>
          <span className="text-[12px] font-bold leading-tight">Planners</span>
          <span className="meta -mt-1 text-text-2">142</span>
        </motion.button>
        {CATEGORIES.filter((c) => c.id !== 'planner').map((c) => {
          const on = category === c.id
          return (
            <motion.button key={c.id} type="button" whileTap={tap} transition={spring.ui} onClick={() => pickCategory(c.id)} aria-pressed={on} className="flex w-[84px] shrink-0 snap-start flex-col items-center gap-1.5">
              <span className={`relative h-[68px] w-[68px] overflow-hidden rounded-[18px] ${on ? 'ring-[3px] ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]' : ''}`}>
                <img src={img(c.photo, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                {on && (
                  <span className="absolute inset-0 grid place-items-center bg-[rgb(28_107_90/0.55)] text-white">
                    <Check size={22} strokeWidth={3} aria-hidden />
                  </span>
                )}
              </span>
              <span className={`text-center text-[12px] leading-tight ${on ? 'font-extrabold text-accent-ink' : 'font-bold'}`}>{c.label}</span>
              <span className="meta -mt-1 text-text-2">{c.count}</span>
            </motion.button>
          )
        })}
      </Rail>

      {/* featured */}
      {!category && (
        <>
          <SectionHead className="mt-5" title={`Featured in ${cityName}`} eyebrow="Free on your date first" />
          <Rail className="mt-3 pb-2">
            {featured.map((v) => (
              <motion.button key={v.id} type="button" whileTap={tapSoft} transition={spring.ui} onClick={() => open(v)} className="block w-[250px] shrink-0 snap-start overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] text-left shadow-[var(--shadow-raised)]">
                <HeroImage src={v.photos[0]} alt="" className="h-[132px]" scrim="b" width={600}>
                  <div className="flex h-full flex-col justify-end p-3">
                    <p className="label text-brass-light">{categoryById(v.category).label}</p>
                    <p className="truncate text-[16px] font-bold leading-tight text-on-night">{v.name}</p>
                  </div>
                </HeroImage>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Stars rating={v.rating} count={v.reviews} size={12} />
                    <span className="num text-[12px] font-bold">from {money(v.priceFrom, v.currency)}</span>
                  </div>
                  <Strip vendor={v} size="sm" highlight={RUBY.date} className="mt-2.5" />
                  <p className="meta mt-1.5 text-text-2">{v.years} yrs in operation · {v.verified ? 'verified' : 'unverified'}</p>
                </div>
              </motion.button>
            ))}
          </Rail>
        </>
      )}

      {/* results */}
      <div className="mt-5 flex items-end justify-between gap-3 px-5">
        <div>
          <p className="label text-brass-ink">{category ? categoryById(category).plural : 'All vendors'}</p>
          <h2 className="grot text-[22px]">
            {query && matches.length ? `${matches.length} match “${query}”` : `${inCategory.length} in ${cityName}`}
          </h2>
        </div>
        <StripLegend className="mb-1" />
      </div>
      {category && (
        <div className="mt-2 px-5">
          <button type="button" onClick={() => session.setCategory(null)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-[13px] font-bold text-on-accent">
            {categoryById(category).label}
            <X size={14} strokeWidth={2.6} aria-hidden />
          </button>
        </div>
      )}
      {inCategory.length === 0 && (
        <p className="mx-5 mt-4 rounded-[var(--r-card)] bg-[var(--surface-high)] p-4 text-[14px] text-text-2">No {categoryById(category!).plural.toLowerCase()} listed in {cityName} yet. Try London, or ask Tunde.</p>
      )}
      <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-1 flex flex-col">
        {matches.map((v) => (
          <Row key={v.id} v={v} hint="Matches your search" />
        ))}
      </motion.ul>
      {matches.length > 0 && rest.length > 0 && (
        <p className="label mt-3 px-5 text-text-2">More in {cityName}</p>
      )}
      <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-1 flex flex-col">
        {rest.map((v) => (
          <Row key={v.id} v={v} />
        ))}
      </motion.ul>

      <div className="mx-5 mt-4">
      <Pressable
        onClick={() => {
          session.viewThread('th1')
          navigate('app.thread')
        }}
        className="flex items-center gap-3 rounded-[var(--r-card)] bg-ink p-4 text-on-ink"
      >
        <MessageCircle size={20} strokeWidth={2.2} aria-hidden className="text-brass-light" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">Can’t find it? Ask Tunde</p>
          <p className="text-[12px] font-semibold text-on-ink-2">Your planner knows who is free on 20 Feb.</p>
        </div>
      </Pressable>
      </div>
    </MobileScreen>
  )
}
