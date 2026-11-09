import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Languages, LogOut, MapPin, Pencil, Share2, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Chip } from '../../components/Badge'
import { AVAIL, StarRow, Stars, StripLegend, Verified } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { Input } from '../../components/Form'
import { HeroImage, Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { addDays, CLOCK, dayNum, dowLabel, fmtDay, fmtShort } from '../../data/clock'
import { EVENTS, REQUESTS } from '../../data/events'
import { img, type MediaKey } from '../../data/media'
import { personById, PLANNER } from '../../data/people'
import { plannerById, REVIEWS, type Availability } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* pro.profile: Tunde's public profile exactly as a client sees it before
   assigning him: photo hero with his face overlapping its edge, the
   basics a client needs without sending a message (years, events,
   rating, languages, cities), portfolio rail, the availability band for
   the next 14 days, reviews. Composition: full-bleed hero → overlapping
   avatar → stats band → rail → availability band → editorial reviews. */

const PORTFOLIO: { key: MediaKey; caption: string; sub: string }[] = [
  { key: 'tipiDance', caption: 'Ade’s 45th', sub: 'Birthday · 140 guests' },
  { key: 'weddingConfetti', caption: 'Ola & Tomi', sub: 'White wedding · 300' },
  { key: 'dinnerLaugh', caption: 'Engagement dinner', sub: 'Peckham · 90' },
  { key: 'barnDrapes', caption: 'Hall styling', sub: 'Olá Event Hall' },
  { key: 'confettiCrowd', caption: 'Lagos launch', sub: 'Corporate · 400' },
  { key: 'birthdayCake', caption: 'Chidera’s 1st', sub: 'Birthday · 60' },
]

export default function ProProfile() {
  const { navigate, reset, toast, canGoBack, back } = useNav()
  const listing = plannerById('bakare')
  const reviews = REVIEWS.bakare
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState<(typeof PORTFOLIO)[number] | null>(null)
  const [form, setForm] = useState({ business: listing.business, speciality: listing.speciality, from: String(listing.from) })

  /* next 14 days from Tunde's own events and the requests he has out */
  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const iso = addDays(CLOCK.todayIso, i)
        const ev = EVENTS.find((e) => e.date === iso)
        const held = REQUESTS.some((r) => r.by === 'tunde' && r.date === iso && r.state === 'requested')
        const state: Availability = ev ? 'booked' : held ? 'held' : 'free'
        return { iso, state, ev }
      }),
    [],
  )
  const nextFreeSat = days.find((d) => d.state === 'free' && dowLabel(d.iso) === 'Sat')
  const freeCount = days.filter((d) => d.state === 'free').length

  return (
    <MobileScreen
      bg="var(--bg)"
      cap="var(--ink)"
      dock={
        <Dock>
          <Button variant="paper" icon={CalendarDays} onClick={() => navigate('pro.calendar')}>
            Calendar
          </Button>
          <Button variant="accent" block icon={Pencil} onClick={() => setEditing(true)}>
            Edit profile
          </Button>
        </Dock>
      }
      overlay={
        <>
          <BottomSheet open={editing} onClose={() => setEditing(false)} title="Edit profile">
            <div className="grid gap-3 pb-2">
              <Input label="Business name" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
              <Input label="Speciality" value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })} hint="Shown under your name in search" />
              <Input label="Planning fee from" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} inputMode="numeric" leading={<span className="text-[15px] font-bold">£</span>} hint="Quotes are agreed per event · settled outside Edera for now" />
              <Button variant="accent" size="lg" block onClick={() => { track('save_profile'); toast('Profile saved · live on the marketplace', 'accent'); setEditing(false) }}>
                Save
              </Button>
            </div>
          </BottomSheet>
          <BottomSheet open={!!lightbox} onClose={() => setLightbox(null)} title={lightbox?.caption}>
            {lightbox && (
              <div className="pb-2">
                <img src={img(lightbox.key, 900)} alt="" className="h-[260px] w-full rounded-[var(--r-card)] object-cover" />
                <p className="mt-3 text-[15px] font-bold">{lightbox.sub}</p>
                <p className="mt-0.5 text-[13px] text-text-2">Planned and run by Bakare Events · photo shared with the client’s permission.</p>
              </div>
            )}
          </BottomSheet>
        </>
      }
    >
      {/* Hero behind the status bar */}
      <section className="relative h-[292px] w-full">
        <div className="absolute inset-0" aria-hidden>
          <HeroImage src="weddingGlasses" alt="" scrim="both" className="h-full w-full" width={900} />
        </div>
        <div className="relative flex items-center justify-between px-4" style={{ paddingTop: `calc(${SAFE_TOP} + 6px)` }}>
          {canGoBack ? (
            <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={back} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-full bg-[rgb(11_38_34/0.5)] text-white backdrop-blur-md">
              <ChevronLeft size={24} aria-hidden />
            </motion.button>
          ) : (
            <span className="h-11 w-11" />
          )}
          <span className="label rounded-full bg-[rgb(11_38_34/0.5)] px-3 py-1.5 text-[#f7f2e8] backdrop-blur-md">Public profile · as clients see it</span>
          <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => { track('share_profile'); toast('Profile link copied · useedera.com/p/bakare-events') }} aria-label="Share" className="grid h-11 w-11 place-items-center rounded-full bg-[rgb(11_38_34/0.5)] text-white backdrop-blur-md">
            <Share2 size={19} aria-hidden />
          </motion.button>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-end px-5 pb-4">
          <span className="label text-brass-light">Planning since 2017</span>
        </div>
      </section>

      {/* Avatar overlapping the hero edge */}
      <section className="relative z-10 -mt-12 px-5">
        <div className="flex items-end justify-between">
          <Avatar who="tunde" size={100} ring verified />
          <div className="mb-1 flex flex-col items-end gap-1">
            <Stars rating={PLANNER.rating} count={PLANNER.reviews} size={15} />
            <span className="text-[12px] font-semibold text-text-2">Replies within 2 hours</span>
          </div>
        </div>
        <h1 className="grot mt-3 text-[32px]">{PLANNER.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-bold">
          {PLANNER.business}
          <Verified size={15} />
        </p>
        <p className="mt-1 text-[13px] text-text-2">{listing.speciality}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-text-2">
          <MapPin size={14} aria-hidden /> London & Lagos · travels across the UK and Nigeria
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-text-2"><Languages size={14} aria-hidden /> Speaks</span>
          {PLANNER.languages.map((l) => (
            <Chip key={l}>{l}</Chip>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section className="mx-4 mt-5 grid grid-cols-3 overflow-hidden rounded-[var(--r-container)] bg-ink text-on-ink">
        <div className="p-4">
          <p className="figure num text-[34px]">{PLANNER.years}<span className="unit">yrs</span></p>
          <p className="label mt-1 text-on-ink-2">operating</p>
        </div>
        <Pressable onClick={() => navigate('pro.events')} className="p-4" style={{ boxShadow: 'inset 1px 0 0 rgb(255 255 255 / 0.12), inset -1px 0 0 rgb(255 255 255 / 0.12)' }}>
          <p className="figure num text-[34px]">{PLANNER.eventsDone}</p>
          <p className="label mt-1 text-on-ink-2">events →</p>
        </Pressable>
        <div className="p-4">
          <p className="figure num text-[34px]">{freeCount}<span className="unit">/14</span></p>
          <p className="label mt-1 text-on-ink-2">days free</p>
        </div>
      </section>

      {/* Portfolio */}
      <SectionHead className="mt-7" eyebrow={`${PLANNER.eventsDone} events`} title="Recent work" action="All photos" onAction={() => toast('Full portfolio · 24 events with photos')} />
      <Rail className="mt-3" gap={10}>
        {PORTFOLIO.map((p) => (
          <motion.button key={p.key} type="button" whileTap={tap} transition={spring.ui} onClick={() => setLightbox(p)} className="relative h-[196px] w-[150px] shrink-0 snap-start overflow-hidden rounded-[var(--r-card)] text-left">
            <img src={img(p.key, 400)} alt={p.caption} className="absolute inset-0 h-full w-full object-cover" />
            <span aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
            <span className="absolute inset-x-0 bottom-0 p-3">
              <span className="block truncate text-[14px] font-bold text-[#f7f2e8]">{p.caption}</span>
              <span className="block truncate text-[11px] font-semibold text-[#d2e8df]">{p.sub}</span>
            </span>
          </motion.button>
        ))}
      </Rail>

      {/* Availability band */}
      <SectionHead className="mt-7" eyebrow="Next 14 days" title={<>When Tunde is <em>free</em></>} action="Full calendar" onAction={() => navigate('pro.calendar')} />
      <div className="mx-4 mt-3 rounded-[var(--r-container)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
        <div className="flex w-full gap-[4px]">
          {days.map((d) => (
            <motion.button
              key={d.iso}
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={spring.ui}
              aria-label={`${fmtDay(d.iso)}: ${AVAIL[d.state].label}`}
              onClick={() => toast(d.ev ? `${fmtDay(d.iso)} · ${d.ev.name}` : d.state === 'held' ? `${fmtDay(d.iso)} · a request is waiting on this date` : `${fmtDay(d.iso)} · free to book`, d.state === 'free' ? 'accent' : 'neutral')}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span className={`grid h-[44px] w-full place-items-center rounded-[8px] text-[12px] font-extrabold ${d.state === 'booked' ? 'text-on-ink' : d.state === 'held' ? 'text-on-brass' : 'text-white'}`} style={{ background: AVAIL[d.state].fill, boxShadow: d.iso === CLOCK.todayIso ? '0 0 0 2px var(--surface), 0 0 0 4px var(--brass)' : undefined }}>
                {dayNum(d.iso)}
              </span>
              <span className="meta text-text-2" style={{ fontSize: 10 }}>{dowLabel(d.iso)[0]}</span>
            </motion.button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <StripLegend />
          <span className="num text-[12px] font-bold text-text-2">{nextFreeSat ? `Next free Saturday · ${fmtShort(nextFreeSat.iso)}` : 'No free Saturday this fortnight'}</span>
        </div>
      </div>

      {/* Verification row */}
      <Pressable onClick={() => navigate('pro.verification')} className="mx-4 mt-5 flex items-center gap-3 rounded-[var(--r-card)] bg-accent-soft p-3.5 text-on-accent-soft">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent"><ShieldCheck size={20} aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold">Verified Professional · until Nov 2027</span>
          <span className="block text-[12px]">Identity, Companies House, insurance and portfolio checked by Edera</span>
        </span>
        <ChevronRight size={18} aria-hidden />
      </Pressable>

      {/* Reviews */}
      <SectionHead className="mt-7" eyebrow={`${PLANNER.reviews} reviews · ${PLANNER.rating.toFixed(1)} average`} title="What clients say" action={`All ${PLANNER.reviews}`} onAction={() => toast(`${PLANNER.reviews} reviews · 94% five stars`)} />
      <ul className="mt-2">
        {reviews.map((r, i) => {
          const p = personById(r.by)
          return (
            <li key={r.id} className="flex gap-3 px-5 py-4" style={i > 0 ? { boxShadow: 'inset 0 1px 0 var(--rule)' } : undefined}>
              <Avatar who={p.photo} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[14px] font-bold">{p.name}</p>
                  <span className="meta shrink-0 text-text-2">{fmtShort(r.date)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <StarRow rating={r.rating} />
                  <span className="truncate text-[12px] font-semibold text-text-2">{r.event}</span>
                </div>
                <p className="mt-1.5 text-[14px] leading-snug text-text">“{r.text}”</p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-3.5">
        <Sparkles size={18} className="shrink-0 text-brass-ink" aria-hidden />
        <p className="text-[13px] leading-snug text-text-2"><span className="font-bold text-text">This is the page Adaeze saw</span> before she assigned you to her parents’ anniversary: no message needed.</p>
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="ghost" icon={LogOut} onClick={() => { track('sign_out'); reset('pro.signin') }} className="text-danger-text">
          Sign out
        </Button>
      </div>
    </MobileScreen>
  )
}
