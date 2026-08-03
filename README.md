# SurvevGPT local research harness

This is a localhost-only port of the Krity gameplay instrumentation modules for white-box security testing. Tampermonkey may inject the bootstrap globally, but the runtime allowlist contains only `localhost` and aborts before any harness hooks initialize elsewhere. Resource interception remains scoped to localhost, and the test/build pipeline rejects public game-host patterns.

## Build

```sh
npm install
npm test
npm run build
```

Install `dist/survevgpt-local.user.js` in a userscript manager and open a locally served development client. Press `F8` to toggle the research menu.

The modules intentionally depend on internal client objects and may need selector/patch updates as the local game client evolves.
