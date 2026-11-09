/** PHONE-BROWSER AUDIT (v5).
 *  - viewer mode at each phone viewport (phone) and at 768+ (desktop), ?view= override both ways
 *  - no device frame in phone mode
 *  - zero horizontal scroll on every screen at every viewport
 *  - chrome: platform sheet switches platforms, Features sheet shows the current screen and updates, credit in sheet footer
 *  Usage: node scripts/phone-audit.mjs <baseUrl> */
import { chromium, devices } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5282'
const src = readFileSync(new URL('../src/lib/navigation.ts', import.meta.url), 'utf8')
const SCREENS = [...src.matchAll(/^\s{2}'((?:app|pro|vendor|admin)\.[a-zA-Z]+)',$/gm)].map((m) => m[1])
const VIEWPORTS = [[360, 780], [375, 667], [390, 844], [393, 852], [412, 915], [430, 932], [844, 390]]
const browser = await browser_()
async function browser_() {
  return chromium.launch()
}
const fails = []
const ctxFor = (w, h) => browser.newContext({ ...devices['iPhone 13'], viewport: { width: w, height: h } })
const isPhone = (p) => p.evaluate(() => !!document.querySelector('[data-phone-app]') || location.hash === '#/features' && !document.querySelector('[data-stage-frame]:not([data-phone-app])') && innerWidth < 900)
const frameShown = (p) => p.evaluate(() => [...document.querySelectorAll('*')].some((e) => e.textContent === '9:41' && e.children.length === 0))

/* 1. mode detection + override */
for (const [w, h] of [...VIEWPORTS, [768, 1024], [1280, 800]]) {
  const ctx = w >= 768 && h > 500 ? await browser.newContext({ viewport: { width: w, height: h } }) : await ctxFor(w, h)
  const p = await ctx.newPage()
  await p.goto(`${BASE}/#/app/explore`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  const phone = await isPhone(p)
  const want = !(w >= 768 && h > 500)
  console.log(`mode ${w}x${h}: ${phone ? 'phone' : 'desktop'} ${phone === want ? 'OK' : 'WRONG'}${phone ? ` · device frame ${(await frameShown(p)) ? 'SHOWN' : 'none'}` : ''}`)
  if (phone !== want) fails.push(`mode wrong at ${w}x${h}`)
  if (phone && (await frameShown(p))) fails.push(`device frame shown in phone mode at ${w}x${h}`)
  await ctx.close()
}
for (const [w, h, q, want] of [[390, 844, 'view=desktop', false], [1280, 800, 'view=phone', true]]) {
  const ctx = w < 768 ? await ctxFor(w, h) : await browser.newContext({ viewport: { width: w, height: h } })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/?${q}#/app/explore`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  const phone = await isPhone(p)
  console.log(`override ?${q} at ${w}px: ${phone ? 'phone' : 'desktop'} ${phone === want ? 'OK' : 'WRONG'}`)
  if (phone !== want) fails.push(`override ?${q} failed`)
  await ctx.close()
}

/* 2. horizontal scroll on every screen at every viewport */
let hsCount = 0
const hsBad = new Set()
for (const [w, h] of VIEWPORTS) {
  const ctx = await ctxFor(w, h)
  const p = await ctx.newPage()
  for (const id of [...SCREENS, 'features']) {
    await p.goto('about:blank')
    await p.goto(`${BASE}/#/${id === 'features' ? 'features' : id.replace('.', '/')}`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(450)
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, bw: document.body.scrollWidth }))
    hsCount++
    if (r.sw > r.iw || r.bw > r.iw) hsBad.add(`${id} @${w}x${h} (${r.sw}>${r.iw})`)
  }
  await ctx.close()
}
console.log(`horizontal scroll: ${hsCount} screen-renders checked across ${VIEWPORTS.length} viewports · overflowing: ${hsBad.size}`)
hsBad.forEach((x) => console.log('  ' + x))
if (hsBad.size) fails.push(`${hsBad.size} screen-renders scroll sideways`)

/* 3. chrome by touch */
{
  const ctx = await ctxFor(390, 844)
  const p = await ctx.newPage()
  await p.goto(`${BASE}/#/app/messages`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.getByRole('button', { name: /^Features on this screen/ }).click()
  await p.waitForTimeout(700)
  const t1 = await p.getByRole('dialog', { name: 'Features on this screen' }).innerText()
  const credit1 = /Presented by[\s\S]*Kushaal Khanna/i.test(t1)
  await p.getByRole('dialog', { name: 'Features on this screen' }).getByRole('button', { name: 'Close' }).last().click()
  await p.waitForTimeout(500)
  await p.locator('[data-stage-frame] nav[aria-label="Main"]').getByRole('button', { name: /^Explore/ }).first().click()
  await p.waitForTimeout(900)
  await p.getByRole('button', { name: /^Features on this screen/ }).click()
  await p.waitForTimeout(700)
  const t2 = await p.getByRole('dialog', { name: 'Features on this screen' }).innerText()
  const updates = t1 !== t2 && /Explore the marketplace/i.test(t2)
  await p.getByRole('dialog', { name: 'Features on this screen' }).getByRole('button', { name: 'Close' }).last().click()
  await p.waitForTimeout(500)
  await p.getByRole('button', { name: /^Platform:/ }).click()
  await p.waitForTimeout(700)
  const sheetText = await p.getByRole('dialog', { name: 'Switch platform' }).innerText()
  const credit2 = /Presented by[\s\S]*Kushaal Khanna/i.test(sheetText)
  await p.getByRole('dialog', { name: 'Switch platform' }).getByRole('button', { name: /Edera Admin/ }).click()
  await p.waitForTimeout(900)
  const toAdmin = (await p.evaluate(() => location.hash)).startsWith('#/admin/')
  await p.getByRole('button', { name: /^Platform:/ }).click()
  await p.waitForTimeout(700)
  await p.getByRole('dialog', { name: 'Switch platform' }).getByRole('button', { name: /Full Feature List/ }).click()
  await p.waitForTimeout(900)
  const toList = (await p.evaluate(() => location.hash)) === '#/features'
  console.log(`chrome: features sheet shows screen ${/Inbox/i.test(t1) ? 'OK' : 'NO'} · updates on navigation ${updates ? 'OK' : 'NO'} · credit in features sheet ${credit1 ? 'OK' : 'NO'} · credit in platform sheet ${credit2 ? 'OK' : 'NO'} · switch to admin ${toAdmin ? 'OK' : 'NO'} · full feature list ${toList ? 'OK' : 'NO'}`)
  if (!(updates && credit1 && credit2 && toAdmin && toList)) fails.push('phone chrome check failed')
  await ctx.close()
}

await browser.close()
console.log(fails.length ? `PHONE AUDIT FAILURES:\n  ${fails.join('\n  ')}` : 'PHONE AUDIT OK')
