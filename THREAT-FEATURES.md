# Threat-model feature coverage

This file maps `../THREAT-MODEL.md` to the localhost-only Tampermonkey harness.

| Finding | Harness coverage |
|---|---|
| 1.1 Drop-item match kill | Confirmed one-shot reproduction button |
| 1.2 Team-menu API kill | Server/API integration test required; not an in-match client feature |
| 1.3 Mobile claim | Mobile loot mode toggle |
| 1.4 Movement spread | Movement spread reproduction toggle |
| 1.5 Culling box | Portrait culling-union toggle; ESP exposes coarse streaming |
| 1.6 Deterministic co-location | Multi-client matchmaking integration test required |
| 1.7 Room-code entropy | Team-menu integration/fuzz test required |
| 1.8 Downed drop | One-shot reproduction button, gated on downed state |
| 1.9 Invalid game type logging | One-shot malformed-ID reproduction button |
| 1.9 Exact disguised HP | Requires an additional client bundle patch because the current renderer discards `healthT` |
| 1.9 Burst timing | Server balance test; not client-controlled |
| 1.9 Connection counter reset | Long-running server test; not client-controlled |
| 2.1 Object visibility exposure | Tracers, names, danger zones, weapon cones and x-ray |
| 2.2 Aim authority | Aim-assist and focused-target features |
| 2.3 Input automation | Auto-loot, auto-door behavior, auto-melee, auto-switch, bumpfire and input replay |
| 2.4 Rendering changes | X-ray, smoke/obstacle opacity, zoom, map highlighting, names and grenade timer |
| 2.5 Spectator enumeration | Timed spectator-sweep action |

Destructive actions are disabled until clicked and require confirmation where they can terminate a local match. Findings that require multiple browser clients, team-menu state, or server lifetime manipulation belong in an integration-test runner rather than an in-match Tampermonkey control.
