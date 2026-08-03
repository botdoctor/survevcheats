let lastTime = Date.now();
let showing = false;
let timer = null;
let timerGame = null;
export function grenadeTimer(){
    if (!state.isGrenadeTimerEnabled) {
        showing = false;
        if (timer) timer.destroy();
        timer = null;
        return;
    }
    const game = unsafeWindow.game;
    if (timerGame && timerGame !== game) {
        timer?.destroy?.();
        timer = null;
        showing = false;
    }
    timerGame = game;
    if (!(game?.ws && game?.activePlayer?.localData?.curWeapIdx != null && game?.activePlayer?.netData?.activeWeapon != null)) return;

    try{
    let elapsed = (Date.now() - lastTime) / 1000;
    const player = game.activePlayer;
    const activeItem = player.netData.activeWeapon;

    if (3 !== player.localData.curWeapIdx
        || player.throwableState !== "cook"
        || (!activeItem.includes('frag') && !activeItem.includes('mirv') && !activeItem.includes('martyr_nade'))
    )
        return (
            (showing = false),
            timer && timer.destroy(),
            (timer = false)
        );
    const time = 4;

    if(elapsed > time) {
        showing = false;
    }
    if(!showing) {
        if(timer) {
            timer.destroy();
        }
        if (typeof unsafeWindow.pieTimerClass !== 'function' || !game.pixi?.stage?.addChild) return;
        timer = new unsafeWindow.pieTimerClass();
        game.pixi.stage.addChild(timer.container);
        timer.start("Grenade", 0, time);
        showing = true;
        lastTime = Date.now();
        return;
    }
    timer.update(elapsed - timer.elapsed, game.camera);
    }catch(err){
        console.error('grenadeTimer', err);
    }
}
import { state } from '../vars.js';
