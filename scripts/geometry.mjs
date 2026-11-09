/** Geometry probe: frame centre vs window centre, frame right edge vs panel left edge, panel bottom vs credit, at three viewports, open and collapsed. */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
const LAUNCH = existsSync(process.env.HOME + '/Library/Caches/ms-playwright') ? {} : { channel: 'chrome' }
const BASE = process.argv[2] ?? 'http://localhost:5282'
const browser = await chromium.launch(LAUNCH)
let fail = 0
for (const vp of [[1280, 800], [1440, 900], [1920, 1080]]) {
  const page = await (await browser.newContext({ viewport: { width: vp[0], height: vp[1] } })).newPage()
  for (const id of ['app/welcome', 'app/home', 'pro/home', 'admin/signin', 'admin/overview']) {
    await page.goto('about:blank'); await page.goto(`${BASE}/#/${id}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
    for (const state of ['open', 'collapsed']) {
      const want = state === 'collapsed' ? 'Expand feature panel' : 'Collapse feature panel'
      if (!(await page.getByLabel(want).count())) { await page.locator('aside[aria-label="Features on this screen"] button').first().click(); await page.waitForTimeout(500) }
      const g = await page.evaluate(() => {
        const f = document.querySelector('[data-stage-frame]').getBoundingClientRect()
        const panel = document.querySelector('aside[aria-label="Features on this screen"]').getBoundingClientRect()
        const credit = [...document.querySelectorAll('.glass')].find((e) => e.textContent.includes('Presented by')).getBoundingClientRect()
        const pill = document.querySelector('nav[aria-label="Prototype platforms"]').getBoundingClientRect()
        return { fc: f.left + f.width / 2, wc: innerWidth / 2, fr: f.right, pl: panel.left, pb: panel.bottom, ct: credit.top, cl: credit.left, fb: f.bottom, ft: f.top, pillB: pill.bottom, ih: innerHeight }
      })
      const centred = Math.abs(g.fc - g.wc) < 1
      const clear = g.fr <= g.pl - 1
      const ok = clear && (centred || state === 'open' || g.fr > g.pl) && g.pb <= g.ct && g.fb <= g.ih && g.ft >= g.pillB
      const overlapCredit = g.fr > g.cl && g.fb > g.ct
      if (!clear || g.pb > g.ct || overlapCredit || g.fb > g.ih) fail++
      console.log(`${vp.join('x')} ${id.padEnd(14)} ${state.padEnd(9)} frame centre ${g.fc.toFixed(0)} vs window ${g.wc.toFixed(0)} ${centred ? '(centred)' : '(shifted left to clear panel)'} · frame right ${g.fr.toFixed(0)} < panel left ${g.pl.toFixed(0)} ${clear ? 'OK' : 'COLLIDE'} · panel bottom ${g.pb.toFixed(0)} <= credit top ${g.ct.toFixed(0)} ${g.pb <= g.ct ? 'OK' : 'OVERLAP'} · credit over frame ${overlapCredit ? 'YES' : 'no'} ${ok ? '' : ''}`)
    }
  }
  await page.context().close()
}
console.log(fail ? `GEOMETRY FAILURES: ${fail}` : 'GEOMETRY OK')
await browser.close()
