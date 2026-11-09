/**
 * Visual and behavioural audit.
 *
 * Walks every registered screen in a real browser and checks the things the
 * static checker cannot see:
 *   - no page-level scrollbar, and the whole device frame is visible
 *   - no console errors
 *   - no element stranded at opacity 0
 *   - no text below 4.5:1 against its actual rendered background
 *   - no overlapping interactive elements
 *   - the presenter credit is present, legible, and clear of the frame
 *
 * Usage: node scripts/audit.mjs <baseUrl> [--shots]
 */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
const LAUNCH = existsSync(process.env.HOME + '/Library/Caches/ms-playwright') ? {} : { channel: 'chrome' }
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5282'
const SHOTS = process.argv.includes('--shots')
const VIEWPORTS = [
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
  { w: 1920, h: 1080 },
]

const screensSrc = readFileSync(new URL('../src/lib/navigation.ts', import.meta.url), 'utf8')
const SCREENS = [...screensSrc.matchAll(/^\s{2}'((?:app|pro|vendor|admin)\.[a-zA-Z]+)',$/gm)].map((m) => m[1])

if (SHOTS) mkdirSync(new URL('../audit-shots', import.meta.url).pathname, { recursive: true })

/** Runs inside the page. Returns every defect it can measure from the DOM. */
const PROBE = () => {
  const out = { contrast: [], overlay: [], invisible: [], overlap: [], credit: null, tiny: [] }

  const parseRGB = (c) => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null
  }
  const lin = (c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  })
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }

  const bgOf = (el) => {
    let node = el
    let acc = null
    while (node && node !== document.documentElement) {
      const st = getComputedStyle(node)
      const c = parseRGB(st.backgroundColor)
      const hasImage = st.backgroundImage && st.backgroundImage !== 'none'
      if (hasImage) return { color: null, image: true }
      if (c && c.a > 0) {
        acc = acc ? over(acc, c) : c
        if (acc.a >= 0.99) return { color: acc, image: false }
      }
      node = node.parentElement
    }
    return { color: acc ?? { r: 255, g: 255, b: 255, a: 1 }, image: false }
  }

  const label = (el) => {
    const t = (el.textContent ?? '').trim().slice(0, 42)
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : ''} "${t}"`
  }

  for (const el of document.querySelectorAll('*')) {
    const st = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    if (st.visibility === 'hidden' || st.display === 'none') continue

    if (parseFloat(st.opacity) < 0.06 && el.getAttribute('aria-hidden') !== 'true') {
      const decorative = el.className && typeof el.className === 'string' && /pointer-events-none/.test(el.className)
      if (!decorative && (el.textContent ?? '').trim().length > 0) {
        out.invisible.push(label(el))
      }
    }

    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
    if (!ownText) continue
    if (el.getAttribute('aria-hidden') === 'true') continue
    if (parseFloat(st.opacity) < 0.99) continue
    if (typeof el.className === 'string' && /\bsr-only\b/.test(el.className)) continue

    const fg = parseRGB(st.color)
    if (!fg) continue
    const siblingLayer = (() => {
      let node = el
      for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
        for (const sib of node.parentElement?.children ?? []) {
          if (sib === node) continue
          const ss = getComputedStyle(sib)
          if (ss.position !== 'absolute') continue
          const paints = (parseRGB(ss.backgroundColor)?.a ?? 0) > 0.15 || (ss.backgroundImage && ss.backgroundImage !== 'none')
          if (paints) return true
        }
      }
      return false
    })()

    const bg = bgOf(el)
    if (bg.image) continue
    const r = ratio(over(fg, bg.color), bg.color)
    const size = parseFloat(st.fontSize)
    if (r < 4.5) {
      const bucket = siblingLayer ? 'overlay' : 'contrast'
      out[bucket].push({ el: label(el), ratio: +r.toFixed(2), size, color: st.color })
    }
    if (size < 10) out.tiny.push({ el: label(el), size })
  }

  const visibleRect = (el) => {
    let r = el.getBoundingClientRect()
    let node = el.parentElement
    while (node && node !== document.documentElement) {
      const st = getComputedStyle(node)
      if (/auto|scroll|hidden/.test(st.overflowY + st.overflowX)) {
        const nr = node.getBoundingClientRect()
        const top = Math.max(r.top, nr.top)
        const bottom = Math.min(r.bottom, nr.bottom)
        const left = Math.max(r.left, nr.left)
        const right = Math.min(r.right, nr.right)
        if (bottom <= top || right <= left) return null
        r = { top, bottom, left, right, width: right - left, height: bottom - top }
      }
      node = node.parentElement
    }
    return r
  }

  const inStickyBar = (el) => {
    let node = el
    while (node && node !== document.documentElement) {
      const st = getComputedStyle(node)
      if (st.position === 'sticky' || st.position === 'fixed') {
        if ((parseRGB(st.backgroundColor)?.a ?? 0) > 0.5 || st.backdropFilter !== 'none') return true
      }
      // floating docks and tab bars: content scrolls under them by design
      if (node.hasAttribute('data-dock')) return true
      node = node.parentElement
    }
    return false
  }

  const controls = [...document.querySelectorAll('button, a[href], input, select, textarea')]
    .map((el) => ({ el, rect: visibleRect(el) }))
    .filter((c) => c.rect && c.rect.width > 1 && c.rect.height > 1)
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      const { el: a, rect: ra } = controls[i]
      const { el: b, rect: rb } = controls[j]
      if (a.contains(b) || b.contains(a)) continue
      if (inStickyBar(a) !== inStickyBar(b)) continue
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
      const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
      if (ox > 2 && oy > 2) {
        out.overlap.push(`${label(a)} overlaps ${label(b)}`)
      }
    }
  }

  const creditMatches = [...document.querySelectorAll('div')].filter((d) => (d.textContent ?? '').includes('Kushaal Khanna'))
  const credit = creditMatches[creditMatches.length - 1]
  if (!credit) {
    out.credit = { present: false }
  } else {
    const rc = credit.getBoundingClientRect()
    const cs = getComputedStyle(credit)
    const frame = document.querySelector('[data-stage-frame]')
    const fr = frame ? frame.getBoundingClientRect() : null
    const overlapsFrame = fr && Math.min(rc.right, fr.right) - Math.max(rc.left, fr.left) > 2 && Math.min(rc.bottom, fr.bottom) - Math.max(rc.top, fr.top) > 2
    out.credit = {
      present: true,
      pointerEvents: cs.pointerEvents,
      overlapsFrame: !!overlapsFrame,
      rect: { x: Math.round(rc.x), y: Math.round(rc.y), w: Math.round(rc.width) },
    }
  }

  return out
}

const browser = await chromium.launch(LAUNCH)
const results = []
const fail = []
let totalErrors = 0

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } })
  // the endpoint is live: an audit must never write rows to the real sheet
  await ctx.route('https://script.google.com/**', (r) => r.abort())
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

  for (const id of SCREENS) {
    consoleErrors.length = 0
    await page.goto('about:blank')
    await page.goto(`${BASE}/#/${id.replace('.', '/')}`, { waitUntil: 'networkidle' })
    // let entrances settle; the voice screen types its transcript, the splash auto-advances after 2.4s
    await page.waitForTimeout(900)

    const shown = await page.evaluate(() => location.hash.replace(/^#\//, '').replace('/', '.'))
    if (shown !== id && true) {
      results.push({ vp: `${vp.w}x${vp.h}`, id, wrongScreen: shown, probe: { contrast: [], overlay: [], invisible: [], overlap: [], tiny: [], credit: { present: true, pointerEvents: 'none', overlapsFrame: false } }, layout: { frameFits: true }, errors: [] })
      continue
    }

    const probe = await page.evaluate(PROBE)
    const layout = await page.evaluate(() => {
      const de = document.documentElement
      const scaled = document.querySelector('[data-stage-frame]')
      let frameFits = true
      let frameBox = null
      if (scaled) {
        const r = scaled.getBoundingClientRect()
        frameBox = { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }
        frameFits = r.top >= -1 && r.bottom <= window.innerHeight + 1 && r.height > 40
      }
      return {
        pageScrollY: de.scrollHeight > de.clientHeight + 1,
        pageScrollX: de.scrollWidth > de.clientWidth + 1,
        frameFits,
        frameBox,
      }
    })

    const errors = consoleErrors.filter((e) => !/favicon|Download the React DevTools|net::ERR_/i.test(e))
    totalErrors += errors.length
    results.push({ vp: `${vp.w}x${vp.h}`, id, probe, layout, errors })

    if (SHOTS && vp.w === 1440) {
      await page.screenshot({ path: new URL(`../audit-shots/${id}.png`, import.meta.url).pathname })
    }
  }
  await ctx.close()
}
await browser.close()

