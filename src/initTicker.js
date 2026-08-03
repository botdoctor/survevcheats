import { esp } from './plugins/esp.js';
import { aimBot } from './plugins/aimbot.js';
import { autoSwitch } from './plugins/autoSwitch.js';
import { obstacleOpacity } from './plugins/obstacleOpacity.js';
import { grenadeTimer } from './plugins/grenadeTimer.js';

const initializedTickers = new WeakSet();

export function initTicker(){
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
