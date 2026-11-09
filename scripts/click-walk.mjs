/**
 * Dead-click walk.
 *
 * For every screen, every visible button is pressed from a fresh load. A press
 * must produce one of: a screen change (hash), a DOM change (overlay, toggle,
 * filter, toast), or nothing only if the control is the already-active tab.
 * Reports the total count of interactive elements and every dead one.
 *
 * Usage: node scripts/click-walk.mjs <baseUrl>
 */
import { chromium, devices } from 'playwright'
import { existsSync } from 'node:fs'
const LAUNCH = existsSync(process.env.HOME + '/Library/Caches/ms-playwright') ? {} : { channel: 'chrome' }
import { readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5282'
const src = readFileSync(new URL('../src/lib/navigation.ts', import.meta.url), 'utf8')
const PREFIX = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : ''
const SCREENS = [...src.matchAll(/^\s{2}'((?:app|pro|vendor|admin)\.[a-zA-Z]+)',$/gm)].map((m) => m[1]).filter((s) => s.startsWith(PREFIX))

const browser = await chromium.launch(LAUNCH)
const PHONE = process.argv.includes('--phone')
const ctx = PHONE ? await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }) : await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

const dead = []
const loadFailures = []
let total = 0
const perScreen = {}

const load = async (id) => {
  // ~500 full reloads in one run: the dev server occasionally stalls on one,
  // so a single retry keeps a transient hiccup from aborting the whole walk.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto('about:blank')
      await page.goto(`${BASE}/#/${id.replace('.', '/')}`, { waitUntil: 'load' })
      await page.waitForSelector('[data-stage-frame]', { timeout: 15000 })
      await page.waitForTimeout(700)
      return true
    } catch (e) {
      if (attempt === 1) {
        loadFailures.push(`${id}: ${String(e.message).split('\n')[0].slice(0, 70)}`)
        return false
      }
      await page.waitForTimeout(2000)
    }
  }
  return false
}

/** visible, enabled controls inside the device frame (viewer chrome excluded) */
const listControls = () =>
  page.evaluate(() => {
    const frame = document.querySelector('[data-stage-frame]')
    const els = [...frame.querySelectorAll('button, input[type=checkbox], [role=switch]')]
    return els
      .map((el, i) => {
        const r = el.getBoundingClientRect()
        const st = getComputedStyle(el)
        const visible = r.width > 4 && r.height > 4 && st.visibility !== 'hidden' && st.display !== 'none' && parseFloat(st.opacity) > 0.05
        // controls clipped out of a scroll container are still reachable by scrolling; keep them
        return { i, visible, label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), disabled: el.hasAttribute('disabled') }
      })
      .filter((c) => c.visible && !c.disabled)
  })

for (const id of SCREENS) {
    if (!(await load(id))) {
    process.stderr.write(`  ${id} SKIPPED (could not load)\n`)
    continue
  }
  const controls = await listControls()
  perScreen[id] = controls.length
  total += controls.length
  process.stderr.write(`  ${id} (${controls.length})\n`) // progress, so a stall is visible

  for (const c of controls) {
    if (!(await load(id))) continue
    let before, handle
    try {
      await page.waitForTimeout(150)
      before = await page.evaluate(() => ({ hash: location.hash, html: document.querySelector('[data-stage-frame]')?.innerHTML.length ?? 0, text: document.body.innerText }))
      await page.waitForSelector('[data-stage-frame]', { timeout: 15000 }).catch(() => {})
      handle = await page.evaluateHandle((i) => {
        const frame = document.querySelector('[data-stage-frame]')
        if (!frame) return null
        return [...frame.querySelectorAll('button, input[type=checkbox], [role=switch]')][i] ?? null
      }, c.i)
    } catch {
      loadFailures.push(`${id}: page reloaded before "${c.label}" could be pressed`)
      continue
    }
    if (!handle.asElement()) {
      dead.push(`${id}: could not find "${c.label}" after reload`)
      continue
    }
    try {
      await handle.asElement().evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }))
      await page.waitForTimeout(120)
      await handle.asElement().click({ timeout: 2500, force: true })
    } catch (e) {
      dead.push(`${id}: could not click "${c.label}" (${String(e.message).split('\n')[0].slice(0, 60)})`)
      continue
    }
    await page.waitForTimeout(450)
    // a click that navigates the document (or a dev-server reload) destroys the context; count it as a change
    const after = await page.evaluate(() => ({ hash: location.hash, html: document.querySelector('[data-stage-frame]')?.innerHTML.length ?? 0, text: document.body.innerText })).catch(() => ({ hash: 'navigated', html: -1, text: '' }))
    const changed = before.hash !== after.hash || before.html !== after.html || before.text !== after.text
    if (!changed) dead.push(`${id}: "${c.label}" did nothing`)
  }
}

await browser.close()

console.log(`Screens walked         : ${Object.keys(perScreen).length}`)
console.log(`Interactive elements   : ${total}`)
console.log(`Dead clicks            : ${dead.length}`)
console.log(`Page errors            : ${errors.length}`)
console.log(`Load failures          : ${loadFailures.length}\n`)
Object.entries(perScreen).forEach(([k, v]) => console.log(`  ${k.padEnd(28)} ${v}`))
console.log('')
if (dead.length) {
  console.log('DEAD OR UNCLICKABLE')
  ;[...new Set(dead)].forEach((d) => console.log(`  - ${d}`))
}
if (loadFailures.length) {
  console.log('LOAD FAILURES (harness, not the product)')
  ;[...new Set(loadFailures)].forEach((d) => console.log(`  - ${d}`))
}
if (errors.length) {
  console.log('PAGE ERRORS')
  ;[...new Set(errors)].slice(0, 20).forEach((e) => console.log(`  - ${e}`))
}
