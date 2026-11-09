/** ZERO-TYPING AUDIT (v4): walks every flow from a fresh load using taps only (no keyboard).
 *  Each step taps the screen's primary action: the ember (accent) button in the dock,
 *  else the last accent button on screen. Usage: node scripts/zero-typing.mjs <baseUrl> [--phone] */
import { chromium, devices } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:5282'
const PHONE = process.argv.includes('--phone')
const browser = await chromium.launch()
const ctx = PHONE ? await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }) : await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const hash = () => page.evaluate(() => location.hash)
const go = async (h) => {
  await page.goto('about:blank')
  await page.goto(`${BASE}/#/${h}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
}
/** tap the primary (accent-filled) button; returns its label */
const primary = async (match) => {
  const label = await page.evaluate((src) => {
    const re = src ? new RegExp(src, 'i') : null
    const frame = document.querySelector('[data-stage-frame]')
    const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.getBoundingClientRect().height > 0)
    const f = dialogs.length ? dialogs.at(-1) : frame
    const all = [...f.querySelectorAll('button')].filter((b) => {
      const r = b.getBoundingClientRect()
      if (!r.width || !r.height || b.disabled) return false
      const txt = (b.getAttribute('aria-label') || b.textContent || '').trim()
      if (re) return re.test(txt)
      return getComputedStyle(b).backgroundColor.replace(/\s/g, '').startsWith('rgb(28,107,90')
    })
    const docked = all.filter((b) => b.closest('[data-dock]'))
    const b = (docked.length ? docked : all).at(-1)
    if (!b) return null
    b.setAttribute('data-zt', '1')
    return (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40)
  }, match ? match.source : null)
  if (!label) throw new Error(`no primary button on ${await hash()}`)
  await page.locator('[data-zt="1"]').scrollIntoViewIfNeeded()
  await page.locator('[data-zt="1"]').click()
  await page.evaluate(() => document.querySelector('[data-zt]')?.removeAttribute('data-zt'))
  await page.waitForTimeout(900)
  return label
}
const errorsOnLoad = () =>
  page.evaluate(() => {
    const f = document.querySelector('[data-stage-frame]')
    return [...f.querySelectorAll('p, span')].filter((e) => /required|is required|enter your|doesn.t match|fill in/i.test(e.textContent || '') && getComputedStyle(e).color.replace(/\s/g, '').includes('154,47,64')).length
  })
const until = async (target, max = 14) => {
  for (let i = 0; i < max; i++) {
    const h = await hash()
    if (h === target) return true
    if (await errorsOnLoad()) return `validation error visible on ${h}`
    await primary()
  }
  return (await hash()) === target || `ended at ${await hash()}`
}

/* a change = the frame's text changed, or a toast appeared (phone mode renders toasts outside the frame) */
const snapshot = () => page.evaluate(() => (document.querySelector('[data-stage-frame]')?.innerText ?? '') + '\n' + [...document.querySelectorAll('[aria-live]')].map((e) => e.innerText).join('|'))
const changed = async (fn) => {
  const before = await snapshot()
  await fn()
  await page.waitForTimeout(500)
  return (await snapshot()) !== before || 'nothing changed'
}

const flows = [
  ['Client: welcome → sign-in → OTP → home', async () => { await go('app/welcome'); return until('#/app/home', 5) }],
  ['Client: edit and save event details', async () => { await go('app/event'); await primary(/edit details/); await page.waitForTimeout(400); return changed(() => primary(/^save/)) }],
  ['Client: send a booking request', async () => { await go('app/booking'); await primary(/send request|send booking|request/); return (await hash()) === '#/app/bookings' || changed(async () => {}) }],
  ['Client: add a guest', async () => { await go('app/guests'); await primary(/add guest/); await page.waitForTimeout(400); return changed(() => primary(/^add|^save/)) }],
  ['Client: send QR invites', async () => { await go('app/invite'); return changed(() => primary(/send|share/)) }],
  ['Client: send a message', async () => { await go('app/thread'); return changed(() => primary(/^send/)) }],
  ['Client: request another planner', async () => { await go('app/planner'); return changed(() => primary(/request|message/)) }],
  ['Client: save profile / language', async () => { await go('app/profile'); return changed(() => primary(/save|yor|english|naij/)) }],
  ['Planner: sign-in', async () => { await go('pro/signin'); return until('#/pro/home', 2) }],
  ['Planner: scan a guest at the door', async () => { await go('pro/checkin'); return changed(() => primary(/scan|check in|walk-in|add/)) }],
  ['Planner: send a vendor request', async () => { await go('pro/vendors'); await primary(/request|send/); await page.waitForTimeout(400); return changed(() => primary(/send|request/)) }],
  ['Planner: tick a task on the event board', async () => { await go('pro/event'); return changed(() => primary(/done|complete|task|request|send/)) }],
  ['Planner: submit verification', async () => { await go('pro/verification'); return changed(() => primary(/submit|renew|upload|save/)) }],
  ['Planner: send a message', async () => { await go('pro/messages'); return changed(() => primary(/^send|reply/)) }],
  ['Vendor: sign-in', async () => { await go('vendor/signin'); return until('#/vendor/home', 2) }],
  ['Vendor: accept a request', async () => { await go('vendor/request'); return changed(() => primary(/^accept/)) }],
  ['Vendor: block a day', async () => { await go('vendor/calendar'); return changed(() => primary(/block|save|mark/)) }],
  ['Vendor: save a listing', async () => { await go('vendor/listing'); return changed(() => primary(/save|publish/)) }],
  ['Vendor: reply to a review', async () => { await go('vendor/reviews'); await primary(/reply/); await page.waitForTimeout(400); return changed(() => primary(/^send|^post|^reply/)) }],
  ['Vendor: submit verification documents', async () => { await go('vendor/verification'); return changed(() => primary(/submit|upload|continue|save/)) }],
  ['Admin: sign-in', async () => { await go('admin/signin'); return until('#/admin/overview', 2) }],
  ['Admin: approve a verification', async () => { await go('admin/verification'); return changed(() => primary(/^approve/)) }],
  ['Admin: suspend or reinstate a user', async () => { await go('admin/users'); await primary(/view|open|suspend|⋯|more/); await page.waitForTimeout(400); return changed(() => primary(/suspend|reinstate|save|close/)) }],
  ['Admin: keep or remove a flagged review', async () => { await go('admin/reviews'); return changed(() => primary(/keep|remove/)) }],
  ['Admin: send a broadcast', async () => { await go('admin/notifications'); await primary(/new broadcast|compose|send/); await page.waitForTimeout(400); return changed(() => primary(/^send|^schedule/)) }],
  ['Admin: add a category', async () => { await go('admin/marketplace'); await primary(/add category|new category/); await page.waitForTimeout(400); return changed(() => primary(/^add|^save/)) }],
  ['Admin: save settings', async () => { await go('admin/settings'); return changed(() => primary(/save/)) }],
  ['Admin: export a report', async () => { await go('admin/reports'); return changed(() => primary(/export|download/)) }],
]


let pass = 0
const fails = []
for (const [name, fn] of flows) {
  try {
    const r = await fn()
    if (r === true) pass++
    else fails.push(`${name}: ${r}`)
  } catch (e) {
    fails.push(`${name}: ${String(e.message).split('\n')[0].slice(0, 110)}`)
  }
}
await browser.close()
console.log(`Zero-typing flows (${PHONE ? 'phone' : 'desktop'}): ${pass}/${flows.length} completed with taps only`)
fails.forEach((f) => console.log('  BLOCKED ' + f))
