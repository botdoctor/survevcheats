export const metadata = `// ==UserScript==
// @name         SurvevGPT Local Research Harness
// @namespace    survevgpt.local
// @version      0.1.0
// @description  Localhost-only white-box gameplay security research harness.
// @author       SurvevGPT
// @license      GPL3
// @match        http://localhost/*
// @match        https://localhost/*
// @run-at       document-end
// @webRequest   [{"selector":"*app-*.js","action":"cancel"}]
// @webRequest   [{"selector":"*shared-*.js","action":"cancel"}]
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
`;
