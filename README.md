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
- Up/Down selects a category, Right or Enter opens its submenu to the right, and Left returns to the category list. Right or Enter changes the selected submenu option.
- The persistent `GeekMenu` button also opens and closes the Call-of-Duty-style panel.

Settings are disabled by default and persisted in Tampermonkey storage with a `localStorage` fallback. The native API is available as `window.__SURVEV_RESEARCH__` from the main menu onward.

GeekMenu groups every control into expandable Aimbot, Combat, Automation, Visuals, ESP, and Trust Lab categories. The category list and right-hand submenu also support mouse navigation.

## Feature reference

This section tracks the controls in GeekMenu 0.3.10. When a menu option is added, removed, or changes behavior, this reference should be updated in the same release.

### Aimbot

| Setting | Behavior |
| --- | --- |
| Aimbot enabled | Aims an equipped gun at the best eligible enemy. It remains inactive for fists, melee weapons, throwables, and consumables. |
| Profile | `Default` uses a 260-pixel FOV, 200-unit range, crosshair priority, and no prediction. `OP` uses a 1500-pixel FOV, 1000-unit range, sticky distance priority, and prediction. `Custom` uses the individual settings below. Default and OP only aim while firing. |
| Aim while firing | In Custom profile, only acquire and track while primary fire is requested. |
| Trigger mode | While left click is held, forwards fire only when Aimbot has a reachable target. It suppresses fire when no target qualifies and resumes when one does. This is a held-fire gate, unlike Triggerbot. |
| Predictive aim | In Custom profile, tracks and smooths motion across network updates, compensates for snapshot age and measured latency, and solves an intercept using perk-adjusted bullet speed and range. Direction reversals reset the smoothing quickly. OP always enables this behavior. |
| Aim at downed | Allows downed enemies in Custom profile. Default and OP ignore downed enemies. |
| Triggerbot | Automatically aims and fires whenever an eligible target is acquired; left click is not required. |
| Aim FOV | Custom-profile acquisition radius around the cursor, from 20 to 1500 screen pixels. |
| Aim range | Custom-profile maximum world distance, from 10 to 1000 units. The equipped bullet's shorter physical range still wins. |
| Priority | Custom-profile target scoring: closest to the crosshair, shortest world distance, or lowest health. |

Aimbot, Trigger mode, and Triggerbot use the same reachability filter. A target must be an enemy within the selected FOV and configured aim range, within the equipped gun's actual bullet distance, on a compatible layer, and unobstructed by a solid bullet-height obstacle or another player. Predictive aim validates the predicted intercept path.

### Combat

| Setting | Behavior |
| --- | --- |
| Precision fire | Paces held fire using the gun's recoil and fire-delay timing instead of sending a shot continuously. |
| Movement accuracy | Briefly clears movement input around predicted firing ticks, then restores movement between rounds. The window is aligned to the authoritative 100 Hz server tick. |
| Bump fire | Repeats the shot-start input while holding a single-fire gun. |
| Auto reload | Requests reload when the equipped gun is empty and matching reserve ammunition is available. |
| Auto switch | After firing a slower gun, switches to the other loaded primary/secondary weapon. |
| Spin | Rotates aim continuously and takes precedence over Aimbot while enabled. |
| Spin speed | Controls spin angular speed from 0 to 20 radians per second. |

### Automation

| Setting | Behavior |
| --- | --- |
| Auto pickup | Requests pickup for the nearest eligible item. Empty primary or secondary gun slots are filled first. Cosmetic outfits and colored clothing are always ignored. |
| Upgrade guns | With both gun slots filled, only picks up a gun whose damage, fire rate, range, and spread score is at least 8% better than the active gun. |
| Pickup supplies | Allows Auto pickup to collect useful non-gun loot, including helmets, armor, backpacks, scopes, ammo, healing items, and throwables. Disable it for gun-only automatic pickup. Cosmetic outfits remain excluded. |
| Auto heal | Uses a healthkit when available, otherwise a bandage, when health is at or below the configured threshold and no other action is active. |
| Heal below | Sets the Auto heal health threshold from 1 to 99. |
| Auto doors | Uses a nearby unlocked, closed, interactable door on the player's current layer. |

