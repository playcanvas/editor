import { driver } from './driver';
import { api, log, entitySummary, paginate, validatePath, writeError } from './shared';

const ENTITY_TOP_LEVEL_PATHS = ['name', 'enabled', 'position', 'rotation', 'scale', 'tags'];

const validateEntityPath = (entity: any, path: string) => {
    const components = Object.keys(entity.get('components') || {});
    const componentList = components.length ? components.join(', ') : 'none';
    if (typeof path !== 'string' || !path.length) {
        return `Missing path. Valid top-level paths: ${ENTITY_TOP_LEVEL_PATHS.join(', ')}; or component paths like components.<type>.<prop>. This entity has components: [${componentList}].`;
    }
    validatePath(path);
    if (path.startsWith('components.')) {
        const parts = path.split('.');
        const component = parts[1];
        if (!component || parts.length < 3) {
            return `Incomplete path '${path}'. Component paths look like components.<type>.<prop>, e.g. components.light.intensity. This entity has components: [${componentList}].`;
        }
        if (!entity.get(`components.${component}`)) {
            return `Entity ${entity.get('resource_id')} (${entity.get('name')}) has no '${component}' component, so '${path}' cannot be set. This entity has components: [${componentList}]. Add it first with add_components, or target an existing component.`;
        }
        const resolved = api.schema.components.resolvePath(component, parts.slice(2).join('.'));
        return resolved ? null : `Unknown component path '${path}'.`;
    }
    if (!ENTITY_TOP_LEVEL_PATHS.includes(path)) {
        return `Unknown path '${path}'. Valid top-level paths: ${ENTITY_TOP_LEVEL_PATHS.join(', ')} (vectors are arrays e.g. position [0,1,0], euler rotation in degrees). For component properties use components.<type>.<prop>; this entity has components: [${componentList}].`;
    }
    return null;
};

const getEntities = (ids: string[]) =>
    ids.map((id) => {
        const entity = api.entities.get(id);
        if (!entity) {
            throw new Error(`Entity not found: ${id}. Call list_entities to obtain a valid resource_id.`);
        }
        return entity;
    });

const addScripts = async ({ entityIds, script, attributes, index }: any) => {
    const denied = writeError('modify entity scripts');
    if (denied) {
        return denied;
    }
    const entities = getEntities(entityIds);
    if (!api.assets.getAssetForScript(script)) {
        return { error: `Parsed script not found: ${script}. Create or parse the script asset first.` };
    }
    for (const entity of entities) {
        const order = entity.get('components.script.order') || [];
        if (index !== undefined && (!Number.isInteger(index) || index < 0 || index > order.length)) {
            return { error: `Invalid script index ${index} for entity ${entity.get('resource_id')}.` };
        }
    }
    await api.entities.addScript(entities, script, { attributes, index });
    log(`Added script(${script}) to entities(${entityIds.join(', ')})`);
    return { data: entities.map(entitySummary) };
};

