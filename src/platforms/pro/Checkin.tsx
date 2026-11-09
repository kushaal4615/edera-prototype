import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleCheck, CircleX, Copy, Flashlight, Minus, Plus, ScanLine, Search, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Figure, QrCode } from '../../components/Brand'
import { Button } from '../../components/Button'
import { ProgressRing } from '../../components/Charts'
import { Field, Input } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { ago, CLOCK, pct } from '../../data/clock'
import { DEMO_MANUAL_CHECKIN, DEMO_WALKIN } from '../../data/demoFill'
import { SCAN_LOG, TONIGHT, TONIGHT_CHECKED_IN, TONIGHT_GUESTS, TONIGHT_TOTALS } from '../../data/events'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { useReducedMotion } from '../../motion/useReducedMotion'
import { Dock, MobileScreen, SAFE_TOP, safeBottom, TABBAR_H } from '../mobileShell'

/* pro.checkin: THE DOOR. A night screen: the camera viewfinder with a
   brass reticle and a sweeping scan line, the live count against 90, the
   last-scan result card that changes state (admitted / already scanned /
   walk-in / not found), the scan log, and a dock that simulates the next
   scan. Every scan writes to the store, so the client's app and the guest
   list count the same number. */

type Result = 'ok' | 'duplicate' | 'walkin' | 'notfound'
type Scan = { id: string; guest: string; result: Result; minutesAgo: number; table: string; qr?: string }

const RESULT: Record<Result, { title: string; bg: string; fg: string; icon: typeof Check; fg2: string }> = {
  ok: { title: 'Admitted', bg: 'var(--accent)', fg: 'var(--on-accent)', fg2: 'var(--on-accent-2)', icon: CircleCheck },
  duplicate: { title: 'Already scanned', bg: 'var(--brass)', fg: 'var(--on-brass)', fg2: 'rgb(11 38 34 / 0.72)', icon: Copy },
  walkin: { title: 'Walk-in added', bg: 'var(--info)', fg: '#ffffff', fg2: 'rgb(255 255 255 / 0.78)', icon: UserPlus },
  notfound: { title: 'Not on the list', bg: 'var(--danger)', fg: 'var(--on-danger)', fg2: 'rgb(255 255 255 / 0.8)', icon: CircleX },
}
const LOG_TONE: Record<Result, string> = { ok: 'bg-accent text-on-accent', duplicate: 'bg-brass text-on-brass', walkin: 'bg-info text-white', notfound: 'bg-danger text-on-danger' }
const LOG_LABEL: Record<Result, string> = { ok: 'Admitted', duplicate: 'Duplicate scan', walkin: 'Walk-in', notfound: 'Not found' }

const GROUPS = ['Adaora’s colleagues', 'Adaora’s friends', 'Kunle’s friends', 'Family', 'Couple & parents']

