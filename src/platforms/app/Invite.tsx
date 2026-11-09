import { motion } from 'framer-motion'
import { Check, Copy, Link2, Mail, MessageCircle, Send, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Bar, Mark, QrCode, Stub } from '../../components/Brand'
import { Button, IconButton } from '../../components/Button'
import { Confetti } from '../../components/Confetti'
import { HeroImage, Rail } from '../../components/Media'
import { fmtDay } from '../../data/clock'
import { RUBY, RUBY_TOTALS } from '../../data/events'
import { CLIENT } from '../../data/people'
import { useNav } from '../../lib/navigation'
import { session, useSession } from '../../lib/store'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, SAFE_TOP, TopBar } from '../mobileShell'

/* app.invite: the QR invite. A photo hero runs behind the status bar; the
   ticket stub overlaps it. Sending the last 45 invites is the big moment. */

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, sent: 98, toast: 'Opening WhatsApp with the invite attached' },
  { id: 'email', label: 'Email', icon: Mail, sent: 37, toast: 'Email draft ready with the QR invite' },
  { id: 'link', label: 'Copy link', icon: Link2, sent: 0, toast: 'Invite link copied · edera.app/i/EDR-RUBY' },
] as const

export default function AppInvite() {
  const { back, canGoBack, reset, toast } = useNav()
  const invitesSent = useSession((s) => s.invitesSent)
  const [burst, setBurst] = useState(false)
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]['id']>('whatsapp')
  const sent = invitesSent ? RUBY_TOTALS.invited : RUBY_TOTALS.invitesSent
  const left = RUBY_TOTALS.invited - sent

  const send = () => {
    if (invitesSent) {
      toast(`All ${RUBY_TOTALS.invited} invites are out`, 'accent')
      return
    }
    track('send_invites', left)
    session.sendInvites()
    setBurst(true)
    toast(`${left} invites sent by WhatsApp and email`, 'accent')
    window.setTimeout(() => setBurst(false), 1800)
  }

  return (
    <MobileScreen
      cap="var(--night)"
      header={
        <div className="absolute inset-x-0 top-0 z-30 [&_header]:text-on-ink! [&_header>div>button]:bg-[rgb(11_38_34/0.45)] [&_header>div>button]:backdrop-blur-md">
          <TopBar tone="clear" onBack={() => (canGoBack ? back() : reset('app.guests'))} right={<IconButton icon={Share2} label="Share invite" tone="scrim" size={40} onClick={() => toast('Share sheet · WhatsApp, Messages, Mail')} />} />
        </div>
      }
      dock={
        <Dock>
          <Button block size="lg" icon={invitesSent ? Check : Send} onClick={send} aria-label={invitesSent ? 'All invites sent' : `Send ${left} invites`}>
            {invitesSent ? 'All invites sent ✓' : `Send ${left} invites`}
          </Button>
        </Dock>
      }
      overlay={burst ? <Confetti origin={0.3} count={60} /> : undefined}
    >
      {/* hero */}
      <HeroImage src="ringsFlowers" alt="" scrim="both" className="h-[340px]" position="center 40%">
        <div className="flex h-full flex-col justify-end px-5 pb-[108px]" style={{ paddingTop: SAFE_TOP }}>
          <p className="label text-brass-light">QR invite · {RUBY.type}</p>
          <h1 className="grot mt-1 text-[34px] text-on-night">Your invitation</h1>
        </div>
      </HeroImage>

      {/* the stub overlaps the photo */}
      <div className="relative z-10 -mt-[96px] px-5">
        <Stub
          tone="ink"
          top={
            <div className="relative overflow-hidden px-5 pb-5 pt-5">
              <span className="arc" style={{ right: '-40%', bottom: '-78%', width: '96%', opacity: 0.5 }} aria-hidden />
              <span className="grain" aria-hidden />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="label text-brass-light">Admit 2</p>
                  <p className="grot mt-2 text-[28px] leading-[1.02]">
                    Ngozi & Emeka
                    <br />
                    <em className="not-italic text-brass-light">40 Years</em>
                  </p>
                </div>
                <Mark size={36} tone="brass" />
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="label text-on-ink-2">Date</p>
                  <p className="num mt-0.5 text-[15px] font-bold">{fmtDay(RUBY.date, true)}</p>
                  <p className="num text-[12px] font-semibold text-on-ink-2">Doors {RUBY.time}</p>
                </div>
                <div>
                  <p className="label text-on-ink-2">Venue</p>
                  <p className="mt-0.5 text-[15px] font-bold leading-tight">{RUBY.venue}</p>
                  <p className="text-[12px] font-semibold text-on-ink-2">{RUBY.city}</p>
                </div>
              </div>
            </div>
          }
          bottom={
            <div className="flex items-center gap-4 px-5 pb-5 pt-4">
              <QrCode seed="EDR-RUBY-1041" size={104} light="#F7F2E8" dark="#0B2622" />
              <div className="min-w-0 flex-1">
                <p className="label text-on-ink-2">Host</p>
                <div className="mt-1 flex items-center gap-2">
                  <Avatar who={CLIENT.photo} size={28} />
                  <p className="truncate text-[15px] font-bold">{CLIENT.name}</p>
                </div>
                <p className="meta mt-2 text-brass-light">EDR-RUBY-1041</p>
                <p className="mt-1 text-[12px] leading-snug text-on-ink-2">Scans once at the door, then locks.</p>
              </div>
            </div>
          }
        />
      </div>

      {/* progress */}
      <section className="mt-6 px-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label text-text-2">Invites sent</p>
            <p className="mt-1">
              <span className="figure num text-[44px]">{sent}</span>
              <span className="num text-[15px] font-bold text-text-2"> of {RUBY_TOTALS.invited}</span>
            </p>
          </div>
          <div className="pb-1.5 text-right">
            {invitesSent ? <Badge tone="success">Everyone invited</Badge> : <Badge tone="warn">{left} still to send</Badge>}
            <p className="num mt-1.5 text-[12px] font-semibold text-text-2">{RUBY_TOTALS.yes} already said yes</p>
          </div>
        </div>
        <Bar value={(sent / RUBY_TOTALS.invited) * 100} tone="brass" height={8} className="mt-3" />
        <div className="mt-2 flex items-center justify-between">
          <span className="meta text-text-2">98 WhatsApp · 37 email</span>
          <span className="meta text-text-2">{invitesSent ? 'last batch just now' : 'last batch 3 days ago'}</span>
        </div>
      </section>

      {/* channels */}
      <section className="mt-6 px-5">
        <p className="label text-text-2">Send by</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {CHANNELS.map((c) => {
            const on = c.id === channel
            return (
              <motion.button
                key={c.id}
                type="button"
                whileTap={tap}
                transition={spring.ui}
                aria-pressed={on}
                onClick={() => {
                  setChannel(c.id)
                  toast(c.toast)
                }}
                className={`flex h-[84px] flex-col items-start justify-between rounded-[var(--r-card)] p-3 text-left ${on ? 'bg-accent text-on-accent shadow-[var(--glow-accent)]' : 'bg-[var(--surface)] text-text shadow-[var(--shadow-raised)]'}`}
              >
                <c.icon size={20} strokeWidth={2.2} aria-hidden />
                <span>
                  <span className="block text-[13px] font-extrabold">{c.label}</span>
                  <span className={`num block text-[11px] font-semibold ${on ? 'text-on-accent-2' : 'text-text-2'}`}>{c.sent ? `${c.sent} sent` : 'for the family group'}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* how guests see it */}
      <section className="mt-6">
        <div className="flex items-end justify-between px-5">
          <h2 className="grot text-[22px]">How guests see it</h2>
          <span className="meta text-text-2">3 previews</span>
        </div>
        <Rail className="mt-3" gap={10}>
          <div className="w-[236px] shrink-0 snap-start rounded-[var(--r-card)] bg-[#E7F6E4] p-3 text-[#102A18]">
            <p className="label text-[#1F6B3A]">WhatsApp</p>
            <div className="mt-2 rounded-[12px] rounded-tl-[4px] bg-white p-2.5 text-[12px] leading-snug shadow-[0_1px_2px_rgb(0_0_0/0.08)]">
              <p className="font-bold">Ngozi & Emeka · 40 Years</p>
              <p className="mt-0.5">You’re invited! Sat 20 Feb 2027, 2 pm, The Orangery. Tap to RSVP and save your QR ticket.</p>
              <div className="mt-2 flex items-center gap-2 rounded-[8px] bg-[#F1F1EE] p-2">
                <QrCode seed="EDR-RUBY-1041" size={34} />
                <span className="truncate text-[11px] font-bold">edera.app/i/EDR-RUBY</span>
              </div>
              <p className="num mt-1 text-right text-[11px] text-[#3F4E45]">18:40 ✓✓</p>
            </div>
          </div>
          <div className="w-[236px] shrink-0 snap-start rounded-[var(--r-card)] bg-[var(--surface)] p-3 shadow-[var(--shadow-raised)]">
            <p className="label text-text-2">Email</p>
            <p className="mt-2 text-[12px] font-bold">Adaeze Nwosu invites you</p>
            <p className="meta text-text-2">to Ngozi & Emeka · 40 Years</p>
            <div className="mt-2 overflow-hidden rounded-[10px] bg-ink p-2.5 text-on-ink">
              <p className="grot text-[15px]">Ngozi & Emeka</p>
              <p className="num mt-0.5 text-[11px] text-on-ink-2">Sat 20 Feb 2027 · 14:00</p>
              <span className="mt-2 inline-block rounded-full bg-brass px-2.5 py-1 text-[10px] font-extrabold text-on-brass">RSVP</span>
            </div>
          </div>
          <div className="w-[236px] shrink-0 snap-start rounded-[var(--r-card)] bg-night p-3 text-on-night">
            <p className="label text-on-night-2">Wallet pass</p>
            <div className="mt-2 flex items-center gap-3">
              <QrCode seed="EDR-RUBY-1041" size={64} light="#F7F2E8" dark="#0B2622" />
              <div className="min-w-0">
                <p className="text-[12px] font-bold">Admit 2</p>
                <p className="num text-[11px] text-on-night-2">Table 1 · Doors 14:00</p>
                <p className="meta mt-1 text-brass-light">EDR-RUBY-1041</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-on-night-2">Tunde scans it at the door with the Planner App.</p>
          </div>
        </Rail>
      </section>

      <div className="mx-5 mt-6 flex items-start gap-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
        <Copy size={18} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
        <p className="text-[12px] leading-snug text-text-2">
          <span className="font-bold text-text">One code per household.</span> A duplicate scan is flagged at the door, and a declined guest’s code is cancelled.
        </p>
      </div>
    </MobileScreen>
  )
}
