/* ────────────────────────────────────────────────────────────────
   Edera prototype · visitor journey tracker
   One file, no dependencies, no cookies, no local storage.

   Sends batches of events to the Google Apps Script web app in
   ~/Deropo/edera-prototype/apps-script/edera-logger.gs, which appends them to the sheet "logs".

   Event types
     page_view    the visitor landed
     view         the visible screen changed (includes any open sheet / modal / drawer)
     action       a control was used, named by intent (send_offer, sell_publish …)
     session_end  the tab was hidden or closed, with total duration

   Transport
     fetch(…, { method: 'POST', mode: 'no-cors', text/plain, keepalive }) for batches.
     Apps Script cannot return CORS headers; text/plain keeps this a "simple"
     request so the browser skips the preflight it would otherwise fail.
     The response is opaque and never read.
     navigator.sendBeacon for the final flush on pagehide / visibilitychange.

   While ENDPOINT is still the placeholder, events are console.logged
   instead of sent, so local development never touches the sheet.
   ──────────────────────────────────────────────────────────────── */

// Paste the /exec URL from Deploy → Manage deployments here. Nothing else needs editing.
export const ENDPOINT = 'PASTE_THE_APPS_SCRIPT_EXEC_URL_HERE'

// Must match SECRET in apps-script/edera-logger.gs. Visible in the client bundle: a speed bump, not security.
export const SECRET = 'edera-tr-D4v3-9Kp2-2026'

const SHEET_TAB = 'prototype logs'
const FLUSH_IDLE_MS = 2500
const FLUSH_AT = 12
// Automated browsers (audit scripts, Playwright) never write to the sheet.
// Local development never writes to the sheet (add ?track=1 to send on purpose).
const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !/[?&]track=1\b/.test(location.search)
const PLACEHOLDER = ENDPOINT.startsWith('PASTE_') || navigator.webdriver === true || IS_LOCAL

const startedAt = Date.now()
const sessionId = makeId()
let seq = 0
let queue = []
let idleTimer = 0
let screen = ''
let baseScreen = ''
let role = ''
const overlays = []
let ended = false
let pendingTap = null
let started = false

function makeId() {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().slice(0, 13)
  return 's' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/* ── environment, captured once per page load ── */
function detectDevice(ua) {
  const touch = navigator.maxTouchPoints > 1
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Macintosh/.test(ua) && touch)) return 'tablet'
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return 'phone'
  return 'desktop'
}

function detectOS(ua) {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS ' + ((ua.match(/OS (\d+[_.]\d+)/) || [])[1] || '').replace('_', '.')
  if (/Macintosh/.test(ua)) return navigator.maxTouchPoints > 1 ? 'iPadOS' : 'macOS'
  if (/Android/.test(ua)) return 'Android ' + ((ua.match(/Android (\d+(\.\d+)?)/) || [])[1] || '')
  if (/Windows/.test(ua)) return 'Windows'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'unknown'
}

