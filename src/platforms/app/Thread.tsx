import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarCheck2, Paperclip, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { AvailPill, Verified } from '../../components/Brand'
import { Button } from '../../components/Button'
import { Rail } from '../../components/Media'
import { addDays, CLOCK, fmtDay, money } from '../../data/clock'
import { DEMO_MESSAGE_CLIENT } from '../../data/demoFill'
import { eventById, REQUESTS, threadById, type Message } from '../../data/events'
import { img } from '../../data/media'
import { personById, PLANNER } from '../../data/people'
import { VENDORS } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { requestState, session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, TopBar } from '../mobileShell'

/* app.thread: one conversation. Bubbles with day dividers, the booking
   this chat belongs to pinned under the header, quick replies in the dock. */

const ME = 'adaeze'
const QUICK = ['Sounds good 👍', 'Can we do 13:00 instead?', 'Please send the menu', 'Mum says yes!', 'Thank you so much']

const pad = (n: number) => String(n).padStart(2, '0')
const clockAt = (minutesAgo: number) => {
  const t = (((CLOCK.nowMin - minutesAgo) % 1440) + 1440) % 1440
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
}
const dayLabel = (minutesAgo: number) => {
  const days = Math.floor((CLOCK.nowMin + minutesAgo) / 1440)
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : fmtDay(addDays(CLOCK.todayIso, -days))
}

