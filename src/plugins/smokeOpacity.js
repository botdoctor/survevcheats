import { state } from '../vars.js';

export function smokeOpacity() {
    const particles = unsafeWindow.game?.smokeBarn?.particles;
    if (!Array.isArray(particles)) return;

    const adaptParticle = (particle) => {
        const sprite = particle?.sprite;
        if (!sprite || sprite.__survevGptSmokeOpacity) return;

        let nativeAlpha = sprite.alpha;
        Object.defineProperty(sprite, '__survevGptSmokeOpacity', { configurable: true, value: true });
        Object.defineProperty(sprite, 'alpha', {
            configurable: true,
            get() {
                return state.isSmokeOpacityEnabled ? 0.12 : nativeAlpha;
            },
            set(value) {
                nativeAlpha = value;
            },
        });
    };

    if (!particles.push.__survevGptSmokeOpacity) {
        const wrappedPush = new Proxy(particles.push, {
            apply(target, thisArgs, args) {
                args.forEach(adaptParticle);
                return Reflect.apply(target, thisArgs, args);
            },
        });
        Object.defineProperty(wrappedPush, '__survevGptSmokeOpacity', { value: true });
        particles.push = wrappedPush;
    }

    particles.forEach(adaptParticle);
}
