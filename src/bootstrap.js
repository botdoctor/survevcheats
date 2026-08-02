import { ALLOWED_URLS } from './urlPolicy.js';

(() => {
    const hostname = window.location.hostname;

    if (!ALLOWED_URLS.includes(hostname)) {
        throw new Error(`[SurvevGPT] Refusing to load on non-local host: ${hostname}`);
    }

    import('./init.js').catch((error) => {
        console.error('[SurvevGPT] Local research harness failed to initialize.', error);
    });
})();
