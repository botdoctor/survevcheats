import { state } from '../vars.js';
import { inputs, inputCommands } from '../overrideInputs.js';


const ammo = [
    {
        name: "",
        ammo: null,
        lastShotDate: Date.now()
    },
    {
        name: "",
        ammo: null,
        lastShotDate: Date.now()
    },
    {
        name: "",
        ammo: null,
    },
    {
        name: "",
        ammo: null,
    },
]
export function autoSwitch(){
    const game = unsafeWindow.game;
    const localData = game?.activePlayer?.localData;
    if (!(game?.ws && localData?.curWeapIdx != null)) return;

    if (!state.isAutoSwitchEnabled) return;

    try {
    const curWeapIdx = localData.curWeapIdx;
    const weaps = localData.weapons;
    if (!Array.isArray(weaps) || !ammo[curWeapIdx]) return;
    const curWeap = weaps[curWeapIdx];
    if (!curWeap) return;
    const shouldSwitch = gun => {
        let s = false;
        try {
            s =
                (unsafeWindow.guns?.[gun]?.fireMode === "single"
                || unsafeWindow.guns?.[gun]?.fireMode === "burst")
                && unsafeWindow.guns[gun].fireDelay >= 0.45;
        }
        catch (e) {
        }
        return s;
    }
    const weapsEquip = ['EquipPrimary', 'EquipSecondary']
    if(curWeap.ammo !== ammo[curWeapIdx].ammo) {
        const otherWeapIdx = (curWeapIdx == 0) ? 1 : 0
        const otherWeap = weaps[otherWeapIdx]
        const firing = Boolean(game.touch?.shotDetected || game.inputBinds?.isBindDown?.(inputCommands.Fire));
        if ((curWeap.ammo < ammo[curWeapIdx].ammo || (ammo[curWeapIdx].ammo === 0 && curWeap.ammo > ammo[curWeapIdx].ammo && firing)) && shouldSwitch(curWeap.type) && curWeap.type == ammo[curWeapIdx].type) {
            ammo[curWeapIdx].lastShotDate = Date.now();
            console.log("Switching weapon due to ammo change");
            if ( otherWeap && shouldSwitch(otherWeap.type) && otherWeap.ammo && !state.isUseOneGunEnabled) { inputs.push(weapsEquip[otherWeapIdx]); } // && ammo[curWeapIdx].ammo !== 0
            else if ( otherWeap?.type ) { inputs.push(weapsEquip[otherWeapIdx]); inputs.push(weapsEquip[curWeapIdx]); }
            else { inputs.push('EquipMelee'); inputs.push(weapsEquip[curWeapIdx]); }
        }
        ammo[curWeapIdx].ammo = curWeap.ammo
        ammo[curWeapIdx].type = curWeap.type
    }
    }catch(err){
        console.error('autoswitch', err)
    }
}
