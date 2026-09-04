import fs from 'node:fs';

import { History, Observer, ObserverHistory } from '@playcanvas/observer';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ObserverSync } from '../../src/common/observer-sync';
import { RealtimeSchemaRepair, planSchemaRepair } from '../../src/common/realtime-schema-repair';
import type { JsonOp } from '../../src/common/realtime-schema-repair';
import { Schema } from '../../src/editor-api/schema';
import type {} from '../../types.d.ts';

const object = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({
    type: 'object',
    properties,
    required,
    additionalProperties: false
});

const map = (additionalProperties: unknown) => ({
    type: 'object',
    additionalProperties,
    'x-open-map': true
});

const nullable = (field: unknown, value: unknown = null) => ({
    anyOf: [field, { type: 'null' }],
    default: value
});

const schema = new Schema({
    version: 1,
    documents: {
        scene: object({
            entities: map(
                object({
                    resource_id: { type: 'string' },
                    name: { type: 'string', default: 'Entity' },
                    template: nullable({ type: 'number' }),
                    template_id: nullable({ type: 'number' }),
                    template_ent_ids: nullable(map({ type: 'string' })),
                    nested: { ...object({ enabled: { type: 'boolean', default: false } }), default: {} },
                    skipped: {
                        ...object({ enabled: { type: 'boolean', default: true } }),
                        default: {},
                        'x-skip-validation': true
                    }
                })
            )
        }),
        asset: object(
            {
                type: { type: 'string' },
                data: {},
                meta: {}
            },
            ['type']
        ),
        settings: object({}),
        user_data: object({
            cameras: object({
                perspective: object({
                    position: { type: 'array', items: { type: 'number' }, default: [9, 7, 9] },
                    rotation: { type: 'array', items: { type: 'number' }, default: [-25, 45, 0] },
                    focus: { type: 'array', items: { type: 'number' }, default: [0, 0, 0] },
                    orthoHeight: { type: 'number', default: 5 }
                }),
                top: { ...object({}, []), default: {} }
            })
        })
    },
    assetData: {
        material: object({
            opacity: { type: 'number', default: 1 }
        })
    },
    assetMeta: {
        material: object({
            invert: { type: 'boolean', default: false }
        })
    },
    settingsData: {
        project: object({ width: { type: 'number', default: 1280 } }),
        'project-user': object({
            checkpoint_id: { type: 'number', default: 0 },
            name: { type: 'string' },
            project: { type: 'number' },
            user: { type: 'number' },
            branch: { type: 'string' },
            editor: object({ cameraNearClip: { type: 'number', default: 0.1 } })
        }),
        user: object({ ide: object({ fontSize: { type: 'number', default: 12 } }) }),
        'project-private': object({})
    }
});

const clone = <T>(value: T) => JSON.parse(JSON.stringify(value)) as T;

const valueAt = (data: any, path: (string | number)[]) => {
    let value = data;
    for (const key of path) value = value[key];
    return value;
};

const apply = (data: any, ops: JsonOp[]) => {
    for (const op of ops) {
        const parent = valueAt(data, op.p.slice(0, -1));
        const key = op.p[op.p.length - 1];
        if (Object.hasOwn(op, 'oi')) {
            parent[key] = clone(op.oi);
        } else if (Object.hasOwn(op, 'od')) {
            delete parent[key];
        }
    }
};

const inverse = (ops: JsonOp[], before: unknown) => {
    return ops.map((op) => {
        const exists = Object.hasOwn(valueAt(before, op.p.slice(0, -1)), op.p[op.p.length - 1]);
        return exists
            ? { p: op.p.slice(), oi: clone(valueAt(before, op.p)), od: clone(op.oi) }
            : { p: op.p.slice(), od: clone(op.oi) };
    });
};

class Doc {
    data: any;

    submitSource = false;

    fetches = 0;

    submissions: { ops: JsonOp[]; repair: boolean }[] = [];

    sources: (object | undefined)[] = [];

    errors: string[];

    repairErrors: string[];

    beforeFetch?: () => void;

    remote: (ops: JsonOp[]) => void;

    constructor(
        data: unknown,
        remote: (ops: JsonOp[]) => void,
        errors = ['invalid:incomplete'],
        repairErrors: string[] = []
    ) {
        this.data = clone(data);
        this.remote = remote;
        this.errors = errors;
        this.repairErrors = repairErrors;
    }

    whenNothingPending(callback: () => void) {
        queueMicrotask(callback);
    }

