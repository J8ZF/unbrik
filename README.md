# AXIOM · Upgrade Tree

Mobile portrait incremental game. 80 connected math/computer science research nodes, 17 repeatable nodes, 433 total levels.

## Run and edit

Static assets live in `dist/`. Serve that directory over HTTP. No build or third-party runtime dependencies. Sites serves this directory directly. Node ES modules prevent direct `file://` use in browsers; the published site is the intended play surface.

- `data.js`: declarative content, graph, economy, guarded purchases, save validation and versioning.
- `app.js`: UI, touch/pinch camera, foreground-only game loop, local autosaves and export/import.
- `style.css`: portrait circuit-board UI and motion states.
- `index.html`: screen and settings surfaces.

Run `node check.mjs` for engine/static integrity and `node balance-check.mjs` for progression, cross-region repeatables and legacy-save compatibility.

## Game rules

Start with $0 and $1 per second. First purchase costs $10. A research purchase never happens from a gesture on the map; select a node then press the separate purchase button. AND prerequisites, an OR prerequisite node, convergence, cross-sector connections, finite repeatable research, periodic cash bonuses, cost reduction, scaling reduction, production exponents and later optional automation are supported. SCHEDULER unlocks automatic repeatable purchases every 5 seconds; enable it in settings. Only already-purchased repeatable research can be automatically upgraded.

Production stops while the document is hidden or closed. There is no offline production, prestige or secondary currency in 1.1. The versioned state already stores a currency map, derived effects are recalculated on load, and nodes carry stable IDs and prerequisite levels for later expansion. Max numeric magnitude is 1e280, well above the current maximum-rate range (~5.2e75); a larger-number library will be needed if future content exceeds that range.

Save data is explicitly device-local, following the agreed plan. Autosave every 10 seconds, after purchases, and on hiding/unloading. Last valid save is backed up locally. Export/import handles device transfer. Reset requires typing RESET. Settings also contain motion, touch feedback, haptic and numeric notation preferences and detailed statistics.

## Validation

- 80 stable unique nodes with acyclic valid prerequisite references; all nodes reachable.
- Start rate, insufficient-balance rejection, duplicate single-purchase rejection, repeated purchases and AND convergence.
- Every node purchased and every level maxed without non-finite production.
- Round-trip save restoration; invalid version, balance, prerequisite or level rejected.
- Timed income and repeatable auto-purchase verified.
- v1.1 progression completes all 80 nodes in 152–161 active minutes when checking the cheapest available research every 3–10 seconds. New-node-first and unlocked automation variants also remain within 2–3 hours. These are simulation results, not guaranteed human completion times.
- Region three completes in roughly 15–19 minutes. Region-one repeatables finish in region three, region-two repeatables in region four, and region-three repeatables in region five.
- At the first gate the baseline has INCREMENT Lv.4/20 and MULTIPLY Lv.2/15; new regions no longer assume near-MAX local repeatables.
- ACCUMULATOR now costs $195 instead of $180,000. Every level has an authored fixed price calibrated along the research graph; prices are not dynamically increased based on a player's wealth or progress. Research discounts and scaling discounts still apply.
- Additive repeatables also multiply production by 1.05 per level, keeping older research useful alongside newer base-income sources.
- Save schema remains version 1; content version is 2. All existing balances, levels, statistics, preferences, timers and camera state are preserved. Previously purchased levels remain owned even if their current prices changed.
- HTML IDs and JavaScript element references checked; JavaScript syntax checked.
- Browser visual QA and real device multi-touch QA unavailable in this execution environment; not performed.
- Optional WebMCP tools feature-detect `document.modelContext`, use UI purchase guards, and include read/select/purchase. Supported WebMCP context unavailable for runtime validation.

## References

Genre references supplied in the planning conversation: Roblox Upgrade Tree Incremental, Everything Upgrade Tree, The Upgrade Tree Of Life. Interface and implementation are original; no external artwork is used.
