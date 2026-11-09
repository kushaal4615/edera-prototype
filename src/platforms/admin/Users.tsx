import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowUpDown, Ban, Check, ChevronLeft, ChevronRight, Download, KeyRound, MoreHorizontal, RotateCcw, Search, Send, ShieldCheck, UserPlus, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Verified } from '../../components/Brand'
import { Button } from '../../components/Button'
import { Confetti } from '../../components/Confetti'
import { CheckMark, TextArea } from '../../components/Form'
import { Drawer, Modal } from '../../components/Sheet'
import { KPI, USERS, type UserRole, type UserRow } from '../../data/admin'
import { fmtDay } from '../../data/clock'
import { DEMO_ADMIN_SEARCH, DEMO_SUSPEND_REASON } from '../../data/demoFill'
import { PEOPLE, personById } from '../../data/people'
import { PLANNERS, VENDORS, type Region } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession, type SessionState } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { ConsoleShell } from '../console/shell'

/* admin.users: "Users & roles". A segmented role bar, filters, a paginated
   sortable table (stacked cards under 768px), a user drawer carrying the
   role-based permissions matrix, and the "seed circle" invite modal. */

type RoleFilter = 'all' | UserRole | 'suspended'
type SortKey = 'name' | 'joined' | 'lastActive' | 'bookings'
const PAGE = 10

const ROLE_SEGMENTS: { label: string; n: number; color: string }[] = [
  { label: 'Clients', n: KPI.clients, color: 'var(--accent)' },
  { label: 'Planners', n: KPI.planners, color: 'var(--brass)' },
  { label: 'Vendors', n: KPI.vendors, color: 'var(--ink)' },
  { label: 'Admins', n: 3, color: 'var(--info)' },
]
const ROLE_TOTAL = ROLE_SEGMENTS.reduce((s, r) => s + r.n, 0)

const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'Client', label: 'Client' },
  { id: 'Planner', label: 'Planner' },
  { id: 'Vendor', label: 'Vendor' },
  { id: 'Venue', label: 'Venue' },
  { id: 'Admin', label: 'Admin' },
  { id: 'suspended', label: 'Suspended' },
]

/* Role-based permissions: the four columns the backend enforces. Venue owners share the Vendor column. */
type Col = 'Client' | 'Planner' | 'Vendor' | 'Admin'
const COLS: Col[] = ['Client', 'Planner', 'Vendor', 'Admin']
const PERMISSIONS: { label: string; allow: Col[] }[] = [
  { label: 'Browse marketplace', allow: ['Client', 'Planner', 'Vendor', 'Admin'] },
  { label: 'Create events', allow: ['Client', 'Planner', 'Admin'] },
  { label: 'Send requests', allow: ['Client', 'Planner'] },
  { label: 'Accept requests', allow: ['Vendor'] },
  { label: 'Manage listings', allow: ['Vendor', 'Admin'] },
  { label: 'Scan guests', allow: ['Planner', 'Vendor'] },
  { label: 'Moderate', allow: ['Admin'] },
  { label: 'Platform settings', allow: ['Admin'] },
]
const colOf = (r: UserRole): Col => (r === 'Venue' ? 'Vendor' : r)

/* Dave's circle: people in the cast who are not users yet. Emails are demo addresses. */
const CIRCLE = ['chioma', 'obi', 'ife', 'amaka', 'yemi', 'sade'].map((id) => ({ id, email: `${PEOPLE[id].first.toLowerCase()}.${PEOPLE[id].name.split(' ')[1].toLowerCase()}@demo-edera.app` }))
const INVITE_MESSAGE = 'Dave here. Edera is ready for a first look before anyone else sees it. Plan something small, book someone you already trust, and tell me what is confusing or missing. Honest feedback only.'

