import { Observer } from '@playcanvas/observer';
import type { EventHandle } from '@playcanvas/observer/types/event-handle';

import { Entity } from '../entity';
import { globals as api } from '../globals';
import { Guid } from '../guid';

const USE_BACKEND_LIMIT = 500;
const TIME_WAIT_ENTITIES = 5000;
const REGEX_CONTAINS_STAR = /\.\*\./;

let ASSET_PATHS: any[];
let evtMessenger: EventHandle;

/**
 * Try to find an assetId in this project that
 * corresponds to the specified assetId that may come from
 * a different project.
 *
 * @param assetId - The asset id we are trying to remap
 * @param assetsIndex - The assets index stored in localStorage that contains paths of assets
 * @returns The asset id in this project
 */
function remapAsset(assetId: any, assetsIndex: Record<string, any>): number {
    if (!assetId) return null;

    // return the old asset id if not found
    let result = parseInt(assetId, 10);

    const assetData = assetsIndex[assetId];
    if (!assetData) {
        return result;
    }

    const len = assetData.path.length;
    const name = assetData.path[len - 1];
    const type = assetData.type;

    const pathToId = [];

    const assets = api.assets.list();
    const assetLen = assets.length;

    // change path names to folder ids
    for (let i = 0; i < len - 1; i++) {
        let folder = null;

        for (let j = 0; j < assetLen; j++) {
            const asset = assets[j];
            if (asset.get('name') === assetData.path[i] && asset.get('type') === 'folder') {
                folder = asset;
                break;
            }
        }

        if (!folder) {
            return result;
        }

        pathToId.push(parseInt(folder.get('id'), 10));
    }

    const pathToIdLen = pathToId.length;

    // search for asset of same name, type
    // and path as original
    for (let i = 0; i < assetLen; i++) {
        const asset = assets[i];

        if (asset.get('name') === name &&
            asset.get('type') === type &&
            !asset.get('source')) {
            const path = asset.get('path');
            const pathLen = path && path.length;
            if (path && pathLen === pathToIdLen) {
                let pathsEqual = true;
                for (let j = 0; j < pathLen; j++) {
                    if (path[j] !== pathToId[j]) {
                        pathsEqual = false;
                        break;
                    }
                }

                if (!pathsEqual) {
                    continue;
                }
            }

            result = parseInt(asset.get('id'), 10);
            break;
        }
    }

    return result;
}

function mapValue(value: string, mapping: Record<string, any>, sameProject: boolean) {
    if (sameProject) {
        return mapping[value] || value;
    }

    return mapping[value] || null;
}

function remapField(entity: Entity, path: string, mapping: Record<string, any>, sameProject: boolean) {
    if (REGEX_CONTAINS_STAR.test(path)) {
        const parts = path.split('.*.');
        if (!entity.has(parts[0])) return;

        const obj = entity.get(parts[0]);
        if (!obj) return;

        for (const key in obj) {
            const fullKey = `${parts[0]}.${key}.${parts[1]}`;
            if (!entity.has(fullKey)) continue;

            const value = entity.get(fullKey);
            if (!value) continue;

            if (value instanceof Array) {
                for (let j = 0; j < value.length; j++) {
                    value[j] = mapValue(value[j], mapping, sameProject);
                }
                entity.set(fullKey, value);
            } else {
                entity.set(fullKey, mapValue(value, mapping, sameProject));
            }
        }
    } else if (entity.has(path)) {
        const value = entity.get(path);
        if (!value) return;

        if (value instanceof Array) {
            for (let j = 0; j < value.length; j++) {
                value[j] = mapValue(value[j], mapping, sameProject);
            }
            entity.set(path, value);
        } else {
            entity.set(path, mapValue(value, mapping, sameProject));
        }
    }
}

function remapScriptAttribute(assetAttr: any, componentAttr: any, entity: Entity, path: string, entityMapping: Record<string, any>, assetMapping: Record<string, any>, sameProject: boolean) {
    if (assetAttr.type === 'asset') {
        if (sameProject) return;

        // remap asset ids
        if (assetAttr.array) {
            for (let i = 0; i < componentAttr.length; i++) {
                entity.set(`${path}.${i}`, mapValue(componentAttr[i], assetMapping, sameProject));
            }
        } else {
            entity.set(path, mapValue(componentAttr, assetMapping, sameProject));
        }
    } else if (assetAttr.type === 'entity') {
        // try to remap entities
        if (assetAttr.array) {
            for (let i = 0; i < componentAttr.length; i++) {
                if (componentAttr[i]) {
                    entity.set(`${path}.${i}`, mapValue(componentAttr[i], entityMapping, sameProject));
                }
            }
        } else {
            entity.set(path, mapValue(componentAttr, entityMapping, sameProject));
        }
    }
}

