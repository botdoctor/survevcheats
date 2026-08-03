// ==UserScript==
// @name         SurvevGPT Allowlisted Research Harness
// @namespace    survevgpt.local
// @version      0.1.2
// @description  Allowlisted white-box gameplay security research harness.
// @author       SurvevGPT
// @license      GPL3
// @match        *://*/*
// @run-at       document-end
// @webRequest   [{"selector":"http://localhost/*app-*.js","action":"cancel"},{"selector":"https://localhost/*app-*.js","action":"cancel"},{"selector":"http://geekbar.xyz/*app-*.js","action":"cancel"},{"selector":"https://geekbar.xyz/*app-*.js","action":"cancel"},{"selector":"http://*.geekbar.xyz/*app-*.js","action":"cancel"},{"selector":"https://*.geekbar.xyz/*app-*.js","action":"cancel"}]
// @webRequest   [{"selector":"http://localhost/*shared-*.js","action":"cancel"},{"selector":"https://localhost/*shared-*.js","action":"cancel"},{"selector":"http://geekbar.xyz/*shared-*.js","action":"cancel"},{"selector":"https://geekbar.xyz/*shared-*.js","action":"cancel"},{"selector":"http://*.geekbar.xyz/*shared-*.js","action":"cancel"},{"selector":"https://*.geekbar.xyz/*shared-*.js","action":"cancel"}]
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
  'use strict';

  const scriptRel = 'modulepreload';const assetsURL = function(dep) { return "/"+dep };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
    let promise = Promise.resolve();
    if (false && deps && deps.length > 0) {
      document.getElementsByTagName("link");
      const cspNonceMeta = document.querySelector(
        "meta[property=csp-nonce]"
      );
      const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
      promise = Promise.allSettled(
        deps.map((dep) => {
          dep = assetsURL(dep);
          if (dep in seen) return;
          seen[dep] = true;
          const isCss = dep.endsWith(".css");
          const cssSelector = isCss ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
            return;
          }
          const link = document.createElement("link");
          link.rel = isCss ? "stylesheet" : scriptRel;
          if (!isCss) {
            link.as = "script";
          }
          link.crossOrigin = "";
          link.href = dep;
          if (cspNonce) {
            link.setAttribute("nonce", cspNonce);
          }
          document.head.appendChild(link);
          if (isCss) {
            return new Promise((res, rej) => {
              link.addEventListener("load", res);
              link.addEventListener(
                "error",
                () => rej(new Error(`Unable to preload CSS for ${dep}`))
              );
            });
          }
        })
      );
    }
    function handlePreloadError(err) {
      const e = new Event("vite:preloadError", {
        cancelable: true
      });
      e.payload = err;
      window.dispatchEvent(e);
      if (!e.defaultPrevented) {
        throw err;
      }
    }
    return promise.then((res) => {
      for (const item of res || []) {
        if (item.status !== "rejected") continue;
        handlePreloadError(item.reason);
      }
      return baseModule().catch(handlePreloadError);
    });
  };

  const ALLOWED_URLS = Object.freeze(['localhost', 'geekbar.xyz']);

  function isAllowedHostname(hostname) {
      const normalized = hostname.toLowerCase().replace(/\.$/, '');
      return ALLOWED_URLS.some((allowed) =>
          normalized === allowed || normalized.endsWith(`.${allowed}`)
      );
  }

  function assertAllowedPage(location = window.location) {
      if (!isAllowedHostname(location.hostname)) {
          throw new Error(`[SurvevGPT] Refusing to load on non-allowlisted host: ${location.hostname}`);
      }
      return Object.freeze({ hostname: location.hostname, allowedUrls: ALLOWED_URLS });
  }

  function isAllowedUrl(value, base = window.location.href) {
      try {
          return isAllowedHostname(new URL(value, base).hostname);
      } catch {
          return false;
      }
  }

  function assertAllowedUrl(value, operation = 'access URL') {
      if (!isAllowedUrl(value)) {
          throw new Error(`[SurvevGPT] Refusing to ${operation}: ${String(value)}`);
      }
      return value;
  }

  function installNavigationGuard() {
      document.addEventListener('click', (event) => {
          const link = event.target.closest?.('a[href]');
          if (!link || isAllowedUrl(link.href)) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          console.error(`[SurvevGPT] Blocked non-allowlisted navigation: ${link.href}`);
      }, true);
  }

  (() => {
      const authorization = assertAllowedPage();
      console.info('[SurvevGPT 0.1.2] Authorized page', authorization);

      __vitePreload(() => Promise.resolve().then(() => init),false?__VITE_PRELOAD__:undefined).catch((error) => {
          console.error('[SurvevGPT] Local research harness failed to initialize.', error);
      });
  })();

  let state = {
      isAimBotEnabled: true,
      isAimAtKnockedOutEnabled: true,
      get aimAtKnockedOutStatus() {
          return this.isAimBotEnabled && this.isAimAtKnockedOutEnabled;
      },
      isZoomEnabled: true,
      isMeleeAttackEnabled: true,
      get meleeStatus() {
          return this.isAimBotEnabled && this.isMeleeAttackEnabled;
      },
      isSpinBotEnabled: false,
      isAutoSwitchEnabled: true,
      isUseOneGunEnabled: false,
      focusedEnemy: null,
      get focusedEnemyStatus() {
          return this.isAimBotEnabled && this.focusedEnemy;
      },
      isXrayEnabled: true,
      friends: [],
      lastFrames: {},
      enemyAimBot: null,
      isLaserDrawerEnabled: true,
      isLineDrawerEnabled: true,
      isNadeDrawerEnabled: true,
      isOverlayEnabled: true,
      isMenuOpen: true,
      isVisibleNamesEnabled: true,
      isGrenadeTimerEnabled: true,
      isAutoLootEnabled: true,
      isBumpFireEnabled: true,
      isObstacleOpacityEnabled: true,
      isSmokeOpacityEnabled: true,
      isMapColorizingEnabled: true,
      isMovementInterpolationEnabled: true,
      isMovementAccuracyEnabled: false,
      isPortraitCullingEnabled: false,
  };

  // colors
  const GREEN = 0x00ff00;
  const BLUE = 0x00f3f3;
  const RED = 0xff0000;
  const WHITE = 0xffffff;

  // tampermonkey
  const version = GM_info.script.version;

  const overlay = document.createElement('div');
  overlay.className = 'krity-overlay';

  const krityTitle = document.createElement('h3');
  krityTitle.className = 'krity-title';
  krityTitle.innerText = `KrityHack ${version}`;

  const aimbotDot = document.createElement('div');
  aimbotDot.className = 'aimbotDot';

  function updateOverlay() {
      overlay.innerHTML = ``;

      const controls = [
          [ '[B] AimBot:', state.isAimBotEnabled, state.isAimBotEnabled ? 'ON' : 'OFF' ],
          [ '[Z] Zoom:', state.isZoomEnabled, state.isZoomEnabled ? 'ON' : 'OFF' ],
          [ '[M] MeleeAtk:', state.meleeStatus, state.meleeStatus ? 'ON' : 'OFF' ],
          [ '[Y] SpinBot:', state.isSpinBotEnabled, state.isSpinBotEnabled ? 'ON' : 'OFF' ],
          [ '[T] FocusedEnemy:', state.focusedEnemyStatus, state.focusedEnemy?.nameText?._text ? state.focusedEnemy?.nameText?._text : 'OFF' ],
          [ '[V] UseOneGun:', state.isUseOneGunEnabled, state.isUseOneGunEnabled ? 'ON' : 'OFF' ],
      ];

      controls.forEach((control, index) => {
          let [name, isEnabled, optionalText] = control;
          const text = `${name} ${optionalText}`;

          const line = document.createElement('p');
          line.className = 'krity-control';
          line.style.opacity = isEnabled ? 1 : 0.5;
          line.textContent = text;
          overlay.appendChild(line);
      });
  }

  document.querySelector('#ui-game').append(overlay);
  overlay.style.display = state.isOverlayEnabled ? 'block' : 'none';
  document.querySelector('#ui-top-left').insertBefore(krityTitle, document.querySelector('#ui-top-left').firstChild);
  document.querySelector('#ui-game').append(aimbotDot);

  const MsgType = Object.freeze({ Input: 3, Spectate: 12, DropItem: 13 });

  function getGame() {
      const game = unsafeWindow.game;
      if (!game?.m_sendMessage || !game?.m_ws) {
          throw new Error('Join a local match before running this reproduction.');
      }
      return game;
  }

  function dropMessage(item, weapIdx = 0) {
      return {
          serialize(stream) {
              stream.writeGameType(item);
              stream.writeUint8(weapIdx);
          },
      };
  }

  const researchActions = {
      matchCrashDropMismatch() {
          getGame().m_sendMessage(MsgType.DropItem, dropMessage('m9', 2), 128);
      },

      downedDropCancel() {
          const game = getGame();
          if (!game.m_activePlayer?.m_netData?.m_downed) {
              throw new Error('This reproduction requires the local player to be downed.');
          }
          game.m_sendMessage(MsgType.DropItem, dropMessage('bandage', 0), 128);
      },

      invalidGameTypeLog() {
          getGame().m_sendMessage(MsgType.DropItem, {
              serialize(stream) {
                  stream.writeBits(1023, 10);
                  stream.writeUint8(0);
              },
          }, 128);
      },

      startSpectatorSweep() {
          const game = getGame();
          if (unsafeWindow.__SURVEVGPT_SPEC_SWEEP__) {
              clearInterval(unsafeWindow.__SURVEVGPT_SPEC_SWEEP__);
              unsafeWindow.__SURVEVGPT_SPEC_SWEEP__ = null;
              return 'Spectator sweep stopped.';
          }
          unsafeWindow.__SURVEVGPT_SPEC_SWEEP__ = setInterval(() => {
              game.m_sendMessage(MsgType.Spectate, {
                  serialize(stream) {
                      stream.writeUint8(2);
                  },
              }, 128);
          }, 1100);
          return 'Spectator sweep started; press again to stop.';
      },

      startInputReplay() {
          const game = getGame();
          if (unsafeWindow.__SURVEVGPT_INPUT_REPLAY__) {
              clearInterval(unsafeWindow.__SURVEVGPT_INPUT_REPLAY__);
              unsafeWindow.__SURVEVGPT_INPUT_REPLAY__ = null;
              return 'Input replay stopped.';
          }
          unsafeWindow.__SURVEVGPT_INPUT_REPLAY__ = setInterval(() => {
              if (game.m_prevInputMsg) game.m_sendMessage(MsgType.Input, game.m_prevInputMsg, 128);
          }, 17);
          return 'Input replay started at approximately 59 packets/second; press again to stop.';
      },
  };

  const featureGroups = [
      {
          title: 'Targeting',
          features: [
              ['Aim assist', 'isAimBotEnabled', 'B'],
              ['Include downed players', 'isAimAtKnockedOutEnabled'],
              ['Melee movement', 'isMeleeAttackEnabled', 'M'],
              ['Spin visualization', 'isSpinBotEnabled', 'Y'],
          ],
      },
      {
          title: 'Awareness',
          features: [
              ['Player tracers', 'isLineDrawerEnabled'],
              ['Danger zones', 'isNadeDrawerEnabled'],
              ['Weapon cones', 'isLaserDrawerEnabled'],
              ['Visible names', 'isVisibleNamesEnabled'],
              ['Building x-ray', 'isXrayEnabled'],
              ['Grenade timer', 'isGrenadeTimerEnabled'],
          ],
      },
      {
          title: 'Input experiments',
          features: [
              ['Automatic switching', 'isAutoSwitchEnabled'],
              ['Lock current gun', 'isUseOneGunEnabled', 'V'],
              ['Mobile loot mode', 'isAutoLootEnabled'],
              ['Hold-to-fire adapter', 'isBumpFireEnabled'],
              ['Movement spread repro', 'isMovementAccuracyEnabled'],
              ['Portrait culling union', 'isPortraitCullingEnabled'],
          ],
      },
      {
          title: 'Rendering',
          features: [
              ['Extended zoom', 'isZoomEnabled', 'Z'],
              ['Reduced obstacles', 'isObstacleOpacityEnabled'],
              ['Reduced smoke', 'isSmokeOpacityEnabled'],
              ['Map highlighting', 'isMapColorizingEnabled'],
              ['Movement smoothing', 'isMovementInterpolationEnabled'],
              ['Status overlay', 'isOverlayEnabled'],
          ],
      },
  ];

  const root = document.createElement('aside');
  root.id = 'survevgpt-menu';
  root.innerHTML = `
    <header>
        <div><strong>SurvevGPT</strong><span>LOCAL RESEARCH</span></div>
        <button type="button" data-close aria-label="Close menu">×</button>
    </header>
    <div class="survevgpt-menu-body"></div>
    <footer>Localhost enforced · F8 toggles this panel</footer>
`;

  const body = root.querySelector('.survevgpt-menu-body');

  for (const group of featureGroups) {
      const section = document.createElement('section');
      section.innerHTML = `<h3>${group.title}</h3>`;

      for (const [label, key, hotkey] of group.features) {
          const row = document.createElement('label');
          row.className = 'survevgpt-toggle';
          row.innerHTML = `
            <span>${label}${hotkey ? `<kbd>${hotkey}</kbd>` : ''}</span>
            <input type="checkbox" data-state="${key}">
            <i aria-hidden="true"></i>
        `;
          section.appendChild(row);
      }
      body.appendChild(section);
  }

  const reproductions = document.createElement('section');
  reproductions.className = 'survevgpt-reproductions';
  reproductions.innerHTML = `
    <h3>Controlled reproductions</h3>
    <p>These affect the current localhost match. Destructive actions require confirmation.</p>
`;

  const actionDefinitions = [
      ['Input replay (~59/s)', 'startInputReplay', false],
      ['Spectator enumeration', 'startSpectatorSweep', false],
      ['Invalid game-type logging', 'invalidGameTypeLog', false],
      ['Downed drop / revive cancel', 'downedDropCancel', false],
      ['Drop mismatch match crash', 'matchCrashDropMismatch', true],
  ];

  for (const [label, action, destructive] of actionDefinitions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = destructive ? 'is-destructive' : '';
      button.textContent = label;
      button.addEventListener('click', () => {
          if (destructive && !confirm(`${label} may terminate the current localhost match. Continue?`)) return;
          try {
              const result = researchActions[action]();
              root.querySelector('footer').textContent = result || `${label} sent to localhost.`;
          } catch (error) {
              root.querySelector('footer').textContent = error.message;
          }
      });
      reproductions.appendChild(button);
  }
  body.appendChild(reproductions);

  document.body.appendChild(root);

  function applyDependentGlobals() {
      unsafeWindow.movementInterpolation = state.isMovementInterpolationEnabled;
  }

  function updateButtonColors() {
      root.querySelectorAll('[data-state]').forEach((input) => {
          input.checked = Boolean(state[input.dataset.state]);
      });
      root.classList.toggle('is-open', state.isMenuOpen);
  }

  function toggleMenu(force) {
      state.isMenuOpen = force ?? !state.isMenuOpen;
      updateButtonColors();
  }

  root.addEventListener('change', (event) => {
      const input = event.target.closest('[data-state]');
      if (!input) return;
      state[input.dataset.state] = input.checked;
      applyDependentGlobals();
      updateOverlay();
      updateButtonColors();
  });

  root.querySelector('[data-close]').addEventListener('click', () => toggleMenu(false));
  root.addEventListener('mouseenter', () => {
      if (unsafeWindow.game?.inputBinds) unsafeWindow.game.inputBinds.menuHovered = true;
  });
  root.addEventListener('mouseleave', () => {
      if (unsafeWindow.game?.inputBinds) unsafeWindow.game.inputBinds.menuHovered = false;
  });

  document.addEventListener('keydown', (event) => {
      if (event.code !== 'F8') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleMenu();
  }, true);

  updateButtonColors();

  setInterval(() => {
      const status = unsafeWindow.__SURVEVGPT_PATCH_STATUS__;
      if (!Array.isArray(status) || status.length === 0) return;
      const missing = status.filter((patch) => !patch.matched);
      root.querySelector('footer').textContent = missing.length
          ? `${missing.length}/${status.length} client patches missing — check the console.`
          : `${status.length}/${status.length} client patches applied · localhost enforced`;
  }, 1000);

  const adapted = new WeakSet();

  function alias(target, publicName, internalName) {
      if (!target || publicName in target || !(internalName in target)) return;
      Object.defineProperty(target, publicName, {
          configurable: true,
          get() {
              return this[internalName];
          },
          set(value) {
              this[internalName] = value;
          },
      });
  }

  function exposeMPrefix(target) {
      if (!target || (typeof target !== 'object' && typeof target !== 'function')) return target;
      if (adapted.has(target)) return target;
      adapted.add(target);

      let cursor = target;
      while (cursor && cursor !== Object.prototype) {
          for (const name of Object.getOwnPropertyNames(cursor)) {
              if (!name.startsWith('m_') || name.length <= 2) continue;
              alias(target, name.slice(2), name);
          }
          cursor = Object.getPrototypeOf(cursor);
      }
      return target;
  }

  function adaptPlayer(player) {
      exposeMPrefix(player);
      exposeMPrefix(player?.m_netData);
      exposeMPrefix(player?.m_localData);
  }

  function adaptGameRuntime(game) {
      exposeMPrefix(game);
      [
          game.m_camera,
          game.m_input,
          game.m_inputBinds,
          game.m_touch,
          game.m_map,
          game.m_playerBarn,
          game.m_smokeBarn,
          game.m_objectCreator,
      ].forEach(exposeMPrefix);

      exposeMPrefix(game.m_map?.m_obstaclePool);
      exposeMPrefix(game.m_playerBarn?.playerPool);

      if (game.m_pixi && !('_ticker' in game.m_pixi)) {
          Object.defineProperty(game.m_pixi, '_ticker', {
              configurable: true,
              get: () => game.m_pixi.ticker,
          });
      }

      for (const player of game.m_playerBarn?.playerPool?.m_pool ?? []) adaptPlayer(player);
      for (const obstacle of game.m_map?.m_obstaclePool?.m_pool ?? []) exposeMPrefix(obstacle);
      for (const smoke of game.m_smokeBarn?.m_particles ?? []) exposeMPrefix(smoke);
  }

  unsafeWindow.installSurvevGptCompat = (game) => {
      adaptGameRuntime(game);
      const timer = setInterval(() => {
          if (!game.m_ws && !game.m_playerBarn) return;
          adaptGameRuntime(game);
      }, 250);
      unsafeWindow.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
      return game;
  };

  class GameMod {
      constructor() {
          this.lastFrameTime = performance.now();
          this.frameCount = 0;
          this.fps = 0;
          this.kills = 0;
          this.setAnimationFrameCallback();

          if (unsafeWindow.__SURVEVGPT_LOCAL_DEV__){
              // cause they have fps counter, etc...
              this.initCounter("fpsCounter");
              this.initCounter("pingCounter");
              this.initCounter("killsCounter");
          }

          this.initMenu(); // left menu in lobby page
          this.initRules(); // right menu in lobby page

          this.setupWeaponBorderHandler();
      }

      initCounter(id) {
          this[id] = document.createElement("div");
          this[id].id = id;
          Object.assign(this[id].style, {
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              padding: "5px 10px",
              marginTop: "10px",
              borderRadius: "5px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              zIndex: "10000",
              pointerEvents: "none",
          });

          const uiTopLeft = document.getElementById("ui-top-left");
          // const uiTeam = document.getElementById("ui-team");
          if (uiTopLeft) {
              // if (uiTeam) {
              // uiTopLeft.insertBefore(this[id], uiTeam);
              // uiTeam.style.marginTop = '20px';
              // } else {
              uiTopLeft.appendChild(this[id]);
              // }
          }
      }
      
      setAnimationFrameCallback() {
          this.animationFrameCallback = (callback) => setTimeout(callback, 1);
      }

      getKills() {
        const killElement = document.querySelector(
          ".ui-player-kills.js-ui-player-kills",
        );
        if (killElement) {
          const kills = parseInt(killElement.textContent, 10);
          return isNaN(kills) ? 0 : kills;
        }
        return 0;
      }

      startPingTest() {
        const currentUrl = unsafeWindow.location.href;
        const isSpecialUrl = /\/#\w+/.test(currentUrl);

        const teamSelectElement = document.getElementById("team-server-select");
        const mainSelectElement = document.getElementById("server-select-main");

        const region =
          isSpecialUrl && teamSelectElement
            ? teamSelectElement.value
            : mainSelectElement
              ? mainSelectElement.value
              : null;

        if (region && region !== this.currentServer) {
          this.currentServer = region;
          this.resetPing();

          let servers = unsafeWindow.servers;

          if (!servers) return;

          const selectedServer = servers.find(
            (server) => region.toUpperCase() === server.region.toUpperCase(),
          );

          if (selectedServer) {
            this.pingTest = new PingTest(selectedServer);
            this.pingTest.startPingTest();
          } else {
            this.resetPing();
          }
        }
      }

      resetPing() {
        if (this.pingTest && this.pingTest.test.ws) {
          this.pingTest.test.ws.close();
          this.pingTest.test.ws = null;
        }
        this.pingTest = null;
      }

      updateHealthBars() {
        const healthBars = document.querySelectorAll("#ui-health-container");
        healthBars.forEach((container) => {
          const bar = container.querySelector("#ui-health-actual");
          if (bar) {
            const width = Math.round(parseFloat(bar.style.width));
            let percentageText = container.querySelector(".health-text");

            if (!percentageText) {
              percentageText = document.createElement("span");
              percentageText.classList.add("health-text");
              Object.assign(percentageText.style, {
                width: "100%",
                textAlign: "center",
                marginTop: "5px",
                color: "#333",
                fontSize: "20px",
                fontWeight: "bold",
                position: "absolute",
                zIndex: "10",
              });
              container.appendChild(percentageText);
            }

            percentageText.textContent = `${width}%`;
          }
        });
      }

      updateBoostBars() {
        const boostCounter = document.querySelector("#ui-boost-counter");
        if (boostCounter) {
          const boostBars = boostCounter.querySelectorAll(
            ".ui-boost-base .ui-bar-inner",
          );

          let totalBoost = 0;
          const weights = [25, 25, 40, 10];

          boostBars.forEach((bar, index) => {
            const width = parseFloat(bar.style.width);
            if (!isNaN(width)) {
              totalBoost += width * (weights[index] / 100);
            }
          });

          const averageBoost = Math.round(totalBoost);
          let boostDisplay = boostCounter.querySelector(".boost-display");

          if (!boostDisplay) {
            boostDisplay = document.createElement("div");
            boostDisplay.classList.add("boost-display");
            Object.assign(boostDisplay.style, {
              position: "absolute",
              bottom: "75px",
              right: "335px",
              color: "#FF901A",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              padding: "5px 10px",
              borderRadius: "5px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              zIndex: "10",
              textAlign: "center",
            });

            boostCounter.appendChild(boostDisplay);
          }

          boostDisplay.textContent = `AD: ${averageBoost}%`;
        }
      }

      setupWeaponBorderHandler() {
          const weaponContainers = Array.from(
            document.getElementsByClassName("ui-weapon-switch"),
          );
          weaponContainers.forEach((container) => {
            if (container.id === "ui-weapon-id-4") {
              container.style.border = "3px solid #2f4032";
            } else {
              container.style.border = "3px solid #FFFFFF";
            }
          });
    
          const weaponNames = Array.from(
            document.getElementsByClassName("ui-weapon-name"),
          );
          weaponNames.forEach((weaponNameElement) => {
            const weaponContainer = weaponNameElement.closest(".ui-weapon-switch");
            const observer = new MutationObserver(() => {
              const weaponName = weaponNameElement.textContent.trim();
              let border = "#FFFFFF";
    
              switch (weaponName.toUpperCase()) { 
                //yellow
                case "CZ-3A1": case "G18C": case "M9": case "M93R": case "MAC-10": case "MP5": case "P30L": case "DUAL P30L": case "UMP9": case "VECTOR": case "VSS": case "FLAMETHROWER": border = "#FFAE00"; break;
                //blue 
                case "AK-47": case "OT-38": case "OTS-38": case "M39 EMR": case "DP-28": case "MOSIN-NAGANT": case "SCAR-H": case "SV-98": case "M1 GARAND": case "PKP PECHENEG": case "AN-94": case "BAR M1918": case "BLR 81": case "SVD-63": case "M134": case "GROZA": case "GROZA-S": border = "#007FFF"; break;
                //green
                case "FAMAS": case "M416": case "M249": case "QBB-97": case "MK 12 SPR": case "M4A1-S": case "SCOUT ELITE": case "L86A2": border = "#0f690d"; break;
                //red 
                case "M870": case "MP220": case "SAIGA-12": case "SPAS-12": case "USAS-12": case "SUPER 90": case "LASR GUN": case "M1100": border = "#FF0000"; break;
                //purple
                case "MODEL 94": case "PEACEMAKER": case "VECTOR (.45 ACP)": case "M1911": case "M1A1": border = "#800080"; break;
                //black
                case "DEAGLE 50": case "RAINBOW BLASTER": border = "#000000"; break;
                //olive
                case "AWM-S": case "MK 20 SSR": border = "#808000"; break; 
                //brown
                case "POTATO CANNON": case "SPUD GUN": border = "#A52A2A"; break;
                //other Guns
                case "FLARE GUN": border = "#FF4500"; break; case "M79": border = "#008080"; break; case "HEART CANNON": border = "#FFC0CB"; break; 
                default: border = "#FFFFFF"; break; }
    
              if (weaponContainer.id !== "ui-weapon-id-4") {
                weaponContainer.style.border = `3px solid ${border}`;
              }
            });
    
            observer.observe(weaponNameElement, {
              childList: true,
              characterData: true,
              subtree: true,
            });
          });
        }

      //menu
      initMenu() {
          const middleRow = document.querySelector("#start-row-top");
          Object.assign(middleRow.style, {
              display: "flex",
              flexDirection: "row",
          });


          const menu = document.createElement("div");
          menu.id = "KrityHack";
          Object.assign(menu.style, {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            color: "#fff",
            maxWidth: "300px",
            height: "100%",
          //   maxHeight: "320px",
            overflowY: "auto",
          //   marginTop: "20px",
            marginRight: "30px",
            boxSizing: "border-box",
          });

        
          const title = document.createElement("h2");
          title.textContent = "Social networks";
          title.className = 'news-header';
          Object.assign(title.style, {
            margin: "0 0 10px",
            fontSize: "20px",
          });
          menu.append(title);

          const description = document.createElement("p");
          description.className = "news-paragraph";
          description.style.fontSize = "14px";
          description.innerHTML = `⭐ Star us on GitHub<br>📢 Join our Telegram group<br>🎮 Join our Discord server`;
          menu.append(description);
        
          const createSocialLink = (text) => {
            const a = document.createElement("a");
            a.textContent = `${text}`;
            a.target = "_blank";
            Object.assign(a.style, {
              display: "block",
              border: "none",
              color: "#fff",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "10px",
              fontSize: "15px",
              lineHeight: "14px",
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
            });
            return a;
          };
        
          const githubLink = createSocialLink("");
          githubLink.style.backgroundColor = "#0c1117";
          githubLink.href = "https://github.com/Drino955/survev-krityhack";
          githubLink.innerHTML = `<i class="fa-brands fa-github"></i> KrityHack`;
          menu.append(githubLink);
          
          const telegramLink = createSocialLink("");
          telegramLink.style.backgroundColor = "#00a8e6";
          telegramLink.href = "https://t.me/krityteam";
          telegramLink.innerHTML = `<i class="fa-brands fa-telegram-plane"></i> KrityTeam`;
          menu.append(telegramLink);

          const discordLink = createSocialLink("");
          discordLink.style.backgroundColor = "#5865F2";
          discordLink.href = "https://discord.gg/FUkaMnbgjK";
          discordLink.innerHTML = `<i class="fa-brands fa-discord"></i> Krity Community`;
          menu.append(discordLink);

          const additionalDescription = document.createElement("p");
          additionalDescription.className = "news-paragraph";
          additionalDescription.style.fontSize = "14px";
          additionalDescription.innerHTML = `Your support helps us develop the project and provide better updates!`;
          menu.append(additionalDescription);

          const leftColumn = document.querySelector('#left-column');
          leftColumn.innerHTML = ``;
          leftColumn.style.marginTop = "10px";
          leftColumn.style.marginBottom = "27px";
          leftColumn.append(menu);
        
          this.menu = menu;
      }

      initRules() {
          const newsBlock = document.querySelector("#news-block");
          newsBlock.innerHTML = `
<h3 class="news-header">KrityHack v${version}</h3>
<div id="news-current">
<small class="news-date">January 13, 2025</small>
                      
<h2>How to use the cheat in the game 🚀</h2>
<p class="news-paragraph">After installing the cheat, you can use the following features and hotkeys:</p>

<h3>Hotkeys:</h3>
<ul>
    <li><strong>[B]</strong> - Toggle AimBot</li>
    <li><strong>[Z]</strong> - Toggle Zoom</li>
    <li><strong>[M]</strong> - Toggle Melee Attack</li>
    <li><strong>[Y]</strong> - Toggle SpinBot</li>
    <li><strong>[T]</strong> - Focus on enemy</li>
    <li><strong>[V]</strong> - Lock weapon</li>
</ul>

<h3>Features:</h3>
<ul>
    <li><strong>[ESC]</strong> - Open Cheats Menu</li>
    <li>By clicking the middle mouse button, you can add a player to friends. AimBot will not target them, green lines will go to them, and their name will turn green.</li>
    <li>AimBot activates when you shoot.</li>
    <li><strong>AutoMelee:</strong> If the enemy is close enough (4 game coordinates), AutoMelee will automatically move towards and attack them when holding down the left mouse button. If you equip a melee weapon, AutoMelee will work at a distance of 8 game coordinates.</li>
    <li><strong>AutoSwitch:</strong> By default, quickly switch weapons to avoid cooldown after shooting.</li>
    <li><strong>BumpFire:</strong> Shoot without constant clicking.</li>
    <li><strong>FocusedEnemy:</strong> Press <strong>[T]</strong> to focus on an enemy. AimBot will continuously target the focused enemy. Press <strong>[T]</strong> again to reset.</li>
    <li><strong>UseOneGun:</strong> Press <strong>[V]</strong> to lock a weapon and shoot only from it using autoswitch. Useful when you have a shotgun and a rifle, and the enemy is far away.
</ul>

<h3>Recommendations:</h3>
<ul>
    <li>Play smart and don't rush headlong, as the cheat does not provide immortality.</li>
    <li>Use adrenaline to the max to heal and run fast.</li>
    <li>The map is color-coded: white circle - Mosin, gold container - SV98, etc.</li>
</ul>

<p class="news-paragraph">For more details, visit the <a href="https://github.com/Drino955/survev-krityhack">GitHub page</a> and join our <a href="https://t.me/krityteam">Telegram group</a> or <a href="https://discord.gg/FUkaMnbgjK">Discord</a>.</p></div>`;
      
      
      }

      startUpdateLoop() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;

        this.frameCount++;

        if (delta >= 1000) {
          this.fps = Math.round((this.frameCount * 1000) / delta);
          this.frameCount = 0;
          this.lastFrameTime = now;

          this.kills = this.getKills();

          if (this.fpsCounter) {
            this.fpsCounter.textContent = `FPS: ${this.fps}`;
          }

          if (this.killsCounter) {
            this.killsCounter.textContent = `Kills: ${this.kills}`;
          }

          if (this.pingCounter && this.pingTest) {
            const result = this.pingTest.getPingResult();
            this.pingCounter.textContent = `PING: ${result.ping} ms`;
          }
        }

        this.startPingTest();
        this.updateBoostBars();
        this.updateHealthBars();
      }
      
    }

  class PingTest {
      constructor(selectedServer) {
        this.ptcDataBuf = new ArrayBuffer(1);
        this.test = {
          region: selectedServer.region,
          url: `wss://${selectedServer.url}/ptc`,
          ping: 9999,
          ws: null,
          sendTime: 0,
          retryCount: 0,
        };
      }

      startPingTest() {
        if (!this.test.ws) {
            assertAllowedUrl(this.test.url, 'open game ping WebSocket');
            const ws = new WebSocket(this.test.url);
          ws.binaryType = "arraybuffer";

          ws.onopen = () => {
            this.sendPing();
            this.test.retryCount = 0;
          };

          ws.onmessage = () => {
            const elapsed = (Date.now() - this.test.sendTime) / 1e3;
            this.test.ping = Math.round(elapsed * 1000);
            this.test.retryCount = 0;
            setTimeout(() => this.sendPing(), 200);
          };

          ws.onerror = () => {
            this.test.ping = "Error";
            this.test.retryCount++;
            if (this.test.retryCount < 5) {
              setTimeout(() => this.startPingTest(), 2000);
            } else {
              this.test.ws.close();
              this.test.ws = null;
            }
          };

          ws.onclose = () => {
            this.test.ws = null;
          };

          this.test.ws = ws;
        }
      }

      sendPing() {
        if (this.test.ws.readyState === WebSocket.OPEN) {
          this.test.sendTime = Date.now();
          this.test.ws.send(this.ptcDataBuf);
        }
      }

      getPingResult() {
        return {
          region: this.test.region,
          ping: this.test.ping,
        };
      }
  }

  unsafeWindow.GameMod = new GameMod(); // AlguienClient

  console.log('Script injecting...');

  unsafeWindow.__SURVEVGPT_PATCH_STATUS__ = [];

  function applyPatches(source, patches, group) {
      for (const patch of patches) {
          const matched = typeof patch.from === 'string'
              ? source.includes(patch.from)
              : patch.from.test(source);
          unsafeWindow.__SURVEVGPT_PATCH_STATUS__.push({ group, name: patch.name, matched });
          if (!matched) {
              console.error(`[SurvevGPT] Missing ${group} patch: ${patch.name}`);
              continue;
          }
          source = source.replace(patch.from, patch.to);
      }
      return source;
  }


  (async () => {
      const links = [
          ...Array.from(document.querySelectorAll('link[rel="modulepreload"][href]')),
          ...Array.from(document.querySelectorAll('script[type="module"][src]'))
      ];

      const appLink = links.find(link => link.src?.includes('app-'));
      const sharedLink = links.find(link => link.href?.includes('shared-'));
      const vendorLink = links.find(link => link.href?.includes('vendor-'));


      const originalAppURL = appLink.src;
      const originalSharedURL = sharedLink.href;
      const originalVendorURL = vendorLink.href;

      let modifiedSharedURL = null;
      let modifiedAppURL = null;
      if (originalSharedURL) {
          assertAllowedUrl(originalSharedURL, 'request shared game bundle');
          const response = await GM.xmlHttpRequest({ url: originalSharedURL }).catch(e => console.error(e));
          let scriptContent = await response.responseText;
          // console.log(scriptContent);

          const sharedScriptPatches = [
              {
                  name: 'bullets',
                  from: /function\s+(\w+)\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*\{\s*return\s+(\w+)\((\w+),\s*(\w+),\s*(\w+)\)\s*\}\s*const\s+(\w+)\s*=\s*\{\s*(\w+)\s*:\s*\{\s*type\s*:\s*"(.*?)"\s*,\s*damage\s*:\s*(\d+)\s*,/,
                  to: `function $1($2, $3) {\n    return $4($5, $6, $7)\n}\nconst $8 = window.bullets = {\n    $9: {\n        type: "$10",\n        damage: $11,`
              },
              {
                  name: 'explosions',
                  from: /(\w+)=\{explosion_frag:\{type:"explosion",damage:(\d+),obstacleDamage/,
                  to: `$1 = window.explosions = {explosion_frag:{type:"explosion",damage:$2,obstacleDamage`
              },
              {
                  name: 'guns',
                  from: /(\w+)=\{(\w+):\{name:"([^"]+)",type:"gun",quality:(\d+),fireMode:"([^"]+)",caseTiming:"([^"]+)",ammo:"([^"]+)",/,
                  to: `$1 = window.guns = {$2:{name:"$3",type:"gun",quality:$4,fireMode:"$5",caseTiming:"$6",ammo:"$7",`
              },
              {
                  name: 'throwable',
                  from: /(\w+)=\{(\w+):\{name:"([^"]+)",type:"throwable",quality:(\d+),explosionType:"([^"]+)",/,
                  to: `$1 = window.throwable = {$2:{name:"$3",type:"throwable",quality:$4,explosionType:"$5",`
              },
              {
                  name: 'objects',
                  from: /\s*(\w+)\s*=\s*\{\s*(\w+)\s*:\s*Ve\(\{\}\)\s*,\s*(\w+)\s*:\s*Ve\(\{\s*img\s*:\s*\{\s*tint\s*:\s*(\d+)\s*\}\s*,\s*loot\s*:\s*\[\s*n\("(\w+)",\s*(\d+),\s*(\d+)\)\s*,\s*d\("(\w+)",\s*(\d+)\)\s*,\s*d\("(\w+)",\s*(\d+)\)\s*,\s*d\("(\w+)",\s*(\d+)\)\s*\]\s*\}\)\s*,/,
                  to: ` $1 = window.objects = {\n    $2: Ve({}),\n    $3: Ve({\n        img: {\n            tint: $4\n        },\n        loot: [\n            n("$5", $6, $7),\n            d("$8", $9),\n            d("$10", $11),\n            d("$12", $13)\n        ]\n    }),`
              }
          ];

          scriptContent = applyPatches(scriptContent, sharedScriptPatches, 'shared');

          const blob = new Blob([scriptContent], { type: 'application/javascript' });
          modifiedSharedURL = URL.createObjectURL(blob);
          console.log(modifiedSharedURL);
      }

      if (originalAppURL) {
          assertAllowedUrl(originalAppURL, 'request application game bundle');
          const response = await GM.xmlHttpRequest({ url: originalAppURL }).catch(e => console.error(e));
          let scriptContent = await response.responseText;
          // console.log(scriptContent);

          const appScriptPatches = [
              {
                  name: 'Import shared.js',
                  from: /"\.\/shared-[^"]+\.js";/,
                  to: `"${modifiedSharedURL}";`
              },
              {
                  name: 'Import vendor.js',
                  from: /\.\/vendor-[a-zA-Z0-9]+\.js/,
                  to: `${originalVendorURL}`
              },
              {
                  name: 'servers',
                  from: /var\s+(\w+)\s*=\s*\[\s*({\s*region:\s*"([^"]+)",\s*zone:\s*"([^"]+)",\s*url:\s*"([^"]+)",\s*https:\s*(!0|!1)\s*}\s*(,\s*{\s*region:\s*"([^"]+)",\s*zone:\s*"([^"]+)",\s*url:\s*"([^"]+)",\s*https:\s*(!0|!1)\s*})*)\s*\];/,
                  to: `var $1 = window.servers = [$2];`
              },
              {
                  name: 'Map colorizing',
                  from: /(\w+)\.sort\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*\2\.zIdx\s*-\s*\3\.zIdx\s*\);/,
                  to: `$1.sort(($2, $3) => $2.zIdx - $3.zIdx);\nwindow.mapColorizing($1);`
              },
              {
                  name: 'Position without interpolation (pos._x, pos._y)',
                  from: /this\.pos\s*=\s*(\w+)\.copy\((\w+)\.netData\.pos\)/,
                  to: `this.pos = $1.copy($2.netData.pos),this.pos._x = this.netData.pos.x, this.pos._y = this.netData.pos.y`
              },
              {
                  name: 'Movement interpolation (Game optimization)',
                  from: 'this.pos._y = this.netData.pos.y',
                  to: `this.pos._y = this.netData.pos.y,(window.movementInterpolation) &&
                                                        !(
                                                            Math.abs(this.pos.x - this.posOld.x) > 18 ||
                                                            Math.abs(this.pos.y - this.posOld.y) > 18
                                                        ) &&
                                                            //movement interpolation
                                                            ((this.pos.x += (this.posOld.x - this.pos.x) * 0.5),
                                                            (this.pos.y += (this.posOld.y - this.pos.y) * 0.5))`
              },
              {
                  name: 'Mouse position without server delay (Game optimization)',
                  from: '-Math.atan2(this.dir.y,this.dir.x)}',
                  to: `-Math.atan2(this.dir.y, this.dir.x),
                (window.localRotation) &&
    ((window.game.activeId == this.__id && !window.game.spectating) &&
        (this.bodyContainer.rotation = Math.atan2(
            window.game.input.mousePos.y - window.innerHeight / 2,
            window.game.input.mousePos.x - window.innerWidth / 2
        )),
    (window.game.activeId != this.__id) &&
        (this.bodyContainer.rotation = -Math.atan2(this.dir.y, this.dir.x)));
                }`
              },
              // {
              //     name: 'pieTimerClass',
              //     from: '=24;',
              //     to: `=24;window.pieTimerClass = `
              // },
              {
                  name: 'Class definition with methods',
                  from: /(\w+)\s*=\s*24;\s*class\s+(\w+)\s*\{([\s\S]*?)\}\s*function/,
                  to: `$1 = 24;\nclass $2 {\n$3\n}window.pieTimerClass = $2;\nfunction`
              },
              {
                  name: 'isMobile (basicDataInfo)',
                  from: /(\w+)\.isMobile\s*=\s*(\w+)\.mobile\s*\|\|\s*window\.mobile\s*,/,
                  to: `$1.isMobile = $2.mobile || window.mobile,window.basicDataInfo = $1,`
              },
              {
                  name: 'Game',
                  from: /this\.(m_)?shotBarn\s*=\s*new\s*(\w+)\s*;/,
                  to: `window.game = window.installSurvevGptCompat(this),this.$1shotBarn = new $2;`
              },
              {
                  name: 'Override gameControls',
                  from: /this\.(m_)?sendMessage\s*\(\s*(\w+)\.(\w+)\s*,\s*(\w+)\s*,\s*(\d+)\s*\)\s*,\s*this\.(m_)?inputMsgTimeout\s*=\s*(\d+)\s*,\s*this\.(m_)?prevInputMsg\s*=\s*(\w+)\s*\)/,
                  to: `this._newGameControls = window.initGameControls($4), this.$1sendMessage($2.$3, this._newGameControls, $5),\nthis.$6inputMsgTimeout = $7,\nthis.$8prevInputMsg = this._newGameControls)`
              },
          ];

          scriptContent = applyPatches(scriptContent, appScriptPatches, 'app');

          // scriptContent += `alert('ja appjs');`;

          const blob = new Blob([scriptContent], { type: 'application/javascript' });
          modifiedAppURL = URL.createObjectURL(blob);
          console.log(modifiedAppURL);

          
      // }
      }

      if (!originalAppURL || !originalSharedURL || !originalVendorURL){
          console.error('originalAppURL or originalSharedURL or originalVendorURL is not found', originalAppURL, originalSharedURL, originalVendorURL);
          return;
      }

      // Создаем временный список для хранения обработчиков
      const isolatedHandlers = [];

      // Переопределяем document.addEventListener
      const originalAddEventListener = document.addEventListener;
      document.addEventListener = function (type, listener, options) {
          if (type === 'DOMContentLoaded') {
              isolatedHandlers.push(listener); // Сохраняем обработчики отдельно
          } else {
              originalAddEventListener.call(document, type, listener, options);
          }
      };

      const appScript = document.createElement('script');
      appScript.type = 'module';
      appScript.src = modifiedAppURL;
      appScript.onload = () => {
          console.log('Im injected appjs', appScript);

          // Восстанавливаем оригинальный addEventListener
          document.addEventListener = originalAddEventListener;

          // Искусственно вызываем все сохраненные обработчики
          isolatedHandlers.forEach((handler) => handler.call(document));
      };
      document.head.append(appScript);
  })();



  console.log('Script injected');

  unsafeWindow.localRotation = true;
  unsafeWindow.movementInterpolation = state.isMovementInterpolationEnabled;

  const styles = document.createElement('style');
  styles.innerHTML = `
#survevgpt-menu {
    --sg-accent: #4ee7a8;
    position: fixed;
    top: 50%;
    left: 18px;
    width: min(390px, calc(100vw - 36px));
    max-height: min(760px, calc(100vh - 36px));
    display: none;
    flex-direction: column;
    overflow: hidden;
    color: #eef7f3;
    background: rgba(10, 16, 19, .97);
    border: 1px solid rgba(78, 231, 168, .32);
    border-radius: 14px;
    box-shadow: 0 18px 65px rgba(0, 0, 0, .5);
    transform: translateY(-50%);
    z-index: 2147483647;
    font: 14px/1.35 system-ui, sans-serif;
    user-select: none;
}
#survevgpt-menu.is-open { display: flex; }
#survevgpt-menu header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 16px;
    border-bottom: 1px solid rgba(255,255,255,.08);
}
#survevgpt-menu header strong { display: block; font-size: 18px; letter-spacing: .02em; }
#survevgpt-menu header span { color: var(--sg-accent); font-size: 10px; letter-spacing: .14em; }
#survevgpt-menu header button { color: #9eaaa5; background: transparent; border: 0; font-size: 26px; cursor: pointer; }
.survevgpt-menu-body { overflow: auto; padding: 8px 16px 14px; }
#survevgpt-menu section { padding: 8px 0 5px; }
#survevgpt-menu h3 { margin: 5px 0 7px; color: #8d9b96; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
.survevgpt-toggle { min-height: 34px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
.survevgpt-toggle > span { display: flex; align-items: center; gap: 7px; }
.survevgpt-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.survevgpt-toggle i { width: 34px; height: 18px; position: relative; flex: 0 0 auto; border-radius: 99px; background: #344039; transition: .15s; }
.survevgpt-toggle i::after { content: ''; position: absolute; width: 14px; height: 14px; top: 2px; left: 2px; border-radius: 50%; background: #9ca7a2; transition: .15s; }
.survevgpt-toggle input:checked + i { background: rgba(78,231,168,.28); }
.survevgpt-toggle input:checked + i::after { left: 18px; background: var(--sg-accent); }
#survevgpt-menu kbd { padding: 1px 5px; color: #9eaaa5; background: #202a26; border: 1px solid #35413c; border-radius: 4px; font: 10px monospace; }
#survevgpt-menu footer { padding: 11px 16px; color: #7f8c87; border-top: 1px solid rgba(255,255,255,.08); font-size: 11px; }
.survevgpt-reproductions p { margin: 0 0 8px; color: #85938d; font-size: 11px; }
.survevgpt-reproductions button { width: 100%; margin: 3px 0; padding: 8px 10px; color: #dce9e4; background: #202b27; border: 1px solid #36443e; border-radius: 6px; cursor: pointer; text-align: left; }
.survevgpt-reproductions button:hover { border-color: var(--sg-accent); }
.survevgpt-reproductions button.is-destructive { color: #ffb5b5; border-color: rgba(255,90,90,.45); }
.krity-overlay{
    position: absolute;
    top: 128px;
    left: 0px;
    width: 100%;
    pointer-events: None;
    color: #fff;
    font-family: monospace;
    text-shadow: 0 0 5px rgba(0, 0, 0, .5);
    z-index: 1;
}

.krity-title{
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 25px;
    text-shadow: 0 0 10px rgba(0, 0, 0, .9);
    color: #fff;
    font-family: monospace;
    pointer-events: None;
}

.krity-control{
    text-align: center;
    margin-top: 3px;
    margin-bottom: 3px;
    font-size: 18px;
}

.aimbotDot{
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 10px;
    background-color: red;
    transform: translateX(-50%) translateY(-50%);
    display: none;
}

#news-current ul{
    margin-left: 20px;
    padding-left: 6px;
}
`;

  document.head.append(styles);

  let colors = {
      container_06: 14934793,
      barn_02: 14934793,
      stone_02: 1654658,
      tree_03: 16777215,
      stone_04: 0xeb175a,
      stone_05: 0xeb175a,
      bunker_storm_01: 14934793,
  },
  sizes = {
      stone_02: 6,
      tree_03: 8,
      stone_04: 6,
      stone_05: 6,
      bunker_storm_01: 1.75,
  };

  unsafeWindow.mapColorizing = map => {
      if (!state.isMapColorizingEnabled) return;
      map.forEach(object => {
          if ( !colors[object.obj.type] ) return;
          object.shapes.forEach(shape => {
              shape.color = colors[object.obj.type];
              console.log(object);
              if ( !sizes[object.obj.type] ) return;
              shape.scale = sizes[object.obj.type];
              console.log(object);
          });
      });
  };

  function getTeam(player) {
      return Object.keys(game.playerBarn.teamInfo).find(team => game.playerBarn.teamInfo[team].playerIds.includes(player.__id));
  }

  function findWeap(player) {
      const weapType = player.netData.activeWeapon;
      return weapType && unsafeWindow.guns[weapType] ? unsafeWindow.guns[weapType] : null;
  }

  function findBullet(weapon) {
      return weapon ? unsafeWindow.bullets[weapon.bulletType] : null;
  }

  function aimBot() {

      if (!state.isAimBotEnabled) return;

      const players = unsafeWindow.game.playerBarn.playerPool.pool;
      const me = unsafeWindow.game.activePlayer;

      try {
          const meTeam = getTeam(me);

          let enemy = null;
          let minDistanceToEnemyFromMouse = Infinity;
          
          if (state.focusedEnemy && state.focusedEnemy.active && !state.focusedEnemy.netData.dead) {
              enemy = state.focusedEnemy;
          }else {
              if (state.focusedEnemy){
                  state.focusedEnemy = null;
                  updateOverlay();
              }

              players.forEach((player) => {
                  // We miss inactive or dead players
                  if (!player.active || player.netData.dead || (!state.isAimAtKnockedOutEnabled && player.downed) || me.__id === player.__id || me.layer !== player.layer || getTeam(player) == meTeam || state.friends.includes(player.nameText._text)) return;
      
                  const screenPlayerPos = unsafeWindow.game.camera.pointToScreen({x: player.pos._x, y: player.pos._y});
                  // const distanceToEnemyFromMouse = Math.hypot(screenPlayerPos.x - unsafeWindow.game.input.mousePos._x, screenPlayerPos.y - unsafeWindow.game.input.mousePos._y);
                  const distanceToEnemyFromMouse = (screenPlayerPos.x - unsafeWindow.game.input.mousePos._x) ** 2 + (screenPlayerPos.y - unsafeWindow.game.input.mousePos._y) ** 2;
                  
                  if (distanceToEnemyFromMouse < minDistanceToEnemyFromMouse) {
                      minDistanceToEnemyFromMouse = distanceToEnemyFromMouse;
                      enemy = player;
                  }
              });
          }

          if (enemy) {
              const meX = me.pos._x;
              const meY = me.pos._y;
              const enemyX = enemy.pos._x;
              const enemyY = enemy.pos._y;

              const distanceToEnemy = Math.hypot(meX - enemyX, meY - enemyY);
              // const distanceToEnemy = (meX - enemyX) ** 2 + (meY - enemyY) ** 2;

              if (enemy != state.enemyAimBot) {
                  state.enemyAimBot = enemy;
                  state.lastFrames[enemy.__id] = [];
              }

              const predictedEnemyPos = calculatePredictedPosForShoot(enemy, me);

              if (!predictedEnemyPos) return;

              unsafeWindow.lastAimPos = {
                  clientX: predictedEnemyPos.x,
                  clientY: predictedEnemyPos.y,
              };
              
              // AutoMelee
              if(state.isMeleeAttackEnabled && distanceToEnemy <= 8) {
                  const moveAngle = calcAngle(enemy.pos, me.pos) + Math.PI;
                  unsafeWindow.aimTouchMoveDir = {
                      x: Math.cos(moveAngle),
                      y: Math.sin(moveAngle),
                  };
                  unsafeWindow.aimTouchDistanceToEnemy = distanceToEnemy;
              }else {
                  unsafeWindow.aimTouchMoveDir = null;
                  unsafeWindow.aimTouchDistanceToEnemy = null;
              }

              if (aimbotDot.style.left !== predictedEnemyPos.x + 'px' || aimbotDot.style.top !== predictedEnemyPos.y + 'px') {
                  aimbotDot.style.left = predictedEnemyPos.x + 'px';
                  aimbotDot.style.top = predictedEnemyPos.y + 'px';
                  aimbotDot.style.display = 'block';
              }
          }else {
              unsafeWindow.aimTouchMoveDir = null;
              unsafeWindow.lastAimPos = null;
              aimbotDot.style.display = 'none';
          }
      } catch (error) {
          console.error("Error in aimBot:", error);
      }
  }

  function aimBotToggle(){
      state.isAimBotEnabled = !state.isAimBotEnabled;
      if (state.isAimBotEnabled) return;

      aimbotDot.style.display = 'None';
      unsafeWindow.lastAimPos = null;
      unsafeWindow.aimTouchMoveDir = null;
  }

  function meleeAttackToggle(){
      state.isMeleeAttackEnabled = !state.isMeleeAttackEnabled;
      if (state.isMeleeAttackEnabled) return;

      unsafeWindow.aimTouchMoveDir = null;
  }

  function calculatePredictedPosForShoot(enemy, curPlayer) {
      if (!enemy || !curPlayer) {
          console.log("Missing enemy or player data");
          return null;
      }
      
      const { pos: enemyPos } = enemy;
      const { pos: curPlayerPos } = curPlayer;

      const dateNow = performance.now();

      if ( !(enemy.__id in state.lastFrames) ) state.lastFrames[enemy.__id] = [];
      state.lastFrames[enemy.__id].push([dateNow, { ...enemyPos }]);

      if (state.lastFrames[enemy.__id].length < 30) {
          console.log("Insufficient data for prediction, using current position");
          return unsafeWindow.game.camera.pointToScreen({x: enemyPos._x, y: enemyPos._y});
      }

      if (state.lastFrames[enemy.__id].length > 30){
          state.lastFrames[enemy.__id].shift();
      }

      const deltaTime = (dateNow - state.lastFrames[enemy.__id][0][0]) / 1000; // Time since last frame in seconds

      const enemyVelocity = {
          x: (enemyPos._x - state.lastFrames[enemy.__id][0][1]._x) / deltaTime,
          y: (enemyPos._y - state.lastFrames[enemy.__id][0][1]._y) / deltaTime,
      };

      const weapon = findWeap(curPlayer);
      const bullet = findBullet(weapon);

      let bulletSpeed;
      if (!bullet) {
          bulletSpeed = 1000;
      }else {
          bulletSpeed = bullet.speed;
      }


      // Quadratic equation for time prediction
      const vex = enemyVelocity.x;
      const vey = enemyVelocity.y;
      const dx = enemyPos._x - curPlayerPos._x;
      const dy = enemyPos._y - curPlayerPos._y;
      const vb = bulletSpeed;

      const a = vb ** 2 - vex ** 2 - vey ** 2;
      const b = -2 * (vex * dx + vey * dy);
      const c = -(dx ** 2) - (dy ** 2);

      let t; 

      if (Math.abs(a) < 1e-6) {
          console.log('Linear solution bullet speed is much greater than velocity');
          t = -c / b;
      } else {
          const discriminant = b ** 2 - 4 * a * c;

          if (discriminant < 0) {
              console.log("No solution, shooting at current position");
              return unsafeWindow.game.camera.pointToScreen({x: enemyPos._x, y: enemyPos._y});
          }

          const sqrtD = Math.sqrt(discriminant);
          const t1 = (-b - sqrtD) / (2 * a);
          const t2 = (-b + sqrtD) / (2 * a);

          t = Math.min(t1, t2) > 0 ? Math.min(t1, t2) : Math.max(t1, t2);
      }


      if (t < 0) {
          console.log("Negative time, shooting at current position");
          return unsafeWindow.game.camera.pointToScreen({x: enemyPos._x, y: enemyPos._y});
      }

      // console.log(`A bullet with the enemy will collide through ${t}`)

      const predictedPos = {
          x: enemyPos._x + vex * t,
          y: enemyPos._y + vey * t,
      };

      return unsafeWindow.game.camera.pointToScreen(predictedPos);
  }

  function calcAngle(playerPos, mePos){
      const dx = mePos._x - playerPos._x;
      const dy = mePos._y - playerPos._y;

      return Math.atan2(dy, dx);
  }

  function keybinds(){
      unsafeWindow.document.addEventListener('keyup', function (event) {
          if (!unsafeWindow?.game?.ws) return;

          const validKeys = ['B', 'Z', 'M', 'Y', 'T', 'V'];
          if (!validKeys.includes(String.fromCharCode(event.keyCode))) return;
      
          switch (String.fromCharCode(event.keyCode)) {
              case 'B': 
                  aimBotToggle();
                  break;
              case 'Z': state.isZoomEnabled = !state.isZoomEnabled; break;
              case 'M': 
                  meleeAttackToggle();
                  break;
              case 'Y': state.isSpinBotEnabled = !state.isSpinBotEnabled; break;
              case 'T': 
                  if(state.focusedEnemy){
                      state.focusedEnemy = null;
                  }else {
                      if (!state.enemyAimBot?.active || state.enemyAimBot?.netData?.dead) break;
                      state.focusedEnemy = state.enemyAimBot;
                  }
                  break;
              case 'V': state.isUseOneGunEnabled = !state.isUseOneGunEnabled; break;
              // case 'P': autoStopEnabled = !autoStopEnabled; break;
              // case 'U': autoSwitchEnabled = !autoSwitchEnabled; break;
              // case 'O': unsafeWindow.gameOptimization = !unsafeWindow.gameOptimization; break;
          }
          updateOverlay();
          updateButtonColors();
      });
      
      unsafeWindow.document.addEventListener('keydown', function (event) {
          if (!unsafeWindow?.game?.ws) return;

          const validKeys = ['M', 'T', 'V'];
          if (!validKeys.includes(String.fromCharCode(event.keyCode))) return;
      
          event.stopImmediatePropagation();
          event.stopPropagation();
          event.preventDefault();
      });

      unsafeWindow.document.addEventListener('mousedown', function (event) {
          if (event.button !== 1) return; // Only proceed if middle mouse button is clicked

          const mouseX = event.clientX;
          const mouseY = event.clientY;

          const players = unsafeWindow.game.playerBarn.playerPool.pool;
          const me = unsafeWindow.game.activePlayer;
          const meTeam = getTeam(me);

          let enemy = null;
          let minDistanceToEnemyFromMouse = Infinity;

          players.forEach((player) => {
              // We miss inactive or dead players
              if (!player.active || player.netData.dead || player.downed || me.__id === player.__id || getTeam(player) == meTeam) return;

              const screenPlayerPos = unsafeWindow.game.camera.pointToScreen({x: player.pos._x, y: player.pos._y});
              const distanceToEnemyFromMouse = (screenPlayerPos.x - mouseX) ** 2 + (screenPlayerPos.y - mouseY) ** 2;

              if (distanceToEnemyFromMouse < minDistanceToEnemyFromMouse) {
                  minDistanceToEnemyFromMouse = distanceToEnemyFromMouse;
                  enemy = player;
              }
          });

          if (enemy) {
              const enemyIndex = state.friends.indexOf(enemy.nameText._text);
              if (~enemyIndex) {
                  state.friends.splice(enemyIndex, 1);
                  console.log(`Removed player with name ${enemy.nameText._text} from friends.`);
              }else {
                  state.friends.push(enemy.nameText._text);
                  console.log(`Added player with name ${enemy.nameText._text} to friends.`);
              }
          }
      });
  }

  keybinds();

  function removeCeilings(){
      Object.defineProperty( Object.prototype, 'textureCacheIds', {
          set( value ) {
              this._textureCacheIds = value;
      
              if ( Array.isArray( value ) ) {
                  const scope = this;
      
                  value.push = new Proxy( value.push, {
                      apply( target, thisArgs, args ) {
                          // console.log(args[0], scope, scope?.baseTexture?.cacheId);
                          // console.log(scope, args[0]);
                          if (args[0].includes('ceiling') && !args[0].includes('map-building-container-ceiling-05') || args[0].includes('map-snow-')) {
                              Object.defineProperty( scope, 'valid', {
                                  set( value ) {
                                      this._valid = value;
                                  },
                                  get() {
                                      return state.isXrayEnabled ? false : this._valid;
                                  }
                              });
                          }
                          return Reflect.apply( ...arguments );
      
                      }
                  });
      
              }
      
          },
          get() {
              return this._textureCacheIds;
          }
      });
  }

  removeCeilings();

  function autoLoot(){
      Object.defineProperty(unsafeWindow, 'basicDataInfo', {
          get () {
              return this._basicDataInfo;
          },
          set(value) {
              this._basicDataInfo = value;
              
              if (!value) return;
              
              Object.defineProperty(unsafeWindow.basicDataInfo, 'isMobile', {
                  get () {
                      return state.isAutoLootEnabled ? true : this._isMobile;
                  },
                  set(value) {
                      this._isMobile = value;
                  }
              });
              
              Object.defineProperty(unsafeWindow.basicDataInfo, 'useTouch', {
                  get () {
                      return state.isAutoLootEnabled ? true : this._useTouch;
                  },
                  set(value) {
                      this._useTouch = value;
                  }
              });
              
          }
      });
  }

  autoLoot();

  const inputCommands = {
      Cancel: 6,
      Count: 36,
      CycleUIMode: 30,
      EmoteMenu: 31,
      EquipFragGrenade: 15,
      EquipLastWeap: 19,
      EquipMelee: 13,
      EquipNextScope: 22,
      EquipNextWeap: 17,
      EquipOtherGun: 20,
      EquipPrevScope: 21,
      EquipPrevWeap: 18,
      EquipPrimary: 11,
      EquipSecondary: 12,
      EquipSmokeGrenade: 16,
      EquipThrowable: 14,
      Fire: 4,
      Fullscreen: 33,
      HideUI: 34,
      Interact: 7,
      Loot: 10,
      MoveDown: 3,
      MoveLeft: 0,
      MoveRight: 1,
      MoveUp: 2,
      Reload: 5,
      Revive: 8,
      StowWeapons: 27,
      SwapWeapSlots: 28,
      TeamPingMenu: 32,
      TeamPingSingle: 35,
      ToggleMap: 29,
      Use: 9,
      UseBandage: 23,
      UseHealthKit: 24,
      UsePainkiller: 26,
      UseSoda: 25,
  };

  let inputs = [];
  let portraitLastFlip = 0;
  let portraitValue = false;
  unsafeWindow.initGameControls = function(gameControls){
      for (const command of inputs){
          gameControls.addInput(inputCommands[command]);
      }
      inputs = [];

      if (state.isMovementAccuracyEnabled && (gameControls.shootStart || gameControls.shootHold)) {
          gameControls.moveLeft = false;
          gameControls.moveRight = false;
          gameControls.moveUp = false;
          gameControls.moveDown = false;
          gameControls.touchMoveActive = false;
      }

      if (state.isPortraitCullingEnabled) {
          const now = performance.now();
          if (now - portraitLastFlip >= 550) {
              portraitValue = !portraitValue;
              portraitLastFlip = now;
          }
          gameControls.portrait = portraitValue;
      }

      // mobile aimbot
      if (gameControls.touchMoveActive && unsafeWindow.lastAimPos){
          // gameControls.toMouseDir
          gameControls.toMouseLen = 18;

          const atan = Math.atan2(
              unsafeWindow.lastAimPos.clientX - unsafeWindow.innerWidth / 2,
              unsafeWindow.lastAimPos.clientY - unsafeWindow.innerHeight / 2,
          ) - Math.PI / 2;

          if ( (  unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) && unsafeWindow.lastAimPos && unsafeWindow.game.activePlayer.localData.curWeapIdx != 3) {
              gameControls.toMouseDir.x = Math.cos(atan);

          }
          if ( (  unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) && unsafeWindow.lastAimPos && unsafeWindow.game.activePlayer.localData.curWeapIdx != 3) {
              gameControls.toMouseDir.y = Math.sin(atan);
          }
      }

      // autoMelee
      if ((  unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) && unsafeWindow.aimTouchMoveDir) {
          if (unsafeWindow.aimTouchDistanceToEnemy < 4) gameControls.addInput(inputCommands['EquipMelee']);
          gameControls.touchMoveActive = true;
          gameControls.touchMoveLen = 255;
          gameControls.touchMoveDir.x = unsafeWindow.aimTouchMoveDir.x;
          gameControls.touchMoveDir.y = unsafeWindow.aimTouchMoveDir.y;
      }

      return gameControls
  };

  function bumpFire(){
      unsafeWindow.game.inputBinds.isBindPressed = new Proxy( unsafeWindow.game.inputBinds.isBindPressed, {
          apply( target, thisArgs, args ) {
              if (args[0] === inputCommands.Fire) {
                  return state.isBumpFireEnabled
                      ? unsafeWindow.game.inputBinds.isBindDown(...args)
                      : Reflect.apply(...arguments);
              }
              return Reflect.apply( ...arguments );
          }
      });
  }

  let spinAngle = 0;
  const radius = 100; // The radius of the circle
  const spinSpeed = 37.5; // Rotation speed (increase for faster speed)
  function overrideMousePos() {
      Object.defineProperty(unsafeWindow.game.input.mousePos, 'x', {
          get() {
              if ( (  unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) && unsafeWindow.lastAimPos && unsafeWindow.game.activePlayer.localData.curWeapIdx != 3) {
                  return unsafeWindow.lastAimPos.clientX;
              }
              if ( !(  unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) && !(unsafeWindow.game.inputBinds.isBindPressed(inputCommands.EmoteMenu) || unsafeWindow.game.inputBinds.isBindDown(inputCommands.EmoteMenu)) && unsafeWindow.game.activePlayer.localData.curWeapIdx != 3 && state.isSpinBotEnabled) {
                  // SpinBot
                  spinAngle += spinSpeed;
                  return Math.cos(degreesToRadians(spinAngle)) * radius + unsafeWindow.innerWidth / 2;
              }
              return this._x;
          },
          set(value) {
              this._x = value;
          }
      });

      Object.defineProperty(unsafeWindow.game.input.mousePos, 'y', {
          get() {
              if ( (  unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) && unsafeWindow.lastAimPos && unsafeWindow.game.activePlayer.localData.curWeapIdx != 3) {
                  return unsafeWindow.lastAimPos.clientY;
              }
              if ( !(  unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) && !(unsafeWindow.game.inputBinds.isBindPressed(inputCommands.EmoteMenu) || unsafeWindow.game.inputBinds.isBindDown(inputCommands.EmoteMenu)) && unsafeWindow.game.activePlayer.localData.curWeapIdx != 3 && state.isSpinBotEnabled) {
                  return Math.sin(degreesToRadians(spinAngle)) * radius + unsafeWindow.innerHeight / 2;
              }
              return this._y;
          },
          set(value) {
              this._y = value;
          }
      });

  }

  function degreesToRadians(degrees) {
      return degrees * (Math.PI / 180);
  }

  function betterZoom(){
      Object.defineProperty(unsafeWindow.game.camera, 'zoom', {
          get() {
              return Math.max(unsafeWindow.game.camera.targetZoom - (state.isZoomEnabled ? 0.45 : 0), 0.35);
          },
          set(value) {
          }
      });

      let oldScope = unsafeWindow.game.activePlayer.localData.scope;
      Object.defineProperty(unsafeWindow.game.camera, 'targetZoom', {
          get(){
              return this._targetZoom;
          },
          set(value) {
              const newScope = unsafeWindow.game.activePlayer.localData.scope;
              const inventory = unsafeWindow.game.activePlayer.localData.inventory;

              const scopes = ['1xscope', '2xscope', '4xscope', '8xscope', '15xscope'];

              // console.log(value, oldScope, newScope, newScope == oldScope, (inventory['2xscope'] || inventory['4xscope'] || inventory['8xscope'] || inventory['15xscope']));
              if ( (newScope == oldScope) && (inventory['2xscope'] || inventory['4xscope'] || inventory['8xscope'] || inventory['15xscope']) && value >= this._targetZoom
                  || scopes.indexOf(newScope) > scopes.indexOf(oldScope) && value >= this._targetZoom
              ) return;

              oldScope = unsafeWindow.game.activePlayer.localData.scope;

              this._targetZoom = value;
          }
      });
  }

  function smokeOpacity(){
      console.log('smokeopacity');
      
      const particles = unsafeWindow.game.smokeBarn.particles;
      console.log('smokeopacity', particles, unsafeWindow.game.smokeBarn.particles);
      particles.push = new Proxy( particles.push, {
          apply( target, thisArgs, args ) {
              console.log('smokeopacity', args[0]);
              const particle = args[0];

              Object.defineProperty(particle.sprite, 'alpha', {
                  get() {
                      return state.isSmokeOpacityEnabled ? 0.12 : this._survevGptAlpha ?? 1;
                  },
                  set(value) {
                      this._survevGptAlpha = value;
                  }
              });

              return Reflect.apply( ...arguments );

          }
      });

      particles.forEach(particle => {
          Object.defineProperty(particle.sprite, 'alpha', {
              get() {
                  return state.isSmokeOpacityEnabled ? 0.12 : this._survevGptAlpha ?? 1;
              },
              set(value) {
                  this._survevGptAlpha = value;
              }
          });
      });
  }

  function visibleNames(){
      const pool = unsafeWindow.game.playerBarn.playerPool.pool;

      console.log('visibleNames', pool);

      pool.push = new Proxy( pool.push, {
          apply( target, thisArgs, args ) {
              const player = args[0];
              Object.defineProperty(player.nameText, 'visible', {
                  get(){
                      if (!state.isVisibleNamesEnabled) return this._survevGptVisible ?? false;
                      const me = unsafeWindow.game.activePlayer;
                      const meTeam = getTeam(me);
                      const playerTeam = getTeam(player);
                      // console.log('visible', player?.nameText?._text, playerTeam === meTeam ? BLUE : RED, player, me, playerTeam, meTeam)
                      this.tint = playerTeam === meTeam ? BLUE : state.friends.includes(player.nameText._text) ? GREEN : RED;
                      player.nameText.style.fontSize = 40;
                      return true;
                  },
                  set(value){
                      this._survevGptVisible = value;
                  }
              });

              return Reflect.apply( ...arguments );
          }
      });

      pool.forEach(player => {
          Object.defineProperty(player.nameText, 'visible', {
              get(){
                  if (!state.isVisibleNamesEnabled) return this._survevGptVisible ?? false;
                  const me = unsafeWindow.game.activePlayer;
                  const meTeam = getTeam(me);
                  const playerTeam = getTeam(player);
                  // console.log('visible', player?.nameText?._text, playerTeam === meTeam ? BLUE : RED, player, me, playerTeam, meTeam)
                  this.tint = playerTeam === meTeam ? BLUE : RED;
                  player.nameText.style.fontSize = 40;
                  return true;
              },
              set(value){
                  this._survevGptVisible = value;
              }
          });
      });
  }

  function esp(){
      const pixi = unsafeWindow.game.pixi; 
      const me = unsafeWindow.game.activePlayer;
      const players = unsafeWindow.game.playerBarn.playerPool.pool;

      // We check if there is an object of Pixi, otherwise we create a new
      if (!pixi || me?.container == undefined) {
          // console.error("PIXI object not found in game.");
          return;
      }

      const meX = me.pos.x;
      const meY = me.pos.y;

      const meTeam = getTeam(me);
      
      try{

      // lineDrawer
      const lineDrawer = me.container.lineDrawer;
      try{lineDrawer.clear();}
      catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
      if (state.isLineDrawerEnabled){

          if (!me.container.lineDrawer) {
              me.container.lineDrawer = new PIXI.Graphics();
              me.container.addChild(me.container.lineDrawer);
          }
              
          // For each player
          players.forEach((player) => {
              // We miss inactive or dead players
              if (!player.active || player.netData.dead || me.__id == player.__id) return;
      
              const playerX = player.pos.x;
              const playerY = player.pos.y;
      
              const playerTeam = getTeam(player);
      
              // We calculate the color of the line (for example, red for enemies)
              const lineColor = playerTeam === meTeam ? BLUE : state.friends.includes(player.nameText._text) ? GREEN : me.layer === player.layer && (state.isAimAtKnockedOutEnabled || !player.downed) ? RED : WHITE;
      
              // We draw a line from the current player to another player
              lineDrawer.lineStyle(2, lineColor, 1);
              lineDrawer.moveTo(0, 0); // Container Container Center
              lineDrawer.lineTo(
                  (playerX - meX) * 16,
                  (meY - playerY) * 16
              );
          });
      }

      // nadeDrawer
      const nadeDrawer = me.container.nadeDrawer;
      try{nadeDrawer?.clear();}
      catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
      if (state.isNadeDrawerEnabled){
          if (!me.container.nadeDrawer) {
              me.container.nadeDrawer = new PIXI.Graphics();
              me.container.addChild(me.container.nadeDrawer);
          }
      
          Object.values(unsafeWindow.game.objectCreator.idToObj)
              .filter(obj => {
                  const isValid = ( obj.__type === 9 && obj.type !== "smoke" )
                      ||  (
                              obj.smokeEmitter &&
                              unsafeWindow.objects[obj.type].explosion);
                  return isValid;
              })
              .forEach(obj => {
                  if(obj.layer !== me.layer) {
                      nadeDrawer.beginFill(0xffffff, 0.3);
                  } else {
                      nadeDrawer.beginFill(0xff0000, 0.2);
                  }
                  nadeDrawer.drawCircle(
                      (obj.pos.x - meX) * 16,
                      (meY - obj.pos.y) * 16,
                      (unsafeWindow.explosions[
                          unsafeWindow.throwable[obj.type]?.explosionType ||
                          unsafeWindow.objects[obj.type].explosion
                              ].rad.max +
                          1) *
                      16
                  );
                  nadeDrawer.endFill();
              });
      }

      // flashlightDrawer(laserDrawer)
      const laserDrawer = me.container.laserDrawer;
      try{laserDrawer.clear();}
      catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
      if (state.isLaserDrawerEnabled) {
          const curWeapon = findWeap(me);
          const curBullet = findBullet(curWeapon);
          
          if ( !me.container.laserDrawer ) {
              me.container.laserDrawer = new PIXI.Graphics();
              me.container.addChildAt(me.container.laserDrawer, 0);
          }
      
          function laserPointer(
              curBullet,
              curWeapon,
              acPlayer,
              color = 0x0000ff,
              opacity = 0.3,
          ) {
              const { pos: acPlayerPos, posOld: acPlayerPosOld } = acPlayer;
      
              const dateNow = performance.now();
      
              if ( !(acPlayer.__id in state.lastFrames) ) state.lastFrames[acPlayer.__id] = [];
              state.lastFrames[acPlayer.__id].push([dateNow, { ...acPlayerPos }]);
      
              if (state.lastFrames[acPlayer.__id].length < 30) return;
      
              if (state.lastFrames[acPlayer.__id].length > 30){
                  state.lastFrames[acPlayer.__id].shift();
              }
      
              const deltaTime = (dateNow - state.lastFrames[acPlayer.__id][0][0]) / 1000; // Time since last frame in seconds
      
              const acPlayerVelocity = {
                  x: (acPlayerPos._x - state.lastFrames[acPlayer.__id][0][1]._x) / deltaTime,
                  y: (acPlayerPos._y - state.lastFrames[acPlayer.__id][0][1]._y) / deltaTime,
              };
      
              let lasic = {};
          
              let isMoving = !!(acPlayerVelocity.x || acPlayerVelocity.y);
          
              if(curBullet) {
                  lasic.active = true;
                  lasic.range = curBullet.distance * 16.25;
                  let atan;
                  if (acPlayer == me && ( !(unsafeWindow.lastAimPos) || (unsafeWindow.lastAimPos) && !(unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire)) ) ){
                      //local rotation
                      atan = Math.atan2(
                          unsafeWindow.game.input.mousePos._y - unsafeWindow.innerHeight / 2,
                          unsafeWindow.game.input.mousePos._x - unsafeWindow.innerWidth / 2,
                      );
                  }else if(acPlayer == me && (unsafeWindow.lastAimPos) && ( unsafeWindow.game.touch.shotDetected || unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ) ){
                      const playerPointToScreen = unsafeWindow.game.camera.pointToScreen({x: acPlayer.pos._x, y: acPlayer.pos._y});
                      atan = Math.atan2(
                          playerPointToScreen.y - unsafeWindow.lastAimPos.clientY,
                          playerPointToScreen.x - unsafeWindow.lastAimPos.clientX
                      ) 
                      -
                      Math.PI;
                  }else {
                      atan = Math.atan2(
                          acPlayer.dir.x,
                          acPlayer.dir.y
                      ) 
                      -
                      Math.PI / 2;
                  }
                  lasic.direction = atan;
                  lasic.angle =
                      ((curWeapon.shotSpread +
                          (isMoving ? curWeapon.moveSpread : 0)) *
                          0.01745329252) /
                      2;
              } else {
                  lasic.active = false;
              }
          
              if(!lasic.active) {
                  return;
              }
      
              const center = {
                  x: (acPlayerPos._x - me.pos._x) * 16,
                  y: (me.pos._y - acPlayerPos._y) * 16,
              };
              const radius = lasic.range;
              let angleFrom = lasic.direction - lasic.angle;
              let angleTo = lasic.direction + lasic.angle;
              angleFrom =
                  angleFrom > Math.PI * 2
                      ? angleFrom - Math.PI * 2
                      : angleFrom < 0
                      ? angleFrom + Math.PI * 2
                      : angleFrom;
              angleTo =
                  angleTo > Math.PI * 2
                      ? angleTo - Math.PI * 2
                      : angleTo < 0
                      ? angleTo + Math.PI * 2
                      : angleTo;
              laserDrawer.beginFill(color, opacity);
              laserDrawer.moveTo(center.x, center.y);
              laserDrawer.arc(center.x, center.y, radius, angleFrom, angleTo);
              laserDrawer.lineTo(center.x, center.y);
              laserDrawer.endFill();
          }
          
          
          laserPointer(
              curBullet,
              curWeapon,
              me,
          );
          
          players
              .filter(player => player.active && !player.netData.dead && me.__id !== player.__id && me.layer === player.layer && getTeam(player) != meTeam)
              .forEach(enemy => {
                  const enemyWeapon = findWeap(enemy);
                  laserPointer(
                      findBullet(enemyWeapon),
                      enemyWeapon,
                      enemy,
                      "0",
                      0.2,
                  );
              });
      };

      }catch(err){
          // console.error('esp', err);
      }
  }

  const ammo = [
      {
          name: "",
          ammo: null,
          lastShotDate: Date.now()
      },
      {
          name: "",
          ammo: null,
          lastShotDate: Date.now()
      },
      {
          name: "",
          ammo: null,
      },
      {
          name: "",
          ammo: null,
      },
  ];
  function autoSwitch(){
      if (!(unsafeWindow.game?.ws && unsafeWindow.game?.activePlayer?.localData?.curWeapIdx != null)) return; 

      if (!state.isAutoSwitchEnabled) return;

      try {
      const curWeapIdx = unsafeWindow.game.activePlayer.localData.curWeapIdx;
      const weaps = unsafeWindow.game.activePlayer.localData.weapons;
      const curWeap = weaps[curWeapIdx];
      const shouldSwitch = gun => {
          let s = false;
          try {
              s =
                  (unsafeWindow.guns[gun].fireMode === "single"
                  || unsafeWindow.guns[gun].fireMode === "burst") 
                  && unsafeWindow.guns[gun].fireDelay >= 0.45;
          }
          catch (e) {
          }
          return s;
      };
      const weapsEquip = ['EquipPrimary', 'EquipSecondary'];
      if(curWeap.ammo !== ammo[curWeapIdx].ammo) {
          const otherWeapIdx = (curWeapIdx == 0) ? 1 : 0;
          const otherWeap = weaps[otherWeapIdx];
          if ((curWeap.ammo < ammo[curWeapIdx].ammo || (ammo[curWeapIdx].ammo === 0 && curWeap.ammo > ammo[curWeapIdx].ammo && (  unsafeWindow.game.touch.shotDetected ||  unsafeWindow.game.inputBinds.isBindDown(inputCommands.Fire) ))) && shouldSwitch(curWeap.type) && curWeap.type == ammo[curWeapIdx].type) {
              ammo[curWeapIdx].lastShotDate = Date.now();
              console.log("Switching weapon due to ammo change");
              if ( shouldSwitch(otherWeap.type) && otherWeap.ammo && !state.isUseOneGunEnabled) { inputs.push(weapsEquip[otherWeapIdx]); } // && ammo[curWeapIdx].ammo !== 0
              else if ( otherWeap.type !== "" ) { inputs.push(weapsEquip[otherWeapIdx]); inputs.push(weapsEquip[curWeapIdx]); }
              else { inputs.push('EquipMelee'); inputs.push(weapsEquip[curWeapIdx]); }
          }
          ammo[curWeapIdx].ammo = curWeap.ammo;
          ammo[curWeapIdx].type = curWeap.type;
      }
      }catch(err){
          console.error('autoswitch', err);
      }
  }

  function obstacleOpacity(){
      unsafeWindow.game.map.obstaclePool.pool.forEach(obstacle => {
          if (!['bush', 'tree', 'table', 'stairs'].some(substring => obstacle.type.includes(substring))) return;
          obstacle.sprite.alpha = state.isObstacleOpacityEnabled ? 0.45 : 1;
      });
  }

  let lastTime = Date.now();
  let showing = false;
  let timer = null;
  function grenadeTimer(){
      if (!state.isGrenadeTimerEnabled) {
          showing = false;
          if (timer) timer.destroy();
          timer = null;
          return;
      }
      if (!(unsafeWindow.game?.ws && unsafeWindow.game?.activePlayer?.localData?.curWeapIdx != null && unsafeWindow.game?.activePlayer?.netData?.activeWeapon != null)) return; 

      try{
      let elapsed = (Date.now() - lastTime) / 1000;
      const player = unsafeWindow.game.activePlayer;
      const activeItem = player.netData.activeWeapon;

      if (3 !== unsafeWindow.game.activePlayer.localData.curWeapIdx 
          || player.throwableState !== "cook"
          || (!activeItem.includes('frag') && !activeItem.includes('mirv') && !activeItem.includes('martyr_nade'))
      )
          return (
              (showing = false),
              timer && timer.destroy(),
              (timer = false)
          );
      const time = 4;

      if(elapsed > time) {
          showing = false;
      }
      if(!showing) {
          if(timer) {
              timer.destroy();
          }
          timer = new unsafeWindow.pieTimerClass();
          unsafeWindow.game.pixi.stage.addChild(timer.container);
          timer.start("Grenade", 0, time);
          showing = true;
          lastTime = Date.now();
          return;
      }
      timer.update(elapsed - timer.elapsed, unsafeWindow.game.camera);
      }catch(err){
          console.error('grenadeTimer', err);
      }
  }

  function initTicker(){
      unsafeWindow.game.pixi._ticker.add(esp);
      unsafeWindow.game.pixi._ticker.add(aimBot);
      unsafeWindow.game.pixi._ticker.add(autoSwitch);
      unsafeWindow.game.pixi._ticker.add(obstacleOpacity);
      unsafeWindow.game.pixi._ticker.add(grenadeTimer);
      unsafeWindow.game.pixi._ticker.add(unsafeWindow.GameMod.startUpdateLoop.bind(unsafeWindow.GameMod));
  }

  let tickerOneTime = false;
  function initGame() {
      console.log('init game...........');

      unsafeWindow.lastAimPos = null;
      unsafeWindow.aimTouchMoveDir = null;
      state.enemyAimBot = null;
      state.focusedEnemy = null;
      state.friends = [];
      state.lastFrames = {};

      const tasks = [
          {isApplied: false, condition: () => unsafeWindow.game?.input?.mousePos && unsafeWindow.game?.touch?.aimMovement?.toAimDir, action: overrideMousePos},
          {isApplied: false, condition: () => unsafeWindow.game?.input?.mouseButtonsOld, action: bumpFire},
          {isApplied: false, condition: () => unsafeWindow.game?.activePlayer?.localData, action: betterZoom},
          {isApplied: false, condition: () => Array.prototype.push === unsafeWindow.game?.smokeBarn?.particles.push, action: smokeOpacity},
          {isApplied: false, condition: () => Array.prototype.push === unsafeWindow.game?.playerBarn?.playerPool?.pool.push, action: visibleNames},
          {isApplied: false, condition: () => unsafeWindow.game?.pixi?._ticker && unsafeWindow.game?.activePlayer?.container && unsafeWindow.game?.activePlayer?.pos, action: () => { if (!tickerOneTime) { tickerOneTime = true; initTicker(); } } },
      ];

      (function checkLocalData(){
          if(!unsafeWindow?.game?.ws) return;

          console.log('Checking local data');

          console.log(
              unsafeWindow.game?.activePlayer?.localData, 
              unsafeWindow.game?.map?.obstaclePool?.pool,
              unsafeWindow.game?.smokeBarn?.particles,
              unsafeWindow.game?.playerBarn?.playerPool?.pool
          );

          tasks.forEach(task => console.log(task.action, task.isApplied));
          
          tasks.forEach(task => {
              if (task.isApplied || !task.condition()) return;
              task.action();
              task.isApplied = true;
          });
          
          if (tasks.some(task => !task.isApplied)) setTimeout(checkLocalData, 5);
          else console.log('All functions applied, stopping loop.');
      })();

      updateOverlay();
  }

  installNavigationGuard();


  // init game every play start
  function bootLoader(){
      Object.defineProperty(unsafeWindow, 'game', {
          get () {
              return this._game;
          },
          set(value) {
              this._game = value;
              
              if (!value) return;
              
              initGame();
              
          }
      });
  }

  bootLoader();

  const init = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: 'Module' }));

})();
