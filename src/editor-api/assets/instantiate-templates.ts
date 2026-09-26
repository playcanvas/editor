import type { Asset } from '../asset';
import { createEntity } from '../entities/create';
import type { Entity } from '../entity';
import { globals as api } from '../globals';

import { buildInstance, nest } from './template-instance';

const USE_BACKEND_LIMIT = 500;

// the fields the Entity constructor keeps as given
const FIELDS = [
    'resource_id',
    'name',
    'parent',
    'children',
    'enabled',
    'tags',
    'position',
    'rotation',
    'scale',
    'components',
    'template',
    'template_id',
    'template_ent_ids'
];

let evtMessenger: any;

const isObject = (v: any) => !!v && typeof v === 'object' && !Array.isArray(v);

// entity data the Entity constructor would store unchanged
const isPlain = (e: any) => {
    return (
        isObject(e) &&
        Object.keys(e).length === FIELDS.length &&
        FIELDS.every((k) => Object.hasOwn(e, k)) &&
        typeof e.name === 'string' &&
        typeof e.enabled === 'boolean' &&
        isObject(e.components) &&
        Array.isArray(e.children) &&
        ['tags', 'position', 'rotation', 'scale'].every((k) => e[k])
    );
};

// one root, and every entity reached exactly once through children that point back to it
function isTree(entities: Record<string, any>) {
    const ids = Object.keys(entities);
    const roots = ids.filter((id) => !entities[id]?.parent);
    if (roots.length !== 1 || !ids.every((id) => isPlain(entities[id]) && entities[id].resource_id === id)) {
        return false;
    }

    const seen = new Set(roots);
    for (const id of seen) {
        for (const c of entities[id].children) {
            if (seen.has(c) || entities[c]?.parent !== id) {
                return false;
            }
            seen.add(c);
        }
    }
    return seen.size === ids.length;
}

// attributes by script name, as the pipeline loads them from every script asset
function scriptDefs() {
    const defs: Record<string, any> = Object.create(null);
    const dups = new Set<string>();
    api.assets.list().forEach((a: Asset) => {
        if (a.get('type') !== 'script') return;
        const scripts = a.get('data.scripts') || {};
        for (const n in scripts) {
            if (n in defs) dups.add(n);
            defs[n] = scripts[n]?.attributes;
        }
    });
    return { defs, dups };
}

/**
 * Plain instantiation of loaded, well-formed templates below the backend limit runs in the
 * editor. A script name defined by two assets may resolve to another definition than in the
 * pipeline, so templates using one stay on the backend.
 *
 * @param assets - The template assets
 * @param parent - The parent entity
 * @param options - The instantiation options
 * @returns The template entities and script attributes to build with, or null for the backend
 */
function prepareLocal(assets: Asset[], parent: Entity, options: { index?: number; extraData?: any }) {
    const index = options.index ?? 0;
    if (
        options.extraData ||
        !api.schema ||
        !api.entities.get(parent.get('resource_id')) ||
        !Number.isInteger(index) ||
        index < 0 ||
        index > parent.get('children').length
    ) {
        return null;
    }

    const templates = assets.map((asset) => asset.get('data.entities'));
    const count = templates.reduce((n, entities) => n + (isObject(entities) ? Object.keys(entities).length : 0), 0);
    if (count > USE_BACKEND_LIMIT || !templates.every((entities) => isObject(entities) && isTree(entities))) {
        return null;
    }

    // entities added from the server get schema defaults in the editor but not in the scene,
    // which a local create can't match, so components missing any stay on the backend
    const defaults = new Map<string, string[]>();
    const complete = (c: string, data: any) => {
        if (!defaults.has(c)) {
            defaults.set(c, Object.keys(api.schema.components.getDefaultData(c)));
        }
        return isObject(data) && defaults.get(c).every((k) => Object.hasOwn(data, k));
    };
    const ents = templates.flatMap((entities) => Object.values(entities));
    if (!ents.every((e: any) => Object.keys(e.components).every((c) => complete(c, e.components[c])))) {
        return null;
    }

    const { defs, dups } = scriptDefs();
    const scripts = ents.flatMap((e: any) => Object.keys(e.components.script?.scripts || {}));
    return scripts.some((n) => dups.has(n)) ? null : { templates, defs };
}

