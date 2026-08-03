import { ALLOWED_URLS } from './urlPolicy.js';

const resourceRule = () => JSON.stringify(
    ALLOWED_URLS.flatMap((hostname) => {
        const hosts = hostname === 'localhost' ? [hostname] : [hostname, `*.${hostname}`];
        return hosts.flatMap((host) => ['http', 'https'].flatMap((protocol) =>
            ['/*.js', '/js/*.js'].map((path) => ({
                selector: `${protocol}://${host}${path}`,
                action: 'cancel',
            }))
        ));
    }),
);

export const metadata = `// ==UserScript==
// @name         SurvevGPT Allowlisted Research Harness
// @namespace    survevgpt.local
// @version      0.1.9
// @description  Allowlisted white-box gameplay security research harness.
// @author       SurvevGPT
// @license      GPL3
// @match        *://localhost/*
// @match        *://geekbar.xyz/*
// @match        *://*.geekbar.xyz/*
// @run-at       document-start
// @webRequest   ${resourceRule()}
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
`;
