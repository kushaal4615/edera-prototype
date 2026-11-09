import { FEATURE_INDEX } from '../data/featureIndex'
import { ALL_SCREENS, LINKS, PLATFORMS, platformOf, type ScreenId } from './navigation'

/* Proves the screen graph: every ScreenId is reachable from its
   platform's entry through in-app links, every link target is
   registered, and every feature-index row points at a real screen.
   Runs at dev start (main.tsx) and from scripts/check-graph.mjs. */

export function reachabilityReport() {
  const errors: string[] = []
  const reached = new Set<ScreenId>()
  for (const p of PLATFORMS) {
    const queue: ScreenId[] = [p.entry]
    while (queue.length) {
      const id = queue.shift()!
      if (reached.has(id)) continue
      reached.add(id)
      for (const next of LINKS[id] ?? []) {
        if (!ALL_SCREENS.includes(next)) errors.push(`${id} links to unregistered ${next}`)
        else if (platformOf(next) === platformOf(id)) queue.push(next)
      }
    }
  }
  const orphans = ALL_SCREENS.filter((id) => !reached.has(id))
  for (const o of orphans) errors.push(`orphan: ${o} is not reachable from its platform entry`)
  for (const m of FEATURE_INDEX)
    for (const f of m.features) if ('screen' in f.ref && !ALL_SCREENS.includes(f.ref.screen)) errors.push(`feature "${f.text}" points at unregistered ${f.ref.screen}`)
  return { screens: ALL_SCREENS.length, reached: reached.size, orphans, errors }
}

export function assertReachability() {
  const r = reachabilityReport()
  if (r.errors.length) console.error('[NAV GRAPH]', r.errors)
  else console.info(`[NAV GRAPH] ${r.reached}/${r.screens} screens reachable, no orphans`)
}
