// ==UserScript==
// @name         SurvevGPT Allowlisted Research Harness
// @namespace    survevgpt.local
// @version      0.1.3
// @description  Allowlisted white-box gameplay security research harness.
// @author       SurvevGPT
// @license      GPL3
// @match        *://*/*
// @run-at       document-start
// @webRequest   [{"selector":"http://localhost/js/*.js","action":"cancel"},{"selector":"https://localhost/js/*.js","action":"cancel"},{"selector":"http://geekbar.xyz/js/*.js","action":"cancel"},{"selector":"https://geekbar.xyz/js/*.js","action":"cancel"},{"selector":"http://*.geekbar.xyz/js/*.js","action":"cancel"},{"selector":"https://*.geekbar.xyz/js/*.js","action":"cancel"}]
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
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
      console.info('[SurvevGPT 0.1.3] Authorized page', authorization);

      const initialize = () => {
          __vitePreload(() => Promise.resolve().then(() => init),false?__VITE_PRELOAD__:undefined).catch((error) => {
              console.error('[SurvevGPT] Local research harness failed to initialize.', error);
          });
      };

      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initialize, { once: true });
      } else {
          initialize();
      }
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
      isXrayEnabled: false,
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
      isMapColorizingEnabled: false,
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

  const uiGame = document.querySelector('#ui-game');
  const uiTopLeft = document.querySelector('#ui-top-left');
  if (uiGame) {
      uiGame.append(overlay, aimbotDot);
      overlay.style.display = state.isOverlayEnabled ? 'block' : 'none';
  }
  if (uiTopLeft) uiTopLeft.insertBefore(krityTitle, uiTopLeft.firstChild);

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

  unsafeWindow.addEventListener('beforeunload', () => {
      for (const key of ['__SURVEVGPT_SPEC_SWEEP__', '__SURVEVGPT_INPUT_REPLAY__']) {
          if (unsafeWindow[key]) clearInterval(unsafeWindow[key]);
          unsafeWindow[key] = null;
      }
  }, { once: true });

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

  function aliasMap(target, aliases) {
      for (const [publicName, internalName] of Object.entries(aliases)) {
          alias(target, publicName, internalName);
      }
  }

  function adaptVector(vector) {
      if (!vector || typeof vector !== 'object') return;
      alias(vector, '_x', 'x');
      alias(vector, '_y', 'y');
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
      aliasMap(player, {
          netData: 'GATSOq',
          localData: 'SujaN',
          pos: 'JXy',
          posOld: 'ZtMf',
          dir: 'SFg',
          visualPos: 'WlKQJ',
      });
      aliasMap(player?.GATSOq, {
          pos: 'JXy',
          dir: 'SFg',
          activeWeapon: 'kgr',
          dead: 'zTJbIl',
          downed: 'xTH',
          role: 'RyR',
      });
      aliasMap(player?.SujaN, {
          health: 'IzYNkh',
          curWeapIdx: 'VCiQ',
          inventory: 'buyn',
          weapons: 'qlyu',
      });
      [player?.JXy, player?.ZtMf, player?.WlKQJ, player?.SFg, player?.GATSOq?.JXy, player?.GATSOq?.SFg]
          .forEach(adaptVector);
      exposeMPrefix(player);
      exposeMPrefix(player?.m_netData);
      exposeMPrefix(player?.m_localData);
  }

  function adaptGameRuntime(game) {
      aliasMap(game, {
          pixi: 'nHb',
          audioManager: 'GHBZo',
          localization: 'PZa',
          config: 'RPY',
          input: 'JiM',
          inputBinds: 'KEC',
          resourceManager: 'qZc',
          ws: 'dYkZo',
          camera: 'tGah',
          map: 'TFlxX',
          playerBarn: 'uhx',
          smokeBarn: 'Hhdj',
          objectCreator: 'kbsoh',
          activePlayer: 'iGQ',
          sendMessage: 'RIZTQZ',
          prevInputMsg: 'KkQ',
          spectating: 'fvVFy',
          touch: 'sqB',
          renderer: 'Pvi',
          particleBarn: 'UDzww',
          decalBarn: 'SfSEk',
          bulletBarn: 'oCUEBh',
          flareBarn: 'oiU',
          projectileBarn: 'ifHtPn',
          explosionBarn: 'cHefb',
          planeBarn: 'adx',
          airdropBarn: 'Ekq',
          deadBodyBarn: 'yRvzxj',
          lootBarn: 'yMJ',
          gas: 'iwzlN',
          uiManager: 'DqDK',
          ui2Manager: 'wHSmLW',
          emoteBarn: 'RSaBV',
          shotBarn: 'ZjvKUb',
          localId: 'jaIIK',
          activeId: 'ClgHB',
      });
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

      alias(game.map, 'obstaclePool', 'PxU');
      aliasMap(game.camera, {
          pos: 'JXy',
          zoom: 'sdArG',
          targetZoom: 'dDg',
          screenWidth: 'SUfX',
          screenHeight: 'NBo',
          pointToScreen: 'VbAOhd',
          screenToPoint: 'UhnJi',
      });
      alias(game.smokeBarn, 'smokePool', 'atf');
      if (game.smokeBarn && !('particles' in game.smokeBarn) && game.smokeBarn.atf) {
          Object.defineProperty(game.smokeBarn, 'particles', {
              configurable: true,
              get: () => game.smokeBarn.atf.qQqu,
          });
      }
      aliasMap(game.objectCreator, {
          idToObj: 'UijNDd',
          types: 'rbZrJ',
      });

      const pools = [
          game.map?.obstaclePool,
          game.playerBarn?.playerPool,
          game.smokeBarn?.smokePool,
      ];
      for (const pool of pools) {
          if (!pool) continue;
          alias(pool, 'pool', 'qQqu');
          exposeMPrefix(pool);
      }

      if (game.pixi && !('_ticker' in game.pixi)) {
          Object.defineProperty(game.pixi, '_ticker', {
              configurable: true,
              get: () => game.pixi.ticker,
          });
      }

      for (const player of game.playerBarn?.playerPool?.pool ?? []) adaptPlayer(player);
      for (const obstacle of game.map?.obstaclePool?.pool ?? []) exposeMPrefix(obstacle);
      for (const smoke of game.smokeBarn?.smokePool?.pool ?? []) exposeMPrefix(smoke);
  }

  unsafeWindow.installSurvevGptCompat = (game) => {
      adaptGameRuntime(game);
      const timer = setInterval(() => {
          if (!game.ws && !game.playerBarn) return;
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
  unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'discovering' };

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

  function requestText(url) {
      assertAllowedUrl(url, 'inspect game bundle');
      const extractText = (response) => {
          if (response.status && (response.status < 200 || response.status >= 300)) {
              throw new Error(`HTTP ${response.status} while inspecting ${url}`);
          }
          return response.responseText;
      };
      if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
          return GM.xmlHttpRequest({ url }).then(extractText);
      }
      if (typeof GM_xmlhttpRequest === 'function') {
          return new Promise((resolve, reject) => GM_xmlhttpRequest({
              url,
              onload: (response) => {
                  try {
                      resolve(extractText(response));
                  } catch (error) {
                      reject(error);
                  }
              },
              onerror: reject,
              ontimeout: reject,
          }));
      }
      throw new Error('[SurvevGPT] This userscript manager does not provide GM_xmlhttpRequest.');
  }

  async function createModuleScript() {
      if (typeof GM !== 'undefined' && typeof GM.addElement === 'function') {
          return GM.addElement(document.head, 'script', { type: 'module' });
      }
      if (typeof GM_addElement === 'function') {
          return GM_addElement(document.head, 'script', { type: 'module' });
      }
      const script = document.createElement('script');
      script.type = 'module';
      document.head.append(script);
      return script;
  }


  (async () => {
      const links = [
          ...Array.from(document.querySelectorAll('link[rel="modulepreload"][href]')),
          ...Array.from(document.querySelectorAll('script[type="module"][src]'))
      ];

      const candidateUrls = [...new Set(links
          .map((link) => link.src || link.href)
          .filter((url) => {
              try {
                  return new URL(url, location.href).pathname.endsWith('.js');
              } catch {
                  return false;
              }
          }))];
      const results = await Promise.allSettled(candidateUrls.map(async (url) => {
          const source = await requestText(url);
          const imports = [...source.matchAll(/from\s*["']([^"']+)["']/g)].map((match) => match[1]);
          return { url, source, imports };
      }));
      const assets = results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);
      const failures = results
          .map((result, index) => ({ result, url: candidateUrls[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, url }) => ({ url, error: String(result.reason) }));

      if (failures.length) {
          console.warn('[SurvevGPT] Some candidate bundles could not be inspected.', failures);
      }

      const sharedAsset = assets.find((asset) => asset.source.includes('explosion_frag'));
      const appAsset = assets.find((asset) =>
          asset !== sharedAsset
          && asset.imports.length >= 2
          && (asset.source.includes('sendMessage') || asset.source.includes('WebSocket'))
      ) ?? assets.filter((asset) => asset !== sharedAsset).sort((a, b) => b.source.length - a.source.length)[0];
      const importedNames = new Set([
          ...(appAsset?.imports ?? []),
          ...(sharedAsset?.imports ?? []),
      ].map((value) => value.split('/').pop()));
      const vendorAsset = assets.find((asset) =>
          asset !== appAsset
          && asset !== sharedAsset
          && importedNames.has(asset.url.split('/').pop())
      );

      if (!appAsset || !sharedAsset || !vendorAsset) {
          unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'classification-failed' };
          console.error('[SurvevGPT] Unable to classify game bundles.', assets.map((asset) => ({
              url: asset.url,
              size: asset.source.length,
              imports: asset.imports,
              definitions: asset.source.includes('explosion_frag'),
          })));
          return;
      }

      const originalAppURL = appAsset.url;
      const originalSharedURL = sharedAsset.url;
      const originalVendorURL = vendorAsset.url;
      unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = {
          stage: 'bundles-classified',
          app: originalAppURL,
          shared: originalSharedURL,
          vendor: originalVendorURL,
      };

      const modifiedVendorURL = URL.createObjectURL(new Blob([vendorAsset.source], {
          type: 'application/javascript',
      }));

      let modifiedSharedURL = null;
      let modifiedAppURL = null;
      if (originalSharedURL) {
          let scriptContent = sharedAsset.source;
          for (const specifier of sharedAsset.imports) {
              if (specifier.split('/').pop() === originalVendorURL.split('/').pop()) {
                  scriptContent = scriptContent.replaceAll(specifier, modifiedVendorURL);
              }
          }
          // console.log(scriptContent);

          const sharedScriptPatches = [
              {
                  name: 'bullets',
                  from: /(\w+)=\{bullet_mp5:\{type:([`'"])bullet\2,damage:/,
                  to: '$1=window.bullets={bullet_mp5:{type:$2bullet$2,damage:'
              },
              {
                  name: 'explosions',
                  from: /(\w+)=\{explosion_frag:\{type:([`'"])explosion\2,damage:/,
                  to: '$1=window.explosions={explosion_frag:{type:$2explosion$2,damage:'
              },
              {
                  name: 'guns',
                  from: /(\w+)=\{mp5:\{name:([`'"])MP5\2,type:([`'"])gun\3,/,
                  to: '$1=window.guns={mp5:{name:$2MP5$2,type:$3gun$3,'
              },
              {
                  name: 'throwable',
                  from: /(\w+)=\{frag:\{name:([`'"])Frag Grenade\2,type:([`'"])throwable\3,/,
                  to: '$1=window.throwable={frag:{name:$2Frag Grenade$2,type:$3throwable$3,'
              },
              {
                  name: 'objects',
                  from: /(\w+)=new (\w+)\([`'"]Game[`'"],(\w+),10\),(\w+)=new \2\([`'"]Map[`'"],(\w+),12\);function (\w+)\(/,
                  to: '$1=new $2(`Game`,$3,10),$4=new $2(`Map`,$5,12);window.gameObjectDefs=$1._defs;window.objects=$4._defs;function $6('
              }
          ];

          scriptContent = applyPatches(scriptContent, sharedScriptPatches, 'shared');

          const blob = new Blob([scriptContent], { type: 'application/javascript' });
          modifiedSharedURL = URL.createObjectURL(blob);
          console.log(modifiedSharedURL);
      }

      if (originalAppURL) {
          let scriptContent = appAsset.source;
          for (const specifier of appAsset.imports) {
              const basename = specifier.split('/').pop();
              if (basename === originalSharedURL.split('/').pop()) {
                  scriptContent = scriptContent.replaceAll(specifier, modifiedSharedURL);
              } else if (basename === originalVendorURL.split('/').pop()) {
                  scriptContent = scriptContent.replaceAll(specifier, modifiedVendorURL);
              }
          }
          // console.log(scriptContent);

          const appScriptPatches = [
              {
                  name: 'Map colorizing',
                  from: /(\w+)\.sort\(\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*\2\.zIdx\s*-\s*\3\.zIdx\s*\);/,
                  to: `$1.sort(($2, $3) => $2.zIdx - $3.zIdx);\nwindow.mapColorizing($1);`
              },
              // {
              //     name: 'pieTimerClass',
              //     from: '=24;',
              //     to: `=24;window.pieTimerClass = `
              // },
              {
                  name: 'Class definition with methods',
                  from: /(\w+)=24,(\w+)=class\{container=new (\w+);/,
                  to: '$1=24,$2=window.pieTimerClass=class{container=new $3;'
              },
              {
                  name: 'isMobile (basicDataInfo)',
                  from: /(\w+)\.isMobile\s*=\s*(\w+)\.mobile\s*\|\|\s*window\.mobile\s*,/,
                  to: `$1.isMobile = $2.mobile || window.mobile,window.basicDataInfo = $1,`
              },
              {
                  name: 'Game',
                  from: /this\.game=new (\w+)\(this\.pixi,this\.audioManager,this\.localization,this\.config,this\.input,this\.inputBinds,this\.inputBindUi,this\.ambience,this\.resourceManager,(\w+),(\w+)\)/,
                  to: 'this.game=window.game=window.installSurvevGptCompat(new $1(this.pixi,this.audioManager,this.localization,this.config,this.input,this.inputBinds,this.inputBindUi,this.ambience,this.resourceManager,$2,$3))'
              },
              {
                  name: 'Override gameControls',
                  from: /this\.(\w+)\((\w+)\.Input,(\w+),128\),this\.(\w+)=1,this\.(\w+)=\3/,
                  to: 'this._newGameControls=window.initGameControls($3),this.$1($2.Input,this._newGameControls,128),this.$4=1,this.$5=this._newGameControls'
              },
          ];

          scriptContent = applyPatches(scriptContent, appScriptPatches, 'app');

          // scriptContent += `alert('ja appjs');`;

          const blob = new Blob([scriptContent], { type: 'application/javascript' });
          modifiedAppURL = URL.createObjectURL(blob);
          console.log(modifiedAppURL);

          
      // }
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

      const appScript = await createModuleScript();
      appScript.onload = () => {
          unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'module-loaded' };
          console.log('Im injected appjs', appScript);

          // Восстанавливаем оригинальный addEventListener
          document.addEventListener = originalAddEventListener;

          // Искусственно вызываем все сохраненные обработчики
          isolatedHandlers.forEach((handler) => handler.call(document));
      };
      appScript.onerror = (event) => {
          document.addEventListener = originalAddEventListener;
          unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = {
              stage: 'module-load-failed',
              src: modifiedAppURL,
          };
          console.error('[SurvevGPT] Rewritten application module failed to load.', event);
      };
      unsafeWindow.__SURVEVGPT_INJECTION_STATUS__ = { stage: 'loading-module' };
      appScript.src = modifiedAppURL;
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
  };

  unsafeWindow.mapColorizing = map => {
      if (!state.isMapColorizingEnabled || !Array.isArray(map)) return;

      map.forEach(object => {
          const color = colors[object?.obj?.type];
          if (color === undefined || !Array.isArray(object.shapes)) return;

          object.shapes.forEach(shape => {
              if (shape) shape.color = color;
          });
      });
  };

  function getTeam(player) {
      const teamInfo = unsafeWindow.game?.playerBarn?.teamInfo;
      if (!player || !teamInfo) return undefined;
      return Object.keys(teamInfo).find(team => teamInfo[team]?.playerIds?.includes(player.__id));
  }

  function findWeap(player) {
      const weapType = player?.netData?.activeWeapon;
      return weapType && unsafeWindow.guns?.[weapType] ? unsafeWindow.guns[weapType] : null;
  }

  function findBullet(weapon) {
      return weapon ? unsafeWindow.bullets?.[weapon.bulletType] ?? null : null;
  }

  function aimBot() {

      if (!state.isAimBotEnabled) return;

      try {
          const game = unsafeWindow.game;
          const players = game?.playerBarn?.playerPool?.pool;
          const me = game?.activePlayer;

          if (!Array.isArray(players) || !me?.netData || !me?.pos || !game?.camera?.pointToScreen || !game?.input?.mousePos) return;

          const meTeam = getTeam(me);

          let enemy = null;
          let minDistanceToEnemyFromMouse = Infinity;
          
          if (state.focusedEnemy?.active && state.focusedEnemy.netData && !state.focusedEnemy.netData.dead) {
              enemy = state.focusedEnemy;
          }else {
              if (state.focusedEnemy){
                  state.focusedEnemy = null;
                  updateOverlay();
              }

              players.forEach((player) => {
                  // We miss inactive or dead players
                  if (!player?.active || !player.netData || player.netData.dead || !player.pos || (!state.isAimAtKnockedOutEnabled && player.downed) || me.__id === player.__id || me.layer !== player.layer || getTeam(player) == meTeam || state.friends.includes(player.nameText?._text)) return;
      
                  const screenPlayerPos = game.camera.pointToScreen({x: player.pos._x, y: player.pos._y});
                  // const distanceToEnemyFromMouse = Math.hypot(screenPlayerPos.x - unsafeWindow.game.input.mousePos._x, screenPlayerPos.y - unsafeWindow.game.input.mousePos._y);
                  const distanceToEnemyFromMouse = (screenPlayerPos.x - game.input.mousePos._x) ** 2 + (screenPlayerPos.y - game.input.mousePos._y) ** 2;
                  
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

              if (!predictedEnemyPos) {
                  unsafeWindow.lastAimPos = null;
                  aimbotDot.style.display = 'none';
                  return;
              }

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
      if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
          return unsafeWindow.game.camera.pointToScreen({x: enemyPos._x, y: enemyPos._y});
      }

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
          if (Math.abs(b) < 1e-6) {
              return unsafeWindow.game.camera.pointToScreen({x: enemyPos._x, y: enemyPos._y});
          }
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


      if (!Number.isFinite(t) || t < 0) {
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

          const game = unsafeWindow.game;
          const players = game?.playerBarn?.playerPool?.pool;
          const me = game?.activePlayer;
          if (!Array.isArray(players) || !me) return;
          const meTeam = getTeam(me);

          let enemy = null;
          let minDistanceToEnemyFromMouse = Infinity;

          players.forEach((player) => {
              // We miss inactive or dead players
              if (!player?.active || !player.netData || player.netData.dead || player.downed || !player.pos || me.__id === player.__id || getTeam(player) == meTeam) return;

              const screenPlayerPos = game.camera?.pointToScreen?.({x: player.pos._x, y: player.pos._y});
              if (!screenPlayerPos) return;
              const distanceToEnemyFromMouse = (screenPlayerPos.x - mouseX) ** 2 + (screenPlayerPos.y - mouseY) ** 2;

              if (distanceToEnemyFromMouse < minDistanceToEnemyFromMouse) {
                  minDistanceToEnemyFromMouse = distanceToEnemyFromMouse;
                  enemy = player;
              }
          });

          if (enemy) {
              const enemyName = enemy.nameText?._text;
              if (!enemyName) return;
              const enemyIndex = state.friends.indexOf(enemyName);
              if (~enemyIndex) {
                  state.friends.splice(enemyIndex, 1);
                  console.log(`Removed player with name ${enemyName} from friends.`);
              }else {
                  state.friends.push(enemyName);
                  console.log(`Added player with name ${enemyName} to friends.`);
              }
          }
      });
  }

  keybinds();

  function autoLoot(){
      const installMobileLootMode = (data) => {
          if (!data || data.__survevGptAutoLootInstalled) return;

          Object.defineProperty(data, '__survevGptAutoLootInstalled', {
              configurable: true,
              value: true,
          });

          for (const property of ['isMobile', 'useTouch']) {
              let currentValue = data[property];
              Object.defineProperty(data, property, {
                  configurable: true,
                  get() {
                      return state.isAutoLootEnabled ? true : currentValue;
                  },
                  set(value) {
                      currentValue = value;
                  },
              });
          }
      };

      let basicDataInfo = unsafeWindow.basicDataInfo;
      Object.defineProperty(unsafeWindow, 'basicDataInfo', {
          configurable: true,
          get () {
              return basicDataInfo;
          },
          set(value) {
              basicDataInfo = value;
              installMobileLootMode(value);
          }
      });

      installMobileLootMode(basicDataInfo);
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
      if (!gameControls) return gameControls;

      for (const command of inputs){
          const input = inputCommands[command];
          if (input != null) gameControls.addInput?.(input);
      }
      inputs = [];

      const game = unsafeWindow.game;
      const firing = Boolean(game?.touch?.shotDetected || game?.inputBinds?.isBindDown?.(inputCommands.Fire));

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
      if (gameControls.touchMoveActive && unsafeWindow.lastAimPos && gameControls.toMouseDir){
          // gameControls.toMouseDir
          gameControls.toMouseLen = 18;

          const atan = Math.atan2(
              unsafeWindow.lastAimPos.clientX - unsafeWindow.innerWidth / 2,
              unsafeWindow.lastAimPos.clientY - unsafeWindow.innerHeight / 2,
          ) - Math.PI / 2;

          if (firing && game?.activePlayer?.localData?.curWeapIdx !== 3) {
              gameControls.toMouseDir.x = Math.cos(atan);
              gameControls.toMouseDir.y = Math.sin(atan);
          }
      }

      // autoMelee
      if (firing && unsafeWindow.aimTouchMoveDir && gameControls.touchMoveDir) {
          if (unsafeWindow.aimTouchDistanceToEnemy < 4) gameControls.addInput?.(inputCommands.EquipMelee);
          gameControls.touchMoveActive = true;
          gameControls.touchMoveLen = 255;
          gameControls.touchMoveDir.x = unsafeWindow.aimTouchMoveDir.x;
          gameControls.touchMoveDir.y = unsafeWindow.aimTouchMoveDir.y;
      }

      return gameControls
  };

  function bumpFire(){
      const inputBinds = unsafeWindow.game?.inputBinds;
      const original = inputBinds?.isBindPressed;
      if (typeof original !== 'function' || original.__survevGptBumpFire) return;

      const wrapped = new Proxy(original, {
          apply( target, thisArgs, args ) {
              if (args[0] === inputCommands.Fire) {
                  return state.isBumpFireEnabled
                      ? Boolean(inputBinds.isBindDown?.(...args))
                      : Reflect.apply(target, thisArgs, args);
              }
              return Reflect.apply(target, thisArgs, args);
          }
      });
      Object.defineProperty(wrapped, '__survevGptBumpFire', { value: true });
      inputBinds.isBindPressed = wrapped;
  }

  let spinAngle = 0;
  const radius = 100; // The radius of the circle
  const spinSpeed = 37.5; // Rotation speed (increase for faster speed)
  function overrideMousePos() {
      const mousePos = unsafeWindow.game?.input?.mousePos;
      if (!mousePos || mousePos.__survevGptOverridden) return;

      let rawX = mousePos.x;
      let rawY = mousePos.y;
      Object.defineProperty(mousePos, '__survevGptOverridden', {
          configurable: true,
          value: true,
      });

      Object.defineProperty(mousePos, 'x', {
          configurable: true,
          get() {
              const game = unsafeWindow.game;
              const curWeapIdx = game?.activePlayer?.localData?.curWeapIdx;
              const firing = game?.touch?.shotDetected || game?.inputBinds?.isBindDown?.(inputCommands.Fire);
              const emoteOpen = game?.inputBinds?.isBindPressed?.(inputCommands.EmoteMenu) || game?.inputBinds?.isBindDown?.(inputCommands.EmoteMenu);
              if (firing && unsafeWindow.lastAimPos && curWeapIdx != null && curWeapIdx !== 3) {
                  return unsafeWindow.lastAimPos.clientX;
              }
              if (!firing && !emoteOpen && curWeapIdx != null && curWeapIdx !== 3 && state.isSpinBotEnabled) {
                  // SpinBot
                  spinAngle += spinSpeed;
                  return Math.cos(degreesToRadians(spinAngle)) * radius + unsafeWindow.innerWidth / 2;
              }
              return rawX;
          },
          set(value) {
              rawX = value;
          }
      });

      Object.defineProperty(mousePos, 'y', {
          configurable: true,
          get() {
              const game = unsafeWindow.game;
              const curWeapIdx = game?.activePlayer?.localData?.curWeapIdx;
              const firing = game?.touch?.shotDetected || game?.inputBinds?.isBindDown?.(inputCommands.Fire);
              const emoteOpen = game?.inputBinds?.isBindPressed?.(inputCommands.EmoteMenu) || game?.inputBinds?.isBindDown?.(inputCommands.EmoteMenu);
              if (firing && unsafeWindow.lastAimPos && curWeapIdx != null && curWeapIdx !== 3) {
                  return unsafeWindow.lastAimPos.clientY;
              }
              if (!firing && !emoteOpen && curWeapIdx != null && curWeapIdx !== 3 && state.isSpinBotEnabled) {
                  return Math.sin(degreesToRadians(spinAngle)) * radius + unsafeWindow.innerHeight / 2;
              }
              return rawY;
          },
          set(value) {
              rawY = value;
          }
      });

  }

  function degreesToRadians(degrees) {
      return degrees * (Math.PI / 180);
  }

  function betterZoom(){
      const camera = unsafeWindow.game.camera;
      if (!camera || camera.__survevGptZoomOverridden) return;

      Object.defineProperty(camera, '__survevGptZoomOverridden', {
          configurable: true,
          value: true,
      });

      Object.defineProperty(camera, 'zoom', {
          configurable: true,
          get() {
              const targetZoom = Number(this.targetZoom);
              const nativeZoom = Number(this.sdArG);
              const baseZoom = Number.isFinite(targetZoom) ? targetZoom : nativeZoom;
              return Math.max(baseZoom - (state.isZoomEnabled ? 0.45 : 0), 0.35);
          },
          set(value) {
              this.sdArG = value;
          }
      });
  }

  function smokeOpacity() {
      const particles = unsafeWindow.game?.smokeBarn?.particles;
      if (!Array.isArray(particles)) return;

      const adaptParticle = (particle) => {
          const sprite = particle?.sprite;
          if (!sprite || sprite.__survevGptSmokeOpacity) return;

          let nativeAlpha = sprite.alpha;
          Object.defineProperty(sprite, '__survevGptSmokeOpacity', { configurable: true, value: true });
          Object.defineProperty(sprite, 'alpha', {
              configurable: true,
              get() {
                  return state.isSmokeOpacityEnabled ? 0.12 : nativeAlpha;
              },
              set(value) {
                  nativeAlpha = value;
              },
          });
      };

      if (!particles.push.__survevGptSmokeOpacity) {
          const wrappedPush = new Proxy(particles.push, {
              apply(target, thisArgs, args) {
                  args.forEach(adaptParticle);
                  return Reflect.apply(target, thisArgs, args);
              },
          });
          Object.defineProperty(wrappedPush, '__survevGptSmokeOpacity', { value: true });
          particles.push = wrappedPush;
      }

      particles.forEach(adaptParticle);
  }

  function visibleNames() {
      const pool = unsafeWindow.game?.playerBarn?.playerPool?.pool;
      if (!Array.isArray(pool)) return;

      const adaptPlayerName = (player) => {
          const nameText = player?.nameText;
          if (!nameText || nameText.__survevGptVisibleNames) return;

          let nativeVisible = nameText.visible;
          Object.defineProperty(nameText, '__survevGptVisibleNames', { configurable: true, value: true });
          Object.defineProperty(nameText, 'visible', {
              configurable: true,
              get() {
                  if (!state.isVisibleNamesEnabled) return nativeVisible;
                  const meTeam = getTeam(unsafeWindow.game?.activePlayer);
                  const playerTeam = getTeam(player);
                  this.tint = playerTeam === meTeam ? BLUE : state.friends.includes(this._text) ? GREEN : RED;
                  if (this.style) this.style.fontSize = 40;
                  return true;
              },
              set(value) {
                  nativeVisible = value;
              },
          });
      };

      if (!pool.push.__survevGptVisibleNames) {
          const wrappedPush = new Proxy(pool.push, {
              apply(target, thisArgs, args) {
                  args.forEach(adaptPlayerName);
                  return Reflect.apply(target, thisArgs, args);
              },
          });
          Object.defineProperty(wrappedPush, '__survevGptVisibleNames', { value: true });
          pool.push = wrappedPush;
      }

      pool.forEach(adaptPlayerName);
  }

  function removeCeilings() {
      const texturePrototype = unsafeWindow.PIXI?.Texture?.prototype;
      if (!texturePrototype || texturePrototype.__survevGptCeilingFilter) return;

      Object.defineProperty(texturePrototype, '__survevGptCeilingFilter', {
          configurable: true,
          value: true,
      });

      Object.defineProperty(texturePrototype, 'textureCacheIds', {
          configurable: true,
          get() {
              return this.__survevGptTextureCacheIds;
          },
          set(value) {
              this.__survevGptTextureCacheIds = value;
              if (!Array.isArray(value) || value.__survevGptCeilingFilter) return;

              const texture = this;
              const wrappedPush = new Proxy(value.push, {
                  apply(target, thisArgs, args) {
                      for (const cacheId of args) {
                          if (typeof cacheId !== 'string') continue;
                          const isCeiling = cacheId.includes('ceiling')
                              && !cacheId.includes('map-building-container-ceiling-05');
                          if (!isCeiling && !cacheId.includes('map-snow-')) continue;
                          installVisibilityOverride(texture);
                      }
                      return Reflect.apply(target, thisArgs, args);
                  },
              });
              Object.defineProperty(value, '__survevGptCeilingFilter', { value: true });
              value.push = wrappedPush;
          },
      });
  }

  function installVisibilityOverride(texture) {
      if (texture.__survevGptVisibilityOverride) return;

      let nativeValid = texture.valid;
      Object.defineProperty(texture, '__survevGptVisibilityOverride', {
          configurable: true,
          value: true,
      });
      Object.defineProperty(texture, 'valid', {
          configurable: true,
          get() {
              return state.isXrayEnabled ? false : nativeValid;
          },
          set(value) {
              nativeValid = value;
          },
      });
  }

  let lastEspError = '';

  function esp(){
      const game = unsafeWindow.game;
      const pixi = game?.pixi;
      const me = game?.activePlayer;
      const players = game?.playerBarn?.playerPool?.pool;
      const Graphics = unsafeWindow.PIXI?.Graphics;

      // We check if there is an object of Pixi, otherwise we create a new
      if (!pixi || !me?.container || !me?.pos || !Array.isArray(players) || !Graphics) {
          // console.error("PIXI object not found in game.");
          return;
      }

      const meX = me.pos.x;
      const meY = me.pos.y;

      const meTeam = getTeam(me);
      
      try{

      // lineDrawer
      let lineDrawer = me.container.lineDrawer;
      try{lineDrawer?.clear();}
      catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
      if (state.isLineDrawerEnabled){

          if (!me.container.lineDrawer) {
              me.container.lineDrawer = new Graphics();
              me.container.addChild(me.container.lineDrawer);
              lineDrawer = me.container.lineDrawer;
          }
              
          // For each player
          players.forEach((player) => {
              // We miss inactive or dead players
              if (!player?.active || !player.netData || player.netData.dead || !player.pos || me.__id == player.__id) return;
      
              const playerX = player.pos.x;
              const playerY = player.pos.y;
      
              const playerTeam = getTeam(player);
      
              // We calculate the color of the line (for example, red for enemies)
              const lineColor = playerTeam === meTeam ? BLUE : state.friends.includes(player.nameText?._text) ? GREEN : me.layer === player.layer && (state.isAimAtKnockedOutEnabled || !player.downed) ? RED : WHITE;
      
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
      let nadeDrawer = me.container.nadeDrawer;
      try{nadeDrawer?.clear();}
      catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
      if (state.isNadeDrawerEnabled){
          if (!me.container.nadeDrawer) {
              me.container.nadeDrawer = new Graphics();
              me.container.addChild(me.container.nadeDrawer);
              nadeDrawer = me.container.nadeDrawer;
          }
      
          Object.values(game.objectCreator?.idToObj ?? {})
              .filter(obj => {
                  const isValid = ( obj.__type === 9 && obj.type !== "smoke" )
                      ||  (
                              obj.smokeEmitter &&
                              unsafeWindow.objects?.[obj.type]?.explosion);
                  return isValid;
              })
              .forEach(obj => {
                  const explosionType = unsafeWindow.throwable?.[obj.type]?.explosionType
                      || unsafeWindow.objects?.[obj.type]?.explosion;
                  const radius = unsafeWindow.explosions?.[explosionType]?.rad?.max;
                  if (!Number.isFinite(radius)) return;

                  if(obj.layer !== me.layer) {
                      nadeDrawer.beginFill(0xffffff, 0.3);
                  } else {
                      nadeDrawer.beginFill(0xff0000, 0.2);
                  }
                  nadeDrawer.drawCircle(
                      (obj.pos.x - meX) * 16,
                      (meY - obj.pos.y) * 16,
                      (radius + 1) * 16
                  );
                  nadeDrawer.endFill();
              });
      }

      // flashlightDrawer(laserDrawer)
      let laserDrawer = me.container.laserDrawer;
      try{laserDrawer?.clear();}
      catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
      if (state.isLaserDrawerEnabled) {
          const curWeapon = findWeap(me);
          const curBullet = findBullet(curWeapon);
          
          if ( !me.container.laserDrawer ) {
              me.container.laserDrawer = new Graphics();
              me.container.addChildAt(me.container.laserDrawer, 0);
              laserDrawer = me.container.laserDrawer;
          }
      
          function laserPointer(
              curBullet,
              curWeapon,
              acPlayer,
              color = 0x0000ff,
              opacity = 0.3,
          ) {
              const { pos: acPlayerPos, posOld: acPlayerPosOld } = acPlayer;
              if (!acPlayerPos) return;
      
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
                  const firing = Boolean(game.touch?.shotDetected || game.inputBinds?.isBindDown?.(inputCommands.Fire));
                  if (acPlayer == me && (!unsafeWindow.lastAimPos || !firing)){
                      //local rotation
                      atan = Math.atan2(
                          game.input?.mousePos?._y - unsafeWindow.innerHeight / 2,
                          game.input?.mousePos?._x - unsafeWindow.innerWidth / 2,
                      );
                  }else if(acPlayer == me && unsafeWindow.lastAimPos && firing){
                      const playerPointToScreen = game.camera.pointToScreen({x: acPlayer.pos._x, y: acPlayer.pos._y});
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
              .filter(player => player?.active && player.netData && !player.netData.dead && player.pos && me.__id !== player.__id && me.layer === player.layer && getTeam(player) != meTeam)
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
          const message = String(err?.stack || err);
          if (message !== lastEspError) {
              lastEspError = message;
              console.warn('[SurvevGPT] ESP frame skipped:', err);
          }
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
      const game = unsafeWindow.game;
      const localData = game?.activePlayer?.localData;
      if (!(game?.ws && localData?.curWeapIdx != null)) return;

      if (!state.isAutoSwitchEnabled) return;

      try {
      const curWeapIdx = localData.curWeapIdx;
      const weaps = localData.weapons;
      if (!Array.isArray(weaps) || !ammo[curWeapIdx]) return;
      const curWeap = weaps[curWeapIdx];
      if (!curWeap) return;
      const shouldSwitch = gun => {
          let s = false;
          try {
              s =
                  (unsafeWindow.guns?.[gun]?.fireMode === "single"
                  || unsafeWindow.guns?.[gun]?.fireMode === "burst")
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
          const firing = Boolean(game.touch?.shotDetected || game.inputBinds?.isBindDown?.(inputCommands.Fire));
          if ((curWeap.ammo < ammo[curWeapIdx].ammo || (ammo[curWeapIdx].ammo === 0 && curWeap.ammo > ammo[curWeapIdx].ammo && firing)) && shouldSwitch(curWeap.type) && curWeap.type == ammo[curWeapIdx].type) {
              ammo[curWeapIdx].lastShotDate = Date.now();
              console.log("Switching weapon due to ammo change");
              if ( otherWeap && shouldSwitch(otherWeap.type) && otherWeap.ammo && !state.isUseOneGunEnabled) { inputs.push(weapsEquip[otherWeapIdx]); } // && ammo[curWeapIdx].ammo !== 0
              else if ( otherWeap?.type ) { inputs.push(weapsEquip[otherWeapIdx]); inputs.push(weapsEquip[curWeapIdx]); }
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
      const obstacles = unsafeWindow.game?.map?.obstaclePool?.pool;
      if (!Array.isArray(obstacles)) return;

      obstacles.forEach(obstacle => {
          if (!obstacle?.sprite || typeof obstacle.type !== 'string') return;
          if (!['bush', 'tree', 'table', 'stairs'].some(substring => obstacle.type.includes(substring))) return;
          obstacle.sprite.alpha = state.isObstacleOpacityEnabled ? 0.45 : 1;
      });
  }

  let lastTime = Date.now();
  let showing = false;
  let timer = null;
  let timerGame = null;
  function grenadeTimer(){
      if (!state.isGrenadeTimerEnabled) {
          showing = false;
          if (timer) timer.destroy();
          timer = null;
          return;
      }
      const game = unsafeWindow.game;
      if (timerGame && timerGame !== game) {
          timer?.destroy?.();
          timer = null;
          showing = false;
      }
      timerGame = game;
      if (!(game?.ws && game?.activePlayer?.localData?.curWeapIdx != null && game?.activePlayer?.netData?.activeWeapon != null)) return;

      try{
      let elapsed = (Date.now() - lastTime) / 1000;
      const player = game.activePlayer;
      const activeItem = player.netData.activeWeapon;

      if (3 !== player.localData.curWeapIdx
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
          if (typeof unsafeWindow.pieTimerClass !== 'function' || !game.pixi?.stage?.addChild) return;
          timer = new unsafeWindow.pieTimerClass();
          game.pixi.stage.addChild(timer.container);
          timer.start("Grenade", 0, time);
          showing = true;
          lastTime = Date.now();
          return;
      }
      timer.update(elapsed - timer.elapsed, game.camera);
      }catch(err){
          console.error('grenadeTimer', err);
      }
  }

  const initializedTickers = new WeakSet();

  function initTicker(){
      const ticker = unsafeWindow.game?.pixi?._ticker;
      if (!ticker?.add || initializedTickers.has(ticker)) return;

      initializedTickers.add(ticker);
      ticker.add(esp);
      ticker.add(aimBot);
      ticker.add(autoSwitch);
      ticker.add(obstacleOpacity);
      ticker.add(grenadeTimer);

      if (unsafeWindow.GameMod?.startUpdateLoop) {
          ticker.add(unsafeWindow.GameMod.startUpdateLoop.bind(unsafeWindow.GameMod));
      }
  }

  let initGeneration = 0;
  function initGame() {
      const generation = ++initGeneration;
      console.log('init game...........');

      unsafeWindow.lastAimPos = null;
      unsafeWindow.aimTouchMoveDir = null;
      state.enemyAimBot = null;
      state.focusedEnemy = null;
      state.friends = [];
      state.lastFrames = {};

      const tasks = [
          {isApplied: false, condition: () => unsafeWindow.game?.input?.mousePos, action: overrideMousePos},
          {isApplied: false, condition: () => typeof unsafeWindow.game?.inputBinds?.isBindPressed === 'function', action: bumpFire},
          {isApplied: false, condition: () => unsafeWindow.game?.activePlayer?.localData, action: betterZoom},
          {isApplied: false, condition: () => typeof unsafeWindow.game?.smokeBarn?.particles?.push === 'function', action: smokeOpacity},
          {isApplied: false, condition: () => typeof unsafeWindow.game?.playerBarn?.playerPool?.pool?.push === 'function', action: visibleNames},
          {isApplied: false, condition: () => unsafeWindow.game?.pixi?._ticker, action: removeCeilings},
          {isApplied: false, condition: () => unsafeWindow.game?.pixi?._ticker && unsafeWindow.game?.activePlayer?.container && unsafeWindow.game?.activePlayer?.pos, action: initTicker},
      ];

      (function checkLocalData(){
          if (generation !== initGeneration) return;
          if (!unsafeWindow?.game?.ws) {
              setTimeout(checkLocalData, 50);
              return;
          }

          console.log('Checking local data');

          console.log(
              unsafeWindow.game?.activePlayer?.localData, 
              unsafeWindow.game?.map?.obstaclePool?.pool,
              unsafeWindow.game?.smokeBarn?.particles,
              unsafeWindow.game?.playerBarn?.playerPool?.pool
          );

          tasks.forEach(task => console.log(task.action, task.isApplied));
          
          tasks.forEach(task => {
              if (task.isApplied) return;
              try {
                  if (!task.condition()) return;
                  task.action();
                  task.isApplied = true;
              } catch (error) {
                  console.warn('SurvevGPT task is not ready yet:', task.action.name || 'anonymous', error);
              }
          });
          
          if (tasks.some(task => !task.isApplied)) setTimeout(checkLocalData, 50);
          else console.log('All functions applied, stopping loop.');
      })();

      updateOverlay();
  }

  installNavigationGuard();


  // init game every play start
  function bootLoader(){
      let currentGame = unsafeWindow.game;
      Object.defineProperty(unsafeWindow, 'game', {
          configurable: true,
          get () {
              return currentGame;
          },
          set(value) {
              if (value === currentGame) return;
              currentGame = value;
              if (!value) return;
              initGame();
          }
      });

      if (currentGame) initGame();
  }

  bootLoader();

  const init = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: 'Module' }));

})();
