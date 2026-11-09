import { motion } from 'framer-motion'
import { ArrowRight, Eye, Lock, Mail, Store } from 'lucide-react'
import { useState } from 'react'
import { Figure, Verified, Wordmark } from '../../components/Brand'
import { Button } from '../../components/Button'
import { Input, Toggle } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { Avatar } from '../../components/Avatar'
import { DEMO_PRO_LOGIN } from '../../data/demoFill'
import { PLANNER } from '../../data/people'
import { useNav } from '../../lib/navigation'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { fadeUp, listItem, listParent } from '../../motion/transitions'
import { MobileScreen, SAFE_TOP, safeBottom } from '../mobileShell'

/* pro.signin: the planner's door into Edera. A dark ballroom runs behind the
   status bar; three career figures sit on the scrim; the sign-in card laps
   the photo from below. No back affordance: this is the Planner App's entry. */

const STATS: { value: string; unit: string; label: string }[] = [
  { value: '312', unit: '', label: 'events run' },
  { value: '1,204', unit: '', label: 'vendors booked' },
  { value: '18.6', unit: 'k', label: 'guests scanned' },
]

export default function ProSignin() {
  const { navigate, toast } = useNav()
  const [email, setEmail] = useState(DEMO_PRO_LOGIN.email)
  const [password, setPassword] = useState(DEMO_PRO_LOGIN.password)
  const [remember, setRemember] = useState(DEMO_PRO_LOGIN.remember)
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const signIn = () => {
    if (!email.includes('@') || password.length < 6) {
      setError('Check your email and password, then try again.')
      toast('Email or password is not right', 'danger')
      return
    }
    track('pro_sign_in', email)
    navigate('pro.home')
  }

  return (
    <MobileScreen bg="var(--night)" padBottom={false} cap="var(--night)">
      {/* Full-bleed hero behind the status bar */}
      <HeroImage src="ballroom" alt="A banquet hall set for 250 under chandeliers" scrim="both" className="h-[446px] w-full" position="center 60%">
        <div className="relative flex h-full flex-col px-5" style={{ paddingTop: `calc(${SAFE_TOP} + 10px)` }}>
          <div className="flex items-center justify-between">
            <Wordmark size={24} tone="light" />
            <span className="label rounded-full px-3 py-1.5 text-brass-light" style={{ background: 'rgb(255 255 255 / 0.1)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.18)' }}>
              Planner
            </span>
          </div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-auto pb-[60px]">
            <p className="label text-brass-light">Good evening, Tunde</p>
            <h1 className="grot mt-2 text-[38px] text-on-night">
              Run the whole day <em>from one place.</em>
            </h1>
            <motion.div variants={listParent} initial="hidden" animate="show" className="mt-5 flex items-end gap-5">
              {STATS.map((s, i) => (
                <motion.div key={s.label} variants={listItem} className={`${i > 0 ? 'border-l border-[rgb(255_255_255/0.18)] pl-5' : ''} flex flex-col`}>
                  <Figure value={s.value} unit={s.unit || undefined} size={34} tone="var(--on-night)" />
                  <span className="mt-1 text-[12px] font-semibold text-on-night-2">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </HeroImage>

      {/* The sign-in card laps the photo */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.page, delay: 0.08 }}
        className="relative z-10 -mt-[44px] mx-4 rounded-[var(--r-container)] bg-[var(--surface)] p-5 shadow-[var(--shadow-floating)]"
      >
        <div className="flex items-center gap-3">
          <Avatar who={PLANNER.photo} size={44} ring verified alt="Tunde Bakare" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold">{PLANNER.business}</p>
            <p className="truncate text-[12px] font-semibold text-text-2">
              {PLANNER.name} · {PLANNER.city} &amp; Lagos
            </p>
          </div>
          <Verified size={15} />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Input label="Work email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined) }} leading={<Mail size={16} />} />
          <Input
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(undefined) }}
            error={error}
            leading={<Lock size={16} />}
            trailing={
              <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="grid h-9 w-9 -mr-2 place-items-center rounded-full text-text-2">
                <Eye size={16} />
              </motion.button>
            }
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2.5 text-[13px] font-semibold text-text-2">
            <Toggle on={remember} onChange={setRemember} label="Keep me signed in on this phone" />
            Keep me signed in
          </label>
          <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => toast('Reset link sent to tunde@demo-bakare-events.app', 'accent')} className="h-11 px-1 text-[13px] font-bold text-accent-ink">
            Forgot?
          </motion.button>
        </div>

        <Button size="lg" block trailing={ArrowRight} className="mt-3" onClick={signIn}>
          Sign in
        </Button>
      </motion.section>

      {/* Footer links on night */}
      <div className="relative px-5 pt-5 text-center" style={{ paddingBottom: safeBottom(18) }}>
        <span aria-hidden className="dots-light" style={{ opacity: 0.5 }} />
        <p className="relative text-[13px] font-semibold text-on-night-2">
          New to Edera?{' '}
          <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => { track('pro_apply'); toast('Application opens after this demo · Verified Professional review takes about 2 days', 'info') }} className="inline-flex h-11 items-center font-extrabold text-brass-light underline decoration-[rgb(230_194_124/0.4)] underline-offset-4">
            Apply as a planner
          </motion.button>
        </p>
        <motion.button
          type="button"
          whileTap={tap}
          transition={spring.ui}
          onClick={() => toast('Vendors and venues sign in on the Vendor App', 'neutral')}
          className="relative mt-2 inline-flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-bold text-on-night"
          style={{ background: 'rgb(255 255 255 / 0.08)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.14)' }}
        >
          <Store size={15} aria-hidden />
          Vendor? Use the Vendor App
        </motion.button>
      </div>
    </MobileScreen>
  )
}
