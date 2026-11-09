import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Check, MessageCircle, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge, Chip } from '../../components/Badge'
import { AvailPill, Stars, Strip, StripLegend, Verified } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { Confetti } from '../../components/Confetti'
import { Input, TextArea } from '../../components/Form'
import { Rail } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { Segmented } from '../../components/Tabs'
import { addDays, fmtDay, money, plural } from '../../data/clock'
import { DEMO_PRO_REQUEST_NOTE } from '../../data/demoFill'
import { eventById, RUBY } from '../../data/events'
import { img } from '../../data/media'
import { personById } from '../../data/people'
import { availabilityOn, CATEGORIES, categoryById, vendorsByCategory, vendorsIn, type CategoryId, type Package, type Region, type Vendor } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { MobileScreen, SectionHead, TopBar } from '../mobileShell'

/* pro.vendors: "When I need an MC, all I need to go is this place." The
   role being filled sits in the title; category chips; the event's date is
   the lens: a compare split of the top two, then every vendor as an
   editorial row with the availability strip ringed on the event's date. */

const article = (label: string) => (/^[aeiou]/i.test(label) || /^MC/.test(label) ? 'an' : 'a')
const isCategory = (s: string | null): s is CategoryId => !!s && CATEGORIES.some((c) => c.id === s)

const quote = (p: Package, headcount: number) => (p.unit === 'per head' ? p.price * headcount : p.unit === 'per hour' ? p.price * 5 : p.price)

