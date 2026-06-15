export const REF_KINDS = new Set(['asset', 'entity', 'layer', 'batchGroup', 'sublayer']);
const COLORISH = /color|tint|gradient/i;
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// a plain object mapping entity guids to entity guids (e.g. a template's
// entity-id remap); rendered as a resolved name list rather than raw json
export const isEntityIdMap = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length > 0 && entries.every(([k, v]) => GUID_RE.test(k) && typeof v === 'string' && GUID_RE.test(v));
};

export type NameIndex = {
    asset: Map<string, string>;
    entity: Map<string, string>;
    layer: Map<string, string>;
    batchGroup: Map<string, string>;
};

export type ValueKind = 'missing' | 'boolean' | 'number' | 'string' | 'vector' | 'color' | 'curve' | 'gradient' |
    'asset' | 'entity' | 'layer' | 'batchGroup' | 'sublayer' | 'entityMap' | 'children' | 'json' | 'object' | `array:${string}`;

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

// an entity's hierarchy path (Root/.../Name) walked from the template's parent
// links, matching how scene checkpoints store entity names so the breadcrumb
// tree renders the full hierarchy rather than a single node
export const templateEntityPath = (entities: any, guid: string) => {
    const parts = [];
    const seen = new Set();
    let cur = guid;
    while (cur && entities?.[cur] && !seen.has(cur)) {
        seen.add(cur);
        const name = entities[cur].name;
        parts.unshift(typeof name === 'string' ? name : cur);
        cur = entities[cur].parent;
    }
    return parts.length ? parts.join('/') : undefined;
};

// merge a template asset's entity paths (guid -> Root/.../Name) into the index
// so template diffs resolve entity guids the way scenes do; pulled from the
// live asset registry via getAsset (best-effort — missing assets fall back)
// combined entity map for a template conflict: the live asset's entities (one
// checkpoint's state) plus the whole-entity objects the diff itself reports —
// data.entities.<guid> entries whose value is the full entity ({ name, parent }).
// the diff payload carries no template entities otherwise (formatCheckpoint only
// emits paths for scenes), so this is the only way entities added/removed on the
// side that isn't loaded resolve to a name.
export const templateEntitiesFor = (conflict: any, getAsset: (id: any) => any) => {
    const entities = { ...(getAsset(conflict?.itemId)?.get?.('data.entities') ?? {}) };
    for (const entry of conflict?.data ?? []) {
        const parts = (entry?.path ?? '').split('.');
        const obj = entry?.srcValue ?? entry?.dstValue;
        if (parts.length === 3 && parts[0] === 'data' && parts[1] === 'entities' &&
            obj && typeof obj === 'object' && !entities[parts[2]]) {
            entities[parts[2]] = obj;
        }
    }
    return entities;
};

export const indexTemplateEntities = (index: NameIndex, conflicts: any[], getAsset: (id: any) => any) => {
    for (const c of conflicts ?? []) {
        if (c?.assetType !== 'template') {
            continue;
        }
        const entities = templateEntitiesFor(c, getAsset);
        for (const guid of Object.keys(entities)) {
            const path = !index.entity.has(guid) && templateEntityPath(entities, guid);
            if (path) {
                index.entity.set(guid, path);
            }
        }
    }
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
    if (isEntityIdMap(value)) {
        return 'entityMap';
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