/**
 * Remaps the resource ids of the entities and their entity references in localStorage
 * with new resource ids, also remaps asset ids.
 *
 * @param entity - The entity we are remapping
 * @param parent - The parent of the pasted entity
 * @param data - The data in localStorage
 * @param entityMapping - An index that maps old resource ids to new resource ids
 * @param assetMapping - An index that maps old asset ids to new asset ids
 */
function remapEntitiesAndAssets(entity: Entity, parent: Entity, data: Record<string, any>, entityMapping: Record<string, any>, assetMapping: Record<string, any>) {
    const sameProject = (data.project === api.projectId);
    const resourceId = entity.get('resource_id');

    const newResourceId = entityMapping[resourceId];
    entity.set('resource_id', newResourceId);

    // set new resource id for parent
    const parentId = entity.get('parent');
    if (parentId) {
        entity.set('parent', entityMapping[parentId]);
    } else {
        entity.set('parent', parent.get('resource_id'));
    }

    // if this is a template instance remap template_ent_ids
    const templateEntIds = entity.get('template_ent_ids');
    if (templateEntIds) {
        const newTemplateEntIds: Record<string, any> = {};
        for (const oldId in templateEntIds) {
            if (entityMapping[oldId]) {
                newTemplateEntIds[entityMapping[oldId]] = templateEntIds[oldId];
            }
        }
        entity.set('template_ent_ids', newTemplateEntIds);
    }

    // set children to empty array because these
    // are going to get added later on
    entity.set('children', []);

    // remap assets and entities
    if (!sameProject) {
        if (!ASSET_PATHS) {
            // get asset paths for all components
            ASSET_PATHS = [];
            api.schema.components.list().forEach((component) => {
                const paths = api.schema.components.getFieldsOfType(component, 'asset');
                paths.forEach((path) => {
                    ASSET_PATHS.push(`components.${component}.${path}`);
                });
            });
        }

        for (let i = 0; i < ASSET_PATHS.length; i++) {
            const path = ASSET_PATHS[i];
            remapField(entity, path, assetMapping, sameProject);
        }
    }

    // remap script asset attributes
    if (entity.has('components.script.scripts')) {
        if (entity.has('components.script')) {
            // remove script component if legacy scripts flag is different between the two projects
            if (api.hasLegacyScripts !== data.legacy_scripts) {
                entity.unset('components.script');
            } else {
                const scripts = entity.get('components.script.scripts');
                // legacy scripts
                if (api.hasLegacyScripts) {
                    for (let i = 0; i < scripts.length; i++) {
                        const script = scripts[i];
                        if (!script.attributes) continue;

                        for (const name in script.attributes) {
                            const attr = script.attributes[name];
                            if (!attr) continue;

                            if (attr.type === 'asset' && data.project !== api.projectId) {
                                if (attr.value) {
                                    if (attr.value instanceof Array) {
                                        for (let j = 0; j < attr.value.length; j++) {
                                            entity.set(`components.script.scripts.${i}.attributes.${name}.value.${j}`, mapValue(attr.value[j], assetMapping, sameProject));
                                        }
                                    } else {
                                        entity.set(`components.script.scripts.${i}.attributes.${name}.value`, mapValue(attr.value, assetMapping, sameProject));
                                    }
                                }

                                if (attr.defaultValue) {
                                    if (attr.defaultValue instanceof Array) {
                                        for (let j = 0; j < attr.defaultValue.length; j++) {
                                            entity.set(`components.script.scripts.${i}.attributes.${name}.defaultValue.${j}`, mapValue(attr.value[j], assetMapping, sameProject));
                                        }
                                    } else {
                                        entity.set(`components.script.scripts.${i}.attributes.${name}.defaultValue`, mapValue(attr.value, assetMapping, sameProject));
                                    }
                                }
                            } else if (attr.type === 'entity') {
                                if (entityMapping[attr.value]) {
                                    entity.set(`components.script.scripts.${i}.attributes.${name}.value`, mapValue(attr.value, entityMapping, sameProject));
                                }
                                if (entityMapping[attr.defaultValue]) {
                                    entity.set(`components.script.scripts.${i}.attributes.${name}.defaultValue`, mapValue(attr.defaultValue, entityMapping, sameProject));
                                }
                            }
                        }
                    }
                } else {
                    // scripts 2.0
                    if (scripts) {
                        for (const script in scripts) {
                            const asset = api.assets.getAssetForScript(script);
                            if (!asset) continue;

                            const attrs = scripts[script].attributes;
                            if (!attrs) continue;

                            for (const key in attrs) {
                                const attrData = asset.get(`data.scripts.${script}.attributes.${key}`);
                                if (attrData) {
                                    // handle json script attributes
                                    if (attrData.type === 'json' && Array.isArray(attrData.schema)) {
                                        // json attribute array
                                        if (attrData.array) {
                                            for (let j = 0; j < attrs[key].length; j++) {
                                                if (!attrs[key][j]) continue;

                                                for (let k = 0; k < attrData.schema.length; k++) {
                                                    const field = attrData.schema[k];
                                                    if (attrs[key][j][field.name]) {
                                                        remapScriptAttribute(field, attrs[key][j][field.name], entity, `components.script.scripts.${script}.attributes.${key}.${j}.${field.name}`, entityMapping, assetMapping, sameProject);
                                                    }
                                                }
                                            }
                                        } else {
                                            // regular json attribute
                                            for (let k = 0; k < attrData.schema.length; k++) {
                                                const field = attrData.schema[k];
                                                if (attrs[key][field.name]) {
                                                    remapScriptAttribute(field, attrs[key][field.name], entity, `components.script.scripts.${script}.attributes.${key}.${field.name}`, entityMapping, assetMapping, sameProject);
                                                }
                                            }
                                        }
                                    } else {
                                        // non json attribute
                                        remapScriptAttribute(attrData, attrs[key], entity, `components.script.scripts.${script}.attributes.${key}`, entityMapping, assetMapping, sameProject);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

    }

    // remap entity references in components
    const components = entity.get('components');
    Object.keys(components).forEach((componentName) => {
        const entityFields = api.schema.components.getFieldsOfType(componentName, 'entity');

        entityFields.forEach((fieldName) => {
            const path = `components.${componentName}.${fieldName}`;
            remapField(entity, path, entityMapping, sameProject);
        });
    });
}

/**
 * Paste entities in backend
 *
 * @param data - The clipboard data
 * @param parent - The parent entity
 * @param options - The paste options
 * @returns A promise that resolves to an array of pasted entities
 */
function pasteInBackend(data: Record<string, any>, parent: Entity, options: { history?: boolean }) {
    let entities: Entity[];
    let cancelWaitForEntities: () => void;

    let deferred: any = {
        resolve: null,
        reject: null
    };

    const promise: Promise<Entity[]> = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    if (!evtMessenger)  {
        evtMessenger = api.messenger.on('entity.copy', (data) => {
            const callback = api.jobs.finish(data.job_id);
            if (!callback) return;

            const result = data.multTaskResults.map((d: { newRootId: any; }) => d.newRootId);
            callback(result);
        });
    }

    function redo() {
        parent = parent.latest();
        if (!parent) return;

        const jobId = api.jobs.start((newEntityIds: string[]) => {
            const cancel = api.entities.waitToExist(newEntityIds, TIME_WAIT_ENTITIES, (newEntities) => {
                entities = newEntities;

                api.selection.set(newEntities, { history: false });

                if (deferred) {
                    deferred.resolve(newEntities);
                    deferred = null;
                }
            });

            cancelWaitForEntities = () => {
                cancel();
                if (deferred) {
                    deferred.reject();
                    deferred = null;
                }
            };
        });

        const children = parent.get('children');
        const taskData: Record<string, any> = {
            projectId: api.projectId,
            branchId: data.branch || api.branchId,
            parentId: parent.get('resource_id'),
            sceneId: data.scene || api.realtime.scenes.current.uniqueId,
            jobId: jobId,
            children: children,
            childIndex: children.length,
            entities: Object.keys(data.hierarchy)
            .filter((id) => {
                return data.hierarchy[id].parent === null;
            })
            .map((id) => {
                return {
                    id: id
                };
            })
        };

        if (data.scene && data.scene !== api.realtime.scenes.current.uniqueId) {
            taskData.newSceneId = api.realtime.scenes.current.uniqueId;
            taskData.newBranchId = api.branchId;
        }

        api.realtime.connection.sendMessage('pipeline', {
            name: 'entities-copy',
            data: taskData
        });
    }

    redo();

    if (options.history && api.history) {
        api.history.add({
            name: 'paste entities',
            redo: redo,
            combine: false,
            undo: () => {
                if (cancelWaitForEntities) {
                    cancelWaitForEntities();
                    cancelWaitForEntities = null;
                }

                if (entities && entities.length) {
                    api.entities.delete(entities, { history: false });
                }

                entities = null;
            }
        });
    }

    return promise;
}

/**
 * Paste entities copied into clipboard
 * under the specified parent.
 *
 * @param parent - The parent entity
 * @param options - Options
 * @param options.history - Whether to record a history action. Defaults to true.
 * @returns A promise that resolves to an array of new entities
 */
async function pasteEntities(parent: Entity, options: { history?: boolean } = {}) {
    if (options.history === undefined) {
        options.history = true;
    }

    // parse data from local storage
    const data = api.clipboard.value as any;
    if (!data || data.type !== 'entity') return;

    // paste on root if no parent specified
    if (!parent) {
        parent = api.entities.root;
    }

    if (data.project === api.projectId &&
        (data.branch !== api.branchId ||
            Object.keys(data.hierarchy).length > USE_BACKEND_LIMIT)) {
        // TODO support pasting in different projects
        const result = await pasteInBackend(data, parent, options);
        return result;
    }

    // remap assets
    const remappedAssets: Record<string, any> = {};
    if (data.assets) {
        for (const key in data.assets) {
            remappedAssets[key] = remapAsset(key, data.assets);
        }
    }

    // change resource ids
    const mapping: Record<string, any> = {};
    for (const guid in data.hierarchy) {
        mapping[guid] = Guid.create();
    }

    for (const guid in data.hierarchy) {
        // create new guids for any missing entities in template_ent_ids
        if (data.hierarchy[guid].template_ent_ids) {
            for (const key in data.hierarchy[guid].template_ent_ids) {
                if (!mapping[key]) {
                    mapping[key] = Guid.create();
                }
            }
        }
    }

    // add all entities with different resource ids
    const selectedEntities: Entity[] = [];
    const newEntities: Record<string, Entity> = {};

    for (const resourceId in data.hierarchy) {
        // create new observer for entity
        const observer = new Observer(data.hierarchy[resourceId]);

        // select the entity if its parent is not selected
        const select = !data.hierarchy[observer.get('parent')];

        // change resource ids
        remapEntitiesAndAssets(observer as unknown as Entity, parent, data, mapping, remappedAssets);

        const json = observer.json() as any;
        newEntities[json.resource_id] = json;

        const entity = api.entities.create(json, {
            history: false,
            select: false
        });

        if (select) {
            selectedEntities.push(entity);
        }
    }

    if (selectedEntities.length) {
        api.selection.set(selectedEntities, { history: false });
    }

    // add history
    if (options.history && api.history) {
        let deletedHierarchy: any[] = null;
        let previousSelection: any[] = null;

        api.history.add({
            name: 'paste entities',
            combine: false,
            undo: () => {
                parent = parent.latest();
                if (!parent) return;

                deletedHierarchy = [];
                previousSelection = api.selection.items;

                // get latest data for each new entity
                for (const id in newEntities) {
                    const e = api.entities.get(id);
                    if (!e) continue;

                    // put top level entities in deletedHierarchy
                    if (!(e.parent.get('resource_id') in newEntities)) {
                        deletedHierarchy.push(e.jsonHierarchy());
                    }
                }

                if (deletedHierarchy.length) {
                    api.entities.delete(
                        deletedHierarchy.map(data => api.entities.get(data.resource_id)), {
                            history: false
                        }
                    );
                }
            },
            redo: () => {
                parent = parent.latest();
                if (!parent) return;

                // re-insert delete hierarchy
                for (const entity of deletedHierarchy) {
                    api.entities.create(entity, { history: false, select: false });
                }

                deletedHierarchy = null;

                // restore selection
                previousSelection = previousSelection
                .map(item => item.latest())
                .filter(item => !!item);

                api.selection.set(previousSelection, { history: false });

                previousSelection = null;
            }
        });
    }

    return selectedEntities;
}

export { pasteEntities };
