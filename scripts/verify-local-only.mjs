import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const forbiddenHosts = /resurviv\.biz|zurviv\.io|50v50\.online|eu-comp\.net|67\.217\.244\.178/i;
const allowedLegacyFiles = new Set(['README.md']);

async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'native-dist') continue;
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

const { ALLOWED_URLS, TRUSTED_URLS } = await import(new URL('../src/urlPolicy.js', import.meta.url));
if (ALLOWED_URLS.length === 0) throw new Error('Runtime allowlist cannot be empty.');
if (TRUSTED_URLS.length === 0) throw new Error('Trust Lab URL list cannot be empty.');
if (TRUSTED_URLS.length >= ALLOWED_URLS.length) {
    throw new Error('Trust Lab URLs must be a strict subset of allowed URLs.');
}
if (TRUSTED_URLS.some((host) => !ALLOWED_URLS.includes(host))) {
    throw new Error('TRUSTED_URLS must be a strict subset of ALLOWED_URLS.');
}
const sourceFiles = (await walk(new URL('../src', import.meta.url).pathname)).filter((path) => path.endsWith('.js'));
const allowlistDeclarations = [];
const trustedListDeclarations = [];
for (const path of sourceFiles) {
    const source = await readFile(path, 'utf8');
    if (/\bALLOWED_URLS\s*=/.test(source)) allowlistDeclarations.push(path);
    if (/\bTRUSTED_URLS\s*=/.test(source)) trustedListDeclarations.push(path);
}
if (allowlistDeclarations.length !== 1 || !allowlistDeclarations[0].endsWith('/src/urlPolicy.js')) {
    throw new Error(`ALLOWED_URLS must be declared only in src/urlPolicy.js: ${allowlistDeclarations.join(', ')}`);
}
if (trustedListDeclarations.length !== 1 || !trustedListDeclarations[0].endsWith('/src/urlPolicy.js')) {
    throw new Error(`TRUSTED_URLS must be declared only in src/urlPolicy.js: ${trustedListDeclarations.join(', ')}`);
}

const metadata = await readFile(new URL('../src/metadata.js', import.meta.url), 'utf8');
if (!metadata.includes('// @run-at       document-start')) {
    throw new Error('The userscript must start before the original client modules are requested.');
}
const matchRules = [...metadata.matchAll(/^\/\/ @match\s+(.+)$/gm)].map((match) => match[1]);
const expectedMatchRules = new Set([
    '*://localhost/*',
    '*://survev.io/*',
    '*://*.survev.io/*',
    '*://geekbar.xyz/*',
    '*://*.geekbar.xyz/*',
]);
if (matchRules.length !== expectedMatchRules.size || matchRules.some((rule) => !expectedMatchRules.has(rule))) {
    throw new Error('Userscript metadata match rules must be limited to the runtime allowlist.');
}
const { metadata: renderedMetadata } = await import(new URL('../src/metadata.js', import.meta.url));
const webRequestRules = [...renderedMetadata.matchAll(/^\/\/ @webRequest\s+(.+)$/gm)]
    .flatMap((match) => JSON.parse(match[1]));
const expectedSelectors = new Set(ALLOWED_URLS.flatMap((hostname) =>
    (hostname === 'localhost' ? [hostname] : [hostname, `*.${hostname}`]).flatMap((host) =>
        ['http', 'https'].flatMap((protocol) =>
            ['/*.js', '/js/*.js'].map((path) => `${protocol}://${host}${path}`)
        )
    )
));
if (
    webRequestRules.length !== expectedSelectors.size
    || webRequestRules.some((rule) => !expectedSelectors.has(rule.selector) || rule.action !== 'cancel')
) throw new Error('Rendered resource interception rules do not match ALLOWED_URLS.');

const removeCeilings = await readFile(new URL('../src/plugins/removeCeilings.js', import.meta.url), 'utf8');
if (/Object\.defineProperty\(\s*Object\.prototype/.test(removeCeilings)) {
    throw new Error('Rendering hooks must not modify Object.prototype.');
}
if (/Texture(?:\.prototype)?|\.valid\b|textureCacheIds/.test(removeCeilings.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) {
    throw new Error('Ceiling hooks must not mutate Pixi texture internals.');
}

const bootstrap = await readFile(new URL('../src/bootstrap.js', import.meta.url), 'utf8');
if (!/script-src[^;]*blob:/.test(bootstrap)) {
    throw new Error('The bootstrap must isolate original scripts while allowing rewritten blob modules.');
}

console.log('Local-only verification passed.');
