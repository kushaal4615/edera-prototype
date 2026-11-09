import { motion } from 'framer-motion'
import { ChevronUp, Flag, MessageSquareText, Plus, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar as RBar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar, Figure, StarRow } from '../../components/Brand'
import { Button } from '../../components/Button'
import { CHART } from '../../components/Charts'
import { TextArea } from '../../components/Form'
import { Modal } from '../../components/Sheet'
import { FLAGGED, KPI } from '../../data/admin'
import { ago } from '../../data/clock'
import { personById } from '../../data/people'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { ConsoleShell, Panel } from '../console/shell'

/* admin.reviews: Reviews & reports.
   Left: the moderation queue, each flag an editorial row with Keep / Remove.
   Right: the platform's rating picture. Below: the seed-circle feedback
   board, the call's "small circle of people use it first and tell us
   what to fix before we market it". */

type Decision = 'kept' | 'removed'
type Area = 'Guests' | 'Calendar' | 'Explore' | 'Invites' | 'Door'
type NoteStatus = 'Planned' | 'Shipped' | 'Considering'
type Note = { id: string; by: string; text: string; area: Area; status: NoteStatus; votes: number; daysAgo: number }

const AREAS: Area[] = ['Guests', 'Calendar', 'Explore', 'Invites', 'Door']
const STATUS_TONE: Record<NoteStatus, 'accent' | 'warn' | 'neutral'> = { Shipped: 'accent', Planned: 'warn', Considering: 'neutral' }

/** Feedback from the seed circle: the first people Dave knows using the app (demo notes). */
const SEED_NOTES: Note[] = [
  { id: 'sn1', by: 'chioma', text: 'Guest list needs a “maybe” RSVP, half my aunties will not commit.', area: 'Guests', status: 'Planned', votes: 14, daysAgo: 2 },
  { id: 'sn2', by: 'tunde', text: 'Let me duplicate a run-of-show from a past event.', area: 'Calendar', status: 'Shipped', votes: 22, daysAgo: 9 },
  { id: 'sn3', by: 'bola', text: 'Hall and catering calendars should merge into one view.', area: 'Calendar', status: 'Planned', votes: 18, daysAgo: 6 },
  { id: 'sn4', by: 'kunle', text: 'Show price in naira when I am in Lagos, pounds when I am home.', area: 'Explore', status: 'Shipped', votes: 31, daysAgo: 12 },
  { id: 'sn5', by: 'sade', text: 'Yorùbá translation on the invite itself, not just the app.', area: 'Invites', status: 'Planned', votes: 27, daysAgo: 4 },
  { id: 'sn6', by: 'ife', text: 'Export the guest list to a spreadsheet for the caterer.', area: 'Guests', status: 'Considering', votes: 9, daysAgo: 3 },
  { id: 'sn7', by: 'nkechi', text: 'QR invite should open in WhatsApp directly.', area: 'Invites', status: 'Shipped', votes: 35, daysAgo: 15 },
  { id: 'sn8', by: 'dapo', text: 'Venue tours as bookable slots on my calendar.', area: 'Door', status: 'Considering', votes: 7, daysAgo: 1 },
]

/** Rating distribution and reviews per week (demo values). */
const DISTRIBUTION = [
  { stars: 5, share: 71 },
  { stars: 4, share: 18 },
  { stars: 3, share: 6 },
  { stars: 2, share: 3 },
  { stars: 1, share: 2 },
]
const REVIEWS_PER_WEEK = [48, 56, 61, 70, 74, 88, 97, 112, 126, 139, 151, 168].map((n, i) => ({ w: `W${35 + i}`, n }))

const REMOVE_REASONS = ['Contains contact details', 'No booking on record for this reviewer', 'Disputed facts, vendor evidence provided', 'Abusive or discriminatory language', 'Spam or self-promotion']
const reasonFor = (flag: string) => (/phone|contact/i.test(flag) ? REMOVE_REASONS[0] : /no booking/i.test(flag) ? REMOVE_REASONS[1] : /dispute/i.test(flag) ? REMOVE_REASONS[2] : REMOVE_REASONS[1])

