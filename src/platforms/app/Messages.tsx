import { motion } from 'framer-motion'
import { ArrowRight, Archive, MessageSquareOff, Paperclip, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge, Chip } from '../../components/Badge'
import { Verified } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { BottomSheet } from '../../components/Sheet'
import { ago } from '../../data/clock'
import { eventById, threadsFor, type Thread } from '../../data/events'
import { personById } from '../../data/people'
import { VENDORS } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { MobileScreen, safeTop } from '../mobileShell'

/* app.messages: one inbox for the planner and every vendor, instead of
   the WhatsApp groups Dave described on the call. */

type Filter = 'all' | 'planner' | 'vendors'
const ME = 'adaeze'

/* LOCAL DEMO ROWS (to confirm): settled conversations with vendors on the
   anniversary. They open as read-only previews in a sheet. */
type Archived = { id: string; with: string; subject: string; minutesAgo: number; lines: { from: string; text: string }[] }
const ARCHIVED: Archived[] = [
  { id: 'ar1', with: 'dapo', subject: 'The Orangery · contract', minutesAgo: 60 * 24 * 9, lines: [{ from: 'dapo', text: 'Signed copy attached. Access from 08:00 on the day, loading bay on the east side.' }, { from: ME, text: 'Perfect, thank you Dapo. Tunde has the keys schedule.' }] },
  { id: 'ar2', with: 'kemi', subject: 'Luxe Drape · mood board', minutesAgo: 60 * 24 * 10, lines: [{ from: 'kemi', text: 'Ruby drapes with warm gold, not yellow. Board v2 attached.' }, { from: ME, text: 'That’s the one. Mum approved it this morning.' }] },
  { id: 'ar3', with: 'seyi', subject: 'Seyi Lawal · photo list', minutesAgo: 60 * 24 * 12, lines: [{ from: ME, text: 'Family portraits before the buffet opens, please. About 12 groups.' }, { from: 'seyi', text: 'Noted. Send me the list a week before and I’ll run them in 25 minutes.' }] },
  { id: 'ar4', with: 'kayode', subject: 'DJ Kaytee · playlist', minutesAgo: 60 * 24 * 14, lines: [{ from: 'kayode', text: 'Afrobeats after 9 and highlife for the elders. Drop me the first-dance song when you have it.' }] },
  { id: 'ar5', with: 'tola', subject: 'Gele & Glam · the aunties', minutesAgo: 60 * 24 * 17, lines: [{ from: 'tola', text: 'Six geles from 11:00 at the venue works. Group rate applies from five.' }, { from: ME, text: 'Great, Tunde will send the request once the band is locked.' }] },
  { id: 'ar6', with: 'femi', subject: 'Oriki · mobile bar', minutesAgo: 60 * 24 * 19, lines: [{ from: 'femi', text: 'Chapman and zobo for the church table, palm-wine spritz for everyone else?' }, { from: ME, text: 'Yes please. Mocktails must look as good as the cocktails!' }] },
]

const counterpartOf = (t: Thread) => t.participants.find((p) => p !== ME) ?? t.participants[0]
const isPlanner = (id: string) => id === 'tunde'
const vendorOf = (personId: string) => VENDORS.find((v) => v.owner === personId)

