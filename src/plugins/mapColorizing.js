let colors = {
    container_06: 14934793,
    barn_02: 14934793,
    stone_02: 1654658,
    tree_03: 16777215,
    stone_04: 0xeb175a,
    stone_05: 0xeb175a,
    bunker_storm_01: 14934793,
};

unsafeWindow.mapColorizing = map => {
    if (!state.isMapColorizingEnabled || !Array.isArray(map)) return;

    map.forEach(object => {
        const color = colors[object?.obj?.type];
        if (color === undefined || !Array.isArray(object.shapes)) return;

        object.shapes.forEach(shape => {
            if (shape) shape.color = color;
        });
    });
}
import { state } from '../vars.js';
