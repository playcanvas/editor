editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:project');
    var projectUserSettings = editor.call('settings:projectUser');

    const MAX_JOB_LENGTH = 8;
    const TIME_WAIT_ENTITIES = 5000;

    const jobsInProgress = {};

    var resolveEntityScriptAttribute = function (newEntity, attributeDef, path, previousValue, duplicatedIdsMap) {
        var newValue = null;
        var dirty = false;

        if (attributeDef.array) {
            // remap entity array
            newValue = previousValue.slice();
            for (let i = 0; i < newValue.length; i++) {
                if (!newValue[i] || !duplicatedIdsMap[newValue[i]]) continue;
                newValue[i] = duplicatedIdsMap[newValue[i]];
                dirty = true;
            }
        } else {
            // remap entity
            if (!duplicatedIdsMap[previousValue]) return;
            newValue = duplicatedIdsMap[previousValue];
            dirty = true;
        }

        // save changes
        if (dirty) {
            var prevHistory = newEntity.history.enabled;
            newEntity.history.enabled = false;
            newEntity.set(path, newValue);
            newEntity.history.enabled = prevHistory;
        }
    };

    /**
     * When an entity that has properties that contain references to some entities
     * within its subtree is duplicated, the expectation of the user is likely that
     * those properties will be updated to point to the corresponding entities within
     * the newly created duplicate subtree. I realise that sentence is a bit insane,
     * so here is an example:
     *
     * Buttons, Scroll Views and other types of UI component are made up of several
     * related entities. For example, a Scroll View has child entities representing
     * the scroll bar track and handle, as well as the scrollable container area.
     * The Scroll View component needs references to each of these entities so that
     * it can add listeners to them, and move them around.
     *
     * If the user duplicates a Scroll View, they will end up with a set of newly
     * created entities that mirrors the original structure. However, as the properties
     * of all components have been copied verbatim from the original entities, any
     * properties that refer to entities will still refer to the one from the old
     * structure.
     *
     * What needs to happen is that properties that refer to entities within the old
     * duplicated structure are automatically updated to point to the corresponding
     * entities within the new structure. This function implements that requirement.
     *
     * @param {Observer} oldSubtreeRoot - The root entity from the tree that was duplicated
     * @param {Observer} oldEntity - The source entity
     * @param {Observer} newEntity - The duplicated entity
     * @param {object} duplicatedIdsMap - Contains a map that points from the old resource ids to the new resource ids
     */
    var resolveDuplicatedEntityReferenceProperties = function (oldSubtreeRoot, oldEntity, newEntity, duplicatedIdsMap) {
        // TODO Would be nice to also make this work for entity script attributes

        // remap template_ent_ids for template instances
        const templateEntIds = newEntity.get('template_ent_ids');
        if (templateEntIds) {
            const newTemplateEntIds = {};
            for (const oldId in templateEntIds) {
                if (duplicatedIdsMap[oldId]) {
                    newTemplateEntIds[duplicatedIdsMap[oldId]] = templateEntIds[oldId];
                }
            }

            newEntity.set('template_ent_ids', newTemplateEntIds);
        }

        var components = oldEntity.get('components');

        Object.keys(components).forEach(function (componentName) {
            var component = components[componentName];
            var entityFields = editor.call('components:getFieldsOfType', componentName, 'entity');

            entityFields.forEach(function (fieldName) {
                var oldEntityId = component[fieldName];
                var entityWithinOldSubtree = oldSubtreeRoot.entity.findByGuid(oldEntityId);

                if (entityWithinOldSubtree) {
                    var newEntityId = duplicatedIdsMap[oldEntityId];

                    if (newEntityId) {
                        var prevHistory = newEntity.history.enabled;
                        newEntity.history.enabled = false;
                        newEntity.set('components.' + componentName + '.' + fieldName, newEntityId);
                        newEntity.history.enabled = prevHistory;
                    } else {
                        console.warn('Could not find corresponding entity id when resolving duplicated entity references');
                    }
                }
            });
        });

        // remap entity script attributes
        var scriptComponent = oldEntity.get('components.script');
        if (scriptComponent && !settings.get('useLegacyScripts')) {
            for (const scriptName in scriptComponent.scripts) {
                // get script asset
                var scriptAsset = editor.call('assets:scripts:assetByScript', scriptName);
                if (!scriptAsset) continue;

                // go through the script component attribute values
                for (const attributeName in scriptComponent.scripts[scriptName].attributes) {
                    var previousValue = scriptComponent.scripts[scriptName].attributes[attributeName];
                    // early out if the value is null
                    if (!previousValue || (Array.isArray(previousValue) && !previousValue.length)) continue;

                    var attributeDef = scriptAsset.get(`data.scripts.${scriptName}.attributes.${attributeName}`);
                    if (!attributeDef) continue;

                    var componentAttributePath = `components.script.scripts.${scriptName}.attributes.${attributeName}`;

                    if (attributeDef.type === 'json') {
                        if (!Array.isArray(attributeDef.schema)) continue;

                        if (attributeDef.array) {
                            for (let i = 0; i < previousValue.length; i++) {
                                attributeDef.schema.forEach(field => {
                                    if (field.type !== 'entity') return;

                                    resolveEntityScriptAttribute(
                                        newEntity,
                                        field,
                                        `${componentAttributePath}.${i}.${field.name}`,
                                        previousValue[i] ? previousValue[i][field.name] : null,
                                        duplicatedIdsMap
                                    );
                                });
                            }
                        } else {
                            attributeDef.schema.forEach(field => {
                                if (field.type !== 'entity') return;

                                resolveEntityScriptAttribute(
                                    newEntity,
                                    field,
                                    `${componentAttributePath}.${field.name}`,
                                    previousValue[field.name],
                                    duplicatedIdsMap
                                );
                            });
                        }
                    } else if (attributeDef.type === 'entity') {
                        resolveEntityScriptAttribute(
                            newEntity,
                            attributeDef,
                            componentAttributePath,
                            previousValue,
                            duplicatedIdsMap
                        );
                    }
                }
            }
        }

        // Recurse into children. Note that we continue to pass in the same `oldSubtreeRoot`,
        // in order to correctly handle cases where a child has an entity reference
        // field that points to a parent or other ancestor that is still within the
        // duplicated subtree.
        var oldChildren = oldEntity.get('children');
        var newChildren = newEntity.get('children');

        if (oldChildren && oldChildren.length > 0) {
            oldChildren.forEach(function (oldChildId, index) {
                var oldChild = editor.call('entities:get', oldChildId);
                var newChild = editor.call('entities:get', newChildren[index]);

                resolveDuplicatedEntityReferenceProperties(oldSubtreeRoot, oldChild, newChild, duplicatedIdsMap);
            });
        }
    };

    // Gets the resource id of the parent of the entity with the specified resource id
    var getParent = function (childResourceId) {
        return editor.call('entities:getParentResourceId', childResourceId);
    };

    var splitEntityNameAndNumber = function (entityName) {
        var name = '';
        var number = 1;

        // step from end of string character by character checking to see if we have a trailing number
        // stopping when the string we are constructing is no longer a valid number
        var numberString = '';
        var foundNumber = true;
        for (let i = entityName.length - 1; i >= 0; i--) {
            var char = entityName.charAt(i);
            if (foundNumber) {
                numberString = char + numberString;
                foundNumber = /^\d+$/.test(numberString);
                if (foundNumber) {
                    number = parseInt(numberString);
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
    };

    var isEntityNameTaken = function (name, entities) {
        for (var j = 0; j < entities.length; j++) {
            const entity = entities[j];
            const entityName = entities[j].name;
            if (entity && entityName === name) {
                return true;
            }
        }
        return false;
    };

    var getUniqueNameForDuplicatedEntity = function (entityName, entities) {
        var entityNameAndNumber = splitEntityNameAndNumber(entityName); // if entityName === '1box23' then name === '1box' and number === 23,  if entityName === '1' then name === '' and number === 1
        var name = entityNameAndNumber.name;
        var number = entityNameAndNumber.number;

        var startIndex = number + 1;
        var newUniqueName = name + startIndex;
        while (isEntityNameTaken(newUniqueName, entities)) {
            newUniqueName = name + startIndex++;
        }
        return newUniqueName;
    };

    /**
     * Duplicates an entity in the scene
     *
     * @param {Observer} entity - The entity
     * @param {Observer} parent - The parent of the new entity
     * @param {number} ind - The index in the parent's children array where we want to insert the new entity
     * @param {object} duplicatedIdsMap - A guid->guid map that contains references from the source resource ids to the new resource ids
     * @param {boolean} useUniqueName - Controls whether duplicated entity will have a unique name
     * @returns {Observer} The new entity
     */
    var duplicateEntity = function (entity, parent, ind, duplicatedIdsMap, useUniqueName) {
        var originalResourceId = entity.get('resource_id');
        var data = entity.json();
        var children = data.children;

        data.children = [];
        if (useUniqueName) {
            data.name = getUniqueNameForDuplicatedEntity(data.name, parent.entity.children);
        }
        data.resource_id = pc.guid.create();
        data.parent = parent.get('resource_id');

        entity = new Observer(data);
        editor.call('entities:updateChildToParentIndex', entity.get('resource_id'), parent.get('resource_id'));
        duplicatedIdsMap[originalResourceId] = entity.get('resource_id');

        // create new guids for any missing entities in template_ent_ids
        const templateEntIds = entity.get('template_ent_ids');
        if (templateEntIds) {
            for (const key in templateEntIds) {
                if (!duplicatedIdsMap[key] && !editor.call('entities:get', key)) {
                    duplicatedIdsMap[key] = pc.guid.create();
                }
            }
        }

        // call add event
        editor.call('entities:add', entity);

        // sharedb
        editor.call('realtime:scene:op', {
            p: ['entities', entity.get('resource_id')],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        // add children too
        children.forEach(function (childId) {
            duplicateEntity(editor.call('entities:get', childId), entity, undefined, duplicatedIdsMap);
        });

        return entity;
    };

    // Gets the count of the entities and their children
    function getTotalEntityCount(entities) {
        let count = entities.length;

        for (let i = 0; i < entities.length; i++) {
            if (entities[i]) {
                const children = entities[i].get('children');
                count += getTotalEntityCount(children.map(id => editor.call('entities:get', id)));
            }
        }

        return count;
    }

    function duplicateInBackend(data) {
        let entityIds;
        let cancelWaitForEntities;

        function undo() {
            if (cancelWaitForEntities) {
                cancelWaitForEntities();
                cancelWaitForEntities = null;
            }

            if (!entityIds || !entityIds.length) return;

            // first deselect entities so that the undo action
            // does not then add a deselect action to the history
            // which will prevent us from 'redo'
            const selectorHistory = editor.call('selector:history');
            editor.call('selector:history', false);
            let dirtySelection = false;
            entityIds.forEach(id => {
                const entity = editor.call('entities:get', id);
                if (entity) {
                    if (editor.call('selector:has', entity)) {
                        editor.call('selector:remove', entity);
                        dirtySelection = true;
                    }
                }
            });

            if (dirtySelection) {
                editor.once('selector:change', () => {
                    // restore selection history
                    editor.call('selector:history', selectorHistory);
                });
            } else {
                editor.call('selector:history', selectorHistory);
            }

            // delete entities in the backend if they were pasted in the backend
            editor.call('entities:deleteInBackend', entityIds);

            entityIds = null;
        }

        function redo() {
            const jobId = pc.guid.create().substring(0, MAX_JOB_LENGTH);

            jobsInProgress[jobId] = (newEntityIds) => {
                entityIds = newEntityIds;
                cancelWaitForEntities = editor.call('entities:waitToExist', newEntityIds, TIME_WAIT_ENTITIES, entities => {
                    editor.call('selector:history', false);
                    editor.call('selector:set', 'entity', entities);
                    editor.once('selector:change', function () {
                        editor.call('selector:history', true);
                    });
                });
            };

            const taskData = {
                projectId: config.project.id,
                branchId: config.self.branch.id,
                sceneId: config.scene.uniqueId,
                jobId: jobId,
                entities: data
            };

            editor.call('realtime:send', 'pipeline', {
                name: 'entities-duplicate',
                data: taskData
            });

            editor.call('status:job', jobId, 1);
        }

        redo();

        // add history
        editor.call('history:add', {
            name: 'duplicate entities',
            undo: undo,
            redo: redo
        });
    }

    editor.on('messenger:entity.copy', data => {
        if (jobsInProgress.hasOwnProperty(data.job_id)) {
            const callback = jobsInProgress[data.job_id];

            // clear pending job
            editor.call('status:job', data.job_id);
            delete jobsInProgress[data.job_id];

            const result = data.multTaskResults.map(d => d.newRootId);
            callback(result);
        }
    });

    /**
     * Duplicates the specified entities and adds them to the scene.
     *
     * @param {Observer[]} entities - The entities to duplicate
     */
    editor.method('entities:duplicate', function (entities) {
        var i;
        var id;
        var item;
        var root = editor.call('entities:root');
        var items = entities.slice(0);
        var entitiesNew = [];
        var entitiesNewData = [];
        var entitiesNewMeta = {};
        var ids = {};

        // make sure not duplicating root
        if (items.indexOf(root) !== -1)
            return;

        // build entities index
        for (i = 0; i < items.length; i++) {
            id = items[i].get('resource_id');

            ids[id] = {
                id: id,
                entity: items[i],
                parentId: getParent(id),
                ind: editor.call('entities:get', getParent(id)).get('children').indexOf(id)
            };
        }

        // filter children off
        i = items.length;
        while (i--) {
            item = ids[items[i].get('resource_id')];
            var parentId = item.parentId;

            while (parentId && parentId !== root.get('resource_id')) {
                if (ids[parentId]) {
                    items.splice(i, 1);
                    delete ids[item.id];
                    break;
                }
                parentId = getParent(parentId);
            }
        }

        // sort by order index within parent
        items.sort(function (a, b) {
            return ids[b.get('resource_id')].ind - ids[a.get('resource_id')].ind;
        });

        // if we have a lot of entities duplicate in the backend
        if (getTotalEntityCount(items) > COPY_OR_DELETE_IN_BACKEND_LIMIT) {
            duplicateInBackend(items.map(entity => entity.get('resource_id')));
            return;
        }

        // remember current selection
        var selectorType = editor.call('selector:type');
        var selectorItems = editor.call('selector:items');
        for (i = 0; i < selectorItems.length; i++) {
            item = selectorItems[i];
            if (selectorType === 'entity') {
                selectorItems[i] = {
                    type: 'entity',
                    id: item.get('resource_id')
                };
            } else if (selectorType === 'asset') {
                selectorItems[i] = {};
                if (selectorItems[i].get('type') === 'script') {
                    selectorItems[i].type = 'script';
                    selectorItems[i].id = item.get('filename');
                } else {
                    selectorItems[i].type = 'asset';
                    selectorItems[i].id = item.get('id');
                }
            }
        }

        // duplicate
        for (i = 0; i < items.length; i++) {
            var entity = items[i];
            id = entity.get('resource_id');
            var parent = editor.call('entities:get', getParent(id));
            var duplicatedIdsMap = {};
            var entityNew = duplicateEntity(entity, parent, ids[id].ind + 1, duplicatedIdsMap, projectUserSettings.get('editor.renameDuplicatedEntities'));
            resolveDuplicatedEntityReferenceProperties(entity, entity, entityNew, duplicatedIdsMap);
            entitiesNew.push(entityNew);
            entitiesNewData.push(entityNew.json());
            entitiesNewMeta[entityNew.get('resource_id')] = {
                parentId: getParent(id),
                ind: ids[id].ind
            };
        }

        // set new selection
        setTimeout(function () {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', entitiesNew);
            editor.once('selector:change', function () {
                editor.call('selector:history', true);
            });
        }, 0);

        // add history action
        editor.call('history:add', {
            name: 'duplicate entities',
            undo: function () {
                var i;

                // remove duplicated entities
                for (i = 0; i < entitiesNewData.length; i++) {
                    var entity = editor.call('entities:get', entitiesNewData[i].resource_id);
                    if (!entity)
                        continue;

                    editor.call('entities:removeEntity', entity);
                }

                // restore selection
                if (selectorType) {
                    var items = [];
                    for (i = 0; i < selectorItems.length; i++) {
                        var item;

                        if (selectorItems[i].type === 'entity') {
                            item = editor.call('entities:get', selectorItems[i].id);
                        } else if (selectorItems[i].type === 'asset') {
                            item = editor.call('assets:get', selectorItems[i].id);
                        } else if (selectorItems[i].type === 'script') {
                            item = editor.call('sourcefiles:get', selectorItems[i].id);
                        }

                        if (!item)
                            continue;

                        items.push(item);
                    }

                    if (items.length) {
                        editor.call('selector:history', false);
                        editor.call('selector:set', selectorType, items);
                        editor.once('selector:change', function () {
                            editor.call('selector:history', true);
                        });
                    }
                }
            },
            redo: function () {
                var entities = [];

                for (let i = 0; i < entitiesNewData.length; i++) {
                    var id = entitiesNewData[i].resource_id;
                    var meta = entitiesNewMeta[id];
                    if (!meta)
                        continue;

                    var parent = editor.call('entities:get', meta.parentId);
                    if (!parent)
                        continue;

                    var entity = new Observer(entitiesNewData[i]);
                    editor.call('entities:addEntity', entity, parent, true, meta.ind + 1);

                    entities.push(entity);
                }

                if (entities.length) {
                    setTimeout(function () {
                        editor.call('selector:history', false);
                        editor.call('selector:set', 'entity', entities);
                        editor.once('selector:change', function () {
                            editor.call('selector:history', true);
                        });
                    }, 0);
                }
            }
        });
    });
});
