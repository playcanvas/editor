export const REF_KINDS = new Set(['asset', 'entity', 'layer', 'batchGroup', 'sublayer']);
const COLORISH = /color|tint|gradient/i;

export type NameIndex = {
    asset: Map<string, string>;
    entity: Map<string, string>;
    layer: Map<string, string>;
    batchGroup: Map<string, string>;
};

export type ValueKind = 'missing' | 'boolean' | 'number' | 'string' | 'vector' | 'color' | 'curve' | 'gradient' |
    'asset' | 'entity' | 'layer' | 'batchGroup' | 'sublayer' | 'json' | 'object' | `array:${string}`;

const settingName = (v: unknown) => {
    if (typeof v === 'string') {
        return v;
    }
    const name = (v as { name?: unknown })?.name;
    return typeof name === 'string' ? name : undefined;
};

type CheckpointLike = {
    assets?: Record<string, unknown>;
    scenes?: Record<string, unknown>;
    settings?: {
        layers?: Record<string, unknown>;
        batchGroups?: Record<string, unknown>;
    };
};

export type DiffCheckpoints = {
    srcCheckpoint?: CheckpointLike;
    dstCheckpoint?: CheckpointLike;
};

// src (working state) wins over dst (checkpoint) for renamed items
export const buildNameIndex = (diff: DiffCheckpoints): NameIndex => {
    const index: NameIndex = { asset: new Map(), entity: new Map(), layer: new Map(), batchGroup: new Map() };
    for (const side of [diff?.dstCheckpoint, diff?.srcCheckpoint]) {
        if (!side) {
            continue;
        }
        for (const [id, name] of Object.entries(side.assets ?? {})) {
            if (typeof name === 'string') {
                index.asset.set(id, name);
            }
        }
        for (const scene of Object.values(side.scenes ?? {})) {
            const entities = (scene as { entities?: unknown })?.entities ?? scene;
            for (const [guid, name] of Object.entries(entities ?? {})) {
                if (typeof name === 'string') {
                    index.entity.set(guid, name);
                }
            }
        }
        for (const [id, v] of Object.entries(side.settings?.layers ?? {})) {
            const name = settingName(v);
            if (name) {
                index.layer.set(id, name);
            }
        }
        for (const [id, v] of Object.entries(side.settings?.batchGroups ?? {})) {
            const name = settingName(v);
            if (name) {
                index.batchGroup.set(id, name);
            }
        }
    }
    return index;
};

const numArray = (value: unknown, min: number, max: number) => {
    return Array.isArray(value) && value.length >= min && value.length <= max && value.every(v => typeof v === 'number');
};

// channel count for curve/curveset values; 0 when not curve-shaped
const curveChannels = (value: any) => {
    if (Array.isArray(value) && value[0]?.keys) {
        return value.length;
    }
    if (Array.isArray(value?.keys)) {
        return Array.isArray(value.keys[0]) ? value.keys.length : 1;
    }
    return 0;
};

export const valueKind = (type: string, path: string, value: unknown): ValueKind => {
    if (value === undefined || value === null) {
        return 'missing';
    }
    if (type.startsWith('array:')) {
        return type as ValueKind;
    }
    if (REF_KINDS.has(type)) {
        return type as ValueKind;
    }
    if (type === 'object') {
        return 'object';
    }
    if (type === 'json') {
        return 'json';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    const channels = !type || type === 'curve' || type === 'curveset' ? curveChannels(value) : 0;
    if (channels > 1 || type === 'curveset') {
        return COLORISH.test(path) && channels >= 3 && channels <= 4 ? 'gradient' : 'curve';
    }
    if (channels === 1 || type === 'curve') {
        return 'curve';
    }
    if (type === 'rgb' || type === 'rgba' || (COLORISH.test(path) && numArray(value, 3, 4))) {
        return 'color';
    }
    if (numArray(value, 2, 4)) {
        return 'vector';
    }
    if (typeof value === 'number') {
        return 'number';
    }
    if (typeof value === 'string') {
        return 'string';
    }
    return 'json';
};