const seenContrast = new Map()
for (const r of results) {
  const p = `${r.id} @ ${r.vp}`
  if (r.wrongScreen) {
    fail.push(`${p}: RENDERED THE WRONG SCREEN (${r.wrongScreen})`)
    continue
  }
  if (r.layout.pageScrollY) fail.push(`${p}: PAGE SCROLLS VERTICALLY`)
  if (r.layout.pageScrollX) fail.push(`${p}: PAGE SCROLLS HORIZONTALLY`)
  if (!r.layout.frameFits) fail.push(`${p}: FRAME CLIPPED ${JSON.stringify(r.layout.frameBox)}`)
  r.errors.forEach((e) => fail.push(`${p}: CONSOLE ${e.slice(0, 160)}`))
  r.probe.invisible.forEach((e) => fail.push(`${p}: INVISIBLE ${e}`))
  r.probe.overlap.forEach((e) => fail.push(`${p}: OVERLAP ${e}`))
  if (!r.probe.credit?.present) fail.push(`${p}: PRESENTER CREDIT MISSING`)
  else {
    if (r.probe.credit.pointerEvents !== 'none') fail.push(`${p}: CREDIT pointer-events is ${r.probe.credit.pointerEvents}`)
    if (r.probe.credit.overlapsFrame) fail.push(`${p}: CREDIT OVERLAPS FRAME`)
  }
  for (const c of r.probe.contrast) {
    const key = `${c.el}|${c.ratio}`
    if (!seenContrast.has(key)) seenContrast.set(key, { ...c, where: p })
  }
  r.probe.tiny.forEach((t) => fail.push(`${p}: TEXT ${t.size}px ${t.el}`))
}

