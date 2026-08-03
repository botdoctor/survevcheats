import { state } from '../vars.js';

export function obstacleOpacity(){
    const obstacles = unsafeWindow.game?.map?.obstaclePool?.pool;
    if (!Array.isArray(obstacles)) return;

    obstacles.forEach(obstacle => {
        if (!obstacle?.sprite || typeof obstacle.type !== 'string') return;
        if (!['bush', 'tree', 'table', 'stairs'].some(substring => obstacle.type.includes(substring))) return;
        obstacle.sprite.alpha = state.isObstacleOpacityEnabled ? 0.45 : 1;
    });
}
