export function getTeam(player) {
    const teamInfo = unsafeWindow.game?.playerBarn?.teamInfo;
    if (!player || !teamInfo) return undefined;
    return Object.keys(teamInfo).find(team => teamInfo[team]?.playerIds?.includes(player.__id));
}

export function findWeap(player) {
    const weapType = player?.netData?.activeWeapon;
    return weapType && unsafeWindow.guns?.[weapType] ? unsafeWindow.guns[weapType] : null;
}

export function findBullet(weapon) {
    return weapon ? unsafeWindow.bullets?.[weapon.bulletType] ?? null : null;
}