function detectBrowser(ua) {
  const m = (re) => (ua.match(re) || [])[1] || ''
  if (/Edg\//.test(ua)) return 'Edge ' + m(/Edg\/(\d+)/)
  if (/OPR\//.test(ua)) return 'Opera ' + m(/OPR\/(\d+)/)
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet ' + m(/SamsungBrowser\/(\d+)/)
  if (/CriOS/.test(ua)) return 'Chrome iOS ' + m(/CriOS\/(\d+)/)
  if (/FxiOS/.test(ua)) return 'Firefox iOS ' + m(/FxiOS\/(\d+)/)
  if (/Firefox\//.test(ua)) return 'Firefox ' + m(/Firefox\/(\d+)/)
  if (/Chrome\//.test(ua)) return 'Chrome ' + m(/Chrome\/(\d+)/)
  if (/Safari\//.test(ua)) return 'Safari ' + m(/Version\/(\d+(\.\d+)?)/)
  return 'unknown'
}

const ua = navigator.userAgent
const ENV = {
  device: detectDevice(ua),
  os: detectOS(ua).trim(),
  browser: detectBrowser(ua).trim(),
  timezone: (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    } catch {
      return ''
    }
  })(),
  utc_offset_mins: -new Date().getTimezoneOffset(),
  language: navigator.language || '',
  screen_size: `${screen_w()}x${screen_h()}`,
  referrer: document.referrer || '(direct)',
  user_agent: ua,
}
function screen_w() {
  return (globalThis.screen && globalThis.screen.width) || 0
}
function screen_h() {
  return (globalThis.screen && globalThis.screen.height) || 0
}

/* ── queue and transport ── */
function record(event, fields = {}) {
  if (ended && event !== 'session_end') return null
  seq += 1
  const row = {
    client_time: new Date().toISOString(),
    session_id: sessionId,
    seq,
    seconds_in: Math.round((Date.now() - startedAt) / 100) / 10,
    event,
    screen: fields.screen ?? screen,
    action: fields.action ?? '',
    value: fields.value === undefined || fields.value === null ? '' : String(fields.value).slice(0, 300),
    role,
    ...ENV,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    page: location.href,
    extra: fields.extra ? JSON.stringify(fields.extra).slice(0, 2000) : '',
  }
  queue.push(row)
  if (queue.length >= FLUSH_AT) flush()
  else {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(flush, FLUSH_IDLE_MS)
  }
  return row
}

function flush(final = false) {
  clearTimeout(idleTimer)
  if (!queue.length) return
  const batch = queue
  queue = []
  const body = JSON.stringify({ secret: SECRET, app: 'prototype', tab: SHEET_TAB, events: batch })
  if (PLACEHOLDER) {
    console.log(`[tracker] ${batch.length} event(s) (not sent: ENDPOINT is still the placeholder)`, batch)
    return
  }
  try {
    if (final && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=utf-8' }))
      if (ok) return
    }
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      keepalive: true,
    }).catch(() => {
      /* opaque by design; nothing to read and nothing to retry for a demo */
    })
  } catch {
    /* never let logging break the prototype */
  }
}

/* ── screen naming ── */
function composeScreen() {
  return overlays.length ? `${baseScreen}+${overlays.join('+')}` : baseScreen
}

function emitViewIfChanged() {
  const next = composeScreen()
  if (!next || next === screen) return
  const from = screen
  screen = next
  record('view', { screen: next, extra: from ? { from } : undefined })
}

/** Normalise a free label to a slug: "Report Kayla" → report-kayla */
export function slug(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/* ── public API ── */

/** Call once at startup. */
export function startTracking() {
  if (started) return
  started = true
  record('page_view', { screen: '', extra: { title: document.title } })
  installLifecycle()
  installFallbackTaps()
}

/** The base screen changed (platform + screen + selected item). role: member | admin | viewer */
export function setScreen(name, nextRole) {
  if (nextRole) role = nextRole
  if (name === baseScreen) return
  baseScreen = name
  overlays.length = 0
  emitViewIfChanged()
}

/** A sheet / modal / drawer opened or closed on top of the current screen. */
export function overlayOpened(name) {
  const s = slug(name) || 'overlay'
  if (!overlays.includes(s)) overlays.push(s)
  emitViewIfChanged()
}
export function overlayClosed(name) {
  const s = slug(name) || 'overlay'
  const i = overlays.indexOf(s)
  if (i >= 0) overlays.splice(i, 1)
  emitViewIfChanged()
}

/** A control was used. Name the intent: track('send_offer', 'l3', { amount: 470000 }) */
export function track(action, value, extra) {
  // A tap already reserved its row (and its place in the sequence) at click
  // time: give that row the intent name instead of adding a second one.
  if (pendingTap && queue.includes(pendingTap)) {
    const control = pendingTap.value
    pendingTap.action = action
    pendingTap.value = value === undefined || value === null ? '' : String(value).slice(0, 300)
    pendingTap.extra = JSON.stringify({ ...(extra || {}), control }).slice(0, 2000)
    pendingTap = null
    return
  }
  record('action', { action, value, extra })
}

/* Fallback: every tap inside the device frame or the viewer chrome is
   logged the moment it happens, as action "ui_tap" with the control's
   visible label and the screen it was on. If the control's own handler
   then calls track(), that same row is renamed to the intent, so taps
   are never double counted and always sit before the screen change they
   caused. */
function installFallbackTaps() {
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest('button, a, [role="button"], [role="tab"], [role="switch"], input[type="checkbox"]') : null
      if (!el) return
      const label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
      const where = el.closest('[data-stage-frame]') ? 'in_frame' : 'viewer_chrome'
      pendingTap = record('action', { action: 'ui_tap', value: label, extra: { where } })
      setTimeout(() => {
        pendingTap = null
      }, 0)
    },
    true,
  )
}

function installLifecycle() {
  const end = () => {
    if (ended) return
    record('session_end', { value: Math.round((Date.now() - startedAt) / 1000), extra: { events: seq + 1, last_screen: screen } })
    ended = true
    flush(true)
  }
  window.addEventListener('pagehide', end)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      end()
    } else if (ended) {
      // came back to the tab: continue the same session
      ended = false
      record('view', { screen, extra: { resumed: true } })
    }
  })
}
