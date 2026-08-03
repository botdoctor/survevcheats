import { state } from "../vars.js";


export function betterZoom(){
    const camera = unsafeWindow.game.camera;
    if (!camera || camera.__survevGptZoomOverridden) return;

    Object.defineProperty(camera, '__survevGptZoomOverridden', {
        configurable: true,
        value: true,
    });

    Object.defineProperty(camera, 'zoom', {
        configurable: true,
        get() {
            const targetZoom = Number(this.targetZoom);
            const nativeZoom = Number(this.sdArG);
            const baseZoom = Number.isFinite(targetZoom) ? targetZoom : nativeZoom;
            return Math.max(baseZoom - (state.isZoomEnabled ? 0.45 : 0), 0.35);
        },
        set(value) {
            this.sdArG = value;
        }
    });
}
