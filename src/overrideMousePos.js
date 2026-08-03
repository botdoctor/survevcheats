import { state } from './vars.js';
import { inputCommands } from './overrideInputs.js';


let spinAngle = 0;
const radius = 100; // The radius of the circle
const spinSpeed = 37.5; // Rotation speed (increase for faster speed)
export function overrideMousePos() {
    const mousePos = unsafeWindow.game?.input?.mousePos;
    if (!mousePos || mousePos.__survevGptOverridden) return;

    let rawX = mousePos.x;
    let rawY = mousePos.y;
    Object.defineProperties(mousePos, {
        __survevGptRawX: {
            configurable: true,
            get: () => rawX,
        },
        __survevGptRawY: {
            configurable: true,
            get: () => rawY,
        },
    });
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
