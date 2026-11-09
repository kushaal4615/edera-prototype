import { motion } from 'framer-motion'
import { ArrowRight, MessageSquareText, ShieldCheck, Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Mark } from '../../components/Brand'
import { Button } from '../../components/Button'
import { DEMO_OTP } from '../../data/demoFill'
import { useNav } from '../../lib/navigation'
import { track } from '../../lib/tracker'
import { spring, tap } from '../../motion/springs'
import { Dock, MobileScreen, TopBar } from '../mobileShell'

/* app.otp: six boxes, already filled from the demo code. The SMS preview
   above them shows the real-time notification that would have arrived. */

const MASKED_PHONE = '+44 7700 900•23'
const EXPIRES_SECONDS = 4 * 60 + 58

export default function AppOtp() {
  const { navigate, toast, back, canGoBack } = useNav()
  const [digits, setDigits] = useState<string[]>(DEMO_OTP)
  const [error, setError] = useState<string | null>(null)
  const [left, setLeft] = useState(EXPIRES_SECONDS)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [])

  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')

  const setAt = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '').slice(-1)
    setDigits((d) => d.map((x, k) => (k === i ? v : x)))
    setError(null)
    if (v && i < 5) refs.current[i + 1]?.focus()
  }

  const verify = () => {
    if (digits.some((d) => !d)) {
      setError('Enter all six digits of the code')
      toast('The code has six digits: fill every box', 'warn')
      refs.current[digits.findIndex((d) => !d)]?.focus()
      return
    }
    track('otp_verified')
    navigate('app.home')
  }

  const resend = () => {
    setLeft(EXPIRES_SECONDS)
    setDigits(DEMO_OTP)
    setError(null)
    toast(`New code sent to ${MASKED_PHONE}`, 'accent')
  }

  return (
    <MobileScreen
      header={<TopBar tone="bg" />}
      dock={
        <Dock>
          <Button size="lg" block trailing={ArrowRight} onClick={verify}>
            Verify
          </Button>
        </Dock>
      }
    >
      <div className="px-5 pt-2">
        <p className="label text-brass-ink">Step 2 of 2</p>
        <h1 className="grot mt-2 text-[34px]">Verify your phone</h1>
        <p className="mt-2 text-[15px] text-text-2">
          We sent a six-digit code by SMS to <span className="num font-bold text-text">{MASKED_PHONE}</span>.
        </p>
      </div>

      {/* the notification that arrived */}
      <div className="mx-5 mt-6 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-ink">
          <Mark size={26} tone="light" />
        </span>
        <div className="relative min-w-0 flex-1 rounded-[var(--r-card)] rounded-tl-[6px] bg-ink px-4 py-3 text-on-ink shadow-[var(--glow-ink)]">
          <div className="flex items-center justify-between gap-3">
            <span className="label text-brass-light">Edera</span>
            <span className="meta text-on-ink-2">now</span>
          </div>
          <p className="mt-1 text-[14px] leading-snug">
            Your Edera code is <span className="num font-extrabold tracking-[0.12em]">{DEMO_OTP.join('')}</span>. It expires in 5 minutes. Never share it.
          </p>
        </div>
      </div>

      {/* the six boxes */}
      <div className="mt-8 px-5">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-bold text-text" htmlFor="otp-0">
            Your code
          </label>
          <span className={`meta inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 ${left < 60 ? 'bg-danger-soft text-on-danger-soft' : 'bg-brass-soft text-on-brass-soft'}`}>
            <Timer size={12} strokeWidth={2.4} aria-hidden />
            {left > 0 ? `expires in ${mm}:${ss}` : 'expired'}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={(el) => {
                refs.current[i] = el
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1}`}
              maxLength={1}
              onChange={(e) => setAt(i, e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
              }}
              className={`figure num h-[60px] w-full rounded-[var(--r-control)] text-center text-[30px] outline-none ring-1 ring-inset well transition-shadow duration-150 focus:ring-2 focus:ring-[var(--accent)] ${error && !d ? 'ring-[var(--danger)]' : 'ring-[var(--rule-strong)]'}`}
            />
          ))}
        </div>
        {error ? <p className="mt-2 text-[13px] font-semibold text-danger-text">{error}</p> : <p className="mt-2 text-[13px] text-text-2">The code is filled in for the demo. Tap Verify.</p>}
      </div>

      {/* resend + change number */}
      <div className="mt-6 flex items-center justify-between px-5">
        <motion.button type="button" whileTap={tap} transition={spring.ui} onClick={resend} className="inline-flex h-11 items-center gap-2 rounded-full px-1 text-[14px] font-bold text-accent-ink">
          <MessageSquareText size={16} strokeWidth={2.3} aria-hidden />
          Resend code
        </motion.button>
        <button type="button" onClick={() => (canGoBack ? back() : navigate('app.signin'))} className="h-11 px-1 text-[14px] font-bold text-text-2">
          Change number
        </button>
      </div>

      {/* why */}
      <div className="mx-5 mt-8 flex gap-3 rounded-[var(--r-card)] bg-[var(--surface-tint)] p-4">
        <ShieldCheck size={20} strokeWidth={2.2} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
        <p className="text-[13px] leading-snug text-text-2">
          <span className="font-bold text-text">Why we check.</span> Your phone is how planners and vendors reach you about bookings, and how guests’ RSVPs get back to you. Role-based access keeps each account to its own dashboard.
        </p>
      </div>
    </MobileScreen>
  )
}
