import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Building2, CalendarDays, Check, CircleAlert, CircleHelp, Clock3, Download, FileCheck2, FileSearch, FileX2, MapPin, MessageCircleQuestion, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Figure, Verified } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { Confetti } from '../../components/Confetti'
import { TextArea } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { Drawer, Modal } from '../../components/Sheet'
import { VERIFY_QUEUE, verifyById, type VerifyCase, type VerifyState } from '../../data/admin'
import { fmtDay, relDay } from '../../data/clock'
import { DEMO_REJECT_NOTE, DEMO_VERIFY_NOTE } from '../../data/demoFill'
import { personById } from '../../data/people'
import { categoryById, type Region } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession, type SessionState } from '../../lib/store'
import { track } from '../../lib/tracker'
import { listItem, listParent } from '../../motion/transitions'
import { useViewerMode } from '../../viewer/useViewerMode'
import { ConsoleShell, pendingCases } from '../console/shell'

/* admin.verification: master-detail. The queue on the left as a
   borderless editorial list; the case inspector on the right as a sticky
   column (a Drawer under 768px). Decisions write to the session so the
   sidebar count drops and the vendor's listing gains the badge. */

type Filter = 'all' | VerifyState
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'info', label: 'Info requested' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const effective = (c: VerifyCase, s: SessionState): VerifyState => s.verifyDecisions[c.id] ?? c.state
const isOpen = (st: VerifyState) => st === 'pending' || st === 'info'

