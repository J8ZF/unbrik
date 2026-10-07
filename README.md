# UNBRIK · Upgrade Tree — v1.7.0

Portrait incremental game with 80 math/computer-science nodes, 19 repeatable studies and 261 total research levels.

## Source and validation

Static files are in `dist/`; serve over HTTP (ES modules are not intended for `file://`). No build or third-party runtime request is required.

- `layout.js`: radial coordinates, sector hulls and edge paths.
- `data.js`: graph, fixed level-price tables, income, guarded purchases and save migration.
- `icons.js`: 80 distinct Lucide SVG path icons and interface icons, embedded locally. License in `icons-license.txt`. `brand.js` supplies the shared original three-triangle SVG mark; no font asset is required.
- `hub.js`: regular dodecahedron projection and center SVG geometry; `camera.js`: cancellable camera tween helpers.
- `effects.js`: visibility-gated opal motion and scoped selection protection.
- `updates.js`: version history and two-entry pagination.
- `offline.js`: departure-income snapshot, integrated exponential decay and settlement cursor.
- `app.js`: game UI, map gestures, visibility/focus lifecycle and local saves.
- `index.html`, `style.css`: portrait interface and bounded SVG containers.

Checks: `node check.mjs`, `node balance-check.mjs`, `node offline-check.mjs`, `node ui-check.mjs`, `node layout-check.mjs`, `node motion-check.mjs`, `node effects-check.mjs`.

## Corrected interface 1.7

The 1.6 layout, node markup, selected rings, panel progress, prerequisite chips and navigator are restored. No ready badge or corner brackets are added. Existing purchase-ready highlights and the available research action use white, including repeatable nodes; the main accent remains #B9F36D. The header UNBRIK text matches the settings wordmark's accent.

Only sector 8 research-node surfaces receive four softly overlapping color fields, sampled from the supplied opal direction: blue-violet, pale green, pink and cyan. Each field occupies a different corner; the positions interpolate through four arrangements with pauses between them. The white icon, text and sector identity remain. No new hub decoration, region wash or navigator/detail icon surround is added. The existing animation toggle, live OS reduced-motion preference, viewport visibility, map zoom/tween and inactive-session controls govern motion; static fields remain when animation is off. Text selection protection on game controls still permits save-field selection and paste.

A sector is revealed only when its entry research is unlocked or already purchased. Cross-sector supplementary prerequisites do not reveal its nodes, ghost placeholders, headings, navigator rows, statistics, connecting paths or full-map fit bounds. Navigation checks the same gate and does not move the camera if selection fails. Twelve progression boundary cases exercise all eight sectors, including the former node 9, 25 and 37 early-reveal cases. No prices, prerequisites, saved progress or reset behavior were changed.

## Center and interface 1.6

