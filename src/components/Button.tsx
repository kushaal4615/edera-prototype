import { motion, type HTMLMotionProps } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { spring, tap } from '../motion/springs'

type Variant = 'accent' | 'ink' | 'outline' | 'ghost' | 'paper' | 'danger' | 'white'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  accent: 'bg-accent text-on-accent shadow-[var(--glow-accent)]',
  ink: 'bg-ink text-on-ink',
  outline: 'bg-transparent text-text ring-1 ring-inset ring-[var(--rule-strong)] hover:bg-[var(--surface-high)]',
  ghost: 'bg-transparent text-text hover:bg-[var(--surface-high)]',
  paper: 'bg-[var(--surface-high)] text-text shadow-[var(--shadow-raised)]',
  danger: 'bg-danger-soft text-danger-text ring-1 ring-inset ring-[rgb(181_55_47/0.3)]',
  white: 'bg-[#ffffff] text-[#14161A]',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-[56px] px-6 text-[16px] gap-2.5',
}

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  trailing?: LucideIcon
  block?: boolean
  children?: ReactNode
}

/** Pill-shaped. Primary actions are the evergreen pill with a soft glow. */
export function Button({ variant = 'accent', size = 'md', icon: Icon, trailing: Trail, block, className = '', children, ...rest }: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={tap}
      transition={spring.ui}
      className={`relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-bold tracking-[-0.005em] transition-colors duration-150 ${VARIANT[variant]} ${SIZE[size]} ${block ? 'w-full min-w-0 flex-1' : 'shrink-0'} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 18} strokeWidth={2.3} aria-hidden />}
      {children}
      {Trail && (
        <span className={`-mr-2.5 ml-1 grid place-items-center rounded-full ${size === 'lg' ? 'h-9 w-9' : 'h-7 w-7'} bg-[color-mix(in_oklch,currentColor_14%,transparent)]`}>
          <Trail size={size === 'lg' ? 18 : 15} strokeWidth={2.4} aria-hidden />
        </span>
      )}
    </motion.button>
  )
}

type IconButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  icon: LucideIcon
  label: string
  tone?: 'plain' | 'paper' | 'ink' | 'glass' | 'accent' | 'scrim'
  size?: number
  badge?: number
}

const TONE: Record<NonNullable<IconButtonProps['tone']>, string> = {
  plain: 'text-text hover:bg-[var(--surface-high)]',
  paper: 'bg-[var(--surface-high)] text-text shadow-[var(--shadow-raised)]',
  ink: 'bg-ink text-on-ink',
  glass: 'glass text-text',
  accent: 'bg-accent text-on-accent',
  scrim: 'bg-[rgb(11_38_34/0.5)] text-white backdrop-blur-md',
}

export function IconButton({ icon: Icon, label, tone = 'plain', size = 44, badge, className = '', ...rest }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={tap}
      transition={spring.ui}
      style={{ width: size, height: size }}
      className={`relative grid shrink-0 place-items-center rounded-full transition-colors duration-150 ${TONE[tone]} ${className}`}
      {...rest}
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={2.1} aria-hidden />
      {badge !== undefined && badge > 0 && (
        <span className="num absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-on-accent ring-2 ring-[var(--bg)]">
          {badge}
        </span>
      )}
    </motion.button>
  )
}

/** A full-width pressable row or card. Always a real <button>. */
export function Pressable({ className = '', children, ...rest }: HTMLMotionProps<'button'>) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring.ui} className={`block w-full text-left ${className}`} {...rest}>
      {children}
    </motion.button>
  )
}
