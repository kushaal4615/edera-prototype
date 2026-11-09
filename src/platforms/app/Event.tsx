import { motion } from 'framer-motion'
import { CalendarDays, Check, ChevronDown, ChevronRight, Clock3, MapPin, MessageCircle, PenLine, Share2, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarStack } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { Input, TextArea } from '../../components/Form'
import { BottomSheet } from '../../components/Sheet'
import { img, type MediaKey } from '../../data/media'
import { daysUntil, fmtDay, fmtShort, money } from '../../data/clock'
import { DEMO_EVENT } from '../../data/demoFill'
import { RUBY, RUBY_TASKS, RUBY_TOTALS, RUN_OF_SHOW, type Task } from '../../data/events'
import { CLIENT, PLANNER, personById } from '../../data/people'
import { vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, SAFE_TOP, SectionHead } from '../mobileShell'

/* app.event: the event the client outlined at sign-up, kept editable, with
   the roles, the run of show and the checklist Tunde keeps. */

const RUBY_SOFT = '#F2D4D9' /* text-2 on the ruby block: 7.1:1 on #8C2F39 */

const ownerFace = (t: Task): MediaKey => {
  if (t.owner === 'adaeze') return CLIENT.photo
  if (t.owner === 'tunde') return PLANNER.photo
  const role = RUBY.roles.find((r) => r.category === t.role && r.vendorId)
  return role?.vendorId ? personById(vendorById(role.vendorId).owner).photo : PLANNER.photo
}

