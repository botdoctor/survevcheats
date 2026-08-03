import { state } from '../vars.js';
import { aimBotToggle, meleeAttackToggle } from './aimbot.js';
import { updateOverlay } from '../overlay.js';
import { getTeam } from '../utils.js';
import { updateButtonColors } from '../iceHackMenu.js'; // Импортируйте функцию обновления цветов кнопок



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
                }else{
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
    
        event.stopImmediatePropagation()
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