export default function AppMessages() {
  const { navigate, toast } = useNav()
  const [filter, setFilter] = useState<Filter>('all')
  const [preview, setPreview] = useState<Archived | null>(null)
  const threads = threadsFor(ME)
  const unread = threads.reduce((n, t) => n + t.unread, 0)
  const show = (who: string) => filter === 'all' || (filter === 'planner' ? isPlanner(who) : !isPlanner(who))
  const live = threads.filter((t) => show(counterpartOf(t)))
  const archived = ARCHIVED.filter((a) => show(a.with))

  const open = (t: Thread) => {
    track('open_thread', t.id)
    session.viewThread(t.id)
    navigate('app.thread')
  }

  return (
    <MobileScreen
      tab="inbox"
      cap="var(--bg)"
      overlay={
        <BottomSheet open={!!preview} onClose={() => setPreview(null)} title={preview ? personById(preview.with).first : undefined}>
          {preview && (
            <div>
              <div className="flex items-center gap-3">
                <Avatar who={personById(preview.with).photo} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold">{preview.subject}</p>
                  <p className="meta text-text-2">
                    {vendorOf(preview.with)?.name ?? personById(preview.with).role} · settled {ago(preview.minutesAgo)}
                  </p>
                </div>
                <Badge icon={<Archive size={11} aria-hidden />}>Archived</Badge>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {preview.lines.map((l, i) => {
                  const mine = l.from === ME
                  return (
                    <li key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <p className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-[14px] leading-snug ${mine ? 'rounded-br-[6px] bg-accent text-on-accent' : 'rounded-bl-[6px] bg-[var(--surface-high)] text-text'}`}>{l.text}</p>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    toast(`${personById(preview.with).first} will be notified · conversation reopened`, 'accent')
                    setPreview(null)
                  }}
                >
                  Reopen conversation
                </Button>
                {vendorOf(preview.with) && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      session.viewThread('th1')
                      navigate('app.thread')
                    }}
                  >
                    Ask Tunde about this instead
                  </Button>
                )}
              </div>
            </div>
          )}
        </BottomSheet>
      }
    >
      <div className="flex items-end justify-between px-5" style={{ paddingTop: safeTop(10) }}>
        <div>
          <p className="label text-brass-ink">Ngozi & Emeka · 40 Years</p>
          <h1 className="grot mt-1 text-[34px]">Inbox</h1>
        </div>
        <p className="pb-1 text-right">
          <span className="figure num text-[34px] text-brass-ink">{unread}</span>
          <span className="label block text-text-2">unread</span>
        </p>
      </div>

      {/* filter chips */}
      <div className="mt-4 flex gap-2 px-5">
        {(
          [
            ['all', 'All'],
            ['planner', 'Planner'],
            ['vendors', 'Vendors'],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <motion.button key={id} type="button" whileTap={tap} transition={spring.ui} onClick={() => setFilter(id)} aria-pressed={filter === id}>
            <Chip on={filter === id}>{label}</Chip>
          </motion.button>
        ))}
      </div>

      {/* ask your planner */}
      <Pressable onClick={() => navigate('app.planner')} className="mx-5 mt-4 overflow-hidden rounded-[var(--r-container)] bg-ink p-4 text-on-ink">
        <span className="relative flex items-center gap-3.5">
          <span className="arc" style={{ right: '-26%', bottom: '-110%', width: '70%' }} aria-hidden />
          <Avatar who={personById('tunde').photo} size={54} ring verified />
          <span className="relative min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[16px] font-extrabold">Ask your planner</span>
              <Verified tone="light" />
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-on-ink-2">Tunde replies within the hour. Vendors, dates, Mum’s gold: send it to him.</span>
          </span>
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass text-on-brass">
            <ArrowRight size={18} strokeWidth={2.6} aria-hidden />
          </span>
        </span>
      </Pressable>

      {/* live conversations */}
      <motion.ul key={`live-${filter}`} variants={listParent} initial="hidden" animate="show" className="mt-3">
        {live.map((t) => {
          const who = personById(counterpartOf(t))
          const last = t.messages[t.messages.length - 1]
          const v = vendorOf(who.id)
          return (
            <motion.li key={t.id} variants={listItem} className="rule-b">
              <Pressable onClick={() => open(t)} aria-label={`${who.name}, ${t.unread ? `${t.unread} unread` : 'read'}`}>
                <span className="flex items-center gap-3.5 px-5 py-3.5">
                  <Avatar who={who.photo} size={52} ring={t.unread > 0} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-[15px] ${t.unread ? 'font-extrabold' : 'font-bold'}`}>{who.name}</span>
                      <span className={`meta shrink-0 ${t.unread ? 'text-brass-ink' : 'text-text-2'}`}>{ago(last.minutesAgo)}</span>
                    </span>
                    <span className="meta block truncate text-text-2">
                      {isPlanner(who.id) ? 'Your planner' : v?.name ?? who.role} · {eventById(t.eventId).name}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className={`line-clamp-1 min-w-0 flex-1 text-[13px] leading-snug ${t.unread ? 'font-semibold text-text' : 'text-text-2'}`}>
                        {last.from === ME ? 'You: ' : ''}
                        {last.text}
                      </span>
                      {last.attachment && <Paperclip size={13} className="shrink-0 text-text-2" aria-hidden />}
                      {t.unread > 0 && <span className="num grid h-[22px] min-w-[22px] shrink-0 place-items-center rounded-full bg-brass px-1.5 text-[11px] font-extrabold text-on-brass">{t.unread}</span>}
                    </span>
                  </span>
                </span>
              </Pressable>
            </motion.li>
          )
        })}
      </motion.ul>
      {live.length === 0 && <p className="px-5 py-4 text-[13px] text-text-2">Nothing live here right now.</p>}

      {/* no more WhatsApp groups */}
      <div className="mx-5 mt-4 flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-accent-ink shadow-[var(--shadow-raised)]">
          <MessageSquareOff size={18} strokeWidth={2.2} aria-hidden />
        </span>
        <p className="text-[12px] leading-snug text-text-2">
          <span className="font-bold text-text">No more WhatsApp groups.</span> Every quote, PDF and reply stays with the booking it belongs to, and Tunde sees it too.
        </p>
        <Sparkles size={16} className="shrink-0 text-brass" aria-hidden />
      </div>

      {/* archived */}
      <div className="mt-6 flex items-end justify-between px-5">
        <p className="label text-text-2">Settled · {archived.length}</p>
        <span className="meta text-text-2">tap to preview</span>
      </div>
      <motion.ul key={`ar-${filter}`} variants={listParent} initial="hidden" animate="show" className="mt-1">
        {archived.map((a) => {
          const who = personById(a.with)
          const last = a.lines[a.lines.length - 1]
          return (
            <motion.li key={a.id} variants={listItem}>
              <Pressable onClick={() => setPreview(a)} aria-label={`${who.name}, archived`}>
                <span className="flex items-center gap-3 px-5 py-2.5">
                  <Avatar who={who.photo} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-bold">{who.name}</span>
                      <span className="meta shrink-0 text-text-2">{ago(a.minutesAgo)}</span>
                    </span>
                    <span className="line-clamp-1 text-[12px] text-text-2">
                      {a.subject} · {last.from === ME ? 'You: ' : ''}
                      {last.text}
                    </span>
                  </span>
                  <Archive size={14} className="shrink-0 text-text-2" aria-hidden />
                </span>
              </Pressable>
            </motion.li>
          )
        })}
      </motion.ul>
      {archived.length === 0 && <p className="px-5 py-3 text-[13px] text-text-2">No settled conversations in this filter.</p>}
    </MobileScreen>
  )
}
