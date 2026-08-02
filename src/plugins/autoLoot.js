import { state } from '../vars.js';

function autoLoot(){
    Object.defineProperty(unsafeWindow, 'basicDataInfo', {
        get () {
            return this._basicDataInfo;
        },
        set(value) {
            this._basicDataInfo = value;
            
            if (!value) return;
            
            Object.defineProperty(unsafeWindow.basicDataInfo, 'isMobile', {
                get () {
                    return state.isAutoLootEnabled ? true : this._isMobile;
                },
                set(value) {
                    this._isMobile = value;
                }
            });
            
            Object.defineProperty(unsafeWindow.basicDataInfo, 'useTouch', {
                get () {
                    return state.isAutoLootEnabled ? true : this._useTouch;
                },
                set(value) {
                    this._useTouch = value;
                }
            });
            
        }
    });
}

autoLoot();
