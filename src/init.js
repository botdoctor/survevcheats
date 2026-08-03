import { installNavigationGuard } from './urlPolicy.js';

installNavigationGuard();

import './iceHackMenu.js';
import './compat.js';
import './plugins/alguienClient.js';
import './overlay.js';
import './injecting.js';
import './plugins/gameOptimization.js';
import './styles.js';
import './plugins/mapColorizing.js';
import './plugins/keybinds.js';
import './plugins/autoLoot.js';
import { initGame } from './initGame.js';
import './overrideInputs.js';


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
