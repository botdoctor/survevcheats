import { state } from '../vars.js';

export function removeCeilings() {
    const texturePrototype = unsafeWindow.PIXI?.Texture?.prototype;
    if (!texturePrototype || texturePrototype.__survevGptCeilingFilter) return;

    Object.defineProperty(texturePrototype, '__survevGptCeilingFilter', {
        configurable: true,
        value: true,
    });

    Object.defineProperty(texturePrototype, 'textureCacheIds', {
        configurable: true,
        get() {
            return this.__survevGptTextureCacheIds;
        },
        set(value) {
            this.__survevGptTextureCacheIds = value;
            if (!Array.isArray(value) || value.__survevGptCeilingFilter) return;

            const texture = this;
            const wrappedPush = new Proxy(value.push, {
                apply(target, thisArgs, args) {
                    for (const cacheId of args) {
                        if (typeof cacheId !== 'string') continue;
                        const isCeiling = cacheId.includes('ceiling')
                            && !cacheId.includes('map-building-container-ceiling-05');
                        if (!isCeiling && !cacheId.includes('map-snow-')) continue;
                        installVisibilityOverride(texture);
                    }
                    return Reflect.apply(target, thisArgs, args);
                },
            });
            Object.defineProperty(value, '__survevGptCeilingFilter', { value: true });
            value.push = wrappedPush;
        },
    });
}

function installVisibilityOverride(texture) {
    if (texture.__survevGptVisibilityOverride) return;

    let nativeValid = texture.valid;
    Object.defineProperty(texture, '__survevGptVisibilityOverride', {
        configurable: true,
        value: true,
    });
    Object.defineProperty(texture, 'valid', {
        configurable: true,
        get() {
            return state.isXrayEnabled ? false : nativeValid;
        },
        set(value) {
            nativeValid = value;
        },
    });
}
