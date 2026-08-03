import { getTeam } from '../utils.js';
import { state } from '../vars.js';
import { RED, GREEN, BLUE, WHITE } from '../constants.js';
import { findBullet, findWeap } from '../utils.js';
import { inputCommands } from '../overrideInputs.js';

let lastEspError = '';

export function esp(){
    const game = unsafeWindow.game;
    const pixi = game?.pixi;
    const me = game?.activePlayer;
    const players = game?.playerBarn?.playerPool?.pool;
    const Graphics = unsafeWindow.PIXI?.Graphics;

    // We check if there is an object of Pixi, otherwise we create a new
    if (!pixi || !me?.container || !me?.pos || !Array.isArray(players) || !Graphics) {
        // console.error("PIXI object not found in game.");
        return;
    }

    const meX = me.pos.x;
    const meY = me.pos.y;

    const meTeam = getTeam(me);
    
    try{

    // lineDrawer
    let lineDrawer = me.container.lineDrawer;
    try{lineDrawer?.clear()}
    catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
    if (state.isLineDrawerEnabled){

        if (!me.container.lineDrawer) {
            me.container.lineDrawer = new Graphics();
            me.container.addChild(me.container.lineDrawer);
            lineDrawer = me.container.lineDrawer;
        }
            
        // For each player
        players.forEach((player) => {
            // We miss inactive or dead players
            if (!player?.active || !player.netData || player.netData.dead || !player.pos || me.__id == player.__id) return;
    
            const playerX = player.pos.x;
            const playerY = player.pos.y;
    
            const playerTeam = getTeam(player);
    
            // We calculate the color of the line (for example, red for enemies)
            const lineColor = playerTeam === meTeam ? BLUE : state.friends.includes(player.nameText?._text) ? GREEN : me.layer === player.layer && (state.isAimAtKnockedOutEnabled || !player.downed) ? RED : WHITE;
    
            // We draw a line from the current player to another player
            lineDrawer.lineStyle(2, lineColor, 1);
            lineDrawer.moveTo(0, 0); // Container Container Center
            lineDrawer.lineTo(
                (playerX - meX) * 16,
                (meY - playerY) * 16
            );
        });
    }

    // nadeDrawer
    let nadeDrawer = me.container.nadeDrawer;
    try{nadeDrawer?.clear()}
    catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
    if (state.isNadeDrawerEnabled){
        if (!me.container.nadeDrawer) {
            me.container.nadeDrawer = new Graphics();
            me.container.addChild(me.container.nadeDrawer);
            nadeDrawer = me.container.nadeDrawer;
        }
    
        Object.values(game.objectCreator?.idToObj ?? {})
            .filter(obj => {
                const isValid = ( obj.__type === 9 && obj.type !== "smoke" )
                    ||  (
                            obj.smokeEmitter &&
                            unsafeWindow.objects?.[obj.type]?.explosion);
                return isValid;
            })
            .forEach(obj => {
                const explosionType = unsafeWindow.throwable?.[obj.type]?.explosionType
                    || unsafeWindow.objects?.[obj.type]?.explosion;
                const radius = unsafeWindow.explosions?.[explosionType]?.rad?.max;
                if (!Number.isFinite(radius)) return;

                if(obj.layer !== me.layer) {
                    nadeDrawer.beginFill(0xffffff, 0.3);
                } else {
                    nadeDrawer.beginFill(0xff0000, 0.2);
                }
                nadeDrawer.drawCircle(
                    (obj.pos.x - meX) * 16,
                    (meY - obj.pos.y) * 16,
                    (radius + 1) * 16
                );
                nadeDrawer.endFill();
            });
    }

    // flashlightDrawer(laserDrawer)
    let laserDrawer = me.container.laserDrawer;
    try{laserDrawer?.clear()}
    catch{if(!unsafeWindow.game?.ws || unsafeWindow.game?.activePlayer?.netData?.dead) return;}
    if (state.isLaserDrawerEnabled) {
        const curWeapon = findWeap(me);
        const curBullet = findBullet(curWeapon);
        
        if ( !me.container.laserDrawer ) {
            me.container.laserDrawer = new Graphics();
            me.container.addChildAt(me.container.laserDrawer, 0);
            laserDrawer = me.container.laserDrawer;
        }
    
        function laserPointer(
            curBullet,
            curWeapon,
            acPlayer,
            color = 0x0000ff,
            opacity = 0.3,
        ) {
            const { pos: acPlayerPos, posOld: acPlayerPosOld } = acPlayer;
            if (!acPlayerPos) return;
    
            const dateNow = performance.now();
    
            if ( !(acPlayer.__id in state.lastFrames) ) state.lastFrames[acPlayer.__id] = [];
            state.lastFrames[acPlayer.__id].push([dateNow, { ...acPlayerPos }]);
    
            if (state.lastFrames[acPlayer.__id].length < 30) return;
    
            if (state.lastFrames[acPlayer.__id].length > 30){
                state.lastFrames[acPlayer.__id].shift();
            }
    
            const deltaTime = (dateNow - state.lastFrames[acPlayer.__id][0][0]) / 1000; // Time since last frame in seconds
    
            const acPlayerVelocity = {
                x: (acPlayerPos._x - state.lastFrames[acPlayer.__id][0][1]._x) / deltaTime,
                y: (acPlayerPos._y - state.lastFrames[acPlayer.__id][0][1]._y) / deltaTime,
            };
    
            let lasic = {};
        
            let isMoving = !!(acPlayerVelocity.x || acPlayerVelocity.y);
        
            if(curBullet) {
                lasic.active = true;
                lasic.range = curBullet.distance * 16.25;
                let atan;
                const firing = Boolean(game.touch?.shotDetected || game.inputBinds?.isBindDown?.(inputCommands.Fire));
                if (acPlayer == me && (!unsafeWindow.lastAimPos || !firing)){
                    //local rotation
                    const mousePos = game.input?.mousePos;
                    const mouseX = mousePos?.__survevGptRawX ?? mousePos?.x;
                    const mouseY = mousePos?.__survevGptRawY ?? mousePos?.y;
                    atan = Math.atan2(
                        mouseY - unsafeWindow.innerHeight / 2,
                        mouseX - unsafeWindow.innerWidth / 2,
                    );
                }else if(acPlayer == me && unsafeWindow.lastAimPos && firing){
                    const playerPointToScreen = game.camera.pointToScreen({x: acPlayer.pos._x, y: acPlayer.pos._y})
                    atan = Math.atan2(
                        playerPointToScreen.y - unsafeWindow.lastAimPos.clientY,
                        playerPointToScreen.x - unsafeWindow.lastAimPos.clientX
                    ) 
                    -
                    Math.PI;
                }else{
                    atan = Math.atan2(
                        acPlayer.dir.x,
                        acPlayer.dir.y
                    ) 
                    -
                    Math.PI / 2;
                }
                lasic.direction = atan;
                lasic.angle =
                    ((curWeapon.shotSpread +
                        (isMoving ? curWeapon.moveSpread : 0)) *
                        0.01745329252) /
                    2;
            } else {
                lasic.active = false;
            }
        
            if(!lasic.active) {
                return;
            }
    
            const center = {
                x: (acPlayerPos._x - me.pos._x) * 16,
                y: (me.pos._y - acPlayerPos._y) * 16,
            };
            const radius = lasic.range;
            let angleFrom = lasic.direction - lasic.angle;
            let angleTo = lasic.direction + lasic.angle;
            angleFrom =
                angleFrom > Math.PI * 2
                    ? angleFrom - Math.PI * 2
                    : angleFrom < 0
                    ? angleFrom + Math.PI * 2
                    : angleFrom;
            angleTo =
                angleTo > Math.PI * 2
                    ? angleTo - Math.PI * 2
                    : angleTo < 0
                    ? angleTo + Math.PI * 2
                    : angleTo;
            laserDrawer.beginFill(color, opacity);
            laserDrawer.moveTo(center.x, center.y);
            laserDrawer.arc(center.x, center.y, radius, angleFrom, angleTo);
            laserDrawer.lineTo(center.x, center.y);
            laserDrawer.endFill();
        }
        
        
        laserPointer(
            curBullet,
            curWeapon,
            me,
        );
        
        players
            .filter(player => player?.active && player.netData && !player.netData.dead && player.pos && me.__id !== player.__id && me.layer === player.layer && getTeam(player) != meTeam)
            .forEach(enemy => {
                const enemyWeapon = findWeap(enemy);
                laserPointer(
                    findBullet(enemyWeapon),
                    enemyWeapon,
                    enemy,
                    "0",
                    0.2,
                )
            });
    };

    }catch(err){
        const message = String(err?.stack || err);
        if (message !== lastEspError) {
            lastEspError = message;
            console.warn('[SurvevGPT] ESP frame skipped:', err);
        }
    }
}
