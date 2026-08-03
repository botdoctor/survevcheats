import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const forbiddenHosts = /survev\.io|resurviv\.biz|zurviv\.io|50v50\.online|eu-comp\.net|67\.217\.244\.178/i;
const allowedLegacyFiles = new Set(['README.md']);

async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        const path = join(directory, entry.name);
        files.push(...(entry.isDirectory() ? await walk(path) : [path]));
    }
    return files;
}

const failures = [];
for (const path of await walk(root.pathname)) {
    if (allowedLegacyFiles.has(path.split('/').at(-1))) continue;
    if (!/\.(?:js|mjs|json)$/.test(path)) continue;
    const source = await readFile(path, 'utf8');
    if (forbiddenHosts.test(source)) failures.push(path);
}

if (failures.length) {
    throw new Error(`Public host references are forbidden:\n${failures.join('\n')}`);
}

const urlPolicy = await readFile(new URL('../src/urlPolicy.js', import.meta.url), 'utf8');
if (!urlPolicy.includes("ALLOWED_URLS = Object.freeze(['localhost'])")) {
    throw new Error('Runtime allowlist must contain only localhost.');
}

const metadata = await readFile(new URL('../src/metadata.js', import.meta.url), 'utf8');
const matchRules = [...metadata.matchAll(/^\/\/ @match\s+(.+)$/gm)].map((match) => match[1]);
if (matchRules.length !== 1 || matchRules[0] !== '*://*/*') {
    throw new Error('Userscript metadata must inject globally so the runtime allowlist is authoritative.');
}
const webRequestRules = [...metadata.matchAll(/^\/\/ @webRequest\s+(.+)$/gm)].map((match) => match[1]);
if (
    webRequestRules.length !== 2
    || webRequestRules.some((rule) => /"selector":"(?!https?:\/\/localhost\/)/.test(rule))
) {
    throw new Error('Resource interception must remain scoped to localhost.');
}

console.log('Local-only verification passed.');
