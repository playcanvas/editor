import type { BrowserContext, Page } from '@playwright/test';

import { arm } from './arm';
import { waitForParser } from './common';
import { HOST, editorSceneUrl } from './config';
import { JOB_TIMEOUT } from './constants';
import { expect, type Project } from './fixtures';
import { EditorShell } from './pages/common';
import { waitForEditor } from './ready';
import { uniqueName } from './utils';

/** A template asset as the scene holds it: the input the pipeline builds an instance from. */
export type Template = { id: number; name: string; entities: Record<string, any> };

/** An entity read back from the scene, children nested in order. */
export type Tree = Record<string, any> & { resource_id: string; children: Tree[] };

/** The templates a case made, and the ids outside them that template fields point at. */
export type Built = { assets: number[]; outside: string[] };

export type TemplateCase = { name: string; build: (page: Page) => Promise<Built> };

/** `instantiateTemplates` options. */
export type Options = { index?: number; extraData?: any; history?: boolean; select?: boolean };

/** Nested entity spec; a component string `$key` becomes the resource id of the entity with that key. */
type Spec = {
    key: string;
    name: string;
    position?: number[];
    rotation?: number[];
    scale?: number[];
    components?: Record<string, any>;
    children?: Spec[];
};

// above this many entities the editor always leaves instantiation to the backend
export const BACKEND_LIMIT = 500;

const SCRIPT = (name: string) => `var S = pc.createScript('${name}');
S.attributes.add('target', { type: 'entity' });
S.attributes.add('targets', { type: 'entity', array: true });
S.attributes.add('speed', { type: 'number', default: 3 });
S.attributes.add('cfg', { type: 'json', schema: [{ name: 'ent', type: 'entity' }, { name: 'n', type: 'number' }] });
S.attributes.add('cfgs', { type: 'json', array: true, schema: [{ name: 'ent', type: 'entity' }] });
`;

// the same script name with target read as a number
const SCRIPT_NUMBER = (name: string) => `var S = pc.createScript('${name}');
S.attributes.add('target', { type: 'number' });
`;

/** Creates `spec` under the scene root and one entity outside it, then fills `$key` references. */
const createHierarchy = (page: Page, spec: Spec) => page.evaluate((spec) => {
    const api = window.editor.api.globals as any;
    const ids: Record<string, string> = {};
    ids.outside = api.entities.create({ name: 'outside' }, { history: false }).get('resource_id');
    const make = (s: any, parent: any) => {
        const { name, position, rotation, scale } = s;
        const e = api.entities.create({ name, position, rotation, scale, parent }, { history: false });
        ids[s.key] = e.get('resource_id');
        (s.children || []).forEach((c: any) => make(c, e));
    };
    make(spec, api.entities.root);
    const swap: (v: any) => any = (v) => {
        if (typeof v === 'string' && v.startsWith('$')) return ids[v.slice(1)];
        if (Array.isArray(v)) return v.map(swap);
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
        return v;
    };
    const fill = (s: any) => {
        const e = api.entities.get(ids[s.key]);
        for (const c in s.components || {}) e.addComponent(c, swap(s.components[c]));
        (s.children || []).forEach(fill);
    };
    fill(spec);
    return ids;
}, spec);

/** Makes the entity a template (it becomes an instance of it) and returns the asset id. */
const templateFrom = async (page: Page, root: string) => {
    await new EditorShell(page).flushScene();
    return page.evaluate(async (root) => {
        const api = window.editor.api.globals as any;
        const asset = await api.assets.createTemplate({ entity: api.entities.get(root) });
        return Number(asset.get('id'));
    }, root);
};

/** Renames an asset over rest, as the inspector does but without history, and waits for the scene to see it. */
const renameAsset = async (page: Page, id: number, name: string) => {
    const renamed = await arm(page, ([id, name]: [number, string]) => {
        const api = window.editor.api.globals as any;
        const asset = api.assets.get(id);
        return { done: new Promise<void>((resolve, reject) => {
            const evt = asset.on('name:set', (value: string) => {
                if (value === name) {
                    evt.unbind();
                    resolve();
                }
            });
            api.rest.assets.assetUpdate(String(id), { name }).on('error', (status: number, err: unknown) => {
                evt.unbind();
                reject(new Error(`rename of ${id} failed: ${status} ${err}`));
            });
        }) };
    }, [id, name], { what: `asset ${id} renamed`, timeout: JOB_TIMEOUT });
    await renamed();
};