The shared nested-triangle logo is now an inline SVG with a square viewBox and bounded geometry, including the narrow-phone header. Sector 7 is yellow (#F2DA5B), sector 8 white (#F2F4F7). Center, navigator surfaces and center actions use neutral gray/white; navigation icons and current-row accents retain their own sector colors.

The center uses an octagonal enclosure, a background triangle and a separately centered UNBRIK wordmark. Highlights travel along a stationary octagonal path; the eight completion segments remain fixed. Dodecahedron face normals and edge adjacency classify silhouette, front edges and dashed hidden edges. The silhouette matches the convex hull of projected vertices across 480 sampled frames, and artwork was rendered at six rotation angles for inspection. Animation respects reduced-motion preferences and the existing 30 fps/offscreen limits.

Navigator selection reserves the bottom panel immediately with a disabled gray ellipsis button. Menu close, single panel reveal and camera movement are coordinated; the final purchase state commits from current game data when movement completes. Later selections invalidate earlier callbacks, manual gestures settle the selected research, and viewport resizing retargets movement without dropping completion. Button dimensions remain stable across states. Controlled actual-handler tests exercise money changes during movement, normal/free/complete states, rapid retargeting, gesture interruption and viewport changes. Navigation hints reflect whether any sector remains unfinished, and scrollable lists show a continuation hint.

Center, research focus and full-tree fitting use unobstructed rectangles beside or above map controls. Width and height changes both reframe the current focus. Existing full-tree optimizations and save migration remain in place. No research balance, prices, prerequisites, reset behavior or save schema changed.

Browser layout/compositing and Android hardware rendering were not directly available; mathematical projection tests, SVG renders and the controlled DOM/animation adapter are not a physical browser QA claim.

## Radial map 1.4

UNBRIK is the site and central navigation node; AXIOM remains research 80. The center is not an extra purchasable research. Five radial arms contain sectors 1–2, 3, 4–5, 6, and 7–8. `layout.js` supplies node coordinates, convex sector outlines, center spokes and directional links. Research conditions, prices and bonuses are unchanged. Links between different arms appear when an endpoint is selected; the existing prerequisite chips remain available.

The center and the map’s center button select UNBRIK; the bottom panel opens its eight-sector navigator. Discovered sectors jump to an unfinished eligible research, or the sector’s first node when finished. Completing every level of every node, including long-term repeatables, displays that sector’s translucent colored enclosure. Node and sector enclosures are checked for overlap, and actual geometry was rendered for inspection.

Layout revision 1 discards legacy vertical-map camera coordinates while retaining money, levels, timers and settings. Legacy saves open the top HUD once on migration; subsequent collapsed/expanded preferences are preserved. The original save key and hosted URL remain in use to retain browser-local progress.

## Interface and test mode

The top HUD starts expanded. It can collapse to money, production, settings and an icon-only expansion control with an accessible label. The same SVG chevron rotates 180 degrees over 240 ms when expanded, respecting reduced-motion preferences. Expanding restores the original full resource and research summary. Its state is saved. The lower research panel also has a labeled collapse/expand control, retains the selected node while collapsed, and opens when a research node is selected. Its collapsed state is saved as well. Named SVG aliases now resolve both research and interface requests, including the formerly missing X and Plus icons.

Settings includes an opt-in free research cheat, off by default. With it on, manual and automatic purchases require no money and do not change the balance or earned/spent statistics. Displayed prices remain the normal research prices. Prerequisites and maximum levels still apply. Turning it off restores normal charging without rolling back research or altering money. An on-screen badge and the purchase button indicate free research. Saves/imports preserve the toggle; older saves default to off. The existing RESET confirmation and deletion controls are unchanged.

Regression checks cover normal/cheat/automatic purchases, guards, finite caps, old-save defaults, setting round trips and all named interface SVGs. The actual disclosure renderers and handlers are exercised through a minimal element adapter in `ui-check.mjs`; this does not constitute browser layout testing.

## Balance 1.2

Start at $0 and $1/s. First purchase costs $10. One-off bonuses, 5/10/20-level local studies, gradual growth and two long-term studies share the same 80-node graph. Finite local repeatables target the following region: region 1 finishes in region 2, region 2 in region 3, etc. These are economic targets, not hard progress locks. Prerequisites require one level unless explicitly specified in the node data.

TRUTH TABLE (region 4, 20 levels) and DYNAMIC PROGRAM (region 6, 10 levels) extend to region 8. Existing one-off cores still give larger immediate bonuses. Compressed repeatables have larger per-level effects; additive and recursive components retain their former full-level effect scales where applicable. Price arrays are generated deterministically at initialization from an authoring timeline and never adapt to the player's wealth or progress.

Fresh-save simulations checking purchases every 3–10 seconds finish all 80 nodes in approximately 142–147 active minutes. Region 3 completes in 16–19 minutes. Cheapest-first, affordable-new-first and auto-buy variants pass. This is a test baseline, not a human completion guarantee, and excludes offline income.

SCHEDULER enables optional automatic repeatable purchases every 5 seconds while active. Only already-purchased repeats are automatically upgraded.

## Offline production

Let `t` be seconds since departure and `P` the departure production snapshot, including the average cash contribution of periodic cache bonuses. Research and auto-purchases do not advance while absent.

Efficiency is `1` through 1,800 seconds, then `exp(-(t-1800)/600)`. Cumulative income is:

`P * [min(t,1800) + 600 * (1-exp(-max(0,t-1800)/600))]`.

This yields 30 full-production minutes after 30 minutes away, ~39.502 minutes after one hour, and ~39.999 minutes after two hours. There is no elapsed-time cutoff: the positive tail approaches a 40-minute equivalent. Floating-point values eventually round to the asymptote.

The ledger retains the departure timestamp and settled-through timestamp, so partial settlements do not restart the full-efficiency period. The app saves the awarded balance and a new active checkpoint immediately after returning. Repeated visibility/pagehide events, saves while hidden and reloads do not repeat the same payout. Regular visible saves also preserve a production snapshot for abrupt page termination. Browser visibility, pagehide/pageshow and window blur/focus drive absence detection.

## Saves and migration

Save key and schema version remain `axiom-save-v1` / version 1. Content revision is 3. Device-local autosave every 10 seconds, on purchases and lifecycle changes, with a previous valid backup and manual JSON export/import.

For revisions 1 and 2, repeatable levels migrate by completed proportion, rounding up: old completed repeatables stay MAX under the revised caps. The two newly extended one-off studies receive levels covering their prior per-level coefficient (TRUTH TABLE 11/20, DYNAMIC PROGRAM 6/10 if already owned). Money, historical spend, purchases, play time, settings, timers and camera are retained. New offline statistics default to zero. Legacy saved timestamps can supply the first offline reward. Import applies the snapshot and begins a new offline checkpoint rather than repeatedly claiming the imported timestamp.

Numbers are finite JavaScript numbers capped at 1e280, above the current fully researched rate (~4.8e74).

## Checks performed

- DAG integrity, all 80 nodes reachable, finite monotonic level prices and guarded purchases.
- Every research level purchasable; timed bonus and auto-buy behavior.
- 2–3-hour progression under the above purchase strategies and research lifetimes by region.
- New-schema round trip and old-schema cap/level migration, including formerly single-purchase long-term studies.
- Offline boundaries, exact integral, positive diminishing tail, cache-income snapshot, split settlement equivalence, duplicate settlement/reload rejection, invalid clocks, and actual app save/suspend/resume functions under a controlled clock.
- 80 unique SVGs containing paths/geometries and no text/image/external references, rendered together for visual inspection. Icons have 24×24 view boxes, 30px display dimensions and clipped containers in nodes/details.
- Local asset references, unique HTML IDs and JavaScript syntax.

Full browser layout QA and physical Android multi-touch QA remain unavailable in this environment. No new browser-level verification is claimed. Optional WebMCP tools reuse the UI guards; supported runtime validation was unavailable.

## Credits

Genre references from the planning conversation: Roblox Upgrade Tree Incremental, Everything Upgrade Tree and The Upgrade Tree Of Life. Lucide icon paths are embedded under ISC/MIT terms in `dist/icons-license.txt`.
