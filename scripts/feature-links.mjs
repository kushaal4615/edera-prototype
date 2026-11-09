/** Full Feature List link check: clicks every "In the prototype" row and confirms it lands on the screen it names.
 *  Also checks the view fits the stage, hides the feature panel and keeps the credit clear, at three viewports.
 *  Usage: node scripts/feature-links.mjs <baseUrl> */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5282'
const src = readFileSync(new URL('../src/data/featureIndex.ts', import.meta.url), 'utf8')
const body = src.slice(src.indexOf('export const FEATURE_INDEX'))
const expected = [...body.matchAll(/\{ screen: '([a-zA-Z.]+)' \}/g)].map((m) => m[1])
const browser = await chromium.launch()
let fails = 0

for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage()
  await page.goto(`${BASE}/#/features`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const g = await page.evaluate(() => ({
    pageScroll: document.documentElement.scrollHeight > innerHeight + 1 || document.body.scrollHeight > innerHeight + 1,
    panel: !!document.querySelector('aside[aria-label="Features on this screen"]'),
    frame: !!document.querySelector('[data-stage-frame]'),
    credit: [...document.querySelectorAll('.glass')].some((e) => e.textContent.includes('Presented by')),
  }))
  const ok = !g.pageScroll && !g.panel && !g.frame && g.credit
  if (!ok) fails++
  console.log(`${w}x${h}: page scroll ${g.pageScroll ? 'YES' : 'no'} · feature panel ${g.panel ? 'SHOWN' : 'hidden'} · frame ${g.frame ? 'SHOWN' : 'replaced'} · credit ${g.credit ? 'present' : 'MISSING'} ${ok ? 'OK' : 'FAIL'}`)
  await page.context().close()
}

const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
let clicked = 0
for (let i = 0; i < expected.length; i++) {
  await page.goto('about:blank')
  await page.goto(`${BASE}/#/features`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const rows = page.locator('main, body').locator('ul > li > button')
  const n = await rows.count()
  if (n !== expected.length) {
    console.log(`row count ${n} does not match ${expected.length} mapped features in the index`)
    fails++
    break
  }
  await rows.nth(i).scrollIntoViewIfNeeded()
  await rows.nth(i).click()
  await page.waitForTimeout(600)
  const hash = await page.evaluate(() => location.hash)
  const want = `#/${expected[i].replace('.', '/')}`
  clicked++
  if (hash !== want) {
    fails++
    console.log(`  row ${i + 1}: expected ${want}, landed on ${hash}`)
  }
}
console.log(`links clicked ${clicked}/${expected.length} · misses ${fails}`)
console.log(fails ? 'FEATURE LIST FAILURES' : 'FEATURE LIST OK')
await browser.close()
