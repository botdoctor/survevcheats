import { defineConfig } from 'vite';
import { metadata } from './src/metadata.js';
import banner from 'vite-plugin-banner'

function localOnlyBuildGuard() {
    return {
        name: 'survevgpt-local-only-build-guard',
        generateBundle(_options, bundle) {
            const forbidden = /@match\s+[^\n]*(survev\.io|resurviv\.biz|zurviv\.io|50v50\.online|eu-comp\.net)/i;
            for (const output of Object.values(bundle)) {
                if (output.type === 'chunk' && forbidden.test(output.code)) {
                    this.error('Public userscript target found; SurvevGPT must remain localhost-only.');
                }
            }
        },
    };
}


export default defineConfig({
    build: {
        minify: false,
        target: 'esnext',
        rollupOptions: {
          input: {
            main: 'src/bootstrap.js'
          },
          output: {
            dir: 'dist',
            entryFileNames: 'survevgpt-local.user.js',
            format: 'iife',
            inlineDynamicImports: true,
          },
        },
    },
    plugins: [
        localOnlyBuildGuard(),
        banner({
            verify: false,
            content: metadata,
        })
    ],
});