### Visuals

| Setting | Behavior |
| --- | --- |
| Extended zoom | Multiplies the camera's target zoom to show more of the map. |
| Zoom scale | Sets the zoom multiplier from 0.25 to 1. Lower values show a wider area. |
| Player tracers | Draws colored lines from the local player to players accepted by the ESP range and teammate filters. |
| Grenade timer | Shows the remaining fuse time above the player while cooking a throwable. |
| Grenade trajectory | Draws the current throw direction, endpoint, and approximate landing-radius marker. |
| Weapon cone | Draws the equipped gun's bullet-range cone using its standing or moving spread. |
| Enemy weapon/reload | Labels nearby players with their active weapon and a `RELOAD` indicator while reloading. |
| Off-screen indicators | Draws edge arrows toward active off-screen players. |
| Danger zones | Draws explosion-radius overlays for active throwable projectiles and active airstrike zones. |
| Spectator counter | Displays the local spectator count in the diagnostics overlay. |
| Visible names | Forces active remote-player name labels visible. |
| Low-opacity smoke | Caps smoke-particle opacity while preserving each particle's native fade. |
| Smoke alpha | Sets the smoke opacity cap from fully transparent (`0`) to native opacity (`1`). |
| Low-opacity obstacles | Caps visible obstacle sprite opacity without replacing or mutating textures. |
| Obstacle alpha | Sets the obstacle opacity cap from fully transparent (`0`) to native opacity (`1`). |

### ESP

| Setting | Behavior |
| --- | --- |
| Show teammates | Includes teammates in Player tracers. Enemy tracers remain enabled whenever Player tracers is enabled. |
| Maximum range | Sets the distance limit used by Player tracers and enemy weapon/reload labels, from 10 to 1000 world units. |
| Enemy color | Selects red, orange, or purple for enemy tracers and off-screen indicators. |
| Team color | Selects green, blue, or white for teammate tracers. |

### Trust Lab

Trust Lab is available only on `localhost` and `geekbar.xyz`; the mobile identity control is disabled elsewhere.

| Setting | Behavior |
| --- | --- |
| Mobile identity (rejoin) | Reports a mobile client on the next match join to test server handling of the client-provided mobile flag. |
| Culling sweep | Alternates portrait input to test the server's portrait/landscape object-culling boundary. |
| Input diagnostics | Displays target state, eligible-target count, movement/fire flags, aim direction/range, and Trust Lab claims. |

### Deliberately unsupported

X-ray/ceiling removal and atlas recoloring fail closed. Earlier approaches mutated shared Pixi texture state and caused red tinting, broken assets, invalid WebGL uniforms, and renderer corruption, so these unsafe texture hooks are not part of the source-native client.

GeekMenu settings are persisted through Tampermonkey storage and mirrored to page storage as a fallback. This keeps the selected aimbot profile and other controls stable across reloads and across the allowlisted project domains.

On `localhost` and `geekbar.xyz`, GeekMenu exposes a Trust Lab section. Its mobile-identity probe applies on the next match join and tests the server's client-reported mobile pickup behavior. Movement accuracy exercises the one-tick movement-spread boundary, while Culling sweep tests portrait-controlled visibility. Diagnostics show the active claims; destructive crash and denial-of-service probes are intentionally excluded.

## Diagnostics

`window.__SURVEVGPT_NATIVE_STATUS__` reports loader stages such as `authorized`, `stock-client-blocked`, `waiting-for-dom`, `payload-injected`, `client-ready`, and failure details. `window.__SURVEV_RESEARCH__.status` reports aimbot state and target counts.

The client defaults API, assets, matchmaking, and ping/WebSocket discovery to the current page origin. `window.__SURVEV_NATIVE_CONFIG__` can optionally override regions, ping targets, pass type, or proxies before startup. No Geekbar server modification is required, but its server protocol must match the checked-in `survev/shared` protocol revision.

## Source revision and rollback

The native client is based on the deployed Survev client revision `f65d45b4dc9566e652b290a4cf8c6c5bc5da2216`, with the native integration recorded at `2d2ff838`. To roll back, disable the native userscript and reinstall the previously committed userscript artifact. The stock page is not modified.