export default function AppEvent() {
  const { navigate, toast } = useNav()
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState(DEMO_EVENT)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>(RUBY_TASKS.filter((t) => t.done).map((t) => t.id))
  const [allShow, setAllShow] = useState(false)

  const confirmed = RUBY.roles.filter((r) => r.state === 'confirmed')
  const requested = RUBY.roles.filter((r) => r.state === 'requested')
  const open = RUBY.roles.filter((r) => r.state === 'open')
  const shortlist = RUBY.roles.find((r) => r.state === 'shortlist')
  const shortVendor = shortlist?.vendorId ? vendorById(shortlist.vendorId) : null
  const seedDone = RUBY_TASKS.filter((t) => t.done).length
  const checklistDone = RUBY.checklistDone - seedDone + done.length
  const show = allShow ? RUN_OF_SHOW : RUN_OF_SHOW.slice(0, 7)

  const set = (k: keyof typeof DEMO_EVENT) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setFormError(null)
  }
  const save = () => {
    if (!form.name.trim() || !form.date || !form.guests) {
      setFormError('Name, date and guest count are needed')
      toast('Give the event a name, a date and a guest count', 'warn')
      return
    }
    track('event_saved')
    setEdit(false)
    toast('Event details saved', 'accent')
  }
  const toggle = (id: string) => {
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
    session.toggleTask(id)
  }
  const messageTunde = () => {
    session.viewThread('th1')
    navigate('app.thread')
  }
  const openVendor = (id: string) => {
    session.viewVendor(id)
    navigate('app.vendor')
  }

  return (
    <MobileScreen
      tab="event"
      cap={RUBY.colour}
      dock={
        <Dock>
          <Button variant="ink" icon={MessageCircle} onClick={messageTunde}>
            Message Tunde
          </Button>
          <Button block icon={PenLine} onClick={() => setEdit(true)}>
            Edit details
          </Button>
        </Dock>
      }
      overlay={
        <BottomSheet open={edit} onClose={() => setEdit(false)} title="Edit details" tall>
          <div className="flex flex-col gap-4 pt-1">
            <Input label="Event name" value={form.name} onChange={set('name')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Type" value={form.type} onChange={set('type')} />
              <Input label="City" value={form.city} onChange={set('city')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={form.date} onChange={set('date')} />
              <Input label="Start time" type="time" value={form.time} onChange={set('time')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Guests" inputMode="numeric" value={form.guests} onChange={set('guests')} />
              <Input label="Budget (£)" inputMode="numeric" value={form.budget} onChange={set('budget')} />
            </div>
            <TextArea label="Your requirements" hint="What Tunde works from: colours, food, music, anything that matters." rows={3} value={form.vibe} onChange={set('vibe')} />
            {formError && <p className="text-[13px] font-semibold text-danger-text">{formError}</p>}
            <div className="shrink-0 pt-1">
              <Button size="lg" block onClick={save}>
                Save
              </Button>
            </div>
          </div>
        </BottomSheet>
      }
    >
      {/* ── colour-block hero in the event's ruby ── */}
      <div className="relative overflow-hidden text-white" style={{ background: RUBY.colour, paddingTop: `calc(${SAFE_TOP} + 6px)` }}>
        <span aria-hidden className="dots-light" />
        <span aria-hidden className="arc" style={{ opacity: 0.85, width: '72%', right: '-34%', bottom: '-50%' }} />
        <div className="relative px-5 pb-7">
          <div className="flex items-center justify-between">
            <Badge className="bg-[rgb(255_255_255/0.16)] text-white ring-1 ring-inset ring-[rgb(255_255_255/0.3)]">
              {RUBY.type} · Planning
            </Badge>
            <IconButton icon={Share2} label="Share event" tone="scrim" size={40} onClick={() => toast('Share link copied: edera.app/e/ruby40', 'accent')} />
          </div>
          <h1 className="grot mt-6 text-[36px]">
            {form.name.split(' · ').map((part, i) => (
              <span key={i} className="block">
                {part}
              </span>
            ))}
          </h1>
          <p className="mt-2 text-[14px] font-semibold" style={{ color: RUBY_SOFT }}>
            {daysUntil(RUBY.date)} days to go · planned by {PLANNER.first}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4">
            {[
              { icon: CalendarDays, k: 'Date', v: fmtDay(form.date, true) },
              { icon: Clock3, k: 'Starts', v: form.time },
              { icon: MapPin, k: 'Venue', v: RUBY.venue },
              { icon: Users, k: 'Guests', v: `${form.guests} invited` },
            ].map((f) => (
              <div key={f.k} className="flex items-start gap-2.5">
                <f.icon size={16} strokeWidth={2.3} aria-hidden className="mt-0.5 shrink-0" style={{ color: RUBY_SOFT }} />
                <div className="min-w-0">
                  <dt className="label" style={{ color: RUBY_SOFT }}>
                    {f.k}
                  </dt>
                  <dd className="mt-0.5 text-[14px] font-bold leading-tight">{f.v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── the brief ── */}
      <div className="mx-5 -mt-3 rounded-[var(--r-container)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raised)]">
        <div className="flex items-center justify-between">
          <p className="label text-brass-ink">Your requirements</p>
          <span className="meta text-text-2">
            <Wallet size={11} strokeWidth={2.4} aria-hidden className="mr-1 inline" />
            {money(Number(form.budget) || RUBY.budget, RUBY.currency)} budget
          </span>
        </div>
        <p className="grot mt-2 text-[21px] leading-[1.15]">
          <em>“</em>
          {form.vibe}
          <em>”</em>
        </p>
        <p className="mt-3 text-[13px] text-text-2">Outlined when you signed up. Tunde works from this; edit it any time.</p>
      </div>

      {/* ── roles: asymmetric bento ── */}
      <SectionHead className="mt-8" title="Who’s on it" eyebrow={`${RUBY.roles.length} roles`} action="Bookings" onAction={() => navigate('app.bookings')} />
      <div className="mx-5 mt-3 grid grid-cols-3 gap-3">
        <Pressable onClick={() => openVendor(confirmed[0].vendorId!)} className="col-span-2 flex flex-col justify-between rounded-[var(--r-container)] bg-accent p-4 text-on-accent">
          <div className="flex items-start justify-between">
            <p className="label text-on-accent-2">Confirmed</p>
            <AvatarStack people={confirmed.map((r) => personById(vendorById(r.vendorId!).owner).photo)} size={26} />
          </div>
          <p className="figure num mt-3 text-[44px]">{confirmed.length}</p>
          <p className="mt-1 text-[13px] font-semibold text-on-accent-2">{confirmed.map((r) => r.label).join(' · ')}</p>
        </Pressable>
        <Pressable onClick={() => navigate('app.bookings')} className="flex flex-col justify-between rounded-[var(--r-card)] bg-brass-soft p-4 text-on-brass-soft">
          <p className="label">Requested</p>
          <p className="figure num mt-3 text-[36px]">{requested.length}</p>
          <p className="mt-1 text-[12px] font-semibold leading-tight">awaiting vendor replies</p>
        </Pressable>
        <Pressable
          onClick={() => {
            session.setCategory(open[0].category)
            navigate('app.explore')
          }}
          className="flex flex-col justify-between rounded-[var(--r-card)] bg-[var(--surface-high)] p-4"
        >
          <p className="label text-text-2">Open</p>
          <p className="figure num mt-3 text-[36px]">{open.length}</p>
          <p className="mt-1 text-[12px] font-semibold leading-tight text-text-2">{open.map((r) => r.label).join(', ')}</p>
        </Pressable>
        {shortlist && shortVendor && (
          <Pressable onClick={() => openVendor(shortVendor.id)} className="col-span-2 relative flex items-center gap-3 overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] p-3 shadow-[var(--shadow-raised)]">
            <img src={img(shortVendor.photos[0], 300)} alt="" loading="lazy" className="h-[64px] w-[64px] shrink-0 rounded-[12px] object-cover" />
            <div className="min-w-0 flex-1">
              <Badge tone="info">Shortlisted</Badge>
              <p className="mt-1 truncate text-[15px] font-bold leading-tight">{shortVendor.name}</p>
              <p className="truncate text-[12px] font-semibold text-text-2">
                {shortlist.label} · {money(shortlist.budget, RUBY.currency)} · decide by 5 Dec
              </p>
            </div>
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden className="shrink-0 text-text-3" />
          </Pressable>
        )}
      </div>

      {/* ── run of show: timeline spine ── */}
      <SectionHead className="mt-8" title="Run of show" eyebrow={fmtDay(RUBY.date)} />
      <ol className="relative mx-5 mt-3">
        <span aria-hidden className="pointer-events-none absolute bottom-4 left-[52px] top-3 w-px bg-[var(--rule-strong)]" />
        {show.map((s, i) => (
          <li key={s.time} className="flex items-start gap-4 py-2">
            <span className="meta w-10 shrink-0 pt-1 text-right text-text">{s.time}</span>
            <span className={`relative z-10 mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full ring-4 ring-[var(--bg)] ${i === 3 ? 'bg-brass' : 'bg-accent'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-tight">{s.item}</p>
              <p className="text-[12px] font-semibold text-text-2">{s.who}</p>
            </div>
          </li>
        ))}
      </ol>
      {!allShow && (
        <button type="button" onClick={() => setAllShow(true)} className="ml-[88px] flex h-11 items-center gap-1 text-[13px] font-bold text-accent-ink">
          <ChevronDown size={15} strokeWidth={2.4} aria-hidden />+{RUN_OF_SHOW.length - 7} more until carriages
        </button>
      )}

      {/* ── checklist ── */}
      <SectionHead className="mt-6" title="Checklist" eyebrow={`${checklistDone} of ${RUBY.checklistTotal} done`} />
      <div className="mx-5 mt-3">
        <Bar value={(checklistDone / RUBY.checklistTotal) * 100} tone="brass" height={6} />
      </div>
      <ul className="mx-5 mt-2">
        {RUBY_TASKS.map((t) => {
          const on = done.includes(t.id)
          const late = !on && t.due < '2026-11-21'
          return (
            <li key={t.id} className="flex items-center gap-3 py-2.5">
              <motion.button type="button" role="checkbox" aria-checked={on} aria-label={`${t.title}: ${on ? 'done' : 'not done'}`} whileTap={tap} transition={spring.ui} onClick={() => toggle(t.id)} className="grid h-11 w-11 shrink-0 place-items-center">
                <span className={`grid h-6 w-6 place-items-center rounded-[7px] transition-colors duration-150 ${on ? 'bg-accent text-on-accent' : 'bg-[var(--surface-raised)] ring-1 ring-inset ring-[var(--rule-strong)]'}`}>{on && <Check size={15} strokeWidth={3} aria-hidden />}</span>
              </motion.button>
              <div className="min-w-0 flex-1">
                <p className={`text-[15px] font-bold leading-tight ${on ? 'text-text-2 line-through decoration-[var(--rule-strong)]' : ''}`}>{t.title}</p>
                <p className={`text-[12px] font-semibold ${late ? 'text-danger-text' : 'text-text-2'}`}>
                  {on ? 'Done' : late ? 'Overdue' : 'Due'} · {fmtShort(t.due)}
                  {t.owner === 'vendor' ? ' · vendor' : t.owner === 'tunde' ? ' · Tunde' : ' · you'}
                </p>
              </div>
              <Avatar who={ownerFace(t)} size={30} alt="" />
            </li>
          )
        })}
      </ul>

      {/* ── guests link ── */}
      <div className="mx-5 mt-4">
      <Pressable onClick={() => navigate('app.guests')} className="flex items-center gap-3 rounded-[var(--r-card)] bg-ink p-4 text-on-ink">
        <Users size={20} strokeWidth={2.2} aria-hidden className="text-brass-light" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">Guests</p>
          <p className="text-[12px] font-semibold text-on-ink-2">
            {RUBY_TOTALS.yes} yes · {RUBY_TOTALS.no} no · {RUBY_TOTALS.pending} pending of {RUBY_TOTALS.invited}
          </p>
        </div>
        <ChevronRight size={18} strokeWidth={2.2} aria-hidden className="text-on-ink-2" />
      </Pressable>
      </div>

      <div className="mx-5 mt-5 flex items-center gap-2 text-[12px] font-semibold text-text-2">
        <Avatar who={PLANNER.photo} size={22} alt="" />
        <span>
          Kept up to date by {PLANNER.name} · <Verified size={12} className="align-middle" />
        </span>
      </div>
    </MobileScreen>
  )
}
