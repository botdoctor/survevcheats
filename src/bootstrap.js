import { assertAllowedPage } from './urlPolicy.js';

(() => {
    const authorization = assertAllowedPage();
    console.info('[SurvevGPT 0.1.2] Authorized page', authorization);

    import('./init.js').catch((error) => {
        console.error('[SurvevGPT] Local research harness failed to initialize.', error);
    });
})();
