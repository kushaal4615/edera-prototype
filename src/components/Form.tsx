import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { spring } from '../motion/springs'

/* Labels sit above inputs, helper text below, errors below in red with
   the recovery spelled out. */

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-bold text-text">
        {label}
      </label>
      {children}
      {error ? <p className="text-[13px] font-semibold text-danger-text">{error}</p> : hint ? <p className="text-[13px] text-text-2">{hint}</p> : null}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; leading?: ReactNode; trailing?: ReactNode; dense?: boolean }

export function Input({ label, hint, error, leading, trailing, dense, className = '', ...rest }: InputProps) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <div
        className={`flex items-center gap-2 rounded-[var(--r-control)] well px-3.5 ring-1 ring-inset transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[var(--accent)] ${error ? 'ring-[var(--danger)]' : 'ring-[var(--rule-strong)]'} ${dense ? 'h-10' : 'h-12'}`}
      >
        {leading && <span className="flex shrink-0 text-text-2">{leading}</span>}
        <input id={id} className={`h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-text-3 ${className}`} {...rest} />
        {trailing && <span className="flex shrink-0 text-text-2">{trailing}</span>}
      </div>
    </Field>
  )
}

export function TextArea({ label, hint, error, rows = 4, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className={`w-full resize-none rounded-[var(--r-control)] bg-[var(--surface-raised)] px-3.5 py-3 text-[15px] leading-relaxed outline-none ring-1 ring-inset ring-[var(--rule-strong)] transition-shadow duration-150 placeholder:text-text-3 focus:ring-2 focus:ring-[var(--accent)] ${className}`}
        {...rest}
      />
    </Field>
  )
}

/** iOS-style switch. Track colour follows the tone. */
export function Toggle({ on, onChange, label, tone = 'accent' }: { on: boolean; onChange: (v: boolean) => void; label: string; tone?: 'accent' | 'ink' }) {
  const track = on ? (tone === 'accent' ? 'var(--accent)' : 'var(--ink)') : 'var(--paper-400)'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: track }}
    >
      <motion.span
        className="absolute top-[2px] block h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.22)]"
        animate={{ x: on ? 22 : 2 }}
        transition={spring.ui}
      />
    </button>
  )
}

/** Square check used in pick-lists. */
export function CheckMark({ on }: { on: boolean }) {
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-[7px] transition-colors duration-150 ${on ? 'bg-accent text-on-accent' : 'bg-[var(--surface-raised)] ring-1 ring-inset ring-[var(--rule-strong)]'}`}>
      {on && <Check size={15} strokeWidth={3} aria-hidden />}
    </span>
  )
}
