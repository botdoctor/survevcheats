import { inputCommands } from "../overrideInputs.js";
import { state } from "../vars.js";


export function bumpFire(){
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
