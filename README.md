# Edera · clickable prototype

A high-fidelity, clickable prototype of **Edera**, the event marketplace and management platform for clients, event planners, vendors and venue owners, built from the Fiverr order request from deropo (Dave) and the 33-minute discovery call on 9 Nov 2026. Four platforms: Client App, Planner App, Vendor App (iPhone frames) and Edera Admin (browser frame). React + Vite + Tailwind v4 + Framer Motion, local demo data only, deploys to Vercel with zero config.

```
REFERENCE BOARD
Ref 1:  Airbnb → the listing page opens on a full-bleed photo grid with the title typeset below, not a card; the availability calendar is the booking widget, not a filter; reviews are quoted as sentences with a face, never as a star count alone.
Ref 2:  Flighty → the single most important fact (days to go, guests in) is one 56–96px numeral with tiny labels around it; status is typeset over the photographic hero; the timeline is a vertical spine with events hanging off it.
Ref 3:  Linear → lists are borderless, separation is rhythm and weight; filter chips are a snap rail; the inspector sits beside the list (admin), never in a modal.
Signature move: THE AVAILABILITY STRIP. Fourteen days of free (evergreen) / held (brass) / booked (ink) on every vendor card, profile, request and admin row, so "when the day is free and when it is booked" is visible before anyone sends a message.

ART DIRECTION
Direction:   Evergreen & Brass (custom, derived from the client's own brand at useedera.com: theme colour #123C35 and the brass arc in its mark)
Style lens:  apple-design (fluid, physical motion; translucent docks; typographic hierarchy by optical size) — a celebration product on phones, held in one hand, often on the day
Personality: celebratory, trusted, unhurried
Palette:     accent #1C6B5A · support #C9973F (brass) · base #F7F2E8 (paper) · on-accent #FFFFFF · ink #123C35 · night #0B2622 · ruby #B2384A
Type:        Fraunces (display, italics for the wordmark) / Manrope (text) / DM Mono (meta)   · scale: 11 / 13 / 15 / 17 / 22 / 34 / 56 / 80
Surface:     warm paper with evergreen ink blocks and brass accents; photography with evergreen scrims; glass docks
Radius:      24 / 16 / 10 / 999
Theme:       light, no toggle
Motion:      springy-overshoot (ui 420/26; sheets softer; success pops)
Signature:   the availability strip (free / held / booked) on every vendor surface
Device:      the brass arc, cut from the logo, as a corner sweep on heroes and success moments
Composition: full-bleed hero (12 screens) · horizontal rail (14) · oversized numeral (9) · list-dense editorial (16) · timeline spine (5) · stacked sheet (10) · overlapping / offset (8) · asymmetric bento (6) · chart-led (4) · split panel (6) · map or canvas (1: the scanner viewfinder)
Rejected:    Obsidian Gold (dark luxury) was the first instinct for "events": discarded because the client's live brand is light with deep green, and planners use the app in daylight on the day; also rejected Ember (too close to food delivery) and Terracotta (too editorial for a marketplace).
Skills used: phase 1 full-output-enforcement · phase 2 ui-ux-pro-max, design-system, ui-styling · phase 3 impeccable, high-end-visual-design, design-taste-frontend, emil-design-eng, apple-design · phase 4 apple-design, animation-vocabulary, find-animation-opportunities · phase 5 dataviz · phase 6 design-taste-frontend, impeccable, improve-animations
```

## The story

Today is **Saturday 21 November 2026, 18:42 in London**.

- **Adaeze Nwosu (Client App)** is planning her parents' ruby anniversary, *Ngozi & Emeka · 40 Years*, Sat 20 Feb 2027, 180 guests at The Orangery, Royal Docks. She assigned **Tunde Bakare** as her planner; her portal shows the summary: venue and decor confirmed, caterer, photographer, cake and band requested, DJ shortlisted, 112 of 180 RSVPs, 135 QR invites sent.
- **Tunde Bakare (Planner App)** runs seven events. Tonight he is on the door at *Adaora & Kunle's engagement dinner* at Olá Event Hall, Peckham: 41 of 90 guests scanned in, two walk-ins, one duplicate scan. His request to Ìyá Bola Catering for the anniversary went out 47 minutes ago.
- **Bola Fashola (Vendor App)** runs Ìyá Bola Catering and owns the hall. Tunde's request is at the top of her inbox; another client wants a date her hall is already booked; her calendar shows what is free, held and booked.
- **Dave (Edera Admin)** runs the platform: 4,812 users across the UK and Nigeria, 23 verifications waiting, the commission switch turned off, languages and regions.

## Languages

English, Yorùbá and Nigerian Pidgin are translated on the Client App's welcome, home and tab bar through `useLang().t(en, yo, pcm)`; Igbo and Hausa are selectable and fall back to English in the demo (the admin's language table shows their coverage).

## Run

```bash
npm install
npm run dev          # http://localhost:5282
npm run build        # tsc --noEmit && vite build → dist/
```

Deploy with `vercel --prod` (zero config). Visitor journey logging goes to a Google Sheet once the Apps Script in `apps-script/edera-logger.gs` is deployed and its `/exec` URL pasted into `ENDPOINT` in `src/lib/tracker.js`.

## Audits

```bash
node scripts/audit.mjs http://localhost:5282          # contrast, overlap, page scroll, opacity 0
node scripts/click-walk.mjs http://localhost:5282     # every control, every screen
node scripts/zero-typing.mjs http://localhost:5282    # every flow with taps only
node scripts/density.mjs http://localhost:5282        # component kinds, richness, scroll depth
node scripts/geometry.mjs http://localhost:5282       # frame centring vs the feature panel
node scripts/feature-links.mjs http://localhost:5282  # every Full Feature List link lands
node scripts/phone-audit.mjs http://localhost:5282    # phone-browser view
```
