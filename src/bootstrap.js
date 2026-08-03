import { assertAllowedPage } from './urlPolicy.js';

(() => {
    const authorization = assertAllowedPage(unsafeWindow.location);
    console.info('[SurvevGPT 0.1.10] Authorized page', authorization);

    installScriptIsolation();

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

function installScriptIsolation() {
    if (document.querySelector('meta[data-survevgpt-script-isolation]')) return;

    const policy = document.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = "script-src 'unsafe-inline' 'unsafe-eval' blob: https://challenges.cloudflare.com https://s.nitropay.com; worker-src blob:";
    policy.dataset.survevgptScriptIsolation = 'true';

    const parent = document.head || document.documentElement;
    if (!parent) {
        throw new Error('[SurvevGPT] Document root was unavailable for script isolation.');
    }
    parent.prepend(policy);
}
