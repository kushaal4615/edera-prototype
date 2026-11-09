import { motion } from 'framer-motion'
import { CalendarDays, DoorOpen, Phone, QrCode as QrIcon, Search, Send, UserPlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { AVAIL, Bar, Figure, QrCode, StateDot } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { ProgressRing } from '../../components/Charts'
import { Input } from '../../components/Form'
import { Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { CLOCK, fmtDay, pct, relDay } from '../../data/clock'
import { DEMO_GUEST } from '../../data/demoFill'
import { eventById, EVENTS, RUBY_GUESTS, RUBY_TOTALS, TONIGHT_CHECKED_IN, TONIGHT_GUESTS, TONIGHT_TOTALS, type Guest } from '../../data/events'
import { img, type MediaKey } from '../../data/media'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, SectionHead, TopBar } from '../mobileShell'

/* pro.guests: the guest list for the event Tunde is viewing. Tonight's
   dinner shows live check-in from the store; the ruby anniversary shows
   RSVPs plus guests added this session; any other event gets a plausible
   local list. Composition: oversized numeral + ring → invites band →
   search with matches first → table chips → borderless rows → tables
   bento. */

type Status = 'in' | 'expected' | 'walkin' | 'yes' | 'pending' | 'no'
type Row = { id: string; name: string; group: string; table: string; photo?: MediaKey; status: Status; time?: string; phone: string; qr: string; dietary?: string; plusOne?: boolean }

const POOL = ['Adebayo Ogunlesi', 'Chiamaka Obi', 'Folake Adeyemi', 'Ikenna Eze', 'Morounkeji Bello', 'Nnamdi Okafor', 'Oluwaseun Ajayi', 'Temitope Adewale', 'Uzoamaka Nwachukwu', 'Yinka Oladipo']
const POOL_RSVP: Status[] = ['yes', 'yes', 'pending', 'yes', 'no', 'yes', 'pending', 'yes', 'yes', 'pending']

const STATUS: Record<Status, { label: (r: Row) => string; tone: 'success' | 'neutral' | 'info' | 'warn' | 'danger' }> = {
  in: { label: (r) => `Checked in ${r.time}`, tone: 'success' },
  expected: { label: () => 'Expected', tone: 'neutral' },
  walkin: { label: () => 'Walk-in · in', tone: 'info' },
  yes: { label: () => 'RSVP yes', tone: 'success' },
  pending: { label: () => 'Pending', tone: 'warn' },
  no: { label: () => 'Declined', tone: 'danger' },
}

const initials = (name: string) => name.replace(/^(Mr|Mrs|Dr|Chief|Aunty|Uncle|Pastor|Deaconess|Brother)\s+(&\s+Mrs\s+)?/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

function Face({ row, size = 44 }: { row: Row; size?: number }) {
  if (row.photo) return <Avatar who={row.photo} size={size} />
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-accent-soft font-bold text-on-accent-soft" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials(row.name)}
    </span>
  )
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-brass-soft px-[1px] text-on-brass-soft">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

function GuestRow({ r, q, onOpen }: { r: Row; q: string; onOpen: (r: Row) => void }) {
  return (
    <Pressable onClick={() => onOpen(r)} className="flex items-center gap-3 px-5 py-3">
      <Face row={r} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">
          <Highlight text={r.name} q={q} />
          {r.plusOne && <span className="ml-1.5 text-[12px] font-bold text-text-2">+1</span>}
        </span>
        <span className="block truncate text-[13px] text-text-2">
          {r.group} · {r.table}
          {r.dietary && <span className="text-brass-ink"> · {r.dietary}</span>}
        </span>
      </span>
      <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label(r)}</Badge>
    </Pressable>
  )
}

export default function ProGuests() {
  const { navigate, toast } = useNav()
  const eventId = useSession((s) => s.viewingEvent)
  const checkedIn = useSession((s) => s.checkedIn)
  const walkIns = useSession((s) => s.walkIns)
  const guestsAdded = useSession((s) => s.guestsAdded)
  const ev = eventById(eventId)
  const tonight = ev.id === 'ev-engage'
  const ruby = ev.id === 'ev-ruby'

  const [q, setQ] = useState('Ade')
  const [table, setTable] = useState<string | null>(null)
  const [open, setOpen] = useState<Row | null>(null)
  const [switching, setSwitching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newGuest, setNewGuest] = useState({ ...DEMO_GUEST })

  const rows = useMemo<Row[]>(() => {
    const fromGuest = (g: Guest, status: Status, time?: string): Row => ({ id: g.id, name: g.name, group: g.group, table: g.table ?? 'Unassigned', photo: g.photo, status, time, phone: g.phone, qr: g.qr, dietary: g.dietary, plusOne: g.plusOne })
    if (tonight) {
      const named = TONIGHT_GUESTS.map((g) => {
        const pre = TONIGHT_CHECKED_IN.indexOf(g.id)
        const isIn = checkedIn.includes(g.id)
        const time = pre >= 0 ? `18:${String(31 + Math.floor(pre * 0.6)).padStart(2, '0')}` : CLOCK.time
        return fromGuest(g, isIn ? 'in' : 'expected', isIn ? time : undefined)
      })
      const walk: Row[] = walkIns.map((w) => ({ id: w.id, name: w.name, group: `Walk-in · party of ${w.party}`, table: 'Table 9', status: 'walkin', time: CLOCK.time, phone: '—', qr: `EDR-WALK-${w.id.slice(-4)}` }))
      return [...walk, ...named]
    }
    if (ruby) {
      const added: Row[] = guestsAdded.map((g) => ({ id: g.id, name: g.name, group: g.group, table: g.table, status: 'pending', phone: '+44 7700 900312', qr: `EDR-RUBY-${g.id.slice(-4).toUpperCase()}` }))
      return [...added, ...RUBY_GUESTS.map((g) => fromGuest(g, g.rsvp))]
    }
    return POOL.map((name, i) => ({ id: `${ev.id}-${i}`, name, group: ['Family', 'Friends', 'Colleagues'][i % 3], table: `Table ${1 + (i % 4)}`, status: POOL_RSVP[i], phone: `+44 7700 9005${String(10 + i).padStart(2, '0')}`, qr: `EDR-${ev.id.slice(3, 6).toUpperCase()}-${3100 + i * 7}` }))
  }, [tonight, ruby, ev.id, checkedIn, walkIns, guestsAdded])

  /* headline numbers */
  const live = tonight ? TONIGHT_TOTALS.checkedIn + (checkedIn.length - TONIGHT_CHECKED_IN.length) + walkIns.reduce((a, w) => a + w.party, 0) : 0
  const yes = ruby ? RUBY_TOTALS.yes : rows.filter((r) => r.status === 'yes').length
  const pending = ruby ? RUBY_TOTALS.pending + guestsAdded.length : rows.filter((r) => r.status === 'pending').length
  const no = ruby ? RUBY_TOTALS.no : rows.filter((r) => r.status === 'no').length
  const expected = tonight ? TONIGHT_TOTALS.expected : ruby ? RUBY_TOTALS.invited : ev.guests
  const big = tonight ? live : yes
  const ring = pct(big, expected)

  /* tables */
  const tables = useMemo(() => {
    if (tonight) {
      const byTable = (t: string) => rows.filter((r) => r.table === t && (r.status === 'in' || r.status === 'walkin')).length
      const rest = [7, 6, 5, 3, 2]
      return Array.from({ length: 9 }, (_, i) => {
        const name = `Table ${i + 1}`
        const seated = i < 4 ? byTable(name) : i === 8 ? rest[4] + walkIns.reduce((a, w) => a + w.party, 0) : rest[i - 4]
        return { name, seated, cap: 10 }
      })
    }
    if (ruby) {
      const seats = [8, 7, 6, 5, 7, 6, 8, 5, 6, 7, 6, 5, 7, 6, 8, 6, 5, 4]
      return seats.map((seated, i) => ({ name: `Table ${i + 1}`, seated, cap: 10 }))
    }
    return Array.from({ length: Math.max(4, Math.ceil(ev.guests / 10)) }, (_, i) => ({ name: `Table ${i + 1}`, seated: [8, 6, 9, 4, 7, 5, 8, 6, 3, 7, 6, 8, 5, 9, 4][i % 15], cap: 10 }))
  }, [tonight, ruby, rows, walkIns, ev.guests])
  const tableNames = tables.map((t) => t.name)

  /* list: matches first, then everyone else */
  const inTable = (r: Row) => !table || r.table === table
  const matches = rows.filter((r) => inTable(r) && q && r.name.toLowerCase().includes(q.toLowerCase()))
  const others = rows.filter((r) => inTable(r) && !matches.includes(r))

  const checkIn = (r: Row) => {
    session.checkIn(r.id)
    track('manual_checkin', r.id)
    toast(`${r.name} checked in · ${r.table}`, 'accent')
    setOpen(null)
  }

  return (
    <MobileScreen
      header={<TopBar title={ev.name} sub={`${fmtDay(ev.date)} · ${ev.venue}`} right={<IconButton icon={CalendarDays} label="Switch event" onClick={() => setSwitching(true)} />} />}
      dock={
        <Dock>
          {tonight ? (
            <Button variant="paper" icon={UserPlus} onClick={() => navigate('pro.checkin')}>
              Walk-in
            </Button>
          ) : (
            <Button variant="paper" icon={UserPlus} onClick={() => setAdding(true)}>
              Add guest
            </Button>
          )}
          <Button variant="accent" block icon={DoorOpen} onClick={() => { track('open_door', ev.id); navigate('pro.checkin') }}>
            Open the door
          </Button>
        </Dock>
      }
      overlay={
        <>
          {/* Guest detail */}
          <BottomSheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
            {open && (
              <div className="pb-2">
                <div className="flex items-center gap-4">
                  <Face row={open} size={64} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">{open.group}</p>
                    <p className="text-[13px] text-text-2">{open.table}{open.plusOne ? ' · plus one' : ''}{open.dietary ? ` · ${open.dietary}` : ''}</p>
                    <div className="mt-1.5"><Badge tone={STATUS[open.status].tone}>{STATUS[open.status].label(open)}</Badge></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 rounded-[var(--r-card)] bg-[var(--surface-high)] p-3">
                  <QrCode seed={open.qr} size={88} />
                  <div className="min-w-0">
                    <p className="label text-brass-ink">QR invite</p>
                    <p className="meta mt-1 text-text">{open.qr}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[13px] text-text-2"><Phone size={13} aria-hidden /> {open.phone}</p>
                    <p className="mt-1 text-[12px] text-text-2">{tonight ? 'Scans once at the door · duplicates are flagged' : 'Sent by WhatsApp and email'}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {tonight && (open.status === 'expected' ? (
                    <Button variant="accent" block icon={QrIcon} onClick={() => checkIn(open)}>
                      Check in manually
                    </Button>
                  ) : (
                    <Button variant="paper" block icon={QrIcon} onClick={() => { toast(`${open.name} is already in · scanned at ${open.time}`, 'warn'); setOpen(null) }}>
                      Already in at {open.time}
                    </Button>
                  ))}
                  {!tonight && (
                    <Button variant="accent" block icon={Send} onClick={() => { track('resend_invite', open.id); toast(`Invite resent to ${open.name} by WhatsApp`, 'accent'); setOpen(null) }}>
                      Resend invite
                    </Button>
                  )}
                  <Button variant="ghost" icon={Phone} onClick={() => { toast(`Calling ${open.name}…`); setOpen(null) }}>
                    Call
                  </Button>
                </div>
              </div>
            )}
          </BottomSheet>

          {/* Switch event */}
          <BottomSheet open={switching} onClose={() => setSwitching(false)} title="Which guest list?">
            <ul className="pb-2">
              {EVENTS.map((e) => (
                <li key={e.id}>
                  <Pressable onClick={() => { session.viewEvent(e.id); setTable(null); setSwitching(false) }} className={`flex items-center gap-3 rounded-[var(--r-card)] px-2 py-2.5 ${e.id === ev.id ? 'bg-accent-soft' : ''}`}>
                    <img src={img(e.photo, 120)} alt="" className="h-12 w-12 rounded-[12px] object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{e.name}</span>
                      <span className="block text-[13px] text-text-2">{fmtDay(e.date)} · {e.guests} guests · {relDay(e.date)}</span>
                    </span>
                    {e.status === 'live' && <Badge tone="solid">Live</Badge>}
                  </Pressable>
                </li>
              ))}
            </ul>
          </BottomSheet>

          {/* Add guest */}
          <BottomSheet open={adding} onClose={() => setAdding(false)} title="Add a guest">
            <div className="grid gap-3 pb-2">
              <Input label="Full name" value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} />
              <Input label="Phone (for the QR invite)" value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} inputMode="tel" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Group" value={newGuest.group} onChange={(e) => setNewGuest({ ...newGuest, group: e.target.value })} />
                <Input label="Table" value={newGuest.table} onChange={(e) => setNewGuest({ ...newGuest, table: e.target.value })} />
              </div>
              <Button variant="accent" size="lg" block icon={UserPlus} onClick={() => { session.addGuest({ name: newGuest.name, group: newGuest.group, table: newGuest.table }); track('add_guest'); toast(`${newGuest.name} added · QR invite queued`, 'accent'); setAdding(false) }}>
                Add and send invite
              </Button>
            </div>
          </BottomSheet>
        </>
      }
    >
      {/* Oversized numerals */}
      <section className="flex items-end justify-between gap-4 px-5 pt-3">
        <div>
          <p className="label text-brass-ink">{tonight ? 'Checked in · live' : 'Said yes'}</p>
          <Figure value={big} unit={`of ${expected}`} size={76} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {tonight ? (
              <>
                <StateDot state="free" label={`${expected - live} to come`} />
                <StateDot state="held" label={`${TONIGHT_TOTALS.walkIns + walkIns.length} walk-ins`} />
                <StateDot state="booked" label={`${TONIGHT_TOTALS.flagged} duplicate`} />
              </>
            ) : (
              <>
                <StateDot state="held" label={`${pending} pending`} />
                <StateDot state="booked" label={`${no} declined`} />
              </>
            )}
          </div>
        </div>
        <ProgressRing value={ring} size={92} stroke={8} color={tonight ? 'var(--accent)' : 'var(--brass)'}>
          <span className="figure num text-[22px]">{ring}<span className="unit" style={{ fontSize: 11 }}>%</span></span>
        </ProgressRing>
      </section>

      {/* Invites band */}
      <section className="mx-4 mt-5 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[13px] font-bold"><QrIcon size={15} aria-hidden className="text-accent-ink" /> QR invites</p>
          <span className="num text-[13px] font-bold text-text-2">{tonight ? `${expected} sent · scanning live` : ruby ? `${RUBY_TOTALS.invitesSent} of ${expected} sent` : `${Math.round(expected * 0.8)} of ${expected} sent`}</span>
        </div>
        <Bar value={tonight ? 100 : ruby ? pct(RUBY_TOTALS.invitesSent, expected) : 80} tone="accent" height={6} className="mt-2.5" track="rgb(18 60 53 / 0.1)" />
        {!tonight && (
          <button type="button" onClick={() => { track('send_remaining_invites'); toast(`${ruby ? RUBY_TOTALS.pending : Math.round(expected * 0.2)} invites queued · WhatsApp + email`, 'accent') }} className="mt-2 flex h-9 items-center text-[13px] font-bold text-accent-ink">
            Send the remaining {ruby ? expected - RUBY_TOTALS.invitesSent : Math.round(expected * 0.2)} →
          </button>
        )}
      </section>

      {/* Search */}
      <div className="mt-5 px-5">
        <Input
          label="Find a guest"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          leading={<Search size={16} aria-hidden />}
          trailing={q ? <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="grid h-8 w-8 place-items-center rounded-full"><X size={15} aria-hidden /></button> : undefined}
          dense
        />
      </div>
      <Rail className="mt-3" gap={6}>
        <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => setTable(null)} className={`h-8 shrink-0 snap-start rounded-full px-3 text-[13px] font-semibold ${table === null ? 'bg-accent text-on-accent' : 'text-text shadow-[inset_0_0_0_1px_var(--rule-strong)]'}`}>
          All tables
        </motion.button>
        {tableNames.map((t) => (
          <motion.button key={t} type="button" whileTap={tap} transition={spring.ui} onClick={() => setTable(table === t ? null : t)} className={`h-8 shrink-0 snap-start rounded-full px-3 text-[13px] font-semibold ${table === t ? 'bg-accent text-on-accent' : 'text-text shadow-[inset_0_0_0_1px_var(--rule-strong)]'}`}>
            {t.replace('Table ', 'T')}
          </motion.button>
        ))}
      </Rail>

      {/* List */}
      <motion.div key={`${ev.id}-${table ?? 'all'}-${q}`} variants={listParent} initial="hidden" animate="show" className="mt-3">
        {q && (
          <div className="flex items-center justify-between px-5 pb-1 pt-2">
            <p className="label text-brass-ink">{matches.length} match{matches.length === 1 ? '' : 'es'} for “{q}”</p>
          </div>
        )}
        {matches.map((r) => (
          <motion.div key={r.id} variants={listItem}><GuestRow r={r} q={q} onOpen={setOpen} /></motion.div>
        ))}
        {q && others.length > 0 && <p className="label px-5 pb-1 pt-4 text-text-2">Everyone else{table ? ` at ${table}` : ''}</p>}
        {others.map((r) => (
          <motion.div key={r.id} variants={listItem}><GuestRow r={r} q={q} onOpen={setOpen} /></motion.div>
        ))}
        {tonight && !table && <p className="meta px-5 pt-2 text-text-2">+ {expected - TONIGHT_GUESTS.length} more on the list · scroll in the door view</p>}
        {ruby && !table && <p className="meta px-5 pt-2 text-text-2">+ {expected - RUBY_GUESTS.length - guestsAdded.length} more invited · grouped by family, church, colleagues, friends</p>}
      </motion.div>

      {/* Tables bento */}
      <SectionHead className="mt-7" eyebrow={`${tables.length} tables · ${tables.length * 10} seats`} title={tonight ? 'Seated so far' : 'Who sits where'} action="Table plan" onAction={() => { session.viewEvent(ev.id); navigate('pro.event') }} />
      <div className="mt-3 grid grid-cols-4 gap-2 px-4">
        {tables.slice(0, ruby ? 8 : 9).map((t, i) => {
          const full = t.seated >= t.cap
          const empty = t.seated === 0
          const tone = full ? 'bg-ink text-on-ink' : empty ? 'well text-text' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'
          return (
            <motion.button
              key={t.name}
              type="button"
              whileTap={tap}
              transition={spring.ui}
              onClick={() => setTable(table === t.name ? null : t.name)}
              className={`flex min-h-[78px] flex-col justify-between rounded-[var(--r-card)] p-2.5 text-left ${tone} ${i === 0 ? 'col-span-2' : ''} ${table === t.name ? 'ring-2 ring-brass' : ''}`}
            >
              <span className={`label ${full ? 'text-on-ink-2' : 'text-text-2'}`}>{i === 0 ? `${t.name} · ${tonight ? 'couple' : 'top table'}` : t.name.replace('Table ', 'T')}</span>
              <span>
                <span className="figure num text-[22px]">{t.seated}<span className="unit" style={{ fontSize: 11 }}>/{t.cap}</span></span>
                <span className="mt-1.5 block h-[4px] w-full overflow-hidden rounded-full" style={{ background: full ? 'rgb(255 255 255 / 0.15)' : 'var(--surface-high)' }}>
                  <span className="block h-full rounded-full" style={{ width: `${pct(t.seated, t.cap)}%`, background: full ? AVAIL.free.fill : tonight ? 'var(--accent)' : 'var(--brass)' }} />
                </span>
              </span>
            </motion.button>
          )
        })}
        {tables.length > 9 && (
          <button type="button" onClick={() => { session.viewEvent(ev.id); navigate('pro.event') }} className="flex min-h-[78px] flex-col justify-center rounded-[var(--r-card)] bg-brass-soft p-2.5 text-left text-on-brass-soft">
            <span className="figure num text-[22px]">+{tables.length - 8}</span>
            <span className="label">more tables</span>
          </button>
        )}
      </div>
      <p className="meta mt-3 px-5 text-text-2">{tonight ? 'Counts update with every scan · Adaora sees the same numbers in her app' : 'Seating from the RSVP list · the client sees a summary in her app'}</p>
    </MobileScreen>
  )
}
