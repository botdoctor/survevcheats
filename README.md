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

This section tracks the controls in GeekMenu 0.3.26. When a menu option is added, removed, or changes behavior, this reference should be updated in the same release.

### Aimbot

| Setting | Behavior |
| --- | --- |
| Aimbot enabled | Aims an equipped gun at the best eligible enemy. It remains inactive for fists, melee weapons, throwables, and consumables. |
| Profile | `Default` uses a 260-pixel FOV, 200-unit range, crosshair priority, and no prediction. `OP` uses a 1500-pixel FOV, 1000-unit range, sticky distance priority, and prediction. `Custom` uses the individual settings below. Default and OP only aim while firing. |
| Aim while firing | In Custom profile, only acquire and track while primary fire is requested. |
| Trigger mode | While left click is held, forwards fire only when Aimbot has a reachable target. It suppresses fire when no target qualifies and resumes when one does. This is a held-fire gate, unlike Triggerbot. Flare guns bypass all aimbot and trigger gating. |
| Predictive aim | In Custom profile, tracks and smooths motion across network updates, compensates for snapshot age and measured latency, and solves an intercept using perk-adjusted bullet speed and range. Direction reversals reset the smoothing quickly. OP always enables this behavior. |
| Aim at downed | Allows downed enemies in every profile. Standing enemies always occupy a higher target tier, so a reachable standing enemy wins over every downed enemy regardless of priority score or shot-path type. |
| Melee mode | With Aimbot enabled and a melee equipped, begins tracking an eligible enemy 0.8 world units outside the equipped weapon's scaled attack reach. It aims using the server-style attack offset and radius, and attacks automatically only when the target overlaps the actual melee hit circle with no blocking obstacle. |
| Triggerbot | Automatically aims and fires whenever an eligible target is acquired; left click is not required. |
| Shoot through windows | Treats an intact window as soft cover. The aimbot keeps the target and fires the weapon-specific number of rounds needed to break the window before subsequent rounds continue through the opening. Other destructible obstacles remain hard blockers. |
| Ricochet aiming | Enables a conservative one-bounce fallback through server-reflective rectangular obstacles. It is evaluated only when no direct or window shot exists, and explosive rounds are excluded because the server does not reflect them. |
| Show ricochet path | Draws the accepted muzzle-to-bounce segment in cyan and bounce-to-target segment in amber without changing target selection. |
| Ricochet confidence | Controls edge clearance and accepted incidence angle from `0.5` to `1`. Higher values reject more marginal bounce solutions. |
| Maximum bounce angle | Limits the configured incidence angle from 10 to 85 degrees; the confidence threshold can make the effective limit stricter. |
| Reflector distance | Limits the reflector search radius from 10 to 500 world units. Only the nearest 12 eligible reflectors are considered. |
| Aim FOV | Custom-profile acquisition radius around the cursor, from 20 to 1500 screen pixels. |
| Aim range | Custom-profile maximum world distance, from 10 to 1000 units. The equipped bullet's shorter physical range still wins. |
| Priority | Custom-profile target scoring: closest to the crosshair, shortest world distance, or lowest health. |

Aimbot, Trigger mode, and Triggerbot use the same muzzle-aware reachability solver. It accounts for barrel length, lateral barrel offset, alternating dual-wield hands, and muzzle clipping against nearby obstacles. A target must be an enemy within the selected FOV and configured aim range, within the equipped gun's actual muzzle-to-target bullet distance, and on a compatible layer. Clear direct shots always win. When enabled, intact windows are a second-priority soft-cover path; weapon damage, obstacle multiplier, falloff, AP-round multiplier, window health, and remaining health determine the break-round estimate. Ricochet is a bounded final fallback that validates both legs from the muzzle against obstacles and intervening players, rejects edge and shallow-angle solutions, and extends predictive lead for the reflected path's additional flight time.

### Combat

