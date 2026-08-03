export const metadata = `// ==UserScript==
// @name         SurvevGPT Local Research Harness
// @namespace    survevgpt.local
// @version      0.1.0
// @description  Localhost-only white-box gameplay security research harness.
// @author       SurvevGPT
// @license      GPL3
// @match        *://*/*
// @run-at       document-end
// @webRequest   [{"selector":"http://localhost/*app-*.js","action":"cancel"},{"selector":"https://localhost/*app-*.js","action":"cancel"}]
// @webRequest   [{"selector":"http://localhost/*shared-*.js","action":"cancel"},{"selector":"https://localhost/*shared-*.js","action":"cancel"}]
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
`;
