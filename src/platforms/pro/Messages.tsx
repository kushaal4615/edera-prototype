import { motion } from 'framer-motion'
import { ArrowUpRight, Inbox, MessageCircle, Paperclip, Pencil, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { Input } from '../../components/Form'
import { Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { Segmented } from '../../components/Tabs'
import { ago } from '../../data/clock'
import { DEMO_PRO_MESSAGE } from '../../data/demoFill'
import { eventById, threadsFor, type Message, type Thread } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { VENDORS } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen } from '../mobileShell'

/* pro.messages: one inbox for clients, vendors and venues: the chain
   that used to live in WhatsApp groups. Composition: large header →
   "Tonight's crew" avatar rail → segmented filter → borderless thread
   rows → tall sheet with the thread and a pre-filled composer. */

/* Local threads so the inbox shows the whole crew for tonight and the
   other events (the shared THREADS has five for Tunde). */
const LOCAL_THREADS: Thread[] = [
  { id: 'lt1', participants: ['tunde', 'seyi'], eventId: 'ev-engage', subject: 'Tonight · photos', unread: 0, messages: [
    { id: 'lm1', from: 'seyi', text: 'Set up by the entrance arch for arrivals. Group shots at 20:00 before dessert?', minutesAgo: 22 },
    { id: 'lm2', from: 'tunde', text: 'Yes, 20:00. I’ll have the MC call the tables in order.', minutesAgo: 20 },
  ] },
  { id: 'lt2', participants: ['tunde', 'femi'], eventId: 'ev-engage', subject: 'Tonight · bar', unread: 1, messages: [
    { id: 'lm3', from: 'femi', text: 'Chapman is going fast, about 20 litres left. Switch the second signature to zobo spritz?', minutesAgo: 14, attachment: 'cocktailPour' },
  ] },
  { id: 'lt3', participants: ['tunde', 'adaora'], eventId: 'ev-engage', subject: 'Tonight · Adaora & Kunle', unread: 0, messages: [
    { id: 'lm4', from: 'adaora', text: 'We can see the count going up from the car. 41 already!', minutesAgo: 11 },
    { id: 'lm5', from: 'tunde', text: 'Door is flowing. Come to the side entrance at 19:00 for your walk-in.', minutesAgo: 10 },
  ] },
  { id: 'lt4', participants: ['tunde', 'kemi'], eventId: 'ev-ruby', subject: 'Ruby drapes · samples', unread: 0, messages: [
    { id: 'lm6', from: 'kemi', text: 'Three ruby swatches on the way to you. The deeper one photographs best under warm light.', minutesAgo: 60 * 5, attachment: 'barnDrapes' },
  ] },
  { id: 'lt5', participants: ['tunde', 'kunle'], eventId: 'ev-ade', subject: 'Ade’s 50th · hall', unread: 0, messages: [
    { id: 'lm7', from: 'kunle', text: 'Any word from Olá Hall on 16 Jan? Dad wants to send the save-the-dates.', minutesAgo: 60 * 24 },
    { id: 'lm8', from: 'tunde', text: 'Still waiting on Bola. I’ll nudge her tonight at the dinner.', minutesAgo: 60 * 23 },
  ] },
]

const CREW = ['bola', 'kayode', 'seyi', 'femi'] as const
const FOLLOW_UP = 'Thanks, see you at the pass at 19:15.'

type Filter = 'all' | 'clients' | 'vendors'
const isVendor = (id: string) => VENDORS.some((v) => v.owner === id)
const other = (t: Thread) => t.participants.find((p) => p !== 'tunde') ?? t.participants[0]
const lastOf = (t: Thread, extra: Message[]) => [...t.messages, ...extra].at(-1)!

export default function ProMessages() {
  const { navigate, toast } = useNav()
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [read, setRead] = useState<string[]>([])
  const [sent, setSent] = useState<Record<string, Message[]>>({})
  const [draft, setDraft] = useState(DEMO_PRO_MESSAGE)

  const threads = useMemo(() => [...threadsFor('tunde'), ...LOCAL_THREADS].sort((a, b) => lastOf(a, sent[a.id] ?? []).minutesAgo - lastOf(b, sent[b.id] ?? []).minutesAgo), [sent])
  const unreadOf = (t: Thread) => (read.includes(t.id) ? 0 : t.unread)
  const unreadTotal = threads.reduce((a, t) => a + unreadOf(t), 0)
  const counts = { all: threads.length, clients: threads.filter((t) => !isVendor(other(t))).length, vendors: threads.filter((t) => isVendor(other(t))).length }
  const visible = threads.filter((t) => filter === 'all' || (filter === 'vendors') === isVendor(other(t)))

  const open = (id: string) => {
    setOpenId(id)
    setRead((r) => (r.includes(id) ? r : [...r, id]))
    session.viewThread(id)
    track('open_thread', id)
  }
  const thread = openId ? threads.find((t) => t.id === openId) ?? null : null
  const who = thread ? personById(other(thread)) : null

  const send = () => {
    if (!thread || !who) return
    const msg: Message = { id: `s-${Date.now()}`, from: 'tunde', text: draft, minutesAgo: 0 }
    setSent((s) => ({ ...s, [thread.id]: [...(s[thread.id] ?? []), msg] }))
    setDraft(draft === FOLLOW_UP ? DEMO_PRO_MESSAGE : FOLLOW_UP)
    track('send_message', thread.id)
    toast(`Sent to ${who.first}`, 'accent')
  }

  return (
    <MobileScreen
      tab="proInbox"
      cap="var(--bg)"
      dock={
        <Dock>
          <Button variant="accent" block icon={MessageCircle} onClick={() => open('th3')}>
            Reply to Bola
          </Button>
        </Dock>
      }
      overlay={
        <BottomSheet open={!!thread} onClose={() => setOpenId(null)} title={who?.name} tall>
          {thread && who && (
            <div className="flex min-h-full flex-col pb-2">
              <div className="flex items-center gap-3">
                <Avatar who={who.photo} size={44} verified={isVendor(who.id)} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold text-text">
                    {who.role}
                    {isVendor(who.id) && <Verified size={13} label={false} />}
                  </p>
                  <p className="truncate text-[13px] text-text-2">{eventById(thread.eventId).name}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="paper" icon={ArrowUpRight} onClick={() => { session.viewEvent(thread.eventId); setOpenId(null); navigate('pro.event') }}>
                  Open event
                </Button>
                {isVendor(who.id) && (
                  <Button size="sm" variant="outline" icon={Inbox} onClick={() => { setOpenId(null); navigate('pro.requests') }}>
                    Requests
                  </Button>
                )}
              </div>

              <ul className="mt-4 flex flex-1 flex-col gap-2.5">
                {[...thread.messages, ...(sent[thread.id] ?? [])].map((m) => {
                  const mine = m.from === 'tunde'
                  return (
                    <li key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      {m.attachment && <img src={img(m.attachment, 480)} alt="" className={`mb-1.5 h-[120px] w-[72%] rounded-[16px] object-cover ${mine ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'}`} />}
                      <span className={`max-w-[84%] px-3.5 py-2.5 text-[14px] leading-snug ${mine ? 'rounded-[18px] rounded-br-[6px] bg-accent text-on-accent' : 'rounded-[18px] rounded-bl-[6px] bg-[var(--surface-high)] text-text'}`}>{m.text}</span>
                      <span className="meta mt-1 px-1 text-text-2">{mine ? 'You' : who.first} · {ago(m.minutesAgo)}</span>
                    </li>
                  )
                })}
              </ul>

              <div className="sticky bottom-0 mt-4 flex items-end gap-2 bg-[var(--surface)] pt-2">
                <div className="min-w-0 flex-1">
                  <Input label="Reply" value={draft} onChange={(e) => setDraft(e.target.value)} leading={<button type="button" aria-label="Attach" onClick={() => toast('Attach a photo, PDF or a vendor quote')} className="grid h-8 w-8 place-items-center rounded-full"><Paperclip size={16} aria-hidden /></button>} />
                </div>
                <Button variant="accent" icon={Send} onClick={send} className="mb-0" style={{ height: 48 }}>
                  Send
                </Button>
              </div>
            </div>
          )}
        </BottomSheet>
      }
    >
      {/* Header */}
      <header className="flex items-end justify-between px-5 pt-3" style={{ paddingTop: 'calc(var(--safe-top, 59px) + 8px)' }}>
        <div>
          <p className="label text-brass-ink">Bakare Events</p>
          <h1 className="grot mt-1 text-[34px]">Inbox</h1>
          <p className="mt-1 text-[13px] font-semibold text-text-2">{unreadTotal} unread · clients, vendors and venues in one place</p>
        </div>
        <IconButton icon={Pencil} label="New message" tone="paper" onClick={() => toast('Pick a client or vendor from an event to start a thread')} />
      </header>

      {/* Tonight's crew */}
      <div className="mt-5 flex items-end justify-between px-5">
        <p className="label text-text-2">Tonight’s crew · Olá Event Hall</p>
        <Badge tone="solid">Live</Badge>
      </div>
      <Rail className="mt-2" gap={14}>
        {CREW.map((id) => {
          const p = personById(id)
          const t = threads.find((x) => other(x) === id)
          const unread = t ? unreadOf(t) : 0
          return (
            <motion.button key={id} type="button" whileTap={tap} transition={spring.ui} onClick={() => (t ? open(t.id) : toast(`${p.first} is on site · ${p.phone}`))} className="flex w-[68px] shrink-0 snap-start flex-col items-center gap-1.5">
              <span className="relative">
                <Avatar who={p.photo} size={56} ring={unread > 0} />
                {unread > 0 && <span className="num absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brass px-1 text-[11px] font-extrabold text-on-brass ring-2 ring-[var(--bg)]">{unread}</span>}
              </span>
              <span className="w-full truncate text-center text-[12px] font-bold">{p.first}</span>
              <span className="meta -mt-1 w-full truncate text-center text-text-2">{p.role.split(' ')[0]}</span>
            </motion.button>
          )
        })}
        <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => { session.viewEvent('ev-engage'); navigate('pro.event') }} className="flex w-[68px] shrink-0 snap-start flex-col items-center gap-1.5">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--surface-high)] text-text"><ArrowUpRight size={20} aria-hidden /></span>
          <span className="text-[12px] font-bold">Event</span>
          <span className="meta -mt-1 text-text-2">board</span>
        </motion.button>
      </Rail>

      {/* Filter */}
      <div className="mt-5 px-4">
        <Segmented<Filter> full tone="paper" value={filter} onChange={setFilter} items={[{ id: 'all', label: 'All', count: counts.all }, { id: 'clients', label: 'Clients', count: counts.clients }, { id: 'vendors', label: 'Vendors', count: counts.vendors }]} />
      </div>

      {/* Threads */}
      <motion.ul key={filter} variants={listParent} initial="hidden" animate="show" className="mt-2">
        {visible.map((t, i) => {
          const p = personById(other(t))
          const last = lastOf(t, sent[t.id] ?? [])
          const unread = unreadOf(t)
          const vendor = isVendor(p.id)
          return (
            <motion.li key={t.id} variants={listItem} style={i > 0 ? { boxShadow: 'inset 0 1px 0 var(--rule)' } : undefined}>
              <Pressable onClick={() => open(t.id)} className="flex items-start gap-3 px-5 py-3.5">
                <Avatar who={p.photo} size={48} ring={unread > 0} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className={`truncate text-[15px] ${unread ? 'font-extrabold' : 'font-bold'}`}>{p.name}</span>
                      <span className={`label shrink-0 rounded-full px-1.5 py-[2px] text-[10px] ${vendor ? 'bg-accent-soft text-on-accent-soft' : 'bg-brass-soft text-on-brass-soft'}`}>{vendor ? 'Vendor' : 'Client'}</span>
                    </span>
                    <span className={`meta shrink-0 ${unread ? 'text-accent-ink' : 'text-text-2'}`}>{ago(last.minutesAgo)}</span>
                  </span>
                  <span className="block truncate text-[12px] font-semibold text-text-2">{t.subject}</span>
                  <span className="mt-0.5 flex items-start justify-between gap-2">
                    <span className={`line-clamp-2 text-[13px] leading-snug ${unread ? 'text-text' : 'text-text-2'}`}>
                      {last.from === 'tunde' ? 'You: ' : ''}{last.attachment && <Paperclip size={12} className="mr-1 inline-block align-[-1px]" aria-hidden />}{last.text}
                    </span>
                    {unread > 0 && <span className="num mt-0.5 grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brass px-1.5 text-[11px] font-extrabold text-on-brass">{unread}</span>}
                  </span>
                </span>
              </Pressable>
            </motion.li>
          )
        })}
      </motion.ul>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-on-ink"><MessageCircle size={18} aria-hidden /></span>
        <p className="text-[13px] leading-snug text-text-2"><span className="font-bold text-text">Every thread is tied to an event.</span> Requests, quotes and replies stay together instead of across WhatsApp groups and PDFs.</p>
      </div>
    </MobileScreen>
  )
}