const businessOf = (personId: string) => VENDORS.find((v) => v.owner === personId)?.name ?? PLANNERS.find((p) => p.person === personId)?.business ?? null
const minutesOf = (s: string) => {
  if (s === 'now') return 0
  const n = parseInt(s, 10)
  return s.includes('m ') ? n : s.includes('h ') ? n * 60 : n * 1440
}
const stateOf = (u: UserRow, s: SessionState): UserRow['state'] => (s.suspended.includes(u.id) ? 'suspended' : s.reinstated.includes(u.id) ? 'active' : u.state)

const ROLE_TONE: Record<UserRole, 'accent' | 'warn' | 'neutral' | 'ink' | 'info'> = { Client: 'accent', Planner: 'warn', Vendor: 'neutral', Venue: 'ink', Admin: 'info' }

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onClick} aria-pressed={on} className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors ${on ? 'bg-ink text-on-ink' : 'text-text hover:bg-[var(--surface-high)]'}`} style={on ? undefined : { boxShadow: 'inset 0 0 0 1px var(--rule-strong)' }}>
      {children}
    </motion.button>
  )
}

export default function AdminUsers() {
  const { toast } = useNav()
  const sess = useSession((s) => s)
  const [role, setRole] = useState<RoleFilter>('all')
  const [region, setRegion] = useState<Region | 'all'>('all')
  const [q, setQ] = useState(DEMO_ADMIN_SEARCH)
  const [applied, setApplied] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'joined', dir: -1 })
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const [invite, setInvite] = useState(false)

  const rows = useMemo(() => {
    const needle = applied.trim().toLowerCase()
    const list = USERS.filter((u) => {
      const st = stateOf(u, sess)
      if (role === 'suspended') return st === 'suspended'
      if (role !== 'all' && u.role !== role) return false
      if (region !== 'all' && u.region !== region) return false
      if (needle) {
        const p = personById(u.person)
        const biz = businessOf(u.person) ?? ''
        if (!`${p.name} ${biz} ${u.city}`.toLowerCase().includes(needle)) return false
      }
      return true
    })
    const cmp = (a: UserRow, b: UserRow) => {
      switch (sort.key) {
        case 'name':
          return personById(a.person).name.localeCompare(personById(b.person).name)
        case 'joined':
          return a.joined.localeCompare(b.joined)
        case 'lastActive':
          return minutesOf(b.lastActive) - minutesOf(a.lastActive)
        case 'bookings':
          return a.bookings - b.bookings
      }
    }
    return list.sort((a, b) => cmp(a, b) * sort.dir)
  }, [role, region, applied, sort, sess])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const safePage = Math.min(page, pages - 1)
  const slice = rows.slice(safePage * PAGE, safePage * PAGE + PAGE)
  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' ? 1 : -1 }))
    setPage(0)
  }
  const search = () => {
    setApplied(q)
    setPage(0)
    track('admin_search_users', q)
  }
  const openUser = (id: string) => {
    setOpen(id)
    track('admin_view_user', id)
  }

  const SortHead = ({ k, children, className = '' }: { k: SortKey; children: ReactNode; className?: string }) => {
    const on = sort.key === k
    return (
      <th className={`py-2.5 ${className}`}>
        <button type="button" onClick={() => toggleSort(k)} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined} className={`label inline-flex h-8 items-center gap-1 rounded-[6px] px-1 -ml-1 ${on ? 'text-text' : 'text-text-2 hover:text-text'}`}>
          {children}
          {on ? sort.dir === 1 ? <ArrowUp size={12} aria-hidden /> : <ArrowDown size={12} aria-hidden /> : <ArrowUpDown size={12} className="opacity-60" aria-hidden />}
        </button>
      </th>
    )
  }

  const suspendedCount = USERS.filter((u) => stateOf(u, sess) === 'suspended').length

  return (
    <ConsoleShell
      active="admin.users"
      title="Users & roles"
      sub={`${KPI.users.toLocaleString('en-GB')} accounts · ${USERS.length} shown in this demo · ${suspendedCount} suspended`}
      actions={
        <>
          <Button size="sm" variant="outline" icon={Download} onClick={() => toast('Exported users.csv · 24 rows with roles and regions', 'accent')}>
            Export CSV
          </Button>
          <Button size="sm" icon={UserPlus} onClick={() => setInvite(true)}>
            Invite beta users
          </Button>
        </>
      }
    >
      <div className="px-8 pb-10 max-md:px-4">
        {/* ── Role breakdown ── */}
        <section className="rounded-[var(--r-container)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raised)]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="grot text-[22px]">Who holds an account</h2>
              <p className="text-[13px] text-text-2">Four roles, one backend with role-based permissions. Venue owners are vendors with a venue listing.</p>
            </div>
            <div className="flex gap-1.5">
              {(['all', 'uk', 'ng'] as const).map((r) => (
                <Chip key={r} on={region === r} onClick={() => { setRegion(r); setPage(0) }}>
                  {r === 'all' ? 'Both markets' : r === 'uk' ? `UK · ${KPI.uk.users.toLocaleString('en-GB')}` : `NG · ${KPI.ng.users.toLocaleString('en-GB')}`}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4 flex h-5 w-full gap-[3px] overflow-hidden rounded-full" role="img" aria-label={ROLE_SEGMENTS.map((r) => `${r.label} ${r.n}`).join(', ')}>
            {ROLE_SEGMENTS.map((r) => (
              <motion.span key={r.label} className="block h-full first:rounded-l-full last:rounded-r-full" style={{ background: r.color, minWidth: 6 }} initial={{ width: 0 }} animate={{ width: `${(r.n / ROLE_TOTAL) * 100}%` }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3 max-md:grid-cols-2">
            {ROLE_SEGMENTS.map((r) => (
              <div key={r.label} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
                <span>
                  <span className="num block text-[20px] font-extrabold leading-none">{r.n.toLocaleString('en-GB')}</span>
                  <span className="mt-1 block text-[12px] font-semibold text-text-2">
                    {r.label} · {Math.round((r.n / ROLE_TOTAL) * 100) || '<1'}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Filters ── */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {ROLE_FILTERS.map((f) => (
            <Chip key={f.id} on={role === f.id} onClick={() => { setRole(f.id); setPage(0) }}>
              {f.label}
              {f.id === 'suspended' && suspendedCount > 0 && <span className="num ml-1.5 rounded-full bg-danger px-1.5 text-[11px] text-on-danger">{suspendedCount}</span>}
            </Chip>
          ))}
          <form
            className="well ml-auto flex h-10 w-[300px] items-center gap-2 rounded-full pl-4 pr-1 focus-within:ring-2 focus-within:ring-[var(--accent)] max-md:ml-0 max-md:w-full"
            onSubmit={(e) => {
              e.preventDefault()
              search()
            }}
          >
            <Search size={15} className="shrink-0 text-text-2" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by name, business or city" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
            <button type="submit" className="h-8 shrink-0 rounded-full bg-ink px-3 text-[12px] font-bold text-on-ink">
              Search
            </button>
          </form>
        </div>
        <AnimatePresence>
          {applied && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-[13px] text-text-2">
              <span className="num font-bold text-text">{rows.length}</span> of {USERS.length} match “{applied}”
              <button type="button" onClick={() => { setApplied(''); setPage(0) }} className="inline-flex h-7 items-center gap-1 rounded-full bg-[var(--surface-high)] px-2.5 text-[12px] font-bold text-text">
                <X size={12} aria-hidden /> Clear
              </button>
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Table (desktop) ── */}
        <div className="mt-4 overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)] max-md:hidden">
          <table className="w-full table-fixed border-collapse text-[13px]">
            <colgroup>
              <col style={{ width: 240 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 124 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 64 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 100 }} />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--rule)] text-left">
                <SortHead k="name" className="pl-5">
                  Name
                </SortHead>
                <th className="label py-2.5 text-text-2">Role</th>
                <th className="label py-2.5 text-text-2">City</th>
                <SortHead k="joined">Joined</SortHead>
                <SortHead k="lastActive">Active</SortHead>
                <th className="label py-2.5 text-right text-text-2">Events</th>
                <SortHead k="bookings" className="pl-4 text-right">
                  Bookings
                </SortHead>
                <th className="label py-2.5 pl-5 text-text-2">Verified</th>
                <th className="label py-2.5 pl-3 text-text-2">State</th>
                <th className="py-2.5 pr-4" />
              </tr>
            </thead>
            <motion.tbody key={`${safePage}-${role}-${region}-${applied}-${sort.key}${sort.dir}`} variants={listParent} initial="hidden" animate="show">
              {slice.map((u) => {
                const p = personById(u.person)
                const st = stateOf(u, sess)
                const biz = businessOf(u.person)
                return (
                  <motion.tr key={u.id} variants={listItem} className={`border-b border-[var(--rule)] last:border-b-0 ${st === 'suspended' ? 'bg-[rgb(178_56_74/0.04)]' : 'hover:bg-[var(--surface-raised)]'}`}>
                    <td className="py-2 pl-5">
                      <button type="button" onClick={() => openUser(u.id)} className="flex min-h-[44px] w-full items-center gap-3 text-left">
                        <Avatar who={p.photo} size={36} />
                        <span className="min-w-0">
                          <span className="block truncate font-bold">{p.name}</span>
                          <span className="block truncate text-[12px] text-text-2">{biz ?? p.email ?? p.role}</span>
                        </span>
                      </button>
                    </td>
                    <td className="py-2">
                      <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-1.5">
                        <span className="meta rounded-[4px] bg-[var(--surface-high)] px-1 py-0.5">{u.region.toUpperCase()}</span>
                        <span className="truncate font-semibold">{u.city}</span>
                      </span>
                    </td>
                    <td className="num py-2 text-text-2">{fmtDay(u.joined).slice(4)}</td>
                    <td className="num py-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${minutesOf(u.lastActive) < 60 ? 'bg-free' : 'bg-[var(--paper-400)]'}`} aria-hidden />
                        {u.lastActive}
                      </span>
                    </td>
                    <td className="num py-2 text-right">{u.events}</td>
                    <td className="num py-2 pl-4 text-right font-bold">{u.bookings}</td>
                    <td className="py-2 pl-5">{u.verified ? <Verified size={14} /> : <span className="text-[12px] text-text-3">—</span>}</td>
                    <td className="py-2 pl-3">
                      <Badge tone={st === 'suspended' ? 'danger' : st === 'invited' ? 'info' : 'success'}>{st}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openUser(u.id)} aria-label={`View ${p.name}`}>
                        View
                      </Button>
                    </td>
                  </motion.tr>
                )
              })}
            </motion.tbody>
          </table>
          {slice.length === 0 && <p className="px-5 py-10 text-center text-[13px] text-text-2">No accounts match. Clear the search or pick another role.</p>}
          <Pagination page={safePage} pages={pages} total={rows.length} onPage={setPage} />
        </div>

        {/* ── Stacked cards (phone) ── */}
        <div className="mt-4 flex flex-col gap-2 md:hidden">
          {slice.map((u) => {
            const p = personById(u.person)
            const st = stateOf(u, sess)
            return (
              <div key={u.id} className="flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface)] p-3 shadow-[var(--shadow-raised)]">
                <Avatar who={p.photo} size={44} />
                <button type="button" onClick={() => openUser(u.id)} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-bold">{p.name}</span>
                    {u.verified && <Verified size={13} label={false} />}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-text-2">
                    <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
                    <span>
                      {u.city} · {u.region.toUpperCase()}
                    </span>
                    <span>· {u.bookings} bookings</span>
                    <span>· {u.lastActive}</span>
                  </span>
                  {st === 'suspended' && <Badge tone="danger" className="mt-1.5">Suspended</Badge>}
                </button>
                <button type="button" onClick={() => openUser(u.id)} aria-label={`More for ${p.name}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-text-2 hover:bg-[var(--surface-high)]">
                  <MoreHorizontal size={20} aria-hidden />
                </button>
              </div>
            )
          })}
          <div className="rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
            <Pagination page={safePage} pages={pages} total={rows.length} onPage={setPage} />
          </div>
        </div>
      </div>

      <UserDrawer id={open} onClose={() => setOpen(null)} />
      <InviteModal open={invite} onClose={() => setInvite(false)} />
    </ConsoleShell>
  )
}

function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--rule)] px-4 py-2.5">
      <span className="text-[12.5px] text-text-2">
        Showing <span className="num font-bold text-text">{total ? page * PAGE + 1 : 0}–{Math.min(total, (page + 1) * PAGE)}</span> of <span className="num font-bold text-text">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0} aria-label="Previous page" className="grid h-9 w-9 place-items-center rounded-full text-text hover:bg-[var(--surface-high)] disabled:opacity-40">
          <ChevronLeft size={16} aria-hidden />
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button key={i} type="button" onClick={() => onPage(i)} aria-current={i === page ? 'page' : undefined} className={`num h-9 min-w-9 rounded-full px-2 text-[13px] font-bold ${i === page ? 'bg-ink text-on-ink' : 'text-text hover:bg-[var(--surface-high)]'}`}>
            {i + 1}
          </button>
        ))}
        <button type="button" onClick={() => onPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} aria-label="Next page" className="grid h-9 w-9 place-items-center rounded-full text-text hover:bg-[var(--surface-high)] disabled:opacity-40">
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </div>
  )
}

/* ── User drawer: profile, permissions matrix, actions ── */
function UserDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { toast } = useNav()
  const sess = useSession((s) => s)
  const [confirm, setConfirm] = useState(false)
  const [reason, setReason] = useState(DEMO_SUSPEND_REASON)
  const u = USERS.find((x) => x.id === id)
  const p = u ? personById(u.person) : null
  const st = u ? stateOf(u, sess) : 'active'
  const col = u ? colOf(u.role) : 'Client'

  const suspend = () => {
    if (!u || !p) return
    session.suspend(u.id)
    track('admin_suspend', u.id)
    setConfirm(false)
    toast(`${p.name} suspended · listings hidden, sign-in blocked`, 'danger')
  }
  const reinstate = () => {
    if (!u || !p) return
    session.reinstate(u.id)
    track('admin_reinstate', u.id)
    toast(`${p.name} reinstated · back on the marketplace`, 'accent')
  }

  return (
    <>
      <Drawer open={!!u} onClose={onClose} title="User" width={480}>
        {u && p && (
          <div className="flex flex-col">
            <div className="flex items-start gap-4">
              <Avatar who={p.photo} size={64} ring verified={u.verified} />
              <div className="min-w-0 flex-1">
                <h4 className="grot truncate text-[24px]">{p.name}</h4>
                <p className="truncate text-[13px] text-text-2">{businessOf(u.person) ?? p.role}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
                  <Badge tone={st === 'suspended' ? 'danger' : 'success'}>{st}</Badge>
                  {u.verified && <Verified size={13} />}
                </div>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-2 text-[12.5px]">
              {[
                ['Joined', fmtDay(u.joined, true)],
                ['Last active', u.lastActive],
                ['Market', `${u.city} · ${u.region.toUpperCase()}`],
                ['Events', String(u.events)],
                ['Bookings', String(u.bookings)],
                ['Phone', p.phone],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[var(--r-control)] bg-[var(--surface-raised)] px-3 py-2">
                  <dt className="text-text-2">{k}</dt>
                  <dd className="num mt-0.5 truncate font-bold">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-center justify-between">
              <h5 className="label text-text-2">Role & permissions</h5>
              <span className="meta text-text-2">enforced by the API</span>
            </div>
            <table className="mt-2 w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <th className="py-1.5 text-left font-semibold text-text-2">Can…</th>
                  {COLS.map((c) => (
                    <th key={c} className={`label w-[64px] rounded-t-[8px] py-1.5 text-center ${c === col ? 'bg-accent-soft text-[var(--on-accent-soft)]' : 'text-text-2'}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm, i) => (
                  <tr key={perm.label} className="border-t border-[var(--rule)]">
                    <td className="py-2 font-semibold">{perm.label}</td>
                    {COLS.map((c) => {
                      const yes = perm.allow.includes(c)
                      const hl = c === col
                      return (
                        <td key={c} className={`py-2 text-center ${hl ? `bg-accent-soft ${i === PERMISSIONS.length - 1 ? 'rounded-b-[8px]' : ''}` : ''}`}>
                          {yes ? <Check size={15} strokeWidth={3} className={`mx-auto ${hl ? 'text-accent-ink' : 'text-text'}`} aria-hidden /> : <span className={hl ? 'text-[var(--on-accent-soft)] opacity-60' : 'text-text-3'}>–</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[12px] text-text-2">Highlighted column: what this account can do today. Venue owners use the Vendor permissions.</p>

            <div className="mt-6 flex flex-col gap-2">
              <Button variant="outline" block icon={KeyRound} onClick={() => toast(`Reset link sent to ${p.first} · expires in 1 hour`, 'info')}>
                Reset password
              </Button>
              {st === 'suspended' ? (
                <Button variant="accent" block icon={RotateCcw} onClick={reinstate}>
                  Reinstate
                </Button>
              ) : (
                <Button variant="danger" block icon={Ban} onClick={() => setConfirm(true)}>
                  Suspend
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Suspend ${p?.first ?? ''}?`}>
        <p className="text-[14px] text-text-2">Sign-in is blocked, listings leave the marketplace and open requests pause. Confirmed bookings stay visible to their clients. You can reinstate at any time.</p>
        <div className="mt-4">
          <TextArea label="Reason (kept on the account)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" icon={Ban} onClick={suspend}>
            Suspend account
          </Button>
        </div>
      </Modal>
    </>
  )
}

/* ── Seed circle: Dave's first users ── */
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useNav()
  const [picked, setPicked] = useState<string[]>(CIRCLE.map((c) => c.id))
  const [message, setMessage] = useState(INVITE_MESSAGE)
  const [burst, setBurst] = useState(false)
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const send = () => {
    if (!picked.length) return toast('Pick at least one person to invite', 'warn')
    track('admin_invite_seed', picked.length)
    setBurst(true)
    setTimeout(() => {
      setBurst(false)
      onClose()
      toast(`${picked.length} invites sent · they get the app before marketing starts`, 'accent')
    }, 700)
  }
  return (
    <Modal open={open} onClose={onClose} title="Seed circle" width={560}>
      {burst && <Confetti origin={0.4} />}
      <p className="text-[14px] text-text-2">A small circle of people Dave knows uses the app first and gives feedback. Invites unlock the Client App with a pre-made event template.</p>
      <ul className="mt-4 grid grid-cols-2 gap-1.5 max-md:grid-cols-1">
        {CIRCLE.map((c) => {
          const p = PEOPLE[c.id]
          const on = picked.includes(c.id)
          return (
            <li key={c.id}>
              <button type="button" onClick={() => toggle(c.id)} aria-pressed={on} className={`flex min-h-[56px] w-full items-center gap-3 rounded-[var(--r-control)] px-2.5 py-2 text-left transition-colors ${on ? 'bg-[var(--surface-raised)]' : 'opacity-70 hover:bg-[var(--surface-high)]'}`}>
                <Avatar who={p.photo} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">{p.name}</span>
                  <span className="block truncate text-[12px] text-text-2">{c.email}</span>
                </span>
                <CheckMark on={on} />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-4">
        <TextArea label="Message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} hint="Sent by email and WhatsApp with a one-tap install link." />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-2">
          <ShieldCheck size={14} aria-hidden /> Free during the launch phase
        </span>
        <Button icon={Send} onClick={send}>
          Send invites · {picked.length}
        </Button>
      </div>
    </Modal>
  )
}
