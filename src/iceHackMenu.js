import { state } from './vars.js';
import { updateOverlay } from './overlay.js';
import { researchActions } from './researchActions.js';

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
    <p>These affect only matches authorized by Trusted URLs. Destructive actions require confirmation.</p>
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
        if (destructive && !confirm(`${label} may terminate the current trusted match. Continue?`)) return;
        try {
            const result = researchActions[action]();
            root.querySelector('footer').textContent = result || `${label} sent to the trusted match.`;
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

export function updateButtonColors() {
    root.querySelectorAll('[data-state]').forEach((input) => {
        input.checked = Boolean(state[input.dataset.state]);
    });
    root.classList.toggle('is-open', state.isMenuOpen);
}

export function toggleMenu(force) {
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
        : `${status.length}/${status.length} client patches applied · Trusted URLs enforced`;
}, 1000);
