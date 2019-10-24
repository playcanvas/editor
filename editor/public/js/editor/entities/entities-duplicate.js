editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:project');

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
     * @param {Observer} oldSubtreeRoot The root entity from the tree that was duplicated
     * @param {Observer} oldEntity The source entity
     * @param {Observer} newEntity The duplicated entity
     * @param {Object} duplicatedIdsMap Contains a map that points from the old resource ids to the new resource ids
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
            for (var scriptName in scriptComponent.scripts) {
                // get script asset
                var scriptAsset = editor.call('assets:scripts:assetByScript', scriptName);
                if (!scriptAsset) continue;

                // go through the script component attribute values
                for (var attributeName in scriptComponent.scripts[scriptName].attributes) {
                    var previousValue = scriptComponent.scripts[scriptName].attributes[attributeName];
                    // early out if the value is null
                    if (!previousValue || (Array.isArray(previousValue) && !previousValue.length)) continue;

                    // get the attribute definition from the asset and make sure it's an entity type
                    var attributeDef = scriptAsset.get('data.scripts.' + scriptName + '.attributes.' + attributeName);
                    if (!attributeDef || attributeDef.type !== 'entity') continue;

                    var newValue = null;
                    var dirty = false;

                    if (attributeDef.array) {
                        // remap entity array
                        newValue = previousValue.slice();
                        for (var i = 0; i < newValue.length; i++) {
                            if (!newValue[i] || !duplicatedIdsMap[newValue[i]]) continue;
                            newValue[i] = duplicatedIdsMap[newValue[i]];
                            dirty = true;
                        }
                    } else {
                        // remap entity
                        if (!duplicatedIdsMap[previousValue]) continue;
                        newValue = duplicatedIdsMap[previousValue];
                        dirty = true;
                    }

                    // save changes
                    if (dirty) {
                        var prevHistory = newEntity.history.enabled;
                        newEntity.history.enabled = false;
                        newEntity.set('components.script.scripts.' + scriptName + '.attributes.' + attributeName, newValue);
                        newEntity.history.enabled = prevHistory;
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

    /**
     * Duplicates an entity in the scene
     * @param {Observer} entity The entity
     * @param {Observer} parent The parent of the new entity
     * @param {Number} ind The index in the parent's children array where we want to insert the new entity
     * @param {Object} duplicatedIdsMap A guid->guid map that contains references from the source resource ids to the new resource ids
     * @returns {Observer} The new entity
     */
    var duplicateEntity = function (entity, parent, ind, duplicatedIdsMap) {
        var originalResourceId = entity.get('resource_id');
        var data = entity.json();
        var children = data.children;

        data.children = [];
        data.resource_id = pc.guid.create();
        data.parent = parent.get('resource_id');

        entity = new Observer(data);
        editor.call('entities:updateChildToParentIndex', entity.get('resource_id'), parent.get('resource_id'));
        duplicatedIdsMap[originalResourceId] = entity.get('resource_id');

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

    /**
     * Duplicates the specified entities and adds them to the scene.
     * @param {Observer[]} entities The entities to duplicate
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
            var entityNew = duplicateEntity(entity, parent, ids[id].ind + 1, duplicatedIdsMap);
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

                for (var i = 0; i < entitiesNewData.length; i++) {
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
