import { motion } from 'framer-motion'
import { CalendarCheck, ChevronDown, ChevronLeft, Clock3, Heart, Languages, MapPin, MessageCircle, Share2, Users } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge, Chip } from '../../components/Badge'
import { AvailPill, Figure, Money, StarRow, Stars, Strip, StripLegend, Verified, AVAIL } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { HeroImage, Rail } from '../../components/Media'
import { addDays, fmtDay, fmtShort, money, plural } from '../../data/clock'
import { RUBY } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { availabilityOn, categoryById, reviewsFor, vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* app.vendor: Dave's one idea, on one screen. "I can see how long the DJ
   has been in operation, other people's reviews, and the calendar: when
   the day is free and when it is booked, without even contacting the DJ." */

const THIS_YEAR = 2026
/* 'within 2 hours' → '2h', 'within a day' → '24h' */
const replyShort = (t: string) => (/an hour/.test(t) ? '1h' : /a day/.test(t) ? '24h' : `${t.replace(/\D/g, '') || '2'}h`)

export default function AppVendor() {
  const { navigate, toast, back, canGoBack } = useNav()
  const id = useSession((s) => s.viewingVendor)
  const saved = useSession((s) => s.savedVendors)
  const v = vendorById(id)
  const c = categoryById(v.category)
  const owner = personById(v.owner)
  const reviews = reviewsFor(v.id)
  const [pkg, setPkg] = useState(() => v.packages.find((p) => p.popular)?.id ?? v.packages[0].id)
  const [allReviews, setAllReviews] = useState(false)
  const on = saved.includes(v.id)
  const onDate = availabilityOn(v, RUBY.date)
  const shown = allReviews ? reviews : reviews.slice(0, 4)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, k: reviews.filter((r) => r.rating === n).length }))
  const freeNext14 = Array.from({ length: 14 }, (_, i) => availabilityOn(v, addDays('2026-11-21', i))).filter((s) => s === 'free').length

  const goBack = () => (canGoBack ? back() : navigate('app.explore'))
  const message = () => {
    session.viewThread('th2')
    track('message_vendor', v.id)
    navigate('app.thread')
  }
  const request = () => {
    track('request_to_book', v.id)
    navigate('app.booking')
  }
  const heart = () => {
    session.toggleSaved(v.id)
    toast(on ? `${v.name} removed from saved` : `${v.name} saved`, 'accent')
  }

  return (
    <MobileScreen
      cap="var(--night)"
      dock={
        <Dock>
          <Button variant="ink" icon={MessageCircle} onClick={message}>
            Message
          </Button>
          <Button block icon={CalendarCheck} onClick={request}>
            Request to book
          </Button>
        </Dock>
      }
    >
      {/* ── gallery hero ── */}
      <HeroImage src={v.photos[0]} alt={`${v.name}: ${c.label}`} className="w-full" scrim="both" width={1100} position="center 45%">
        <div className="flex min-h-[380px] flex-col px-5 pb-10" style={{ paddingTop: `calc(${SAFE_TOP} + 4px)` }}>
          <div className="flex items-center justify-between">
            <motion.button type="button" whileTap={tap} transition={spring.ui} aria-label="Back" onClick={goBack} className="flex h-11 items-center gap-0.5 rounded-full bg-[rgb(11_38_34/0.5)] pl-2 pr-4 text-[15px] font-semibold text-white backdrop-blur-md">
              <ChevronLeft size={24} strokeWidth={2.2} aria-hidden />
              Back
            </motion.button>
            <div className="flex items-center gap-2">
              <IconButton icon={Share2} label="Share profile" tone="scrim" onClick={() => toast(`Link copied: edera.app/v/${v.id}`, 'accent')} />
              <IconButton icon={Heart} label={on ? 'Unsave' : 'Save'} tone="scrim" aria-pressed={on} onClick={heart} className={on ? 'text-[color:#f3a3b1]' : ''} />
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Badge className="bg-[rgb(255_255_255/0.16)] text-white ring-1 ring-inset ring-[rgb(255_255_255/0.3)]">{c.label}</Badge>
            {v.verified ? <Verified tone="light" size={14} className="rounded-full bg-[rgb(11_38_34/0.45)] px-2 py-0.5" /> : <Badge tone="neutral">Not yet verified</Badge>}
          </div>
          <h1 className="grot mt-3 text-[34px] text-on-night">{v.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-on-night-2">
            <Stars rating={v.rating} count={v.reviews} size={13} tone="ink" />
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} strokeWidth={2.4} aria-hidden />
              {v.area}
            </span>
          </div>
        </div>
      </HeroImage>

      {/* other photos lapping the hero */}
      <Rail className="relative z-10 -mt-6 pb-1" gap={8}>
        {v.photos.slice(1).map((p, i) => (
          <motion.button key={p} type="button" whileTap={tap} transition={spring.ui} aria-label={`Photo ${i + 2} of ${v.photos.length}`} onClick={() => toast(`Photo ${i + 2} of ${v.photos.length}: full-screen gallery arrives with the build`, 'info')} className="h-[86px] w-[124px] shrink-0 snap-start overflow-hidden rounded-[var(--r-card)] shadow-[var(--shadow-floating)] ring-2 ring-[var(--bg)]">
            <img src={img(p, 400)} alt="" loading="lazy" className="h-full w-full object-cover" />
          </motion.button>
        ))}
        <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => toast('Instagram import: a vendor connects their account and the grid lands here', 'info')} className="grid h-[86px] w-[86px] shrink-0 snap-start place-items-center rounded-[var(--r-card)] bg-[var(--surface-high)] text-center text-[11px] font-bold text-text-2 ring-2 ring-[var(--bg)]">
          <span>
            +{12 + v.photos.length} on
            <br />
            Instagram
          </span>
        </motion.button>
      </Rail>

      {/* ── facts: the basics without a message ── */}
      <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-[var(--rule)] rounded-[var(--r-card)] bg-[var(--surface-tint)] py-3">
        <div className="flex flex-col items-center px-2 text-center">
          <Figure value={v.years} unit="yrs" size={28} />
          <span className="label mt-1 text-text-2">since {THIS_YEAR - v.years}</span>
        </div>
        <div className="flex flex-col items-center px-2 text-center">
          <Figure value={v.bookings} size={28} />
          <span className="label mt-1 text-text-2">bookings</span>
        </div>
        <div className="flex flex-col items-center px-2 text-center">
          <Figure value={replyShort(v.responseTime)} size={28} />
          <span className="label mt-1 text-text-2">typical reply</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 px-5">
        <Chip icon={<Languages size={13} strokeWidth={2.4} aria-hidden />}>{v.languages.join(' · ')}</Chip>
        {v.capacity && <Chip icon={<Users size={13} strokeWidth={2.4} aria-hidden />}>{v.capacity} seated</Chip>}
        <Chip icon={<Clock3 size={13} strokeWidth={2.4} aria-hidden />}>Replies {v.responseTime}</Chip>
      </div>

      {/* ── availability band ── */}
      <div className="relative mx-5 mt-6 overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label text-brass-ink">Availability</p>
            <p className="mt-1 text-[15px] font-bold">Next 14 days · {freeNext14} free</p>
          </div>
          <AvailPill state={onDate}>
            {fmtDay(RUBY.date)}: {AVAIL[onDate].label}
          </AvailPill>
        </div>
        <Strip vendor={v} size="md" labels highlight={RUBY.date} className="mt-3" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[13px] font-bold">Week of your event</p>
          <span className="meta text-text-2">
            {fmtShort(addDays(RUBY.date, -3))} – {fmtShort(addDays(RUBY.date, 10))}
          </span>
        </div>
        <Strip vendor={v} size="sm" labels from={addDays(RUBY.date, -3)} highlight={RUBY.date} className="mt-2" />
        <div className="mt-3 flex items-center justify-between">
          <StripLegend />
          <button type="button" onClick={() => toast('Full calendar arrives with the build; the strip shows the live states', 'info')} className="h-9 text-[13px] font-bold text-accent-ink">
            Full calendar
          </button>
        </div>
        <p className="mt-2 text-[12px] leading-snug text-text-2">
          {onDate === 'free' ? `Sat 20 Feb is free: a request holds the day until ${owner.first} replies.` : onDate === 'held' ? `Sat 20 Feb is held: a request from your planner is waiting on ${owner.first}.` : `Sat 20 Feb is booked. Ask ${owner.first} about the day before or after.`}
        </p>
      </div>

      {/* ── packages ── */}
      <SectionHead className="mt-8" title="Packages" eyebrow={`${v.packages.length} options · demo prices`} />
      <ul className="mx-5 mt-3 flex flex-col gap-2.5">
        {v.packages.map((p) => {
          const sel = p.id === pkg
          return (
            <li key={p.id}>
              <Pressable
                onClick={() => {
                  setPkg(p.id)
                  track('package_pick', p.id)
                }}
                aria-pressed={sel}
                className={`flex items-start gap-3 rounded-[var(--r-card)] p-4 transition-shadow duration-150 ${sel ? 'bg-[var(--surface)] ring-2 ring-[var(--accent)] shadow-[var(--shadow-raised)]' : 'bg-[var(--surface-raised)]'}`}
              >
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2 ring-inset ${sel ? 'ring-[var(--accent)]' : 'ring-[var(--rule-strong)]'}`}>{sel && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-bold leading-tight">{p.name}</p>
                    {p.popular && <Badge tone="accent">Popular</Badge>}
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-text-2">{p.includes}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Money amount={p.price} currency={v.currency} size={22} />
                  <p className="meta text-text-2">{p.unit}</p>
                </div>
              </Pressable>
            </li>
          )
        })}
      </ul>
      <p className="meta mt-2 px-5 text-text-2">Quote settled outside Edera · payments in a later phase</p>

      {/* ── about ── */}
      <SectionHead className="mt-8" title={`About ${v.name.split(' ')[0]}`} />
      <div className="mt-3 flex items-start gap-3 px-5">
        <Avatar who={owner.photo} size={44} verified={v.verified} alt="" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold">
            {owner.name} <span className="font-semibold text-text-2">· {owner.role}</span>
          </p>
          <p className="mt-1 text-[15px] leading-snug">{v.about}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 px-5">
        {v.tags.map((tg) => (
          <Chip key={tg}>{tg}</Chip>
        ))}
      </div>

      {/* ── reviews ── */}
      <SectionHead className="mt-8" title="Reviews" eyebrow={`${plural(v.reviews, 'review')} on Edera`} />
      <div className="mx-5 mt-3 flex items-center gap-5 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
        <div className="flex flex-col items-center">
          <Figure value={v.rating.toFixed(1)} size={44} />
          <StarRow rating={Math.round(v.rating)} size={11} />
        </div>
        <ul className="min-w-0 flex-1">
          {dist.map((d) => (
            <li key={d.n} className="flex items-center gap-2 py-0.5">
              <span className="meta w-3 text-right text-text-2">{d.n}</span>
              <span className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-[var(--surface-high)]">
                <span className="absolute inset-y-0 left-0 rounded-full bg-brass" style={{ width: `${reviews.length ? (d.k / reviews.length) * 100 : 0}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-2 flex flex-col">
        {shown.map((r) => {
          const p = personById(r.by)
          return (
            <li key={r.id} className="flex gap-3 px-5 py-3.5">
              <Avatar who={p.photo} size={40} alt="" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] font-bold">{p.name}</p>
                  <span className="meta shrink-0 text-text-2">{fmtShort(r.date)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <StarRow rating={r.rating} />
                  <span className="truncate text-[12px] font-semibold text-text-2">{r.event}</span>
                </div>
                <p className="mt-1.5 text-[14px] leading-snug">{r.text}</p>
                {r.reply && (
                  <div className="mt-2 rounded-[10px] bg-[var(--surface-high)] px-3 py-2">
                    <p className="label text-text-2">Reply from {owner.first}</p>
                    <p className="mt-0.5 text-[13px] leading-snug">{r.reply}</p>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {reviews.length > shown.length && (
        <button type="button" onClick={() => setAllReviews(true)} className="mx-5 flex h-11 items-center gap-1 text-[13px] font-bold text-accent-ink">
          <ChevronDown size={15} strokeWidth={2.4} aria-hidden />+{reviews.length - shown.length} more reviews
        </button>
      )}

      <p className="mx-5 mt-6 rounded-[var(--r-card)] bg-[var(--surface-high)] p-4 text-[13px] leading-snug text-text-2">
        Every number here is a demo value. Prices from {money(v.priceFrom, v.currency)} {v.priceUnit}; the quote comes with the booking request.
      </p>
    </MobileScreen>
  )
}