const fromSpec = async (page: Page, spec: Spec) => {
    const ids = await createHierarchy(page, spec);
    return { assets: [await templateFrom(page, ids[spec.key])], outside: [ids.outside] };
};

/** Creates a classic script asset and waits until its attributes are parsed. */
const createScript = async (page: Page, filename: string, name: string, text: string) => {
    await waitForParser(page);
    const id = await page.evaluate(async ([filename, text]) => {
        const asset = await (window.editor.api.globals as any).assets.createScript({ filename, text });
        return Number(asset.get('id'));
    }, [filename, text] as const);
    const parsed = await arm(page, ([id, name]: [number, string]) => {
        const asset = (window.editor.api.globals as any).assets.get(id);
        const has = () => !!asset.get('data.scripts')?.[name];
        return { done: has() ? Promise.resolve() : new Promise<void>((resolve) => {
            const evt = asset.on('*:set', () => {
                if (has()) {
                    evt.unbind();
                    resolve();
                }
            });
        }) };
    }, [id, name], { what: `parsed attributes of ${name}`, timeout: JOB_TIMEOUT });
    await parsed();
    return id;
};

export const CASES: TemplateCase[] = [
    {
        name: 'single entity',
        build: async (page) => {
            const built = await fromSpec(page, { key: 'r', name: uniqueName('lamp'), components: { light: { type: 'omni', intensity: 2 } } });

            // the template's root keeps the entity name, so the instance root can only get this from the asset
            await renameAsset(page, built.assets[0], uniqueName('lamp-asset'));
            return built;
        }
    },
    {
        name: 'three-level hierarchy',
        build: page => fromSpec(page, {
            key: 'r',
            name: uniqueName('rig'),
            position: [1, 2, 3],
            children: [
                { key: 'a', name: 'A', position: [0, 1, 0], children: [{ key: 'a1', name: 'A1', scale: [2, 2, 2] }] },
                { key: 'b', name: 'B', rotation: [0, 90, 0] }
            ]
        })
    },
    {
        name: 'nested template',
        build: async (page) => {
            const ids = await createHierarchy(page, {
                key: 'r',
                name: uniqueName('outer'),
                children: [{ key: 'x', name: 'Inner', children: [{ key: 'xc', name: 'InnerChild', components: { light: {} } }] }]
            });

            // Inner becomes an instance of its own template before Outer is templated around it
            await templateFrom(page, ids.x);
            return { assets: [await templateFrom(page, ids.r)], outside: [ids.outside] };
        }
    },
    {
        name: 'entity references in and out of the template',
        build: page => fromSpec(page, {
            key: 'r',
            name: uniqueName('panel'),
            children: [
                { key: 'img', name: 'Image' },
                { key: 'btn', name: 'Button', components: { button: { imageEntity: '$img' }, render: { type: 'box', rootBone: '$outside' } } },
                { key: 'up', name: 'Up', components: { button: { imageEntity: '$r' } } }
            ]
        })
    },
    {
        name: 'script attributes',
        build: async (page) => {
            const script = uniqueName('mover');
            await createScript(page, `${script}.js`, script, SCRIPT(script));
            const attributes = { target: '$a', targets: ['$b', '$outside'], speed: 3, cfg: { ent: '$a', n: 1 }, cfgs: [{ ent: '$b' }, { ent: '$outside' }] };
            return fromSpec(page, {
                key: 'r',
                name: uniqueName('scripted'),
                children: [
                    { key: 'a', name: 'A' },
                    { key: 'b', name: 'B', components: { script: { enabled: true, order: [script], scripts: { [script]: { enabled: true, attributes } } } } }
                ]
            });
        }
    },
    {
        name: 'asset references',
        build: async (page) => {
            const mat = await page.evaluate(async (name) => {
                const asset = await (window.editor.api.globals as any).assets.createMaterial({ name });
                return Number(asset.get('id'));
            }, uniqueName('mat'));
            return fromSpec(page, { key: 'r', name: uniqueName('crate'), components: { render: { type: 'box', materialAssets: [mat] } } });
        }
    }
];