function instantiateLocally(
    assets: Asset[],
    parent: Entity,
    { templates, defs }: { templates: any[]; defs: Record<string, any> },
    options: { index?: number; history?: boolean; select?: boolean }
) {
    const comps = api.schema.getFields(api.schema.getComponents());
    const fields = new Map<string, string[]>();
    const ctx = {
        // top-level fields typed entity, as the pipeline's ComponentEntityPaths
        entityFields: (c: string) => {
            if (!fields.has(c)) {
                const f = Object.hasOwn(comps, c) ? api.schema.getFields(comps[c]) : {};
                fields.set(
                    c,
                    Object.keys(f).filter((k) => api.schema.getType(f[k]) === 'entity')
                );
            }
            return fields.get(c);
        },
        scriptAttrs: (s: string) => defs[s]
    };

    // the backend inserts at 0 when no index is given
    const index = options.index ?? 0;
    const parentId = parent.get('resource_id');
    let entities = assets.map((asset, i) => {
        const template = { id: parseInt(asset.get('id'), 10), name: asset.get('name'), entities: templates[i] };
        const res = buildInstance(template, parentId, ctx);
        return createEntity(nest(res.entities, res.rootId), { index: index + i, history: false });
    });

    const select = () => {
        if (options.select) {
            api.selection.set(entities, { history: false });
        }
    };

    if (api.history && (options.history || options.history === undefined)) {
        let data: any[] = null;

        api.history.add({
            name: 'instantiate templates',
            combine: false,
            undo: () => {
                const latest = entities.map((e) => e.latest()).filter((e) => !!e);
                data = latest.map((e) => e.jsonHierarchy());
                if (latest.length) {
                    api.entities.delete(latest, { history: false }).catch((err) => {
                        console.error(err);
                    });
                }
            },
            redo: () => {
                if (!api.entities.get(parentId) || !data) {
                    return;
                }

                // same resource ids as before undo, selected again like the backend redo
                entities = data.map((d, i) => createEntity(d, { index: index + i, history: false }));
                data = null;
                select();
            }
        });
    }

    select();
    return entities;
}

async function instantiateTemplates(
    assets: Asset[],
    parent: any,
    options: { index?: number; extraData?: any; history?: boolean; select?: boolean } = {}
) {
    parent = parent || api.entities.root;
    if (!parent) {
        throw new Error('Invalid parent');
    }

    const local = prepareLocal(assets, parent, options);
    if (local) {
        return instantiateLocally(assets, parent, local, options);
    }

    // setup promise
    const deferred: any = {
        resolve: null,
        reject: null
    };

    const promise = new Promise<Entity[]>((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    // start job
    const jobId = api.jobs.start((msg: any) => {
        // resolve promise
        if (msg.status === 'success') {
            const newEntityIds = msg.multTaskResults.map((d: any) => d.newRootId);
            api.entities.waitToExist(newEntityIds, 5000, (entities: any[]) => {
                deferred.resolve(entities);
            });
        } else {
            deferred.reject();
        }
    });

    // subscribe to messenger for backend response
    if (!evtMessenger) {
        evtMessenger = api.messenger.on('template.instance', (msg: any) => {
            const callback = api.jobs.finish(msg.job_id);
            if (callback) {
                callback(msg);
            }
        });
    }

    // start backend job
    api.realtime.connection.sendMessage('pipeline', {
        name: 'template-instance',
        data: {
            projectId: api.projectId,
            branchId: api.branchId,
            parentId: parent.get('resource_id'),
            sceneId: api.realtime.scenes.current.uniqueId,
            jobId: jobId,
            children: parent.get('children'),
            childIndex: options.index,
            templates: assets.map((asset: any) => {
                return {
                    id: parseInt(asset.get('uniqueId'), 10),
                    opts: options.extraData
                };
            })
        }
    });

    let entities = await promise;

    // record history action
    if (api.history && (options.history || options.history === undefined)) {
        api.history.add({
            name: 'instantiate templates',
            combine: false,
            undo: () => {
                // delete entities
                entities = entities.map((e: any) => e.latest()).filter((e: any) => !!e);
                if (entities.length) {
                    api.entities.delete(entities, { history: false }).catch((err) => {
                        console.error(err);
                    });
                }
            },
            redo: () => {
                parent = parent.latest();
                if (!parent) {
                    return;
                }

                const newOptions = Object.assign({}, options);
                newOptions.history = false;

                // re-instantiate templates
                instantiateTemplates(assets, parent, newOptions)
                    .then((newEntities) => {
                        entities = newEntities;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }
        });
    }

    if (options.select) {
        api.selection.set(entities, { history: false });
    }

    return entities;
}

export { instantiateTemplates };
