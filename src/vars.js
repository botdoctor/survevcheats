let state = {
    isAimBotEnabled: true,
    isAimAtKnockedOutEnabled: true,
    get aimAtKnockedOutStatus() {
        return this.isAimBotEnabled && this.isAimAtKnockedOutEnabled;
    },
    isZoomEnabled: true,
    isMeleeAttackEnabled: true,
    get meleeStatus() {
        return this.isAimBotEnabled && this.isMeleeAttackEnabled;
    },
    isSpinBotEnabled: false,
    isAutoSwitchEnabled: true,
    isUseOneGunEnabled: false,
    focusedEnemy: null,
    get focusedEnemyStatus() {
        return this.isAimBotEnabled && this.focusedEnemy;
    },
    isXrayEnabled: true,
    friends: [],
    lastFrames: {},
    enemyAimBot: null,
    isLaserDrawerEnabled: true,
    isLineDrawerEnabled: true,
    isNadeDrawerEnabled: true,
    isOverlayEnabled: true,
    isMenuOpen: true,
    isVisibleNamesEnabled: true,
    isGrenadeTimerEnabled: true,
    isAutoLootEnabled: true,
    isBumpFireEnabled: true,
    isObstacleOpacityEnabled: true,
    isSmokeOpacityEnabled: true,
    isMapColorizingEnabled: true,
    isMovementInterpolationEnabled: true,
    isMovementAccuracyEnabled: false,
    isPortraitCullingEnabled: false,
};

export { state };
