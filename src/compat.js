const adapted = new WeakSet();

function alias(target, publicName, internalName) {
    if (!target || publicName in target || !(internalName in target)) return;
    Object.defineProperty(target, publicName, {
        configurable: true,
        get() {
            return this[internalName];
        },
        set(value) {
            this[internalName] = value;
        },
    });
}

function exposeMPrefix(target) {
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) return target;
    if (adapted.has(target)) return target;
    adapted.add(target);

    let cursor = target;
    while (cursor && cursor !== Object.prototype) {
        for (const name of Object.getOwnPropertyNames(cursor)) {
            if (!name.startsWith('m_') || name.length <= 2) continue;
            alias(target, name.slice(2), name);
        }
        cursor = Object.getPrototypeOf(cursor);
    }
    return target;
}

function adaptPlayer(player) {
    exposeMPrefix(player);
    exposeMPrefix(player?.m_netData);
    exposeMPrefix(player?.m_localData);
}

export function adaptGameRuntime(game) {
    exposeMPrefix(game);
    [
        game.m_camera,
        game.m_input,
        game.m_inputBinds,
        game.m_touch,
        game.m_map,
        game.m_playerBarn,
        game.m_smokeBarn,
        game.m_objectCreator,
    ].forEach(exposeMPrefix);

    exposeMPrefix(game.m_map?.m_obstaclePool);
    exposeMPrefix(game.m_playerBarn?.playerPool);

    if (game.m_pixi && !('_ticker' in game.m_pixi)) {
        Object.defineProperty(game.m_pixi, '_ticker', {
            configurable: true,
            get: () => game.m_pixi.ticker,
        });
    }

    for (const player of game.m_playerBarn?.playerPool?.m_pool ?? []) adaptPlayer(player);
    for (const obstacle of game.m_map?.m_obstaclePool?.m_pool ?? []) exposeMPrefix(obstacle);
    for (const smoke of game.m_smokeBarn?.m_particles ?? []) exposeMPrefix(smoke);
}

unsafeWindow.installSurvevGptCompat = (game) => {
    adaptGameRuntime(game);
    const timer = setInterval(() => {
        if (!game.m_ws && !game.m_playerBarn) return;
        adaptGameRuntime(game);
    }, 250);
    unsafeWindow.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
    return game;
};

