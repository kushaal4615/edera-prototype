import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  Bell,
  BellRing,
  CalendarCheck2,
  ChartColumn,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Search,
  Settings2,
  Store,
  Users as UsersIcon,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Mark } from '../../components/Brand'
import { Avatar } from '../../components/Avatar'
import { DEMO_ADMIN_SEARCH } from '../../data/demoFill'
import { FLAGGED, VERIFY_QUEUE } from '../../data/admin'
import { OWNER } from '../../data/people'
import { CLOCK } from '../../data/clock'
import { useNav, type AdminScreenId } from '../../lib/navigation'
import { getSession, useSession, type SessionState } from '../../lib/store'
import { spring } from '../../motion/springs'

/* The Edera Admin shell: evergreen sidebar, header with search, the
   verification queue count, scrolling main. Under 768px it becomes an
   app bar + drawer + bottom tab bar (phone-browser view). */

type NavItem = { id: AdminScreenId; label: string; icon: LucideIcon; count?: (s: SessionState) => number }

/** Verification cases still waiting after this session's decisions */
export const pendingCases = (s: SessionState = getSession()) => VERIFY_QUEUE.filter((v) => (v.state === 'pending' || v.state === 'info') && !s.verifyDecisions[v.id]).length
/** Flagged reviews still open */
export const openFlags = (s: SessionState = getSession()) => FLAGGED.filter((f) => f.state === 'open' && !s.reviewDecisions[f.id]).length

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Platform',
    items: [{ id: 'admin.overview', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    title: 'Trust',
    items: [
      { id: 'admin.verification', label: 'Verification', icon: BadgeCheck, count: pendingCases },
      { id: 'admin.reviews', label: 'Reviews & reports', icon: MessageSquareWarning, count: openFlags },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { id: 'admin.users', label: 'Users & roles', icon: UsersIcon },
      { id: 'admin.marketplace', label: 'Listings & categories', icon: Store },
      { id: 'admin.bookings', label: 'Events & bookings', icon: CalendarCheck2 },
    ],
  },
  {
    title: 'Growth',
    items: [
      { id: 'admin.notifications', label: 'Notifications', icon: BellRing },
      { id: 'admin.reports', label: 'Reports', icon: ChartColumn },
    ],
  },
  {
    title: 'Settings',
    items: [{ id: 'admin.settings', label: 'Platform settings', icon: Settings2 }],
  },
]

