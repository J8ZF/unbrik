# UNBRIK — 2.1 (2.0 economy, mainland map, compact header)

A portrait incremental game with 105 research nodes across the original eight sectors, 316 finite research levels, dollars and coins. The center is navigation, not a purchasable research. AXIOM is research 105.

## Continue this Site

- Live URL: https://axiom-upgrade-tree.workingdad365.chatgpt.site
- Sites project: `appgprj_6ac5785df1cc8191aee137a5f749f5b8`
- Authenticated Sites Git, branch `main`: https://git.chatgpt-team.site/a55592db-5743-421d-8f15-dd86632c516a/appgprj_6ac5785df1cc8191aee137a5f749f5b8.git
- This is not a GitHub repository. Open this existing project using Sites and a fresh authorized repository credential. Do not register a replacement Site.
- Static ES modules are served directly from `dist/`. No dependencies, build step or third-party runtime request.

## Authorized 2.0 scope

The user requested a full economy rework from the 1.7 baseline, based on the 105-node planning catalog. The prior UI-only 2.0 did not implement coins and is superseded. Existing progress is intentionally reset once for this release. No prestige or automation is implemented. Do not add unrequested badges, selection corners, extra text or mechanics.

Sector counts: 8 / 12 / 14 / 13 / 14 / 14 / 15 / 15. Max levels vary among 1, 5, 10 and 20. Ordinary repeats finish during the following sector; TRUTH TABLE (41) and DYNAMIC PROGRAM (67) extend into the final sector. The initial rate is $1/s and START costs $10.

BASIS (22), in sector 3, unlocks the literal `¢` symbol and 1 coin/s. The tree includes dollar-paid coin production, coin-paid dollar production, atomic two-currency purchases, and logarithmic held-balance interactions in both directions. Coin research names follow the existing sector themes. SCHEDULER (79) now increases both cache awards instead of buying research automatically.

Cache uses one clock with separately calculated awards for both currencies. Both awards and ordinary production use one pre-award economy snapshot. Offline production snapshots both mean rates including cache. The first 30 minutes have full efficiency, followed by exponential decay with a 600-second time constant, asymptoting to 40 minutes of full-rate production. The settlement cursor prevents duplicate or split-interval payouts. Offline income does not run research purchases.

## Economy calibration

Dollar prices and production strength were both compressed; suffixes were not renamed to disguise large numbers. Oc = 1e27, Dc = 1e33. Production uses explicit additive, multiplier, count, level, balance and cache effects without the old escalating global production exponent.

`dist/research.js` contains explicit research effects. `dist/prices.js` contains fixed, reviewed per-level costs. Runtime does not regenerate prices. `scripts/author-research.mjs` and `scripts/balance-v2.mjs --author` reproduce the authored tables; changing tuning requires recalibration and a conscious save compatibility decision.

Measured simulations, ordinary play with no cheat or offline boost:

| Purchase cadence / strategy | All 316 levels | Coin unlock | Sector 8 first-purchase balance | Final-purchase balance |
| --- | ---: | ---: | ---: | ---: |
| 3s / production-time cost | 119.05 min | 10.55 min | $16.53Oc | $3.15Dc |
| 5s / production-time cost | 120.08 min | 10.75 min | $18.18Oc | $2.56Dc |
| 10s / new research first | 116.83 min | 11.50 min | $13.68Oc | $2.53Dc |

These are controlled strategies, not guaranteed human play times (2.1 figures; the 2.0 ladder graph measured 120.95 / 120.75 / 116.17 min, so the wider frontier changes the pace by well under a minute). Dollar figures are balances immediately before the relevant purchases. Maximum simulated gap between purchases is 70 seconds. Sector 1 finite repeats finish during sector 2. Machine-readable baseline: `scripts/balance-report.json`.

## Map: flow layout and the mainland (2.1)

Prerequisites inside a sector are generated from a row plan (`SECTOR_ROWS` in `data.js`): one root, rows of two or three parallel studies, one gate. Plans are 1-2-2-2-1, 1-2-3-3-2-1, 1-1-2-3-3-3-1 (BASIS alone in row 2 so every coin study descends from it), 1-2-3-3-3-1, 1-2-3-3-2-2-1, 1-2-2-3-3-2-1 and 1-2-3-3-3-2-1 twice. A study requires exactly the studies directly upstream of it (those whose span in the previous row overlaps its own), so links never cross. The gate of a sector is the single prerequisite of the next root. Research effects, prices and level caps are untouched; only the prerequisite wiring and positions changed from the 2.0 two-wide ladder.

