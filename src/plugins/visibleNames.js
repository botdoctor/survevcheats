import { getTeam } from '../utils.js';
import { state } from '../vars.js';
import { BLUE, RED, GREEN } from '../constants.js';

export function visibleNames() {
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
