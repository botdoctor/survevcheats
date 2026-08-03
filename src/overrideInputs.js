import { state } from './vars.js';

export const inputCommands = {
    Cancel: 6,
    Count: 36,
    CycleUIMode: 30,
    EmoteMenu: 31,
    EquipFragGrenade: 15,
    EquipLastWeap: 19,
    EquipMelee: 13,
    EquipNextScope: 22,
    EquipNextWeap: 17,
    EquipOtherGun: 20,
    EquipPrevScope: 21,
    EquipPrevWeap: 18,
    EquipPrimary: 11,
    EquipSecondary: 12,
    EquipSmokeGrenade: 16,
    EquipThrowable: 14,
    Fire: 4,
    Fullscreen: 33,
    HideUI: 34,
    Interact: 7,
    Loot: 10,
    MoveDown: 3,
    MoveLeft: 0,
    MoveRight: 1,
    MoveUp: 2,
    Reload: 5,
    Revive: 8,
    StowWeapons: 27,
    SwapWeapSlots: 28,
    TeamPingMenu: 32,
    TeamPingSingle: 35,
    ToggleMap: 29,
    Use: 9,
    UseBandage: 23,
    UseHealthKit: 24,
    UsePainkiller: 26,
    UseSoda: 25,
};

export let inputs = [];
let portraitLastFlip = 0;
let portraitValue = false;
unsafeWindow.initGameControls = function(gameControls){
    if (!gameControls) return gameControls;

    for (const command of inputs){
        const input = inputCommands[command];
        if (input != null) gameControls.addInput?.(input);
    }
    inputs = [];

    const game = unsafeWindow.game;
    const firing = Boolean(game?.touch?.shotDetected || game?.inputBinds?.isBindDown?.(inputCommands.Fire));

    if (state.isMovementAccuracyEnabled && (gameControls.shootStart || gameControls.shootHold)) {
        gameControls.moveLeft = false;
        gameControls.moveRight = false;
        gameControls.moveUp = false;
        gameControls.moveDown = false;
        gameControls.touchMoveActive = false;
    }

    if (state.isPortraitCullingEnabled) {
        const now = performance.now();
        if (now - portraitLastFlip >= 550) {
            portraitValue = !portraitValue;
            portraitLastFlip = now;
        }
        gameControls.portrait = portraitValue;
    }

    // mobile aimbot
    if (gameControls.touchMoveActive && unsafeWindow.lastAimPos && gameControls.toMouseDir){
        // gameControls.toMouseDir
        gameControls.toMouseLen = 18;

        const atan = Math.atan2(
            unsafeWindow.lastAimPos.clientX - unsafeWindow.innerWidth / 2,
            unsafeWindow.lastAimPos.clientY - unsafeWindow.innerHeight / 2,
        ) - Math.PI / 2;

        if (firing && game?.activePlayer?.localData?.curWeapIdx !== 3) {
            gameControls.toMouseDir.x = Math.cos(atan);
            gameControls.toMouseDir.y = Math.sin(atan);
        }
    }

    // autoMelee
    if (firing && unsafeWindow.aimTouchMoveDir && gameControls.touchMoveDir && game?.activePlayer?.localData?.curWeapIdx !== 3) {
        if (unsafeWindow.aimTouchDistanceToEnemy < 4) gameControls.addInput?.(inputCommands.EquipMelee);
        gameControls.touchMoveActive = true;
        gameControls.touchMoveLen = 255;
        gameControls.touchMoveDir.x = unsafeWindow.aimTouchMoveDir.x;
        gameControls.touchMoveDir.y = unsafeWindow.aimTouchMoveDir.y;
    }

    return gameControls
}