| Setting | Behavior |
| --- | --- |
| Precision fire | Paces held fire using the gun's recoil and fire-delay timing instead of sending a shot continuously. |
| Movement accuracy | Uses the locally observed authoritative shot cooldown to create a movement-free server sample before each gunshot. It briefly gates firing for that preparation sample, keeps movement released through the firing window, and restores movement during the rest of the weapon cooldown. An empty magazine or active reload immediately releases the movement cycle even while fire remains held. It runs after aimbot/trigger decisions, ignores non-gun weapons, supports keyboard and touch movement, and is available on every allowed URL. |
| Bump fire | Repeats the shot-start input while holding a single-fire gun. |
| Auto reload | Requests reload when the equipped gun is empty and matching reserve ammunition is available. |
| Auto switch | After firing a slower gun, switches to the other loaded primary/secondary weapon. |
| Spin | Rotates aim continuously and takes precedence over Aimbot while enabled. |
| Spin speed | Controls spin angular speed from 0 to 20 radians per second. |

### Automation

| Setting | Behavior |
| --- | --- |
| Auto pickup | Requests pickup for the nearest eligible item. Empty primary or secondary gun slots are filled first. Picking up a second matching dual-capable single weapon is always allowed so the server can combine the pair into its dual-wield form. A melee weapon is collected only while the melee slot still contains fists, so an owned melee is never automatically replaced. Cosmetic outfits and colored clothing are always ignored. |
| Upgrade guns | With both gun slots filled, only picks up a gun whose damage, fire rate, range, and spread score is at least 8% better than the active gun. |
| Pickup supplies | Allows Auto pickup to collect useful non-gun loot, including helmets, armor, backpacks, scopes, ammo, healing items, and throwables. Disable it for gun-only automatic pickup. Cosmetic outfits remain excluded. |
| Auto heal | Uses a healthkit when available, otherwise a bandage, when health is at or below the configured threshold and no other action is active. |
| Heal below | Sets the Auto heal health threshold from 1 to 99. |
| Auto doors | Uses a nearby unlocked, closed, interactable door on the player's current layer. |
| Mobile mode (rejoin) | Reports a mobile client on the next match join. It is available on every allowed URL, persists with the other Automation settings, and does not affect an existing connection. |

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

Trust Lab authorization is separate from ordinary client authorization. The editable policy is declared near the top of `src/urlPolicy.js` with `TRUSTED_URLS` immediately below `ALLOWED_URLS`. The generated Tampermonkey script places editable `trustedUrls` immediately below `allowedUrls` and before the embedded native payload. Version 0.3.23 trusts `localhost`, `geekbar.xyz`, and their matching subdomains. The Trust Lab page gate, target/active WebSocket gate, culling sweep, and destructive probes all derive from that single list. Mobile mode is an ordinary Automation feature and uses the allowed-URL policy instead.

| Setting | Behavior |
| --- | --- |
| Culling sweep | Alternates portrait input to test the server's portrait/landscape object-culling boundary. |
| Input diagnostics | Displays target state, eligible-target count, movement/fire flags, aim direction/range, and Trust Lab claims. |
| Selected probe | Chooses one read-only or destructive probe. Destructive probe names begin with `!`. |
| Arm destructive probes | Temporarily permits destructive probes. It automatically turns off after a destructive run. |
| Run selected probe | Runs the selected probe and appends its structured result to the report. |
| Run safe audit suite | Runs every read-only audit without mutating the connection or server state. |
| Run destructive suite | Runs every destructive probe after all authorization checks and confirmation. The local match may disconnect or restart. |
| Clear probe report | Clears the in-memory Trust Lab report and its diagnostics overlay. |

#### Read-only probes

| Probe | What it tests | Expected healthy result |
| --- | --- | --- |
| Client claims | Captures mobile identity, portrait, movement, and firing claims currently controlled by the client. | Claims are recorded without changing them. |
| Protocol round-trip | Serializes and deserializes a boundary-valued `InputMsg` entirely in the browser. | Message type, sequence, flags, and actions round-trip consistently. |
| Inventory integrity | Checks weapon definitions, ammunition, and inventory counts for unknown, negative, or non-finite values. | Every equipped item resolves and every count is finite and non-negative. |
| Action-state audit | Detects contradictory movement and firing during another active action. | No contradictory client state is active. |
| Culling exposure | Counts active players and obstacles sent to the client, including cross-layer objects and portrait state. | The report provides evidence for comparison with the server's intended visibility policy. |
| Network baseline | Records socket URL/state, average ping, update interval, and received-update count. | The game is connected and receiving updates normally. |
| Resource limits | Counts players, obstacles, loot, projectiles, bullets, and Pixi stage children. | Counts remain below the documented client audit thresholds. |
| Renderer resilience | Inspects Pixi's texture cache without mutating it. | All cached textures are valid. |
| Lifecycle consistency | Compares initialized/playing/connecting/connected flags with WebSocket state. | Game and socket lifecycle flags agree. |

