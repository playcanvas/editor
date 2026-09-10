const SECRET_KEYS =
    /password|token|secret|passwd|authorization|api_key|apikey|sentry_dsn|access_token|stripetoken|mysql_pwd|credentials/i;
const BEARER = /\b(Bearer)\s+[A-Za-z0-9._+/=-]+/gi;
const AUTH_HEADER = /\b(Authorization|Cookie|Set-Cookie)\s*[:=]\s*[^\s,;]+/gi;
const QUERY_TOKEN = /\b(access_token|accessToken|token|api_key|apikey|password|secret|sentry_dsn)\s*=\s*[^\s&"']+/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

/**
 * Masks values of secret-looking keys in plain objects and arrays. Class instances are returned
 * untouched so SDK types (Error, Scope, etc.) keep their prototypes.
 */
export const sanitize = (obj: unknown, memo = new WeakSet()): unknown => {
    if (Array.isArray(obj)) {
        if (memo.has(obj)) {
            return '[Circular]';
        }
        memo.add(obj);
        const result = obj.map((v) => sanitize(v, memo));
        memo.delete(obj);
        return result;
    }
    if (obj && typeof obj === 'object') {
        const proto = Object.getPrototypeOf(obj);
        if (proto !== Object.prototype && proto !== null) {
            return obj;
        }
        if (memo.has(obj)) {
            return '[Circular]';
        }
        memo.add(obj);
        const record = obj as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(record)) {
            result[key] = SECRET_KEYS.test(key) ? '********' : sanitize(record[key], memo);
        }
        memo.delete(obj);
        return result;
    }
    return obj;
};

/** Redacts tokens embedded in free text such as urls, headers and breadcrumb messages. */
export const redactText = (s: string) =>
    s
        .replace(JWT, '<jwt>')
        .replace(BEARER, '$1 <redacted>')
        .replace(AUTH_HEADER, '$1: <redacted>')
        .replace(QUERY_TOKEN, '$1=<redacted>');