/** A template of `count` children under one root, so `count + 1` entities. */
export const buildBig = (page: Page, count: number) => fromSpec(page, {
    key: 'r',
    name: uniqueName('big'),
    children: Array.from({ length: count }, (_, i) => ({ key: `c${i}`, name: `C${i}` }))
});

/** Two script assets define one script name; the template uses it with a self reference. */
export const buildDuplicateScripts = async (page: Page) => {
    const script = uniqueName('dup');
    await createScript(page, `${script}.js`, script, SCRIPT(script));
    await createScript(page, `${script}-number.js`, script, SCRIPT_NUMBER(script));
    const built = await fromSpec(page, {
        key: 'r',
        name: uniqueName('dup'),
        components: { script: { enabled: true, order: [script], scripts: { [script]: { enabled: true, attributes: { target: '$r' } } } } }
    });
    return { ...built, script };
};

/** A fresh parent under the scene root with `count` plain children. */
export const makeParent = (page: Page, count = 0) => page.evaluate(([name, count]) => {
    const api = window.editor.api.globals as any;
    const parent = api.entities.create({ name }, { history: false });
    const children = Array.from({ length: count }, (_, i) => {
        return api.entities.create({ name: `kid${i}`, parent }, { history: false }).get('resource_id') as string;
    });
    return { id: parent.get('resource_id') as string, children };
}, [uniqueName('parent'), count] as const);

/** Instantiates through the public api, the path every caller takes, and returns the root ids. */
export const instantiate = async (page: Page, assets: number[], parent: string, options: Options = {}) => {
    await new EditorShell(page).flushScene();
    return page.evaluate(async ({ assets, parent, options }) => {
        const api = window.editor.api.globals as any;
        const roots = await api.assets.instantiateTemplates(assets.map((id: number) => api.assets.get(id)), api.entities.get(parent), options);
        return roots.map((e: any) => e.get('resource_id') as string);
    }, { assets, parent, options });
};

export const historyStep = (page: Page, step: 'undo' | 'redo') => page.evaluate((step) => {
    (window.editor.api.globals as any).history[step]();
}, step);

export const removeEntity = async (page: Page, id: string) => {
    await page.evaluate(id => (window.editor.api.globals as any).entities.get(id).delete({ history: false }), id);
    await new EditorShell(page).flushScene();
};

/** Runs the inspector's REVERT ALL and resolves with the root that replaces the instance. */
export const revertAll = (page: Page, root: string) => page.evaluate(root => new Promise<string>((resolve, reject) => {
    const editor = window.editor as any;
    const ok = editor.call('templates:revertAll', editor.api.globals.entities.get(root).observer, (e: any) => resolve(e.get('resource_id')));
    if (!ok) {
        reject(new Error(`${root} is not a template instance`));
    }
}), root);

/** Reads an entity and its descendants; null while the entity hasn't arrived (e.g. on a collaborator). */
export const findTree = (page: Page, id: string) => page.evaluate((id) => {
    const read: (e: any) => any = e => ({ ...e.json(), children: e.children.map(read) });
    const e = (window.editor.api.globals as any).entities.get(id);
    return e ? read(e) : null;
}, id) as Promise<Tree | null>;

export const readTree = async (page: Page, id: string) => {
    const tree = await findTree(page, id);
    if (!tree) {
        throw new Error(`entity ${id} is not in the scene`);
    }
    return tree;
};

export const readTemplate = (page: Page, id: number) => page.evaluate((id) => {
    const asset = (window.editor.api.globals as any).assets.get(id);
    return { id, name: asset.get('name'), entities: asset.get('data.entities') };
}, id) as Promise<Template>;

/** What the template inspector counts: conflicts plus added and deleted entities. */
export const overrideCount = (page: Page, id: string) => page.evaluate((id) => {
    const editor = window.editor as any;
    return editor.call('templates:computeFilteredOverrides', editor.call('entities:get', id)).totalOverrides as number;
}, id);

export const selectedIds = (page: Page) => page.evaluate(() => {
    return (window.editor.api.globals as any).selection.items.map((e: any) => e.get('resource_id') as string);
}) as Promise<string[]>;

export const existing = (page: Page, ids: string[]) => page.evaluate((ids) => {
    return ids.filter(id => !!(window.editor.api.globals as any).entities.get(id));
}, ids);

export const treeIds: (tree: Tree) => string[] = tree => [tree.resource_id, ...tree.children.flatMap(treeIds)];

