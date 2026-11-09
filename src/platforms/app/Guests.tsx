import { motion } from 'framer-motion'
import { Phone, QrCode as QrIcon, Search, Send, UserPlus, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge, Chip } from '../../components/Badge'
import { AvailPill, Figure, QrCode } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { Input, Toggle } from '../../components/Form'
import { Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { daysUntil } from '../../data/clock'
import { DEMO_GUEST } from '../../data/demoFill'
import { RUBY, RUBY_GROUPS, RUBY_GUESTS, RUBY_TOTALS, type Rsvp } from '../../data/events'
import type { MediaKey } from '../../data/media'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, SectionHead, safeTop } from '../mobileShell'

/* app.guests: the digital guest list. Oversized RSVP numerals, a group
   rail, live search, borderless rows, and the table plan as a bento. */

type GuestRow = { id: string; name: string; group: string; table?: string; rsvp: Rsvp; plusOne?: boolean; dietary?: string; photo?: MediaKey; phone: string; qr: string; justAdded?: boolean }

const TABLE_OPTIONS = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Kids table']
/* table plan seats (demo values, to confirm): 18 tables for 180, six shown */
const TABLES = [
  { name: 'Top table', seats: 10, filled: 10, faces: ['chioma', 'obi', 'emeka', 'ngozi'] as MediaKey[] },
  { name: 'Table 2', seats: 10, filled: 9 },
  { name: 'Table 3', seats: 10, filled: 10 },
  { name: 'Table 4', seats: 10, filled: 6 },
  { name: 'Table 5', seats: 10, filled: 10 },
  { name: 'Kids', seats: 12, filled: 8 },
]

const initials = (name: string) =>
  name
    .replace(/^(Uncle|Aunty|Pastor|Mrs|Mr|Dr|Deaconess|Brother)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

function Face({ g, size = 44 }: { g: GuestRow; size?: number }) {
  if (g.photo) return <Avatar who={g.photo} size={size} />
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-brass-soft font-extrabold text-on-brass-soft" style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }} aria-hidden>
      {initials(g.name)}
    </span>
  )
}

function RsvpPill({ rsvp }: { rsvp: Rsvp }) {
  if (rsvp === 'yes') return <AvailPill state="free">Yes</AvailPill>
  if (rsvp === 'no') return <Badge tone="danger">No</Badge>
  return <AvailPill state="held">Pending</AvailPill>
}

