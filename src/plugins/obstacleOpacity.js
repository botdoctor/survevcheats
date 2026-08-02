import { state } from '../vars.js';

export function obstacleOpacity(){
    unsafeWindow.game.map.obstaclePool.pool.forEach(obstacle => {
        if (!['bush', 'tree', 'table', 'stairs'].some(substring => obstacle.type.includes(substring))) return;
        obstacle.sprite.alpha = state.isObstacleOpacityEnabled ? 0.45 : 1;
    });
}