export default function ProCheckin() {
  const { navigate, toast } = useNav()
  const reduce = useReducedMotion()
  const checkedIn = useSession((s) => s.checkedIn)
  const walkIns = useSession((s) => s.walkIns)

  const first = SCAN_LOG[0]
  const [last, setLast] = useState<Scan>({ ...first, qr: TONIGHT_GUESTS.find((g) => g.name === first.guest)?.qr })
  const [extra, setExtra] = useState<Scan[]>([])
  const [walkinOpen, setWalkinOpen] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [walkin, setWalkin] = useState({ name: DEMO_WALKIN.name, party: Number(DEMO_WALKIN.party), group: DEMO_WALKIN.group })
  const [query, setQuery] = useState(DEMO_MANUAL_CHECKIN)

  const live = TONIGHT_TOTALS.checkedIn + (checkedIn.length - TONIGHT_CHECKED_IN.length) + walkIns.reduce((a, w) => a + w.party, 0)
  const expected = TONIGHT_TOTALS.expected
  const share = pct(live, expected)
  const log = useMemo(() => [...extra, ...SCAN_LOG], [extra])
  const remaining = TONIGHT_GUESTS.filter((g) => !checkedIn.includes(g.id))

  const push = (s: Scan) => {
    setLast(s)
    setExtra((x) => [s, ...x])
  }

  const admit = (id: string, name: string, table: string, qr: string) => {
    session.checkIn(id)
    push({ id: `x-${Date.now()}`, guest: name, result: 'ok', minutesAgo: 0, table, qr })
    track('scan_admit', id)
    toast(`Admitted ${name} · ${table}`, 'accent')
  }

  const scanNext = () => {
    const next = remaining[0]
    if (!next) {
      toast('Everyone on the list is in', 'accent')
      return
    }
    admit(next.id, next.name, next.table ?? 'Table 1', next.qr)
  }

  const duplicate = (name: string, table: string, qr: string, time?: string) => {
    push({ id: `d-${Date.now()}`, guest: name, result: 'duplicate', minutesAgo: 0, table, qr })
    track('scan_duplicate')
    toast(`Already scanned · ${name}${time ? ` at ${time}` : ''}`, 'warn')
  }

  const addWalkin = () => {
    session.addWalkIn(walkin.name, walkin.party)
    push({ id: `w-${Date.now()}`, guest: `${walkin.name}${walkin.party > 1 ? ` (+${walkin.party - 1})` : ''}`, result: 'walkin', minutesAgo: 0, table: 'Table 9' })
    track('walkin_added', walkin.party)
    toast(`Walk-in added · ${walkin.name} · party of ${walkin.party} · Table 9`, 'info')
    setWalkinOpen(false)
  }

  const found = TONIGHT_GUESTS.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
  const Icon = RESULT[last.result].icon

  const timeFor = (id: string) => {
    const i = TONIGHT_CHECKED_IN.indexOf(id)
    return i >= 0 ? `18:${String(31 + Math.floor(i * 0.6)).padStart(2, '0')}` : CLOCK.time
  }

  return (
    <MobileScreen
      tab="scan"
      bg="var(--night)"
      cap="var(--night)"
      overlay={
        <>
          {/* Dock rendered after the tab bar so the scan action is the last docked control */}
          <div className="pointer-events-none absolute inset-x-0 z-20" style={{ bottom: safeBottom(TABBAR_H - 4) }}>
            <Dock tone="night">
              <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => setWalkinOpen(true)} className="flex h-[56px] w-[66px] shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] bg-[rgb(255_255_255/0.1)] text-on-night">
                <UserPlus size={19} strokeWidth={2.2} aria-hidden />
                <span className="text-[11px] font-bold">Walk-in</span>
              </motion.button>
              <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => setFindOpen(true)} aria-label="Find a guest" className="flex h-[56px] w-[66px] shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] bg-[rgb(255_255_255/0.1)] text-on-night">
                <Search size={19} strokeWidth={2.2} aria-hidden />
                <span className="text-[11px] font-bold">Find</span>
              </motion.button>
              <Button variant="accent" size="lg" block icon={ScanLine} onClick={scanNext}>
                Scan next
              </Button>
            </Dock>
          </div>

          {/* Walk-in */}
          <BottomSheet open={walkinOpen} onClose={() => setWalkinOpen(false)} title="Add a walk-in">
            <div className="grid gap-3 pb-2">
              <Input label="Guest name" value={walkin.name} onChange={(e) => setWalkin({ ...walkin, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Party size">
                  <div className="flex h-12 items-center justify-between rounded-[var(--r-control)] well px-1.5 ring-1 ring-inset ring-[var(--rule-strong)]">
                    <motion.button type="button" whileTap={tap} transition={spring.ui} aria-label="Fewer" onClick={() => setWalkin({ ...walkin, party: Math.max(1, walkin.party - 1) })} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface)] shadow-[var(--shadow-raised)]"><Minus size={16} aria-hidden /></motion.button>
                    <span className="num text-[17px] font-bold">{walkin.party}</span>
                    <motion.button type="button" whileTap={tap} transition={spring.ui} aria-label="More" onClick={() => setWalkin({ ...walkin, party: Math.min(8, walkin.party + 1) })} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface)] shadow-[var(--shadow-raised)]"><Plus size={16} aria-hidden /></motion.button>
                  </div>
                </Field>
                <Field label="Group">
                  <select value={walkin.group} onChange={(e) => setWalkin({ ...walkin, group: e.target.value })} className="h-12 w-full appearance-none rounded-[var(--r-control)] well px-3.5 text-[15px] outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                    {GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
              </div>
              <div className="flex items-center gap-3 rounded-[var(--r-card)] bg-info-soft p-3 text-on-info-soft">
                <Users size={18} aria-hidden />
                <p className="text-[13px] font-semibold">Seated at Table 9 (walk-ins) · {expected - live - walkin.party} seats stay free for the list</p>
              </div>
              <Button variant="accent" size="lg" block icon={UserPlus} onClick={addWalkin}>
                Add and admit
              </Button>
            </div>
          </BottomSheet>

          {/* Find a guest */}
          <BottomSheet open={findOpen} onClose={() => setFindOpen(false)} title="Find a guest" tall>
            <div className="pb-2">
              <Input label="Search the list" value={query} onChange={(e) => setQuery(e.target.value)} leading={<Search size={16} aria-hidden />} dense hint={`${found.length} of ${TONIGHT_GUESTS.length} named guests match`} />
              <ul className="mt-3">
                {found.map((g, i) => {
                  const isIn = checkedIn.includes(g.id)
                  return (
                    <li key={g.id} className="flex items-center gap-3 py-2.5" style={i > 0 ? { boxShadow: 'inset 0 1px 0 var(--rule)' } : undefined}>
                      {g.photo ? <Avatar who={g.photo} size={40} /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-on-accent-soft">{g.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold">{g.name}</span>
                        <span className="block text-[12px] text-text-2">{g.group} · {g.table}{g.plusOne ? ' · +1' : ''}</span>
                      </span>
                      {isIn ? (
                        <Button size="sm" variant="paper" icon={Check} onClick={() => { duplicate(g.name, g.table ?? 'Table 1', g.qr, timeFor(g.id)); setFindOpen(false) }}>
                          In · {timeFor(g.id)}
                        </Button>
                      ) : (
                        <Button size="sm" variant="accent" onClick={() => { admit(g.id, g.name, g.table ?? 'Table 1', g.qr); setFindOpen(false) }}>
                          Check in
                        </Button>
                      )}
                    </li>
                  )
                })}
                {found.length === 0 && <li className="py-6 text-center text-[14px] text-text-2">No one by that name · add them as a walk-in</li>}
              </ul>
            </div>
          </BottomSheet>
        </>
      }
    >
      {/* Viewfinder */}
      <section className="relative h-[352px] w-full">
        <div className="absolute inset-0" aria-hidden>
          <HeroImage src="qrPhone" alt="" scrim="full" className="h-full w-full" width={800} position="center 40%" />
        </div>
        <div className="relative flex h-full flex-col" style={{ paddingTop: SAFE_TOP }}>
          <div className="flex items-start justify-between px-5 pt-2">
            <div className="min-w-0">
              <p className="label text-brass-light">{TONIGHT.venue}</p>
              <p className="grot mt-0.5 truncate text-[24px] text-on-night">Adaora & Kunle</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-on-night-2">
                <span className="relative grid h-3 w-3 place-items-center">
                  <span className="absolute h-3 w-3 animate-ping rounded-full bg-[var(--ever-400)] opacity-60" aria-hidden />
                  <span className="h-2 w-2 rounded-full bg-[var(--ever-400)]" />
                </span>
                Doors {TONIGHT_TOTALS.doors} · live · {CLOCK.time}
              </p>
            </div>
            <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => toast('Torch on', 'neutral')} aria-label="Torch" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgb(255_255_255/0.14)] text-on-night backdrop-blur-md">
              <Flashlight size={19} aria-hidden />
            </motion.button>
          </div>

          <div className="grid flex-1 place-items-center pb-6">
            <div className="relative h-[184px] w-[184px]">
              {/* brass corners */}
              {(['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-[18px]', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-[18px]', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[18px]', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[18px]'] as const).map((c) => (
                <span key={c} aria-hidden className={`pointer-events-none absolute h-9 w-9 border-brass ${c}`} />
              ))}
              <span aria-hidden className="pointer-events-none absolute inset-[3px] rounded-[16px] bg-[rgb(255_255_255/0.04)]" />
              {/* scan line */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-3 right-3 h-[2px] rounded-full bg-brass-light"
                style={{ boxShadow: '0 0 14px 2px rgb(230 194 124 / 0.6)' }}
                initial={{ top: reduce ? '50%' : '8%' }}
                animate={reduce ? { top: '50%' } : { top: ['8%', '90%', '8%'] }}
                transition={reduce ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <p className="meta pointer-events-none absolute -bottom-8 left-1/2 w-max -translate-x-1/2 text-on-night-2">Point at the guest’s QR invite</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live count */}
      <section className="flex items-end justify-between gap-4 px-5 pt-4">
        <div>
          <p className="label text-on-night-2">Checked in</p>
          <Figure value={live} unit={`of ${expected}`} size={80} tone="var(--on-night)" />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-bold text-on-night-2">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--ever-400)]" />{expected - live} to come</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brass" />{TONIGHT_TOTALS.walkIns + walkIns.length} walk-ins</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F08A96]" />{TONIGHT_TOTALS.flagged + extra.filter((x) => x.result === 'duplicate').length} duplicate</span>
          </div>
        </div>
        <ProgressRing value={share} size={88} stroke={7} color="var(--brass)">
          <span className="figure num text-[24px] text-on-night">{share}<span className="unit">%</span></span>
        </ProgressRing>
      </section>

      {/* Last scan */}
      <section className="mt-5 px-4">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={last.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            transition={spring.pop}
            className="relative flex items-center gap-4 overflow-hidden rounded-[var(--r-container)] p-4"
            style={{ background: RESULT[last.result].bg, color: RESULT[last.result].fg }}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[rgb(255_255_255/0.18)]">
              <Icon size={26} strokeWidth={2.4} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="label" style={{ color: RESULT[last.result].fg2 }}>Last scan · {ago(last.minutesAgo)}</p>
              <p className="grot mt-0.5 text-[24px]">{RESULT[last.result].title}</p>
              <p className="truncate text-[14px] font-semibold" style={{ color: RESULT[last.result].fg2 }}>
                {last.guest}{last.table !== '–' ? ` · ${last.table}` : ''}
              </p>
            </div>
            {last.qr && <QrCode seed={last.qr} size={52} dark="rgb(255 255 255 / 0.92)" light="transparent" />}
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 flex items-center gap-2.5 px-1">
          <Avatar who="adaora" size={26} />
          <p className="flex-1 text-[12px] font-semibold text-on-night-2">Client sees this live · Adaora’s app: {live} in</p>
          <Badge tone="solid">Live</Badge>
        </div>
      </section>

      {/* Scan log */}
      <section className="mt-6">
        <div className="flex items-end justify-between px-5">
          <div>
            <p className="label text-brass-light">On the door</p>
            <h2 className="grot text-[22px] text-on-night">{log.length} scans · {remaining.length} named to come</h2>
          </div>
          <button type="button" onClick={() => { session.viewEvent(TONIGHT.id); navigate('pro.guests') }} className="flex h-11 shrink-0 items-center text-[13px] font-bold text-brass-light">
            Full list
          </button>
        </div>
        <ul className="mt-2">
          {log.map((s, i) => (
            <motion.li key={s.id} layout initial={reduce || i > 0 ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring.ui} className="flex items-center gap-3 px-5 py-2.5" style={i > 0 ? { boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.07)' } : undefined}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${LOG_TONE[s.result]}`}>
                {s.result === 'ok' ? <Check size={17} strokeWidth={2.8} aria-hidden /> : s.result === 'duplicate' ? <Copy size={15} aria-hidden /> : s.result === 'walkin' ? <UserPlus size={15} aria-hidden /> : <CircleX size={16} aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-on-night">{s.guest}</span>
                <span className="block text-[12px] font-semibold text-on-night-2">{LOG_LABEL[s.result]}{s.table !== '–' ? ` · ${s.table}` : ' · code EDR-ENG-???? not issued for tonight'}</span>
              </span>
              <span className="meta shrink-0 text-on-night-2">{ago(s.minutesAgo)}</span>
            </motion.li>
          ))}
        </ul>
        <p className="meta mx-5 mt-3 text-on-night-2">Scans also appear on the guest list and in Adaora’s client app in real time.</p>
      </section>
      <div aria-hidden style={{ height: 84 }} />
    </MobileScreen>
  )
}