export default function AppGuests() {
  const { navigate, toast } = useNav()
  const added = useSession((s) => s.guestsAdded)
  const [plusOnes, setPlusOnes] = useState<Record<string, boolean>>({})
  const [group, setGroup] = useState<string>('All')
  const [query, setQuery] = useState('Oko')
  const [selected, setSelected] = useState<GuestRow | null>(null)
  const [adding, setAdding] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  /* add-guest form, pre-filled */
  const [name, setName] = useState(DEMO_GUEST.name)
  const [phone, setPhone] = useState(DEMO_GUEST.phone)
  const [newGroup, setNewGroup] = useState(DEMO_GUEST.group)
  const [newTable, setNewTable] = useState(DEMO_GUEST.table)
  const [plusOne, setPlusOne] = useState(DEMO_GUEST.plusOne)
  const [nameError, setNameError] = useState<string | undefined>()

  const all = useMemo<GuestRow[]>(() => {
    const fresh: GuestRow[] = added.map((g, i) => ({ id: g.id, name: g.name, group: g.group, table: g.table, rsvp: 'pending', plusOne: plusOnes[g.name] ?? false, phone: DEMO_GUEST.phone, qr: `EDR-RUBY-${1300 + i}`, justAdded: true }))
    return [...fresh, ...RUBY_GUESTS]
  }, [added, plusOnes])

  const totals = { yes: RUBY_TOTALS.yes, no: RUBY_TOTALS.no, pending: RUBY_TOTALS.pending + added.length, invited: RUBY_TOTALS.invited + added.length }
  const q = query.trim().toLowerCase()
  const inGroup = (g: GuestRow) => group === 'All' || g.group === group
  const matches = q ? all.filter((g) => inGroup(g) && (g.name.toLowerCase().includes(q) || (g.table ?? '').toLowerCase().includes(q) || g.group.toLowerCase().includes(q))) : []
  const rest = all.filter((g) => inGroup(g) && !matches.includes(g))
  const groupCount = (name: string) => (name === 'All' ? all.length : all.filter((g) => g.group === name).length)

  const addGuest = () => {
    if (!name.trim()) {
      setNameError('Add the guest’s name so the invite has a name on it.')
      return
    }
    track('add_guest', newGroup)
    session.addGuest({ name: name.trim(), group: newGroup, table: newTable })
    setPlusOnes((m) => ({ ...m, [name.trim()]: plusOne }))
    setAdding(false)
    toast(`${name.trim()} added to ${newTable}${plusOne ? ' with a +1' : ''}`, 'accent')
  }

  const showTable = (t: string) => {
    setGroup('All')
    setQuery(t)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const row = (g: GuestRow) => (
    <motion.li key={g.id} variants={listItem} className="rule-b">
      <Pressable onClick={() => setSelected(g)} aria-label={`${g.name}, ${g.rsvp}`}>
        <span className="flex items-center gap-3 px-5 py-3">
        <Face g={g} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-bold">{g.name}</span>
            {g.plusOne && <Badge>+1</Badge>}
            {g.justAdded && <Badge tone="accent">Just added</Badge>}
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className="meta truncate text-text-2">
              {g.group} · {g.table ?? 'No table yet'}
            </span>
            {g.dietary && <Badge tone="warn">{g.dietary}</Badge>}
          </span>
        </span>
        <RsvpPill rsvp={g.rsvp} />
        </span>
      </Pressable>
    </motion.li>
  )

  return (
    <MobileScreen
      tab="guests"
      cap="var(--bg)"
      dock={
        <Dock>
          <Button block size="lg" icon={UserPlus} onClick={() => setAdding(true)}>
            Add guest
          </Button>
          <Button block size="lg" variant="outline" icon={Send} onClick={() => navigate('app.invite')}>
            Send invites
          </Button>
        </Dock>
      }
      overlay={
        <>
          <BottomSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
            {selected && (
              <div>
                <div className="flex items-center gap-4">
                  <Face g={selected} size={64} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RsvpPill rsvp={selected.rsvp} />
                      {selected.plusOne && <Badge>+1</Badge>}
                      {selected.dietary && <Badge tone="warn">{selected.dietary}</Badge>}
                    </div>
                    <p className="meta mt-2 text-text-2">
                      {selected.group} · {selected.table ?? 'No table yet'}
                    </p>
                    <p className="num mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-text-2">
                      <Phone size={13} aria-hidden /> {selected.phone}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-4 rounded-[var(--r-card)] bg-[var(--surface-high)] p-4">
                  <QrCode seed={selected.qr} size={92} />
                  <div className="min-w-0">
                    <p className="label text-brass-ink">Personal QR invite</p>
                    <p className="meta mt-1 text-text">{selected.qr}</p>
                    <p className="mt-1.5 text-[12px] leading-snug text-text-2">{selected.rsvp === 'pending' ? 'Delivered, not yet answered.' : selected.rsvp === 'yes' ? 'Scans once at the door, then locks.' : 'Declined · code is cancelled.'}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    className="w-full"
                    size="lg"
                    icon={Send}
                    onClick={() => {
                      track('resend_invite', selected.id)
                      toast(`Invite resent to ${selected.name.split(' ')[0]} by WhatsApp`, 'accent')
                      setSelected(null)
                    }}
                  >
                    Resend invite
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => toast(`Tunde keeps the table plan; ${selected.name.split(' ')[0]}’s move is noted for him`)}>
                    Move table
                  </Button>
                </div>
              </div>
            )}
          </BottomSheet>

          <BottomSheet open={adding} onClose={() => setAdding(false)} title="Add a guest" tall>
            <div className="flex flex-col gap-3">
              <Input
                label="Full name"
                dense
                value={name}
                error={nameError}
                onChange={(e) => {
                  setName(e.target.value)
                  if (e.target.value.trim()) setNameError(undefined)
                }}
              />
              <Input label="WhatsApp number · the QR invite goes here" dense value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
              <div>
                <p className="text-[13px] font-bold">Group</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RUBY_GROUPS.map((g) => (
                    <motion.button key={g} type="button" whileTap={tap} transition={spring.ui} onClick={() => setNewGroup(g)} aria-pressed={g === newGroup}>
                      <Chip on={g === newGroup}>{g}</Chip>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold">Table</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TABLE_OPTIONS.map((t) => (
                    <motion.button key={t} type="button" whileTap={tap} transition={spring.ui} onClick={() => setNewTable(t)} aria-pressed={t === newTable}>
                      <Chip on={t === newTable}>{t}</Chip>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-[var(--r-card)] bg-[var(--surface-high)] px-4 py-2">
                <div>
                  <p className="text-[15px] font-bold">Bringing a plus-one</p>
                  <p className="text-[12px] text-text-2">Admit 2 on the invite</p>
                </div>
                <Toggle on={plusOne} onChange={setPlusOne} label="Plus one" />
              </div>
              <Button size="lg" icon={UserPlus} onClick={addGuest} className="mt-1 w-full">
                Add guest
              </Button>
            </div>
          </BottomSheet>
        </>
      }
    >
      <div className="flex items-start justify-between px-5" style={{ paddingTop: safeTop(10) }}>
        <div>
          <p className="label text-brass-ink">{RUBY.name}</p>
          <h1 className="grot mt-1 text-[34px]">Guests</h1>
        </div>
        <IconButton icon={QrIcon} label="QR invites" tone="paper" onClick={() => navigate('app.invite')} />
      </div>

      {/* oversized numerals */}
      <section className="mt-3 px-5">
        <div className="flex items-end gap-6">
          <Figure value={totals.yes} unit="yes" size={92} />
          <div className="flex gap-6 pb-2.5">
            <div>
              <span className="figure num block text-[32px] text-danger-text">{totals.no}</span>
              <span className="label text-text-2">no</span>
            </div>
            <div>
              <span className="figure num block text-[32px] text-brass-ink">{totals.pending}</span>
              <span className="label text-text-2">pending</span>
            </div>
          </div>
        </div>
        <p className="num mt-1 text-[13px] font-semibold text-text-2">
          of {totals.invited} invited · {RUBY_TOTALS.invitesSent} QR invites sent · {daysUntil(RUBY.date)} days to go
        </p>
        <div className="mt-3 flex h-[10px] w-full gap-[3px] overflow-hidden rounded-full" role="img" aria-label={`${totals.yes} yes, ${totals.no} no, ${totals.pending} pending`}>
          <motion.span className="block h-full rounded-full bg-free" initial={{ width: 0 }} animate={{ width: `${(totals.yes / totals.invited) * 100}%` }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} />
          <motion.span className="block h-full rounded-full bg-danger" initial={{ width: 0 }} animate={{ width: `${(totals.no / totals.invited) * 100}%` }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.1 }} />
          <motion.span className="block h-full rounded-full bg-held" initial={{ width: 0 }} animate={{ width: `${(totals.pending / totals.invited) * 100}%` }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.2 }} />
        </div>
      </section>

      {/* group rail */}
      <Rail className="mt-4" gap={8}>
        {['All', ...RUBY_GROUPS].map((g) => (
          <motion.button key={g} type="button" whileTap={tap} transition={spring.ui} onClick={() => setGroup(g)} aria-pressed={g === group} className="shrink-0 snap-start">
            <Chip on={g === group}>
              {g} <span className={`num ${g === group ? 'text-on-accent' : 'text-text-2'}`}>{groupCount(g)}</span>
            </Chip>
          </motion.button>
        ))}
      </Rail>

      {/* search */}
      <div className="mt-4 px-5" ref={listRef} style={{ scrollMarginTop: 12 }}>
        <Input
          label="Find a guest"
          dense
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leading={<Search size={16} aria-hidden />}
          trailing={
            query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="grid h-8 w-8 place-items-center rounded-full text-text-2">
                <X size={16} aria-hidden />
              </button>
            ) : undefined
          }
        />
      </div>

      {q && (
        <>
          <div className="mt-4 flex items-end justify-between px-5">
            <p className="label text-brass-ink">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'} for “{query.trim()}”
            </p>
            {group !== 'All' && <span className="meta text-text-2">in {group}</span>}
          </div>
          <motion.ul key={`m-${q}-${group}`} variants={listParent} initial="hidden" animate="show" className="mt-1">
            {matches.map(row)}
          </motion.ul>
          {matches.length === 0 && <p className="px-5 py-3 text-[13px] text-text-2">No one by that name yet. Add them below.</p>}
        </>
      )}
      <div className="mt-4 flex items-end justify-between px-5">
        <p className="label text-text-2">{q ? 'Everyone else' : 'All guests'}</p>
        <span className="meta text-text-2">
          {rest.length} of {all.length}
        </span>
      </div>
      <motion.ul key={`r-${q}-${group}`} variants={listParent} initial="hidden" animate="show" className="mt-1">
        {rest.map(row)}
      </motion.ul>
      <p className="px-5 py-3 text-[12px] text-text-2">
        Showing the {all.length} guests with names on the list · {totals.invited - all.length} more invited by household.
      </p>

      {/* table plan bento */}
      <SectionHead className="mt-6" eyebrow={`${RUBY_TOTALS.tables} tables`} title="Table plan" action="+12 more tables" onAction={() => navigate('app.event')} />
      <div className="mt-3 grid grid-cols-3 gap-2 px-5" style={{ gridAutoRows: 78 }}>
        {TABLES.map((t, i) => {
          const full = t.filled >= t.seats
          const big = i === 0
          return (
            <motion.button
              key={t.name}
              type="button"
              whileTap={tap}
              transition={spring.ui}
              onClick={() => showTable(t.name === 'Top table' ? 'Table 1' : t.name === 'Kids' ? 'Kids table' : t.name)}
              aria-label={`${t.name}, ${t.filled} of ${t.seats} seated`}
              className={`relative flex flex-col justify-between overflow-hidden rounded-[var(--r-card)] p-3 text-left ${big ? 'col-span-2 row-span-2 bg-ink text-on-ink' : full ? 'bg-accent-soft text-on-accent-soft' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}
            >
              {big && <span className="arc" style={{ top: '66%', bottom: 'auto', right: '-24%', width: '70%' }} aria-hidden />}
              <span className="relative flex items-start justify-between gap-2">
                <span className={`label whitespace-nowrap ${big ? 'text-brass-light' : full ? 'text-on-accent-soft' : 'text-text-2'}`}>{t.name}</span>
                {big && <AvailPill state="free">Full</AvailPill>}
              </span>
              <span className="relative">
                {big && t.faces && (
                  <span className="mb-2 flex items-center">
                    {t.faces.map((f, k) => (
                      <span key={f} className="rounded-full ring-2 ring-[var(--ink)]" style={{ marginLeft: k === 0 ? 0 : -10 }}>
                        <Avatar who={f} size={30} />
                      </span>
                    ))}
                    <span className="ml-2 text-[12px] font-semibold text-on-ink-2">Mum, Dad & us</span>
                  </span>
                )}
                <span className="flex items-baseline justify-between gap-1">
                  <span className="flex items-baseline gap-1">
                    <span className={`figure num ${big ? 'text-[40px]' : 'text-[24px]'}`}>{t.filled}</span>
                    <span className={`num text-[12px] font-bold ${big ? 'text-on-ink-2' : full ? 'text-on-accent-soft' : 'text-text-2'}`}>/ {t.seats}</span>
                  </span>
                  {!big && !full && <span className="num whitespace-nowrap text-[11px] font-extrabold text-brass-ink">{t.seats - t.filled} free</span>}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
      <p className="mt-2 px-5 text-[12px] text-text-2">Tap a table to see who is seated there. Tunde locks the plan on 13 Feb.</p>
    </MobileScreen>
  )
}
