import { motion } from 'framer-motion'
import { AlertTriangle, BadgeCheck, Check, ChevronRight, Clock, FileText, Search, ShieldCheck, Upload, Users } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { Stars, Verified } from '../../components/Brand'
import { Button, Pressable } from '../../components/Button'
import { ProgressRing } from '../../components/Charts'
import { Input } from '../../components/Form'
import { BottomSheet } from '../../components/Sheet'
import { daysUntil, fmtDay } from '../../data/clock'
import { DEMO_VENDOR_VERIFICATION } from '../../data/demoFill'
import { img } from '../../data/media'
import { vendorById } from '../../data/vendors'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { Dock, MobileScreen, SectionHead, TopBar } from '../mobileShell'

/* vendor.verification: Bola is already a Verified Professional. Three of
   four documents are current; the food hygiene certificate is the one
   expiring, so the screen's job is the renewal, not the first application. */

type DocState = 'ok' | 'expiring' | 'review'
type Doc = { id: string; title: string; sub: string; state: DocState; valid: string; file: string; fields: { label: string; value: string }[] }

const HYGIENE_EXPIRES = '2027-03-14'
const DOCS: Doc[] = [
  {
    id: 'id',
    title: 'Identity',
    sub: `${DEMO_VENDOR_VERIFICATION.idType} · matches account name`,
    state: 'ok',
    valid: 'Verified 12 Jul 2026',
    file: 'driving-licence-front.jpg · 2.1 MB',
    fields: [
      { label: 'Document type', value: DEMO_VENDOR_VERIFICATION.idType },
      { label: 'Name on document', value: 'Bola Adunni Fashola' },
      { label: 'Expiry', value: '03 Aug 2031' },
    ],
  },
  {
    id: 'company',
    title: 'Companies House',
    sub: `${DEMO_VENDOR_VERIFICATION.reg} · ${DEMO_VENDOR_VERIFICATION.business}`,
    state: 'ok',
    valid: 'Active · incorporated 2015',
    file: 'certificate-of-incorporation.pdf · 640 KB',
    fields: [
      { label: 'Registered business', value: DEMO_VENDOR_VERIFICATION.business },
      { label: 'Company number', value: DEMO_VENDOR_VERIFICATION.reg },
      { label: 'Registered office', value: '14 Rye Lane, Peckham, London SE15' },
    ],
  },
  {
    id: 'insurance',
    title: 'Public liability insurance',
    sub: '£5m · Hiscox',
    state: 'ok',
    valid: 'Valid to 30 Jun 2027',
    file: 'hiscox-pl-schedule-2026.pdf · 1.4 MB',
    fields: [
      { label: 'Policy', value: DEMO_VENDOR_VERIFICATION.insurance },
      { label: 'Policy number', value: 'HX-PL-4471920' },
      { label: 'Valid to', value: '30 Jun 2027' },
    ],
  },
  {
    id: 'hygiene',
    title: 'Food hygiene rating',
    sub: 'FHRS 5 · Southwark Council',
    state: 'expiring',
    valid: `Expires ${fmtDay(HYGIENE_EXPIRES, true)}`,
    file: 'fhrs-certificate-2026.pdf · 1.2 MB',
    fields: [
      { label: 'Rating and authority', value: DEMO_VENDOR_VERIFICATION.hygiene },
      { label: 'Premises', value: 'Olá Event Hall kitchen, Peckham' },
      { label: 'Next inspection due', value: fmtDay(HYGIENE_EXPIRES, true) },
    ],
  },
]

const STATE_UI: Record<DocState, { icon: typeof Check; bg: string; fg: string; label: string; tone: 'success' | 'warn' | 'info' }> = {
  ok: { icon: Check, bg: 'var(--accent)', fg: 'var(--on-accent)', label: 'Current', tone: 'success' },
  expiring: { icon: AlertTriangle, bg: 'var(--brass)', fg: 'var(--on-brass)', label: 'Expiring', tone: 'warn' },
  review: { icon: Clock, bg: 'var(--info)', fg: '#ffffff', label: 'Under review', tone: 'info' },
}

