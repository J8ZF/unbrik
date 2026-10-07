# UNBRIK — 2.0 rework

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
| 3s / production-time cost | 120.95 min | 10.55 min | $18.34Oc | $2.64Dc |
| 5s / production-time cost | 120.75 min | 10.75 min | $16.54Oc | $3.26Dc |
| 10s / new research first | 116.17 min | 11.50 min | $14.45Oc | $2.73Dc |

These are controlled strategies, not guaranteed human play times. Dollar figures are balances immediately before the relevant purchases. Maximum simulated gap between purchases is 70 seconds. Sector 1 finite repeats finish during sector 2. Machine-readable baseline: `scripts/balance-report.json`.

## Header and accepted design

The original engineering-style palette remains: background #0b1017, panels #111922, separators #29343e, white #e6edf1, muted #8b9da9, green #b9f36d. Coin highlights use #d4ae68 and literal `¢`, not SVG.

Expanded header: original brand/action frame, currency columns separated by a thin vertical rule, balance and production with transient cache awards below. Collapsed header: currencies side by side, awards next to balances, controls to the right. Coins appear on unlock. The old chapter/count/progress strip is removed. A single cache strip occupies that boundary and remains visible while collapsed. Research count and progress are under the center wordmark; outer center segments still indicate fully maxed sectors.

Preserve the accepted non-header design: green research execution button; white affordable map nodes; original selected rings; no “가능” badge or corner marks. Sector 7 yellow, sector 8 white. Only purchased sector-8 borders have smoothly blended, clockwise opal colors. Their interiors stay gray/white. Animation settings, OS reduced motion, offscreen and suspended states continue to control movement. CHEAT is small yellow text under RESEARCH NETWORK. Main map tools remain two vertical buttons, with three additional tools behind the existing setting. Toasts retain X dismissal and a deadline bar.

Nodes have stable button hit targets across their complete area. Lower-node taps cannot trigger a compatibility click on a newly raised panel. Hidden sectors, their edges, headings, navigator rows and statistics stay undisclosed. Connection strokes use the target sector color, including purchase flashes.

## Save boundary

Current key: `unbrik-save-v2`, schema version 2, economy epoch `unbrik-2.0-rework`, layout version 2. Old `axiom-save-v1` progress is not converted or imported. On first load, preferences are copied and a new run starts, then the normal autosave uses the new key. The old key is left untouched so an old open tab cannot overwrite new progress. A reload of valid v2 data does not reset it. The UI's existing manual RESET safeguard is retained.

## Source map

- `data.js`: prerequisites, state, economy, atomic purchase, cache tick and validation.
- `research.js`, `prices.js`: static research definitions and price tables.
- `layout.js`: radial geometry, five branches and sector hulls.
- `app.js`: renderers, gestures, header, navigator, lifecycle and local save.
- `offline.js`: two-currency departure snapshot and decay settlement.
- `icons.js`: 80 existing embedded Lucide icons plus 25 distinct geometric icons.
- `hub.js`, `camera.js`: dodecahedron projection and cancellable movement.
- `effects.js`, `notifications.js`: selection guard, opal motion, toast deadlines.
- `index.html`, `style.css`: game interface.

## Verification

Run `npm run check`, `node balance-check.mjs`, `node ui-check.mjs`, `node offline-check.mjs`, `node layout-check.mjs`, `node effects-check.mjs`, `node motion-check.mjs`, `node notification-check.mjs`.

Checks cover reachable prerequisites; finite costs and distinct icons; exact initial coin production; both-currency shortages with no partial debit; cheat guards; cache snapshot consistency; split, duplicate and reloaded offline settlements; save epoch rejection; all 105 map nodes and non-overlapping sector hulls; hidden-sector boundaries; complete-card re-selection; gesture cancellation; navigator state; settings and reduced-motion combinations; original color/opal constraints.

The current managed environment does not provide browser preview for plain static Sites. Controlled real-handler tests and geometry checks are not a claim of Android Chrome or visual browser QA. Physical-device typography, compositing and browser touch behavior require device validation.
