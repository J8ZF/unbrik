# UNBRIK — 3.0.3 (2.0 economy, mainland map, paged header, 환생 prestige and the bloom map)

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

## 2.2 preparation for the next major update

Requested as groundwork; none of it changes research, prices or the economy.

- **Currency registry** (`CURRENCY_DEFS` in `data.js`): symbol, name, color and a `shown(state, econ)` rule per currency. Up to eight currencies are planned. Adding one means adding a registry entry (and its economy fields); the ledger picks it up automatically. The page-1 windows and the collapsed header still have hand-written markup for `money` and `coin` (`moneyCard`/`coinCard`, `compactMoneyCard`/`compactCoinCard`), so a new currency that should appear on page 1 or in the collapsed header needs a window in `index.html` plus the two id lists in `renderChrome`.
- **Maps** (`MAPS`, `currentMap(state)`, `state.map`): the current map decides which currencies page 1 and the collapsed header show, and whether the cache strip is visible (any map currency with cache production) and in which color (`--cache-color`, the first such currency). A future prestige map adds `{id, name, currencies:['token']}`; with no token cache production its strip stays hidden until an upgrade provides it.
- **Header pages** (`#hudPages`, `createHeader` in `app.js`): page 1 = current map (game clock, weather, the map's currency windows); following pages = currency ledger, four rows per page (`LEDGER_PER_PAGE`), page count = 1 + ceil(shown / 4). Native horizontal scroll with snap gives swiping; `hudPrev`/`hudNext` and the dots (`pageDots`) sit over the top-right corner. The page is not saved; the site opens on page 1. Expanded height at 412 px with both currencies and the cache strip: 172 CSS px (2.1: 154; the extra line is the clock row).
- **Game clock and weather** (`state.world`, `worldState(state)`): one game day = 24 minutes of play, one real minute per game hour, independent of wall-clock time and not advanced offline. A new run starts at 07:00. Phases: dawn 05–07, day 07–17, dusk 17–19, night 19–05 (`PHASES`). Weather rolls every 600 s of play (`WEATHER_INTERVAL`): rain 20 %, snow 10 %, otherwise clear; stored in the save so a reload keeps it. Neither has any effect yet; they are recorded for later systems.
- **Cache strip yield** (`cacheYield`): per-cycle award for each map currency with cache production (`rate × burst`), updated every render.
- **Research panel icon** (`.panel-symbol`): background and border follow the sector color via `--sector-color`; sector 8 is plain white (no opal), the center selection stays neutral.
- Settings → 정보 sentence under the logo is now “절대성은 사랑입니다”.

Design notes stated for the next major update (not implemented): a main-menu system reachable from the header; up to eight currencies across two ledger pages; a separate prestige-upgrade map whose page 1 and collapsed header show prestige tokens; the cache strip per map, possibly in another color; the clock and weather will gain gameplay uses.

## 2.2.1 notices, headings, small fixes

- **Notices** (`notifications.js`, `#toasts`): notices stack downward under the header; a notice with the same text and kind refreshes in place; at most four timed notices are kept. Kinds: `info` (green, timed), `important` (white frame, no deadline, closed only by its X — used for finishing the tree, starting a new run, the 2.0 migration notice) and `weather-rain` / `weather-snow` / `weather-clear` (ultramarine, snow white, sky blue; shown when the weather changes, from `tick` events; day/night changes are not announced).
- **Sector headings** follow play: until a sector is complete its heading sits 135 units past the farthest visible row (left- or right-aligned on sideways branches), then it moves to its place outside the coast with a short tween (`placeHeading` in `app.js`).
- Cache-strip yields sit next to the CACHE label; the `$` unit tab is green like the coin tab is ochre.

## 2.2.2 currency symbol rule

One rule everywhere a number is displayed: the symbol carries the currency color (`$` green `--accent`, `¢` ochre `#d4ae68`) and the number stays white. Applied to the page-1 windows and the ledger (unit tabs), the collapsed header (`.cash-symbol`, `.coin-symbol`, and its cache award chips), prices (`priceMarkup` emits `<i class="sym sym-money|sym-coin">`), the research panel's effect line, the statistics tab (`symbolMarkup`) and the cache strip yields. Prose in settings and notices keeps plain symbols. The locked-card label no longer wraps (`.node-price .locked`).

## 3.0 환생 (prestige) and the bloom map

Built from the roadmap the user dictated (below, kept for reference) plus the follow-up decisions: coins reset too; tokens scale with the dollar balance; the first prestige is worth at least 10 tokens, calibrated to "finish the tree, then wait about five minutes"; a first prestige buys roughly one sector of automation plus a ×2–×3 on production; cheat mode makes prestige nodes free; no new mainland studies (not designed) — only the prestige system and the prestige map, whose undesigned slots are visible reserved nodes; 6–10 nodes per petal with upgradable nodes; the whole prestige tree is meant to take about four hours; the statistics tab was reorganized for the new system; tokens are fractional.

- Trigger (`prestigeReady` in `data.js`): every study at its cap and `money ≥ PRESTIGE_THRESHOLD = $5.00Dc` (5e33; the final study costs about $2.9Dc and late production is ≈ $4No/s, so the threshold is a few minutes of waiting after AXIOM). Once the tree is complete the center panel shows a 환생 button left of the navigator (disabled with the remaining amount until the threshold is met, then showing the tokens); when prestige becomes available a sticky notice appears once per run and the center node carries a ✿ badge. A confirm dialog states the balance and the tokens. Both center-panel buttons are dark with bright text: pink for 환생, white for the navigator. Notice copy stays terse, in keeping with the rest of the game.
- Tokens (`tokensFor` in `prestige.js`): `10 · √(money / $5.00Dc) · (1 + REWARD MODEL) + DISTILLATION`, rounded to two decimals (balances keep two decimals; node costs are whole). At exactly the threshold: 10; four times the threshold: 20.
- Reset (`prestige` in `data.js`): studies, dollars, coins, cache timer, camera and the automation checks reset; prestige count, tokens, prestige levels, lifetime statistics, settings and the world clock remain. `stats.prestigeRuns / lastRunSeconds / runStart` record runs. The offline snapshot restarts at the base rate.
- Prestige tree (`prestige.js`): 36 nodes, ids 1001–1036, five petals from a pentagon center with the mainland's row/upstream rule (1-2-2-2-1 ×3, 1-2-2-1 ×2). DORMANT (offline reward), SCALING (production), AGENT (automation, one AUTOPILOT per mainland sector), EXPANSION (6 reserved nodes for studies that are not designed yet), REWARD (REWARD MODEL ×tokens, DISTILLATION +tokens, 4 reserved). Reserved nodes are visible, named and dotted, never purchasable; `petalProgress` ignores them so a petal can still light up. 26 purchasable nodes, 66 levels, 451 tokens in total. Effects aggregate in `prestigeBonuses` and apply in `economy()` (base/multipliers/cache/discount) and `offlineParams()` (full window, decay constant, offline rate).
- Pacing: `scripts/prestige-sim.mjs` simulates the loop with automation; the whole prestige tree completes in about 3.9 hours over four prestiges (≈135, 52, 37 and 11 minutes).
- Automation (`autoResearch`): each owned AUTOPILOT shows an AUTO check beside its sector heading on the mainland; while checked, that sector's cheapest affordable unlocked study is bought (up to six per second). A sector cannot run ahead of its gate, so an unopened sector never completes by itself. Checks clear on every prestige.
- Map (`prestige-layer` in `index.html`, `bloom.js`): the flower shares the viewport and the camera code; `state.map` selects the layer (the mainland layers are hidden by the `hidden` attribute, which also works on SVG). The flower's land is five separate angular lobes (`buildLand` with no center land) around a bare pentagon hub with the same rotating polyhedron. Discovery, ghost cards, link flashing, petal completion lighting on the hub, the navigator (petal list) and the center panel all mirror the mainland.
- Theme: `body.theme-bloom` swaps the color tokens (background dark blue-gray, accent pink, grid kept) and restyles every surface — header, cards, ledger, cache strip, panel, buttons, dialogs, navigator, settings, toasts; the whole game cross-fades and colors tween on a map switch. Steady rain (thin slanted streaks) and a few drifting cherry petals are drawn on a canvas only while the flower is shown and motion is on; fog is at the edges only. There is no theme setting; the theme belongs to the map.
- Switching maps: the header's map button (a map tab like the navigator; the flower is locked until the first prestige) and the navigator's 지도 이동 row. Each map remembers its own selection.
- Rebirth sequence: confirm → blackout with the spinning UNBRIK polyhedron, "N번째 환생 · ✿tokens" → the mainland resets under the blackout → the flower appears with a sticky notice.
- Statistics: MAINLAND (nodes, levels, production, cache, lifetime gains), REBIRTH (count, condition, tokens held and earned, nodes, production multiplier, automation, current run, last prestige), TIME (play time, offline). Removed as noise: purchase count, total spent, peak rate, offline-equivalent production, current session, cost discount. A BLOOM PETALS block appears after the first prestige.
- Save: `currencies.token` (fractional), `prestige {count, tokensEarned, tokensSpent, purchases, levels, auto, last}`, `map`, the new `stats` keys and `offline.full/decay` are all optional on load, so 2.2 saves load unchanged.

### 3.0.3 prestige interface

- Terminology: the five branches are 환생 섹터 (sectors). "Petal" is only the visual motif and the internal code name (`petal*`, `PETAL_ROWS`); no player-facing text says 꽃잎. Wording matches the mainland: 연구 (not 노드), 완료 (not 완성), 선행 연구 필요, 남은 연구로 이동, 완료한 섹터.
- Map tab: both rows read "N / total 연구 · balance"; the prestige map is named 환생.
- Prestige center: an inverted pentagon so its flat edges face the five sectors, built like the mainland octagon — orbit track with the travelling highlight, an inset outline, one light bar per sector along its edge (lit on completion; the night theme no longer overrides the lit color), the overlapping-triangles logo behind the polyhedron, and the research progress bar.
- Loading screen: the triangles logo sits behind the spinning polyhedron, as on the center node.
- Rain: about a quarter of the 3.0.2 density.
- Header page dots: the night theme no longer hides the current-page dot.
- Icons: the map button and map tab use a map icon; the 36 prestige studies have their own Lucide icons (dormant: bookmark, coffee, moon, hourglass, anchor, book, camera, cloud-moon; scaling: sprout, flame, gem, footprints, eye, tag, sliders, zap; agent: bike → rocket, one vehicle per autopilot; expansion: door, compass, hammer, palette, telescope, scale; reward: star and desserts, gift). `prestige-check` asserts they are distinct and never reuse a mainland or interface icon.

### 3.0.2 interface audit

The user asked for a review of interface problems and of changes made without being asked. Fixed:

- Mainland layers showed through on the prestige map. `#sectorRegions`, `#spokes` and `#edges` are SVG elements, which have no `.hidden` property, so setting it did nothing; the layer switch now toggles the `hidden` attribute. After a prestige the stale mainland land (completed sectors) stayed drawn on the flower.
- Labels renamed on the prestige map without being asked: UPGRADE TREE → BLOOM TREE, RESEARCH NETWORK → BLOOM NETWORK, RESEARCH CENTER → BLOOM CENTER, CENTER / 00 → BLOOM / 00, the navigator eyebrow. All restored; the map keeps the mainland wording.
- Weather: rain is the constant effect (long thin streaks at a 17° slant, no longer tied to the world weather); the drifting cherry petals were drawn wide with a deep notch and read as hearts — now small, elongated, tumbling, and fewer.
- A blue glow in the middle of the prestige map hid the nodes; the fog is now only at the edges.
- `$` turned pink on the prestige map because the theme overrides `--accent`; money symbols are pinned to green.
- Weather notices turned pink on the prestige map (the theme's toast rule came later with equal specificity); the theme now styles only ordinary notices.
- Prestige studies used an invented verb (개화); they use the mainland's 연구 / RESEARCH COST.
- Petal land was always drawn (dashed); like the mainland, it now appears only when the petal is complete.
- The availability mark asked for was a small square; the round pulsing ✿ badge became a plain square.
- Statistics: the 2.2.2 labels (LIVE TELEMETRY, 구매한 노드) and order are restored; only the removed entries stay removed and the REBIRTH block follows. Two info-tab rows added without being asked are removed.
- Two stray color tweaks on the prestige map (day icon, CHEAT badge) removed.
- Switching maps reset the camera to fit; each map now keeps its own view.

### Roadmap as dictated (for reference)

- Trigger: all research complete, then a set amount of dollars accumulated → prestige. Progress restarts from the beginning; the run yields prestige tokens.
- Prestige map: a separate menu with its own theme. Mood: dreamy, romantic night — dark night sky, a rain-like background effect, the existing grid kept, cherry blossoms drifting (the key visual). Logo wordmark green → pink, background dark green tone → dark blue-gray; the change is tweened. Every interface part must follow the map's theme; there is no separate theme setting.
- Prestige tree: flower-shaped; pentagon center node; five branches: offline reward, base production, upgrade automation, new upgrade unlocks, undecided. Node names use AI terminology. The tree shares the main map's gimmicks (completion lighting, navigator).
- Automation nodes: one per chapter; owning one adds a check box next to that chapter's heading; when checked, the chapter's upgrades are bought automatically whenever money allows.
- Switching maps: through each map's center node, and through a map button next to the settings button that opens a map tab.

## Save boundary

Current key: `unbrik-save-v2`, schema version 2, economy epoch `unbrik-2.0-rework`, layout version 3 (2.0 and 2.1 saves load; 2.0 saves only drop their camera). `map` and `world` are optional on load and default to the main map at 07:00, clear. Old `axiom-save-v1` progress is not converted or imported. On first load, preferences are copied and a new run starts, then the normal autosave uses the new key. The old key is left untouched so an old open tab cannot overwrite new progress. A reload of valid v2 data does not reset it. The UI's existing manual RESET safeguard is retained.

## Source map

- `data.js`: row plans and prerequisite wiring, state, economy, atomic purchase, cache tick and validation.
- `research.js`, `prices.js`: static research definitions and price tables.
- `layout.js`: sector placement, grid-derived land, traced and straightened coast/borders, headings, link paths.
- `app.js`: renderers, gestures, header, navigator, lifecycle and local save.
- `offline.js`: two-currency departure snapshot and decay settlement.
- `icons.js`: 80 existing embedded Lucide icons plus 25 distinct geometric icons.
- `hub.js`, `camera.js`: dodecahedron projection and cancellable movement.
- `effects.js`, `notifications.js`: selection guard, opal motion, toast deadlines.
- `prestige.js`: the prestige node table, petal layout, token formula, purchases and aggregated bonuses.
- `bloom.js`: petals-and-rain canvas for the prestige map.
- `index.html`, `style.css`: game interface; the 2.1 header, the 2.2 header pages and the 3.0 bloom theme/prestige layer are the last blocks of `style.css`.
- `UNBRIK_3.0.html` (repository root, optional): single-file build of `dist/` (inline CSS, bundled script) that runs from `file://`; regenerate with `scripts/bundle-single.mjs` after changing `dist/`.

## Verification

Run `npm run check`, `node balance-check.mjs`, `node ui-check.mjs`, `node offline-check.mjs`, `node layout-check.mjs`, `node effects-check.mjs`, `node motion-check.mjs`, `node notification-check.mjs`, `node prestige-check.mjs`; `node scripts/prestige-sim.mjs` prints the prestige pacing.

Checks cover the prestige node table, petal lobes, token formula, reset semantics, cheat-free prestige, automation gates, offline windows and prestige save round-trips; the prestige row, the rebirth flow, flower discovery, token purchases, reserved nodes, map switching and automation checks against the real renderers; stacked and sticky notices, weather kinds, the world clock, weather roll, ledger pages, pager controls and map-aware cache strip; reachable prerequisites; finite costs and distinct icons; exact initial coin production; both-currency shortages with no partial debit; cheat guards; cache snapshot consistency; split, duplicate and reloaded offline settlements; save epoch rejection; row plans, upstream-only prerequisites and non-crossing links; every card inside its own sector polygon and outside the others, headings off the land, all eight sectors forming one connected mainland; hidden-sector boundaries; complete-card re-selection; gesture cancellation; navigator state; settings and reduced-motion combinations; original color/opal constraints.

The current managed environment does not provide browser preview for plain static Sites. Controlled real-handler tests and geometry checks are not a claim of Android Chrome or visual browser QA. Physical-device typography, compositing and browser touch behavior require device validation.
