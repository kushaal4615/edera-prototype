import { motion } from 'framer-motion'
import { BadgeCheck, Bell, CalendarCheck, ChevronRight, Globe, Languages, LogOut, Mail, MapPin, Pencil, Phone, Star, Store, Wallet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge, Chip } from '../../components/Badge'
import { Bar, Figure, Stars } from '../../components/Brand'
import { Button, IconButton, Pressable } from '../../components/Button'
import { Sparkline } from '../../components/Charts'
import { CheckMark, Input, Toggle } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { BottomSheet } from '../../components/Sheet'
import { DEMO_PHONE_UK } from '../../data/demoFill'
import { VENDOR } from '../../data/people'
import { vendorById, type Region } from '../../data/vendors'
import { useNav, type ScreenId } from '../../lib/navigation'
import { session, useSession, type Lang } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { MobileScreen, SAFE_TOP, safeTop } from '../mobileShell'

/* vendor.profile: Bola's account. A photo hero behind the status bar, her
   face overlapping its bottom edge, a stats bento, then the account rows.
   Language and region write to the shared session store. */

const IYA = vendorById('iyabola')
const OLA = vendorById('ola-hall')
const REPEAT_TREND = [22, 24, 27, 29, 31, 33, 34, 36, 38]

const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'yo', label: 'Yorùbá', native: 'Èdè Yorùbá' },
]
const NOTIFS = [
  { id: 'requests', label: 'New requests', sub: 'Push + email · the moment one lands', on: true },
  { id: 'reminders', label: 'Booking reminders', sub: '7 days and 1 day before an event', on: true },
  { id: 'reviews', label: 'Review alerts', sub: 'When a client leaves a review', on: false },
]

