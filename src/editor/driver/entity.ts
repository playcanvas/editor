import { driver } from './driver';
import { api, log, entitySummary, paginate } from './shared';

// top-level entity properties that entities:modify may set directly. Anything
// else must be addressed under `components.<type>.…` (or is not settable).
const ENTITY_TOP_LEVEL_PATHS = ['name', 'enabled', 'position', 'rotation', 'scale', 'tags'];

/**
 * Validate an entities:modify path against an entity BEFORE writing, so an invalid path
 * fails fast with an actionable message instead of silently "succeeding". Only rejects
 * paths that are provably wrong (unknown top-level key, or a component path for a
 * component the entity does not have) — valid edits are never blocked.
 *
 * @param entity - The entity API instance.
 * @param path - The dot-notation path the caller wants to set.
 * @returns An actionable error string if the path is invalid, otherwise null.
 */
const validateEntityPath = (entity: any, path: string) => {
    const components = Object.keys(entity.get('components') || {});
    const componentList = components.length ? components.join(', ') : 'none';
    if (typeof path !== 'string' || !path.length) {
        return `Missing path. Valid top-level paths: ${ENTITY_TOP_LEVEL_PATHS.join(', ')}; or component paths like components.<type>.<prop>. This entity has components: [${componentList}].`;
    }
    if (path.startsWith('components.')) {
        const component = path.split('.')[1];
        if (!component) {
            return `Incomplete path '${path}'. Component paths look like components.<type>.<prop>, e.g. components.light.intensity. This entity has components: [${componentList}].`;
        }
        if (!entity.get(`components.${component}`)) {
            return `Entity ${entity.get('resource_id')} (${entity.get('name')}) has no '${component}' component, so '${path}' cannot be set. This entity has components: [${componentList}]. Add it first with add_components, or target an existing component.`;
        }
        return null;
    }
    const top = path.split('.')[0];
    if (!ENTITY_TOP_LEVEL_PATHS.includes(top)) {
        return `Unknown path '${path}'. Valid top-level paths: ${ENTITY_TOP_LEVEL_PATHS.join(', ')} (vectors are arrays e.g. position [0,1,0], euler rotation in degrees). For component properties use components.<type>.<prop>; this entity has components: [${componentList}].`;
    }
    return null;
};

