import { ALLOWED_URLS } from './urlPolicy.js';

const resourceRule = (bundleName) => JSON.stringify(
    ALLOWED_URLS.flatMap((hostname) => ['http', 'https'].map((protocol) => ({
        selector: `${protocol}://${hostname}/*${bundleName}-*.js`,
        action: 'cancel',
    }))),
);

export const metadata = `// ==UserScript==
// @name         SurvevGPT Allowlisted Research Harness
// @namespace    survevgpt.local
// @version      0.1.0
// @description  Allowlisted white-box gameplay security research harness.
// @author       SurvevGPT
// @license      GPL3
// @match        *://*/*
// @run-at       document-end
// @webRequest   ${resourceRule('app')}
// @webRequest   ${resourceRule('shared')}
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
`;
