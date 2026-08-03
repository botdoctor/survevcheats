// This file is serialized into the generated userscript by build-native-userscript.mjs.
// Keep all dependencies passed as arguments so it remains independently testable.
export function nativeLoaderRuntime(pageWindow, payload, buildInfo) {
    'use strict';

    const STATUS_KEY = '__SURVEVGPT_NATIVE_STATUS__';
    const allowedHosts = Object.freeze(['localhost', 'survev.io', 'geekbar.xyz']);
    const hostname = pageWindow.location.hostname.toLowerCase().replace(/\.$/, '');
    const allowed = allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    const status = pageWindow[STATUS_KEY] = {
        version: buildInfo.version,
        revision: buildInfo.revision,
        hostname,
        stage: 'authorizing',
        startedAt: Date.now(),
        errors: [],
    };

    const report = (stage, detail) => {
        status.stage = stage;
        status.updatedAt = Date.now();
        if (detail !== undefined) status.detail = detail;
        console.info(`[SurvevGPT Native ${buildInfo.version}] ${stage}`, detail ?? '');
    };
    const fail = (stage, error) => {
        const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        status.stage = stage;
        status.updatedAt = Date.now();
        status.errors.push(message);
        console.error(`[SurvevGPT Native ${buildInfo.version}] ${stage}`, error);
    };

    if (!allowed) {
        fail('authorization-refused', new Error(`Non-allowlisted host: ${hostname}`));
        return;
    }
    if (pageWindow.__SURVEVGPT_NATIVE_LOADED__) {
        report('duplicate-suppressed');
        return;
    }
    Object.defineProperty(pageWindow, '__SURVEVGPT_NATIVE_LOADED__', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false,
    });
    report('authorized', { hostname, revision: buildInfo.revision });

    pageWindow.addEventListener('survevgpt:native-ready', (event) => {
        report('client-ready', event.detail);
    }, { once: true });
    pageWindow.addEventListener('survevgpt:native-failed', (event) => {
        fail('client-failed', event.detail ?? 'Native client reported an unknown startup failure.');
    }, { once: true });

    // @webRequest is the primary request-time barrier. This observer also removes scripts
    // inserted after document-start, while leaving non-JavaScript assets and APIs alone.
    const isStockScript = (node) => {
        if (!(node instanceof pageWindow.HTMLScriptElement) || !node.src) return false;
        try {
            const url = new URL(node.src, pageWindow.location.href);
            return url.origin === pageWindow.location.origin && url.protocol !== 'blob:';
        } catch {
            return false;
        }
    };
    const removeStockScripts = (root) => {
        if (isStockScript(root)) root.remove();
        root.querySelectorAll?.('script[src]').forEach((script) => {
            if (isStockScript(script)) script.remove();
        });
    };
    removeStockScripts(pageWindow.document);
    const observer = new pageWindow.MutationObserver((records) => {
        for (const record of records) {
            for (const node of record.addedNodes) removeStockScripts(node);
        }
    });
    observer.observe(pageWindow.document, { childList: true, subtree: true });
    status.stockScriptObserverActive = true;
    report('stock-client-blocked');

    const inject = () => {
        try {
            const source = `${payload}\n//# sourceURL=survevgpt-native-client-${buildInfo.revision}.js`;
            // Taking Function from unsafeWindow constructs and executes the payload in the page realm.
            // The stock client already requires unsafe-eval; this avoids relying on inline-script CSP.
            pageWindow.Function(source)();
            status.stockScriptObserverActive = false;
            observer.disconnect();
            report('payload-injected');
        } catch (error) {
            fail('payload-injection-failed', error);
        }
    };

    if (pageWindow.document.readyState === 'loading') {
        report('waiting-for-dom');
        pageWindow.document.addEventListener('DOMContentLoaded', inject, { once: true });
    } else {
        inject();
    }
}
