import { BrowserClient, defaultStackParser, makeFetchTransport, Scope } from '@sentry/browser';

import type { FingerprintedError } from './error';
import packageJson from '../../package.json';

const SENTRY_DSN = 'https://0defef72baf64d99bf53b92a23d5bd14@sentry.sc-prod.net/87';

const SANITIZE_KEYS = /password|token|secret|passwd|authorization|api_key|apikey|sentry_dsn|access_token|stripetoken|mysql_pwd|credentials/i;

type SentryConfig = {
    enabled: true;
    env: string;
    version: string;
    send: boolean;
    service: string;
    page: string;
    disable_breadcrumbs: boolean;
} | {
    enabled: false;
};

let scope: Scope | null = null;

const sanitize = (obj: unknown, memo = new WeakSet()): unknown => {
    if (Array.isArray(obj)) {
        if (memo.has(obj)) {
            return obj;
        }
        memo.add(obj);
        const result = obj.map(v => sanitize(v, memo));
        memo.delete(obj);
        return result;
    }
    if (obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype) {
        if (memo.has(obj)) {
            return obj;
        }
        memo.add(obj);
        const record = obj as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(record)) {
            result[key] = SANITIZE_KEYS.test(key) ? '********' : sanitize(record[key], memo);
        }
        memo.delete(obj);
        return result;
    }
    return obj;
};

// self-initialize from window.config.sentry (injected by backend)
const sentryConfig = config.sentry as SentryConfig;

// ensure window.log exists
if (!window.log) {
    (window as any).log = {};
}

if (sentryConfig.enabled) {
    const client = new BrowserClient({
        dsn: sentryConfig.send ? SENTRY_DSN : '',
        transport: makeFetchTransport,
        stackParser: defaultStackParser,
        environment: sentryConfig.env,
        release: packageJson.version,
        integrations: [],
        beforeSend: (event, hint) => {
            // filter errors from user code (asset scripts)
            const frames = event.exception?.values?.[0]?.stacktrace?.frames;
            if (frames?.length) {
                const last = frames[frames.length - 1];
                if (last.filename && last.filename.includes('/api/assets/')) {
                    return null;
                }
            }

            // set fingerprint for tagged template errors
            const original = hint?.originalException;
            if (original instanceof Error && 'fingerprint' in original) {
                const fe = original as FingerprintedError;
                event.fingerprint = [fe.fingerprint];
                event.extra = {
                    ...(event.extra || {}),
                    metadata: { message: fe.message, context: fe.context }
                };
            }

            // report error count to graphene metrics
            if (window.metrics) {
                metrics.increment({ metricsName: `${sentryConfig.service}.frontend_errors.count.by_page.${sentryConfig.page}` });
            }

            return sanitize(event) as typeof event;
        }
    });

    scope = new Scope();
    scope.setClient(client);
    scope.setTag('page', sentryConfig.page);
    client.init();

    // capture errors via sentry
    // supports both normal calls and tagged templates:
    //   log.error(err)                    — existing Error
    //   log.error('message')              — string wrapped in Error
    //   log.error`missing asset ${id}`    — fingerprinted Error for grouping
    window.log.error = (...args: any[]) => {
        if (args[0]?.raw) {
            const strings = args[0] as TemplateStringsArray;
            const values = args.slice(1);
            const e = new Error(String.raw(strings, ...values)) as FingerprintedError;
            e.fingerprint = strings.join('{}');
            e.context = values;
            console.error(e);
            captureException(e);
            return;
        }
        console.error(...args);
        if (args.length === 1 && args[0]?.stack) {
            captureException(args[0]);
        } else {
            captureException(new Error(args.map(String).join(' ')));
        }
    };
} else {
    window.log.error = (...args: any[]) => console.error(...args);
}

const captureException = (error: Error, source?: string) => {
    if (!scope) {
        return;
    }
    const s = source ? scope.clone() : scope;
    if (source) {
        s.setTag('source', source);
    }
    s.captureException(error);
};

const captureMessage = (message: string, level: 'warning' | 'error' = 'error', source?: string) => {
    if (!scope) {
        return;
    }
    const s = source ? scope.clone() : scope;
    if (source) {
        s.setTag('source', source);
    }
    s.captureMessage(message, level);
};

const setSentryTags = (tags: Record<string, string | number | undefined>) => {
    if (!scope) {
        return;
    }
    for (const [key, value] of Object.entries(tags)) {
        if (value !== undefined) {
            scope.setTag(key, String(value));
        }
    }
};

export { captureException, captureMessage, setSentryTags };
