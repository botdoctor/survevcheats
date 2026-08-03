import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderNativeMetadata } from '../native-loader/metadata.js';
import { nativeLoaderRuntime } from '../native-loader/runtime.js';
import { ALLOWED_URLS, TRUSTED_URLS } from '../src/urlPolicy.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
const payloadPath = resolve(projectRoot, process.env.SURVEVGPT_NATIVE_PAYLOAD ?? 'native-dist/survev-native-client.js');
const outputPaths = process.env.SURVEVGPT_NATIVE_OUTPUT
    ? [resolve(projectRoot, process.env.SURVEVGPT_NATIVE_OUTPUT)]
    : [
        resolve(projectRoot, 'dist/survevgpt-local.user.js'),
        resolve(projectRoot, 'dist/survevgpt-native.user.js'),
    ];
const revision = process.env.SURVEVGPT_NATIVE_REVISION ?? 'development';

let payload;
try {
    payload = await readFile(payloadPath, 'utf8');
} catch (error) {
    throw new Error(`Native client payload is missing: ${payloadPath}`, { cause: error });
}
if (!payload.trim()) throw new Error(`Native client payload is empty: ${payloadPath}`);
if (/^\s*(?:import|export)\s/m.test(payload) || /\bimport\s*\(/.test(payload)) {
    throw new Error('Native client payload must be a single self-contained IIFE with no imports.');
}

const buildInfo = Object.freeze({ version: packageJson.version, revision });
const output = `${renderNativeMetadata(packageJson.version)}

(() => {
    const payload = ${JSON.stringify(payload)};
    const buildInfo = ${JSON.stringify(buildInfo)};
    const allowedUrls = ${JSON.stringify(ALLOWED_URLS)};
    const trustedUrls = ${JSON.stringify(TRUSTED_URLS)};
    const urlPolicy = Object.freeze({ allowedUrls, trustedUrls });
    const storage = {
        get: (key) => GM_getValue(key),
        set: (key, value) => GM_setValue(key, value),
        remove: (key) => GM_deleteValue(key),
    };
    (${nativeLoaderRuntime.toString()})(unsafeWindow, payload, buildInfo, storage, urlPolicy);
})();
`;

for (const outputPath of outputPaths) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, output);
    console.log(`Built ${basename(outputPath)} with ${payload.length} bytes of native client code.`);
}
