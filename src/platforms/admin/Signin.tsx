import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Eye, EyeOff, Fingerprint, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Wordmark } from '../../components/Brand'
import { Button } from '../../components/Button'
import { Field, Input } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { KPI } from '../../data/admin'
import { CLOCK } from '../../data/clock'
import { DEMO_ADMIN_LOGIN } from '../../data/demoFill'
import { useNav } from '../../lib/navigation'
import { track } from '../../lib/tracker'
import { fadeUp, listItem, listParent } from '../../motion/transitions'

/* admin.signin: a split panel. Left, the Thames under an evergreen wash
   with the platform's three headline figures; right, the sign-in form,
   already filled for Dave. Not inside ConsoleShell. */

const ROLES = ['Platform owner', 'Trust & safety', 'Support'] as const

const FIGURES: { label: string; value: string; sub: string }[] = [
  { label: 'Users', value: KPI.users.toLocaleString('en-GB'), sub: KPI.usersDelta },
  { label: 'Verified pros', value: KPI.verifiedPros.toLocaleString('en-GB'), sub: `${KPI.pendingVerification} waiting for review` },
  { label: 'Events', value: KPI.eventsPlanned.toLocaleString('en-GB'), sub: `${KPI.eventsThisMonth} planned this month` },
]

export default function AdminSignin() {
  const { navigate, toast } = useNav()
  const [email, setEmail] = useState(DEMO_ADMIN_LOGIN.email)
  const [password, setPassword] = useState(DEMO_ADMIN_LOGIN.password)
  const [role, setRole] = useState<string>(DEMO_ADMIN_LOGIN.role)
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | undefined>()

  const submit = () => {
    if (!email.includes('@')) return setError('Enter the email on your Edera staff account')
    if (password.length < 6) return setError('Password is at least 6 characters')
    setError(undefined)
    track('admin_signin', role)
    navigate('admin.overview')
  }

  return (
    <div className="flex h-full w-full bg-[var(--bg)] max-md:flex-col max-md:overflow-y-auto">
      {/* ── Left: evergreen photo panel ── */}
      <section className="relative w-[46%] shrink-0 overflow-hidden bg-night text-on-night max-md:min-h-[340px] max-md:w-full">
        <div className="absolute inset-0">
          <HeroImage src="londonThames" alt="" scrim="none" width={1400} className="h-full w-full" position="center 40%" />
        </div>
        <div aria-hidden className="wash pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[rgb(11_38_34/0.58)]" />
        <div aria-hidden className="scrim-b pointer-events-none absolute inset-0" />
        <div aria-hidden className="grain" />
        <div aria-hidden className="arc" style={{ right: '-30%', bottom: '-62%', width: '72%', opacity: 0.7 }} />

        <motion.div variants={listParent} initial="hidden" animate="show" className="relative flex h-full flex-col p-10 max-md:p-6">
          <motion.div variants={listItem} className="flex items-center gap-3">
            <Wordmark tone="light" size={26} />
            <span className="label rounded-full bg-[rgb(255_255_255/0.14)] px-2.5 py-1 text-on-night">Admin</span>
          </motion.div>

          <motion.p variants={listItem} className="grot mt-10 max-w-[18ch] text-[40px] leading-[0.98] text-on-night max-md:mt-6 max-md:text-[30px]">
            The one place for the <em>event industry</em>, run from one desk.
          </motion.p>

          <div className="mt-auto grid grid-cols-3 gap-6 pt-10 max-md:grid-cols-3 max-md:gap-3 max-md:pt-6">
            {FIGURES.map((f) => (
              <motion.div key={f.label} variants={listItem} className="min-w-0">
                <span className="label text-on-night-2">{f.label}</span>
                <span className="figure num mt-1 block text-[54px] text-on-night max-md:text-[32px]">{f.value}</span>
                <span className="mt-1.5 block truncate text-[12px] font-semibold text-on-night-2">{f.sub}</span>
              </motion.div>
            ))}
          </div>

          <motion.div variants={listItem} className="mt-8 flex items-center justify-between border-t border-[rgb(255_255_255/0.16)] pt-4 max-md:mt-5">
            <span className="meta text-on-night-2">
              London {CLOCK.time} · Lagos {CLOCK.lagosTime}
            </span>
            <span className="meta flex items-center gap-1.5 text-on-night-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-free opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-free" />
              </span>
              All systems normal
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Right: the form ── */}
      <section className="flex flex-1 items-center justify-center overflow-y-auto px-12 py-10 max-md:px-5 max-md:py-8">
        <motion.form
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full max-w-[420px]"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <p className="label text-brass-ink">Edera Admin · admin.useedera.com</p>
          <h1 className="grot mt-2 text-[40px]">Sign in</h1>
          <p className="mt-2 text-[15px] text-text-2">Staff accounts only. Dave, welcome back.</p>

          <div className="mt-7 flex flex-col gap-4">
            <Input label="Work email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} leading={<Mail size={16} />} error={error && !email.includes('@') ? error : undefined} />
            <Input
              label="Password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leading={<Lock size={16} />}
              trailing={
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="grid h-10 w-10 -mr-2 place-items-center rounded-full text-text-2 hover:bg-[var(--surface-high)]">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
              error={error && email.includes('@') ? error : undefined}
            />
            <Field label="Signing in as" hint="Permissions follow the role: owners see settings and the commission switch.">
              <div className="relative">
                <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role" className="well h-12 w-full appearance-none rounded-[var(--r-control)] px-3.5 pr-10 text-[15px] font-semibold outline-none ring-1 ring-inset ring-[var(--rule-strong)] focus:ring-2 focus:ring-[var(--accent)]">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-2" />
              </div>
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <button type="button" onClick={() => setRemember((r) => !r)} role="checkbox" aria-checked={remember} className="flex min-h-[44px] items-center gap-2.5 text-[13px] font-semibold text-text">
              <span className={`grid h-5 w-5 place-items-center rounded-[6px] transition-colors ${remember ? 'bg-accent text-on-accent' : 'ring-1 ring-inset ring-[var(--rule-strong)]'}`}>{remember && <ShieldCheck size={13} strokeWidth={3} aria-hidden />}</span>
              Trust this Mac for 30 days
            </button>
            <button type="button" onClick={() => toast('Reset link sent to dave@demo-edera.app', 'info')} className="min-h-[44px] text-[13px] font-bold text-accent-ink underline-offset-4 hover:underline">
              Forgot password?
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <Button type="submit" size="lg" block trailing={ArrowRight}>
              Sign in
            </Button>
            <Button type="button" variant="outline" size="lg" block icon={Fingerprint} onClick={() => toast('Touch ID prompt would appear here · passkey on this Mac', 'info')}>
              Use a passkey
            </Button>
          </div>

          <div className="mt-7 flex gap-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
            <KeyRound size={18} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
            <p className="text-[12.5px] leading-relaxed text-text-2">
              <span className="font-bold text-text">Security notice.</span> This service is for Edera staff. Sign-ins are logged with device, IP address and time, and two-step verification is required for the Platform owner role. Unauthorised access is an offence under the Computer Misuse Act 1990.
            </p>
          </div>

          <p className="meta mt-5 text-center text-text-3">Demo credentials are pre-filled · nothing here is a real account</p>
        </motion.form>
      </section>
    </div>
  )
}
