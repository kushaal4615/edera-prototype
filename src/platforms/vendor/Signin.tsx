import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Store } from 'lucide-react'
import { useState } from 'react'
import { Wordmark } from '../../components/Brand'
import { Button } from '../../components/Button'
import { Input, Toggle } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { DEMO_VENDOR_LOGIN } from '../../data/demoFill'
import { useNav } from '../../lib/navigation'
import { track } from '../../lib/tracker'
import { fadeUp, listItem, listParent } from '../../motion/transitions'
import { MobileScreen, SAFE_TOP, safeBottom } from '../mobileShell'

/* vendor.signin: the buffet photograph runs behind the status bar; the
   wordmark, the "Vendors & venues" label and three marketplace figures sit
   on its scrim. The form rises out of the photo as a paper sheet. No back
   affordance: this is the Vendor App's front door. */

const STATS = [
  { value: '884', unit: '', label: 'requests this month' },
  { value: '1h 48m', unit: '', label: 'median reply' },
  { value: '71', unit: '%', label: 'accept rate' },
]

export default function VendorSignin() {
  const { navigate, toast } = useNav()
  const [email, setEmail] = useState(DEMO_VENDOR_LOGIN.email)
  const [password, setPassword] = useState(DEMO_VENDOR_LOGIN.password)
  const [remember, setRemember] = useState(DEMO_VENDOR_LOGIN.remember)
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const submit = () => {
    if (!email.includes('@') || password.length < 6) {
      setError(!email.includes('@') ? 'Enter the email you listed with. Try bola@demo-iyabola.app' : 'Password is at least 6 characters')
      return
    }
    track('vendor_sign_in', email)
    navigate('vendor.home')
  }

  return (
    <MobileScreen bg="var(--bg)" padBottom={false} cap="var(--night)">
      <HeroImage src="buffetTrays" alt="Ìyá Bola's buffet trays: jollof, fried rice and sides under warm light" className="h-[404px] w-full" scrim="both" position="center 40%">
        <div className="flex h-full flex-col justify-between px-5 pb-16" style={{ paddingTop: `calc(${SAFE_TOP} + 10px)` }}>
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center justify-between">
            <Wordmark tone="light" size={24} />
            <span className="label inline-flex h-7 items-center gap-1.5 rounded-full bg-brass px-3 text-on-brass">
              <Store size={12} strokeWidth={2.6} aria-hidden />
              Vendors &amp; venues
            </span>
          </motion.div>
          <div>
            <motion.h1 variants={fadeUp} initial="hidden" animate="show" className="grot text-[38px] text-on-night" style={{ textShadow: '0 2px 18px rgb(11 38 34 / 0.5)' }}>
              Your requests, your <em style={{ color: 'var(--brass-light)' }}>calendar</em>, one place.
            </motion.h1>
            <motion.ul variants={listParent} initial="hidden" animate="show" className="mt-5 grid grid-cols-3 gap-2" aria-label="Marketplace this month">
              {STATS.map((s, i) => (
                <motion.li key={s.label} variants={listItem} className={`relative rounded-[var(--r-card)] px-3 py-2.5 ${i === 0 ? 'bg-brass text-on-brass' : 'bg-[rgb(11_38_34/0.55)] text-on-night backdrop-blur-md'}`}>
                  <span className="figure num block text-[26px]">
                    {s.value}
                    {s.unit && <span className="unit">{s.unit}</span>}
                  </span>
                  <span className={`mt-1 block text-[11px] font-bold leading-tight ${i === 0 ? 'text-on-brass' : 'text-on-night-2'}`}>{s.label}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </HeroImage>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
        className="relative -mt-9 rounded-t-[var(--r-container)] bg-[var(--surface)] px-5 pt-6 shadow-[var(--shadow-floating)]"
        style={{ paddingBottom: safeBottom(16) }}
        aria-label="Sign in"
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label text-brass-ink">Welcome back</p>
            <h2 className="grot mt-1 text-[26px]">Sign in to your listings</h2>
          </div>
          <span className="meta rounded-full bg-[var(--surface-high)] px-2.5 py-1 text-text-2">pro.useedera.com</span>
        </div>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(undefined)
            }}
            leading={<Mail size={16} aria-hidden />}
            error={error && !email.includes('@') ? error : undefined}
          />
          <Input
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(undefined)
            }}
            leading={<Lock size={16} aria-hidden />}
            trailing={
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="grid h-11 w-9 place-items-center">
                {show ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
              </button>
            }
            error={error && email.includes('@') ? error : undefined}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 text-[14px] font-semibold text-text">
              <Toggle on={remember} onChange={setRemember} label="Keep me signed in" />
              Keep me signed in
            </label>
            <button type="button" onClick={() => toast('Reset link sent to bola@demo-iyabola.app', 'info')} className="h-11 text-[13px] font-bold text-accent-ink">
              Forgot?
            </button>
          </div>
          <Button type="submit" size="lg" block trailing={ArrowRight}>
            Sign in
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
          <span className="label text-text-2">New to Edera</span>
          <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
        </div>
        <Button variant="outline" block className="mt-3" icon={Store} onClick={() => toast('Listing wizard: 6 steps, free during launch', 'accent')}>
          List your business
        </Button>
        <p className="mt-3 text-center text-[12px] font-semibold text-text-2">Free to list while Edera grows · no commission at launch</p>
      </motion.section>
    </MobileScreen>
  )
}
