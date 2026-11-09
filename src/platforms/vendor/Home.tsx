import { motion } from 'framer-motion'
import { Bell, BellRing, CalendarDays, ChevronRight, MessageCircle, Pencil, Radio, ShieldCheck, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { AvailPill, Figure, Money, StarRow, Strip, StripLegend, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { ProgressRing } from '../../components/Charts'
import { HeroImage } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { addDays, ago, CLOCK, fmtDay, fmtShort } from '../../data/clock'
import { eventById, REQUESTS, requestById, TONIGHT, TONIGHT_TOTALS, VENDOR_NOTICES, type Notice } from '../../data/events'
import { img } from '../../data/media'
import { personById, PLANNER, VENDOR } from '../../data/people'
import { availabilityOn, REVIEWS, vendorById, type Availability, type Vendor } from '../../data/vendors'
import { isScreenId, useNav } from '../../lib/navigation'
import { requestState, session, unreadVendor, useSession, type SessionState } from '../../lib/store'
import { track } from '../../lib/tracker'
import { fadeUp, listItem, listParent } from '../../motion/transitions'
import { tap } from '../../motion/springs'
import { MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* vendor.home — "Today". A night block with the brass arc carries the
   greeting, the bell and tonight's LIVE strip. Tunde's request is the
   hero: a photograph lapping a brass block. Then the two availability
   strips, an asymmetric counts bento, the latest review as an editorial
   quote, and profile strength as a ring. */

const MINE = ['iyabola', 'ola-hall']
const CATERING = vendorById('iyabola')
const HALL = vendorById('ola-hall')

/** The listing's calendar with this session's decisions and blocks laid over it. */
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

const KIND_ICON: Record<Notice['kind'], typeof Bell> = { booking: CalendarDays, message: MessageCircle, guest: Users, verify: ShieldCheck, system: Bell, review: Star }

export default function VendorHome() {
  const { navigate, toast } = useNav()
  const s = useSession((x) => x)
  const unread = unreadVendor(s)
  const [bell, setBell] = useState(false)

  const catering = withSession(CATERING, s)
  const hall = withSession(HALL, s)
  const rq1 = requestById('rq1')
  const rq1State = requestState('rq1', s)
  const rq1Event = eventById(rq1.eventId)
  const rq1Avail = availabilityOn(catering, rq1.date)

  const inbox = REQUESTS.filter((r) => MINE.includes(r.vendorId))
  const newCount = inbox.filter((r) => requestState(r.id, s) === 'requested').length
  const in30 = addDays(CLOCK.todayIso, 30)
  const confirmedSoon = inbox.filter((r) => r.date >= CLOCK.todayIso && r.date <= in30 && ['confirmed', 'accepted'].includes(requestState(r.id, s))).sort((a, b) => a.date.localeCompare(b.date))
  const monthValue = inbox.filter((r) => r.date.slice(0, 7) === CLOCK.todayIso.slice(0, 7) && ['confirmed', 'accepted', 'completed'].includes(requestState(r.id, s))).reduce((a, r) => a + r.amount, 0)
  const review = REVIEWS.iyabola[0]
  const reviewer = personById(review.by)

  const openNotice = (n: Notice) => {
    session.readVendor(n.id)
    setBell(false)
    track('vendor_notice_open', n.id)
    if (n.to === 'vendor.request') session.viewRequest('rq1')
    if (!n.to || n.to === 'vendor.home') {
      toast(`Thread opens in Inbox: ${n.title}`, 'info')
      return
    }
    if (isScreenId(n.to)) navigate(n.to)
  }

  return (
    <MobileScreen
      tab="vToday"
      cap="var(--night)"
      overlay={
        <BottomSheet open={bell} onClose={() => setBell(false)} title="Notifications" tall>
          <div className="flex items-center justify-between pb-2">
            <p className="text-[13px] font-semibold text-text-2">{unread ? `${unread} unread` : 'All caught up'}</p>
            <button type="button" onClick={() => session.readAllVendor()} className="h-9 text-[13px] font-bold text-accent-ink">
              Mark all read
            </button>
          </div>
          <ul className="flex flex-col">
            {VENDOR_NOTICES.map((n) => {
              const isUnread = n.unread && !s.readVendor.includes(n.id)
              const Icon = KIND_ICON[n.kind]
              return (
                <li key={n.id}>
                  <Pressable onClick={() => openNotice(n)} className="flex items-start gap-3 rounded-[var(--r-card)] px-2 py-3">
                    <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full ${isUnread ? 'bg-brass-soft text-on-brass-soft' : 'bg-[var(--surface-high)] text-text-2'}`}>
                      <Icon size={18} strokeWidth={2.2} aria-hidden />
                      {isUnread && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-brass ring-2 ring-[var(--surface)]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[15px] ${isUnread ? 'font-bold text-text' : 'font-semibold text-text'}`}>{n.title}</span>
                        <span className="meta shrink-0 text-text-2">{ago(n.minutesAgo)}</span>
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-text-2">{n.body}</span>
                    </span>
                  </Pressable>
                </li>
              )
            })}
          </ul>
        </BottomSheet>
      }
    >
      {/* ── Night block: greeting + tonight ── */}
      <section className="relative overflow-hidden bg-night text-on-night" style={{ paddingTop: `calc(${SAFE_TOP} + 8px)` }}>
        <span aria-hidden className="arc" style={{ bottom: '-30%', right: '-22%', width: '64%', opacity: 0.8 }} />
        <span aria-hidden className="grain" />
        <div className="relative flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full" style={{ boxShadow: '0 0 0 2px var(--night), 0 0 0 4px var(--brass)' }}>
              <Avatar who={VENDOR.photo} size={48} alt="Bola Fashola" />
            </span>
            <div>
              <p className="label text-brass-light">{CLOCK.date} · {CLOCK.time}</p>
              <h1 className="grot mt-0.5 text-[28px]">Good evening, Bola</h1>
            </div>
          </div>
          <IconButton icon={unread ? BellRing : Bell} label={unread ? `Notifications, ${unread} unread` : 'Notifications'} tone="scrim" badge={unread} onClick={() => setBell(true)} className="ring-1 ring-[rgb(255_255_255/0.12)]" />
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative mx-5 mt-5 mb-6">
          <Pressable onClick={() => navigate('vendor.bookings')} className="flex items-center gap-3 rounded-[var(--r-card)] bg-[rgb(255_255_255/0.08)] p-3 ring-1 ring-[rgb(255_255_255/0.1)] backdrop-blur-md">
            <img src={img(TONIGHT.photo, 200)} alt="" loading="lazy" className="h-[52px] w-[52px] shrink-0 rounded-[12px] object-cover" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span aria-hidden className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ever-400)] opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--ever-400)]" />
                </span>
                <span className="label text-[var(--ever-300)]">Live · Olá Event Hall</span>
              </span>
              <span className="mt-0.5 block truncate text-[15px] font-bold">Adaora &amp; Kunle · Engagement Dinner</span>
              <span className="block text-[12px] font-semibold text-on-night-2">
                Service running · small chops 19:15 · {TONIGHT_TOTALS.checkedIn} of {TONIGHT_TOTALS.expected} in
              </span>
            </span>
            <ChevronRight size={20} className="shrink-0 text-on-night-2" aria-hidden />
          </Pressable>
        </motion.div>
      </section>

      {/* ── The new request: photo lapping a brass block ── */}
      <section className="relative mt-5 px-5" aria-label="New request">
        <div className="flex items-end justify-between">
          <p className="label text-brass-ink">{rq1State === 'requested' ? `New request · ${ago(rq1.sentMinutesAgo)}` : rq1State === 'confirmed' ? 'Confirmed this session' : rq1State === 'declined' ? 'Declined' : 'New date proposed'}</p>
          <button type="button" onClick={() => navigate('vendor.requests')} className="flex h-9 items-center text-[13px] font-bold text-accent-ink">
            All {newCount} new
          </button>
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: 0.08 }} className="relative mt-2">
          <HeroImage src={rq1Event.photo} alt="Guests raising glasses under string lights" className="relative z-10 mx-2 h-[172px] rounded-[var(--r-card)] shadow-[var(--shadow-raised)]" scrim="b">
            <div className="flex h-full flex-col justify-end p-4 text-on-night">
              <div className="flex items-center gap-2">
                <Badge tone="ink" className="bg-[rgb(255_255_255/0.16)]">{rq1Event.type}</Badge>
                <span className="meta text-on-night-2">{rq1Event.venue}</span>
              </div>
              <p className="grot mt-1.5 text-[24px]">{rq1Event.name}</p>
            </div>
          </HeroImage>
          <div className="relative -mt-8 overflow-hidden rounded-[var(--r-container)] bg-brass px-5 pb-5 pt-12 text-on-brass">
            <span aria-hidden className="dots-light" />
            <div className="relative flex items-center gap-3">
              <Avatar who={PLANNER.photo} size={44} alt="Tunde Bakare" verified />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[15px] font-bold">
                  {PLANNER.name}
                  <Verified tone="accent" className="text-[var(--ever-900)]" />
                </p>
                <p className="text-[12px] font-semibold text-[var(--ever-950)]/80">{PLANNER.business} · planner · {PLANNER.eventsDone} events</p>
              </div>
              <Money amount={rq1.amount} size={26} tone="var(--ever-950)" />
            </div>
            <p className="relative mt-3 text-[14px] font-semibold leading-snug">
              {fmtDay(rq1.date, true)} · {rq1.headcount} guests · Premium buffet
            </p>
            <div className="relative mt-3 flex flex-wrap items-center gap-2">
              <AvailPill state={rq1Avail}>
                {rq1Avail === 'held' ? 'Held for this request' : rq1Avail === 'free' ? 'Free' : rq1Avail === 'booked' ? 'Booked' : 'Unavailable'} · {fmtShort(rq1.date)}
              </AvailPill>
              <span className="text-[12px] font-bold text-[var(--ever-950)]/80">Catering listing</span>
            </div>
            <Button
              variant="ink"
              block
              className="relative mt-4"
              trailing={ChevronRight}
              onClick={() => {
                session.viewRequest('rq1')
                track('vendor_review_request', 'rq1')
                navigate('vendor.request')
              }}
            >
              {rq1State === 'requested' ? 'Review request' : 'Open request'}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Next 14 days ── */}
      <section className="mt-8">
        <SectionHead eyebrow="Availability" title="Next 14 days" action="Calendar" onAction={() => navigate('vendor.calendar')} />
        <Pressable onClick={() => navigate('vendor.calendar')} className="mt-3 px-5">
          <div className="flex flex-col gap-4 rounded-[var(--r-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
            {[catering, hall].map((v) => (
              <div key={v.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[13px] font-bold">{v.name}</span>
                  <span className="meta text-text-2">{Array.from({ length: 14 }, (_, i) => availabilityOn(v, addDays(CLOCK.todayIso, i))).filter((x) => x === 'free').length} free of 14</span>
                </div>
                <Strip vendor={v} size="sm" labels />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <StripLegend />
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--blocked)]" />
                Blocked
              </span>
            </div>
          </div>
        </Pressable>
      </section>

      {/* ── Counts bento ── */}
      <section className="mt-8 px-5" aria-label="This month">
        <motion.div variants={listParent} initial="hidden" animate="show" className="grid grid-cols-5 gap-3">
          <motion.div variants={listItem} className="col-span-2">
            <Pressable onClick={() => navigate('vendor.requests')} className="flex h-full flex-col justify-between rounded-[var(--r-card)] bg-ink p-4 text-on-ink">
              <span className="label text-on-ink-2">New requests</span>
              <Figure value={newCount} size={64} tone="var(--brass-light)" />
              <span className="flex items-center gap-1 text-[12px] font-bold">
                Reply within 2h <ChevronRight size={14} aria-hidden />
              </span>
            </Pressable>
          </motion.div>
          <div className="col-span-3 flex flex-col gap-3">
            <motion.div variants={listItem}>
              <Pressable onClick={() => navigate('vendor.bookings')} className="flex items-center justify-between rounded-[var(--r-card)] bg-accent-soft p-4 text-on-accent-soft">
                <span>
                  <span className="label block">Confirmed · 30 days</span>
                  <span className="mt-1 block text-[12px] font-semibold">{confirmedSoon.map((r) => fmtShort(r.date)).join(' · ') || 'None yet'}</span>
                </span>
                <Figure value={confirmedSoon.length} size={40} />
              </Pressable>
            </motion.div>
            <motion.div variants={listItem}>
              <Pressable onClick={() => navigate('vendor.bookings')} className="rounded-[var(--r-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
                <span className="label block text-text-2">Bookings value · Nov</span>
                <Money amount={monthValue} size={30} className="mt-1 block" />
                <span className="mt-1 block text-[11px] font-semibold text-text-2">Settled outside Edera · payments in a later phase</span>
              </Pressable>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Latest review: editorial quote ── */}
      <section className="mt-8">
        <SectionHead eyebrow="Reviews" title={<>Latest from <em>guests</em></>} action="All 212" onAction={() => navigate('vendor.reviews')} />
        <Pressable onClick={() => navigate('vendor.reviews')} className="mt-3 px-5">
          <blockquote className="relative border-l-[3px] border-brass pl-4">
            <StarRow rating={review.rating} size={13} />
            <p className="grot mt-2 text-[20px] leading-[1.15]">“{review.text}”</p>
            <footer className="mt-3 flex items-center gap-2.5">
              <Avatar who={reviewer.photo} size={28} alt="" />
              <span className="whitespace-nowrap text-[13px] font-bold">{reviewer.name}</span>
              <span className="meta min-w-0 truncate text-text-2">· {review.event} · {fmtShort(review.date)}</span>
            </footer>
            {review.reply && <p className="mt-2 text-[12px] font-semibold text-accent-ink">You replied · {ago(60 * 24 * 12)}</p>}
          </blockquote>
        </Pressable>
      </section>

      {/* ── Profile strength ── */}
      <section className="mt-8 px-5">
        <Pressable onClick={() => navigate('vendor.verification')} className="flex items-center gap-4 rounded-[var(--r-container)] bg-[var(--surface-tint)] p-4">
          <ProgressRing value={86} size={68} stroke={7} color="var(--accent)">
            <span className="figure num text-[20px]">
              86<span className="unit">%</span>
            </span>
          </ProgressRing>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[15px] font-bold">
              Profile strength <Verified size={14} />
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-on-warn-soft">
              <ShieldCheck size={14} aria-hidden /> Hygiene certificate expires in 112 days
            </span>
            <span className="mt-0.5 block text-[12px] text-text-2">Upload the renewed FHRS certificate to keep your badge.</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-text-2" aria-hidden />
        </Pressable>
        <div className="mt-3 flex gap-2">
          <motion.button type="button" whileTap={tap} onClick={() => navigate('vendor.listings')} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--surface)] text-[14px] font-bold shadow-[var(--shadow-raised)]">
            <Pencil size={16} aria-hidden /> Edit listings
          </motion.button>
          <motion.button type="button" whileTap={tap} onClick={() => navigate('vendor.bookings')} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--surface)] text-[14px] font-bold shadow-[var(--shadow-raised)]">
            <Radio size={16} aria-hidden /> Tonight’s booking
          </motion.button>
        </div>
      </section>
    </MobileScreen>
  )
}
