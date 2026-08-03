# SurvevGPT source-native research client

This repository packages the checked-in Survev client source as a self-contained Tampermonkey userscript for authorized testing on `localhost` and the project-owned `survev.io` and `geekbar.xyz` deployments. It does not patch or regex-rewrite an obfuscated production bundle.

The source-native build lives in the adjacent `survev` repository. `survev/client/src/research/` implements features through typed `Game`, input, player, camera, and Pixi APIs. The native Vite build emits one IIFE and embeds every generated texture atlas. The loader blocks the stock JavaScript client at `document-start`, preserves the page and non-JavaScript assets/API endpoints, and executes the embedded client in the page realm.

## Build

From this directory:

```sh
npm install
npm test
npm run build:native
```

The established install artifact is `dist/survevgpt-local.user.js`; `dist/survevgpt-native.user.js` is an identical alias. It is intentionally large (approximately 19 MB) because it contains the complete source-built client and its generated atlases.

Install `dist/survevgpt-local.user.js` in Tampermonkey and open an allowlisted host. Existing installation links now receive the source-native client directly.

## Controls

- `[` toggles the research settings panel.
- Arrow keys navigate the open panel, and Left/Right or Enter changes the selected setting.
- The persistent `GeekMenu` button also opens and closes the Call-of-Duty-style panel.

Settings are disabled by default and persisted in `localStorage`. The native API is available as `window.__SURVEV_RESEARCH__` from the main menu onward.

Supported modules include predictive and priority-based aim, triggerbot, recoil-paced precision fire, movement-accuracy input, configurable smart loot and auto-heal, auto-door/reload/switch automation, zoom scaling, colored and range-limited ESP, off-screen indicators, enemy weapon/reload information, grenade trajectory/timer and danger zones, spectator and input diagnostics, culling sweep, smoke/obstacle opacity, visible names, weapon cone, bump fire, and spin aim. X-ray/ceiling removal and atlas recoloring deliberately fail closed because mutating Pixi texture validity caused the earlier renderer corruption.

The aimbot profile selector provides Default, OP, and Custom behavior. OP enables full-range sticky acquisition and intercept prediction while firing; Custom uses the individual FOV, range, priority, prediction, and downed-target controls. Aim automation requires an equipped gun and remains inactive for fists, melee weapons, throwables, and consumables. Movement accuracy suppresses movement only when the equipped gun is due to fire and restores movement between shots.

GeekMenu settings are persisted through Tampermonkey storage and mirrored to page storage as a fallback. This keeps the selected aimbot profile and other controls stable across reloads and across the allowlisted project domains.

On `localhost` and `geekbar.xyz`, GeekMenu exposes a Trust Lab section. Its mobile-identity probe applies on the next match join and tests the server's client-reported mobile pickup behavior. Movement accuracy exercises the one-tick movement-spread boundary, while Culling sweep tests portrait-controlled visibility. Diagnostics show the active claims; destructive crash and denial-of-service probes are intentionally excluded.

## Diagnostics

`window.__SURVEVGPT_NATIVE_STATUS__` reports loader stages such as `authorized`, `stock-client-blocked`, `waiting-for-dom`, `payload-injected`, `client-ready`, and failure details. `window.__SURVEV_RESEARCH__.status` reports aimbot state and target counts.

The client defaults API, assets, matchmaking, and ping/WebSocket discovery to the current page origin. `window.__SURVEV_NATIVE_CONFIG__` can optionally override regions, ping targets, pass type, or proxies before startup. No Geekbar server modification is required, but its server protocol must match the checked-in `survev/shared` protocol revision.

## Source revision and rollback

The native client is based on the deployed Survev client revision `f65d45b4dc9566e652b290a4cf8c6c5bc5da2216`, with the native integration recorded at `0e6181d5`. To roll back, disable the native userscript and reinstall the previously committed userscript artifact. The stock page is not modified.
