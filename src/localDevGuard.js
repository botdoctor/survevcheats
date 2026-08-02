import { ALLOWED_URLS } from './urlPolicy.js';

export function assertLocalDevMode(location = unsafeWindow.location) {
    if (!ALLOWED_URLS.includes(location.hostname)) {
        throw new Error(
            `[SurvevGPT] Refusing to run on non-local host: ${location.hostname}`,
        );
    }

    unsafeWindow.__SURVEVGPT_LOCAL_DEV__ = Object.freeze({
        hostname: location.hostname,
        startedAt: Date.now(),
    });
}