    fetch(callback: (err?: Error) => void) {
        this.fetches++;
        this.beforeFetch?.();
        queueMicrotask(callback);
    }

    submitOp(ops: JsonOp[], options?: object | ((err?: Error) => void), callback?: (err?: Error) => void) {
        const done = typeof options === 'function' ? options : callback;
        const repair = typeof options === 'object' && (options as any).source?.schemaRepair === true;
        const before = clone(this.data);
        this.submissions.push({ ops: clone(ops), repair });
        this.sources.push(typeof options === 'object' ? clone(options) : undefined);
        apply(this.data, ops);

        const message = repair ? this.repairErrors.shift() : this.errors.shift();
        if (message) {
            const rollback = inverse(ops, before);
            apply(this.data, rollback);
            this.remote(rollback);
        }
        queueMicrotask(() => done?.(message ? new Error(message) : undefined));
    }
}

const setup = (
    data: unknown,
    prefix: (string | number)[],
    errors?: string[],
    repairErrors?: string[],
    tracked = true,
    observed: unknown = data
) => {
    const item = new Observer(prefix.reduce((value: any, key) => value[key], clone(observed)));
    const history = new History();
    if (tracked) item.history = new ObserverHistory({ item, history });
    const sync = new ObserverSync({ item, prefix });
    item.sync = sync;
    const steps: JsonOp[] = [];
    sync.on('sync', (op) => steps.push(clone(op)));
    const doc = new Doc(data, (ops) => ops.forEach((op) => sync.write(op)), errors, repairErrors);
    return { doc, history, item, steps, sync };
};

