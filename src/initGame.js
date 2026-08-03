import { updateOverlay  } from './overlay.js';
import { bumpFire } from './plugins/bumpFire.js';
import { overrideMousePos } from './overrideMousePos.js';
import { betterZoom } from './plugins/betterZoom.js';
import { smokeOpacity } from './plugins/smokeOpacity.js';
import { visibleNames } from './plugins/visibleNames.js';
import { removeCeilings } from './plugins/removeCeilings.js';
import { initTicker } from './initTicker.js';
import { state } from './vars.js';


let initGeneration = 0;
export function initGame() {
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

        console.log('Checking local data')

        console.log(
            unsafeWindow.game?.activePlayer?.localData, 
            unsafeWindow.game?.map?.obstaclePool?.pool,
            unsafeWindow.game?.smokeBarn?.particles,
            unsafeWindow.game?.playerBarn?.playerPool?.pool
        );

        tasks.forEach(task => console.log(task.action, task.isApplied))
        
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
