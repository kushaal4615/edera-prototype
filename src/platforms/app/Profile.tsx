import { motion } from 'framer-motion'
import { Bell, CalendarDays, ChevronRight, LogOut, MapPin, PartyPopper, Save, UserRound, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { CheckMark, Toggle } from '../../components/Form'
import { Segmented } from '../../components/Tabs'
import { daysUntil } from '../../data/clock'
import { REQUESTS, RUBY } from '../../data/events'
import { CLIENT } from '../../data/people'
import type { Region } from '../../data/vendors'
import { useNav, type ScreenId } from '../../lib/navigation'
import { LANG_LABEL, session, unreadClient, useLang, useSession, type Lang } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, TopBar } from '../mobileShell'

/* app.profile: account, language and market. Headline strings go through
   t(en, yo, pcm); Igbo and Hausa are selectable and fall back to English. */

const LANGS: Lang[] = ['en', 'yo', 'pcm', 'ig', 'ha']
const FALLBACK: Lang[] = ['ig', 'ha']

export default function AppProfile() {
  const { navigate, reset, toast } = useNav()
  const { t, lang } = useLang()
  const region = useSession((s) => s.region)
  const unread = useSession((s) => unreadClient(s))
  const [notify, setNotify] = useState({ bookings: true, messages: true, rsvps: true, whatsapp: false })
  const bookings = REQUESTS.filter((r) => r.eventId === RUBY.id).length

  const pickLang = (code: Lang) => {
    track('set_language', code)
    session.setLang(code)
    if (FALLBACK.includes(code)) toast(`${LANG_LABEL[code].native} is on the way · showing English for now`, 'info')
  }
  const save = () => {
    track('save_preferences', lang)
    toast(t('Preferences saved', 'A ti fi àwọn ìfẹ́ rẹ pamọ́', 'Your preferences don save'), 'accent')
  }

  const links: { id: ScreenId; icon: LucideIcon; label: string; meta: string }[] = [
    { id: 'app.bookings', icon: CalendarDays, label: t('My bookings', 'Àwọn ìwé ìfilọ́lẹ̀ mi', 'My bookings'), meta: `${bookings} vendors` },
    { id: 'app.notifications', icon: Bell, label: t('Notifications', 'Ìfitónilétí', 'Notifications'), meta: unread ? `${unread} unread` : 'all read' },
    { id: 'app.planner', icon: UserRound, label: t('Your planner', 'Olùgbékalẹ̀ rẹ', 'Your planner'), meta: 'Tunde Bakare' },
    { id: 'app.event', icon: PartyPopper, label: t('My event', 'Ayẹyẹ mi', 'My event'), meta: `in ${daysUntil(RUBY.date)} days` },
  ]

  return (
    <MobileScreen
      header={<TopBar title={t('Profile', 'Àkọọ́lẹ̀', 'Profile')} tone="bg" />}
      dock={
        <Dock>
          <Button block size="lg" icon={Save} onClick={save}>
            {t('Save preferences', 'Fi pamọ́', 'Save am')}
          </Button>
        </Dock>
      }
    >
      {/* identity band */}
      <section className="relative mx-5 mt-1 overflow-hidden rounded-[var(--r-container)] bg-night px-5 pb-5 pt-6 text-on-night">
        <span className="arc" style={{ top: '64%', bottom: 'auto', right: '-22%', width: '72%' }} aria-hidden />
        <span className="dots-light" aria-hidden />
        <div className="relative flex items-center gap-4">
          <Avatar who={CLIENT.photo} size={84} ring verified />
          <div className="min-w-0 flex-1">
            <p className="grot text-[26px] leading-[1.02]">{CLIENT.name}</p>
            <p className="mt-1.5 text-[13px] font-semibold text-on-night-2">
              {t('Client since', 'Oníbàárà láti', 'Client since')} {CLIENT.since}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-on-night-2">
              <MapPin size={13} aria-hidden /> {CLIENT.city} · {CLIENT.phone}
            </p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          {[
            [1, t('event', 'ayẹyẹ', 'event')],
            [bookings, t('bookings', 'ìfilọ́lẹ̀', 'bookings')],
            [RUBY.guests, t('guests', 'àlejò', 'guests')],
          ].map(([n, label]) => (
            <div key={String(label)} className="rounded-[var(--r-card)] bg-[rgb(255_255_255/0.08)] px-3 py-2.5">
              <span className="figure num block text-[28px]">{n}</span>
              <span className="label text-on-night-2">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* language */}
      <section className="mt-6">
        <div className="flex items-end justify-between px-5">
          <div>
            <p className="label text-brass-ink">{t('Language', 'Èdè', 'Language')}</p>
            <h2 className="grot mt-1 text-[22px]">
              {t('Read Edera in', 'Ka Edera ní', 'Read Edera for')} <em>{LANG_LABEL[lang].native}</em>
            </h2>
          </div>
        </div>
        <ul className="mt-3">
          {LANGS.map((code) => {
            const on = code === lang
            const fallback = FALLBACK.includes(code)
            return (
              <li key={code} className="rule-b">
                <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring.ui} onClick={() => pickLang(code)} aria-pressed={on} className="flex w-full items-center gap-3.5 px-5 py-3 text-left">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-extrabold uppercase ${on ? 'bg-accent text-on-accent' : 'bg-[var(--surface-high)] text-text'}`}>{code}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] ${on ? 'font-extrabold' : 'font-bold'}`}>{LANG_LABEL[code].native}</span>
                    <span className="meta block text-text-2">
                      {LANG_LABEL[code].name}
                      {fallback ? ' · English until the translation lands' : ''}
                    </span>
                  </span>
                  {fallback && <Badge tone="warn">Soon</Badge>}
                  <CheckMark on={on} />
                </motion.button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* region */}
      <section className="mt-6 px-5">
        <p className="label text-brass-ink">{t('Region & currency', 'Agbègbè àti owó', 'Region & currency')}</p>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--r-card)] bg-[var(--surface)] p-3 shadow-[var(--shadow-raised)]">
          <div className="min-w-0">
            <p className="text-[15px] font-bold">{region === 'uk' ? 'London · GBP £' : 'Lagos · NGN ₦'}</p>
            <p className="meta mt-0.5 text-text-2">{region === 'uk' ? 'Explore shows London vendors' : 'Explore shows Lagos vendors'}</p>
          </div>
          <Segmented<Region>
            size="sm"
            tone="accent"
            items={[
              { id: 'uk', label: 'UK' },
              { id: 'ng', label: 'NG' },
            ]}
            value={region}
            onChange={(r) => {
              session.setRegion(r)
              toast(r === 'uk' ? 'Showing London vendors in £' : 'Showing Lagos vendors in ₦')
            }}
          />
        </div>
      </section>

      {/* notifications */}
      <section className="mt-6 px-5">
        <p className="label text-brass-ink">{t('Notify me about', 'Fi tó mi létí nípa', 'Tell me about')}</p>
        <ul className="mt-2">
          {(
            [
              ['bookings', 'Booking updates', 'Accepts, declines, new dates'],
              ['messages', 'Messages', 'Tunde and your vendors'],
              ['rsvps', 'RSVPs', 'Yes, no and plus-ones'],
              ['whatsapp', 'WhatsApp copies', 'Also send each alert to WhatsApp'],
            ] as [keyof typeof notify, string, string][]
          ).map(([key, label, sub]) => (
            <li key={key} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[15px] font-bold">{label}</p>
                <p className="text-[12px] text-text-2">{sub}</p>
              </div>
              <Toggle on={notify[key]} onChange={(v) => setNotify((n) => ({ ...n, [key]: v }))} label={label} />
            </li>
          ))}
        </ul>
      </section>

      {/* links */}
      <section className="mt-4 px-5">
        <ul className="overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
          {links.map((l) => (
            <li key={l.id} className="rule-b last:shadow-none">
              <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring.ui} onClick={() => navigate(l.id)} className="flex h-[56px] w-full items-center gap-3 px-4 text-left">
                <l.icon size={18} strokeWidth={2.2} className="shrink-0 text-accent-ink" aria-hidden />
                <span className="min-w-0 flex-1 text-[15px] font-bold">{l.label}</span>
                <span className="meta shrink-0 text-text-2">{l.meta}</span>
                <ChevronRight size={18} className="shrink-0 text-text-2" aria-hidden />
              </motion.button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 px-5">
        <motion.button
          type="button"
          whileTap={tap}
          transition={spring.ui}
          onClick={() => {
            track('sign_out')
            reset('app.welcome')
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-danger-text ring-1 ring-inset ring-[rgb(181_55_47/0.3)]"
        >
          <LogOut size={17} aria-hidden /> {t('Sign out', 'Jáde', 'Comot')}
        </motion.button>
        <p className="meta mt-3 text-center text-text-2">{CLIENT.email} · v0.9 demo</p>
      </div>
    </MobileScreen>
  )
}