describe('realtime schema repair', () => {
    it('routes all four persisted Editor domains through the repair coordinator', () => {
        const scene = fs.readFileSync('src/editor-api/realtime/scene.ts', 'utf8');
        const asset = fs.readFileSync('src/editor-api/realtime/asset.ts', 'utf8');
        const settings = fs.readFileSync('src/editor/settings/settings.ts', 'utf8');
        const userdata = fs.readFileSync('src/editor/userdata/userdata-realtime.ts', 'utf8');

        for (const source of [scene, asset, settings, userdata]) {
            expect(source).to.include('new RealtimeSchemaRepair(');
            expect(source).to.include('repair.submit(op');
        }
        expect(settings).to.include("'settings', current.data, args.name");
        expect(settings).to.include('const data = { ...doc.data };');
        expect(settings).to.include('!ENVELOPE_KEYS.has(String(op.p[0]))');
        expect(userdata).to.include("'user_data', data.data");
    });

    it('repairs and reapplies a scene edit without adding rollback or repair history', async () => {
        const data = {
            entities: {
                entity: { resource_id: 'entity', name: 'Old', legacy: true, skipped: {} }
            }
        };
        const { doc, history, item, steps, sync } = setup(data, ['entities', 'entity']);
        let actions = 0;
        history.on('add', () => actions++);
        let pending: Promise<unknown>;
        const repair = new RealtimeSchemaRepair(
            doc,
            () => planSchemaRepair(schema, 'scene', doc.data),
            (ops) => ops.forEach((op) => sync.write(op))
        );
        sync.on('op', (op) => {
            pending = repair.submit(op);
        });

        item.set('name', 'New');
        expect(await pending).to.equal(undefined);

        expect(doc.submitSource).to.equal(true);
        expect(doc.fetches).to.equal(1);
        expect(doc.submissions.map(({ repair }) => repair)).to.deep.equal([false, true, false]);
        expect(doc.sources[1]).to.deep.equal({ source: { schemaRepair: true } });
        expect(doc.submissions[1].ops).to.deep.equal([
            { p: ['entities', 'entity', 'template'], oi: null },
            { p: ['entities', 'entity', 'template_id'], oi: null },
            { p: ['entities', 'entity', 'template_ent_ids'], oi: null },
            { p: ['entities', 'entity', 'nested'], oi: { enabled: false } }
        ]);
        expect(steps.map((op) => op.p.join('.'))).to.deep.equal([
            'entities.entity.name',
            'entities.entity.template',
            'entities.entity.template_id',
            'entities.entity.template_ent_ids',
            'entities.entity.nested',
            'entities.entity.name'
        ]);
        expect(item.json()).to.deep.equal({
            resource_id: 'entity',
            name: 'New',
            legacy: true,
            template: null,
            template_id: null,
            template_ent_ids: null,
            nested: { enabled: false },
            skipped: {}
        });
        expect(doc.data).to.deep.equal({ entities: { entity: item.json() } });
        expect(history.currentAction?.name).to.equal('name');
        expect(actions).to.equal(1);

        await history.undo();
        await pending;
        expect(item.get('name')).to.equal('Old');
        expect(doc.data.entities.entity.name).to.equal('Old');
        await history.redo();
        await pending;
        expect(item.get('name')).to.equal('New');
        expect(doc.data.entities.entity.name).to.equal('New');
        expect(actions).to.equal(1);
    });

    it('repairs an asset after a same-path writer conflict and preserves history and unknown data', async () => {
        const data = { type: 'material', name: 'Old', data: { legacy: true }, meta: {} };
        const { doc, history, item, steps, sync } = setup(data, [], undefined, ['invalid:repair-conflict']);
        let actions = 0;
        history.on('add', () => actions++);
        const repair = new RealtimeSchemaRepair(
            doc,
            () => planSchemaRepair(schema, 'asset', doc.data),
            (ops) => ops.forEach((op) => sync.write(op))
        );
        doc.beforeFetch = () => {
            if (doc.fetches !== 2) return;
            const ops = [{ p: ['data', 'opacity'], oi: 0.5 }];
            apply(doc.data, ops);
            doc.remote(ops);
        };
        let pending: Promise<unknown>;
        sync.on('op', (op) => {
            pending = repair.submit(op);
        });

        item.set('name', 'New');
        expect(await pending).to.equal(undefined);

        expect(doc.fetches).to.equal(2);
        expect(doc.submissions.map(({ repair }) => repair)).to.deep.equal([false, true, true, false]);
        expect(doc.submissions[2].ops).to.deep.equal([{ p: ['meta', 'invert'], oi: false }]);
        expect(doc.sources[1]).to.deep.equal({ source: { schemaRepair: true } });
        expect(doc.sources[2]).to.deep.equal({ source: { schemaRepair: true } });
        expect(steps.map((op) => op.p.join('.'))).to.deep.equal([
            'name',
            'data.opacity',
            'meta.invert',
            'data.opacity',
            'meta.invert',
            'name'
        ]);
        expect(item.get('data.opacity')).to.equal(0.5);
        expect(item.get('data.legacy')).to.equal(true);
        expect(item.get('meta.invert')).to.equal(false);
        expect(doc.data).to.deep.equal(item.json());
        expect(history.currentAction?.name).to.equal('name');
        expect(actions).to.equal(1);

        await history.undo();
        await pending;
        expect(item.get('name')).to.equal('Old');
        expect(doc.data).to.deep.equal(item.json());
        await history.redo();
        await pending;
        expect(item.get('name')).to.equal('New');
        expect(doc.data).to.deep.equal(item.json());
        expect(actions).to.equal(1);
    });

    it('uses the exact settings subtype and never synthesizes identity fields', async () => {
        const missing = planSchemaRepair(schema, 'settings', { editor: {} }, 'projectUser');
        expect(missing).to.deep.equal({ error: 'invalid:identity', op: [] });

        const data = { name: 'project-user', project: 1, user: 2, branch: 'main', editor: {}, legacy: true };
        const { doc, history, item, steps, sync } = setup(data, [], undefined, undefined, true, {
            branch: 'main',
            editor: {},
            legacy: true
        });
        let actions = 0;
        history.on('add', () => actions++);
        const repair = new RealtimeSchemaRepair(
            doc,
            () => planSchemaRepair(schema, 'settings', doc.data, 'projectUser'),
            (ops) =>
                ops
                    .filter((op) => !['checkpoint_id', 'name', 'project', 'user'].includes(String(op.p[0])))
                    .forEach((op) => sync.write(op))
        );
        let pending: Promise<unknown>;
        sync.on('op', (op) => {
            pending = repair.submit(op);
        });

        item.set('branch', 'feature');
        expect(await pending).to.equal(undefined);

        expect(doc.submissions[1]).to.deep.equal({
            repair: true,
            ops: [
                { p: ['checkpoint_id'], oi: 0 },
                { p: ['editor', 'cameraNearClip'], oi: 0.1 }
            ]
        });
        expect(doc.data.checkpoint_id).to.equal(0);
        expect(item.has('checkpoint_id')).to.equal(false);
        expect(item.has('width')).to.equal(false);
        expect(item.get('branch')).to.equal('feature');
        expect(doc.data).to.deep.equal({
            name: 'project-user',
            project: 1,
            user: 2,
            checkpoint_id: 0,
            ...item.json()
        });
        expect(steps.map((op) => op.p.join('.'))).to.deep.equal(['branch', 'editor.cameraNearClip', 'branch']);
        expect(history.currentAction?.name).to.equal('branch');
        expect(actions).to.equal(1);

        await history.undo();
        await pending;
        expect(item.get('branch')).to.equal('main');
        expect(doc.data).to.deep.equal({
            name: 'project-user',
            project: 1,
            user: 2,
            checkpoint_id: 0,
            ...item.json()
        });
        await history.redo();
        await pending;
        expect(item.get('branch')).to.equal('feature');
        expect(doc.data).to.deep.equal({
            name: 'project-user',
            project: 1,
            user: 2,
            checkpoint_id: 0,
            ...item.json()
        });
        expect(actions).to.equal(1);
    });

    it('repairs and converges user data without creating history', async () => {
        const data = {
            cameras: {
                perspective: {
                    position: [1, 2, 3],
                    rotation: [4, 5, 6],
                    focus: [0, 0, 0]
                }
            }
        };
        const { doc, history, item, steps, sync } = setup(data, [], undefined, undefined, false);
        const repair = new RealtimeSchemaRepair(
            doc,
            () => planSchemaRepair(schema, 'user_data', doc.data),
            (ops) => ops.forEach((op) => sync.write(op))
        );
        let pending: Promise<unknown>;
        sync.on('op', (op) => {
            pending = repair.submit(op);
        });

        item.set('cameras.perspective.position', [7, 8, 9]);
        expect(await pending).to.equal(undefined);

        expect(doc.submissions.map(({ repair }) => repair)).to.deep.equal([false, true, false]);
        expect(doc.submissions[1].ops).to.deep.equal([
            { p: ['cameras', 'perspective', 'orthoHeight'], oi: 5 },
            { p: ['cameras', 'top'], oi: {} }
        ]);
        expect(steps.map((op) => op.p.join('.'))).to.deep.equal([
            'cameras.perspective.position',
            'cameras.perspective.orthoHeight',
            'cameras.top',
            'cameras.perspective.position'
        ]);
        expect(item.get('cameras.perspective.position')).to.deep.equal([7, 8, 9]);
        expect(doc.data).to.deep.equal(item.json());
        expect(item.history).to.equal(undefined);
        expect(history.currentAction).to.equal(null);
    });

    it('stops user data after one failed original retry', async () => {
        const data = {
            cameras: {
                perspective: { position: [1, 2, 3], rotation: [4, 5, 6], focus: [0, 0, 0] }
            }
        };
        const { doc, item, sync } = setup(data, [], ['invalid:incomplete', 'invalid:incomplete'], undefined, false);
        const errors: unknown[] = [];
        const repair = new RealtimeSchemaRepair(
            doc,
            () => planSchemaRepair(schema, 'user_data', doc.data),
            (ops) => ops.forEach((op) => sync.write(op)),
            (err) => errors.push(err)
        );
        let pending: Promise<unknown>;
        sync.on('op', (op) => {
            pending = repair.submit(op);
        });

        item.set('cameras.perspective.position', [7, 8, 9]);
        const err = await pending;

        expect((err as Error).message).to.equal('invalid:incomplete');
        expect(doc.submissions.map(({ repair }) => repair)).to.deep.equal([false, true, false]);
        expect(errors).to.deep.equal([err]);
        expect(item.get('cameras.perspective.position')).to.deep.equal([1, 2, 3]);
        expect(doc.data).to.deep.equal(item.json());
    });

    it('bounds repeated repair conflicts to one refetch', async () => {
        const data = { entities: { entity: { resource_id: 'entity', name: 'Old' } } };
        const { doc, item, sync } = setup(data, ['entities', 'entity'], undefined, [
            'invalid:repair-conflict',
            'invalid:repair-conflict'
        ]);
        const repair = new RealtimeSchemaRepair(
            doc,
            () => planSchemaRepair(schema, 'scene', doc.data),
            (ops) => ops.forEach((op) => sync.write(op))
        );
        let pending: Promise<unknown>;
        sync.on('op', (op) => {
            pending = repair.submit(op);
        });

        item.set('name', 'New');
        const err = await pending;

        expect((err as Error).message).to.equal('invalid:repair-conflict');
        expect(doc.fetches).to.equal(2);
        expect(doc.submissions.map(({ repair }) => repair)).to.deep.equal([false, true, true]);
        expect(item.get('name')).to.equal('Old');
        expect(doc.data).to.deep.equal({ entities: { entity: item.json() } });
    });
});
