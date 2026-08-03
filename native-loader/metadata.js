import { ALLOWED_URLS } from '../src/urlPolicy.js';

export const NATIVE_USER_SCRIPT_NAME = 'SurvevGPT Allowlisted Research Harness';

function resourceRules() {
    return ALLOWED_URLS.flatMap((hostname) => {
        const hosts = hostname === 'localhost' ? [hostname] : [hostname, `*.${hostname}`];
        return hosts.flatMap((host) => ['http', 'https'].flatMap((protocol) => [
            `${protocol}://${host}/*.js`,
            `${protocol}://${host}/js/*.js`,
            `${protocol}://${host}/assets/*.js`,
        ].map((selector) => ({ selector, action: 'cancel' }))));
    });
}

export function renderNativeMetadata(version) {
    return `// ==UserScript==
// @name         ${NATIVE_USER_SCRIPT_NAME}
// @namespace    survevgpt.local
// @version      ${version}
// @description  Tampermonkey-only source-native client for the allowlisted research environment.
// @author       SurvevGPT
// @license      GPL3
// @match        *://localhost/*
// @match        *://survev.io/*
// @match        *://*.survev.io/*
// @match        *://geekbar.xyz/*
// @match        *://*.geekbar.xyz/*
// @run-at       document-start
// @webRequest   ${JSON.stringify(resourceRules())}
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==`;
}
