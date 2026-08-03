import { readFile } from 'node:fs/promises';
import { renderNativeMetadata } from '../native-loader/metadata.js';
import { nativeLoaderRuntime } from '../native-loader/runtime.js';

const metadata = renderNativeMetadata('0.0.0-test');
const matches = [...metadata.matchAll(/^\/\/ @match\s+(.+)$/gm)].map((match) => match[1]);
const expected = [
    '*://localhost/*',
    '*://survev.io/*',
    '*://*.survev.io/*',
    '*://geekbar.xyz/*',
    '*://*.geekbar.xyz/*',
];
if (matches.length !== expected.length || expected.some((value) => !matches.includes(value))) {
    throw new Error(`Unexpected native loader matches: ${matches.join(', ')}`);
}
if (!metadata.includes('// @run-at       document-start')) throw new Error('Native loader must run at document-start.');
if (!metadata.includes('// @webRequest')) throw new Error('Native loader must block the stock client at request time.');

const runtime = nativeLoaderRuntime.toString();
for (const required of [
    '__SURVEVGPT_NATIVE_STATUS__',
    'stock-client-blocked',
    'waiting-for-dom',
    'payload-injected',
    'survevgpt:native-ready',
    'client-ready',
]) {
    if (!runtime.includes(required)) throw new Error(`Native loader diagnostic is missing: ${required}`);
}
if (/applyPatches|installSurvevGptCompat|bundles-classified|modifiedAppURL/.test(runtime)) {
    throw new Error('Native loader must not rewrite or compatibility-patch stock bundles.');
}

const buildScript = await readFile(new URL('./build-native-userscript.mjs', import.meta.url), 'utf8');
if (!buildScript.includes('native-dist/survev-native-client.js')) {
    throw new Error('Native payload artifact contract changed unexpectedly.');
}
if (!buildScript.includes('dist/survevgpt-local.user.js')) {
    throw new Error('Established Tampermonkey install entry point must receive the native build.');
}
console.log('Native Tampermonkey loader verification passed.');