`layout.js` places each sector along a direction from the center (`PLACEMENT`): sectors 1, 3, 4, 6 and 7 start at radius 430 on the five original branches; sectors 2, 5 and 8 start at radius 1170 in the bays between their neighbours instead of being stacked further out. The land is derived from the cards on a 40-unit grid: every cell within 84 units of a card (plus a disc of radius 520 around the center) is land, channels narrower than 230 units between neighbouring sectors are closed, and each land cell belongs to the sector of its nearest card. Cell boundaries are traced into chains between junctions and straightened with a 46-unit tolerance, so the coast and the shared sector borders are irregular angular polygons and both sides of a border use the same vertices. Completed sectors still reveal their region, so the mainland grows sector by sector and is complete after the eighth. Sector headings sit 70 units beyond the sector's outermost coastal point and are left- or right-aligned when they hang off a side coast. Adding future content means adding rows to `PLACEMENT`/`SECTOR_ROWS` (and research): nodes placed away from the mainland form their own island by the same rule.

Layout version is 3: valid 2.0 saves keep currencies, levels, timers and preferences and only discard the stored camera. Layout runs once at load (about 100 ms on a laptop CPU for 105 cards).

## Header (2.1) and accepted design

The original engineering-style palette remains: background #0b1017, panels #111922, separators #29343e, white #e6edf1, muted #8b9da9, green #b9f36d. Coin highlights use #d4ae68 and literal `¢`, not SVG. No RUNNING indicator, scale ornament or double frame.

Expanded header, 154 CSS px at 412 px wide with both currencies and the cache strip (2.0: 199): the original brand/action row, then one framed window per currency in a horizontally scrolling row (`.resources`, scroll-snap, hidden scrollbar), then the cache strip. Each window has a unit tab on the left (`$` muted, `¢` ochre), the balance, the production rate in the currency color, and the transient cache award as a small bordered chip at the right end of the rate line (green for dollars, ochre for coins). Windows are `flex:1 1 0; min-width:160px`, so two fit side by side from 320 px up and a third or fourth currency extends the row without changing the height. Worst-case figures (999.99Dc balance, +359.29B /s, +4.0T award) fit at 412, 360 and 320 px without overflow. Collapsed header is unchanged. The DOM ids and update code in `app.js` are unchanged; the header change is the final CSS block of `style.css`.

Preserve the accepted non-header design: green research execution button; white affordable map nodes; original selected rings; no “가능” badge or corner marks. Sector 7 yellow, sector 8 white. Only purchased sector-8 borders have smoothly blended, clockwise opal colors. Their interiors stay gray/white. Animation settings, OS reduced motion, offscreen and suspended states continue to control movement. CHEAT is small yellow text under RESEARCH NETWORK. Main map tools remain two vertical buttons, with three additional tools behind the existing setting. Toasts retain X dismissal and a deadline bar.

Nodes have stable button hit targets across their complete area. Lower-node taps cannot trigger a compatibility click on a newly raised panel. Hidden sectors, their edges, headings, navigator rows and statistics stay undisclosed. Connection strokes use the target sector color, including purchase flashes.

## Save boundary

Current key: `unbrik-save-v2`, schema version 2, economy epoch `unbrik-2.0-rework`, layout version 3 (2.0 saves load; only their camera is dropped). Old `axiom-save-v1` progress is not converted or imported. On first load, preferences are copied and a new run starts, then the normal autosave uses the new key. The old key is left untouched so an old open tab cannot overwrite new progress. A reload of valid v2 data does not reset it. The UI's existing manual RESET safeguard is retained.

## Source map

- `data.js`: row plans and prerequisite wiring, state, economy, atomic purchase, cache tick and validation.
- `research.js`, `prices.js`: static research definitions and price tables.
- `layout.js`: sector placement, grid-derived land, traced and straightened coast/borders, headings, link paths.
- `app.js`: renderers, gestures, header, navigator, lifecycle and local save.
- `offline.js`: two-currency departure snapshot and decay settlement.
- `icons.js`: 80 existing embedded Lucide icons plus 25 distinct geometric icons.
- `hub.js`, `camera.js`: dodecahedron projection and cancellable movement.
- `effects.js`, `notifications.js`: selection guard, opal motion, toast deadlines.
- `index.html`, `style.css`: game interface; the 2.1 header is the last block of `style.css`.
- `UNBRIK_2.1.html` (repository root, optional): single-file build of `dist/` (inline CSS, bundled script) that runs from `file://`; regenerate with `scripts/bundle-single.mjs` after changing `dist/`.

## Verification

Run `npm run check`, `node balance-check.mjs`, `node ui-check.mjs`, `node offline-check.mjs`, `node layout-check.mjs`, `node effects-check.mjs`, `node motion-check.mjs`, `node notification-check.mjs`.

Checks cover reachable prerequisites; finite costs and distinct icons; exact initial coin production; both-currency shortages with no partial debit; cheat guards; cache snapshot consistency; split, duplicate and reloaded offline settlements; save epoch rejection; row plans, upstream-only prerequisites and non-crossing links; every card inside its own sector polygon and outside the others, headings off the land, all eight sectors forming one connected mainland; hidden-sector boundaries; complete-card re-selection; gesture cancellation; navigator state; settings and reduced-motion combinations; original color/opal constraints.

The current managed environment does not provide browser preview for plain static Sites. Controlled real-handler tests and geometry checks are not a claim of Android Chrome or visual browser QA. Physical-device typography, compositing and browser touch behavior require device validation.
