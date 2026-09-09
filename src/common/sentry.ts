import { BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope } from '@sentry/browser';
import type { Breadcrumb } from '@sentry/browser';
import { getIntegrationsToSetup } from '@sentry/core';

import { version } from '../../package.json';

import type { FingerprintedError } from './error';
import { redactText, sanitize } from './redact';

const SENTRY_DSN = 'https://58fa45ef9143da0100d89bee06e47707@sentry.sc-prod.net/331';

// must match the release name the build uploads sourcemaps under (see vite.config.mjs)
const RELEASE = `playcanvas-editor@${version}`;
const BREADCRUMBS_INTEGRATION = 'Breadcrumbs';
const MAX_BREADCRUMBS = 100;

// frames from user-authored asset scripts are their bugs, not editor bugs
const USER_SCRIPT_PATH = '/api/assets/';

// standard hosts the editor loads its engine and frontend from; anything else is a user override
// (a custom build) whose errors we can't fix. matches the console's "local engine/frontend" checks
const DEFAULT_ENGINE_URL_PREFIX = 'https://code.playcanvas.com/playcanvas-';
const DEFAULT_FRONTEND_URL_PREFIX = '/editor/scene';

type SentryConfig =
    | {
          enabled: true;
          env: string;
          version: string;
          send: boolean;
          service: string;
          page: string;
          disable_breadcrumbs: boolean;
      }
    | {
          enabled: false;
      };

type TagValue = string | number | boolean | undefined;

let scope: Scope | null = null;

const getSentryIntegrations = (disableBreadcrumbs: boolean) =>
    getIntegrationsToSetup({
        defaultIntegrations: getDefaultIntegrations({}).filter(
            (i) => !disableBreadcrumbs || i.name !== BREADCRUMBS_INTEGRATION
        ),
        integrations: []
    });

// keep the whole trail leading up to an error but strip anything secret-looking from it
const scrubBreadcrumb = (b: Breadcrumb): Breadcrumb => {
    if (b.message) {
        b.message = redactText(b.message);
    }
    if (b.data) {
        b.data = sanitize(b.data) as Record<string, unknown>;
        if (typeof b.data.url === 'string') {
            b.data.url = redactText(b.data.url);
        }
    }
    return b;
};

const captureException = (error: Error, source?: string, extra?: Record<string, unknown>) => {
    if (!scope) {
        return;
    }
    const s = source || extra ? scope.clone() : scope;
    if (source) {
        s.setTag('source', source);
    }
    if (extra) {
        s.setExtras(extra);
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

const setSentryTags = (tags: Record<string, TagValue>) => {
    if (!scope) {
        return;
    }
    for (const [key, value] of Object.entries(tags)) {
        if (value !== undefined) {
            scope.setTag(key, String(value));
        }
    }
};

// a first-class user lets sentry count users affected per issue, which tags alone cannot
const setSentryUser = (id: number | null | undefined) => {
    if (!scope || id === null || id === undefined) {
        return;
    }
    scope.setUser({ id: String(id) });
};

// flags whether the engine or frontend is a user override so unfixable errors can be triaged out.
// the urls stay off tags (unbounded cardinality) and go to context only when non-standard
const setSentrySource = (engineUrl?: string, frontendUrl?: string) => {
    if (!scope) {
        return;
    }
    const customEngine = Boolean(engineUrl && !engineUrl.startsWith(DEFAULT_ENGINE_URL_PREFIX));
    const customFrontend = Boolean(frontendUrl && !frontendUrl.startsWith(DEFAULT_FRONTEND_URL_PREFIX));
    scope.setTag('custom_engine', String(customEngine));
    scope.setTag('custom_frontend', String(customFrontend));
    if (customEngine || customFrontend) {
        scope.setContext('overrides', {
            ...(customEngine ? { engine_url: engineUrl } : {}),
            ...(customFrontend ? { frontend_url: frontendUrl } : {})
        });
    }
};

// shared log.error implementation
// supports both normal calls and tagged templates:
//   log.error(err)                    — existing Error
//   log.error('message')              — string wrapped in Error
//   log.error`missing asset ${id}`    — fingerprinted Error for grouping
const logError = (source: string | undefined, args: any[]) => {
    const first = args[0];
    if (Array.isArray(first) && 'raw' in first) {
        const strings = first as unknown as TemplateStringsArray;
        const values = args.slice(1);
        const e = new Error(String.raw(strings, ...values)) as FingerprintedError;
        e.fingerprint = strings.join('{}');
        e.context = values;
        console.error(e);
        captureException(e, source);
        return;
    }
    console.error(...args);
    const err = args.find((a) => a?.stack);
    captureException(err ?? new Error(args.map(String).join(' ')), source);
};

/**
 * Creates a `log` bound to a source such as `editor/assets` so every event it reports carries a
 * `source` tag naming the module it came from. Shadow the global `log` with it at module scope.
 */
const createLog = (source: string): typeof window.log => ({
    error: (...args: any[]) => logError(source, args)
});

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
        release: RELEASE,
        maxBreadcrumbs: MAX_BREADCRUMBS,
        attachStacktrace: true,
        sendDefaultPii: true,
        integrations: getSentryIntegrations(sentryConfig.disable_breadcrumbs),
        beforeBreadcrumb: scrubBreadcrumb,
        beforeSend: (event, hint) => {
            const frames = event.exception?.values?.[0]?.stacktrace?.frames;
            const top = frames?.[frames.length - 1];
            if (top?.filename?.includes(USER_SCRIPT_PATH)) {
                return null;
            }

            // set fingerprint for tagged template errors
            const original = hint?.originalException;
            if (original instanceof Error && 'fingerprint' in original) {
                const fe = original as FingerprintedError;
                event.fingerprint = [fe.fingerprint];
                // stringify non-primitive context values so class instances don't bypass sanitize()
                // and leak sensitive fields into event.extra, then scrub tokens out of the text
                const context = (fe.context || []).map((v) => {
                    const s = v !== null && typeof v === 'object' ? String(v) : v;
                    return typeof s === 'string' ? redactText(s) : s;
                });
                event.extra = {
                    ...(event.extra || {}),
                    metadata: { message: redactText(fe.message), context }
                };
            }

            // sanitize() only masks by key name; free text that can embed a token needs redactText too
            if (event.message) {
                event.message = redactText(event.message);
            }
            for (const v of event.exception?.values || []) {
                if (v.value) {
                    v.value = redactText(v.value);
                }
            }
            if (event.request?.url) {
                event.request.url = redactText(event.request.url);
            }
            const headers = event.request?.headers;
            if (headers?.Referer) {
                headers.Referer = redactText(headers.Referer);
            }

            // report error count to graphene metrics
            if (window.metrics) {
                metrics.increment({
                    metricsName: `${sentryConfig.service}.frontend_errors.count.by_page.${sentryConfig.page}`
                });
            }

            return sanitize(event) as typeof event;
        }
    });

    scope = new Scope();
    scope.setClient(client);
    scope.setTag('page', sentryConfig.page);

    // deploy sha injected by the backend; distinguishes builds that share a package version
    if (sentryConfig.version) {
        scope.setTag('dist', sentryConfig.version);
    }
    client.init();

    window.log.error = (...args: any[]) => logError(undefined, args);
} else {
    window.log.error = (...args: any[]) => console.error(...args);
}

export { captureException, captureMessage, createLog, setSentrySource, setSentryTags, setSentryUser };
