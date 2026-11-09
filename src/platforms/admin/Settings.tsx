import { motion } from 'framer-motion'
import { Banknote, Coins, Globe2, Languages, Plus, Save, ShieldCheck, Tags } from 'lucide-react'
import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { Badge } from '../../components/Badge'
import { Bar, Figure } from '../../components/Brand'
import { Button } from '../../components/Button'
import { CheckMark, Input, Toggle } from '../../components/Form'
import { KPI, LANGUAGES, REGIONS } from '../../data/admin'
import { fmtDay, money } from '../../data/clock'
import { DEMO_COMMISSION } from '../../data/demoFill'
import { CATEGORIES } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { tap } from '../../motion/springs'
import { ConsoleShell } from '../console/shell'

/* admin.settings: Platform settings. A left in-page nav and the five
   sections: Regions, Languages, Money (the commission switch, OFF),
   Verification, Categories. A sticky Save bar closes the page. */

type SectionId = 'regions' | 'languages' | 'money' | 'verification' | 'categories'
const SECTIONS: { id: SectionId; label: string; icon: typeof Globe2 }[] = [
  { id: 'regions', label: 'Regions', icon: Globe2 },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'money', label: 'Money', icon: Coins },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'categories', label: 'Categories', icon: Tags },
]

type RoleKey = 'Planner' | 'Vendor' | 'Venue'
const ROLES: RoleKey[] = ['Planner', 'Vendor', 'Venue']
/** Required documents per role (demo defaults, editable here). */
const DOC_MATRIX: { doc: string; hint: string; req: Record<RoleKey, boolean> }[] = [
  { doc: 'Government ID', hint: 'Passport, driving licence, NIN or voter’s card', req: { Planner: true, Vendor: true, Venue: true } },
  { doc: 'Business registration', hint: 'Companies House (UK) or CAC (Nigeria)', req: { Planner: true, Vendor: true, Venue: true } },
  { doc: 'Public liability insurance', hint: 'In date, £1m / ₦50m minimum', req: { Planner: true, Vendor: false, Venue: true } },
  { doc: 'Portfolio of past events', hint: 'At least 8 events with dates', req: { Planner: true, Vendor: true, Venue: false } },
  { doc: 'Premises & fire safety certificate', hint: 'Venues only', req: { Planner: false, Vendor: false, Venue: true } },
  { doc: 'Food hygiene rating', hint: 'FHRS (UK) or NAFDAC kitchen registration (Nigeria)', req: { Planner: false, Vendor: true, Venue: false } },
]

const NEW_CATEGORY = 'Aso-ebi & fabrics'
const CITY_COUNTS: Record<string, number> = { London: 2210, Manchester: 318, Birmingham: 216, Lagos: 1690, Abuja: 262, 'Port Harcourt': 116 }

