import type { Observer } from '@playcanvas/observer';

import { deepEqual } from './utils';

// a page load reports each kind once, after which its documents are no longer compared
const reported = new Set<string>();

/**
 * Whether `after` adds or changes a value of `before`. Removals don't count, as some
 * migrations drop fields locally on every load.
 *
 * @param before - The document before.
 * @param after - The document after.
 * @returns True when something was written.
 */
const wrote = (before: unknown, after: unknown) => {
    const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
    if (object(before) && object(after)) {
        return Object.keys(after).some((k) => !Object.hasOwn(before, k) || wrote(before[k], after[k]));
    }
    return !deepEqual(before, after);
};

/**
 * Starts tracking a load-time migration, to count the page loads where it still writes to a
 * document.
 *
 * @param kind - What is migrated, used in the metric name.
 * @param observer - The document being migrated.
 * @returns Call once the migration has run.
 */
export const trackMigration = (kind: string, observer: Observer) => {
    const name = kind.replace(/[^\w.]/g, '_');
    const { metrics } = globalThis as { metrics?: { increment: (m: { metricsName: string }) => void } };
    if (!metrics || reported.has(name)) {
        return () => undefined;
    }
    const before = observer.json();
    return () => {
        if (!reported.has(name) && wrote(before, observer.json())) {
            reported.add(name);
            metrics.increment({ metricsName: `editor.migrate.${name}` });
        }
    };
};