const WHAT = [
  { icon: Search, title: 'Badge in search results', body: 'The check sits on your card in Explore and on both listings.' },
  { icon: Users, title: 'Higher reply rate', body: 'Verified vendors get replies to 7 in 10 quotes in the demo data.' },
  { icon: ShieldCheck, title: 'Trusted by planners', body: 'Planners filter their shortlist to Verified only.' },
]

export default function VendorVerification() {
  const { navigate, toast } = useNav()
  const current = useSession((s) => s.vendorVerificationStep)
  const [states, setStates] = useState<Record<string, DocState>>(Object.fromEntries(DOCS.map((d) => [d.id, d.state])))
  const [open, setOpen] = useState<Doc | null>(null)
  const [fields, setFields] = useState<string[]>([])

  const underReview = Object.values(states).filter((s) => s === 'review').length
  const expiring = Object.values(states).filter((s) => s === 'expiring').length
  const days = daysUntil(HYGIENE_EXPIRES)

  const openDoc = (d: Doc) => {
    setFields(d.fields.map((f) => f.value))
    setOpen(d)
  }
  const upload = () => {
    if (!open) return
    setStates((s) => ({ ...s, [open.id]: 'review' }))
    track('verification_upload', open.id)
    setOpen(null)
    toast('Received · reviewed within 2 working days', 'accent')
  }
  const submit = () => {
    track('verification_submit', underReview)
    if (underReview) {
      session.setVendorVerificationStep(current)
      toast(`Update submitted · ${underReview} document${underReview === 1 ? '' : 's'} under review`, 'accent')
    } else toast('Nothing new to submit · your badge is current', 'neutral')
  }

  const ola = vendorById('ola-hall')
  const iya = vendorById('iyabola')

  return (
    <MobileScreen
      header={<TopBar title="Verification" sub="Verified Professional" />}
      dock={
        <Dock>
          <Button block size="lg" icon={Upload} onClick={submit}>
            Submit update
          </Button>
        </Dock>
      }
    >
      {/* Badge state: ink block with the arc */}
      <section className="relative mx-4 mt-1 overflow-hidden rounded-[var(--r-container)] bg-ink p-5 text-on-ink">
        <span aria-hidden className="arc" style={{ width: '74%', right: '-36%', bottom: '-82%' }} />
        <span aria-hidden className="grain" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brass px-2.5 py-1 text-[12px] font-extrabold text-on-brass">
              <BadgeCheck size={14} strokeWidth={2.6} aria-hidden /> Verified
            </span>
            <h1 className="grot mt-3 text-[30px]">
              Verified <em>Professional</em>
            </h1>
            <p className="mt-1.5 text-[13px] font-semibold text-on-ink-2">Badge live on 2 listings since 12 Jul 2026</p>
          </div>
          <ProgressRing value={(current / DOCS.length) * 100} size={64} stroke={6} color="var(--brass)">
            <span className="num text-[14px] font-extrabold">
              {current}/{DOCS.length}
            </span>
          </ProgressRing>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 pr-14 text-[13px] font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--free)]" aria-hidden /> {current} of {DOCS.length} documents current
          </span>
          {underReview > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--info)]" aria-hidden /> {underReview} under review
            </span>
          )}
          {expiring > 0 && (
            <span className="inline-flex items-center gap-1.5 text-brass-light">
              <span className="h-2 w-2 rounded-full bg-brass" aria-hidden /> hygiene certificate expires in {days} days
            </span>
          )}
        </div>
      </section>

      {/* Document spine */}
      <SectionHead className="mt-7" eyebrow="Documents" title="Four checks, one badge" />
      <ol className="relative mt-3 px-5">
        <span aria-hidden className="pointer-events-none absolute bottom-7 left-[39px] top-7 w-[2px] bg-[var(--rule-strong)]" />
        {DOCS.map((d) => {
          const st = states[d.id]
          const ui = STATE_UI[st]
          const Icon = ui.icon
          return (
            <li key={d.id} className="relative">
              <Pressable onClick={() => openDoc(d)} className="flex items-start gap-3 py-3">
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-4 ring-[var(--bg)]" style={{ background: ui.bg, color: ui.fg }}>
                  <Icon size={18} strokeWidth={2.6} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 rounded-[var(--r-card)] bg-[var(--surface)] p-3.5 shadow-[var(--shadow-raised)]">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-bold">{d.title}</span>
                      <span className="mt-0.5 block truncate text-[12px] font-semibold text-text-2">{d.sub}</span>
                    </span>
                    <Badge tone={ui.tone}>{ui.label}</Badge>
                  </span>
                  <span className="mt-2.5 flex items-center justify-between">
                    <span className={`meta ${st === 'expiring' ? 'text-brass-ink' : 'text-text-2'}`}>{st === 'review' ? 'Renewed certificate received · reviewing' : d.valid}</span>
                    <ChevronRight size={16} className="text-text-2" aria-hidden />
                  </span>
                </span>
              </Pressable>
            </li>
          )
        })}
      </ol>

      {/* How clients see it: both listings carry the badge */}
      <div className="mt-6 px-5">
        <p className="label text-text-2">How clients see it</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[iya, ola].map((v) => (
            <div key={v.id} className="overflow-hidden rounded-[var(--r-card)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
              <div className="relative h-[72px] bg-[var(--surface-high)]">
                <img src={img(v.photos[0], 400)} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-[var(--surface)] px-1.5 py-0.5">
                  <Verified size={13} />
                </span>
              </div>
              <div className="p-2.5">
                <p className="truncate text-[13px] font-bold">{v.name}</p>
                <Stars rating={v.rating} count={v.reviews} size={11} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What verification does */}
      <SectionHead className="mt-8" title="What verification does" />
      <ul className="mt-2 px-5">
        {WHAT.map((w, i) => (
          <motion.li key={w.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i, duration: 0.32 }} className="flex items-start gap-3 py-3 rule-b last:shadow-none">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-on-accent-soft">
              <w.icon size={18} strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-[15px] font-bold">{w.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-text-2">{w.body}</p>
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="mt-5 flex gap-2 px-5">
        <Button variant="outline" block onClick={() => navigate('vendor.listings')}>
          View my listings
        </Button>
        <Button variant="ghost" block onClick={() => navigate('vendor.profile')}>
          Account
        </Button>
      </div>
      <p className="meta mt-4 px-5 text-text-2">Edera checks documents against Companies House and the FSA register. Reviews take up to 2 working days.</p>

      {/* Document sheet */}
      <BottomSheet open={open !== null} onClose={() => setOpen(null)} title={open?.title} tall>
        {open && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex items-center gap-2">
              <Badge tone={STATE_UI[states[open.id]].tone}>{STATE_UI[states[open.id]].label}</Badge>
              <span className="meta text-text-2">{open.valid}</span>
            </div>
            {open.fields.map((f, i) => (
              <Input key={f.label} label={f.label} value={fields[i] ?? f.value} onChange={(e) => setFields((fs) => fs.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
            <div className="flex items-center gap-3 rounded-[var(--r-card)] border-2 border-dashed border-[var(--rule-strong)] p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--surface-high)] text-text-2">
                <FileText size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{open.file}</p>
                <p className="text-[12px] text-text-2">{states[open.id] === 'review' ? 'New file received · reviewing' : 'On file · tap below to replace'}</p>
              </div>
            </div>
            <Button block size="lg" icon={Upload} onClick={upload}>
              {open.state === 'expiring' ? 'Upload renewed certificate' : 'Upload a newer document'}
            </Button>
            <p className="text-center text-[12px] text-text-2">PDF or photo · reviewed within 2 working days</p>
          </div>
        )}
      </BottomSheet>
    </MobileScreen>
  )
}
