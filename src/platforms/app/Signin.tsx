import { motion } from 'framer-motion'
import { Apple, ArrowRight, Eye, EyeOff, Lock, Mail, Radio, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Wordmark } from '../../components/Brand'
import { Button } from '../../components/Button'
import { Input, Toggle } from '../../components/Form'
import { HeroImage } from '../../components/Media'
import { daysUntil } from '../../data/clock'
import { DEMO_CLIENT_LOGIN } from '../../data/demoFill'
import { RUBY, TONIGHT_TOTALS } from '../../data/events'
import { useNav } from '../../lib/navigation'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, TopBar } from '../mobileShell'

/* app.signin: a brass colour block with an offset photograph lapping over
   it, then the form, pre-filled with the demo account. */

export default function AppSignin() {
  const { navigate, toast } = useNav()
  const [email, setEmail] = useState(DEMO_CLIENT_LOGIN.email)
  const [password, setPassword] = useState(DEMO_CLIENT_LOGIN.password)
  const [remember, setRemember] = useState(DEMO_CLIENT_LOGIN.remember)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!email.trim() || !email.includes('@')) e.email = 'Enter the email you signed up with'
    if (!password) e.password = 'Enter your password'
    setErrors(e)
    if (e.email || e.password) {
      toast('Fill in your email and password to continue', 'warn')
      return
    }
    track('sign_in', 'client')
    navigate('app.otp')
  }

  const useDemo = () => {
    setEmail(DEMO_CLIENT_LOGIN.email)
    setPassword(DEMO_CLIENT_LOGIN.password)
    setRemember(true)
    setErrors({})
    toast('Demo account filled in: Adaeze Nwosu', 'accent')
  }

  return (
    <MobileScreen
      header={<TopBar tone="bg" />}
      dock={
        <Dock>
          <Button size="lg" block trailing={ArrowRight} onClick={submit}>
            Continue
          </Button>
        </Dock>
      }
    >
      {/* brass block */}
      <div className="relative mx-5 mt-1 overflow-hidden rounded-[var(--r-container)] bg-brass px-5 pb-20 pt-5 text-on-brass">
        <span aria-hidden className="dots-light" />
        <div className="relative flex items-start justify-between">
          <Wordmark size={22} tone="ink" />
          <span className="label inline-flex h-6 items-center rounded-full bg-[rgb(11_38_34/0.14)] px-2.5">Client app</span>
        </div>
        <p className="label relative mt-6 text-[color:var(--brass-800)]">Welcome back</p>
        <p className="grot relative mt-1 text-[26px]">
          Your parents’ day is <em style={{ color: 'var(--ever-950)' }}>{daysUntil(RUBY.date)} days</em> away.
        </p>
      </div>

      {/* offset photo card, lapping the brass block */}
      <div className="relative z-10 -mt-14 ml-12 mr-5 overflow-hidden rounded-[var(--r-card)] shadow-[var(--shadow-floating)]">
        <HeroImage src="tipiDance" alt="Guests dancing under bunting at an engagement dinner" className="h-[168px]" scrim="b" width={800} position="center 40%">
          <div className="flex h-full flex-col justify-end p-4">
            <span className="label inline-flex w-max items-center gap-1.5 rounded-full bg-[rgb(255_255_255/0.16)] px-2.5 py-1 text-on-night ring-1 ring-inset ring-[rgb(255_255_255/0.3)]">
              <Radio size={11} strokeWidth={2.6} aria-hidden className="text-brass-light" />
              Live tonight · {TONIGHT_TOTALS.checkedIn} checked in
            </span>
            <p className="mt-2 text-[15px] font-bold leading-tight text-on-night">Adaora & Kunle · Engagement Dinner</p>
            <p className="text-[12px] font-semibold text-on-night-2">Olá Event Hall, Peckham · doors {TONIGHT_TOTALS.doors}</p>
          </div>
        </HeroImage>
      </div>

      {/* heading + demo chip */}
      <div className="mt-6 px-5">
        <h1 className="grot text-[34px]">Sign in</h1>
        <p className="mt-1.5 text-[15px] text-text-2">The demo account is already filled in. Tap Continue.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={useDemo} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-soft px-3.5 text-[13px] font-bold text-on-accent-soft">
            <Sparkles size={14} strokeWidth={2.4} aria-hidden />
            Use demo account
          </motion.button>
          <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={() => toast('Planners and vendors sign in on the Planner and Vendor apps', 'info')} className="inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-bold text-text" style={{ boxShadow: 'inset 0 0 0 1px var(--rule-strong)' }}>
            I’m a professional
          </motion.button>
        </div>
      </div>

      {/* form */}
      <form
        className="mt-5 flex flex-col gap-4 px-5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Input label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} leading={<Mail size={16} strokeWidth={2.2} aria-hidden />} />
        <Input
          label="Password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leading={<Lock size={16} strokeWidth={2.2} aria-hidden />}
          trailing={
            <motion.button type="button" whileTap={tap} transition={spring.ui} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow((s) => !s)} className="grid h-9 w-9 place-items-center rounded-full text-text-2">
              {show ? <EyeOff size={17} strokeWidth={2.1} aria-hidden /> : <Eye size={17} strokeWidth={2.1} aria-hidden />}
            </motion.button>
          }
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 text-[14px] font-semibold text-text">
            <Toggle on={remember} onChange={setRemember} label="Remember me on this phone" />
            Remember me
          </label>
          <button type="button" onClick={() => toast('Reset link sent to adaeze.nwosu@demo-edera.app', 'accent')} className="h-11 px-1 text-[13px] font-bold text-accent-ink">
            Forgot password?
          </button>
        </div>
        <button type="submit" className="sr-only">
          Continue
        </button>
      </form>

      {/* social */}
      <div className="mt-5 flex items-center gap-3 px-5">
        <span className="h-px flex-1 bg-[var(--rule)]" />
        <span className="label text-text-2">or</span>
        <span className="h-px flex-1 bg-[var(--rule)]" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 px-5">
        <Button variant="ink" icon={Apple} onClick={() => toast('Apple sign-in arrives with the build: use the demo account for now', 'info')}>
          Apple
        </Button>
        <Button variant="outline" onClick={() => toast('Google sign-in arrives with the build: use the demo account for now', 'info')}>
          <span aria-hidden className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[var(--surface-high)] text-[12px] font-extrabold">
            G
          </span>
          Google
        </Button>
      </div>

      <p className="mt-6 px-5 text-center text-[14px] text-text-2">
        New to Edera?{' '}
        <button
          type="button"
          onClick={() => {
            track('create_account')
            navigate('app.otp')
          }}
          className="inline-flex h-11 items-center font-bold text-accent-ink"
        >
          Create an account
        </button>
      </p>
      <p className="mt-1 px-8 text-center text-[11px] font-semibold text-text-3">Dummy credentials: nothing here is a real account.</p>
    </MobileScreen>
  )
}
