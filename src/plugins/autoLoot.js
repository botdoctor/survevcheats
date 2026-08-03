import { state } from '../vars.js';

function autoLoot(){
    const installMobileLootMode = (data) => {
        if (!data || data.__survevGptAutoLootInstalled) return;

        Object.defineProperty(data, '__survevGptAutoLootInstalled', {
            configurable: true,
            value: true,
        });

        for (const property of ['isMobile', 'useTouch']) {
            let currentValue = data[property];
            Object.defineProperty(data, property, {
                configurable: true,
                get() {
                    return state.isAutoLootEnabled ? true : currentValue;
                },
                set(value) {
                    currentValue = value;
                },
            });
        }
    };

    let basicDataInfo = unsafeWindow.basicDataInfo;
    Object.defineProperty(unsafeWindow, 'basicDataInfo', {
        configurable: true,
        get () {
            return basicDataInfo;
        },
        set(value) {
            basicDataInfo = value;
            installMobileLootMode(value);
        }
    });

    installMobileLootMode(basicDataInfo);
}

autoLoot();