const STATE_BADGE: Record<VerifyState, { tone: 'warn' | 'info' | 'success' | 'danger'; label: string }> = {
  pending: { tone: 'warn', label: 'Pending' },
  info: { tone: 'info', label: 'Info requested' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
}

function FilterChip({ on, onClick, children, count }: { on: boolean; onClick: () => void; children: ReactNode; count?: number }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onClick} aria-pressed={on} className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors ${on ? 'bg-ink text-on-ink' : 'text-text hover:bg-[var(--surface-high)]'}`} style={on ? undefined : { boxShadow: 'inset 0 0 0 1px var(--rule-strong)' }}>
      {children}
      {count !== undefined && <span className={`num rounded-full px-1.5 text-[11px] ${on ? 'bg-[rgb(255_255_255/0.18)]' : 'bg-[var(--surface-high)]'}`}>{count}</span>}
    </motion.button>
  )
}

export default function AdminVerification() {
  const { toast } = useNav()
  const sessionState = useSession((s) => s)
  const viewing = useSession((s) => s.viewingCase)
  const pending = useSession(pendingCases)
  const phone = useViewerMode() === 'phone'
  const [filter, setFilter] = useState<Filter>('all')
  const [region, setRegion] = useState<Region | 'all'>('all')
  const [drawer, setDrawer] = useState(false)

  const rows = VERIFY_QUEUE.filter((c) => (filter === 'all' ? true : effective(c, sessionState) === filter)).filter((c) => (region === 'all' ? true : c.region === region))
  const counts = (f: Filter) => (f === 'all' ? VERIFY_QUEUE.length : VERIFY_QUEUE.filter((c) => effective(c, sessionState) === f).length)
  const current = verifyById(viewing)

  const select = (id: string) => {
    session.viewCase(id)
    track('admin_view_case', id)
    if (phone) setDrawer(true)
  }
  const nextCase = () => {
    const order = VERIFY_QUEUE.filter((c) => isOpen(effective(c, sessionState)) && c.id !== viewing)
    if (!order.length) return toast('Queue cleared. Nothing else is waiting.', 'accent')
    const after = order.find((c) => VERIFY_QUEUE.indexOf(c) > VERIFY_QUEUE.indexOf(current)) ?? order[0]
    session.viewCase(after.id)
  }

  const ukOpen = VERIFY_QUEUE.filter((c) => c.region === 'uk' && isOpen(effective(c, sessionState))).length
  const ngOpen = VERIFY_QUEUE.filter((c) => c.region === 'ng' && isOpen(effective(c, sessionState))).length

  return (
    <ConsoleShell
      active="admin.verification"
      title="Verification"
      sub={`${pending} waiting · UK ${ukOpen} · Nigeria ${ngOpen} · oldest ${relDay(VERIFY_QUEUE.filter((c) => isOpen(effective(c, sessionState))).at(-1)?.submitted ?? VERIFY_QUEUE[0].submitted)}`}
      actions={
        <>
          <Button size="sm" variant="outline" icon={Download} onClick={() => toast('Queue exported · verification-queue-21-nov.csv', 'accent')}>
            Export queue
          </Button>
          <Button size="sm" icon={ArrowRight} onClick={nextCase}>
            Next pending
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-6 px-8 pb-10 max-md:grid-cols-1 max-md:px-4">
        {/* ── Master list ── */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <FilterChip key={f.id} on={filter === f.id} onClick={() => setFilter(f.id)} count={counts(f.id)}>
                {f.label}
              </FilterChip>
            ))}
            <span aria-hidden className="mx-1 h-6 w-px bg-[var(--rule-strong)] max-md:hidden" />
            {(['all', 'uk', 'ng'] as const).map((r) => (
              <FilterChip key={r} on={region === r} onClick={() => setRegion(r)}>
                {r === 'all' ? 'Both markets' : r === 'uk' ? 'UK' : 'NG'}
              </FilterChip>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-end gap-6 rounded-[var(--r-card)] bg-[var(--surface-tint)] px-5 py-4 max-md:grid-cols-2">
            <div>
              <span className="label text-text-2">In the queue</span>
              <Figure value={pending} unit="open cases" size={44} className="mt-1 block" />
            </div>
            <div className="text-right max-md:text-left">
              <span className="label text-text-2">Approved · 7d</span>
              <span className="figure num mt-1 block text-[28px]">19</span>
            </div>
            <div className="text-right max-md:col-span-2 max-md:text-left">
              <span className="label text-text-2">Median turnaround</span>
              <span className="figure num mt-1 block text-[28px]">
                1.6<span className="unit">days</span>
              </span>
            </div>
          </div>

          <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-3 flex flex-col">
            <li className="label grid grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1fr)_110px_120px] gap-3 px-3 pb-2 pt-1 text-text-2 max-md:hidden">
              <span />
              <span>Business · applicant</span>
              <span>Category · city</span>
              <span>Submitted</span>
              <span className="text-right">State</span>
            </li>
            {rows.map((c) => {
              const p = personById(c.person)
              const st = effective(c, sessionState)
              const on = c.id === viewing
              return (
                <motion.li key={c.id} variants={listItem} layout>
                  <Pressable
                    onClick={() => select(c.id)}
                    aria-current={on ? 'true' : undefined}
                    className={`grid min-h-[64px] grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1fr)_110px_120px] items-center gap-3 rounded-[var(--r-card)] px-3 py-2.5 transition-colors max-md:grid-cols-[44px_minmax(0,1fr)_auto] ${on ? 'bg-[var(--surface)] shadow-[var(--shadow-raised)] ring-1 ring-inset ring-[var(--accent)]' : 'hover:bg-[var(--surface-high)]'}`}
                  >
                    <Avatar who={p.photo} size={40} ring={on} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-bold">{c.business}</span>
                        <Badge tone={c.role === 'Venue' ? 'ink' : c.role === 'Planner' ? 'accent' : 'neutral'} className="max-md:hidden">
                          {c.role}
                        </Badge>
                      </span>
                      <span className="block truncate text-[12px] text-text-2">
                        {p.name} · {c.years} yrs in operation
                        <span className="md:hidden">
                          {' '}
                          · {categoryById(c.category).label} · {c.city}
                        </span>
                      </span>
                    </span>
                    <span className="min-w-0 text-[13px] max-md:hidden">
                      <span className="block truncate font-semibold">{categoryById(c.category).label}</span>
                      <span className="block truncate text-[12px] text-text-2">
                        {c.city} · {c.region.toUpperCase()}
                      </span>
                    </span>
                    <span className="text-[13px] max-md:hidden">
                      <span className="block font-semibold">{relDay(c.submitted)}</span>
                      <span className="meta block text-text-2">{fmtDay(c.submitted)}</span>
                    </span>
                    <span className="flex justify-end">
                      <Badge tone={STATE_BADGE[st].tone}>{STATE_BADGE[st].label}</Badge>
                    </span>
                  </Pressable>
                </motion.li>
              )
            })}
            {rows.length === 0 && <li className="px-3 py-10 text-center text-[13px] text-text-2">Nothing matches these filters.</li>}
          </motion.ul>
        </div>

        {/* ── Inspector (desktop) ── */}
        <aside className="scroll-y sticky top-0 max-h-[744px] self-start overflow-y-auto rounded-[var(--r-container)] max-md:hidden">
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8, transition: { duration: 0.12 } }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
              <CaseInspector c={current} state={effective(current, sessionState)} decidedNow={!!sessionState.verifyDecisions[current.id]} onNext={nextCase} />
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={`Case ${current.id.toUpperCase()}`} width={460}>
        <CaseInspector c={current} state={effective(current, sessionState)} decidedNow={!!sessionState.verifyDecisions[current.id]} onNext={nextCase} bare />
      </Drawer>
    </ConsoleShell>
  )
}

/* ── The inspector: used in the sticky column and in the phone drawer ── */

const DOC_ICON = {
  ok: { Icon: FileCheck2, cls: 'bg-success-soft text-[var(--on-success-soft)]', label: 'Checked' },
  check: { Icon: FileSearch, cls: 'bg-warn-soft text-[var(--on-warn-soft)]', label: 'Needs a look' },
  missing: { Icon: FileX2, cls: 'bg-danger-soft text-[var(--on-danger-soft)]', label: 'Missing' },
} as const

function CaseInspector({ c, state, decidedNow, onNext, bare = false }: { c: VerifyCase; state: VerifyState; decidedNow: boolean; onNext: () => void; bare?: boolean }) {
  const { toast } = useNav()
  const p = personById(c.person)
  const [note, setNote] = useState(DEMO_VERIFY_NOTE)
  const [rejectNote, setRejectNote] = useState(DEMO_REJECT_NOTE)
  const [reject, setReject] = useState(false)
  const [burst, setBurst] = useState(false)
  const open = isOpen(state)
  const okDocs = c.docs.filter((d) => d.state === 'ok').length
  const okChecks = c.checks.filter((k) => k.ok === true).length

  const approve = () => {
    session.decideVerification(c.id, 'approved')
    track('admin_verify', 'approved')
    setBurst(true)
    setTimeout(() => setBurst(false), 1700)
    toast(`${c.business} approved · Verified Professional badge issued`, 'accent')
  }
  const requestInfo = () => {
    session.decideVerification(c.id, 'info')
    track('admin_verify', 'info')
    toast(`${p.first} asked for more documents · reminder in 3 days`, 'info')
  }
  const sendRejection = () => {
    session.decideVerification(c.id, 'rejected')
    track('admin_verify', 'rejected')
    setReject(false)
    toast(`${c.business} rejected · ${p.first} can re-apply with the right document`, 'danger')
  }

  return (
    <section className={`relative ${bare ? '' : 'overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]'}`}>
      {burst && <Confetti origin={0.3} />}
      <HeroImage src={c.photo} alt="" scrim="b" width={900} className={`h-[84px] ${bare ? 'rounded-[var(--r-card)]' : ''}`}>
        <div className="flex items-start justify-between p-3">
          <Badge tone="ink" className="bg-[rgb(11_38_34/0.55)] text-on-night backdrop-blur-sm">
            {c.role === 'Planner' ? 'Planner' : `${c.role} · ${categoryById(c.category).label}`}
          </Badge>
          <span className="meta rounded-full bg-[rgb(11_38_34/0.55)] px-2 py-0.5 text-on-night-2 backdrop-blur-sm">Case {c.id.toUpperCase()}</span>
        </div>
      </HeroImage>
      <div className={bare ? 'pt-0' : 'px-5 pb-4'}>
        <div className="flex items-end gap-3">
          <Avatar who={p.photo} size={64} ring verified={state === 'approved'} className="-mt-7" />
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="grot truncate text-[22px]">{c.business}</h3>
            <p className="truncate text-[13px] text-text-2">
              {p.name} · applied {relDay(c.submitted)}
            </p>
          </div>
        </div>

        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-semibold">
          <li className="flex items-center gap-1.5">
            <CalendarDays size={13} className="text-text-2" aria-hidden /> <span className="num">{c.years} years</span> <span className="text-text-2">in operation</span>
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin size={13} className="text-text-2" aria-hidden /> {c.city}
          </li>
          <li className="flex items-center gap-1.5">
            <Building2 size={13} className="text-text-2" aria-hidden /> {c.region === 'uk' ? 'United Kingdom' : 'Nigeria'}
          </li>
        </ul>

        {/* Decision banner */}
        <AnimatePresence initial={false}>
          {!open && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-4 flex items-start gap-3 rounded-[var(--r-card)] p-4 ${state === 'approved' ? 'bg-accent text-on-accent' : 'bg-danger-soft text-[var(--on-danger-soft)]'}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${state === 'approved' ? 'bg-[rgb(255_255_255/0.18)]' : 'bg-[rgb(255_255_255/0.5)]'}`}>{state === 'approved' ? <BadgeCheck size={20} aria-hidden /> : <X size={20} aria-hidden />}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold">{state === 'approved' ? (decidedNow ? 'Approved just now' : 'Approved') : decidedNow ? 'Rejected just now' : 'Rejected'}</span>
                <span className={`mt-0.5 block text-[12.5px] ${state === 'approved' ? 'text-[var(--on-accent-2)]' : ''}`}>
                  {state === 'approved' ? `Verified Professional badge is live on ${c.business}. ${p.first} was emailed.` : c.note ?? `${p.first} was told what to fix and can re-apply.`}
                </span>
              </span>
            </motion.div>
          )}
          {state === 'info' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-[var(--r-card)] bg-info-soft p-4 text-[var(--on-info-soft)]">
              <MessageCircleQuestion size={20} className="mt-0.5 shrink-0" aria-hidden />
              <span className="text-[12.5px] leading-snug">
                <span className="block text-[14px] font-extrabold">Waiting on {p.first}</span>
                {c.note ?? 'More documents requested. A reminder goes out after 3 days.'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents */}
        <div className="mt-3 flex items-center justify-between">
          <h4 className="label text-text-2">Documents</h4>
          <span className="meta text-text-2">
            {okDocs} of {c.docs.length} checked
          </span>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1.5 max-md:grid-cols-1">
          {c.docs.map((d) => {
            const m = DOC_ICON[d.state]
            return (
              <li key={d.name}>
                <button type="button" onClick={() => toast(`Opening ${d.name} in the document viewer`, 'neutral')} className="flex min-h-[44px] w-full items-center gap-2 rounded-[var(--r-control)] bg-[var(--surface-raised)] px-2 py-1.5 text-left hover:bg-[var(--surface-high)]">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[8px] ${m.cls}`}>
                    <m.Icon size={15} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold leading-tight">{d.name}</span>
                    <span className={`block text-[11px] font-bold ${d.state === 'ok' ? 'text-accent-ink' : d.state === 'check' ? 'text-brass-ink' : 'text-danger-text'}`}>{m.label}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Automated checks */}
        <div className="mt-3 flex items-center justify-between">
          <h4 className="label text-text-2">Automated checks</h4>
          <span className="meta text-text-2">
            {okChecks} of {c.checks.length} passed
          </span>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1.5 max-md:grid-cols-1">
          {c.checks.map((k) => (
            <li key={k.label} className={`flex min-h-[36px] items-center gap-2 rounded-[var(--r-control)] px-2.5 py-1 text-[12px] font-semibold ${k.ok === true ? 'bg-success-soft text-[var(--on-success-soft)]' : k.ok === false ? 'bg-danger-soft text-[var(--on-danger-soft)]' : 'bg-[var(--surface-high)] text-text-2'}`}>
              {k.ok === true ? <Check size={15} strokeWidth={3} aria-hidden /> : k.ok === false ? <CircleAlert size={15} aria-hidden /> : <Clock3 size={15} aria-hidden />}
              <span className="min-w-0 flex-1 leading-tight">{k.label}</span>
              {k.ok === null && <span className="meta">pending</span>}
            </li>
          ))}
        </ul>

        {/* Note + actions */}
        {open ? (
          <>
            <div className="mt-2.5">
              <TextArea key={c.id} label="Reviewer note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="mt-2.5 flex gap-2">
              <Button block icon={BadgeCheck} onClick={approve}>
                Approve
              </Button>
              <Button variant="outline" block icon={CircleHelp} onClick={requestInfo}>
                Request info
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-1.5 text-[12px] leading-tight text-text-2">
                <Verified size={13} label={false} className="shrink-0" /> Approval puts the badge on every listing under {c.business}.
              </p>
              <Button variant="danger" size="sm" icon={X} onClick={() => setReject(true)}>
                Reject
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-5 flex gap-2">
            <Button variant="ink" block trailing={ArrowRight} onClick={onNext}>
              Next case
            </Button>
            <Button variant="outline" onClick={() => toast(`Decision on ${c.business} reopened for review`, 'neutral')}>
              Reopen
            </Button>
          </div>
        )}
      </div>

      <Modal open={reject} onClose={() => setReject(false)} title="Reject this application?">
        <p className="text-[14px] text-text-2">
          {p.name} ({c.business}) will get this reason by email and in the app, and can re-apply once the document is fixed. Nothing is published to the marketplace.
        </p>
        <div className="mt-4">
          <TextArea label="Reason sent to the applicant" rows={4} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setReject(false)}>
            Keep reviewing
          </Button>
          <Button variant="danger" icon={X} onClick={sendRejection}>
            Send rejection
          </Button>
        </div>
      </Modal>
    </section>
  )
}
