import { motion } from 'framer-motion'
import { Camera, ChevronRight, Clock3, Eye, Image as ImageIcon, Package, Pencil, Plus, ShieldCheck, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { Badge, Chip } from '../../components/Badge'
import { Bar, Figure, Money, StarRow, Stars, Strip, StripLegend, Verified } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { HeroImage, Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { ago, fmtShort, money } from '../../data/clock'
import { REQUESTS } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { CATEGORIES, REVIEWS, vendorById, type Availability, type CategoryId, type Vendor } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, useSession, type SessionState } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { fadeUp, listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* vendor.listings — "My listings". Two listings, two shapes: the catering
   listing is a wide photo-led card with the price and the strip; the hall
   is a split card, photo left and capacity figure right. Then listing
   health as bars, the reviews line, and "Add a listing" in the dock. */

function withSession(v: Vendor, s: SessionState): Vendor {
  const cal: Record<string, Availability> = { ...v.calendar }
  for (const iso of s.unblockedDays) if (cal[iso] === 'blocked') delete cal[iso]
  for (const iso of s.blockedDays) cal[iso] = 'blocked'
  for (const r of REQUESTS) {
    if (r.vendorId !== v.id) continue
    const st = requestState(r.id, s)
    if (st === 'confirmed' || st === 'accepted' || st === 'completed') cal[r.date] = 'booked'
    else if ((st === 'declined' || st === 'proposed') && cal[r.date] === 'held') delete cal[r.date]
    else if (st === 'requested' && !cal[r.date]) cal[r.date] = 'held'
  }
  return { ...v, calendar: cal }
}

const HEALTH = [
  { id: 'photos', label: 'Photos', value: '4 of 8', pct: 50, hint: 'Listings with 8+ photos get 2.3× more requests', icon: ImageIcon, tone: 'brass' as const },
  { id: 'packages', label: 'Packages', value: '4', pct: 100, hint: 'Premium buffet is your most booked', icon: Package, tone: 'accent' as const },
  { id: 'response', label: 'Response time', value: '1h 48m', pct: 82, hint: 'Faster than 82% of caterers', icon: Clock3, tone: 'accent' as const },
  { id: 'calendar', label: 'Calendar updated', value: ago(120), pct: 100, hint: 'Kept current · shows live on your profile', icon: Clock3, tone: 'accent' as const },
]

export default function VendorListings() {
  const { navigate, toast } = useNav()
  const s = useSession((x) => x)
  const catering = withSession(vendorById('iyabola'), s)
  const hall = withSession(vendorById('ola-hall'), s)
  const [adding, setAdding] = useState(false)
  const [category, setCategory] = useState<CategoryId>('bar')
  const review = REVIEWS.iyabola[1]
  const reviewer = personById(review.by)

  const edit = (which: 'catering' | 'hall') => {
    if (which === 'catering') {
      track('vendor_edit_listing', 'iyabola')
      navigate('vendor.listing')
    } else toast('Hall editor uses the same form', 'info')
  }

  return (
    <MobileScreen
      tab="listings"
      dockHeight={70}
      dock={
        <Dock>
          <div className="flex min-w-0 flex-1 flex-col pl-3">
            <span className="whitespace-nowrap text-[13px] font-bold">2 live listings</span>
            <span className="truncate text-[11px] font-semibold text-text-2">London · free during launch</span>
          </div>
          <Button icon={Plus} onClick={() => setAdding(true)}>
            Add a listing
          </Button>
        </Dock>
      }
      overlay={
        <BottomSheet open={adding} onClose={() => setAdding(false)} title="Add a listing">
          <p className="text-[14px] text-text-2">Pick the category clients will find you under. One business, as many listings as you offer.</p>
          <div className="-mx-5 mt-4">
            <Rail gap={10}>
              {CATEGORIES.filter((c) => c.id !== 'planner').map((c) => {
                const on = c.id === category
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileTap={tap}
                    transition={spring.ui}
                    onClick={() => setCategory(c.id)}
                    aria-pressed={on}
                    className="relative h-[104px] w-[112px] shrink-0 snap-start overflow-hidden rounded-[var(--r-card)] text-left"
                    style={{ boxShadow: on ? '0 0 0 2px var(--surface), 0 0 0 4px var(--accent)' : undefined }}
                  >
                    <img src={img(c.photo, 300)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <span aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
                    <span className="absolute inset-x-0 bottom-0 p-2.5 text-on-night">
                      <span className="block text-[13px] font-bold leading-tight">{c.label}</span>
                      <span className="meta block text-on-night-2">{c.count} in London</span>
                    </span>
                    {on && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-accent text-on-accent">
                        <ShieldCheck size={14} aria-hidden />
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </Rail>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-[var(--r-card)] bg-[var(--surface-tint)] px-4 py-3">
            <span className="text-[13px] font-semibold text-text-2">Your verification carries over</span>
            <Verified />
          </div>
          <Button
            size="lg"
            block
            className="mt-4"
            trailing={ChevronRight}
            onClick={() => {
              setAdding(false)
              track('vendor_add_listing', category)
              toast(`New ${CATEGORIES.find((c) => c.id === category)?.label} listing started · 6 steps`, 'accent')
            }}
          >
            Continue
          </Button>
        </BottomSheet>
      }
    >
      {/* ── Header ── */}
      <header className="px-5" style={{ paddingTop: `calc(${SAFE_TOP} + 8px)` }}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label text-brass-ink">Ìyá Bola · Peckham</p>
            <h1 className="grot mt-1 text-[34px]">My listings</h1>
          </div>
          <motion.button type="button" whileTap={tap} onClick={() => navigate('vendor.verification')} className="mb-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-[13px] font-bold text-on-accent-soft">
            <ShieldCheck size={15} aria-hidden /> Get verified
          </motion.button>
        </div>
      </header>

      {/* ── Catering: wide photo-led card ── */}
      <motion.section variants={fadeUp} initial="hidden" animate="show" className="mx-5 mt-5 overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]" aria-label={catering.name}>
        <HeroImage src={catering.photos[0]} alt="Buffet trays at an Ìyá Bola event" className="h-[200px]" scrim="b">
          <div className="flex h-full flex-col justify-between p-4 text-on-night">
            <div className="flex items-start justify-between">
              <Badge tone="solid">Live · Caterers</Badge>
              <span className="label rounded-full bg-[rgb(11_38_34/0.55)] px-2.5 py-1.5 text-on-night backdrop-blur-md">{catering.years} yrs</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Stars rating={catering.rating} count={catering.reviews} tone="ink" />
                <Verified tone="light" />
              </div>
              <p className="grot mt-1 text-[26px]">{catering.name}</p>
            </div>
          </div>
        </HeroImage>
        <div className="p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="meta text-text-2">From</p>
              <p className="flex items-baseline gap-1.5">
                <Money amount={catering.priceFrom} size={30} />
                <span className="text-[13px] font-semibold text-text-2">{catering.priceUnit}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="meta text-text-2">Bookings</p>
              <Figure value={catering.bookings} size={30} />
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">Next 14 days</span>
              <StripLegend className="scale-90 origin-right" />
            </div>
            <Strip vendor={catering} size="xs" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {catering.tags.map((t) => (
              <Chip key={t} className="!h-7 !text-[12px]">
                {t}
              </Chip>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="ink" block icon={Pencil} onClick={() => edit('catering')}>
              Edit
            </Button>
            <Button variant="outline" block icon={Eye} onClick={() => toast('Opening your profile as Adaeze would see it', 'info')}>
              Preview as a client
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ── Hall: split card ── */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }} className="mx-5 mt-4 flex overflow-hidden rounded-[var(--r-container)] bg-ink text-on-ink" aria-label={hall.name}>
        <HeroImage src={hall.photos[0]} alt="Olá Event Hall dressed in white drapes" className="w-[38%] shrink-0" scrim="none" />
        <div className="relative min-w-0 flex-1 p-4">
          <span aria-hidden className="arc" style={{ opacity: 0.35, bottom: '-70%', right: '-40%', width: '70%' }} />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Badge tone="ink" className="bg-[rgb(255_255_255/0.14)]">Live · Venues</Badge>
              <Verified tone="brass" />
            </div>
            <p className="grot mt-2 text-[22px]">{hall.name}</p>
            <Figure value={hall.capacity} unit="seated" size={36} tone="var(--brass-light)" className="mt-2 block" />
            <p className="mt-1.5 text-[12px] font-semibold leading-snug text-on-ink-2">Licensed until 1am · step-free · in-house catering</p>
            <p className="mt-2 text-[13px] font-semibold">
              {money(hall.priceFrom)} <span className="text-on-ink-2">per day · evening {money(850)}</span>
            </p>
            <div className="mt-3">
              <Strip vendor={hall} size="xs" tone="ink" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={hall.rating} count={hall.reviews} tone="ink" />
              <span className="meta text-on-ink-2">· {hall.bookings} bookings</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="white" size="sm" icon={Pencil} onClick={() => edit('hall')}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="!text-on-ink hover:!bg-[rgb(255_255_255/0.1)]" icon={Eye} onClick={() => toast('Opening Olá Event Hall as a client sees it', 'info')}>
                Preview
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Health rows ── */}
      <section className="mt-8">
        <SectionHead eyebrow="Listing health" title={<>Strong, with <em>one gap</em></>} action="Calendar" onAction={() => navigate('vendor.calendar')} />
        <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-3 flex flex-col gap-4 px-5">
          {HEALTH.map((h) => (
            <motion.li key={h.id} variants={listItem}>
              <Pressable
                onClick={() => (h.id === 'photos' ? toast('Add photos from the listing editor', 'info') : h.id === 'calendar' ? navigate('vendor.calendar') : h.id === 'packages' ? navigate('vendor.listing') : navigate('vendor.requests'))}
                className="flex items-center gap-3"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${h.pct < 100 ? 'bg-brass-soft text-on-brass-soft' : 'bg-accent-soft text-on-accent-soft'}`}>
                  <h.icon size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-bold">{h.label}</span>
                    <span className="num text-[13px] font-bold">{h.value}</span>
                  </span>
                  <Bar value={h.pct} tone={h.tone} height={5} className="mt-1.5" />
                  <span className="mt-1 block text-[12px] font-semibold text-text-2">{h.hint}</span>
                </span>
              </Pressable>
            </motion.li>
          ))}
        </motion.ul>
        <div className="mt-4 px-5">
          <Pressable onClick={() => toast('Add photos from the listing editor', 'info')} className="flex items-center justify-between rounded-[var(--r-card)] border border-dashed border-[var(--rule-strong)] px-4 py-3">
            <span className="flex items-center gap-2 text-[13px] font-bold">
              <Camera size={16} aria-hidden /> Add 4 more photos
            </span>
            <span className="text-[12px] font-semibold text-text-2">+ {fmtShort('2026-11-28')} deadline for the feature slot</span>
          </Pressable>
        </div>
      </section>

      {/* ── Reviews line ── */}
      <section className="mt-8 px-5">
        <Pressable onClick={() => navigate('vendor.reviews')} className="flex items-center gap-4 rounded-[var(--r-container)] bg-[var(--surface-tint)] p-4">
          <span className="flex flex-col items-center">
            <Figure value={catering.rating.toFixed(1)} size={40} />
            <StarRow rating={5} size={11} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[14px] font-bold">
              <Star size={14} fill="var(--brass)" strokeWidth={0} aria-hidden /> {catering.reviews + hall.reviews} reviews across both listings
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-text-2">“{review.text}”</span>
            <span className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-text-2">
              <Users size={12} aria-hidden /> {reviewer.name} · 1 reply waiting
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-text-2" aria-hidden />
        </Pressable>
      </section>
    </MobileScreen>
  )
}
