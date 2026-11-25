import type { Observer } from '@playcanvas/observer';

import { migrateAsset, migrateProjectSettings, migrateScene } from './migrate';
import type { MigrationDocument } from './migrate';
import { deepEqual } from './utils';

// a page load reports each kind once, after which its documents are no longer compared
const reported = new Set<string>();

// a page load reports each parity outcome once, so the counts stay per load as above
const compared = new Set<string>();

// documents of one kind compared per page load, so large scenes stay cheap to open
const PARITY_MAX = 200;

// mismatch paths are kept short so the metric names stay few
const PATH_DEPTH = 3;

const checked = new Map<string, number>();

type Doc = MigrationDocument;

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Whether `after` adds or changes a value of `before`. Removals don't count, as some
 * migrations drop fields locally on every load.
 *
 * @param before - The document before.
 * @param after - The document after.
 * @returns True when something was written.
 */
const wrote = (before: unknown, after: unknown) => {
    if (object(before) && object(after)) {
        return Object.keys(after).some((k) => !Object.hasOwn(before, k) || wrote(before[k], after[k]));
    }
    return !deepEqual(before, after);
};

/**
 * The first path where the editor's migration and the shared one disagree on a value either of
 * them adds or changes. A field the editor drops locally is not a disagreement.
 *
 * @param before - The document before either migration.
 * @param editor - The document after the editor's migration.
 * @param shared - The document after the shared migration.
 * @param path - The path so far.
 * @returns The path, or null when they agree.
 */
const drift = (before: unknown, editor: unknown, shared: unknown, path: string[] = []): string[] | null => {
    if (object(editor) && object(shared)) {
        const b = object(before) ? before : {};
        for (const k of new Set([...Object.keys(editor), ...Object.keys(shared)])) {
            if (k === 'schema_version' && !path.length) {
                continue;
            }

            // the editor unsets some legacy fields locally that the shared migration keeps
            if (!Object.hasOwn(editor, k) && Object.hasOwn(shared, k) && deepEqual(b[k], shared[k])) {
                continue;
            }
            const found = drift(b[k], editor[k], shared[k], [...path, k]);
            if (found) {
                return found;
            }
        }
        return null;
    }
    return deepEqual(editor, shared) ? null : path;
};

/**
 * Runs the shared migration that matches an editor migration kind.
 *
 * @param kind - The editor migration kind.
 * @param doc - The document before migrating.
 * @returns The migrated document, or null when no shared migration covers the kind.
 */
const runShared = (kind: string, doc: Doc) => {
    if (kind.startsWith('asset.')) {
        return migrateAsset(doc).doc;
    }
    if (kind === 'entity') {
        return migrateScene({ entities: { e: doc } }).doc.entities.e as Doc;
    }
    if (kind === 'settings.scene') {
        return migrateScene({ settings: doc }).doc.settings as Doc;
    }
    if (kind === 'settings.project') {
        return migrateProjectSettings(doc).doc;
    }
    return null;
};

/**
 * Starts tracking a load-time migration, to count the page loads where it still writes to a
 * document, and whether the shared migration gives the same result.
 *
 * @param kind - What is migrated, used in the metric name.
 * @param observer - The document being migrated.
 * @param stored - The document as stored, when the observer also holds defaults the backend never
 * sees. Only its keys are read, before the migration runs, so it is not copied.
 * @returns Call once the migration has run.
 */
export const trackMigration = (kind: string, observer: Observer, stored?: Doc) => {
    const name = kind.replace(/[^\w.]/g, '_');
    const { metrics } = globalThis as { metrics?: { increment: (m: { metricsName: string }) => void } };
    const count = checked.get(name) ?? 0;
    if (!metrics || (reported.has(name) && count >= PARITY_MAX)) {
        return () => undefined;
    }
    checked.set(name, count + 1);
    const before = observer.json() as Doc;

    // the stored values are those in `before`, so only which keys are stored needs keeping
    const storedKeys = stored && count < PARITY_MAX ? Object.keys(stored) : null;
    return () => {
        const after = observer.json();
        if (!reported.has(name) && wrote(before, after)) {
            reported.add(name);
            metrics.increment({ metricsName: `editor.migrate.${name}` });
        }

        if (count >= PARITY_MAX) {
            return;
        }
        let shared: Doc | null | undefined;
        try {
            const doc = storedKeys ? Object.fromEntries(storedKeys.filter((k) => Object.hasOwn(before, k)).map((k) => [k, before[k]])) : before;
            const migrated = runShared(kind, doc);

            // the backend migrates the stored document, so defaults are layered on after, as the editor does
            shared = storedKeys && migrated ? { ...before, ...migrated } : migrated;
        } catch {
            shared = undefined;
        }

        // parity is only worth sending for documents a migration still touches
        let outcome: string;
        if (shared === undefined) {
            outcome = `error.${name}`;
        } else if (!shared || (!wrote(before, after) && !wrote(before, shared))) {
            return;
        } else {
            const path = drift(before, after, shared);
            outcome = path
                ? `mismatch.${name}.${
                      path
                          .slice(0, PATH_DEPTH)
                          .join('.')
                          .replace(/[^\w.]/g, '_') || 'root'
                  }`
                : `match.${name}`;
        }
        if (!compared.has(outcome)) {
            compared.add(outcome);
            metrics.increment({ metricsName: `editor.migrate.parity.${outcome}` });
        }
    };
};
