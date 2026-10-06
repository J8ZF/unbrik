# AXIOM · Upgrade Tree

Mobile portrait incremental game. 80 connected math/computer science research nodes, 17 repeatable nodes, 433 total levels.

## Run and edit

Static assets live in `dist/`. Serve that directory over HTTP. No build or third-party runtime dependencies. Sites serves this directory directly. Node ES modules prevent direct `file://` use in browsers; the published site is the intended play surface.

- `data.js`: declarative content, graph, economy, guarded purchases, save validation and versioning.
- `app.js`: UI, touch/pinch camera, foreground-only game loop, local autosaves and export/import.
- `style.css`: portrait circuit-board UI and motion states.
- `index.html`: screen and settings surfaces.

Run `node check.mjs` for engine and static integrity checks.

## Game rules

Start with $0 and $1 per second. First purchase costs $10. A research purchase never happens from a gesture on the map; select a node then press the separate purchase button. AND prerequisites, an OR prerequisite node, convergence, cross-sector connections, finite repeatable research, periodic cash bonuses, cost reduction, scaling reduction, production exponents and later optional automation are supported. SCHEDULER unlocks automatic repeatable purchases every 5 seconds; enable it in settings. Only already-purchased repeatable research can be automatically upgraded.

Production stops while the document is hidden or closed. There is no offline production, prestige or secondary currency in 1.0. The versioned state already stores a currency map, derived effects are recalculated on load, and nodes carry stable IDs and prerequisite levels for later expansion. Max numeric magnitude is 1e280, well above the current maximum-rate range (~1e73); a larger-number library will be needed if future content exceeds that range.

Save data is explicitly device-local, following the agreed plan. Autosave every 10 seconds, after purchases, and on hiding/unloading. Last valid save is backed up locally. Export/import handles device transfer. Reset requires typing RESET. Settings also contain motion, touch feedback, haptic and numeric notation preferences and detailed statistics.

## Validation

- 80 stable unique nodes with acyclic valid prerequisite references; all nodes reachable.
- Start rate, insufficient-balance rejection, duplicate single-purchase rejection, repeated purchases and AND convergence.
- Every node purchased and every level maxed without non-finite production.
- Round-trip save restoration; invalid version, balance, prerequisite or level rejected.
- Timed income and repeatable auto-purchase verified.
- Greedy-cheapest progression simulation completes all 80 nodes and 433 levels in about 20.8 active hours; real play varies. Simulation is a balance baseline, not a duration guarantee.
- HTML IDs and JavaScript element references checked; JavaScript syntax checked.
- Browser visual QA and real device multi-touch QA unavailable in this execution environment; not performed.
- Optional WebMCP tools feature-detect `document.modelContext`, use UI purchase guards, and include read/select/purchase. Supported WebMCP context unavailable for runtime validation.

## References

Genre references supplied in the planning conversation: Roblox Upgrade Tree Incremental, Everything Upgrade Tree, The Upgrade Tree Of Life. Interface and implementation are original; no external artwork is used.
