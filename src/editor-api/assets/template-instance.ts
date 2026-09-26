import { Guid } from '../guid';
import { utils } from '../utils';

type Json = Record<string, any>;

type InstanceContext = {
    /** top-level entity-typed fields of a component, e.g. `['imageEntity']` */
    entityFields: (component: string) => string[];
    /** attribute definitions of a script, e.g. `{ target: { type: 'entity' } }` */
    scriptAttrs: (script: string) => Json | undefined;
};

const DIGITS = /^\d+$/;

// one path step, as the pipeline's getNodeAtPath: objects by key, arrays by index only
const step = (node: any, key: string) => {
    return node && typeof node === 'object' && (!Array.isArray(node) || DIGITS.test(key)) ? node[key] : undefined;
};

// indexes of a json attribute value, as the pipeline's arrayIndsFromAttr
const indexes = (v: any) => {
    if (Array.isArray(v)) return v.map((_, i) => `${i}`);
    const keys = v && typeof v === 'object' ? Object.keys(v) : null;
    return keys?.every((k) => DIGITS.test(k)) ? keys : null;
};

// entity ref paths in script attributes, as the pipeline's ScriptAttrEntityPaths
function scriptPaths(ent: Json, ctx: InstanceContext) {
    const paths: string[][] = [];
    const scripts = ent.components?.script?.scripts || {};
    for (const name of Object.keys(scripts)) {
        const attrs = scripts[name]?.attributes || {};
        const defs = ctx.scriptAttrs(name) || {};
        for (const key of Object.keys(attrs)) {
            const def = defs[key] || {};
            const path = ['components', 'script', 'scripts', name, 'attributes', key];
            if (def.type === 'entity') {
                paths.push(path);
            } else if (def.type === 'json' && def.schema) {
                const names = def.schema.filter((f: Json) => f.type === 'entity').map((f: Json) => f.name);
                const prefixes = indexes(attrs[key])?.map((i) => [...path, i]) || [path];
                prefixes.forEach((p) => names.forEach((n: string) => paths.push([...p, n])));
            }
        }
    }
    return paths;
}

/**
 * Builds the entities of a new template instance, mirroring the pipeline's
 * template-instance job: fresh guids, entity refs remapped (refs leaving the
 * template become null) and the root linked to the template.
 *
 * @param template - The template asset id, name and `data.entities`
 * @param parentId - The resource id of the parent of the new instance
 * @param ctx - Schema and script attribute lookups
 * @returns The new entities keyed by resource id (children as ids) and the id maps, or null without a root
 */
function buildInstance(template: { id: number; name: string; entities: Json }, parentId: string, ctx: InstanceContext) {
    const ents: Json[] = Object.values(utils.deepCopy(template.entities));

    // no prototype, so ids like `constructor` can't resolve
    const srcToDst: Record<string, string> = Object.create(null);
    const dstToSrc: Record<string, string> = {};
    for (const ent of ents) {
        const dst = Guid.create();
        srcToDst[ent.resource_id] = dst;
        dstToSrc[dst] = ent.resource_id;
    }

    // template_ent_ids keys outside the template share one fresh id per key
    const extra: Record<string, string> = Object.create(null);
    const map = (id: any) => srcToDst[id] || null;

    const entities: Json = {};
    let rootId: string = null;
    for (const ent of ents) {
        const id = srcToDst[ent.resource_id];
        const paths = Object.keys(ent.components || {})
            .flatMap((c) => ctx.entityFields(c).map((f) => ['components', c, f]))
            .concat(scriptPaths(ent, ctx));

        // as the pipeline's remapEntAtPath
        for (const path of paths) {
            const node = path.slice(0, -1).reduce(step, ent);
            const key = path[path.length - 1];
            const v = step(node, key);
            if (v) node[key] = Array.isArray(v) ? v.map(map) : map(v);
        }

        if (ent.template_ent_ids) {
            ent.template_ent_ids = Object.fromEntries(
                Object.entries(ent.template_ent_ids).map(([k, v]) => {
                    return [srcToDst[k] || (extra[k] ||= Guid.create()), v];
                })
            );
        }

        if (!ent.parent) rootId = id;
        Object.assign(ent, { resource_id: id, parent: map(ent.parent), children: (ent.children || []).map(map) });
        entities[id] = ent;
    }

    if (!rootId) return null;

    Object.assign(entities[rootId], {
        parent: parentId,
        name: template.name,
        template_id: template.id,
        template_ent_ids: dstToSrc
    });

    return { rootId, entities, srcToDst, extra };
}

/**
 * Turns flat instance entities into nested create data, skipping child ids
 * that are missing or already visited so corrupted templates cannot loop.
 *
 * @param entities - Entities keyed by resource id, children as ids
 * @param id - The resource id to start from
 * @param seen - Ids already nested
 * @returns Entity data with `children` as nested entity data
 */
function nest(entities: Json, id: string, seen = new Set<string>()): Json {
    seen.add(id);
    const children = entities[id].children.filter((c: string) => entities[c] && !seen.has(c));
    children.forEach((c: string) => seen.add(c));
    return { ...entities[id], children: children.map((c: string) => nest(entities, c, seen)) };
}

export { buildInstance, nest };
export type { InstanceContext };