function Row({ icon: Icon, title, sub, right, onClick, tone = 'plain' }: { icon: typeof Store; title: string; sub?: string; right?: ReactNode; onClick: () => void; tone?: 'plain' | 'brass' }) {
  return (
    <li>
      <Pressable onClick={onClick} className="flex min-h-[64px] items-center gap-3 py-2.5">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[12px] ${tone === 'brass' ? 'bg-brass-soft text-on-brass-soft' : 'bg-[var(--surface-high)] text-text'}`}>
          <Icon size={18} strokeWidth={2.2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold">{title}</span>
          {sub && <span className="block truncate text-[12px] font-semibold text-text-2">{sub}</span>}
        </span>
        {right}
        <ChevronRight size={18} className="shrink-0 text-text-2" aria-hidden />
      </Pressable>
    </li>
  )
}

export default function VendorProfile() {
  const { navigate, reset, toast } = useNav()
  const lang = useSession((s) => s.lang)
  const region = useSession((s) => s.region)
  const accepted = useSession((s) => Object.values(s.requestDecisions).filter((d) => d === 'accepted').length)
  const [notifs, setNotifs] = useState<Record<string, boolean>>(Object.fromEntries(NOTIFS.map((n) => [n.id, n.on])))
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState(VENDOR.name)
  const [phone, setPhone] = useState(DEMO_PHONE_UK)
  const [email, setEmail] = useState(VENDOR.email ?? 'bola@demo-iyabola.app')

  const go = (id: ScreenId) => () => navigate(id)
  const setLang = (l: Lang) => {
    session.setLang(l)
    track('lang_set', l)
    toast(l === 'yo' ? 'Èdè ti yípadà sí Yorùbá · Client App translates' : 'Language set to English', 'accent')
  }
  const setRegion = (r: Region) => {
    session.setRegion(r)
    track('region_set', r)
    toast(r === 'uk' ? 'Region: London · prices in £' : 'Region: Lagos · prices in ₦', 'accent')
  }

  return (
    <MobileScreen
      tab="account"
      cap="var(--night)"
      overlay={
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end px-3" style={{ paddingTop: safeTop(6) }}>
          <IconButton className="pointer-events-auto" icon={Pencil} label="Edit profile" tone="scrim" onClick={() => setEdit(true)} />
        </div>
      }
    >
      {/* Photo hero behind the status bar */}
      <HeroImage src="grillPlatter" alt="" className="h-[236px]" scrim="both" position="center 55%">
        <div className="flex h-full flex-col justify-end px-5 pb-14" style={{ paddingTop: SAFE_TOP }}>
          <p className="label text-brass-light">Account · Vendor &amp; venue owner</p>
        </div>
      </HeroImage>

      {/* Face overlapping the hero's bottom edge */}
      <div className="relative z-10 -mt-12 flex items-end justify-between px-5">
        <Avatar who="bola" size={96} ring verified alt="Bola Fashola" />
        <div className="mb-1 flex items-center gap-2">
          <Badge tone="success" icon={<BadgeCheck size={12} strokeWidth={2.6} aria-hidden />}>
            Verified
          </Badge>
          <Stars rating={IYA.rating} count={IYA.reviews} size={13} />
        </div>
      </div>
      <div className="mt-3 px-5">
        <h1 className="grot text-[30px]">{name}</h1>
        <p className="mt-1 text-[15px] font-semibold text-text-2">
          {IYA.name} · {OLA.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-text-2">
          <MapPin size={13} strokeWidth={2.4} aria-hidden /> Peckham, London · In operation {IYA.years} years · since 2015
        </p>
      </div>

      {/* Stats bento */}
      <div className="mx-5 mt-5 grid grid-cols-3 gap-2">
        <div className="relative col-span-2 overflow-hidden rounded-[var(--r-card)] bg-ink p-4 text-on-ink">
          <span aria-hidden className="arc-soft" />
          <p className="label relative text-brass-light">Catering bookings</p>
          <Figure value={IYA.bookings + accepted} size={46} className="relative mt-1 block" />
          <p className="relative mt-1 text-[12px] font-semibold text-on-ink-2">{accepted ? `${accepted} accepted today · ` : ''}since 2015</p>
        </div>
        <div className="rounded-[var(--r-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
          <p className="label text-text-2">Hall</p>
          <Figure value={OLA.bookings} size={32} className="mt-1 block" />
          <p className="mt-1 text-[12px] font-semibold text-text-2">bookings</p>
        </div>
        <div className="rounded-[var(--r-card)] bg-accent-soft p-4 text-on-accent-soft">
          <p className="label">Reply time</p>
          <Figure value={2} unit="h" size={32} className="mt-1 block" />
          <p className="mt-1 text-[12px] font-semibold">median</p>
        </div>
        <div className="col-span-2 rounded-[var(--r-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="label text-text-2">Repeat clients</p>
              <Figure value={38} unit="%" size={32} className="mt-1 block" />
            </div>
            <div className="text-right">
              <Sparkline data={REPEAT_TREND} width={88} height={30} color="var(--brass)" />
              <p className="meta mt-0.5 whitespace-nowrap text-text-2">+16 pts · 9 mo</p>
            </div>
          </div>
          <Bar value={38} tone="brass" height={6} className="mt-3" />
        </div>
      </div>

      {/* Account rows */}
      <p className="label mt-8 px-5 text-text-2">Business</p>
      <ul className="mt-1 px-5">
        <Row icon={Store} title="Listings" sub="Ìyá Bola Catering · Olá Event Hall" right={<Badge tone="neutral">2</Badge>} onClick={go('vendor.listings')} />
        <Row icon={BadgeCheck} title="Verification" sub="Verified Professional · 1 document expiring" right={<Badge tone="warn">Expiring</Badge>} onClick={go('vendor.verification')} />
        <Row icon={Star} title="Reviews" sub={`${IYA.rating.toFixed(1)} · ${IYA.reviews} reviews · 7 awaiting reply`} onClick={go('vendor.reviews')} />
        <Row icon={CalendarCheck} title="Bookings" sub="7 upcoming · 8 completed" onClick={go('vendor.bookings')} />
        <Row icon={Wallet} title="Payouts" sub="Later phase · bookings settled outside Edera" tone="brass" right={<Badge tone="warn">Later</Badge>} onClick={() => toast('Payouts arrive in a later phase · Edera is free while the community grows')} />
      </ul>

      <p className="label mt-7 px-5 text-text-2">Notifications</p>
      <ul className="mt-1 px-5">
        {NOTIFS.map((n) => (
          <li key={n.id} className="flex min-h-[64px] items-center gap-3 py-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[var(--surface-high)]">
              <Bell size={18} strokeWidth={2.2} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold">{n.label}</span>
              <span className="block truncate text-[12px] font-semibold text-text-2">{n.sub}</span>
            </span>
            <Toggle on={notifs[n.id]} label={n.label} onChange={(on) => setNotifs((s) => ({ ...s, [n.id]: on }))} />
          </li>
        ))}
      </ul>

      <p className="label mt-7 px-5 text-text-2">Language</p>
      <ul className="mt-1 px-5">
        {LANGS.map((l) => (
          <li key={l.id}>
            <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring.ui} onClick={() => setLang(l.id)} aria-pressed={lang === l.id} className="flex min-h-[60px] w-full items-center gap-3 py-2 text-left">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[var(--surface-high)]">
                <Languages size={18} strokeWidth={2.2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">{l.label}</span>
                <span className="block text-[12px] font-semibold text-text-2">{l.native}</span>
              </span>
              <CheckMark on={lang === l.id} />
            </motion.button>
          </li>
        ))}
      </ul>
      <p className="meta mt-1 px-5 text-text-2">More languages (Naijá, Igbo, Hausa) follow in the Client App first.</p>

      <p className="label mt-7 px-5 text-text-2">Region</p>
      <div className="mt-2 flex items-center gap-3 px-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[var(--surface-high)]">
          <Globe size={18} strokeWidth={2.2} aria-hidden />
        </span>
        <div className="flex gap-2">
          {(
            [
              ['uk', 'London · £'],
              ['ng', 'Lagos · ₦'],
            ] as [Region, string][]
          ).map(([id, label]) => (
            <motion.button key={id} type="button" whileTap={tap} transition={spring.ui} onClick={() => setRegion(id)} aria-pressed={region === id} className="flex min-h-[44px] items-center">
              <Chip on={region === id}>{label}</Chip>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-8 px-5">
        <Button variant="outline" block icon={Pencil} onClick={() => setEdit(true)}>
          Edit profile
        </Button>
        <Button variant="danger" block icon={LogOut} className="mt-2" onClick={() => reset('vendor.signin')}>
          Sign out
        </Button>
        <p className="meta mt-4 text-center text-text-2">Member since {VENDOR.since} · Vendor App 0.9 (demo)</p>
      </div>

      {/* Edit profile sheet */}
      <BottomSheet open={edit} onClose={() => setEdit(false)} title="Edit profile" tall>
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex items-center gap-3">
            <Avatar who="bola" size={56} />
            <Button size="sm" variant="paper" onClick={() => toast('Photo picker opens here')}>
              Change photo
            </Button>
          </div>
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} leading={<Phone size={16} aria-hidden />} hint="Clients only see it after a booking is confirmed" />
          <Input label="Email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} leading={<Mail size={16} aria-hidden />} />
          <Button
            block
            size="lg"
            onClick={() => {
              setEdit(false)
              track('profile_saved')
              toast('Profile saved', 'accent')
            }}
          >
            Save
          </Button>
        </div>
      </BottomSheet>
    </MobileScreen>
  )
}