console.log(`Screens audited : ${SCREENS.length} x ${VIEWPORTS.length} viewports = ${results.length} renders`)
console.log(`Console errors  : ${totalErrors}`)
console.log(`Contrast issues : ${seenContrast.size} unique`)
const overlayCount = results.reduce((n, r) => n + (r.probe.overlay?.length ?? 0), 0)
console.log(`Overlay-backed  : ${overlayCount} (background from a sibling layer, checked by hand)`)
console.log(`Other failures  : ${fail.length}`)
console.log('')
if (seenContrast.size) {
  console.log('CONTRAST BELOW 4.5:1')
  for (const c of [...seenContrast.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 50)) {
    console.log(`  ${String(c.ratio).padStart(5)}:1  ${c.size}px  ${c.color}  ${c.where}  ${c.el}`)
  }
  console.log('')
}
if (overlayCount) {
  console.log('OVERLAY-BACKED (verify by hand)')
  const seen = new Set()
  for (const r of results) for (const o of r.probe.overlay ?? []) {
    const k = `${r.id} ${o.el} ${o.ratio}`
    if (seen.has(k)) continue
    seen.add(k)
    if (seen.size <= 30) console.log(`  ${String(o.ratio).padStart(5)}:1  ${o.size}px  ${r.id}  ${o.el}`)
  }
  console.log('')
}
if (fail.length) {
  console.log('OTHER FAILURES')
  const uniq = [...new Set(fail)]
  uniq.slice(0, 80).forEach((f) => console.log(`  - ${f}`))
  if (uniq.length > 80) console.log(`  ... and ${uniq.length - 80} more`)
} else {
  console.log('No layout, console, visibility, overlap, or credit failures.')
}
