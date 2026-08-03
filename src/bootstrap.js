import { assertAllowedPage } from './urlPolicy.js';

(() => {
    const authorization = assertAllowedPage();
    console.info('[SurvevGPT 0.1.4] Authorized page', authorization);

    const initialize = () => {
        queueMicrotask(() => {
            import('./init.js').catch((error) => {
                console.error('[SurvevGPT] Local research harness failed to initialize.', error);
            });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
