import type { Schema } from '../editor-api/schema';

type Key = string | number;

type JsonOp = {
    p: Key[];
    oi?: unknown;
    od?: unknown;
    li?: unknown;
    ld?: unknown;
    lm?: number;
};

type Repair = {
    error?: string;
    op: JsonOp[];
};

type Document = {
    data: unknown;
    submitSource: boolean;
    fetch: (callback: (err?: unknown) => void) => void;
    whenNothingPending: (callback: () => void) => void;
    submitOp: (op: JsonOp[], options?: object | ((err?: unknown) => void), callback?: (err?: unknown) => void) => void;
};

type Job = {
    op: JsonOp;
    callback?: (err?: unknown) => unknown;
    done: (err?: unknown) => void;
};

const INCOMPLETE = 'invalid:incomplete';
const CONFLICT = 'invalid:repair-conflict';
const SOURCE = { source: { schemaRepair: true } };

const copy = <T>(value: T) => JSON.parse(JSON.stringify(value)) as T;

const object = (value: unknown): value is Record<string | number, unknown> => {
    return !!value && typeof value === 'object';
};

const message = (err: unknown) => {
    if (typeof err === 'string') return err;
    return object(err) && typeof err.message === 'string' ? err.message : '';
};

const materialize = (schema: Schema, field: unknown, value: unknown) => {
    if (!object(value) || schema.isSkipped(field)) return true;

    const item = schema.getArrayItem(field);
    if (item && Array.isArray(value)) return value.every((child) => materialize(schema, item, child));

    const fields = schema.getFields(field);
    const required = new Set(schema.getRequired(field));
    for (const [key, child] of Object.entries(fields)) {
        if (Object.hasOwn(value, key)) {
            if (!materialize(schema, child, value[key])) return false;
            continue;
        }

        const disposition = schema.getDefault(child);
        if (disposition.hasDefault) {
            const next = copy(disposition.value);
            if (!materialize(schema, child, next)) return false;
            value[key] = next;
        } else if (required.has(key)) {
            return false;
        }
    }

    const mapped = schema.getMapValue(field);
    return !mapped || Object.values(value).every((child) => materialize(schema, mapped, child));
};

const walk = (schema: Schema, field: unknown, value: unknown, path: Key[], op: JsonOp[]) => {
    if (!object(value) || schema.isSkipped(field)) return true;

    const item = schema.getArrayItem(field);
    if (item && Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            if (!walk(schema, item, value[i], [...path, i], op)) return false;
        }
        return true;
    }

    const fields = schema.getFields(field);
    const required = new Set(schema.getRequired(field));
    for (const [key, child] of Object.entries(fields)) {
        if (Object.hasOwn(value, key)) {
            if (!walk(schema, child, value[key], [...path, key], op)) return false;
            continue;
        }

        const disposition = schema.getDefault(child);
        if (disposition.hasDefault) {
            const next = copy(disposition.value);
            if (!materialize(schema, child, next)) return false;
            op.push({ p: [...path, key], oi: next });
        } else if (required.has(key)) {
            return false;
        }
    }

    const mapped = schema.getMapValue(field);
    if (mapped) {
        for (const [key, child] of Object.entries(value)) {
            if (!walk(schema, mapped, child, [...path, key], op)) return false;
        }
    }
    return true;
};

const planSchemaRepair = (
    schema: Schema,
    collection: 'asset' | 'scene' | 'settings' | 'user_data',
    data: unknown,
    subtype?: string
): Repair => {
    const field =
        collection === 'settings' ? schema.getSettingsDocument(subtype ?? '') : schema.getDocument(collection);
    const op: JsonOp[] = [];
    if (!field || !walk(schema, field, data, [], op)) return { error: 'invalid:identity', op: [] };
    if (collection === 'asset' && object(data)) {
        const type = typeof data.type === 'string' ? data.type : '';
        if (object(data.data)) {
            const selected = schema.getAssetData(type);
            if (selected && !walk(schema, selected, data.data, ['data'], op)) {
                return { error: 'invalid:identity', op: [] };
            }
        }
        if (object(data.meta)) {
            const selected = schema.getAssetMeta(type);
            if (selected && !walk(schema, selected, data.meta, ['meta'], op)) {
                return { error: 'invalid:identity', op: [] };
            }
        }
    }
    return { op };
};

class RealtimeSchemaRepair {
    private _doc: Document;

    private _plan: () => Repair;

    private _apply: (ops: JsonOp[]) => void;

    private _error?: (err: unknown) => void;

    private _jobs: Job[] = [];

    private _active = false;

    constructor(doc: Document, plan: () => Repair, apply: (ops: JsonOp[]) => void, error?: (err: unknown) => void) {
        this._doc = doc;
        this._plan = plan;
        this._apply = apply;
        this._error = error;
        this._doc.submitSource = true;
    }

    submit(op: JsonOp, callback?: (err?: unknown) => unknown) {
        let done: (err?: unknown) => void;
        const result = new Promise<unknown>((resolve) => {
            done = resolve;
        });
        const original = copy(op);
        this._doc.submitOp([copy(original)], (err) => {
            if (!err) {
                callback?.();
                done(undefined);
                return;
            }
            if (message(err) !== INCOMPLETE) {
                callback?.(err);
                if (!callback) this._error?.(err);
                done(err);
                return;
            }

            this._jobs.push({ op: original, callback, done });
            if (this._active) return;
            this._active = true;
            this._doc.whenNothingPending(() => this._fetch(0));
        });
        return result;
    }

    private _fetch(conflicts: number) {
        this._doc.fetch((err) => {
            if (err) {
                this._finish(err);
                return;
            }

            const repair = this._plan();
            if (repair.error) {
                this._finish(new Error(repair.error));
                return;
            }
            if (!repair.op.length) {
                this._retry();
                return;
            }

            this._doc.submitOp(repair.op, SOURCE, (err) => {
                if (err) {
                    if (message(err) === CONFLICT && conflicts === 0) {
                        this._doc.whenNothingPending(() => this._fetch(1));
                    } else {
                        this._finish(err);
                    }
                    return;
                }
                this._apply(copy(repair.op));
                this._retry();
            });
        });
    }

    private _retry() {
        const jobs = this._jobs.splice(0);
        const next = (index: number) => {
            const job = jobs[index];
            if (!job) {
                this._active = false;
                if (this._jobs.length) {
                    this._active = true;
                    this._doc.whenNothingPending(() => this._fetch(0));
                }
                return;
            }

            this._apply([copy(job.op)]);
            this._doc.submitOp([copy(job.op)], (err) => {
                job.callback?.(err);
                if (err && !job.callback) this._error?.(err);
                job.done(err);
                next(index + 1);
            });
        };
        next(0);
    }

    private _finish(err: unknown) {
        const jobs = this._jobs.splice(0);
        this._active = false;
        for (const job of jobs) {
            job.callback?.(err);
            if (!job.callback) this._error?.(err);
            job.done(err);
        }
    }
}

export { RealtimeSchemaRepair, planSchemaRepair };
export type { JsonOp };
