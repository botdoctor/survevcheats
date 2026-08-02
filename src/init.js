import { assertLocalDevMode } from './localDevGuard.js';
import { installNavigationGuard } from './urlPolicy.js';

// This must remain the first runtime action. No game or DOM hooks are installed
// until the target has passed the local-development check.
assertLocalDevMode();
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
import './plugins/removeCeilings.js';
import './plugins/autoLoot.js';
import { initGame } from './initGame.js';
import './overrideInputs.js';


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
