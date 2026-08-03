export const ALLOWED_URLS = Object.freeze(['localhost', 'geekbar.xyz']);

export function assertAllowedPage(location = window.location) {
    if (!ALLOWED_URLS.includes(location.hostname)) {
        throw new Error(`[SurvevGPT] Refusing to load on non-allowlisted host: ${location.hostname}`);
    }
    return Object.freeze({ hostname: location.hostname, allowedUrls: ALLOWED_URLS });
}

export function isAllowedUrl(value, base = window.location.href) {
    try {
        return ALLOWED_URLS.includes(new URL(value, base).hostname);
    } catch {
        return false;
    }
}

export function assertAllowedUrl(value, operation = 'access URL') {
    if (!isAllowedUrl(value)) {
        throw new Error(`[SurvevGPT] Refusing to ${operation}: ${String(value)}`);
    }
    return value;
}

export function installNavigationGuard() {
    document.addEventListener('click', (event) => {
        const link = event.target.closest?.('a[href]');
        if (!link || isAllowedUrl(link.href)) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        console.error(`[SurvevGPT] Blocked non-allowlisted navigation: ${link.href}`);
    }, true);
}
