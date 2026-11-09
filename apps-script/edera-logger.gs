/**
 * Edera logger: one script, two tabs.
 * Receives batches of visitor events from the PROTOTYPE and from the PROPOSAL site and appends
 * them to the same Google Sheet, one row per event, in separate tabs ("prototype logs" and
 * "proposal logs"). Filter a tab by session_id and sort by seq to replay one visitor's journey.
 *
 * SETUP, in this order
 *   1. Open the sheet "logs" (SHEET_ID below), then Extensions → Apps Script. (A standalone script at
 *      script.google.com works too: openById does not need the script to be bound to the sheet.)
 *      Delete the sample code, paste this whole file, Save.
 *   2. In the editor, pick testWrite in the function dropdown and press Run. Approve the
 *      permissions Google asks for. One "test" row should appear in EACH of the two tabs.
 *      If it does not, the problem is on the Google side; fix it before touching the browser.
 *   3. Deploy → New deployment → type: Web app.
 *        Execute as: Me
 *        Who has access: Anyone
 *      Deploy, and copy the URL that ends in /exec.
 *   4. Open that /exec URL in a browser. You should see {"ok":true,"sheet_reachable":true,...}.
 *      If sheet_reachable is false, "detail" holds the exact exception.
 *   5. Paste the same /exec URL into ENDPOINT in BOTH trackers (edera-prototype/src/lib/tracker.js and
 *      edera-proposal/src/tracker/tracker.js), rebuild,
 *      redeploy the sites. The tracker tells the script which app it is; the script picks the tab.
 *
 * !!! AFTER ANY EDIT TO THIS SCRIPT you must Deploy → Manage deployments → pencil (edit) →
 * !!! Version: New version → Deploy. Saving alone leaves the live /exec URL serving the OLD
 * !!! code. This wastes more time than any other single thing.
 *
 * The SECRET is also in the browser bundles, so anyone can read it. It is a speed bump against
 * casual junk, not security. Anyone with the /exec URL can post rows.
 */

const SHEET_ID = '1-6I3oUuLSKyEjC1Q5z3A4BONLJrVbSqw5XFJyZw_hlM'; // sheet "logs"
const SECRET = 'edera-tr-D4v3-9Kp2-2026';

/** Which tab each app writes to. The tracker sends "app" (and the tab name) in every batch. */
const TABS = {
  prototype: 'prototype logs',
  proposal: 'proposal logs',
};
const DEFAULT_APP = 'prototype';

const COLUMNS = [
  'received_at', 'client_time', 'session_id', 'seq', 'seconds_in', 'event', 'screen', 'action',
  'value', 'role', 'device', 'os', 'browser', 'timezone', 'utc_offset_mins', 'language',
  'screen_size', 'viewport', 'referrer', 'page', 'user_agent', 'extra',
];

const MAX_EVENTS_PER_BATCH = 200;
const MAX_CELL = 5000;

/** Receives a batch: {"secret": "...", "app": "prototype"|"proposal", "tab": "...", "events": [...]} sent as text/plain. */
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) {
      console.warn('Rejected: empty body');
      return json_({ ok: false, error: 'empty body' });
    }
    let body;
    try {
      body = JSON.parse(raw);
    } catch (parseErr) {
      console.warn('Rejected: body is not JSON. First 200 chars: ' + String(raw).slice(0, 200));
      return json_({ ok: false, error: 'bad json' });
    }
    if (!body || body.secret !== SECRET) {
      console.warn('Rejected: wrong or missing secret. Events in batch: ' + (body && body.events ? body.events.length : 0));
      return json_({ ok: false, error: 'forbidden' });
    }
    const known = Object.keys(TABS).map(function (k) { return TABS[k]; });
    const tab = TABS[body.app] || (known.indexOf(body.tab) >= 0 ? body.tab : TABS[DEFAULT_APP]);
    if (!TABS[body.app] && known.indexOf(body.tab) < 0) console.warn('Batch did not name a known app ("' + body.app + '"); writing to "' + tab + '".');
    const events = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : [];
    if (!events.length) return json_({ ok: true, written: 0, tab: tab });

    const receivedAt = new Date().toISOString();
    const rows = events.map(function (ev) {
      return COLUMNS.map(function (col) {
        if (col === 'received_at') return receivedAt;
        const v = ev == null ? '' : ev[col];
        if (v === undefined || v === null) return '';
        const s = typeof v === 'object' ? JSON.stringify(v) : v;
        return typeof s === 'string' ? s.slice(0, MAX_CELL) : s;
      });
    });

    const written = writeRows_(tab, rows);
    return json_({ ok: true, written: written, tab: tab });
  } catch (err) {
    console.error('doPost failed: ' + (err && err.stack ? err.stack : err));
    return json_({ ok: false, error: String(err) });
  }
}

/** Health check. Open the /exec URL in a browser. */
function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const parts = Object.keys(TABS).map(function (app) {
      const sheet = ss.getSheetByName(TABS[app]);
      return 'Tab "' + TABS[app] + '" (' + app + ') ' + (sheet ? 'has ' + Math.max(0, sheet.getLastRow() - 1) + ' event rows.' : 'does not exist yet; it is created on the first write.');
    });
    return json_({ ok: true, sheet_reachable: true, detail: 'Opened "' + ss.getName() + '". ' + parts.join(' ') });
  } catch (err) {
    console.error('doGet could not open the sheet: ' + (err && err.stack ? err.stack : err));
    return json_({ ok: false, sheet_reachable: false, detail: String(err && err.message ? err.message : err) });
  }
}

/** Run from the editor to prove the script can write, before involving the browser. Writes one row to each tab. */
function testWrite() {
  const now = new Date().toISOString();
  Object.keys(TABS).forEach(function (app) {
    const row = COLUMNS.map(function (col) {
      switch (col) {
        case 'received_at': return now;
        case 'client_time': return now;
        case 'session_id': return 'test-' + now;
        case 'seq': return 1;
        case 'seconds_in': return 0;
        case 'event': return 'test';
        case 'screen': return 'apps_script:testWrite';
        case 'extra': return JSON.stringify({ note: 'written by testWrite() from the editor', app: app });
        default: return '';
      }
    });
    const written = writeRows_(TABS[app], [row]);
    console.log('testWrite wrote ' + written + ' row to "' + TABS[app] + '" in sheet ' + SHEET_ID);
  });
}

/** One setValues() call per batch. A script lock stops two batches writing the same rows. */
function writeRows_(tabName, rows) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = ensureSheet_(tabName);
    const start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, rows.length, COLUMNS.length).setValues(rows);
    return rows.length;
  } finally {
    lock.releaseLock();
  }
}

/** Creates the tab and a bold, frozen header row on first use. */
function ensureSheet_(tabName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) sheet = ss.insertSheet(tabName);
  if (sheet.getLastRow() === 0) {
    const header = sheet.getRange(1, 1, 1, COLUMNS.length);
    header.setValues([COLUMNS]);
    header.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
