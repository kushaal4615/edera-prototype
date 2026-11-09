import { motion } from 'framer-motion'
import { ChevronRight, MessageSquare, Quote, Search, Send, ThumbsUp, Timer } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge, Chip } from '../../components/Badge'
import { Bar, Figure, StarRow, Stars } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { TextArea, CheckMark } from '../../components/Form'
import { Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { fmtDay, pct } from '../../data/clock'
import { DEMO_REVIEW_REPLY } from '../../data/demoFill'
import { personById } from '../../data/people'
import { reviewsFor, vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { MobileScreen, TopBar } from '../mobileShell'

/* vendor.reviews: the 212 reviews behind the 4.9. A split summary panel,
   filter chips, an editorial list with inline reply composers (pre-filled
   so the demo never types), and the "ask a past client" sheet. */

const V = vendorById('iyabola')
const REVIEWS = reviewsFor('iyabola')
const DIST = [178, 26, 6, 1, 1] // 5 → 1 stars, sums to 212
type Filter = 'all' | '5' | '4' | 'replied' | 'needs'

/* completed bookings without a review yet (demo values) */
const ASKABLE = [
  { id: 'a1', by: 'nkechi', event: 'Baby shower · 45 guests', date: '2026-10-31' },
  { id: 'a2', by: 'tayo', event: 'Office Christmas lunch · 60 guests', date: '2026-10-17' },
  { id: 'a3', by: 'zara', event: '30th birthday · 85 guests', date: '2026-09-12' },
]

function ChipButton({ on, onClick, children }: { on?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={onClick} aria-pressed={on} className="flex min-h-[44px] shrink-0 snap-start items-center">
      <Chip on={on}>{children}</Chip>
    </motion.button>
  )
}

export default function VendorReviews() {
  const { navigate, toast } = useNav()
  const replied = useSession((s) => s.repliedReviews)
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState(DEMO_REVIEW_REPLY)
  const [ask, setAsk] = useState(false)
  const [picked, setPicked] = useState<string[]>(ASKABLE.map((a) => a.id))

  const hasReply = (id: string) => replied.includes(id) || !!REVIEWS.find((r) => r.id === id)?.reply
  const needs = REVIEWS.filter((r) => !hasReply(r.id)).length
  const list = REVIEWS.filter((r) => (filter === 'all' ? true : filter === '5' ? r.rating === 5 : filter === '4' ? r.rating === 4 : filter === 'replied' ? hasReply(r.id) : !hasReply(r.id)))
  const firstNeeding = REVIEWS.find((r) => !hasReply(r.id))?.id

  const openComposer = (id: string) => {
    const who = personById(REVIEWS.find((r) => r.id === id)!.by)
    setDraft(DEMO_REVIEW_REPLY.replace('Nkechi', who.first))
    setOpenId(id)
  }
  const post = (id: string) => {
    session.replyReview(id)
    track('review_replied', id)
    setOpenId(null)
    toast('Reply posted · visible on your listing', 'accent')
  }

  return (
    <MobileScreen header={<TopBar title="Reviews" sub={V.name} />}>
      {/* Split summary panel */}
      <section className="mx-5 mt-2 grid grid-cols-[auto_1fr] gap-5 rounded-[var(--r-container)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raised)]">
        <div className="flex flex-col justify-between">
          <div>
            <Figure value={V.rating.toFixed(1)} size={72} />
            <div className="mt-1">
              <Stars rating={V.rating} count={V.reviews} size={14} />
            </div>
          </div>
          <p className="mt-3 text-[12px] font-semibold leading-snug text-text-2">
            98% would book again
            <br />
            {needs} awaiting a reply
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2">
          {DIST.map((n, i) => {
            const stars = 5 - i
            return (
              <button
                key={stars}
                type="button"
                onClick={() => setFilter(stars === 5 ? '5' : stars === 4 ? '4' : 'all')}
                aria-label={`${stars} star reviews: ${n}`}
                className="flex h-6 items-center gap-2"
              >
                <span className="num w-3 text-right text-[12px] font-bold text-text-2">{stars}</span>
                <Bar value={Math.max(1.5, pct(n, DIST[0]))} tone={stars >= 4 ? 'brass' : 'ink'} height={8} className="flex-1" />
                <span className="num w-8 text-right text-[12px] font-bold">{n}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Filters */}
      <Rail className="mt-5" gap={8}>
        {(
          [
            ['all', `All · ${REVIEWS.length}`],
            ['5', `5★ · ${REVIEWS.filter((r) => r.rating === 5).length}`],
            ['4', `4★ · ${REVIEWS.filter((r) => r.rating === 4).length}`],
            ['replied', `With reply · ${REVIEWS.length - needs}`],
            ['needs', `Needs reply · ${needs}`],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <ChipButton key={id} on={filter === id} onClick={() => setFilter(id)}>
            {label}
          </ChipButton>
        ))}
      </Rail>

      {/* Editorial list with the unlock band after the second review */}
      <ul className="mt-2">
        {list.map((r, i) => {
          const who = personById(r.by)
          const done = hasReply(r.id)
          const replyText = r.reply ?? DEMO_REVIEW_REPLY.replace('Nkechi', who.first)
          const composing = openId === r.id
          return (
            <Fragment key={r.id}>
              <li className="px-5 py-4 rule-b">
                <div className="flex items-start gap-3">
                  <Avatar who={who.photo} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold">{who.name}</p>
                        <p className="truncate text-[12px] font-semibold text-text-2">
                          {r.event} · {fmtDay(r.date)}
                        </p>
                      </div>
                      <StarRow rating={r.rating} size={13} />
                    </div>
                    <p className="mt-2 text-[15px] leading-snug">{r.text}</p>

                    {done ? (
                      <div className="mt-3 border-l-[3px] border-brass pl-3">
                        <p className="label text-brass-ink">Bola replied</p>
                        <p className="mt-1 text-[13px] leading-snug text-text-2">{replyText}</p>
                      </div>
                    ) : composing ? (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring.ui} className="mt-3 rounded-[var(--r-card)] bg-[var(--surface-high)] p-3">
                        <TextArea label={`Reply to ${who.first}`} rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} hint="Replies are public and show under the review" />
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="sm" icon={Send} onClick={() => post(r.id)}>
                            Post reply
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setOpenId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="mt-3 flex items-center gap-3">
                        <Button size="sm" variant={r.id === firstNeeding ? 'accent' : 'outline'} icon={MessageSquare} onClick={() => openComposer(r.id)}>
                          Reply
                        </Button>
                        <span className="meta text-text-2">No reply yet</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>

              {i === 1 && (
                <li className="relative mx-5 my-5 overflow-hidden rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
                  <span aria-hidden className="arc" style={{ width: '58%', right: '-30%', bottom: '-96%' }} />
                  <span aria-hidden className="dots-light" />
                  <p className="label relative text-brass-light">What reviews unlock</p>
                  <div className="relative mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <Figure value="#2" size={34} tone="var(--on-ink)" />
                      <p className="mt-1 flex items-start gap-1 text-[12px] font-semibold leading-tight text-on-ink-2">
                        <Search size={12} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden /> Caterers · Peckham
                      </p>
                    </div>
                    <div>
                      <Figure value={71} unit="%" size={34} tone="var(--on-ink)" />
                      <p className="mt-1 flex items-start gap-1 text-[12px] font-semibold leading-tight text-on-ink-2">
                        <ThumbsUp size={12} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden /> requests accepted
                      </p>
                    </div>
                    <div>
                      <Figure value={2} unit="h" size={34} tone="var(--on-ink)" />
                      <p className="mt-1 flex items-start gap-1 text-[12px] font-semibold leading-tight text-on-ink-2">
                        <Timer size={12} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden /> median reply
                      </p>
                    </div>
                  </div>
                  <p className="relative mt-3 max-w-[30ch] text-[12px] font-semibold leading-snug text-on-ink-2">Clients read your rank, acceptance and reply time next to the reviews, without contacting you.</p>
                </li>
              )}
            </Fragment>
          )
        })}
        {list.length === 0 && (
          <li className="px-5 py-10 text-center">
            <p className="grot text-[22px]">Nothing here yet</p>
            <p className="mt-1 text-[13px] text-text-2">Every review has a reply. Clear the filter to see all {REVIEWS.length}.</p>
          </li>
        )}
      </ul>

      {/* Ask for a review */}
      <div className="mx-5 mt-6 flex items-center gap-3 rounded-[var(--r-container)] bg-brass-soft p-4 text-on-brass-soft">
        <Quote size={22} strokeWidth={2} className="shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight">3 past clients have not reviewed yet</p>
          <p className="mt-0.5 text-[12px] font-semibold">A nudge from the app lifts reviews by a third.</p>
        </div>
        <Button size="sm" variant="ink" onClick={() => setAsk(true)}>
          Ask
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-between px-5">
        <Pressable onClick={() => navigate('vendor.bookings')} className="flex w-auto items-center gap-1 text-[13px] font-bold text-accent-ink">
          Bookings <ChevronRight size={16} aria-hidden />
        </Pressable>
        <Pressable onClick={() => navigate('vendor.listing')} className="flex w-auto items-center gap-1 text-[13px] font-bold text-accent-ink">
          Edit listing <ChevronRight size={16} aria-hidden />
        </Pressable>
      </div>
      <p className="meta mt-3 px-5 text-text-2">Reviews can only be left by clients with a confirmed booking.</p>

      <BottomSheet open={ask} onClose={() => setAsk(false)} title="Ask a past client for a review">
        <p className="text-[13px] text-text-2">Completed bookings without a review. Each client gets one in-app nudge.</p>
        <ul className="mt-3 divide-y divide-[var(--rule)]">
          {ASKABLE.map((a) => {
            const who = personById(a.by)
            const on = picked.includes(a.id)
            return (
              <li key={a.id}>
                <button type="button" onClick={() => setPicked((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))} aria-pressed={on} className="flex min-h-[60px] w-full items-center gap-3 py-2 text-left">
                  <Avatar who={who.photo} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{who.name}</p>
                    <p className="truncate text-[12px] font-semibold text-text-2">
                      {a.event} · {fmtDay(a.date)}
                    </p>
                  </div>
                  <Badge tone="neutral">Completed</Badge>
                  <CheckMark on={on} />
                </button>
              </li>
            )
          })}
        </ul>
        <Button
          block
          size="lg"
          className="mt-4"
          icon={Send}
          onClick={() => {
            if (!picked.length) return toast('Pick at least one client', 'warn')
            track('review_requested', picked.length)
            setAsk(false)
            toast(`Review request sent to ${picked.length} ${picked.length === 1 ? 'client' : 'clients'}`, 'accent')
          }}
        >
          Send request
        </Button>
      </BottomSheet>
    </MobileScreen>
  )
}
