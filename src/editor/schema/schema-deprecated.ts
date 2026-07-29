import type { Observer } from '@playcanvas/observer';

import { formatter as f } from '@/common/utils';
import { config } from '@/editor/config';

/**
 * A schema field that is kept declared so existing documents stay valid, but is no longer
 * processed, carries a `$deprecated` marker holding the guidance for whoever still has data in
 * it. Rather than keeping a dead inspector panel alive for every removed feature, this reports
 * the leftovers to the console once, with a click that selects whatever is carrying them.
 *
 * Marking a field in shared-libs is all it takes to appear here - see `EDITOR_FIELDS` in
 * `shared-libs/lib/model.js` for how the marker reaches the editor.
 */
type Deprecated = {
    path: string;
    message: string;
    def: unknown;
    hasDefault: boolean;
};

const collect = (node: unknown, prefix: string[] = []): Deprecated[] => {
    if (node === null || typeof node !== 'object') {
        return [];
    }

    const schema = node as Record<string, unknown>;
    const found: Deprecated[] = [];

    if (typeof schema.$deprecated === 'string') {
        found.push({
            path: prefix.join('.'),
            message: schema.$deprecated,
            def: schema.$default,
            hasDefault: Object.prototype.hasOwnProperty.call(schema, '$default')
        });
    }

    if (schema.$of) {
        found.push(...collect(schema.$of, [...prefix, '*']));
    }

    for (const key of Object.keys(schema)) {
        if (!key.startsWith('$')) {
            found.push(...collect(schema[key], [...prefix, key]));
        }
    }

    return found;
};

// a field sitting at its declared default is not worth mentioning - most documents carry one
// because the editor used to write it. only divergent or optional-and-present data is signal
const isNotable = (field: Deprecated, value: unknown) => {
    if (value === undefined || value === null) {
        return false;
    }
    return !field.hasDefault || JSON.stringify(value) !== JSON.stringify(field.def);
};

editor.once('load', () => {
    const settingsFields = collect(config.schema.settings);
    const sceneFields = collect(config.schema.scene);

    const reportSettings = (observer: Observer, fields: Deprecated[], strip = '') => {
        if (!observer) {
            return;
        }
        for (const field of fields) {
            const path = field.path.slice(strip.length);
            const value = observer.get(path);
            if (isNotable(field, value)) {
                editor.call(
                    'console:log:settings',
                    observer,
                    `${f.path(path)} is set to ${f.value(value)} but is no longer used. ${field.message}`
                );
            }
        }
    };

    editor.on('settings:project:load', () => {
        reportSettings(editor.call('settings:project'), settingsFields);
    });

    editor.on('sceneSettings:load', (settings: Observer) => {
        const fields = sceneFields.filter((field) => field.path.startsWith('settings.'));
        reportSettings(settings, fields, 'settings.');
    });

    editor.on('entities:load', () => {
        const prefix = 'entities.*.';
        const fields = sceneFields.filter((field) => field.path.startsWith(prefix));
        if (!fields.length) {
            return;
        }

        const entities = editor.call('entities:list');
        for (const field of fields) {
            const path = field.path.slice(prefix.length);
            const carriers = entities.filter((entity: Observer) => isNotable(field, entity.get(path)));
            if (!carriers.length) {
                continue;
            }

            const names = carriers.map((entity: Observer) => f.entity(entity)).join(', ');
            const noun = carriers.length === 1 ? 'entity' : 'entities';
            const [uiMsg, verboseMsg] = f.parse(
                `${carriers.length} ${noun} still use ${f.path(path)}, which is no longer used. ${field.message}<< On: ${names}>>`
            );
            editor.call('console:log', uiMsg, verboseMsg, () => {
                editor.call('selector:set', 'entity', carriers);
            });
        }
    });
});