#### Destructive localhost probes

These probes send bounded test traffic to the active game socket. They run only when the page hostname is in `TRUSTED_URLS`, the active WebSocket hostname is independently in `TRUSTED_URLS`, destructive probes are armed, and the confirmation dialog is accepted. A localhost page pointed at a remote WebSocket is rejected. Each sent probe receives a delayed connection-health observation, but local server logs remain authoritative when distinguishing deliberate rejection, connection termination, and match-process failure.

| Probe | Traffic sent | Expected secure behavior |
| --- | --- | --- |
| Duplicate input replay | Sends the same sequenced input twice. | Duplicate or stale state is ignored without corrupting player state. |
| Conflicting actions | Sends one input containing reload, use, interact, weapon switch, and held fire together. | The server applies a valid transition or rejects incompatible actions safely. |
| Movement during revive | While the local player is actively reviving, sends one right-movement input and measures displacement and action state 250 ms later. | Movement is rejected or constrained according to the server's revive-speed rule; the observation reports if movement and revive coexist. |
| Reload + heal collision | With a damaged player, usable healing item, and reloadable gun, sends reload and item use in one input and observes the selected action. | The server normalizes the collision to one reload or healing action and never completes both concurrently. |
| Invalid input enum | Sends one out-of-range input action value. | The value is rejected without an uncaught exception or match-wide failure. |
| Truncated input packet | Sends a one-byte Input message with no body. | The connection is rejected safely and the match process remains contained. |
| Jitter/reorder burst | Schedules eight duplicate inputs in a bounded non-monotonic delay pattern. | Sequence handling remains deterministic and responsive. |
| Bounded input-rate burst | Sends 32 duplicate inputs in one bounded burst. | Rate controls absorb or reject the burst without resource growth or process failure. |

Probe results are stored in `window.__SURVEV_RESEARCH__.status.trustReport`, printed as `[SurvevGPT Trust Lab]` console records, capped at 100 entries, and summarized in the on-screen diagnostics overlay. Outcomes are `pass`, `warning`, `sent`, `blocked`, or `error` and include timestamps and structured details for GitHub issue reports.

### Deliberately unsupported

X-ray/ceiling removal and atlas recoloring fail closed. Earlier approaches mutated shared Pixi texture state and caused red tinting, broken assets, invalid WebGL uniforms, and renderer corruption, so these unsafe texture hooks are not part of the source-native client.

GeekMenu settings are persisted through Tampermonkey storage and mirrored to page storage as a fallback. This keeps the selected aimbot profile and other controls stable across reloads and across the allowlisted project domains.

On trusted localhost pages, GeekMenu exposes Trust Lab claims, read-only audits, and explicitly armed bounded destructive probes. Movement accuracy is an ordinary feature available on all allowed URLs and remains outside the probe runner. Public allowlisted deployments cannot run Trust Lab probes unless their hostname is deliberately added to `TRUSTED_URLS` in a rebuilt userscript.

## Diagnostics

`window.__SURVEVGPT_NATIVE_STATUS__` reports loader stages such as `authorized`, `stock-client-blocked`, `waiting-for-dom`, `payload-injected`, `client-ready`, and failure details. `window.__SURVEV_RESEARCH__.status` reports aimbot state and target counts.

The client defaults API, assets, matchmaking, and ping/WebSocket discovery to the current page origin. `window.__SURVEV_NATIVE_CONFIG__` can optionally override regions, ping targets, pass type, or proxies before startup. No Geekbar server modification is required, but its server protocol must match the checked-in `survev/shared` protocol revision.

## Source revision and rollback

The native client is based on the deployed Survev client revision `f65d45b4dc9566e652b290a4cf8c6c5bc5da2216`, with the native integration recorded at `04da1abe`. To roll back, disable the native userscript and reinstall the previously committed userscript artifact. The stock page is not modified.
