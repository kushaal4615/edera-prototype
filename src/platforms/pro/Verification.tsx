import { motion } from 'framer-motion'
import { BadgeCheck, Check, ChevronRight, Eye, FileCheck, IdCard, Images, Landmark, RefreshCw, Search, ShieldCheck, Upload } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar, Stars, Verified } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { Input } from '../../components/Form'
import { BottomSheet } from '../../components/Sheet'
import { DEMO_PRO_VERIFICATION } from '../../data/demoFill'
import { PLANNER } from '../../data/people'
import { useNav } from '../../lib/navigation'
import { track } from '../../lib/tracker'
import { spring } from '../../motion/springs'
import { listItem, listParent } from '../../motion/transitions'
import { Dock, MobileScreen, SectionHead, TopBar } from '../mobileShell'

/* pro.verification: Tunde is already a Verified Professional. The screen
   shows what the badge is worth, the four checks that earned it, the
   documents behind it (one insurance document expiring), and the way to
   update them. Composition: ink hero with the brass arc → stepper
   timeline → unlock list with a comparison bar → borderless document
   rows → "what clients see" preview. */

type DocId = 'id' | 'business' | 'insurance' | 'portfolio'
type Doc = { id: DocId; title: string; meta: string; icon: typeof IdCard; state: 'ok' | 'expiring'; checked: string }

const DOCS: Doc[] = [
  { id: 'id', title: 'UK passport', meta: `${PLANNER.name} · identity matched`, icon: IdCard, state: 'ok', checked: 'Checked 16 Nov 2026' },
  { id: 'business', title: 'Companies House', meta: `${DEMO_PRO_VERIFICATION.business} · No. ${DEMO_PRO_VERIFICATION.reg}`, icon: Landmark, state: 'ok', checked: 'Active · incorporated 2017' },
  { id: 'insurance', title: 'Public liability insurance', meta: '£5m cover · Hiscox', icon: ShieldCheck, state: 'expiring', checked: 'Expires Mar 2027' },
  { id: 'portfolio', title: 'Portfolio', meta: '24 events · 3 client references', icon: Images, state: 'ok', checked: `${DEMO_PRO_VERIFICATION.portfolio}` },
]

const STEPS = ['Identity', 'Business', 'Insurance', 'Portfolio']

