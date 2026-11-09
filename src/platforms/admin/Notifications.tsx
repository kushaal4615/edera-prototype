import { motion } from 'framer-motion'
import { CalendarClock, Languages, Megaphone, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../components/Badge'
import { Bar, Figure } from '../../components/Brand'
import { Button } from '../../components/Button'
import { CHART } from '../../components/Charts'
import { Input, TextArea, Toggle } from '../../components/Form'
import { Drawer } from '../../components/Sheet'
import { Segmented } from '../../components/Tabs'
import { AUTO_NOTIFICATIONS, CAMPAIGNS, KPI, type Campaign } from '../../data/admin'
import { addDays, CLOCK, fmtDay, fmtShort, pct } from '../../data/clock'
import { DEMO_BROADCAST } from '../../data/demoFill'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { listItem, listParent } from '../../motion/transitions'
import { ConsoleShell, Panel } from '../console/shell'

/* admin.notifications: the real-time notifications the system fires on its
   own (with their switches), the broadcast campaigns, and a composer that
   sends in the local languages. */

type Channel = 'Push' | 'Email' | 'Push + email'
type Lang = 'English' | 'Yorùbá' | 'Naijá (Pidgin)'

/** Seven-day pattern per auto notification, synthesised from sent24h (demo values). */
const SHAPES = [
  [0.7, 0.8, 0.75, 0.9, 1.1, 1.3, 1],
  [0.6, 0.7, 0.9, 0.8, 1.0, 1.2, 1],
  [0.9, 0.85, 0.95, 1.0, 1.05, 1.2, 1],
  [0.5, 0.6, 0.7, 0.9, 1.1, 1.4, 1],
  [0.3, 0.3, 0.4, 0.5, 0.9, 1.6, 1],
  [0.8, 1.2, 0.6, 1.1, 0.9, 0.7, 1],
  [1.3, 0.9, 1.1, 0.6, 0.8, 1.0, 1],
  [0.9, 1.1, 1.0, 1.2, 0.8, 1.3, 1],
  [0.7, 0.9, 1.1, 0.8, 1.0, 1.2, 1],
]
const weekFor = (i: number, sent24h: number) => SHAPES[i % SHAPES.length].map((k) => Math.round(sent24h * k))

/** Notifications per day, push vs email, last 14 days (demo values). */
const DELIVERY = Array.from({ length: 14 }, (_, i) => {
  const iso = addDays(CLOCK.todayIso, i - 13)
  const push = 2600 + i * 140 + (i % 3 === 0 ? 420 : 0) + (i === 11 ? 900 : 0)
  const email = 640 + i * 38 + (i % 4 === 1 ? 260 : 0)
  return { d: fmtShort(iso), push, email }
})

const TEMPLATES = ['Booking request received', 'Request accepted', 'New date proposed', 'RSVP received', 'Guest checked in', 'Verification approved', 'Event is tomorrow', 'Review request']

const AUDIENCES = ['Vendors · Nigeria', 'Vendors · UK', 'Vendors · all', 'Planners · UK', 'Planners · Nigeria', 'Clients with an event in 60 days', 'Everyone']
const AUDIENCE_SIZE: Record<string, number> = {
  'Vendors · Nigeria': KPI.ng.vendors,
  'Vendors · UK': KPI.uk.vendors,
  'Vendors · all': KPI.vendors,
  'Planners · UK': 236,
  'Planners · Nigeria': 176,
  'Clients with an event in 60 days': 1104,
  Everyone: KPI.users,
}

export default function AdminNotifications() {
  const { toast } = useNav()
  const autoToggles = useSession((s) => s.autoToggles)
  const campaignsSent = useSession((s) => s.campaignsSent)
  const composer = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState(DEMO_BROADCAST.title)
  const [body, setBody] = useState(DEMO_BROADCAST.body)
  const [audience, setAudience] = useState(DEMO_BROADCAST.audience)
  const [channel, setChannel] = useState<Channel>(DEMO_BROADCAST.channel as Channel)
  const [lang, setLang] = useState<Lang>('English')
  const [open, setOpen] = useState<Campaign | null>(null)

  const isOn = (id: string, dflt: boolean) => autoToggles[id] ?? dflt
  const live24h = AUTO_NOTIFICATIONS.filter((a) => isOn(a.id, a.on)).reduce((s, a) => s + a.sent24h, 0)
  const sentC1 = campaignsSent.includes('c1')

  const sendNow = () => {
    if (sentC1) return toast('This broadcast already went out · duplicate send blocked', 'warn')
    session.sendCampaign('c1')
    toast(`Broadcast sent to ${AUDIENCE_SIZE[audience] ?? 628} vendors in Nigeria`, 'accent')
  }
  const schedule = () => toast(`Scheduled for ${fmtDay(addDays(CLOCK.todayIso, 2))} · 09:00 WAT · ${channel}`, 'accent')
  const focusComposer = () => {
    composer.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    toast('Composer is pre-filled with the Lagos launch broadcast', 'neutral')
  }

  const effective = (c: Campaign): Campaign => (campaignsSent.includes(c.id) ? { ...c, state: 'sent', sent: CLOCK.todayIso, delivered: AUDIENCE_SIZE[c.audience] ?? 628, opened: 41 } : c)

  return (
    <ConsoleShell
      active="admin.notifications"
      title="Notifications"
      sub={`${live24h.toLocaleString('en-GB')} real-time notifications in the last 24h · ${CAMPAIGNS.length} broadcasts · English, Yorùbá and Naijá templates`}
      actions={
        <Button size="sm" icon={Megaphone} onClick={focusComposer}>
          New broadcast
        </Button>
      }
    >
      {/* ── LIVE panel ── */}
      <Panel
        className="mx-8 min-w-0 overflow-hidden max-md:mx-4"
        pad={false}
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-free opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-free" />
            </span>
            Real-time notifications
          </span>
        }
        action={
          <span className="flex items-baseline gap-2">
            <Figure value={live24h.toLocaleString('en-GB')} size={26} />
            <span className="label text-text-2">sent · 24h</span>
          </span>
        }
      >
        <table className="mt-2 w-full border-collapse text-[13px] max-md:hidden">
          <thead>
            <tr className="label text-text-2">
              <th className="px-5 pb-2 text-left font-extrabold">On</th>
              <th className="pb-2 text-left font-extrabold">Trigger</th>
              <th className="pb-2 text-left font-extrabold">Audience</th>
              <th className="pb-2 text-left font-extrabold">Channel</th>
              <th className="pb-2 text-right font-extrabold">Sent · 24h</th>
              <th className="px-5 pb-2 text-left font-extrabold">Last 7 days</th>
            </tr>
          </thead>
          <motion.tbody variants={listParent} initial="hidden" animate="show">
            {AUTO_NOTIFICATIONS.map((a, i) => {
              const on = isOn(a.id, a.on)
              const week = weekFor(i, a.sent24h)
              const max = Math.max(...week)
              return (
                <motion.tr key={a.id} variants={listItem} className={`border-t border-[var(--rule)] ${on ? '' : 'bg-[var(--surface-raised)]'}`}>
                  <td className="px-5 py-2">
                    <Toggle
                      on={on}
                      label={`${a.trigger} notifications`}
                      onChange={(v) => {
                        session.toggleAuto(a.id, v)
                        toast(v ? `“${a.trigger}” switched on` : `“${a.trigger}” paused · nothing fires until it is back on`, v ? 'accent' : 'warn')
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3 font-bold">
                    {a.trigger}
                    {!on && <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.08em] text-text-2">paused</span>}
                  </td>
                  <td className="py-2 pr-3 font-semibold text-text-2">{a.to}</td>
                  <td className="py-2 pr-3">
                    <span className="flex flex-wrap gap-1">
                      {a.channel.split(' · ').map((c) => (
                        <Badge key={c} tone={c === 'Push' ? 'accent' : c === 'Email' ? 'info' : 'neutral'}>
                          {c}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td className="num py-2 pr-3 text-right text-[14px] font-extrabold">{a.sent24h.toLocaleString('en-GB')}</td>
                  <td className="px-5 py-2">
                    <span className="inline-flex h-[26px] items-end gap-[3px]" role="img" aria-label={`Last 7 days: ${week.join(', ')}`}>
                      {week.map((n, j) => (
                        <span key={j} className="w-[6px] rounded-full" style={{ height: Math.max(4, (n / max) * 26), background: j === 6 ? 'var(--brass)' : on ? 'var(--ink)' : 'var(--paper-400)' }} />
                      ))}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </motion.tbody>
        </table>
        <ul className="mt-2 md:hidden">
          {AUTO_NOTIFICATIONS.map((a, i) => {
            const on = isOn(a.id, a.on)
            const week = weekFor(i, a.sent24h)
            const max = Math.max(...week)
            return (
              <li key={a.id} className="flex items-center gap-3 border-t border-[var(--rule)] px-4 py-3">
                <Toggle on={on} label={`${a.trigger} notifications`} onChange={(v) => { session.toggleAuto(a.id, v); toast(v ? `“${a.trigger}” switched on` : `“${a.trigger}” paused`, v ? 'accent' : 'warn') }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">{a.trigger}</span>
                  <span className="block truncate text-[12px] font-semibold text-text-2">
                    {a.to} · {a.channel}
                  </span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="num text-[14px] font-extrabold">{a.sent24h.toLocaleString('en-GB')}</span>
                  <span className="inline-flex h-[18px] items-end gap-[2px]">
                    {week.map((n, j) => (
                      <span key={j} className="w-[4px] rounded-full" style={{ height: Math.max(3, (n / max) * 18), background: j === 6 ? 'var(--brass)' : 'var(--ink)' }} />
                    ))}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </Panel>

      {/* ── Campaigns · composer ── */}
      <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-6 px-8 pt-6 max-md:grid-cols-1 max-md:px-4">
        <Panel title="Broadcasts" pad={false} className="min-w-0 overflow-hidden" action={<span className="meta text-text-2">tap a row for delivery detail</span>}>
          <table className="mt-1 w-full table-fixed border-collapse text-[13px] max-md:hidden">
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr className="label text-text-2">
                <th className="px-5 pb-2 text-left font-extrabold">Title</th>
                <th className="pb-2 text-left font-extrabold">Audience</th>
                <th className="pb-2 text-left font-extrabold">Sent</th>
                <th className="pb-2 text-right font-extrabold">Delivered</th>
                <th className="px-5 pb-2 text-left font-extrabold">Opened</th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map((raw) => {
                const c = effective(raw)
                const rate = pct(c.opened, c.delivered)
                return (
                  <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer border-t border-[var(--rule)] hover:bg-[var(--surface-raised)]">
                    <td className="px-5 py-2.5">
                      <button type="button" onClick={() => setOpen(c)} className="block w-full truncate text-left font-bold">
                        {c.title}
                      </button>
                      <span className="block text-[12px] font-semibold text-text-2">{c.channel}</span>
                    </td>
                    <td className="truncate py-2.5 pr-3 font-semibold text-text-2">{c.audience}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3">
                      {c.state === 'sent' ? <span className="num font-semibold">{c.sent === CLOCK.todayIso ? 'Today · just now' : fmtDay(c.sent)}</span> : c.state === 'scheduled' ? <Badge tone="warn" icon={<CalendarClock size={11} aria-hidden />}>{fmtShort(c.sent)}</Badge> : <Badge tone="neutral">Draft</Badge>}
                    </td>
                    <td className="num py-2.5 pr-3 text-right font-semibold">{c.state === 'sent' ? c.delivered.toLocaleString('en-GB') : '–'}</td>
                    <td className="px-5 py-2.5">
                      {c.state === 'sent' ? (
                        <>
                          <span className="num mb-1 flex items-baseline justify-between gap-3 text-[12px] font-bold">
                            <span>{c.opened.toLocaleString('en-GB')}</span>
                            <span className="text-text-2">{rate}%</span>
                          </span>
                          <Bar value={rate} height={5} tone={rate >= 60 ? 'accent' : 'brass'} />
                        </>
                      ) : (
                        <span className="text-[12px] font-semibold text-text-2">{c.state === 'scheduled' ? 'Not sent yet' : 'Finish the draft'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <ul className="mt-1 md:hidden">
            {CAMPAIGNS.map((raw) => {
              const c = effective(raw)
              return (
                <li key={c.id} className="border-t border-[var(--rule)]">
                  <button type="button" onClick={() => setOpen(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{c.title}</span>
                      <span className="block truncate text-[12px] font-semibold text-text-2">
                        {c.audience} · {c.channel}
                      </span>
                    </span>
                    {c.state === 'sent' ? <span className="num text-[12px] font-bold">{pct(c.opened, c.delivered)}% opened</span> : <Badge tone={c.state === 'scheduled' ? 'warn' : 'neutral'}>{c.state === 'scheduled' ? fmtShort(c.sent) : 'Draft'}</Badge>}
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div ref={composer} className="relative min-w-0 overflow-hidden rounded-[var(--r-container)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
          <div className="relative bg-ink px-6 pb-5 pt-5 text-on-ink">
            <span aria-hidden className="arc" style={{ width: '56%', right: '-18%', bottom: '-110%' }} />
            <p className="label text-on-ink-2">New broadcast</p>
            <h2 className="grot mt-1 text-[24px]">
              To <em className="text-brass-light">{AUDIENCE_SIZE[audience]?.toLocaleString('en-GB') ?? '628'}</em> people
            </h2>
            <p className="mt-1 text-[12px] font-semibold text-on-ink-2">{audience} · {channel} · {lang}</p>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} dense />
            <TextArea label="Message" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">
              Audience
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className="well h-10 rounded-[var(--r-control)] px-3.5 text-[14px] font-medium outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                {AUDIENCES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold">Channel</span>
              <Segmented<Channel> size="sm" full items={[{ id: 'Push', label: 'Push' }, { id: 'Email', label: 'Email' }, { id: 'Push + email', label: 'Both' }]} value={channel} onChange={setChannel} />
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">
              <span className="inline-flex items-center gap-1.5">
                <Languages size={14} aria-hidden /> Language
              </span>
              <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="well h-10 rounded-[var(--r-control)] px-3.5 text-[14px] font-medium outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                {(['English', 'Yorùbá', 'Naijá (Pidgin)'] as Lang[]).map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <span className="text-[12px] font-medium text-text-2">Templates per language: each recipient gets the copy in the language set on their profile. Igbo and Hausa fall back to English for now.</span>
            </label>
            <div className="flex gap-2 pt-1">
              <Button block icon={Send} onClick={sendNow}>
                {sentC1 ? 'Sent' : 'Send now'}
              </Button>
              <Button block variant="outline" icon={CalendarClock} onClick={schedule}>
                Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery chart · templates ── */}
      <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-6 px-8 pb-12 pt-6 max-md:grid-cols-1 max-md:px-4">
        <Panel title="Delivered per day" action={<span className="meta text-text-2">last 14 days · push vs email</span>}>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DELIVERY} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="nPush" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.series.primary} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={CHART.series.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nEmail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.series.secondary} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART.series.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="d" tick={CHART.axis} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={CHART.axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} width={44} />
                <Tooltip {...CHART.tooltip} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} formatter={(v: string) => <span style={{ color: '#123C35' }}>{v}</span>} />
                <Area type="monotone" dataKey="push" name="Push" stroke={CHART.series.primary} strokeWidth={2} fill="url(#nPush)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} isAnimationActive={false} />
                <Area type="monotone" dataKey="email" name="Email" stroke={CHART.series.secondary} strokeWidth={2} fill="url(#nEmail)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <section className="rounded-[var(--r-card)] bg-[var(--surface-tint)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="grot text-[22px]">Templates</h2>
            <span className="meta text-text-2">EN · YO · PCM</span>
          </div>
          <p className="mt-1 text-[13px] font-medium text-text-2">Every automatic notification has a copy in English, Yorùbá and Naijá. Tap one to edit.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t} type="button" onClick={() => toast(`Template “${t}” · 3 languages · last edited by Dave`, 'neutral')} className="h-8 rounded-full bg-[var(--surface)] px-3 text-[12px] font-bold text-text shadow-[var(--shadow-raised)]">
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-[var(--r-card)] bg-[var(--surface)] p-4">
            <p className="label text-text-2">Yorùbá · Booking request received</p>
            <p className="mt-1 text-[14px] font-semibold">“Ìbéèrè tuntun láti ọwọ́ Bakare Events · 20 Feb · £5,760”</p>
            <p className="meta mt-1 text-text-2">Naijá: “New request don land from Bakare Events”</p>
          </div>
        </section>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title="Broadcast" width={420}>
        {open && (
          <div className="flex flex-col gap-5">
            <div>
              <Badge tone={open.state === 'sent' ? 'accent' : open.state === 'scheduled' ? 'warn' : 'neutral'}>{open.state === 'sent' ? 'Sent' : open.state === 'scheduled' ? 'Scheduled' : 'Draft'}</Badge>
              <h3 className="grot mt-2 text-[26px]">{open.title}</h3>
              <p className="mt-1 text-[13px] font-semibold text-text-2">
                {open.audience} · {open.channel}
                {open.state !== 'draft' && ` · ${open.sent === CLOCK.todayIso ? 'today' : fmtDay(open.sent, true)}`}
              </p>
            </div>
            {open.state === 'sent' ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'Delivered', v: open.delivered },
                  { l: 'Opened', v: open.opened },
                  { l: 'Open rate', v: `${pct(open.opened, open.delivered)}%` },
                ].map((k) => (
                  <div key={k.l} className="rounded-[var(--r-card)] bg-[var(--surface-raised)] p-3">
                    <p className="label text-text-2">{k.l}</p>
                    <Figure value={typeof k.v === 'number' ? k.v.toLocaleString('en-GB') : k.v} size={26} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[var(--r-card)] bg-[var(--surface-raised)] p-4 text-[13px] font-semibold text-text-2">{open.state === 'scheduled' ? `Goes out on ${fmtDay(open.sent, true)} at 09:00 local time to about ${(AUDIENCE_SIZE[open.audience] ?? 600).toLocaleString('en-GB')} people.` : 'This draft has no send date yet.'}</p>
            )}
            <div>
              <p className="label text-text-2">Languages</p>
              <div className="mt-2 flex gap-2">
                {['English', 'Yorùbá', 'Naijá'].map((l, i) => (
                  <span key={l} className={`rounded-full px-3 py-1 text-[12px] font-bold ${i === 0 || open.audience.includes('Nigeria') || open.audience.includes('all') ? 'bg-accent-soft text-on-accent-soft' : 'bg-[var(--surface-high)] text-text-2'}`}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="ink" block onClick={() => { setOpen(null); toast(`“${open.title}” copied into the composer`, 'accent'); setTitle(open.title); setAudience(open.audience); composer.current?.scrollIntoView({ behavior: 'smooth' }) }}>
              Duplicate into composer
            </Button>
          </div>
        )}
      </Drawer>
    </ConsoleShell>
  )
}
