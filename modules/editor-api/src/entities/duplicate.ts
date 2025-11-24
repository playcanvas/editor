import type { EventHandle } from '@playcanvas/observer/types/event-handle';

import { findEntityReferencesInComponents, updateReferences } from './references';
import { Entity } from '../entity';
import { globals as api } from '../globals';
import { Guid } from '../guid';

const TIME_WAIT_ENTITIES = 5000;
let evtMessenger: EventHandle = null;

const USE_BACKEND_LIMIT = 500;

/**
 * When an entity that has properties that contain references to some entities
 * within its subtree is duplicated, update the references to the corresponding entities within
 * the newly created duplicate subtree.
 *
 * @param newEntity - The new (duplicated) entity
 * @param oldEntity - The old entity
 * @param duplicatedIdsMap - Map of old id -> new id
 */
function updateDuplicatedEntityReferences(newEntity: Entity, oldEntity: Entity, duplicatedIdsMap: Record<string, string>) {
    // remap template_ent_ids for template instances
    newEntity.depthFirst((entity: Entity) => {
        const templateEntIds = entity.get('template_ent_ids');
        if (templateEntIds) {
            const newTemplateEntIds: Record<string, any> = {};
            for (const oldId in templateEntIds) {
                if (duplicatedIdsMap[oldId]) {
                    newTemplateEntIds[duplicatedIdsMap[oldId]] = templateEntIds[oldId];
                }
            }

            const history = entity.history.enabled;
            entity.history.enabled = false;
            entity.set('template_ent_ids', newTemplateEntIds);
            entity.history.enabled = history;
        }
    });

    // update entity references
    const entityReferences = findEntityReferencesInComponents(newEntity) as Record<string, any>;
    for (const id in entityReferences) {
        const prevEntity = api.entities.get(id);
        // only update references to this entity if it is in the old entity's subtree
        if (!prevEntity || (prevEntity !== oldEntity && !prevEntity.isDescendantOf(oldEntity))) {
            delete entityReferences[id];
        }
    }

    if (Object.keys(entityReferences).length) {
        for (const oldId in duplicatedIdsMap) {
            updateReferences(entityReferences, oldId, duplicatedIdsMap[oldId]);
        }
    }
}

function splitEntityNameAndNumber(entityName: string) {
    let name = '';
    let number = 1;

    // step from end of string character by character checking to see if we have a trailing number
    // stopping when the string we are constructing is no longer a valid number
    let numberString = '';
    let foundNumber = true;
    for (let i = entityName.length - 1; i >= 0; i--) {
        const char = entityName.charAt(i);
        if (foundNumber) {
            numberString = char + numberString;
            foundNumber = /^\d+$/.test(numberString);
            if (foundNumber) {
                number = parseInt(numberString, 10);
            }
        }
        if (foundNumber === false) {
            name = char + name;
        }
    }

    return {
        name,
        number
    };
}

function isEntityNameTaken(name: string, entities: Entity[]) {
    for (let j = 0; j < entities.length; j++) {
        const entity = entities[j];
        const entityName = entities[j].get('name');
        if (entity && entityName === name) {
            return true;
        }
    }
    return false;
}

function getUniqueNameForDuplicatedEntity(entityName: string, entities: Entity[]) {
    // if entityName === '1box23' then name === '1box' and number === 23,  if entityName === '1' then name === '' and number === 1
    const { name, number } = splitEntityNameAndNumber(entityName);

    let startIndex = number + 1;
    let newUniqueName = name + startIndex;
    while (isEntityNameTaken(newUniqueName, entities)) {
        newUniqueName = name + startIndex++;
    }
    return newUniqueName;
}

/**
 * Duplicates an entity in the scene
 *
 * @param entity - The entity
 * @param parent - The parent of the new entity
 * @param ind - The index in the parent's children array where we want to insert the new entity
 * @param duplicatedIdsMap - A guid->guid map that contains references from the source resource ids to the new resource ids
 * @param useUniqueName - Controls whether duplicated entity will have a unique name
 * @returns The new entity
 */
function duplicateEntity(entity: Entity, parent: Entity, ind: number, duplicatedIdsMap: Record<string, string>, useUniqueName: boolean = false) {
    const originalResourceId = entity.get('resource_id');
    const data = entity.json() as Record<string, any>;
    const children = data.children;

    data.children = [];
    if (useUniqueName) {
        data.name = getUniqueNameForDuplicatedEntity(data.name, parent.children);
    }
    data.resource_id = Guid.create();
    data.parent = parent.get('resource_id');

    entity = api.entities.create(data as any, {
        history: false,
        select: false,
        index: ind
    });

    duplicatedIdsMap[originalResourceId] = entity.get('resource_id');

    const templateEntIds = entity.get('template_ent_ids');
    if (templateEntIds) {
        for (const key in templateEntIds) {
            if (!api.entities.get(key)) {
                duplicatedIdsMap[key] = Guid.create();
            }
        }
    }

    // add children too
    children.forEach((childId: string) => {
        duplicateEntity(api.entities.get(childId), entity, undefined, duplicatedIdsMap);
    });

    return entity;
}

