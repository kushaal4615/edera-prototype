/** Density audit: scroll depth vs frame, photographs, controls, distinct component kinds and richness signals per screen.
 *  Usage: node scripts/density.mjs <baseUrl>   (run against `npm run dev`) */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5282'
const src = readFileSync(new URL('../src/lib/navigation.ts', import.meta.url), 'utf8')
const SCREENS = [...src.matchAll(/^\s{2}'((?:app|pro|vendor|admin)\.[a-zA-Z]+)',$/gm)].map((m) => m[1])
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const rows = []
for (const id of SCREENS) {
  await page.goto('about:blank')
  await page.goto(`${BASE}/#/${id.replace('.', '/')}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const r = await page.evaluate(() => {
    const frame = document.querySelector('[data-stage-frame]')
    const isPhone = frame.getBoundingClientRect().width < 900
    const scrollers = [...frame.querySelectorAll('main, .scroll-y')]
    const deepest = Math.max(frame.scrollHeight, ...scrollers.map((s) => s.scrollHeight))
    const depth = +(deepest / (isPhone ? 852 : 820)).toFixed(2)
    const q = (sel) => frame.querySelector(sel)
    const qa = (sel) => frame.querySelectorAll(sel)
    const imgs = [...qa('img')].filter((i) => i.getBoundingClientRect().width > 60).length
    const avatars = [...qa('img')].filter((i) => i.getBoundingClientRect().width <= 60).length
    const kinds = new Set()
    if (imgs) kinds.add('photo')
    if (avatars) kinds.add('avatar')
    if (q('.recharts-wrapper')) kinds.add('chart')
    if (q('svg path[stroke-linecap="round"]')) kinds.add('sharpie/line')
    if (q('svg circle')) kinds.add('ring/dot')
    if (q('.label.rounded-full, .label.inline-flex')) kinds.add('badge')
    if (q('.display, .play.num')) kinds.add('numeral')
    if (q('[role=switch]')) kinds.add('toggle')
    if (q('textarea, input')) kinds.add('input')
    if (q('.scroll-x')) kinds.add('rail')
    if (q('table')) kinds.add('table')
    if (q('[role=tablist]')) kinds.add('segmented')
    if (q('.sheet-grid, .grid')) kinds.add('grid')
    if (q('.bg-ink, .bg-night, .bg-accent, .bg-tint, .bg-accent-soft')) kinds.add('colour-band')
    if (q('nav')) kinds.add('nav')
    if (qa('li').length > 3) kinds.add('list')
    if (q('.arch, .arch-full')) kinds.add('arch')
    const text = frame.innerText
    const signals = new Set()
    if (imgs) signals.add('photo')
    if (q('svg path, .recharts-wrapper')) signals.add('micro-chart')
    if (/[+−-]\d/.test(text) && /%|pts|vs|this week/i.test(text)) signals.add('delta')
    if (/\b(\d+[mh]|Sun|Sat|Oct \d+|ago|now)\b/.test(text)) signals.add('metadata')
    if (/pending|open|unread|late|expir|awaiting|needs review|in review|under offer|held|flagged|draft|due|restricted|suspended|invited|phase 2|coming/i.test(text)) signals.add('state')
    if (/\+\s?[\d,]+\s+(more|older|others)|see all|view all|load more/i.test(text) || q('.scroll-x')) signals.add('overflow')
    return { depth, imgs, avatars, buttons: qa('button').length, kinds: kinds.size, kindList: [...kinds].join(','), signals: signals.size }
  })
  rows.push({ id, ...r })
}
await browser.close()
for (const r of rows) console.log(`${r.id.padEnd(24)} depth ${String(r.depth).padStart(5)}x  photos ${String(r.imgs).padStart(2)}  avatars ${String(r.avatars).padStart(2)}  buttons ${String(r.buttons).padStart(3)}  kinds ${String(r.kinds).padStart(2)}  signals ${r.signals}`)
const mob = rows.filter((r) => r.id.startsWith('app'))
const adm = rows.filter((r) => !r.id.startsWith('app'))
console.log(`\nscreens ${rows.length} · with photography ${rows.filter((r) => r.imgs > 0).length} (${Math.round((rows.filter((r) => r.imgs > 0).length / rows.length) * 100)}%)`)
console.log(`mobile kinds<5: ${mob.filter((r) => r.kinds < 5).map((r) => r.id).join(', ') || 'none'} · console kinds<7: ${adm.filter((r) => r.kinds < 7).map((r) => r.id).join(', ') || 'none'}`)
console.log(`signals<3: ${rows.filter((r) => r.signals < 3).map((r) => r.id).join(', ') || 'none'}`)
console.log(`mobile depth<1.6: ${mob.filter((r) => r.depth < 1.6).map((r) => `${r.id} ${r.depth}`).join(', ') || 'none'}`)
