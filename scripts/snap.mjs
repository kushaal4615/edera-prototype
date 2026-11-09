/** Quick screenshots: node scripts/snap.mjs <outdir> <hash> [<hash> ...] [--phone] [--scroll=N] */
import { chromium, devices } from 'playwright'
const args = process.argv.slice(2)
const out = args[0]
const phone = args.includes('--phone')
const scroll = Number((args.find((a) => a.startsWith('--scroll=')) || '--scroll=0').split('=')[1])
const hashes = args.slice(1).filter((a) => !a.startsWith('--'))
const browser = await chromium.launch()
const ctx = phone ? await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }) : await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
for (const h of hashes) {
  await page.goto(`http://localhost:5282/#/${h}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  if (scroll) {
    await page.evaluate((y) => { const m = document.querySelector('[data-stage-frame] main'); if (m) m.scrollTop = y }, scroll)
    await page.waitForTimeout(500)
  }
  await page.screenshot({ path: `${out}/${h.replace(/\//g, '_')}${scroll ? '_s' + scroll : ''}${phone ? '_phone' : ''}.png` })
}
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no errors')
await browser.close()
