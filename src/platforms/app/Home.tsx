import { motion } from 'framer-motion'
import { BadgeCheck, Bell, CalendarCheck, CalendarDays, ChevronRight, Compass, MapPin, MessageCircle, Sparkles, Star, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Figure, Money, Stars, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { BudgetBar, ProgressRing } from '../../components/Charts'
import { HeroImage, Rail } from '../../components/Media'
import { ago, daysUntil, fmtDay, money, pct } from '../../data/clock'
import { CLIENT_NOTICES, RUBY, RUBY_TOTALS, type Notice, type Role } from '../../data/events'
import { img } from '../../data/media'
import { CLIENT, PLANNER, personById } from '../../data/people'
import { categoryById, vendorById } from '../../data/vendors'
import { isScreenId, useNav } from '../../lib/navigation'
import { session, unreadClient, useLang, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { spring, tap, tapSoft } from '../../motion/springs'
import { MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* app.home: the client's portal summary. Dave on the call: the planner
   does most of the work; the client sees a summary of what has happened
   from their own portal. So: the event, the planner, what has happened,
   the team, the money and the guests, in that order. */

const KIND: Record<Notice['kind'], { icon: LucideIcon; cls: string }> = {
  booking: { icon: CalendarCheck, cls: 'bg-brass-soft text-on-brass-soft' },
  message: { icon: MessageCircle, cls: 'bg-info-soft text-on-info-soft' },
  guest: { icon: Users, cls: 'bg-accent-soft text-on-accent-soft' },
  verify: { icon: BadgeCheck, cls: 'bg-accent-soft text-on-accent-soft' },
  review: { icon: Star, cls: 'bg-brass-soft text-on-brass-soft' },
  system: { icon: Sparkles, cls: 'bg-[var(--surface-high)] text-text' },
}

const STATE_BADGE: Record<Role['state'], { tone: 'success' | 'warn' | 'info' | 'neutral'; label: string }> = {
  confirmed: { tone: 'success', label: 'Confirmed' },
  requested: { tone: 'warn', label: 'Requested' },
  shortlist: { tone: 'info', label: 'Shortlisted' },
  open: { tone: 'neutral', label: 'Open' },
}

export default function AppHome() {
  const { navigate, toast } = useNav()
  const { t } = useLang()
  const unread = useSession(unreadClient)
  const read = useSession((s) => s.readClient)

  const days = daysUntil(RUBY.date)
  const confirmed = RUBY.roles.filter((r) => r.state === 'confirmed')
  const requested = RUBY.roles.filter((r) => r.state === 'requested')
  const open = RUBY.roles.filter((r) => r.state === 'open')
  const confirmedAmount = confirmed.reduce((a, r) => a + r.budget, 0)
  const pendingAmount = RUBY.spent - confirmedAmount
  const left = RUBY.budget - RUBY.spent
  const notices = CLIENT_NOTICES.slice(0, 6)

  const openNotice = (n: Notice) => {
    session.readClient(n.id)
    track('notice_open', n.id)
    navigate(n.to && isScreenId(n.to) ? n.to : 'app.notifications')
  }

  const openRole = (r: Role) => {
    track('role_open', r.label)
    if (r.vendorId) {
      session.viewVendor(r.vendorId)
      navigate('app.vendor')
    } else {
      session.setCategory(r.category)
      navigate('app.explore')
    }
  }

  const messagePlanner = () => {
    session.viewThread('th1')
    track('message_planner')
    navigate('app.thread')
  }

  return (
    <MobileScreen tab="home" cap="var(--night)">
      {/* ── hero: the event ── */}
      <HeroImage src={RUBY.photo} alt="Guests raising glasses under string lights" className="w-full" scrim="both" width={1100} position="center 40%">
        <div className="flex min-h-[440px] flex-col px-5 pb-12" style={{ paddingTop: `calc(${SAFE_TOP} + 8px)` }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-on-night">{t('Good evening, Adaeze', 'Ẹ káalẹ́, Adaeze', 'Good evening o, Adaeze')}</p>
              <p className="text-[12px] font-semibold text-on-night-2">Sat 21 Nov · London</p>
            </div>
            <div className="flex items-center gap-2">
              <IconButton icon={Bell} label={unread ? `Notifications, ${unread} new` : 'Notifications'} tone="scrim" badge={unread} onClick={() => navigate('app.notifications')} />
              <motion.button type="button" whileTap={tap} transition={spring.ui} aria-label="Your profile and language" onClick={() => navigate('app.profile')} className="rounded-full ring-2 ring-[rgb(255_255_255/0.6)]">
                <Avatar who={CLIENT.photo} size={40} alt="" />
              </motion.button>
            </div>
          </div>

          <div className="flex-1" />

          <p className="label text-brass-light">
            {t('Your event', 'Ayẹyẹ rẹ', 'Your event')} · {RUBY.type}
          </p>
          <h1 className="grot mt-1.5 text-[32px] text-on-night">{RUBY.name}</h1>
          <div className="mt-3 flex items-end gap-4">
            <Figure value={days} unit={t('days', 'ọjọ́', 'days')} size={78} tone="var(--on-night)" />
            <div className="mb-2 flex flex-col gap-1 text-[13px] font-semibold text-on-night-2">
              <span className="label text-on-night-2">{t('to go', 'tó kù', 'remain')}</span>
              <span className="inline-flex items-center gap-1.5 text-on-night">
                <CalendarDays size={14} strokeWidth={2.3} aria-hidden />
                {fmtDay(RUBY.date, true)} · {RUBY.time}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} strokeWidth={2.3} aria-hidden />
                {RUBY.venue}
              </span>
            </div>
          </div>
        </div>
      </HeroImage>

      {/* ── planner card lapping the hero ── */}
      <div className="relative z-10 mx-5 -mt-8 rounded-[var(--r-container)] bg-[var(--surface)] p-3 shadow-[var(--shadow-floating)]">
        <Pressable onClick={() => navigate('app.planner')} className="flex items-center gap-3 rounded-[var(--r-card)] p-1">
          <Avatar who={PLANNER.photo} size={56} ring verified alt="" />
          <div className="min-w-0 flex-1">
            <p className="label text-text-2">{t('Your planner', 'Olùṣètò rẹ', 'Your planner')}</p>
            <p className="truncate text-[17px] font-bold leading-tight">{PLANNER.name}</p>
            <div className="mt-0.5 flex items-center gap-2.5 text-[12px] font-semibold text-text-2">
              <span className="truncate">{PLANNER.business}</span>
              <Verified size={14} label={false} />
              <Stars rating={PLANNER.rating} count={PLANNER.reviews} size={12} />
            </div>
          </div>
          <ChevronRight size={18} strokeWidth={2.2} aria-hidden className="shrink-0 text-text-3" />
        </Pressable>
        <div className="mt-2.5 flex items-center gap-3 border-t border-[var(--rule)] px-1 pt-2.5">
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-text-2">Tunde sent two vendor requests today. Both usually reply within a couple of hours.</p>
          <Button variant="ink" size="sm" icon={MessageCircle} onClick={messagePlanner}>
            Message
          </Button>
        </div>
      </div>

      {/* ── what's happened: timeline spine ── */}
      <SectionHead className="mt-8" title={t("What's happened", 'Ohun tó ti ṣẹlẹ̀', 'Wetin don happen')} eyebrow={`${unread} new`} action="See all" onAction={() => navigate('app.notifications')} />
      <motion.ol variants={listParent} initial="hidden" animate="show" className="relative mx-5 mt-3">
        <span aria-hidden className="pointer-events-none absolute bottom-6 left-[17px] top-6 w-px bg-[var(--rule-strong)]" />
        {notices.map((n) => {
          const k = KIND[n.kind]
          const isUnread = n.unread && !read.includes(n.id)
          return (
            <motion.li key={n.id} variants={listItem}>
              <Pressable onClick={() => openNotice(n)} className="flex items-start gap-3 py-2.5">
                <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-[var(--bg)] ${k.cls}`}>
                  <k.icon size={16} strokeWidth={2.3} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`truncate text-[15px] leading-tight ${isUnread ? 'font-extrabold' : 'font-bold'}`}>{n.title}</p>
                    <span className="meta shrink-0 text-text-2">{ago(n.minutesAgo)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-text-2">{n.body}</p>
                </div>
                {isUnread && <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brass" />}
              </Pressable>
            </motion.li>
          )
        })}
      </motion.ol>

      {/* ── the team: rail bleeding off the right edge ── */}
      <SectionHead className="mt-6" title={t('Your team', 'Àwọn olùpèsè', 'Your team')} eyebrow={`${confirmed.length} confirmed · ${requested.length} requested · ${open.length} open`} action="Bookings" onAction={() => navigate('app.bookings')} />
      <Rail className="mt-3 pb-2">
        {RUBY.roles.map((r) => {
          const v = r.vendorId ? vendorById(r.vendorId) : null
          const photo = v ? v.photos[0] : categoryById(r.category).photo
          const b = STATE_BADGE[r.state]
          return (
            <motion.button key={r.label} type="button" whileTap={tapSoft} transition={spring.ui} onClick={() => openRole(r)} className={`block w-[156px] shrink-0 snap-start overflow-hidden rounded-[var(--r-card)] text-left ${r.state === 'open' ? 'bg-[var(--surface-high)]' : 'bg-[var(--surface)] shadow-[var(--shadow-raised)]'}`}>
              <div className="relative h-[96px] overflow-hidden">
                <img src={img(photo, 400)} alt="" loading="lazy" className={`h-full w-full object-cover ${r.state === 'open' ? 'opacity-70 grayscale' : ''}`} />
                <Badge tone={b.tone} className="absolute left-2 top-2 shadow-[var(--shadow-raised)]">
                  {b.label}
                </Badge>
                {v && (
                  <span className="absolute -bottom-3 right-2 rounded-full ring-2 ring-[var(--surface)]">
                    <Avatar who={personById(v.owner).photo} size={28} alt="" />
                  </span>
                )}
              </div>
              <div className="p-3 pt-4">
                <p className="label text-text-2">{r.label}</p>
                <p className="mt-0.5 truncate text-[14px] font-bold leading-tight">{v ? v.name : `Find a ${r.label.toLowerCase()}`}</p>
                <p className="num mt-1 text-[13px] font-semibold text-text-2">{r.state === 'open' ? `Budget ${money(r.budget, RUBY.currency)}` : money(r.budget, RUBY.currency)}</p>
              </div>
            </motion.button>
          )
        })}
        <motion.button
          type="button"
          whileTap={tapSoft}
          transition={spring.ui}
          onClick={() => {
            session.setCategory(null)
            navigate('app.explore')
          }}
          className="grid w-[120px] shrink-0 snap-start place-items-center rounded-[var(--r-card)] bg-accent-soft text-on-accent-soft"
        >
          <span className="flex flex-col items-center gap-2 px-3 text-center">
            <Compass size={24} strokeWidth={2.2} aria-hidden />
            <span className="text-[13px] font-bold leading-tight">Browse the marketplace</span>
          </span>
        </motion.button>
      </Rail>

      {/* ── budget: ink block ── */}
      <div className="relative mx-5 mt-6 overflow-hidden rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
        <span aria-hidden className="arc-soft" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="label text-brass-light">{t('Budget', 'Ìṣúná', 'Budget')}</p>
            <Money amount={RUBY.spent} currency={RUBY.currency} size={44} tone="var(--on-ink)" className="mt-1 block" />
            <p className="mt-1 text-[13px] font-semibold text-on-ink-2">
              of {money(RUBY.budget, RUBY.currency)} · {pct(RUBY.spent, RUBY.budget)}% committed
            </p>
          </div>
          <div className="text-right">
            <p className="label text-on-ink-2">Left</p>
            <p className="num mt-1 text-[22px] font-bold">{money(left, RUBY.currency)}</p>
          </div>
        </div>
        <div className="relative mt-4">
          <BudgetBar regular={confirmedAmount} overtime={pendingAmount} max={RUBY.budget} height={12} />
        </div>
        <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold text-on-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" style={{ background: 'var(--ever-500)' }} />
            Confirmed {money(confirmedAmount, RUBY.currency)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brass" />
            Awaiting vendor replies {money(pendingAmount, RUBY.currency)}
          </span>
        </div>
        <p className="meta relative mt-3 text-on-ink-2">Settled outside Edera · payments in a later phase</p>
      </div>

      {/* ── guests: asymmetric bento ── */}
      <SectionHead className="mt-8" title={t('Guests', 'Àlejò', 'Guests')} eyebrow={`${RUBY_TOTALS.invited} invited`} action="Guest list" onAction={() => navigate('app.guests')} />
      <div className="mx-5 mt-3 grid grid-cols-5 gap-3">
        <Pressable onClick={() => navigate('app.guests')} className="col-span-3 row-span-2 flex flex-col justify-between rounded-[var(--r-container)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
          <div className="flex items-center justify-between">
            <p className="label text-text-2">RSVPs</p>
            <ChevronRight size={16} strokeWidth={2.2} aria-hidden className="text-text-3" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProgressRing value={pct(RUBY_TOTALS.yes, RUBY_TOTALS.invited)} size={76} stroke={8}>
              <span className="num text-[18px] font-extrabold leading-none">{pct(RUBY_TOTALS.yes, RUBY_TOTALS.invited)}%</span>
            </ProgressRing>
            <div>
              <Figure value={RUBY_TOTALS.yes} unit="yes" size={40} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold text-text-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-danger" />
              {RUBY_TOTALS.no} no
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brass" />
              {RUBY_TOTALS.pending} pending
            </span>
          </div>
        </Pressable>
        <Pressable onClick={() => navigate('app.invite')} className="col-span-2 flex flex-col justify-between rounded-[var(--r-card)] bg-brass-soft p-3 text-on-brass-soft">
          <p className="label">QR invites</p>
          <p className="num mt-2 text-[22px] font-extrabold leading-none">
            {RUBY_TOTALS.invitesSent}
            <span className="text-[13px] font-bold text-on-brass-soft">/{RUBY_TOTALS.invited}</span>
          </p>
          <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-[rgb(94_63_10/0.18)]">
            <span className="block h-full rounded-full bg-brass" style={{ width: `${pct(RUBY_TOTALS.invitesSent, RUBY_TOTALS.invited)}%` }} />
          </span>
          <p className="mt-1.5 text-[11px] font-bold">{RUBY_TOTALS.invited - RUBY_TOTALS.invitesSent} still to send</p>
        </Pressable>
        <Pressable onClick={() => navigate('app.guests')} className="col-span-2 flex flex-col justify-between rounded-[var(--r-card)] bg-accent p-3 text-on-accent">
          <p className="label text-on-accent-2">Tables</p>
          <p className="num mt-2 text-[22px] font-extrabold leading-none">{RUBY_TOTALS.tables}</p>
          <p className="mt-1.5 text-[11px] font-bold text-on-accent-2">10 seats each · plan locks 13 Feb</p>
        </Pressable>
      </div>

      {/* ── checklist peek ── */}
      <div className="mx-5 mt-6">
      <Pressable onClick={() => navigate('app.event')} className="flex items-center gap-4 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
        <div className="min-w-0 flex-1">
          <p className="label text-text-2">Checklist</p>
          <p className="mt-0.5 text-[15px] font-bold">
            {RUBY.checklistDone} of {RUBY.checklistTotal} done
          </p>
          <p className="text-[13px] text-text-2">Next: caterer confirmed · due Sat 28 Nov</p>
        </div>
        <ProgressRing value={pct(RUBY.checklistDone, RUBY.checklistTotal)} size={48} stroke={5} color="var(--brass)">
          <span className="num text-[11px] font-extrabold">{pct(RUBY.checklistDone, RUBY.checklistTotal)}%</span>
        </ProgressRing>
        <ChevronRight size={18} strokeWidth={2.2} aria-hidden className="text-text-3" />
      </Pressable>
      </div>

      <button type="button" onClick={() => toast('Edera shows a summary; Tunde handles the rest from the Planner app', 'info')} className="mx-auto mt-6 flex h-11 items-center gap-2 px-5 text-[13px] font-bold text-text-2">
        <Sparkles size={14} strokeWidth={2.3} aria-hidden />
        How does this summary stay up to date?
      </button>
    </MobileScreen>
  )
}
