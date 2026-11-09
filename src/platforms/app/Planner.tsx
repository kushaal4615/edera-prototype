import { motion } from 'framer-motion'
import { Check, ClipboardList, Compass, Eye, Languages, MessageCircle, Phone, Send, Sparkles } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { Badge, Chip } from '../../components/Badge'
import { Figure, StarRow, Stars, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { HeroImage } from '../../components/Media'
import { fmtShort, money } from '../../data/clock'
import { img } from '../../data/media'
import { PLANNER, personById } from '../../data/people'
import { PLANNERS, REVIEWS, plannerById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { MobileScreen, SectionHead, TopBar } from '../mobileShell'

/* app.planner: the planner the client assigned, the people who have used
   him, and the other planners nearby. "The client just assigns the planner
   to handle the rest." */

const HOW = [
  { icon: Compass, title: 'Finds and requests the vendors', body: 'Caterer, photographer, band: Tunde checks who is free on your date and sends the requests.' },
  { icon: ClipboardList, title: 'Keeps the run of show', body: 'Setup times, the cake, the first dance. Every vendor knows where to be and when.' },
  { icon: Eye, title: 'You see the summary', body: 'Every confirmation, reply and RSVP lands on your Home. You approve; he runs it.' },
]

export default function AppPlanner() {
  const { navigate, toast } = useNav()
  const region = useSession((s) => s.region)
  const requested = useSession((s) => s.plannerRequested)
  const me = plannerById('bakare')
  const reviews = REVIEWS.bakare

  let others = PLANNERS.filter((p) => p.id !== me.id && p.region === region)
  if (others.length < 3) others = PLANNERS.filter((p) => p.id !== me.id)

  const message = () => {
    session.viewThread('th1')
    track('message_planner')
    navigate('app.thread')
  }
  const request = (id: string, business: string) => {
    if (requested.includes(id)) {
      toast(`${business} already has your request`, 'info')
      return
    }
    session.requestPlanner(id)
    track('planner_request', id)
    toast(`Request sent to ${business}: they usually reply within a day`, 'accent')
  }

  return (
    <MobileScreen header={<TopBar title="Your planner" sub={PLANNER.business} tone="bg" />}>
      {/* ── profile: photo band with the face lapping it ── */}
      <div className="relative mx-5 mt-1 overflow-hidden rounded-[var(--r-container)]">
        <HeroImage src={me.photo} alt="A reception Bakare Events ran" className="h-[150px]" scrim="b" width={800} position="center 45%">
          <div className="flex h-full items-end justify-between p-4">
            <span className="label inline-flex h-6 items-center rounded-full bg-[rgb(255_255_255/0.16)] px-2.5 text-on-night ring-1 ring-inset ring-[rgb(255_255_255/0.3)]">Assigned · since {fmtShort('2026-10-30')}</span>
            <IconButton icon={Phone} label="Call Tunde" tone="scrim" size={40} onClick={() => toast('Calls go through the app in the build: WhatsApp-style, number kept private', 'info')} />
          </div>
        </HeroImage>
      </div>
      <div className="relative z-10 -mt-10 flex items-end gap-4 px-8">
        <Avatar who={PLANNER.photo} size={92} ring verified alt="" />
        <div className="min-w-0 flex-1 pb-1">
          <div className="flex items-center gap-2">
            <Verified size={14} />
            <Stars rating={me.rating} count={me.reviews} size={12} />
          </div>
        </div>
      </div>
      <div className="mt-3 px-5">
        <h1 className="grot text-[30px]">{PLANNER.name}</h1>
        <p className="mt-1 text-[14px] font-semibold text-text-2">
          {me.business} · {me.area}
        </p>
        <p className="mt-2 text-[14px] leading-snug text-text-2">{me.speciality}.</p>
      </div>

      {/* three figures in a tinted band */}
      <div className="mx-5 mt-4 grid grid-cols-3 divide-x divide-[var(--rule)] rounded-[var(--r-card)] bg-[var(--surface-tint)] py-3">
        {[
          { v: me.years, u: 'yrs', label: 'in operation' },
          { v: me.events, u: '', label: 'events run' },
          { v: '2h', u: '', label: 'typical reply' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center px-2">
            <Figure value={f.v} unit={f.u || undefined} size={28} />
            <span className="label mt-1 text-text-2">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 px-5">
        <Chip icon={<Languages size={13} strokeWidth={2.4} aria-hidden />}>{me.languages.join(' · ')}</Chip>
        <Chip>London</Chip>
        <Chip>Lagos</Chip>
      </div>

      <div className="mt-4 px-5">
        <Button size="lg" block icon={MessageCircle} onClick={message}>
          Message
        </Button>
      </div>

      {/* ── how it works ── */}
      <div className="relative mx-5 mt-8 overflow-hidden rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
        <span aria-hidden className="arc-soft" />
        <p className="label relative text-brass-light">How it works</p>
        <p className="grot relative mt-2 text-[24px]">
          Tunde handles the rest. <em>You</em> see the summary.
        </p>
        <ol className="relative mt-4 flex flex-col gap-3.5">
          {HOW.map((h, i) => (
            <li key={h.title} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[rgb(255_255_255/0.1)] text-brass-light">
                <h.icon size={15} strokeWidth={2.3} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-tight">
                  <span className="meta mr-1.5 text-on-ink-2">0{i + 1}</span>
                  {h.title}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-on-ink-2">{h.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── reviews ── */}
      <SectionHead className="mt-8" title="What clients say" eyebrow={`${me.reviews} reviews · ${me.rating.toFixed(1)}`} action="See all" onAction={() => toast(`${me.reviews} reviews arrive with the build: showing the latest three`, 'info')} />
      <ul className="mt-3 flex flex-col">
        {reviews.map((r) => {
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
              </div>
            </li>
          )
        })}
      </ul>

      {/* ── other planners ── */}
      <SectionHead className="mt-6" title="Other planners near you" eyebrow={region === 'uk' ? 'United Kingdom' : 'Nigeria'} />
      <p className="mt-1 px-5 text-[13px] text-text-2">Want a second opinion or a second event? Send a request; the planner replies on Edera.</p>
      <ul className="mt-2 flex flex-col">
        {others.map((p) => {
          const person = personById(p.person)
          const sent = requested.includes(p.id)
          return (
            <li key={p.id} className="relative px-5 py-3">
              <div className="flex items-center gap-3">
                <Pressable
                  onClick={() => {
                    session.viewPlannerListing(p.id)
                    toast(`${p.business}: ${p.speciality}. Full profiles arrive with the build`, 'info')
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="relative shrink-0">
                    <img src={img(p.photo, 300)} alt="" loading="lazy" className="h-[64px] w-[64px] rounded-[14px] object-cover" />
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-full ring-2 ring-[var(--bg)]">
                      <Avatar who={person.photo} size={26} alt="" />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[15px] font-bold leading-tight">{p.business}</p>
                      {p.verified && <Verified size={13} label={false} />}
                    </div>
                    <p className="truncate text-[12px] font-semibold text-text-2">
                      {person.name} · {p.area}
                    </p>
                    <div className="mt-1 flex items-center gap-2 whitespace-nowrap text-[12px] font-semibold text-text-2">
                      <Stars rating={p.rating} size={12} />
                      <span className="num">{p.years} yrs</span>
                      <span className="num truncate">from {money(p.from, p.currency)}</span>
                    </div>
                    {!p.verified && (
                      <Badge tone="neutral" className="mt-1">
                        Not yet verified
                      </Badge>
                    )}
                  </div>
                </Pressable>
                <motion.button
                  type="button"
                  whileTap={tap}
                  transition={spring.ui}
                  aria-pressed={sent}
                  onClick={() => request(p.id, p.business)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors duration-150 ${sent ? 'bg-accent-soft text-on-accent-soft' : 'bg-ink text-on-ink'}`}
                >
                  {sent ? <Check size={14} strokeWidth={2.6} aria-hidden /> : <Send size={14} strokeWidth={2.4} aria-hidden />}
                  {sent ? 'Requested' : 'Request'}
                </motion.button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mx-5 mt-6 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} strokeWidth={2.4} aria-hidden className="text-brass-ink" />
          <p className="text-[15px] font-bold">Prefer to pick vendors yourself?</p>
        </div>
        <p className="mt-1 text-[13px] text-text-2">The marketplace shows each vendor’s calendar, years in operation and reviews before you contact anyone.</p>
        <Button variant="outline" block className="mt-3" icon={Compass} onClick={() => navigate('app.explore')}>
          Browse vendors yourself
        </Button>
      </div>
    </MobileScreen>
  )
}
