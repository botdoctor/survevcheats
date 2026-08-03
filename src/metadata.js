import { ALLOWED_URLS } from './urlPolicy.js';

const resourceRule = () => JSON.stringify(
    ALLOWED_URLS.flatMap((hostname) => {
        const hosts = hostname === 'localhost' ? [hostname] : [hostname, `*.${hostname}`];
        return hosts.flatMap((host) => ['http', 'https'].map((protocol) => ({
            selector: `${protocol}://${host}/js/*.js`,
            action: 'cancel',
        })));
    }),
);

export const metadata = `// ==UserScript==
// @name         SurvevGPT Allowlisted Research Harness
// @namespace    survevgpt.local
// @version      0.1.2
// @description  Allowlisted white-box gameplay security research harness.
// @author       SurvevGPT
// @license      GPL3
// @match        *://*/*
// @run-at       document-end
// @webRequest   ${resourceRule()}
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
`;