const NEW_NOTE = { by: 'chioma', text: 'Let me drag guests between tables instead of picking from a list.', area: 'Guests' as Area, status: 'Considering' as NoteStatus }

export default function AdminReviews() {
  const { toast } = useNav()
  const decisions = useSession((s) => s.reviewDecisions)
  const [removing, setRemoving] = useState<string | null>(null)
  const [reason, setReason] = useState(REMOVE_REASONS[1])
  const [noteToReviewer, setNoteToReviewer] = useState('Your review was removed because it breaks the Edera review guidelines. You can post a new review about your booking.')
  const [areaFilter, setAreaFilter] = useState<Area | 'All'>('All')
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES)
  const [voted, setVoted] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(NEW_NOTE)

  const effective = (id: string, state: 'open' | Decision): 'open' | Decision => decisions[id] ?? state
  const openCount = FLAGGED.filter((f) => effective(f.id, f.state) === 'open').length

  const keep = (id: string, about: string) => {
    session.decideReview(id, 'kept')
    toast(`Review of ${about} kept · vendor notified`, 'accent')
  }
  const startRemove = (id: string, flag: string) => {
    setReason(reasonFor(flag))
    setRemoving(id)
  }
  const confirmRemove = () => {
    if (!removing) return
    const f = FLAGGED.find((x) => x.id === removing)
    session.decideReview(removing, 'removed')
    setRemoving(null)
    toast(`Review of ${f?.about ?? 'vendor'} removed · ${reason}`, 'danger')
  }

  const visibleNotes = useMemo(() => notes.filter((n) => areaFilter === 'All' || n.area === areaFilter), [notes, areaFilter])
  const columns: NoteStatus[] = ['Shipped', 'Planned', 'Considering']

  const vote = (id: string) => {
    if (voted.includes(id)) return toast('You already voted for this one', 'neutral')
    setVoted((v) => [...v, id])
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, votes: n.votes + 1 } : n)))
  }
  const saveNote = () => {
    setNotes((ns) => [{ id: `sn-${Date.now()}`, by: draft.by, text: draft.text, area: draft.area, status: draft.status, votes: 1, daysAgo: 0 }, ...ns])
    setAdding(false)
    toast(`Note from ${personById(draft.by).first} added to the board`, 'accent')
  }

  return (
    <ConsoleShell
      active="admin.reviews"
      title="Reviews & reports"
      sub={`${openCount} flagged ${openCount === 1 ? 'review' : 'reviews'} waiting · ${KPI.reviews30d.toLocaleString('en-GB')} reviews in 30 days · platform average ${KPI.avgRating}`}
      actions={
        <Button size="sm" variant="outline" icon={ShieldCheck} onClick={() => toast('Review guidelines: one review per confirmed booking, no contact details, vendors may reply once', 'neutral')}>
          Guidelines
        </Button>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6 px-8 max-md:grid-cols-1 max-md:px-4">
        {/* ── Moderation queue ── */}
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="grot text-[22px]">
              Moderation queue <span className="num text-text-2">· {openCount} open</span>
            </h2>
            <span className="meta text-text-2">A flag pauses the review until Dave decides</span>
          </div>
          <motion.ul variants={listParent} initial="hidden" animate="show" className="divide-y divide-[var(--rule)] rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
            {FLAGGED.map((f) => {
              const st = effective(f.id, f.state)
              const p = personById(f.by)
              return (
                <motion.li key={f.id} variants={listItem} className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-4 p-5 max-md:grid-cols-[40px_minmax(0,1fr)]">
                  <Avatar who={p.photo} size={44} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[14px] font-bold">{p.name}</span>
                      <span className="text-[13px] font-semibold text-text-2">about {f.about}</span>
                      <StarRow rating={f.rating} />
                      <span className="meta text-text-2">· {ago(f.minutesAgo)}</span>
                    </div>
                    <blockquote className="grot mt-2 text-[19px] leading-[1.2]">“{f.text}”</blockquote>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Badge tone="warn" className="max-md:h-auto max-md:max-w-full max-md:shrink max-md:whitespace-normal max-md:py-1 max-md:text-left" icon={<Flag size={11} strokeWidth={2.6} aria-hidden />}>
                        {f.reason}
                      </Badge>
                      {st !== 'open' && <Badge tone={st === 'kept' ? 'accent' : 'danger'}>{st === 'kept' ? 'Kept · visible' : 'Removed · hidden'}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 max-md:col-span-2 max-md:flex-row max-md:justify-end">
                    {st === 'open' ? (
                      <>
                        <Button size="sm" onClick={() => keep(f.id, f.about)}>
                          Keep
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => startRemove(f.id, f.reason)}>
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" icon={MessageSquareText} onClick={() => toast(`Decision on ${p.first}'s review sent to ${f.about}`, 'neutral')}>
                        Notify vendor
                      </Button>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </motion.ul>
        </section>

        {/* ── Ratings picture ── */}
        <aside className="flex min-w-0 flex-col gap-5">
          <div className="relative overflow-hidden rounded-[var(--r-container)] bg-ink p-6 text-on-ink">
            <span aria-hidden className="arc" style={{ width: '54%', right: '-26%', bottom: '-70%' }} />
            <p className="label text-on-ink-2">Platform average</p>
            <div className="relative mt-1 flex items-end gap-2">
              <Figure value={KPI.avgRating.toFixed(1)} size={84} tone="var(--on-ink)" />
              <span className="mb-3 flex flex-col">
                <StarRow rating={5} size={14} />
                <span className="num mt-1 text-[12px] font-semibold text-on-ink-2">{KPI.reviews30d.toLocaleString('en-GB')} reviews · 30d</span>
              </span>
            </div>
            <ul className="relative mt-5 flex flex-col gap-2">
              {DISTRIBUTION.map((d) => (
                <li key={d.stars} className="flex items-center gap-3 text-[12px] font-bold">
                  <span className="num w-3 text-right">{d.stars}</span>
                  <StarRow rating={1} size={10} />
                  <Bar value={d.share} height={6} tone="brass" track="rgb(255 255 255 / 0.14)" className="flex-1" />
                  <span className="num w-9 text-right text-on-ink-2">{d.share}%</span>
                </li>
              ))}
            </ul>
          </div>

          <Panel title="Reviews per week">
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVIEWS_PER_WEEK} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap={3}>
                  <XAxis dataKey="w" tick={CHART.axis} axisLine={false} tickLine={false} interval={2} />
                  <Tooltip {...CHART.tooltip} cursor={{ fill: 'rgb(18 60 53 / 0.06)' }} />
                  <RBar dataKey="n" name="Reviews" fill={CHART.series.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="meta mt-2 text-text-2">12 weeks · {REVIEWS_PER_WEEK[11].n} last week · 3.5× since September</p>
          </Panel>

          <div className="rounded-[var(--r-card)] bg-[var(--surface-tint)] p-5">
            <p className="label text-text-2">Vendor replies</p>
            <p className="mt-1 text-[14px] font-semibold">
              <span className="num font-extrabold">64%</span> of reviews get a vendor reply within a day
            </p>
            <Bar value={64} height={5} className="mt-2" />
          </div>
        </aside>
      </div>

      {/* ── Seed circle feedback board ── */}
      <section className="mt-10 px-8 pb-12 max-md:px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[560px]">
            <p className="label text-brass-ink">Seed circle feedback</p>
            <h2 className="grot mt-1 text-[30px]">
              The first <em>{new Set(notes.map((n) => n.by)).size} people</em> tell us what to fix before we market it
            </h2>
            <p className="mt-2 text-[14px] font-medium text-text-2">A small circle of people Dave knows use the app first. Their notes land here, the team ships against them, then marketing opens up.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['All', ...AREAS] as const).map((a) => (
              <button key={a} type="button" onClick={() => setAreaFilter(a)} className={`h-8 rounded-full px-3 text-[12px] font-bold ${areaFilter === a ? 'bg-ink text-on-ink' : 'text-text ring-1 ring-inset ring-[var(--rule-strong)]'}`}>
                {a}
              </button>
            ))}
            <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>
              Add note
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {columns.map((col) => {
            const list = visibleNotes.filter((n) => n.status === col).sort((a, b) => b.votes - a.votes)
            return (
              <div key={col} className="min-w-0">
                <div className="mb-2 flex items-center gap-2 border-b-2 pb-2" style={{ borderColor: col === 'Shipped' ? 'var(--accent)' : col === 'Planned' ? 'var(--brass)' : 'var(--rule-strong)' }}>
                  <Badge tone={STATUS_TONE[col]}>{col}</Badge>
                  <span className="num text-[12px] font-bold text-text-2">{list.length}</span>
                </div>
                <ul className="divide-y divide-[var(--rule)]">
                  {list.map((n) => {
                    const p = personById(n.by)
                    return (
                      <li key={n.id} className="flex items-start gap-3 py-3">
                        <motion.button
                          type="button"
                          whileTap={tap}
                          onClick={() => vote(n.id)}
                          aria-label={`Vote for ${p.first}'s note`}
                          className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[var(--r-control)] ${voted.includes(n.id) ? 'bg-accent text-on-accent' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}
                        >
                          <ChevronUp size={14} strokeWidth={2.8} aria-hidden />
                          <span className="num text-[12px] font-extrabold leading-none">{n.votes}</span>
                        </motion.button>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold leading-snug">{n.text}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Avatar who={p.photo} size={20} />
                            <span className="text-[12px] font-bold">{p.first}</span>
                            <span className="rounded-full bg-[var(--surface-high)] px-2 py-0.5 text-[11px] font-bold text-text">{n.area}</span>
                            <span className="meta text-text-2">{n.daysAgo === 0 ? 'today' : `${n.daysAgo}d ago`}</span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                  {list.length === 0 && <li className="py-6 text-center text-[13px] font-semibold text-text-2">Nothing {col.toLowerCase()} for {areaFilter}.</li>}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Remove modal ── */}
      <Modal open={!!removing} onClose={() => setRemoving(null)} title="Remove review">
        {removing && (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-text-2">
              Removing hides <span className="font-bold text-text">{personById(FLAGGED.find((f) => f.id === removing)?.by ?? 'tayo').name}</span>’s review of <span className="font-bold text-text">{FLAGGED.find((f) => f.id === removing)?.about}</span>. The reviewer is told why and can post again after a confirmed booking.
            </p>
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">
              Reason
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="well h-12 rounded-[var(--r-control)] px-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                {REMOVE_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <TextArea label="Note to the reviewer" rows={3} value={noteToReviewer} onChange={(e) => setNoteToReviewer(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmRemove}>
                Remove review
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add note modal ── */}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a note">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">
              From
              <select value={draft.by} onChange={(e) => setDraft({ ...draft, by: e.target.value })} className="well h-12 rounded-[var(--r-control)] px-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                {['chioma', 'tunde', 'bola', 'kunle', 'sade', 'ife', 'nkechi', 'dapo', 'adaeze'].map((id) => (
                  <option key={id} value={id}>
                    {personById(id).name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">
              Area
              <select value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value as Area })} className="well h-12 rounded-[var(--r-control)] px-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>
          <TextArea label="What they said" rows={3} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          <div className="flex items-center gap-2">
            {(['Considering', 'Planned', 'Shipped'] as NoteStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => setDraft({ ...draft, status: s })} className={`h-9 rounded-full px-3.5 text-[12px] font-bold ${draft.status === s ? 'bg-ink text-on-ink' : 'text-text ring-1 ring-inset ring-[var(--rule-strong)]'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote}>Save</Button>
          </div>
        </div>
      </Modal>
    </ConsoleShell>
  )
}