function duplicateInBackend(entities: Entity[], options: { history?: boolean } = {}) {
    const originalEntities = entities;
    let cancelWaitForEntities: () => void;

    let deferred: any = {
        resolve: null,
        reject: null
    };


    const promise = new Promise<Entity[]>((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    if (!evtMessenger) {
        evtMessenger = api.messenger.on('entity.copy', (data) => {
            const callback = api.jobs.finish(data.job_id);
            if (!callback) return;

            const result = data.multTaskResults.map((d: { newRootId: any; }) => d.newRootId);
            callback(result);
        });
    }

    function redo() {
        const jobId = api.jobs.start((newEntityIds: string[]) => {
            const cancel = api.entities.waitToExist(newEntityIds, TIME_WAIT_ENTITIES, (newEntities) => {
                entities = newEntities;

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

        api.realtime.connection.sendMessage('pipeline', {
            name: 'entities-duplicate',
            data: {
                projectId: api.projectId,
                branchId: api.branchId,
                sceneId: api.realtime.scenes.current.uniqueId,
                jobId: jobId,
                entities: originalEntities.map(e => e.get('resource_id'))
            }
        });
    }

    redo();

    // add history
    if (options.history && api.history) {
        api.history.add({
            name: 'duplicate entities',
            combine: false,
            redo: redo,
            undo: () => {
                if (cancelWaitForEntities) {
                    cancelWaitForEntities();
                    cancelWaitForEntities = null;
                }

                api.entities.delete(entities, {
                    history: false
                });
            }
        });
    }

    return promise;
}

/**
 * Duplicates entities under the same parent
 *
 * @param entities - The entities
 * @param options - Options
 * @param options.history - Whether to record a history action. Defaults to true.
 * @param options.select - Whether to select the new entities. Defaults to false.
 * @param options.rename - Whether to rename the duplicated entities. Defaults to false.
 * @returns The duplicated entities
 */
async function duplicateEntities(entities: Entity[], options: { history?: boolean, select?: boolean, rename?: boolean } = {}) {
    // copy entities for safety in undo / redo
    entities = entities.slice();

    if (options.history === undefined) {
        options.history = true;
    }

    const root = api.entities.root;

    // make sure we are not duplicating the root
    if (entities.includes(root)) {
        console.error('Cannot duplicate the root Entity');
        return;
    }

    // build index
    const records: Record<string, { entity: Entity; index: number }> = {};
    entities.forEach((entity) => {
        const id = entity.get('resource_id');
        records[id] = {
            entity: entity,
            index: entity.parent.children.indexOf(entity)
        };
    });

    // only duplicate top level parents
    let i = entities.length;
    while (i--) {
        let parent = entities[i].parent;
        while (parent && parent !== root) {
            if (records[parent.get('resource_id')]) {
                delete records[entities[i].get('resource_id')];
                entities.splice(i, 1);
                break;
            }

            parent = parent.parent;
        }
    }

    // original order is a dictionary that contains
    // resource_id -> [index_before_sort, index_after_sort]
    // for each entity. It used to return our results in the
    // original order passed by the user because when we duplicate
    // we change the order of the entities to their order within their parent
    const originalOrder: Record<string, [number, number]> = {};
    entities.forEach((e, i) => {
        originalOrder[e.get('resource_id')] = [i, null];
    });

    // sort by order within parent
    entities.sort((a, b) => {
        return records[b.get('resource_id')].index - records[a.get('resource_id')].index;
    });

    entities.forEach((e, i) => {
        originalOrder[e.get('resource_id')][1] = i;
    });

    let newEntities: Entity[] = [];

    // If we have a lot of entities duplicate in the backend
    if (api.messenger && api.jobs && entities.length > USE_BACKEND_LIMIT) {
        newEntities = await duplicateInBackend(entities, options);
    } else {
        // remember previous selection
        let previousSelection: any[];
        if (options.history && api.history && api.selection && options.select) {
            previousSelection = api.selection.items;
        }

        // duplicate
        entities.forEach((entity) => {
            const duplicatedIdsMap = {};

            const newEntity = duplicateEntity(
                entity,
                entity.parent,
                records[entity.get('resource_id')].index + 1,
                duplicatedIdsMap,
                options.rename
            );

            updateDuplicatedEntityReferences(newEntity, entity, duplicatedIdsMap);

            newEntities.push(newEntity);
        });

        if (options.history && api.history) {
            let previous: Record<string, any> = null;

            api.history.add({
                name: 'duplicate entities',
                combine: false,
                undo: () => {
                    // make sure we get the entities that are in the scene
                    newEntities = newEntities.map((entity: Entity) => {
                        return entity.latest();
                    });

                    // remember previous entities
                    previous = {};
                    newEntities.forEach((entity: Entity) => {
                        entity.depthFirst((e: Entity) => {
                            previous[e.get('resource_id')] = e.json();
                        });
                    });

                    api.entities.delete(newEntities, {
                        history: false
                    });

                    if (previousSelection) {
                        api.selection.set(previousSelection, {
                            history: false
                        });
                    }
                },
                redo: () => {
                    function recreateEntityData(data: { children: any[]; }) {
                        data = Object.assign({}, data);
                        data.children = data.children.map(id => recreateEntityData(previous[id]));
                        return data;
                    }

                    newEntities = newEntities.map((entity: Entity, index: number) => {
                        const data = recreateEntityData(previous[entity.get('resource_id')]) as any;
                        entity = api.entities.create(data, {
                            history: false,
                            select: false,
                            index: records[entities[index].get('resource_id')].index + 1
                        });

                        return entity;
                    });

                    if (options.select && api.selection) {
                        api.selection.set(newEntities, { history: false });
                    }

                    previous = null;
                }
            });
        }
    }

    // select duplicated
    if (options.select && api.selection) {
        api.selection.set(newEntities, {
            history: false
        });
    }

    // return duplicated entities in their original order
    const result = new Array<Entity>(newEntities.length);
    for (const id in originalOrder) {
        const pair = originalOrder[id];
        result[pair[0]] = newEntities[pair[1]];
    }

    return result;
}

export { duplicateEntities };