export default function ProVendors() {
  const { navigate, toast } = useNav()
  const viewingCategory = useSession((s) => s.viewingCategory)
  const region = useSession((s) => s.region)
  const requestsSent = useSession((s) => s.requestsSent)
  const viewingEvent = useSession((s) => s.viewingEvent)

  const ev = eventById(viewingEvent)
  const target = ev.status === 'planning' || ev.status === 'confirmed' ? ev : RUBY
  const date = target.date
  const category: CategoryId = isCategory(viewingCategory) ? viewingCategory : 'mc'
  const cat = categoryById(category)
  const shortName = target.name.split(' · ')[0]

  const inCategory = vendorsByCategory(category, region)
  const fallback = inCategory.length < 3
  const list = (fallback ? [...inCategory, ...vendorsIn(region).filter((v) => v.category !== category && v.category !== 'planner')] : inCategory).sort((a, b) => (a.category === category ? 0 : 1) - (b.category === category ? 0 : 1) || b.rating - a.rating)
  const compare = list.slice(0, 2)
  const headcount = target.guests

  const [picked, setPicked] = useState<Vendor | null>(null)
  const [pkg, setPkg] = useState<Package | null>(null)
  const [heads, setHeads] = useState(String(headcount))
  const [note, setNote] = useState(DEMO_PRO_REQUEST_NOTE)
  const [confetti, setConfetti] = useState(false)
  const [justSent, setJustSent] = useState<Vendor | null>(null)

  useEffect(() => {
    if (!confetti) return
    const t = setTimeout(() => setConfetti(false), 1800)
    return () => clearTimeout(t)
  }, [confetti])

  const openRequest = (v: Vendor) => {
    track('open_request_sheet', v.id)
    setPicked(v)
    setPkg(v.packages.find((p) => p.popular) ?? v.packages[0])
    setHeads(String(headcount))
    setNote(DEMO_PRO_REQUEST_NOTE)
  }

  const send = () => {
    if (!picked || !pkg) return
    session.sendRequest(picked.id)
    track('send_request', picked.id, { package: pkg.id, date })
    setPicked(null)
    setJustSent(picked)
    setConfetti(true)
    toast(`Request sent to ${picked.name} · ${money(quote(pkg, Number(heads) || headcount), picked.currency)} · ${fmtDay(date)}`, 'accent')
  }

  const message = (v: Vendor) => {
    track('message_vendor', v.id)
    session.viewThread(v.id === 'djkaytee' ? 'th4' : v.id === 'orangery' ? 'th5' : 'th3')
    navigate('pro.messages')
  }

  const setRegion = (r: Region) => {
    session.setRegion(r)
    track('region', r)
  }

  return (
    <MobileScreen
      header={
        <TopBar
          large
          title={
            <>
              Find {article(cat.label)} <em>{cat.label}</em>
              <span className="block text-[22px] text-text-2">for {shortName}</span>
            </>
          }
          sub={`${cat.count.toLocaleString('en-GB')} ${cat.plural.toLowerCase()} on Edera · verified professionals only`}
          right={<IconButton icon={MessageCircle} label="Inbox" onClick={() => navigate('pro.messages')} />}
        />
      }
      overlay={
        <>
          {confetti && <Confetti origin={0.3} />}
          <BottomSheet open={picked !== null} onClose={() => setPicked(null)} title={picked ? `Request ${picked.name}` : undefined} tall>
            {picked && pkg && (
              <div className="flex flex-col gap-4 pt-1 pb-2">
                <div className="flex items-center gap-3">
                  <img src={img(picked.photos[0], 200)} alt="" className="h-[56px] w-[72px] rounded-[var(--r-control)] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[14px] font-bold">
                      {picked.name} {picked.verified && <Verified size={14} label={false} />}
                    </p>
                    <p className="text-[12px] font-semibold text-text-2">
                      {picked.years} years · replies {picked.responseTime}
                    </p>
                  </div>
                  <AvailPill state={availabilityOn(picked, date)}>{fmtDay(date)}</AvailPill>
                </div>

                <div>
                  <p className="label mb-2 text-text-2">Package</p>
                  <div className="flex flex-col gap-2">
                    {picked.packages.map((p) => {
                      const on = p.id === pkg.id
                      return (
                        <motion.button key={p.id} type="button" whileTap={{ scale: 0.99 }} transition={spring.ui} onClick={() => setPkg(p)} className={`flex items-start gap-3 rounded-[var(--r-card)] p-3 text-left ${on ? 'bg-accent-soft ring-2 ring-[var(--accent)]' : 'bg-[var(--surface-raised)]'}`}>
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${on ? 'bg-accent text-on-accent' : 'ring-1 ring-inset ring-[var(--rule-strong)]'}`}>{on && <Check size={12} strokeWidth={3} />}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-[14px] font-bold">{p.name}</span>
                              {p.popular && <Badge tone="accent">Popular</Badge>}
                            </span>
                            <span className="mt-0.5 block text-[12px] text-text-2">{p.includes}</span>
                          </span>
                          <span className="num shrink-0 text-right text-[13px] font-bold">
                            {money(p.price, picked.currency)}
                            <span className="block text-[10.5px] font-semibold text-text-2">{p.unit}</span>
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Date" value={fmtDay(date, true)} readOnly leading={<CalendarDays size={15} />} />
                  <Input label="Headcount" inputMode="numeric" value={heads} onChange={(e) => setHeads(e.target.value)} />
                </div>
                <TextArea label="Note to the vendor" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />

                <div className="flex items-center justify-between rounded-[var(--r-card)] bg-ink px-4 py-3 text-on-ink">
                  <span>
                    <span className="label text-on-ink-2">Quote</span>
                    <span className="block text-[12px] font-semibold text-on-ink-2">Settled outside Edera · payments in a later phase</span>
                  </span>
                  <span className="figure num text-[26px]">{money(quote(pkg, Number(heads) || headcount), picked.currency)}</span>
                </div>

                <Button size="lg" block icon={Send} onClick={send}>
                  Send request
                </Button>
              </div>
            )}
          </BottomSheet>
        </>
      }
    >
      {/* ── Category chips ── */}
      <Rail className="pb-1" gap={8}>
        {CATEGORIES.filter((c) => c.id !== 'planner').map((c) => (
          <motion.button key={c.id} type="button" whileTap={tap} transition={spring.ui} onClick={() => { session.setCategory(c.id); track('category', c.id) }} className="shrink-0 snap-start">
            <Chip on={c.id === category}>{c.label}</Chip>
          </motion.button>
        ))}
      </Rail>

      {/* ── Lens: date + region ── */}
      <div className="mt-3 flex items-center justify-between gap-3 px-5">
        <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => toast(`Availability shown for ${fmtDay(date, true)} · change the date on the event board`, 'info')} className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-brass-soft py-1.5 pl-2.5 pr-3.5 text-left text-on-brass-soft">
          <CalendarDays size={15} aria-hidden className="shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-bold">{fmtDay(date)}</span>
            <span className="block truncate text-[10.5px] font-semibold">availability shown for {fmtDay(date)}</span>
          </span>
        </motion.button>
        <Segmented<Region> size="sm" tone="ink" items={[{ id: 'uk', label: 'London' }, { id: 'ng', label: 'Lagos' }]} value={region} onChange={setRegion} />
      </div>

      {/* ── Just sent banner ── */}
      {justSent && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring.ui} className="mx-5 mt-4 flex items-center gap-3 rounded-[var(--r-card)] bg-accent px-4 py-3 text-on-accent">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20">
            <Check size={16} strokeWidth={3} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-bold">Request sent to {justSent.name}</span>
            <span className="block text-[12px] font-semibold text-[var(--on-accent-2)]">{fmtDay(date)} now held · replies {justSent.responseTime}</span>
          </span>
          <Button size="sm" variant="white" trailing={ArrowRight} onClick={() => navigate('pro.requests')}>
            View requests
          </Button>
        </motion.div>
      )}

      {/* ── Compare: top two side by side ── */}
      {compare.length === 2 && (
        <>
          <SectionHead className="mt-6" eyebrow="Compare" title={<>Top two <em>for the date</em></>} />
          <div className="relative mx-5 mt-3 grid grid-cols-2 overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-[var(--rule)]" />
            <span aria-hidden className="pointer-events-none absolute left-1/2 top-[96px] z-10 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-ink text-[10px] font-extrabold uppercase tracking-[0.08em] text-on-ink ring-4 ring-[var(--surface)]">
              vs
            </span>
            {compare.map((v, i) => {
              const owner = personById(v.owner)
              const avail = availabilityOn(v, date)
              const requested = requestsSent.includes(v.id)
              return (
                <div key={v.id} className="flex min-w-0 flex-col">
                  <Pressable onClick={() => (requested ? navigate('pro.requests') : openRequest(v))} className="flex min-w-0 flex-col text-left">
                    <span className="relative block h-[112px] w-full overflow-hidden">
                      <img src={img(v.photos[0], 400)} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <span aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
                      <span className="absolute bottom-2 left-3 rounded-full bg-[rgb(255_255_255/0.92)] px-2 py-0.5 text-[10.5px] font-extrabold text-text">{i === 0 ? 'Top rated' : 'Runner-up'}</span>
                      <span className="absolute -bottom-0 right-3 translate-y-1/2 rounded-full ring-2 ring-[var(--surface)]">
                        <Avatar who={owner.photo} size={30} alt={owner.name} />
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-col px-3 pb-1 pt-3">
                      <span className="truncate text-[14px] font-bold">{v.name}</span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <Stars rating={v.rating} count={v.reviews} size={12} />
                      </span>
                      <span className="mt-1 text-[12px] font-semibold text-text-2">
                        {v.years} yrs · {v.bookings} bookings
                      </span>
                      <span className="num mt-1.5 text-[16px] font-bold">
                        {money(v.priceFrom, v.currency)} <span className="text-[11px] font-semibold text-text-2">{v.priceUnit}</span>
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <AvailPill state={avail}>{avail === 'free' ? 'Free' : avail === 'held' ? 'Held' : 'Booked'}</AvailPill>
                        {v.verified && <Verified size={13} />}
                      </span>
                    </span>
                  </Pressable>
                  <div className="px-3 pb-3 pt-1.5">
                    {requested ? (
                      <Button size="sm" variant="paper" block icon={Check} onClick={() => navigate('pro.requests')}>
                        Requested
                      </Button>
                    ) : (
                      <Button size="sm" variant={i === 0 ? 'accent' : 'ink'} block icon={Send} onClick={() => openRequest(v)}>
                        Request
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Full list ── */}
      <SectionHead
        className="mt-7"
        eyebrow={fallback ? `${inCategory.length} ${cat.plural.toLowerCase()} in ${region === 'uk' ? 'London' : 'Lagos'} · showing every verified vendor` : `${inCategory.length} in ${region === 'uk' ? 'London' : 'Lagos'}`}
        title={<>{fallback ? 'All vendors' : cat.plural}</>}
      />
      <div className="mt-2 px-5">
        <StripLegend />
      </div>
      <motion.ul key={`${category}-${region}`} variants={listParent} initial="hidden" animate="show" className="mt-1">
        {list.map((v) => {
          const owner = personById(v.owner)
          const requested = requestsSent.includes(v.id)
          const avail = availabilityOn(v, date)
          return (
            <motion.li key={v.id} variants={listItem} className="px-5 py-4">
              <div className="flex gap-3">
                <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => (requested ? navigate('pro.requests') : openRequest(v))} aria-label={`${v.name}: ${requested ? 'view request' : 'send a request'}`} className="relative block shrink-0 overflow-visible rounded-[var(--r-card)]" style={{ width: 84, height: 84 }}>
                  <img src={img(v.photos[0], 240)} alt="" className="h-full w-full rounded-[var(--r-card)] object-cover" loading="lazy" />
                  <span className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-[var(--bg)]">
                    <Avatar who={owner.photo} size={26} alt={owner.name} />
                  </span>
                </motion.button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-[16px] font-bold">
                        {v.name} {v.verified ? <Verified size={14} label={false} /> : null}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[12px] font-semibold text-text-2">
                        <Stars rating={v.rating} count={v.reviews} size={12} />
                        <span>· {v.years} years</span>
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px] font-semibold text-text-2">
                    {v.area} · {v.bookings} bookings · replies {v.responseTime}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {v.category !== category && <Badge tone="accent">{categoryById(v.category).label}</Badge>}
                    {v.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full bg-[var(--surface-high)] px-2 py-0.5 text-[10.5px] font-bold text-text-2">
                        {t}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Strip vendor={v} size="sm" highlight={date} from={addDays(date, -6)} className="min-w-0 flex-1" />
                <AvailPill state={avail}>{avail === 'free' ? `Free ${fmtDay(date).slice(4)}` : avail === 'held' ? 'Held' : 'Booked'}</AvailPill>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="num mr-auto text-[15px] font-bold">
                  from {money(v.priceFrom, v.currency)} <span className="text-[11px] font-semibold text-text-2">{v.priceUnit}</span>
                </span>
                <IconButton icon={MessageCircle} label={`Message ${owner.first}`} tone="paper" size={40} onClick={() => message(v)} />
                {requested ? (
                  <Button size="sm" variant="paper" icon={Check} onClick={() => navigate('pro.requests')}>
                    Requested
                  </Button>
                ) : (
                  <Button size="sm" variant={avail === 'booked' ? 'outline' : 'ink'} icon={Send} onClick={() => (avail === 'booked' ? toast(`${v.name} is booked on ${fmtDay(date)} · ask for another date`, 'warn') : openRequest(v))}>
                    Send request
                  </Button>
                )}
              </div>
            </motion.li>
          )
        })}
      </motion.ul>

      <p className="mt-4 px-5 text-center text-[12px] font-semibold text-text-2">
        {plural(list.length, 'vendor')} · every one checked for credentials before listing · prices are demo values
      </p>
    </MobileScreen>
  )
}