export default function AdminSettings() {
  const { toast } = useNav()
  const commissionOn = useSession((s) => s.commissionOn)
  const languagesOn = useSession((s) => s.languagesOn)
  const categoriesAdded = useSession((s) => s.categoriesAdded)
  const [active, setActive] = useState<SectionId>('regions')
  const [regionLive, setRegionLive] = useState<Record<string, boolean>>({ uk: true, ng: true })
  const [rate, setRate] = useState(DEMO_COMMISSION.rate)
  const [freeUntil, setFreeUntil] = useState(DEMO_COMMISSION.freeUntil)
  const [matrix, setMatrix] = useState(DOC_MATRIX)
  const [sla, setSla] = useState('2')
  const [newCategory, setNewCategory] = useState(NEW_CATEGORY)
  const [dirty, setDirty] = useState(false)
  const refs = useRef<Record<SectionId, HTMLElement | null>>({ regions: null, languages: null, money: null, verification: null, categories: null })

  const touch = () => setDirty(true)
  const go = (id: SectionId) => {
    setActive(id)
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // keep the in-page nav in step with the scroller
  useEffect(() => {
    const root = refs.current.regions?.closest('main')
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.getAttribute('data-section') as SectionId)
      },
      { root, rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    )
    SECTIONS.forEach((s) => refs.current[s.id] && obs.observe(refs.current[s.id]!))
    return () => obs.disconnect()
  }, [])

  const rateNum = Math.max(0, Math.min(100, Number(rate) || 0))
  const preview = Math.round(KPI.gbv30d * (rateNum / 100))

  const flipCommission = (v: boolean) => {
    session.setCommission(v)
    touch()
    toast(v ? 'Commission preview only · stays off until payments ship' : 'Commission switched off · Edera stays free', v ? 'warn' : 'accent')
  }
  const toggleDoc = (i: number, role: RoleKey) => {
    setMatrix((m) => m.map((row, j) => (j === i ? { ...row, req: { ...row.req, [role]: !row.req[role] } } : row)))
    touch()
  }
  const addCategory = () => {
    const name = newCategory.trim()
    if (!name) return toast('Give the category a name first', 'warn')
    if (CATEGORIES.some((c) => c.label === name) || categoriesAdded.includes(name)) return toast(`“${name}” is already a category`, 'neutral')
    session.addCategory(name)
    touch()
    toast(`“${name}” added · vendors can pick it on their next listing edit`, 'accent')
  }
  const save = () => {
    setDirty(false)
    toast('Settings saved', 'accent')
  }

  return (
    <ConsoleShell active="admin.settings" title="Platform settings" sub="Launch phase · free to use · United Kingdom + Nigeria · commission off" actions={<span className="meta text-text-2">Last saved 2 Nov · Dave</span>}>
      <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-8 px-8 max-md:grid-cols-1 max-md:gap-4 max-md:px-4">
        {/* ── In-page nav ── */}
        <nav aria-label="Settings sections" className="sticky top-4 self-start max-md:static">
          <ul className="flex flex-col gap-0.5 max-md:scroll-x max-md:-mx-4 max-md:flex-row max-md:gap-2 max-md:px-4">
            {SECTIONS.map((s) => {
              const on = s.id === active
              return (
                <li key={s.id} className="max-md:shrink-0">
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={on ? 'true' : undefined}
                    className={`flex h-10 w-full items-center gap-2.5 rounded-[var(--r-control)] px-3 text-[14px] font-semibold max-md:h-9 max-md:rounded-full max-md:px-3.5 max-md:text-[13px] ${on ? 'bg-ink text-on-ink' : 'text-text hover:bg-[var(--surface-high)] max-md:ring-1 max-md:ring-inset max-md:ring-[var(--rule-strong)]'}`}
                  >
                    <s.icon size={16} strokeWidth={2.2} aria-hidden className="max-md:hidden" />
                    {s.label}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-6 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4 max-md:hidden">
            <p className="label text-text-2">Phase</p>
            <p className="mt-1 text-[14px] font-bold">Free until the circle is habitual</p>
            <p className="mt-1 text-[12px] font-medium text-text-2">Charges come later, on advice, once enough users are registered and coming back.</p>
          </div>
        </nav>

        {/* ── Content ── */}
        <div className="flex min-w-0 flex-col gap-10 pb-28">
          {/* REGIONS */}
          <Section id="regions" refs={refs} title="Regions" sub="Where Edera is live. Each region carries its own currency, cities and payment rail for the later phase." action={<Button size="sm" variant="outline" icon={Plus} onClick={() => toast('Ghana, Kenya, India and the US diaspora are on the watchlist · see Reports', 'neutral')}>Add region</Button>}>
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
              {REGIONS.map((r) => {
                const live = regionLive[r.id]
                const k = r.id === 'uk' ? KPI.uk : KPI.ng
                return (
                  <div key={r.id} className={`relative overflow-hidden rounded-[var(--r-container)] p-5 ${live ? 'bg-ink text-on-ink' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}>
                    {live && <span aria-hidden className="arc" style={{ width: '58%', right: '-18%', bottom: '-70%' }} />}
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`label ${live ? 'text-on-ink-2' : 'text-text-2'}`}>{r.currency}</p>
                          <h3 className="grot mt-1 text-[26px]">{r.name}</h3>
                        </div>
                        <Toggle on={live} label={`${r.name} live`} tone={live ? 'accent' : 'ink'} onChange={(v) => { setRegionLive((s) => ({ ...s, [r.id]: v })); touch(); toast(v ? `${r.name} is live` : `${r.name} paused · new sign-ups wait-listed`, v ? 'accent' : 'warn') }} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                          { l: 'Users', v: k.users },
                          { l: 'Vendors', v: k.vendors },
                          { l: 'Events', v: k.events },
                        ].map((x) => (
                          <div key={x.l}>
                            <p className={`label ${live ? 'text-on-ink-2' : 'text-text-2'}`}>{x.l}</p>
                            <Figure value={x.v.toLocaleString('en-GB')} size={26} tone={live ? 'var(--on-ink)' : undefined} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {r.cities.map((c) => (
                          <button key={c} type="button" onClick={() => toast(`${c}: ${CITY_COUNTS[c]?.toLocaleString('en-GB') ?? '–'} users`, 'neutral')} className={`h-7 rounded-full px-2.5 text-[12px] font-bold ${live ? 'bg-[rgb(255_255_255/0.14)] text-on-ink' : 'bg-[var(--surface-high)] text-text'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <div className={`mt-4 flex items-center gap-2 border-t pt-3 text-[12px] font-semibold ${live ? 'border-[rgb(255_255_255/0.14)] text-on-ink-2' : 'border-[var(--rule)] text-text-2'}`}>
                        <Banknote size={14} aria-hidden />
                        Payments · {r.payments}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* LANGUAGES */}
          <Section id="languages" refs={refs} title="Languages" sub="People should relate to Edera in their own language. Coverage is the share of app strings translated." action={<Button size="sm" variant="outline" icon={Plus} onClick={() => toast('Request sent to the translation team · Twi and Swahili are next in the queue', 'neutral')}>Add language</Button>}>
            <div className="overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
              <table className="w-full border-collapse text-[13px] max-md:hidden">
                <thead>
                  <tr className="label text-text-2">
                    <th className="px-5 pb-2 pt-4 text-left font-extrabold">Language</th>
                    <th className="pb-2 pt-4 text-left font-extrabold">Native name</th>
                    <th className="pb-2 pt-4 text-left font-extrabold">Coverage</th>
                    <th className="pb-2 pt-4 text-left font-extrabold">Status</th>
                    <th className="px-5 pb-2 pt-4 text-right font-extrabold">Offered</th>
                  </tr>
                </thead>
                <tbody>
                  {LANGUAGES.map((l) => {
                    const on = languagesOn[l.code] ?? l.on
                    return (
                      <tr key={l.code} className="border-t border-[var(--rule)]">
                        <td className="px-5 py-2.5 font-bold">
                          {l.name} <span className="meta ml-1 text-text-2">{l.code}</span>
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-text-2">{l.native}</td>
                        <td className="w-[220px] py-2.5 pr-3">
                          <span className="flex items-center gap-2">
                            <Bar value={l.coverage} height={5} tone={l.coverage === 100 ? 'accent' : 'brass'} className="flex-1" />
                            <span className="num w-10 text-right text-[12px] font-bold">{l.coverage}%</span>
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">{l.coverage === 100 ? <Badge tone="accent">Complete</Badge> : l.coverage >= 80 ? <Badge tone="warn">Falls back to English</Badge> : <Badge tone="neutral">In translation</Badge>}</td>
                        <td className="px-5 py-2.5 text-right">
                          <span className="inline-flex justify-end">
                            <Toggle on={on} label={`Offer ${l.name}`} onChange={(v) => { session.toggleLanguage(l.code, v); touch(); toast(v ? `${l.name} is offered in the language picker` : `${l.name} hidden from the language picker`, v ? 'accent' : 'warn') }} />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <ul className="md:hidden">
                {LANGUAGES.map((l) => {
                  const on = languagesOn[l.code] ?? l.on
                  return (
                    <li key={l.code} className="flex items-center gap-3 border-t border-[var(--rule)] px-4 py-3 first:border-t-0">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold">
                          {l.name} <span className="font-semibold text-text-2">· {l.native}</span>
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <Bar value={l.coverage} height={4} tone={l.coverage === 100 ? 'accent' : 'brass'} className="flex-1" />
                          <span className="num text-[12px] font-bold">{l.coverage}%</span>
                        </span>
                      </span>
                      <Toggle on={on} label={`Offer ${l.name}`} onChange={(v) => { session.toggleLanguage(l.code, v); touch(); toast(v ? `${l.name} offered` : `${l.name} hidden`, v ? 'accent' : 'warn') }} />
                    </li>
                  )
                })}
              </ul>
            </div>
          </Section>

          {/* MONEY */}
          <Section id="money" refs={refs} title="Money" sub="Nothing is charged in this phase. The switch exists so the later phase is a decision, not a rebuild.">
            <div className="relative overflow-hidden rounded-[var(--r-container)] bg-brass-soft p-6 text-on-brass-soft">
              <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 max-md:grid-cols-1">
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <span className="origin-top-left scale-[1.25]">
                      <Toggle on={commissionOn} label="Charge a commission on bookings" tone="ink" onChange={flipCommission} />
                    </span>
                    <div className="min-w-0 pl-3">
                      <p className="label text-brass-ink">Commission switch · {commissionOn ? 'preview on' : 'off'}</p>
                      <h3 className="grot mt-1 text-[26px]">Charge a commission on bookings</h3>
                    </div>
                  </div>
                  <p className="mt-4 max-w-[52ch] text-[14px] font-medium leading-relaxed">
                    <span className="font-extrabold">Off in this phase:</span> Edera stays free while the community grows. When it turns on, a percentage is taken per confirmed booking. Payments are a later phase.
                  </p>
                  <div className={`mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1 ${commissionOn ? '' : 'text-text-2'}`}>
                    <Input label="Commission rate" value={rate} onChange={(e) => { setRate(e.target.value.replace(/[^\d.]/g, '')); touch() }} inputMode="decimal" trailing={<span className="text-[13px] font-bold">%</span>} hint={commissionOn ? 'Per confirmed booking' : 'Stored, not applied'} dense />
                    <Input label="Free until" type="date" value={freeUntil} onChange={(e) => { setFreeUntil(e.target.value); touch() }} hint={`${fmtDay(freeUntil, true)} · reviewed with Dave`} dense />
                  </div>
                </div>
                <div className={`flex flex-col justify-between rounded-[var(--r-card)] p-5 ${commissionOn ? 'bg-ink text-on-ink' : 'bg-[var(--surface)] text-text'}`}>
                  <p className={`label ${commissionOn ? 'text-on-ink-2' : 'text-text-2'}`}>Preview on last month</p>
                  <div className="mt-2">
                    <Figure value={money(preview)} size={40} tone={commissionOn ? 'var(--on-ink)' : undefined} />
                  </div>
                  <p className={`mt-2 text-[13px] font-medium leading-snug ${commissionOn ? 'text-on-ink-2' : 'text-text-2'}`}>
                    On last month’s <span className={`num font-bold ${commissionOn ? 'text-on-ink' : 'text-text'}`}>{money(KPI.gbv30d)}</span> confirmed value a <span className={`num font-bold ${commissionOn ? 'text-on-ink' : 'text-text'}`}>{rateNum}%</span> commission would be <span className={`num font-bold ${commissionOn ? 'text-on-ink' : 'text-text'}`}>{money(preview)}</span>.
                  </p>
                  <span className={`mt-3 inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] ${commissionOn ? 'bg-brass text-on-brass' : 'bg-[var(--surface-high)] text-text'}`}>{commissionOn ? 'Preview only · not charged' : 'Not charged · free phase'}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 max-md:grid-cols-1">
              {[
                { name: 'Stripe', region: 'United Kingdom', note: 'Cards, Apple Pay, Google Pay · GBP payouts' },
                { name: 'Paystack', region: 'Nigeria', note: 'Cards, bank transfer, USSD · NGN payouts' },
                { name: 'Flutterwave', region: 'Nigeria · fallback', note: 'Cards and mobile money across West Africa' },
              ].map((p) => (
                <button key={p.name} type="button" onClick={() => toast(`${p.name} is wired in the later phase · ${p.region}`, 'neutral')} className="flex items-start gap-3 rounded-[var(--r-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-raised)]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--surface-high)]">
                    <Banknote size={16} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[14px] font-bold">
                      {p.name} <Badge tone="neutral">Later phase</Badge>
                    </span>
                    <span className="block text-[12px] font-semibold text-text-2">{p.region}</span>
                    <span className="mt-1 block text-[12px] font-medium text-text-2">{p.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* VERIFICATION */}
          <Section id="verification" refs={refs} title="Verification" sub="What a planner, vendor or venue must upload before the Verified Professional badge. Tap a cell to change it.">
            <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-5 max-md:grid-cols-1">
              <div className="overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="label text-text-2">
                      <th className="px-5 pb-2 pt-4 text-left font-extrabold">Document</th>
                      {ROLES.map((r) => (
                        <th key={r} className="w-[88px] pb-2 pt-4 text-center font-extrabold max-md:w-[64px]">
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={row.doc} className="border-t border-[var(--rule)]">
                        <td className="px-5 py-2.5">
                          <span className="block font-bold">{row.doc}</span>
                          <span className="block text-[12px] font-semibold text-text-2 max-md:hidden">{row.hint}</span>
                        </td>
                        {ROLES.map((r) => (
                          <td key={r} className="py-2.5 text-center">
                            <motion.button type="button" whileTap={tap} aria-label={`${row.doc} ${row.req[r] ? 'required' : 'not required'} for ${r}`} aria-pressed={row.req[r]} onClick={() => toggleDoc(i, r)} className="inline-grid h-11 w-11 place-items-center rounded-[var(--r-control)] hover:bg-[var(--surface-high)]">
                              <CheckMark on={row.req[r]} />
                            </motion.button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-[var(--r-card)] bg-ink p-5 text-on-ink">
                  <p className="label text-on-ink-2">Review SLA</p>
                  <div className="mt-1 flex items-end gap-2">
                    <Figure value={sla} unit="working days" size={44} tone="var(--on-ink)" />
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    {['1', '2', '3'].map((d) => (
                      <button key={d} type="button" onClick={() => { setSla(d); touch() }} className={`h-8 flex-1 rounded-full text-[12px] font-bold ${sla === d ? 'bg-brass text-on-brass' : 'bg-[rgb(255_255_255/0.12)] text-on-ink'}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] font-medium text-on-ink-2">Average this month: 1.4 days · {KPI.pendingVerification} cases waiting now</p>
                </div>
                <div className="rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
                  <p className="label text-text-2">Required documents</p>
                  <ul className="mt-2 flex flex-col gap-1 text-[13px] font-semibold">
                    {ROLES.map((r) => (
                      <li key={r} className="flex justify-between">
                        <span>{r}</span>
                        <span className="num text-text-2">{matrix.filter((m) => m.req[r]).length} of {matrix.length}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          {/* CATEGORIES */}
          <Section id="categories" refs={refs} title="Categories" sub="The people you find on Edera are the people you need in this industry. Categories keep the marketplace to that.">
            <div className="rounded-[var(--r-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raised)]">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.id} type="button" onClick={() => toast(`${c.plural}: ${c.count} listings`, 'neutral')} className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--surface-high)] pl-1.5 pr-3 text-[13px] font-bold">
                    <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-[var(--surface)] px-1.5 text-[11px] font-extrabold text-text-2">{c.count}</span>
                    {c.plural}
                  </button>
                ))}
                {categoriesAdded.map((name) => (
                  <span key={name} className="inline-flex h-9 items-center gap-2 rounded-full bg-accent pl-1.5 pr-3 text-[13px] font-bold text-on-accent">
                    <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-[rgb(255_255_255/0.2)] px-1.5 text-[11px] font-extrabold">0</span>
                    {name}
                    <Badge tone="neutral" className="-mr-1.5">
                      New
                    </Badge>
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-end gap-3 border-t border-[var(--rule)] pt-5 max-md:flex-col max-md:items-stretch">
                <div className="min-w-0 flex-1">
                  <Input label="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} dense hint="Appears in Explore and on vendor listings once saved" />
                </div>
                <Button variant="ink" icon={Plus} onClick={addCategory} className="mb-[26px] max-md:mb-0">
                  Add
                </Button>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Sticky save bar ── */}
      <div className="glass sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-[var(--rule)] px-8 py-3 max-md:px-4">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-text-2">
          <span className={`h-2 w-2 rounded-full ${dirty ? 'bg-brass' : 'bg-free'}`} />
          {dirty ? 'Unsaved changes' : 'All changes saved'} · commission {commissionOn ? 'preview on' : 'off'} · {LANGUAGES.filter((l) => languagesOn[l.code] ?? l.on).length} languages offered
        </span>
        <Button icon={Save} onClick={save}>
          Save changes
        </Button>
      </div>
    </ConsoleShell>
  )
}

function Section({ id, refs, title, sub, action, children }: { id: SectionId; refs: MutableRefObject<Record<SectionId, HTMLElement | null>>; title: string; sub: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section
      data-section={id}
      ref={(el) => {
        refs.current[id] = el
      }}
      className="scroll-mt-4"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-[60ch]">
          <h2 className="grot text-[26px]">{title}</h2>
          <p className="mt-1 text-[13px] font-medium text-text-2">{sub}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
