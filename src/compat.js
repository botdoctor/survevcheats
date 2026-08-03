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

function aliasMap(target, aliases) {
    for (const [publicName, internalName] of Object.entries(aliases)) {
        alias(target, publicName, internalName);
    }
}

function adaptVector(vector) {
    if (!vector || typeof vector !== 'object') return;
    alias(vector, '_x', 'x');
    alias(vector, '_y', 'y');
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
    aliasMap(player, {
        netData: 'GATSOq',
        localData: 'SujaN',
        pos: 'JXy',
        posOld: 'ZtMf',
        dir: 'SFg',
        visualPos: 'WlKQJ',
    });
    aliasMap(player?.GATSOq, {
        pos: 'JXy',
        dir: 'SFg',
        activeWeapon: 'kgr',
        dead: 'zTJbIl',
        downed: 'xTH',
        role: 'RyR',
    });
    aliasMap(player?.SujaN, {
        health: 'IzYNkh',
        curWeapIdx: 'VCiQ',
        inventory: 'buyn',
        weapons: 'qlyu',
    });
    [player?.JXy, player?.ZtMf, player?.WlKQJ, player?.SFg, player?.GATSOq?.JXy, player?.GATSOq?.SFg]
        .forEach(adaptVector);
    exposeMPrefix(player);
    exposeMPrefix(player?.m_netData);
    exposeMPrefix(player?.m_localData);
}

export function adaptGameRuntime(game) {
    aliasMap(game, {
        pixi: 'nHb',
        audioManager: 'GHBZo',
        localization: 'PZa',
        config: 'RPY',
        input: 'JiM',
        inputBinds: 'KEC',
        resourceManager: 'qZc',
        ws: 'dYkZo',
        camera: 'tGah',
        map: 'TFlxX',
        playerBarn: 'uhx',
        smokeBarn: 'Hhdj',
        objectCreator: 'kbsoh',
        activePlayer: 'iGQ',
        sendMessage: 'RIZTQZ',
        prevInputMsg: 'KkQ',
        spectating: 'fvVFy',
        touch: 'sqB',
        renderer: 'Pvi',
        particleBarn: 'UDzww',
        decalBarn: 'SfSEk',
        bulletBarn: 'oCUEBh',
        flareBarn: 'oiU',
        projectileBarn: 'ifHtPn',
        explosionBarn: 'cHefb',
        planeBarn: 'adx',
        airdropBarn: 'Ekq',
        deadBodyBarn: 'yRvzxj',
        lootBarn: 'yMJ',
        gas: 'iwzlN',
        uiManager: 'DqDK',
        ui2Manager: 'wHSmLW',
        emoteBarn: 'RSaBV',
        shotBarn: 'ZjvKUb',
        localId: 'jaIIK',
        activeId: 'ClgHB',
    });
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

    alias(game.map, 'obstaclePool', 'PxU');
    aliasMap(game.camera, {
        pos: 'JXy',
        zoom: 'sdArG',
        targetZoom: 'dDg',
        screenWidth: 'SUfX',
        screenHeight: 'NBo',
        pointToScreen: 'VbAOhd',
        screenToPoint: 'UhnJi',
    });
    alias(game.smokeBarn, 'smokePool', 'atf');
    if (game.smokeBarn && !('particles' in game.smokeBarn) && game.smokeBarn.atf) {
        Object.defineProperty(game.smokeBarn, 'particles', {
            configurable: true,
            get: () => game.smokeBarn.atf.qQqu,
        });
    }
    aliasMap(game.objectCreator, {
        idToObj: 'UijNDd',
        types: 'rbZrJ',
    });

    const pools = [
        game.map?.obstaclePool,
        game.playerBarn?.playerPool,
        game.smokeBarn?.smokePool,
    ];
    for (const pool of pools) {
        if (!pool) continue;
        alias(pool, 'pool', 'qQqu');
        exposeMPrefix(pool);
    }

    if (game.pixi && !('_ticker' in game.pixi)) {
        Object.defineProperty(game.pixi, '_ticker', {
            configurable: true,
            get: () => game.pixi.ticker,
        });
    }

    for (const player of game.playerBarn?.playerPool?.pool ?? []) adaptPlayer(player);
    for (const obstacle of game.map?.obstaclePool?.pool ?? []) exposeMPrefix(obstacle);
    for (const smoke of game.smokeBarn?.smokePool?.pool ?? []) exposeMPrefix(smoke);
}

unsafeWindow.installSurvevGptCompat = (game) => {
    adaptGameRuntime(game);
    const timer = setInterval(() => {
        if (!game.ws && !game.playerBarn) return;
        adaptGameRuntime(game);
    }, 250);
    unsafeWindow.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
    return game;
};