// entities
driver.method('entities:create', (entityDataArray) => {
    const entities = [];
    for (const entityData of entityDataArray) {
        if (Object.hasOwn(entityData, 'parent')) {
            const parent = api.entities.get(entityData.parent);
            if (!parent) {
                return {
                    error: `Parent entity not found: ${entityData.parent}. Call list_entities (or resolve_entities) to obtain a valid parent resource_id, or omit 'parent' to create under the root.`
                };
            }
            entityData.entity.parent = parent;
        }

        const entity = api.entities.create(entityData.entity);
        if (!entity) {
            return {
                error: 'Failed to create entity. Verify the entity definition is valid (e.g. component data types) and retry.'
            };
        }
        entities.push(entity);

        log(`Created entity(${entity.get('resource_id')})`);
    }

    // return the resulting entity summaries inline so the agent gets the new
    // ids + hierarchy paths without a follow-up list_entities call
    return { data: entities.map(entitySummary) };
});
driver.method('entities:modify', (edits) => {
    const modified = new Map();
    for (const { id, path, value } of edits) {
        const entity = api.entities.get(id);
        if (!entity) {
            return {
                error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
            };
        }

        // validate-on-write: reject a provably-invalid path up front so the agent gets
        // an actionable message and never mistakes a no-op for a successful edit
        const pathError = validateEntityPath(entity, path);
        if (pathError) {
            return { error: pathError };
        }
        entity.set(path, value);
        modified.set(id, entity);
        log(`Set property(${path}) of entity(${id}) to: ${JSON.stringify(value)}`);
    }

    // return the post-edit summaries of every touched entity
    return { data: Array.from(modified.values()).map(entitySummary) };
});
driver.method('entities:duplicate', async (ids, options: any = {}) => {
    const entities = ids.map((id: string) => api.entities.get(id)).filter(Boolean);
    if (!entities.length) {
        return {
            error: 'No valid entities to duplicate. Call list_entities (or resolve_entities) to obtain valid resource_ids.'
        };
    }
    const res = await api.entities.duplicate(entities, options);
    log(`Duplicated entities: ${res.map((entity: any) => entity.get('resource_id')).join(', ')}`);
    return { data: res.map(entitySummary) };
});
driver.method('entities:reparent', (options) => {
    const entity = api.entities.get(options.id);
    if (!entity) {
        return {
            error: `Entity not found: ${options.id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    const parent = api.entities.get(options.parent);
    if (!parent) {
        return {
            error: `Parent entity not found: ${options.parent}. Call list_entities (or resolve_entities) to obtain a valid parent resource_id.`
        };
    }
    entity.reparent(parent, options.index, {
        preserveTransform: options.preserveTransform
    });
    log(`Reparented entity(${options.id}) to entity(${options.parent})`);
    return { data: entitySummary(entity) };
});
driver.method('entities:delete', async (ids) => {
    const entities = ids
        .map((id: string) => api.entities.get(id))
        .filter((entity: any) => entity && entity !== api.entities.root);
    if (!entities.length) {
        return {
            error: 'No deletable entities found (the root entity cannot be deleted). Call list_entities to obtain valid, non-root resource_ids.'
        };
    }
    await api.entities.delete(entities);
    log(`Deleted entities: ${ids.join(', ')}`);
    return { data: { deleted: entities.length } };
});
driver.method('entities:resolve', (options: any = {}) => {
    const name = (options.name || '').toLowerCase();
    if (!name) {
        return { error: 'Provide a non-empty "name" to resolve.' };
    }
    const matches = api.entities.list().filter((entity) => {
        const entityName = (entity.get('name') || '').toLowerCase();
        return options.exact ? entityName === name : entityName.includes(name);
    });
    log(`Resolved entities by name(${options.name}): ${matches.length} match(es)`);

    // empty match is a valid result, not an error
    return { data: matches.map(entitySummary), meta: { total: matches.length, count: matches.length } };
});
driver.method('entities:list', (options: any = {}) => {
    let entities = api.entities.list();

    // apply filters
    if (options.name) {
        const searchName = options.name.toLowerCase();
        entities = entities.filter((entity) => entity.get('name').toLowerCase().includes(searchName));
    }
    if (options.component) {
        entities = entities.filter((entity) => entity.get(`components.${options.component}`));
    }
    if (options.tag) {
        entities = entities.filter((entity) => entity.get('tags').includes(options.tag));
    }

    // an empty result is a valid success, not an error
    const { page, meta } = paginate(entities, options);

    log(`Listed entities (${meta.count}/${meta.total})`);

    // return full JSON or summary
    if (options.full) {
        return { data: page.map((entity) => entity.json()), meta };
    }

    // summary mode: compact, semantic data
    return { data: page.map(entitySummary), meta };
});
driver.method('entities:components:add', (id, components) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    Object.entries(components).forEach(([name, data]) => {
        entity.addComponent(name, data);
    });
    log(`Added components(${Object.keys(components).join(', ')}) to entity(${id})`);
    return { data: entitySummary(entity) };
});
driver.method('entities:components:remove', (id, components) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    components.forEach((component: string) => {
        entity.removeComponent(component);
    });
    log(`Removed components(${components.join(', ')}) from entity(${id})`);
    return { data: entitySummary(entity) };
});
driver.method('entities:components:script:add', (id, scriptName) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    if (!entity.get('components.script')) {
        return {
            error: `Entity ${id} has no script component. Add one first via add_components { script: {} } or use attach_script which creates it automatically.`
        };
    }
    entity.addScript(scriptName);
    log(`Added script(${scriptName}) to component(script) of entity(${id})`);
    return { data: entitySummary(entity) };
});
driver.method('entities:script:attach', (id, scriptName) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }

    // consolidated flow: ensure the script component exists, then attach
    if (!entity.get('components.script')) {
        entity.addComponent('script', {});
    }
    entity.addScript(scriptName);
    log(`Attached script(${scriptName}) to entity(${id})`);
    return { data: entitySummary(entity) };
});

// entity search
driver.method('entities:search', (query, limit) => {
    let results = editor.call('entities:fuzzy-search', query) || [];
    if (typeof limit === 'number') {
        results = results.slice(0, limit);
    }
    log(`Searched entities for "${query}" (${results.length})`);
    return { data: results.map(entitySummary) };
});
driver.method('entities:byScript', (script) => {
    const results = editor.call('entities:list:byScript', script) || [];
    log(`Listed entities by script "${script}" (${results.length})`);
    return { data: results.map(entitySummary) };
});
