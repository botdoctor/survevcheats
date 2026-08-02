import { inputCommands } from "../overrideInputs.js";
import { state } from "../vars.js";


export function bumpFire(){
    unsafeWindow.game.inputBinds.isBindPressed = new Proxy( unsafeWindow.game.inputBinds.isBindPressed, {
        apply( target, thisArgs, args ) {
            if (args[0] === inputCommands.Fire) {
                return state.isBumpFireEnabled
                    ? unsafeWindow.game.inputBinds.isBindDown(...args)
                    : Reflect.apply(...arguments);
            }
            return Reflect.apply( ...arguments );
        }
    });
}