// entities
driver.method('entities:create', async (entityDataArray) => {
    const denied = writeError('create entities');
    if (denied) {
        return denied;
    }
    const prepared = entityDataArray.map((entityData: any) => {
        if (!entityData.entity || typeof entityData.entity !== 'object' || Array.isArray(entityData.entity)) {
            throw new Error('Each create_entities item must contain an entity object.');
        }
        const data = { ...entityData.entity };
        if (Object.hasOwn(entityData, 'parent')) {
            const parent = api.entities.get(entityData.parent);
            if (!parent) {
                throw new Error(
                    `Parent entity not found: ${entityData.parent}. Call list_entities to obtain a valid parent resource_id.`
                );
            }
            data.parent = parent;
        }
        return data;
    });
    if (!prepared.length) {
        return { error: 'At least one entity is required.' };
    }
    let entities: any[] = [];
    for (const data of prepared) {
        const [error, entity] = await Promise.resolve()
            .then(() => api.entities.create(data, { history: false }))
            .then(
                (value) => [null, value],
                (err) => [err, null]
            );
        if (error || !entity) {
            if (entities.length) {
                await api.entities.delete(entities, { history: false });
            }
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create entity. Verify the entity definition is valid and retry.'
            };
        }
        entities.push(entity);

        log(`Created entity(${entity.get('resource_id')})`);
    }

    api.history.add({
        name: 'create entities',
        combine: false,
        undo: async () => {
            const current = entities.flatMap((entity) => {
                const latest = entity?.latest();
                return latest ? [latest] : [];
            });
            if (current.length) {
                await api.entities.delete(current, { history: false });
            }
        },
        redo: () => {
            entities = prepared.map((data) => api.entities.create(data, { history: false }));
        }
    });

    // return the resulting entity summaries inline so the agent gets the new
    // ids + hierarchy paths without a follow-up list_entities call
    return { data: entities.map(entitySummary) };
});
driver.method('entities:modify', (edits) => {
    const denied = writeError('modify entities');
    if (denied) {
        return denied;
    }
    const prepared = edits.map((edit: any) => {
        const { id, path } = edit;
        const entity = api.entities.get(id);
        if (!entity) {
            throw new Error(`Entity not found: ${id}. Call list_entities to obtain a valid resource_id.`);
        }
        const error = validateEntityPath(entity, path);
        if (error) {
            throw new Error(error);
        }
        const op = edit.op || 'set';
        if (op !== 'set' && op !== 'unset') {
            throw new Error(`Invalid entity operation: ${op}.`);
        }
        if (op === 'set' && !Object.hasOwn(edit, 'value')) {
            throw new Error(`Missing value for entity ${id} path ${path}.`);
        }
        if (op === 'unset' && !path.startsWith('components.')) {
            throw new Error('Only component properties can be unset; set top-level entity properties explicitly.');
        }
        const resolved = path.startsWith('components.')
            ? api.schema.components.resolvePath(path.split('.')[1], path.split('.').slice(2).join('.'))
            : null;
        if (op === 'unset' && !resolved?.hasDefault && !resolved?.open) {
            throw new Error(`Component path ${path} cannot be unset.`);
        }
        const nextOp = op === 'unset' && resolved?.hasDefault ? 'set' : op;
        const value = nextOp === 'set' && op === 'unset' ? resolved.default : edit.value;
        return {
            entity,
            id,
            path,
            value,
            op: nextOp,
            exists: entity.has(path),
            previous: structuredClone(entity.get(path))
        };
    });
    const write = ({ entity, path, value, exists }: any) => {
        const target = entity.latest ? entity.latest() : entity;
        if (!target) {
            return;
        }
        const enabled = target.history.enabled;
        target.history.enabled = false;
        if (exists) {
            target.set(path, structuredClone(value));
        } else {
            target.unset(path);
        }
        target.history.enabled = enabled;
    };
    const modified = new Map();
    for (const item of prepared) {
        const { entity, id, path, value, op } = item;
        write({ entity, path, value, exists: op === 'set' });
        modified.set(id, entity);
        log(
            `${op === 'set' ? 'Set' : 'Unset'} property(${path}) of entity(${id})${op === 'set' ? ` to: ${JSON.stringify(value)}` : ''}`
        );
    }
    api.history.add({
        name: 'modify entities',
        combine: false,
        undo: () => {
            for (let i = prepared.length - 1; i >= 0; i--) {
                const { entity, path, previous, exists } = prepared[i];
                write({ entity, path, value: previous, exists });
            }
        },
        redo: () => {
            for (let i = 0; i < prepared.length; i++) {
                const { entity, path, value, op } = prepared[i];
                write({
                    entity,
                    path,
                    value,
                    exists: op === 'set'
                });
            }
        }
    });

    // return the post-edit summaries of every touched entity
    return { data: Array.from(modified.values()).map(entitySummary) };
});
driver.method('entities:duplicate', async (ids, options: any = {}) => {
    const denied = writeError('duplicate entities');
    if (denied) {
        return denied;
    }
    const entities = getEntities(ids);
    const res = await api.entities.duplicate(entities, options);
    log(`Duplicated entities: ${res.map((entity: any) => entity.get('resource_id')).join(', ')}`);
    return { data: res.map(entitySummary) };
});
driver.method('entities:reparent', (options) => {
    const denied = writeError('reparent entities');
    if (denied) {
        return denied;
    }
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
    const denied = writeError('delete entities');
    if (denied) {
        return denied;
    }
    const entities = getEntities(ids);
    if (entities.includes(api.entities.root)) {
        throw new Error('The root entity cannot be deleted.');
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
driver.method('entities:get', (id) => ({ data: getEntities([id])[0].json() }));
driver.method('entities:components:add', (id, components) => {
    const denied = writeError('add entity components');
    if (denied) {
        return denied;
    }
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    const existing = Object.keys(components).filter((component) => entity.has(`components.${component}`));
    if (existing.length) {
        return { error: `Entity ${id} already has components: ${existing.join(', ')}.` };
    }
    const names = Object.keys(components);
    const valid = api.schema.components.list();
    const invalid = names.filter(name => !valid.includes(name));
    if (invalid.length) {
        return { error: `Unsupported component(s): ${invalid.join(', ')}. Valid components: ${valid.join(', ')}.` };
    }
    for (let i = 0; i < names.length; i++) {
        entity.addComponent(names[i], components[names[i]]);
    }
    log(`Added components(${names.join(', ')}) to entity(${id})`);
    return { data: entitySummary(entity) };
});
driver.method('entities:components:remove', (id, components) => {
    const denied = writeError('remove entity components');
    if (denied) {
        return denied;
    }
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    const missing = components.filter((component: string) => !entity.has(`components.${component}`));
    if (missing.length) {
        return { error: `Entity ${id} does not have components: ${missing.join(', ')}.` };
    }
    for (let i = 0; i < components.length; i++) {
        entity.removeComponent(components[i]);
    }
    log(`Removed components(${components.join(', ')}) from entity(${id})`);
    return { data: entitySummary(entity) };
});
driver.method('entities:scripts:add', addScripts);
driver.method('entities:scripts:remove', ({ entityIds, script }: any) => {
    const denied = writeError('remove entity scripts');
    if (denied) {
        return denied;
    }
    const entities = getEntities(entityIds);
    const missing = entities.filter((entity) => !(entity.get('components.script.order') || []).includes(script));
    if (missing.length) {
        return {
            error: `Script ${script} is not attached to entities: ${missing.map((entity) => entity.get('resource_id')).join(', ')}.`
        };
    }
    api.entities.removeScript(entities, script);
    log(`Removed script(${script}) from entities(${entityIds.join(', ')})`);
    return { data: entities.map(entitySummary) };
});
driver.method('entities:scripts:move', ({ entityId, script, index }: any) => {
    const denied = writeError('reorder entity scripts');
    if (denied) {
        return denied;
    }
    const entity = getEntities([entityId])[0];
    const order = entity.get('components.script.order') || [];
    const previous = order.indexOf(script);
    if (previous === -1) {
        return { error: `Entity ${entityId} does not contain script ${script}.` };
    }
    if (!Number.isInteger(index) || index < 0 || index >= order.length) {
        return { error: `Invalid script index ${index}; expected 0-${order.length - 1}.` };
    }
    entity.observer.move('components.script.order', previous, index);
    log(`Moved script(${script}) on entity(${entityId}) to index ${index}`);
    return { data: entitySummary(entity) };
});
driver.method('entities:components:script:add', async (id, scriptName) => {
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
    return addScripts({ entityIds: [id], script: scriptName });
});
driver.method('entities:script:attach', (id, scriptName) => addScripts({ entityIds: [id], script: scriptName }));

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
