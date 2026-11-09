import { face, type MediaKey } from '../data/media'
import { Check } from 'lucide-react'

type AvatarProps = {
  who: MediaKey
  size?: number
  /** brass ring: the person in focus */
  ring?: boolean
  /** small check on the lower right: certified / confirmed */
  verified?: boolean
  alt?: string
  className?: string
}

/** Real face, optionally ringed in brass and carrying a confirmation check. */
export function Avatar({ who, size = 40, ring = false, verified = false, alt = '', className = '' }: AvatarProps) {
  return (
    <span
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 ${size > 56 ? 4.5 : 3.5}px var(--accent), 0 0 18px -2px rgb(201 151 63 / 0.55)` : undefined }}
    >
      <img
        src={face(who, Math.min(200, Math.round(size * 1.6)))}
        alt={alt}
        loading="lazy"
        width={size}
        height={size}
        className="h-full w-full rounded-full bg-[var(--surface-high)] object-cover"
      />
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <span className="grid place-items-center rounded-full bg-ink text-on-ink ring-2 ring-[var(--surface)]" style={{ width: Math.max(14, Math.round(size * 0.3)), height: Math.max(14, Math.round(size * 0.3)) }}><Check size={Math.max(8, Math.round(size * 0.18))} strokeWidth={3.2} /></span>
        </span>
      )}
    </span>
  )
}

export function AvatarStack({ people, size = 24, extra }: { people: MediaKey[]; size?: number; extra?: string }) {
  return (
    <span className="inline-flex items-center">
      {people.map((p, i) => (
        <span key={p + i} className="rounded-full ring-2 ring-[var(--surface)]" style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
          <Avatar who={p} size={size} />
        </span>
      ))}
      {extra && <span className="ml-1.5 text-[13px] font-semibold text-text-2">{extra}</span>}
    </span>
  )
}