/**
 * Asserts the pipeline's template-instance rules against the template itself: every template
 * entity copied once under a fresh id, structure and fields unchanged, references to entities in
 * the template remapped, references to `outside` entities nulled, and the root linked to the template.
 */
export const expectInstance = (tree: Tree, tpl: Template, parent: string, outside: string[] = []) => {
    const dstToSrc = tree.template_ent_ids as Record<string, string>;
    const srcToDst = Object.fromEntries(Object.entries(dstToSrc).map(([d, s]) => [s, d]));
    const nodes: Tree[] = [];
    const collect = (e: Tree) => {
        nodes.push(e);
        e.children.forEach(collect);
    };
    collect(tree);

    expect(nodes.map(e => e.resource_id).sort()).toEqual(Object.keys(dstToSrc).sort());
    expect(Object.values(dstToSrc).sort()).toEqual(Object.keys(tpl.entities).sort());
    expect(nodes.filter(e => tpl.entities[e.resource_id])).toEqual([]);
    expect(tree).toMatchObject({ parent, name: tpl.name, template_id: tpl.id });

    // the server remaps entity-typed fields only; in this matrix only those hold entity ids
    const swap: (v: any) => any = (v) => {
        if (typeof v === 'string') return srcToDst[v] ?? (outside.includes(v) ? null : v);
        if (Array.isArray(v)) return v.map(swap);
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
        return v;
    };
    for (const e of nodes) {
        const src = tpl.entities[dstToSrc[e.resource_id]];
        if (e !== tree) {
            expect(e.name).toBe(src.name);
            expect(e.parent).toBe(srcToDst[src.parent]);
            expect(e.template_id ?? null).toBe(src.template_id ?? null);
            const ids = src.template_ent_ids ?? {};
            expect(Object.keys(e.template_ent_ids ?? {}).sort()).toEqual(Object.keys(ids).map(k => srcToDst[k]).sort());
            expect(Object.values(e.template_ent_ids ?? {}).sort()).toEqual(Object.values(ids).sort());
            for (const k in ids) {
                if (srcToDst[k]) {
                    expect(e.template_ent_ids[srcToDst[k]]).toBe(ids[k]);
                }
            }
        }
        expect(e.children.map(c => dstToSrc[c.resource_id])).toEqual(src.children);
        for (const k of ['enabled', 'tags', 'position', 'rotation', 'scale']) {
            expect(e[k]).toEqual(src[k]);
        }
        expect(e.components).toEqual(swap(src.components));
    }
};

/**
 * Puts a value into an order that doesn't depend on who created the entities, so a normalizer
 * that numbers ids by first sight numbers equal structures the same: object keys sorted, and each
 * `template_ent_ids` map turned into [dst, src] pairs sorted by src.
 */
export const canonical: (v: any) => any = (v) => {
    if (Array.isArray(v)) return v.map(canonical);
    if (!v || typeof v !== 'object') return v;
    return Object.fromEntries(Object.keys(v).sort().map((k) => {
        if (k === 'template_ent_ids' && v[k]) {
            return [k, Object.entries(v[k]).sort(([, a]: any, [, b]: any) => (a < b ? -1 : a > b ? 1 : 0))];
        }
        return [k, canonical(v[k])];
    }));
};

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Replaces guids (values and keys) with `known` tokens, or `ID<n>` numbered by first sight. */
export const tokenize = (value: unknown, known: Record<string, string> = {}) => {
    const ids = new Map(Object.entries(known));
    let next = 0;
    const token = (s: string) => {
        if (!ids.has(s)) {
            ids.set(s, `ID${next++}`);
        }
        return ids.get(s);
    };
    const walk: (v: unknown) => unknown = (v) => {
        if (typeof v === 'string') {
            return GUID.test(v) || ids.has(v) ? token(v) : v;
        }
        if (Array.isArray(v)) {
            return v.map(walk);
        }
        if (v && typeof v === 'object') {
            return Object.fromEntries(Object.entries(v).map(([k, x]) => [GUID.test(k) || ids.has(k) ? token(k) : k, walk(x)]));
        }
        return v;
    };
    return walk(value);
};

