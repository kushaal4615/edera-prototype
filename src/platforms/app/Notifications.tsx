import { motion } from 'framer-motion'
import { BadgeCheck, CalendarCheck2, CheckCheck, MessageCircle, Sparkles, Star, Users, type LucideIcon } from 'lucide-react'
import { Badge } from '../../components/Badge'
import { Pressable } from '../../components/Button'
import { ago } from '../../data/clock'
import { CLIENT_NOTICES, type Notice } from '../../data/events'
import { useNav, type ScreenId } from '../../lib/navigation'
import { session, unreadClient, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { MobileScreen, TopBar } from '../mobileShell'

/* app.notifications: the client's feed, grouped Today / Earlier on a
   timeline spine. Every row opens the screen it talks about. */

const KIND: Record<Notice['kind'], { icon: LucideIcon; bg: string; fg: string; label: string }> = {
  booking: { icon: CalendarCheck2, bg: 'bg-accent-soft', fg: 'text-on-accent-soft', label: 'Bookings' },
  message: { icon: MessageCircle, bg: 'bg-info-soft', fg: 'text-on-info-soft', label: 'Messages' },
  guest: { icon: Users, bg: 'bg-brass-soft', fg: 'text-on-brass-soft', label: 'Guests' },
  verify: { icon: BadgeCheck, bg: 'bg-success-soft', fg: 'text-on-success-soft', label: 'Verification' },
  system: { icon: Sparkles, bg: 'bg-[var(--surface-high)]', fg: 'text-text', label: 'Edera' },
  review: { icon: Star, bg: 'bg-brass-soft', fg: 'text-on-brass-soft', label: 'Reviews' },
}
const DAY = 60 * 24

export default function AppNotifications() {
  const { navigate, toast } = useNav()
  const read = useSession((s) => s.readClient)
  const unread = useSession((s) => unreadClient(s))
  const isUnread = (n: Notice) => n.unread && !read.includes(n.id)
  const today = CLIENT_NOTICES.filter((n) => n.minutesAgo < DAY)
  const earlier = CLIENT_NOTICES.filter((n) => n.minutesAgo >= DAY)
  const byKind = (Object.keys(KIND) as Notice['kind'][]).map((k) => ({ k, n: CLIENT_NOTICES.filter((x) => x.kind === k).length })).filter((x) => x.n > 0)

  const open = (n: Notice) => {
    track('open_notification', n.id)
    session.readClient(n.id)
    if (n.to === 'app.thread') session.viewThread('th2')
    if (n.to) navigate(n.to as ScreenId)
    else toast(n.title)
  }
  const markAll = () => {
    session.readAllClient()
    toast('All notifications marked as read', 'accent')
  }

  const group = (title: string, items: Notice[]) => (
    <section className="mt-5">
      <div className="flex items-end justify-between px-5">
        <h2 className="grot text-[22px]">{title}</h2>
        <span className="meta text-text-2">
          {items.length} · {items.filter(isUnread).length} new
        </span>
      </div>
      <motion.ol variants={listParent} initial="hidden" animate="show" className="relative mt-2">
        <span aria-hidden className="pointer-events-none absolute bottom-6 left-[43px] top-4 w-px bg-[var(--rule-strong)]" />
        {items.map((n) => {
          const k = KIND[n.kind]
          const un = isUnread(n)
          return (
            <motion.li key={n.id} variants={listItem} className="relative">
              <Pressable onClick={() => open(n)} aria-label={`${n.title}${un ? ', unread' : ''}`} className={un ? 'bg-[var(--surface)]' : ''}>
                <span className="flex items-start gap-3.5 px-5 py-3.5">
                  <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${k.bg} ${k.fg} ring-4 ring-[var(--bg)]`}>
                    <k.icon size={20} strokeWidth={2.2} aria-hidden />
                    {un && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brass ring-2 ring-[var(--bg)]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-[15px] ${un ? 'font-extrabold' : 'font-bold'}`}>{n.title}</span>
                      <span className={`meta shrink-0 ${un ? 'text-brass-ink' : 'text-text-2'}`}>{ago(n.minutesAgo)}</span>
                    </span>
                    <span className={`mt-0.5 line-clamp-2 block text-[13px] leading-snug ${un ? 'text-text' : 'text-text-2'}`}>{n.body}</span>
                  </span>
                </span>
              </Pressable>
            </motion.li>
          )
        })}
      </motion.ol>
    </section>
  )

  return (
    <MobileScreen
      header={
        <TopBar
          title="Notifications"
          sub={unread ? `${unread} unread` : 'All caught up'}
          right={
            <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={markAll} className="flex h-10 items-center gap-1 rounded-full px-2 text-[13px] font-bold text-accent-ink">
              <CheckCheck size={16} aria-hidden />
              Read all
            </motion.button>
          }
        />
      }
    >
      {/* count block + kinds */}
      <div className="flex items-end justify-between gap-4 px-5 pt-1">
        <div className="shrink-0">
          <span className="figure num block text-[72px] text-brass-ink">{unread}</span>
          <span className="label block whitespace-nowrap text-text-2">{unread === 1 ? 'new update' : 'new updates'}</span>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5 pb-4">
          {byKind.map(({ k, n }) => (
            <Badge key={k} icon={<span className={`h-2 w-2 rounded-full ${k === 'booking' ? 'bg-accent' : k === 'guest' ? 'bg-brass' : k === 'message' ? 'bg-info' : 'bg-booked'}`} />}>
              {n} {KIND[k].label}
            </Badge>
          ))}
        </div>
      </div>
      <p className="mt-1 px-5 text-[13px] text-text-2">Bookings, RSVPs and messages for Ngozi & Emeka’s anniversary. Tunde gets the same feed.</p>

      {group('Today', today)}
      {group('Earlier', earlier)}

      <p className="mx-5 mt-5 rounded-[var(--r-card)] bg-[var(--surface-tint)] px-4 py-3 text-[12px] leading-snug text-text-2">
        <span className="font-bold text-text">Real-time.</span> A vendor’s accept or decline reaches you here within seconds, plus a push and a WhatsApp copy if you want one.
      </p>
    </MobileScreen>
  )
}
