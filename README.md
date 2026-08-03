# SurvevGPT local research harness

This is an allowlisted port of the Krity gameplay instrumentation modules for authorized white-box security testing. Tampermonkey may inject the bootstrap globally, but the runtime allowlist contains only `localhost` and `geekbar.xyz` and aborts before any harness hooks initialize elsewhere. Resource interception remains scoped to those authorized hosts.

The single source of truth is `src/urlPolicy.js`. Edit only `ALLOWED_URLS`, then run `npm test && npm run build`; Tampermonkey resource interception metadata is generated from the same array.

## Build

```sh
npm install
npm test
npm run build
```

Install `dist/survevgpt-local.user.js` in a userscript manager and open a locally served development client. Press `F8` to toggle the research menu.

The modules intentionally depend on internal client objects and may need selector/patch updates as the local game client evolves.