export default function AppThread() {
  const { navigate, toast } = useNav()
  const state = useSession((s) => s)
  const threadId = state.viewingThread
  const thread = threadById(threadId)
  const other = personById(thread.participants.find((p) => p !== ME) ?? thread.participants[0])
  const planner = other.id === PLANNER.id
  const vendor = VENDORS.find((v) => v.owner === other.id)
  const event = eventById(thread.eventId)
  const request = vendor ? REQUESTS.find((r) => r.vendorId === vendor.id && r.eventId === thread.eventId) : undefined
  const reqState = request ? requestState(request.id, state) : undefined
  const outstanding = REQUESTS.filter((r) => r.eventId === thread.eventId && requestState(r.id, state) === 'requested').length

  const [local, setLocal] = useState<Message[]>([])
  const [draft, setDraft] = useState(DEMO_MESSAGE_CLIENT)
  const mainRef = useRef<HTMLDivElement>(null)
  const messages = [...thread.messages, ...local]

  useEffect(() => {
    setLocal([])
    setDraft(DEMO_MESSAGE_CLIENT)
  }, [threadId])

  useEffect(() => {
    const m = mainRef.current
    if (m) m.scrollTo({ top: m.scrollHeight, behavior: local.length ? 'smooth' : 'auto' })
  }, [messages.length, local.length])

  const send = () => {
    const text = draft.trim()
    if (!text) {
      toast('Pick a quick reply or type a message first', 'warn')
      return
    }
    track('send_message', thread.id)
    setLocal((l) => [...l, { id: `local-${Date.now()}`, from: ME, text, minutesAgo: 0 }])
    setDraft('')
    toast(`Sent to ${other.first}`, 'accent')
  }

  const viewProfile = () => {
    if (planner) {
      navigate('app.planner')
      return
    }
    if (vendor) {
      session.viewVendor(vendor.id)
      navigate('app.vendor')
      return
    }
    navigate('app.event')
  }

  let lastDay = ''

  return (
    <MobileScreen
      ref={mainRef}
      bg="var(--surface-raised)"
      header={
        <TopBar
          tone="surface"
          title={other.name}
          sub={planner ? 'Your planner · Bakare Events' : vendor?.name ?? other.role}
          right={
            <Button size="sm" variant="ghost" trailing={ArrowUpRight} onClick={viewProfile} className="-mr-2">
              Profile
            </Button>
          }
        />
      }
      dockHeight={126}
      dock={
        <Dock tone="surface">
          <div className="flex w-full flex-col gap-2">
            <Rail padLeft={4} gap={6} className="-mx-1">
              {QUICK.map((q) => (
                <motion.button key={q} type="button" whileTap={tap} transition={spring.ui} onClick={() => setDraft(q)} className="h-8 shrink-0 snap-start rounded-full bg-[var(--surface-high)] px-3 text-[12px] font-bold text-text">
                  {q}
                </motion.button>
              ))}
            </Rail>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toast('Attach a photo, PDF or the mood board')} aria-label="Attach" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--surface-high)] text-text-2">
                <Paperclip size={18} aria-hidden />
              </button>
              <label className="well flex h-11 min-w-0 flex-1 items-center rounded-full px-4">
                <span className="sr-only">Message</span>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${other.first}…`} className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-text-3" />
              </label>
              <Button icon={Send} onClick={send} aria-label="Send" className="px-4">
                Send
              </Button>
            </div>
          </div>
        </Dock>
      }
    >
      {/* counterpart band */}
      <div className="flex items-center gap-3.5 bg-[var(--surface)] px-5 pb-4 pt-2 shadow-[0_8px_24px_-18px_rgb(18_60_53/0.35)]">
        <Avatar who={other.photo} size={56} ring verified={planner || !!vendor?.verified} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[16px] font-extrabold">{other.name}</p>
            {(planner || vendor?.verified) && <Verified />}
          </div>
          <p className="meta mt-0.5 truncate text-text-2">
            {planner ? `${PLANNER.business} · replies within the hour` : vendor ? `${vendor.name} · replies ${vendor.responseTime}` : other.role}
          </p>
          <p className="meta mt-0.5 truncate text-text-2">{event.name}</p>
        </div>
        <Button size="sm" variant="outline" onClick={viewProfile}>
          View profile
        </Button>
      </div>

      {/* pinned booking context */}
      {request && vendor && (
        <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring.ui} onClick={() => navigate('app.bookings')} className="mx-5 mt-3 flex w-[calc(100%-40px)] items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface)] p-3 text-left shadow-[var(--shadow-raised)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-on-accent-soft">
            <CalendarCheck2 size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold">
              {vendor.packages.find((p) => p.id === request.packageId)?.name ?? 'Booking'} · {money(request.amount, vendor.currency)}
            </span>
            <span className="meta block text-text-2">
              {fmtDay(request.date)} · {request.slot}
            </span>
          </span>
          {reqState && <AvailPill state={reqState === 'confirmed' || reqState === 'accepted' ? 'free' : reqState === 'declined' ? 'blocked' : 'held'}>{reqState === 'requested' ? 'Requested' : reqState.charAt(0).toUpperCase() + reqState.slice(1)}</AvailPill>}
        </motion.button>
      )}
      {planner && (
        <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring.ui} onClick={() => navigate('app.event')} className="mx-5 mt-3 flex w-[calc(100%-40px)] items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface)] p-3 text-left shadow-[var(--shadow-raised)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-brass-soft text-on-brass-soft">
            <CalendarCheck2 size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold">{event.name}</span>
            <span className="meta block text-text-2">
              {fmtDay(event.date, true)} · {event.checklistDone} of {event.checklistTotal} tasks done
            </span>
          </span>
          <AvailPill state="held">{outstanding} requests out</AvailPill>
        </motion.button>
      )}

      {/* messages */}
      <ol className="flex flex-col gap-2 px-4 pb-2 pt-4">
        {messages.map((m) => {
          const mine = m.from === ME
          const day = dayLabel(m.minutesAgo)
          const divider = day !== lastDay
          lastDay = day
          return (
            <li key={m.id} className="flex flex-col">
              {divider && (
                <div className="my-2 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[var(--rule)]" />
                  <span className="meta text-text-2">{day}</span>
                  <span className="h-px flex-1 bg-[var(--rule)]" />
                </div>
              )}
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring.ui} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && <Avatar who={other.photo} size={26} />}
                <div className={`flex max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div className={`overflow-hidden rounded-[18px] ${mine ? 'rounded-br-[6px] bg-accent text-on-accent' : 'rounded-bl-[6px] bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}>
                    {m.attachment && <img src={img(m.attachment, 520)} alt="" className="h-[150px] w-full object-cover" />}
                    <p className="px-3.5 py-2.5 text-[15px] leading-snug">{m.text}</p>
                  </div>
                  <span className={`meta mt-1 ${mine ? 'text-text-2' : 'text-text-2'}`}>
                    {m.minutesAgo === 0 ? 'now' : clockAt(m.minutesAgo)}
                    {mine && <span className="ml-1 text-accent-ink">{m.minutesAgo === 0 ? '✓' : '✓✓'}</span>}
                  </span>
                </div>
              </motion.div>
            </li>
          )
        })}
      </ol>
      <p className="px-5 pb-2 text-center text-[11px] font-semibold text-text-2">{planner ? 'Tunde also sees your vendor chats for this event.' : `Tunde is copied on this conversation.`}</p>
    </MobileScreen>
  )
}