/** Gives the collaborator write access and opens the worker's scene in its context. */
export const joinScene = async (host: Page, context: BrowserContext, project: Project) => {
    const who = await (await context.request.get(`https://${HOST}/api/id`)).json();
    const user = await (await context.request.get(`https://${HOST}/api/users/${who.id}`)).json();

    // the invitee field is `user`, as the team picker sends it
    await host.evaluate(({ projectId, username }) => {
        const collab = { user: username, access_level: 'write' } as any;
        return (window.editor.api.globals as any).rest.projects.projectCollabCreate(projectId, collab).promisify();
    }, { projectId: project.id, username: user.username as string });
    const page = await context.newPage();

    // access is granted by now, so a scene that never loads must not keep it
    const err = await page.goto(editorSceneUrl(project.sceneId, { disableBubbles: true })).then(() => waitForEditor(page)).then(() => null, (e: unknown) => e);
    if (err) {
        await leaveScene(host, context, project, who.id);
        throw err;
    }
    return { id: who.id as number, page };
};

/** Closes the collaborator's pages and revokes its access. */
export const leaveScene = async (host: Page, context: BrowserContext, project: Project, id: number) => {
    await Promise.all(context.pages().map(p => p.close()));
    await host.evaluate(({ projectId, id }) => new Promise<void>((resolve, reject) => {
        const req = (window.editor.api.globals as any).rest.projects.projectCollabDelete(projectId, id);
        req.on('load', () => resolve());

        // a 204 has no body, so ajax reports it as an error with a 2xx status
        req.on('error', (status: number) => (status >= 200 && status < 300 ? resolve() : reject(new Error(`revoke of ${id} failed: ${status}`))));
    }), { projectId: project.id, id });
};

/**
 * Sends the realtime job the backend branch of `instantiateTemplates` sends, with the same
 * undo/redo and select (`src/editor-api/assets/instantiate-templates.ts`), without going
 * through the public api. The oracle once `instantiate` stops always reaching the backend;
 * fidelity-gated against it in `template-instance.test.ts`.
 */
export const instantiateOnBackend = async (page: Page, assets: number[], parent: string, options: Options = {}) => {
    await new EditorShell(page).flushScene();
    return page.evaluate(({ assets, parent, options }) => {
        const api = window.editor.api.globals as any;

        const send = (parentId: string) => new Promise<any[]>((resolve, reject) => {
            const p = api.entities.get(parentId);
            const jobId = api.jobs.start((msg: any) => {
                if (msg.status !== 'success') {
                    reject(new Error('template-instance job failed'));
                    return;
                }
                api.entities.waitToExist(msg.multTaskResults.map((d: any) => d.newRootId), 5000, resolve);
            });

            // finishes any job like the api's own listener (either may win), but only leaves on its own
            const evt = api.messenger.on('template.instance', (msg: any) => {
                api.jobs.finish(msg.job_id)?.(msg);
                if (msg.job_id === jobId) {
                    evt.unbind();
                }
            });
            api.realtime.connection.sendMessage('pipeline', {
                name: 'template-instance',
                data: {
                    projectId: api.projectId,
                    branchId: api.branchId,
                    parentId,
                    sceneId: api.realtime.scenes.current.uniqueId,
                    jobId,
                    children: p.get('children'),
                    childIndex: options.index,
                    templates: assets.map((id: number) => ({ id: parseInt(api.assets.get(id).get('uniqueId'), 10), opts: options.extraData }))
                }
            });
        });

        const select = (entities: any[]) => {
            if (options.select) {
                api.selection.set(entities, { history: false });
            }
        };

        return send(parent).then((entities) => {
            if (api.history && (options.history || options.history === undefined)) {
                api.history.add({
                    name: 'instantiate templates',
                    combine: false,
                    undo: () => {
                        entities = entities.map((e: any) => e.latest()).filter(Boolean);
                        if (entities.length) {
                            api.entities.delete(entities, { history: false }).catch((err: unknown) => console.error(err));
                        }
                    },
                    redo: () => {
                        const p = api.entities.get(parent)?.latest();
                        if (!p) {
                            return;
                        }

                        // the api re-instantiates without history and selects again
                        send(p.get('resource_id')).then((fresh) => {
                            entities = fresh;
                            select(entities);
                        }).catch((err: unknown) => console.error(err));
                    }
                });
            }
            select(entities);
            return entities.map((e: any) => e.get('resource_id') as string);
        });
    }, { assets, parent, options });
};