const PHONE_TABS: NavItem[] = [
  { id: 'admin.overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'admin.verification', label: 'Verify', icon: BadgeCheck },
  { id: 'admin.users', label: 'Users', icon: UsersIcon },
  { id: 'admin.bookings', label: 'Bookings', icon: CalendarCheck2 },
]

/** The console frame. `bleed` drops the default title block so a page can start with its own header band. */
export function ConsoleShell({ active, title, sub, actions, children, bleed = false }: { active: AdminScreenId; title: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode; bleed?: boolean }) {
  const { reset, navigate, toast } = useNav()
  const [collapsed, setCollapsed] = useState(false)
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState(DEMO_ADMIN_SEARCH)
  const [drawer, setDrawer] = useState(false)
  const pending = useSession(pendingCases)

  const submitSearch = () => {
    if (!q.trim()) return toast('Type a name, business or city to search', 'neutral')
    toast(`Showing results for “${q.trim()}”`, 'accent')
    navigate('admin.users')
  }

  return (
    <div data-admin-root className="relative flex h-full bg-bg">
      <motion.aside className="relative z-20 flex shrink-0 flex-col bg-ink text-on-ink max-md:hidden" animate={{ width: collapsed ? 76 : 248 }} transition={spring.ui}>
        <div className="flex h-[68px] shrink-0 items-center gap-2.5 px-5">
          <Mark size={30} tone="light" />
          {!collapsed && (
            <span className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="display text-[20px] leading-none text-on-ink">
                e-dera<span className="text-brass">.</span>
              </span>
              <span className="label text-on-ink-2">Admin</span>
            </span>
          )}
        </div>
        <nav aria-label="Edera admin" className="scroll-y flex-1 px-3 pb-4">
          {GROUPS.map((g) => (
            <div key={g.title} className="mt-4 first:mt-2">
              {!collapsed && <p className="label px-3 pb-2 text-on-ink-2">{g.title}</p>}
              <ul className="flex flex-col gap-0.5">
                {g.items.map((it) => {
                  const on = it.id === active
                  const count = it.count ? it.count(getSession()) : undefined
                  return (
                    <li key={it.id}>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={spring.ui}
                        onClick={() => reset(it.id)}
                        aria-current={on ? 'page' : undefined}
                        title={collapsed ? it.label : undefined}
                        className={`flex h-10 w-full items-center gap-3 rounded-[var(--r-control)] px-3 text-[14px] font-semibold transition-colors duration-150 ${on ? 'bg-brass text-on-brass' : 'text-on-ink hover:bg-[rgb(255_255_255/0.08)]'}`}
                      >
                        <it.icon size={18} strokeWidth={2.1} className="shrink-0" aria-hidden />
                        {!collapsed && <span className="flex-1 truncate text-left">{it.label}</span>}
                        {!collapsed && count !== undefined && count > 0 && (
                          <span className={`num rounded-full px-2 py-0.5 text-[11px] font-bold ${on ? 'bg-[rgb(0_0_0/0.15)]' : 'bg-brass text-on-brass'}`}>{count}</span>
                        )}
                      </motion.button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-[rgb(255_255_255/0.12)] p-3">
          <button type="button" onClick={() => setCollapsed((c) => !c)} className="mb-1 flex h-10 w-full items-center gap-3 rounded-[var(--r-control)] px-3 text-[13px] font-semibold text-on-ink-2 hover:bg-[rgb(255_255_255/0.08)]" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={18} aria-hidden /> : <ChevronsLeft size={18} aria-hidden />}
            {!collapsed && 'Collapse'}
          </button>
          <button type="button" onClick={() => reset('admin.signin')} className="flex h-10 w-full items-center gap-3 rounded-[var(--r-control)] px-3 text-[13px] font-semibold text-on-ink-2 hover:bg-[rgb(255_255_255/0.08)]">
            <LogOut size={18} aria-hidden />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <PhoneAppBar title={title} active={active} onMenu={() => setDrawer(true)} onSearch={submitSearch} q={q} setQ={setQ} />
        <header className="relative z-30 flex h-[68px] shrink-0 items-center gap-4 border-b border-[var(--rule)] bg-[var(--surface)] px-8 max-md:hidden">
          <form
            className="well flex h-10 w-[360px] items-center gap-2.5 rounded-full px-4 focus-within:ring-2 focus-within:ring-[var(--accent)]"
            onSubmit={(e) => {
              e.preventDefault()
              submitSearch()
            }}
          >
            <Search size={16} className="text-text-2" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users, businesses and events" placeholder="Search users, businesses, events" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-text-3" />
            <kbd className="meta rounded-[4px] bg-[var(--surface)] px-1.5 py-0.5 text-text-2 ring-1 ring-[var(--rule)]">↵</kbd>
          </form>
          <span className="meta ml-1 hidden text-text-2 xl:inline">
            {CLOCK.date} · {CLOCK.time} · {CLOCK.tz} · Lagos {CLOCK.lagosTime}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" icon={BadgeCheck} onClick={() => navigate('admin.verification')}>
              Verify · {pending}
            </Button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('admin.reviews')}
              aria-label="3 reports waiting"
              className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-high)]"
            >
              <Bell size={19} aria-hidden />
              <span className="num absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-on-danger">3</span>
            </motion.button>
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu" className="flex h-10 items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-[var(--surface-high)]">
                <Avatar who={OWNER.photo} size={32} />
                <span className="text-left leading-tight">
                  <span className="block text-[13px] font-semibold">{OWNER.name}</span>
                  <span className="block text-[11px] font-semibold text-text-2">{OWNER.role}</span>
                </span>
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                    transition={spring.ui}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 top-12 z-30 w-56 rounded-[var(--r-card)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-floating)]"
                  >
                    {[
                      { label: 'Platform settings', act: () => navigate('admin.settings') },
                      { label: 'Reports', act: () => navigate('admin.reports') },
                      { label: 'Sign out', act: () => reset('admin.signin') },
                    ].map((m) => (
                      <button key={m.label} role="menuitem" type="button" onClick={() => { setMenu(false); m.act() }} className="flex h-10 w-full items-center rounded-[var(--r-control)] px-3 text-left text-[14px] font-semibold hover:bg-[var(--surface-high)]">
                        {m.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="scroll-y relative min-h-0 flex-1 overflow-x-hidden max-md:pb-[calc(64px+var(--safe-bottom,0px)+var(--chrome-space,0px)+12px)]" style={{ overscrollBehavior: 'contain' }}>
          {!bleed && (
            <div className="flex items-end justify-between gap-6 px-8 pb-5 pt-7 max-md:flex-col max-md:items-start max-md:gap-3 max-md:px-4 max-md:pt-5">
              <div className="min-w-0">
                <h1 className="grot text-[36px] leading-[0.95] max-md:text-[30px]">{title}</h1>
                {sub && <p className="mt-1.5 text-[14px] font-medium text-text-2">{sub}</p>}
              </div>
              {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
        <PhoneTabBar active={active} onMore={() => setDrawer(true)} />
      </div>
      <PhoneDrawer open={drawer} onClose={() => setDrawer(false)} active={active} />
    </div>
  )
}

/* ── Phone-browser layout (under 768px): app bar + drawer + bottom tab bar ── */

function PhoneAppBar({ title, active, onMenu, onSearch, q, setQ }: { title: ReactNode; active: AdminScreenId; onMenu: () => void; onSearch: () => void; q: string; setQ: (v: string) => void }) {
  const { navigate } = useNav()
  const [search, setSearch] = useState(false)
  const label = GROUPS.flatMap((g) => g.items).find((i) => i.id === active)?.label ?? (typeof title === 'string' ? title : 'Edera')
  return (
    <header className="relative z-30 shrink-0 border-b border-[var(--rule)] bg-[var(--surface)] md:hidden" style={{ paddingTop: 'var(--safe-top, 0px)' }}>
      <div className="flex h-14 items-center gap-1 px-2">
        <button type="button" onClick={onMenu} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-full">
          <Menu size={22} />
        </button>
        <Mark size={24} />
        <span className="ml-2 min-w-0 flex-1 truncate text-[16px] font-extrabold">{label}</span>
        <button type="button" onClick={() => setSearch((v) => !v)} aria-label="Search" aria-expanded={search} className="grid h-11 w-11 place-items-center rounded-full">
          <Search size={20} />
        </button>
        <button type="button" onClick={() => navigate('admin.settings')} aria-label="Account" className="grid h-11 w-11 place-items-center rounded-full">
          <Avatar who={OWNER.photo} size={30} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {search && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="overflow-hidden px-3"
            onSubmit={(e) => {
              e.preventDefault()
              setSearch(false)
              onSearch()
            }}
          >
            <div className="well mb-3 flex h-12 items-center gap-2 rounded-full px-4">
              <Search size={17} className="text-text-2" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" className="min-w-0 flex-1 bg-transparent outline-none" />
              <button type="submit" className="h-9 rounded-full bg-accent px-3 text-[13px] font-bold text-on-accent">
                Search
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </header>
  )
}

function PhoneTabBar({ active, onMore }: { active: AdminScreenId; onMore: () => void }) {
  const { reset } = useNav()
  const pending = useSession(pendingCases)
  return (
    <nav data-dock aria-label="Sections" className="glass absolute inset-x-0 bottom-0 z-20 md:hidden" style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}>
      <div className="flex h-16 items-stretch">
        {PHONE_TABS.map((t) => {
          const on = t.id === active
          const badge = t.id === 'admin.verification' && pending > 0 ? pending : 0
          return (
            <button key={t.id} type="button" onClick={() => reset(t.id)} aria-current={on ? 'page' : undefined} className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 ${on ? 'text-accent-ink' : 'text-text-2'}`}>
              <t.icon size={21} strokeWidth={2.1} aria-hidden />
              <span className={`text-[11px] font-bold ${on ? 'text-text' : 'text-text-2'}`}>{t.label}</span>
              {badge > 0 && <span className="num absolute right-[18%] top-2 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-brass px-1 text-[10px] font-bold text-on-brass">{badge}</span>}
            </button>
          )
        })}
        <button type="button" onClick={onMore} className="flex flex-1 flex-col items-center justify-center gap-0.5">
          <Menu size={21} className="text-text-2" aria-hidden />
          <span className="text-[11px] font-bold text-text-2">More</span>
        </button>
      </div>
    </nav>
  )
}

function PhoneDrawer({ open, onClose, active }: { open: boolean; onClose: () => void; active: AdminScreenId }) {
  const { reset, navigate } = useNav()
  const pending = useSession(pendingCases)
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40 md:hidden">
          <motion.button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-[rgb(11_38_34/0.5)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%', transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
            transition={spring.sheet}
            className="absolute bottom-0 left-0 top-0 flex w-[84%] max-w-[320px] flex-col bg-ink text-on-ink"
            style={{ paddingTop: 'var(--safe-top, 0px)', paddingBottom: 'var(--safe-bottom, 0px)' }}
          >
            <div className="flex h-16 items-center gap-2 px-5">
              <Mark size={26} tone="light" />
              <span className="display text-[18px] leading-none text-white">
                e-dera<span className="text-brass">.</span>
              </span>
              <button type="button" onClick={onClose} aria-label="Close menu" className="ml-auto grid h-11 w-11 place-items-center rounded-full">
                <X size={20} />
              </button>
            </div>
            <nav className="scroll-y flex-1 px-3 pb-4" style={{ overscrollBehavior: 'contain' }}>
              {GROUPS.map((g) => (
                <div key={g.title} className="mt-4 first:mt-1">
                  <p className="label px-3 pb-2 text-on-ink-2">{g.title}</p>
                  {g.items.map((it) => {
                    const on = it.id === active
                    const count = it.count ? it.count(getSession()) : undefined
                    return (
                      <button key={it.id} type="button" onClick={() => { onClose(); reset(it.id) }} className={`flex h-12 w-full items-center gap-3 rounded-[var(--r-control)] px-3 text-[15px] font-semibold ${on ? 'bg-brass text-on-brass' : 'text-on-ink'}`}>
                        <it.icon size={19} strokeWidth={2.1} className="shrink-0" aria-hidden />
                        <span className="flex-1 text-left">{it.label}</span>
                        {count !== undefined && count > 0 && <span className="num rounded-full bg-[rgb(255_255_255/0.14)] px-2 py-0.5 text-[11px] font-bold">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>
            <div className="border-t border-[rgb(255_255_255/0.12)] p-3">
              <button type="button" onClick={() => { onClose(); navigate('admin.verification') }} className="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brass text-[14px] font-bold text-on-brass">
                <BadgeCheck size={18} /> Verify · {pending}
              </button>
              <button type="button" onClick={() => { onClose(); reset('admin.signin') }} className="flex h-12 w-full items-center gap-3 rounded-[var(--r-control)] px-3 text-[14px] font-semibold text-on-ink-2">
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Console panel surface. Not every block is a card: use `flat` for sections that live on the page. */
export function Panel({ title, action, children, className = '', flat = false, pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; flat?: boolean; pad?: boolean }) {
  return (
    <section className={`${flat ? '' : 'rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)]'} ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between gap-3 ${pad ? 'px-5 pt-4' : 'pb-3'}`}>
          {title && <h2 className="grot text-[22px]">{title}</h2>}
          {action}
        </div>
      )}
      <div className={pad ? 'p-5 pt-3' : ''}>{children}</div>
    </section>
  )
}
