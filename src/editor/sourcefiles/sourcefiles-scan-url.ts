const HOSTS = ['code.playcanvas.com', 'localhost:51000'];

/**
 * Whether the legacy script scanner may fetch a url: http(s) on code.playcanvas.com or
 * localhost:51000, or a path under the api. Compares the parsed host and path, never a substring.
 *
 * @param url - The script url.
 * @param api - The api url.
 * @returns True if the url may be scanned.
 */
export const isScanUrlAllowed = (url: string, api: URL) => {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return false;
    }
    if (HOSTS.includes(parsed.host)) {
        return true;
    }
    return parsed.origin === api.origin && parsed.pathname.startsWith(`${api.pathname.replace(/\/$/, '')}/`);
};
