import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, FileText, MessagesSquare, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProgressRing } from '../components/Charts'
import { EmptyState } from '../components/Media'
import { Mark } from '../components/Brand'
import { HeroImage } from '../components/Media'
import { DOCUMENT, FEATURE_INDEX, INDEX_COUNTS, type IndexedFeature } from '../data/featureIndex'
import { SCREEN_FEATURES } from '../data/screenFeatures'
import { ALL_SCREENS, PLATFORMS, platformOf, type Platform, type ScreenId } from '../lib/navigation'
import { spring } from '../motion/springs'

type Filter = 'all' | Platform | 'built' | 'notBuilt'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...PLATFORMS.map((p) => ({ id: p.id as Filter, label: p.label })),
  { id: 'built', label: 'In the prototype' },
  { id: 'notBuilt', label: 'Not built' },
]

const personaColor = (p: Platform) => (p === 'app' ? 'var(--accent)' : p === 'pro' ? 'var(--brass)' : p === 'vendor' ? 'var(--info)' : 'var(--ink)')

/* Viewer chrome: the whole requirements document as a designed index.
   Mapped rows jump to the screen that demonstrates them. */
export function FullFeatureList({ onJump, phone = false }: { onJump: (id: ScreenId) => void; phone?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')

  const matches = (m: (typeof FEATURE_INDEX)[number], x: IndexedFeature) => {
    const built = 'screen' in x.ref
    if (filter === 'built' && !built) return false
    if (filter === 'notBuilt' && built) return false
    if ((filter === 'app' || filter === 'pro' || filter === 'vendor' || filter === 'admin') && (!built || platformOf((x.ref as { screen: ScreenId }).screen) !== filter)) return false
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      if (!x.text.toLowerCase().includes(needle) && !m.module.toLowerCase().includes(needle)) return false
    }
    return true
  }

  const visible = useMemo(
    () => FEATURE_INDEX.map((m) => ({ ...m, shown: m.features.filter((x) => matches(m, x)) })).filter((m) => m.shown.length > 0),
    [filter, q],
  )
  const shownCount = visible.reduce((n, m) => n + m.shown.length, 0)

  return (
    <motion.div
      key="features"
      className={phone ? "absolute inset-0" : "absolute inset-0 flex justify-center px-6 pb-[92px] pt-4"}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1, transition: spring.frame }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.16 } }}
    >
      <div className={`scroll-y relative h-full w-full bg-[var(--surface)] ${phone ? "" : "max-w-[1180px] rounded-[var(--r-container)] shadow-[var(--shadow-floating)]"}`} style={phone ? { overscrollBehavior: "contain" } : undefined}>
        {/* header band */}
        <header className={`relative overflow-hidden bg-night text-on-night ${phone ? "px-5 pb-6" : "rounded-t-[var(--r-container)] px-10 pb-9 pt-9"}`} style={phone ? { paddingTop: "calc(max(env(safe-area-inset-top), 12px) + 16px)" } : undefined}>
          {!phone && (
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[46%] opacity-40">
              <HeroImage src="weddingGlasses" alt="" scrim="none" className="h-full w-full" position="center" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 [background:linear-gradient(90deg,var(--night)_40%,rgb(11_38_34/0.6)_75%,rgb(11_38_34/0.25))]" />
          <div aria-hidden className="dots-light" />
          <div className={`relative grid items-end ${phone ? "grid-cols-1 gap-6" : "grid-cols-[1.25fr_1fr] gap-10"}`}>
            <div>
              <div className="flex items-center gap-4">
                <Mark size={phone ? 40 : 52} tone="light" />
                <span className={`display leading-[0.9] text-white ${phone ? 'text-[30px]' : 'text-[44px]'}`}>e-dera<span className="text-brass">.</span></span>
              </div>
              <p className="label mt-3 text-brass-light">Plan. Book. Coordinate. Celebrate.</p>
              <h1 className="grot mt-4 text-[34px] leading-[0.95]">Full feature list</h1>
              <div className="mt-4 flex flex-col gap-1.5 text-[13px] text-on-night-2">
                <span className="flex items-center gap-2">
                  <FileText size={14} aria-hidden /> <span className="font-semibold text-on-night">{DOCUMENT.title}</span> · {DOCUMENT.source}
                </span>
                <span className="flex items-center gap-2">
                  <MessagesSquare size={14} aria-hidden /> <span className="font-semibold text-on-night">Next</span> · {DOCUMENT.call}
                </span>
              </div>
            </div>
            <dl className={`grid gap-px overflow-hidden rounded-[var(--r-card)] bg-[rgb(255_255_255/0.14)] ${phone ? "grid-cols-2" : "grid-cols-4"}`}>
              {[
                { k: 'Modules', v: INDEX_COUNTS.modules },
                { k: 'Features', v: INDEX_COUNTS.features },
                { k: 'Screens built', v: ALL_SCREENS.length },
                { k: 'Platforms', v: PLATFORMS.length },
              ].map((s, i) => (
                <div key={s.k} className="flex flex-col gap-2 bg-[#15463e] px-4 py-4">
                  <dt className="label text-on-night-2">{s.k}</dt>
                  <dd className="figure num text-[56px]">
                    {i === 1 ? <span className="text-brass-light">{s.v}</span> : s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        {/* filters */}
        <div className={`sticky top-0 z-20 flex gap-3 border-b border-[var(--rule)] bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] py-3.5 backdrop-blur-xl ${phone ? "flex-col px-4" : "items-center px-10"}`}>
          <div role="tablist" aria-label="Filter features" className={`flex gap-1.5 ${phone ? "scroll-x -mx-4 px-4" : ""}`}>
            {FILTERS.map((f) => {
              const on = filter === f.id
              return (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={on}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`h-9 whitespace-nowrap rounded-full px-4 text-[13px] font-bold transition-colors duration-150 ${on ? 'bg-accent text-on-accent' : 'bg-[var(--surface-high)] text-text hover:bg-[var(--paper-300)]'} ${phone ? 'h-10 shrink-0 snap-start' : ''}`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
          <div className={`flex h-11 items-center gap-2 rounded-full ${phone ? "w-full" : "ml-auto w-[300px]"} bg-[var(--surface-high)] px-3.5 focus-within:ring-2 focus-within:ring-[var(--accent)]`}>
            <Search size={15} className="text-text-2" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by module or feature" aria-label="Filter by module or feature" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-2" />
            {q && (
              <button type="button" aria-label="Clear filter" onClick={() => setQ('')} className="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--paper-300)]">
                <X size={13} />
              </button>
            )}
          </div>
          <span className="meta whitespace-nowrap text-text-2">
            {shownCount} of {INDEX_COUNTS.features}
          </span>
        </div>

        {/* module spine */}
        <div className={`relative pb-6 pt-8 ${phone ? "px-4" : "px-10"}`}>
          {visible.length === 0 ? (
            <EmptyState title="No feature matches that" body="Try a module name like Money or Who Edera is for, or clear the filter to see the whole document." action={<button type="button" onClick={() => { setQ(''); setFilter('all') }} className="h-10 rounded-full bg-ink px-5 text-[13px] font-bold text-on-ink">Clear filters</button>} />
          ) : (
            <motion.ol className="relative" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
              <span aria-hidden className="absolute bottom-6 left-[27px] top-3 w-[2px] rounded-full bg-[var(--rule-strong)]" />
              <AnimatePresence initial={false}>
                {visible.map((m) => {
                  const built = m.features.filter((x) => 'screen' in x.ref).length
                  const pct = Math.round((built / m.features.length) * 100)
                  return (
                    <motion.li
                      key={m.module}
                      layout="position"
                      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: spring.ui } }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                      className={`relative grid pb-9 ${phone ? "grid-cols-1 gap-3" : "grid-cols-[300px_1fr] gap-8"}`}
                    >
                      <div className="relative flex gap-4">
                        <span className="grot num relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-[var(--r-card)] bg-ink text-[26px] text-on-ink">
                          {String(m.n).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <h3 className="grot text-[22px] leading-[1]">{m.module}</h3>
                          <p className="mt-1.5 text-[13px] leading-snug text-text-2">{m.summary}</p>
                          <div className="mt-3 flex items-center gap-2.5">
                            <ProgressRing value={pct} size={34} stroke={4} color={pct === 100 ? 'var(--accent)' : pct === 0 ? 'var(--paper-400)' : 'var(--brass)'}>
                              <span className="num text-[10px] font-bold">{built}</span>
                            </ProgressRing>
                            <span className="text-[12px] font-semibold text-text-2">
                              {built} of {m.features.length} in the prototype
                            </span>
                          </div>
                          <span className={`label mt-2.5 inline-flex h-6 items-center rounded-full px-2.5 ${m.source === 'chat' ? 'bg-info-soft text-on-info-soft' : 'bg-accent-soft text-[var(--on-accent-soft)]'}`}>{m.source === 'chat' ? 'From the Fiverr chat' : 'From the call'}</span>
                        </div>
                      </div>
                      <ul className="flex flex-col">
                        {m.shown.map((x) => (
                          <FeatureRow key={x.key} n={m.features.indexOf(x) + 1} x={x} onJump={onJump} phone={phone} />
                        ))}
                      </ul>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </motion.ol>
          )}
        </div>

        {/* closing */}
        <footer className={`grid items-center rounded-[var(--r-container)] bg-accent text-on-accent ${phone ? "mx-4 mb-28 grid-cols-1 gap-4 px-5 py-6" : "mx-10 mb-10 grid-cols-[1fr_auto] gap-8 px-8 py-7"}`}>
          <p className="grot text-[28px] leading-[1.02]">
            {INDEX_COUNTS.features} statements across {INDEX_COUNTS.modules} modules, from the Fiverr chat and the call. {INDEX_COUNTS.mapped} are clickable in this prototype; the {INDEX_COUNTS.notBuilt} that are not are listed with the reason.
          </p>
          <p className="max-w-[300px] text-[13px] font-medium leading-relaxed text-[var(--on-accent-2)]">
            Module 00 is what Dave wrote in the Fiverr order request; every other line is a thing Dave or Kushal said on the 9 Nov call. The written proposal carries the commercial lines.
          </p>
        </footer>
      </div>
    </motion.div>
  )
}

function FeatureRow({ n, x, onJump, phone }: { n: number; x: IndexedFeature; onJump: (id: ScreenId) => void; phone: boolean }) {
  if ('screen' in x.ref) {
    const id = x.ref.screen
    const p = platformOf(id)
    const s = SCREEN_FEATURES[id]
    return (
      <li>
        <motion.button
          type="button"
          onClick={() => onJump(id)}
          whileTap={{ scale: 0.99 }}
          transition={spring.ui}
          className={`group grid w-full items-start gap-x-3 gap-y-2 rounded-[var(--r-card)] px-3 py-3 text-left transition-colors duration-150 hover:bg-[var(--surface-raised)] ${phone ? 'grid-cols-[28px_1fr]' : 'grid-cols-[28px_1fr_auto]'}`}
        >
          <span className="relative flex items-center gap-1.5 pt-0.5">
            <span aria-hidden className="h-[18px] w-[3px] rounded-full" style={{ background: personaColor(p) }} />
            <span className="num text-[12px] font-bold text-text-2">{n}</span>
          </span>
          <span className="text-[15px] leading-snug text-text">{x.text}</span>
          <span className={`flex items-center gap-2 ${phone ? "col-start-2" : "pl-3"}`}>
            <Mark size={18} />
            <span className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--surface-high)] pl-3 pr-1.5 text-[12px] font-bold text-text transition-colors duration-150 group-hover:bg-ink group-hover:text-on-ink">
              {s.title}
              <span className="font-medium text-text-2 group-hover:text-on-ink-2">· {s.persona}</span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--surface)] text-text">
                <ArrowUpRight size={12} strokeWidth={2.6} />
              </span>
            </span>
          </span>
        </motion.button>
      </li>
    )
  }
  return (
    <li className={`grid items-start gap-x-3 gap-y-2 px-3 py-3 ${phone ? "grid-cols-[28px_1fr]" : "grid-cols-[28px_1fr_auto]"}`}>
      <span className="flex items-center gap-1.5 pt-0.5">
        <span aria-hidden className="h-[18px] w-[3px] rounded-full bg-[var(--paper-400)]" />
        <span className="num text-[12px] font-bold text-text-2">{n}</span>
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-[15px] leading-snug text-text-2">{x.text}</span>
        <span className="text-[13px] text-text-2">{x.ref.notBuilt}</span>
      </span>
      <span className={`label inline-flex h-7 w-fit items-center whitespace-nowrap rounded-full px-3 text-text-2 ring-1 ring-inset ring-[var(--rule-strong)] ${phone ? "col-start-2" : ""}`}>Not built in this prototype</span>
    </li>
  )
}
