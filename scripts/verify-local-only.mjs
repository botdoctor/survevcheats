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

const { ALLOWED_URLS } = await import(new URL('../src/urlPolicy.js', import.meta.url));
if (ALLOWED_URLS.length === 0) throw new Error('Runtime allowlist cannot be empty.');
const sourceFiles = (await walk(new URL('../src', import.meta.url).pathname)).filter((path) => path.endsWith('.js'));
const allowlistDeclarations = [];
for (const path of sourceFiles) {
    const source = await readFile(path, 'utf8');
    if (/\bALLOWED_URLS\s*=/.test(source)) allowlistDeclarations.push(path);
}
if (allowlistDeclarations.length !== 1 || !allowlistDeclarations[0].endsWith('/src/urlPolicy.js')) {
    throw new Error(`ALLOWED_URLS must be declared only in src/urlPolicy.js: ${allowlistDeclarations.join(', ')}`);
}

const metadata = await readFile(new URL('../src/metadata.js', import.meta.url), 'utf8');
const matchRules = [...metadata.matchAll(/^\/\/ @match\s+(.+)$/gm)].map((match) => match[1]);
if (matchRules.length !== 1 || matchRules[0] !== '*://*/*') {
    throw new Error('Userscript metadata must inject globally so the runtime allowlist is authoritative.');
}
const { metadata: renderedMetadata } = await import(new URL('../src/metadata.js', import.meta.url));
const webRequestRules = [...renderedMetadata.matchAll(/^\/\/ @webRequest\s+(.+)$/gm)]
    .flatMap((match) => JSON.parse(match[1]));
const expectedSelectors = new Set(ALLOWED_URLS.flatMap((hostname) =>
    ['app', 'shared'].flatMap((bundle) => ['http', 'https'].map((protocol) =>
        `${protocol}://${hostname}/*${bundle}-*.js`
    ))
));
if (
    webRequestRules.length !== expectedSelectors.size
    || webRequestRules.some((rule) => !expectedSelectors.has(rule.selector) || rule.action !== 'cancel')
) throw new Error('Rendered resource interception rules do not match ALLOWED_URLS.');

console.log('Local-only verification passed.');