export default function ProVerification() {
  const { navigate, toast } = useNav()
  const [open, setOpen] = useState<Doc | null>(null)
  const [form, setForm] = useState({ ...DEMO_PRO_VERIFICATION, insurer: 'Hiscox · Public liability · £5m', expiry: '2027-03-31', events: '24' })

  const renew = () => {
    track('renew_insurance')
    toast('Upload received, reviewed within 2 working days', 'accent')
    setOpen(null)
  }

  return (
    <MobileScreen
      header={<TopBar title="Verification" sub="Verified Professional · Bakare Events" />}
      dock={
        <Dock>
          <Button variant="ghost" icon={Eye} onClick={() => navigate('pro.profile')}>
            Public profile
          </Button>
          <Button variant="accent" block icon={Upload} onClick={() => { track('submit_verification_update'); toast('Update submitted · reviewed within 2 working days', 'accent') }}>
            Submit update
          </Button>
        </Dock>
      }
      overlay={
        <BottomSheet open={!!open} onClose={() => setOpen(null)} title={open?.title}>
          {open && (
            <div className="grid gap-3 pb-2">
              <div className="flex items-center gap-3 rounded-[var(--r-card)] bg-[var(--surface-high)] p-3">
                <span className={`grid h-10 w-10 place-items-center rounded-[12px] ${open.state === 'ok' ? 'bg-accent text-on-accent' : 'bg-brass text-on-brass'}`}><open.icon size={20} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{open.state === 'ok' ? 'Verified by Edera' : 'Verified · renewal due'}</p>
                  <p className="text-[12px] text-text-2">{open.checked}</p>
                </div>
                <Badge tone={open.state === 'ok' ? 'success' : 'warn'}>{open.state === 'ok' ? 'Valid' : 'Expiring'}</Badge>
              </div>
              {open.id === 'id' && (
                <>
                  <Input label="Document type" value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })} />
                  <Input label="Name on document" value={PLANNER.name} readOnly hint="Must match the name on your profile" />
                </>
              )}
              {open.id === 'business' && (
                <>
                  <Input label="Registered business" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Company number" value={form.reg} onChange={(e) => setForm({ ...form, reg: e.target.value })} inputMode="numeric" />
                    <Input label="Years in operation" value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} inputMode="numeric" hint="Shown on your profile" />
                  </div>
                </>
              )}
              {open.id === 'insurance' && (
                <>
                  <Input label="Policy" value={form.insurer} onChange={(e) => setForm({ ...form, insurer: e.target.value })} />
                  <Input label="Expiry date" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} hint="Upload the renewed certificate once your insurer sends it" />
                </>
              )}
              {open.id === 'portfolio' && (
                <>
                  <Input label="Portfolio link" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />
                  <Input label="Events in portfolio" value={form.events} onChange={(e) => setForm({ ...form, events: e.target.value })} inputMode="numeric" />
                </>
              )}
              {open.id === 'insurance' ? (
                <Button variant="accent" size="lg" block icon={RefreshCw} onClick={renew}>
                  Renew insurance document
                </Button>
              ) : (
                <Button variant="accent" size="lg" block icon={Check} onClick={() => { track('save_verification_doc', open.id); toast('Saved · no re-review needed for this change', 'accent'); setOpen(null) }}>
                  Save
                </Button>
              )}
            </div>
          )}
        </BottomSheet>
      }
    >
      {/* Hero */}
      <section className="relative mx-4 mt-2 overflow-hidden rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
        <span className="arc" aria-hidden style={{ width: '64%', right: '-24%', bottom: '-64%', opacity: 0.8 }} />
        <div className="grain" aria-hidden />
        <div className="relative flex items-start gap-4">
          <motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.pop} className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brass text-on-brass shadow-[var(--glow-brass)]">
            <BadgeCheck size={30} strokeWidth={2.4} aria-hidden />
          </motion.span>
          <div className="min-w-0">
            <p className="label text-brass-light">Verified Professional</p>
            <h1 className="grot mt-1 text-[30px]">Verified until <span className="italic font-normal text-brass-light">Nov 2027</span></h1>
            <p className="mt-1.5 text-[13px] text-on-ink-2">Renewed 16 Nov 2026 · renews automatically while your documents stay valid.</p>
          </div>
        </div>
        <div className="relative mt-5">
          <div className="flex items-center justify-between text-[12px] font-bold text-on-ink-2">
            <span>12 months of cover left</span>
            <span className="num">Nov 2026 → Nov 2027</span>
          </div>
          <Bar value={4} tone="brass" height={6} className="mt-1.5" track="rgb(255 255 255 / 0.14)" />
        </div>
      </section>

      {/* Stepper */}
      <section className="mt-6 px-5">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 0.08 * i }} className="grid h-8 w-8 place-items-center rounded-full bg-accent text-on-accent">
                  <Check size={16} strokeWidth={3} aria-hidden />
                </motion.span>
                <span className="mt-1.5 whitespace-nowrap text-[11px] font-bold">{s}</span>
              </div>
              {i < STEPS.length - 1 && <span aria-hidden className="mx-1.5 mb-5 h-[3px] flex-1 rounded-full bg-accent" />}
            </div>
          ))}
        </div>
        <p className="meta mt-2 text-center text-text-2">4 of 4 passed · reviewed by Edera staff</p>
      </section>

      {/* What it unlocks */}
      <SectionHead className="mt-7" eyebrow="What the badge does" title={<>Why clients pick <em>verified</em></>} />
      <ul className="mt-3 px-5">
        <li className="flex items-center gap-3 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-on-accent-soft"><Search size={18} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">You appear in search</p>
            <p className="text-[13px] text-text-2">Only verified professionals are listed when a client searches Edera.</p>
          </div>
        </li>
        <li className="flex items-center gap-3 py-3" style={{ boxShadow: 'inset 0 1px 0 var(--rule)' }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-on-accent-soft"><BadgeCheck size={18} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">The Verified label on your profile</p>
            <p className="text-[13px] text-text-2">Next to your name on every card, request and message.</p>
          </div>
          <Verified size={16} />
        </li>
        <li className="py-3" style={{ boxShadow: 'inset 0 1px 0 var(--rule)' }}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-on-accent-soft"><FileCheck size={18} aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">Higher reply rate from clients</p>
              <p className="text-[13px] text-text-2">Requests sent to verified planners get an answer more often.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 pl-[52px]">
            <Bar value={71} tone="accent" height={10} />
            <span className="num w-[108px] text-[12px] font-bold text-text"><span className="figure text-[18px]">71%</span> verified</span>
            <Bar value={44} tone="ink" height={10} />
            <span className="num w-[108px] text-[12px] font-bold text-text-2"><span className="figure text-[18px]">44%</span> unverified</span>
          </div>
          <p className="meta mt-2 pl-[52px] text-text-2">Demo figures across the marketplace, last 90 days</p>
        </li>
      </ul>

      {/* Documents */}
      <SectionHead className="mt-6" eyebrow="Documents" title="Behind the badge" action="Add document" onAction={() => toast('Pick a file to upload · reviewed within 2 working days')} />
      <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-2">
        {DOCS.map((d, i) => (
          <motion.li key={d.id} variants={listItem} style={i > 0 ? { boxShadow: 'inset 0 1px 0 var(--rule)' } : undefined}>
            <Pressable onClick={() => setOpen(d)} className="flex items-center gap-3 px-5 py-3.5">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] ${d.state === 'ok' ? 'bg-[var(--surface-high)] text-text' : 'bg-brass-soft text-on-brass-soft'}`}><d.icon size={20} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[15px] font-bold">
                  {d.title}
                  {d.state === 'ok' && <Check size={14} strokeWidth={3} className="text-accent-ink" aria-hidden />}
                </span>
                <span className="block truncate text-[13px] text-text-2">{d.meta}</span>
                <span className={`meta mt-0.5 block ${d.state === 'expiring' ? 'text-brass-ink' : 'text-text-2'}`}>{d.checked}</span>
              </span>
              <Badge tone={d.state === 'ok' ? 'success' : 'warn'}>{d.state === 'ok' ? 'Valid' : 'Expiring'}</Badge>
              <ChevronRight size={18} className="shrink-0 text-text-2" aria-hidden />
            </Pressable>
            {d.state === 'expiring' && (
              <div className="pb-3 pl-[76px] pr-5">
                <Button size="sm" variant="outline" icon={RefreshCw} onClick={renew}>
                  Renew insurance document
                </Button>
              </div>
            )}
          </motion.li>
        ))}
      </motion.ul>

      {/* What clients see */}
      <SectionHead className="mt-6" eyebrow="Preview" title="What clients see" />
      <Pressable onClick={() => navigate('pro.profile')} className="mx-4 mt-3 flex items-center gap-3 rounded-[var(--r-container)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)]">
        <Avatar who="tunde" size={56} ring verified />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[16px] font-bold">{PLANNER.name} <Verified size={15} label={false} /></span>
          <span className="block text-[13px] text-text-2">{PLANNER.business} · London & Lagos</span>
          <span className="mt-1 flex items-center gap-2">
            <Stars rating={PLANNER.rating} count={PLANNER.reviews} />
            <span className="text-[12px] font-semibold text-text-2">· {PLANNER.years} yrs · {PLANNER.eventsDone} events</span>
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-text-2" aria-hidden />
      </Pressable>
      <p className="meta mx-5 mt-3 text-text-2">Vendors and venues go through the same checks before they can publish a listing.</p>
    </MobileScreen>
  )
}
