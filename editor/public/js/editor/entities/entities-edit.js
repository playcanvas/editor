editor.once('load', function() {
    'use strict';

    // index
    var childToParent = { };

    var deletedCache = { };

    // add
    editor.on('entities:add', function(entity) {
        var children = entity.get('children');
        for(var i = 0; i < children.length; i++)
            childToParent[children[i]] = entity.get('resource_id');

        entity.on('children:insert', function(value) {
            childToParent[value] = this.get('resource_id');
        });
        entity.on('children:remove', function(value) {
            delete childToParent[value];
        });
    });

    editor.method('entities:childToParent', function(child, parent) {
        childToParent[child.get('resource_id')] = parent.get('resource_id');
    });

    var createNewEntityData = function(raw, parentResourceId) {
        var entityData = {
            name: raw.name || 'New Entity',
            tags: [ ],
            enabled: true,
            resource_id: pc.guid.create(),
            parent: parentResourceId,
            children: [ ],
            position: raw.position || [ 0, 0, 0 ],
            rotation: raw.rotation || [ 0, 0, 0 ],
            scale: raw.scale || [ 1, 1, 1 ],
            components: raw.components || { },
            __postCreationCallback: raw.postCreationCallback
        };

        if (raw.children) {
            for (var i = 0; i < raw.children.length; i++) {
                var childEntityData = createNewEntityData(raw.children[i], entityData.resource_id);
                entityData.children.push(childEntityData);
            }
        }

        return entityData;
    };

    // Create a new entity.
    //
    // The `raw` data can also define a postCreationCallback argument at each level, which is
    // designed for cases where composite entity hierarchies need some post-processing, and the
    // post processing needs to be done both in the case of initial creation and also the case
    // of undo/redo.
    editor.method('entities:new', function (raw) {
        // get root if parent is null
        raw = raw || { };
        var parent = raw.parent || editor.call('entities:root');

        var data = createNewEntityData(raw, parent.get('resource_id'));

        var selectorType, selectorItems;

        if (! raw.noHistory) {
            var selectorType = editor.call('selector:type');
            var selectorItems = editor.call('selector:items');
            if (selectorType === 'entity') {
                for(var i = 0; i < selectorItems.length; i++)
                    selectorItems[i] = selectorItems[i].get('resource_id');
            }
        }

        // create new Entity data
        var entity = new Observer(data);
        childToParent[entity.get('resource_id')] = parent.get('resource_id');
        addEntity(entity, parent, ! raw.noSelect);

        // history
        if (! raw.noHistory) {
            var resourceId = entity.get('resource_id');
            var parentId = parent.get('resource_id');

            editor.call('history:add', {
                name: 'new entity ' + resourceId,
                undo: function() {
                    var entity = editor.call('entities:get', resourceId);
                    if (! entity)
                        return;

                    removeEntity(entity);

                    if (selectorType === 'entity' && selectorItems.length) {
                        var items = [ ];
                        for(var i = 0; i < selectorItems.length; i++) {
                            var item = editor.call('entities:get', selectorItems[i]);
                            if (item)
                                items.push(item);
                        }

                        if (items.length) {
                            editor.call('selector:history', false);
                            editor.call('selector:set', selectorType, items);
                            editor.once('selector:change', function() {
                                editor.call('selector:history', true);
                            });
                        }
                    }
                },
                redo: function() {
                    var parent = editor.call('entities:get', parentId);
                    if (! parent)
                        return;

                    var entity = new Observer(data);
                    childToParent[entity.get('resource_id')] = parent.get('resource_id');
                    addEntity(entity, parent, true);
                }
            });
        }

        return entity;
    });

    // When entities are deleted, we need to do some work to identify references to the
    // deleted entities held by other entities in the graph. For example, if entityA has
    // a component that holds a reference to entityB and entityB is deleted, we should
    // nullify the reference so that entityA's component does not retain or try to access
    // the deleted entity. Similarly, if the deletion is undone, we need to re-populate
    // the reference so that it points once again at entityB.
    //
    // To achieve this, we perform a quick scan of the graph whenever one or more entities
    // are deleted, to build a snapshot of the entity references at that time. The snapshot
    // (which is just a map) is then used for identifying all references to any of the deleted
    // entities, and these are set to null. If the deletion is subsequently undone, the map
    // is used again in order to set all references back to the correct entity guids.
    var recursivelySearchForEntityReferences = function(sourceEntity, entityReferencesMap) {
        var componentNames = Object.keys(sourceEntity.get('components') || {});
        var i, j;

        for (i = 0; i < componentNames.length; i++) {
            var componentName = componentNames[i];
            var entityFields = editor.call('components:getFieldsOfType', componentName, 'entity');

            for (j = 0; j < entityFields.length; j++) {
                var fieldName = entityFields[j];
                var targetEntityGuid = sourceEntity.get('components.' + componentName + '.' + fieldName);

                entityReferencesMap[targetEntityGuid] = entityReferencesMap[targetEntityGuid] || [];
                entityReferencesMap[targetEntityGuid].push({
                    sourceEntityGuid: sourceEntity.get('resource_id'),
                    componentName: componentName,
                    fieldName: fieldName
                });
            }
        }

        var children = sourceEntity.get('children');

        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                recursivelySearchForEntityReferences(editor.call('entities:get', children[i]), entityReferencesMap);
            }
        }
    };

    var updateEntityReferenceFields = function(entityReferencesMap, oldValue, newValue) {
        var referencesToThisEntity = entityReferencesMap[oldValue];

        if (referencesToThisEntity) {
            referencesToThisEntity.forEach(function(reference) {
                var sourceEntity = editor.call('entities:get', reference.sourceEntityGuid);

                if (sourceEntity) {
                    var prevHistory = sourceEntity.history.enabled;
                    sourceEntity.history.enabled = false;
                    sourceEntity.set('components.' + reference.componentName + '.' + reference.fieldName, newValue);
                    sourceEntity.history.enabled = prevHistory;
                }
            });
        }
    };

    var addEntity = function(entity, parent, select, ind, entityReferencesMap) {
        entityReferencesMap = entityReferencesMap || {};

        var children = entity.get('children');
        if (children.length)
            entity.set('children', [ ]);

        // call add event
        editor.call('entities:add', entity);

        // shareDb
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        if (select) {
            setTimeout(function() {
                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', [ entity ]);
                editor.once('selector:change', function() {
                    editor.call('selector:history', true);
                });
            }, 0);
        }

        // add children too
        children.forEach(function(childIdOrData) {
            var data;

            // If we've been provided an id, we're re-creating children from the deletedCache
            if (typeof childIdOrData === 'string') {
                data = deletedCache[childIdOrData];
                if (!data) {
                    return;
                }
            // If we've been provided an object, we're creating children for a new entity
            } else if (typeof childIdOrData === 'object') {
                data = childIdOrData;
            } else {
                throw new Error('Unhandled childIdOrData format');
            }

            var child = new Observer(data);
            childToParent[child.get('resource_id')] = entity.get('resource_id');
            addEntity(child, entity, undefined, undefined, entityReferencesMap);
        });

        // Hook up any entity references which need to be pointed to this newly created entity
        // (happens when addEntity() is being called during the undoing of a deletion). In order
        // to force components to respond to the setter call even when they are running in other
        // tabs or in the Launch window, we unfortunately have to use a setTimeout() hack :(
        var guid = entity.get('resource_id');

        // First set all entity reference fields targeting this guid to null
        updateEntityReferenceFields(entityReferencesMap, guid, null);
        setTimeout(function() {
            // Then update the same fields to target the guid again
            updateEntityReferenceFields(entityReferencesMap, guid, guid);
        }, 0);

        if (entity.get('__postCreationCallback')) {
            entity.get('__postCreationCallback')(entity);
        }
    };

    var removeEntity = function(entity, entityReferencesMap) {
        entityReferencesMap = entityReferencesMap || {};
        deletedCache[entity.get('resource_id')] = entity.json();

        // Nullify any entity references which currently point to this guid
        updateEntityReferenceFields(entityReferencesMap, entity.get('resource_id'), null);

        // remove children
        entity.get('children').forEach(function (child) {
            var entity = editor.call('entities:get', child);
            if (! entity)
                return;

            removeEntity(entity, entityReferencesMap);
        });

        if (editor.call('selector:type') === 'entity' && editor.call('selector:items').indexOf(entity) !== -1) {
            editor.call('selector:history', false);
            editor.call('selector:remove', entity);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });
        }

        // remove from parent
        var parentId = childToParent[entity.get('resource_id')];
        if (parentId) {
            var parent = editor.call('entities:get', parentId);
            if (parent) {
                parent.history.enabled = false;
                parent.removeValue('children', entity.get('resource_id'));
                parent.history.enabled = true;
            }
        }

        // call remove method
        editor.call('entities:remove', entity);

        // sharedb
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            od: { }
        });
    };

    editor.method('entities:addEntity', addEntity);
    editor.method('entities:removeEntity', removeEntity);

    var duplicateEntity = function(entity, parent, ind, duplicatedIdsMap) {
        var originalResourceId = entity.get('resource_id');
        var data = entity.json();
        var children = data.children;

        data.children = [ ];
        data.resource_id = pc.guid.create();
        data.parent = parent.get('resource_id');

        entity = new Observer(data);
        childToParent[entity.get('resource_id')] = parent.get('resource_id');
        duplicatedIdsMap[originalResourceId] = entity.get('resource_id');

        // call add event
        editor.call('entities:add', entity);

        // sharedb
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        // add children too
        children.forEach(function(childId) {
            duplicateEntity(editor.call('entities:get', childId), entity, undefined, duplicatedIdsMap);
        });

        return entity;
    };

    // When an entity that has properties that contain references to some entities
    // within its subtree is duplicated, the expectation of the user is likely that
    // those properties will be updated to point to the corresponding entities within
    // the newly created duplicate subtree. I realise that sentence is a bit insane,
    // so here is an example:
    //
    // Buttons, Scroll Views and other types of UI component are made up of several
    // related entities. For example, a Scroll View has child entities representing
    // the scroll bar track and handle, as well as the scrollable container area.
    // The Scroll View component needs references to each of these entities so that
    // it can add listeners to them, and move them around.
    //
    // If the user duplicates a Scroll View, they will end up with a set of newly
    // created entities that mirrors the original structure. However, as the properties
    // of all components have been copied verbatim from the original entities, any
    // properties that refer to entities will still refer to the one from the old
    // structure.
    //
    // What needs to happen is that properties that refer to entities within the old
    // duplicated structure are automatically updated to point to the corresponding
    // entities within the new structure. This function implements that requirement.
    var resolveDuplicatedEntityReferenceProperties = function(oldSubtreeRoot, oldEntity, newEntity, duplicatedIdsMap) {
        // TODO Would be nice to also make this work for entity script attributes

        var components = oldEntity.get('components');

        Object.keys(components).forEach(function(componentName) {
            var component = components[componentName];
            var entityFields = editor.call('components:getFieldsOfType', componentName, 'entity');

            entityFields.forEach(function(fieldName) {
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
        if (scriptComponent) {
            for (var scriptName in scriptComponent.scripts) {
                // get script asset
                var scriptAsset = editor.call('assets:scripts:assetByScript', scriptName);
                if (! scriptAsset) continue;

                // go through the script component attribute values
                for (var attributeName in scriptComponent.scripts[scriptName].attributes) {
                    var previousValue = scriptComponent.scripts[scriptName].attributes[attributeName];
                    // early out if the value is null
                    if (! previousValue && ! previousValue.length) continue;

                    // get the attribute definition from the asset and make sure it's an entity type
                    var attributeDef = scriptAsset.get('data.scripts.' + scriptName + '.attributes.' + attributeName);
                    if (! attributeDef || attributeDef.type !== 'entity') continue;

                    var newValue = null;
                    var dirty = false;

                    if (attributeDef.array) {
                        // remap entity array
                        newValue = previousValue.slice();
                        for (var i = 0; i < newValue.length; i++) {
                            if (! newValue[i] || ! duplicatedIdsMap[newValue[i]]) continue;
                            newValue[i] = duplicatedIdsMap[newValue[i]];
                            dirty = true;
                        }
                    } else {
                        // remap entity
                        if (! duplicatedIdsMap[previousValue]) continue;
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
            oldChildren.forEach(function(oldChildId, index) {
                var oldChild = editor.call('entities:get', oldChildId);
                var newChild = editor.call('entities:get', newChildren[index]);

                resolveDuplicatedEntityReferenceProperties(oldSubtreeRoot, oldChild, newChild, duplicatedIdsMap);
            });
        }
    };

    // duplicate entity
    editor.method('entities:duplicate', function (entities) {
        var root = editor.call('entities:root');
        var items = entities.slice(0);
        var entitiesNew = [ ];
        var entitiesNewData = [ ];
        var entitiesNewMeta = { };
        var ids = { };

        // make sure not duplicating root
        if (items.indexOf(root) !== -1)
            return;

        // build entities index
        for(var i = 0; i < items.length; i++) {
            var id = items[i].get('resource_id');

            ids[id] = {
                id: id,
                entity: items[i],
                parentId: childToParent[id],
                ind: editor.call('entities:get', childToParent[id]).get('children').indexOf(id)
            };
        }

        // filter children off
        var i = items.length;
        while(i--) {
            var item = ids[items[i].get('resource_id')];
            var parentId = item.parentId;

            while(parentId && parentId !== root.get('resource_id')) {
                if (ids[parentId]) {
                    items.splice(i, 1);
                    delete ids[item.id];
                    break;
                }
                parentId = childToParent[parentId];
            }
        }

        // sort by order index within parent
        items.sort(function(a, b) {
            return ids[b.get('resource_id')].ind - ids[a.get('resource_id')].ind;
        });

        // remember current selection
        var selectorType = editor.call('selector:type');
        var selectorItems = editor.call('selector:items');
        for(var i = 0; i < selectorItems.length; i++) {
            var item = selectorItems[i];
            if (selectorType === 'entity') {
                selectorItems[i] = {
                    type: 'entity',
                    id: item.get('resource_id')
                };
            } else if (selectorType === 'asset') {
                selectorItems[i] = { };
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
        for(var i = 0; i < items.length; i++) {
            var entity = items[i];
            var id = entity.get('resource_id');
            var parent = editor.call('entities:get', childToParent[id]);
            var duplicatedIdsMap = {};
            var entityNew = duplicateEntity(entity, parent, ids[id].ind + 1, duplicatedIdsMap);
            resolveDuplicatedEntityReferenceProperties(entity, entity, entityNew, duplicatedIdsMap);
            entitiesNew.push(entityNew);
            entitiesNewData.push(entityNew.json());
            entitiesNewMeta[entityNew.get('resource_id')] = {
                parentId: childToParent[id],
                ind: ids[id].ind
            };
        }

        // set new selection
        setTimeout(function() {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', entitiesNew);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });
        }, 0);

        // add history action
        editor.call('history:add', {
            name: 'duplicate entities',
            undo: function() {
                // remove duplicated entities
                for(var i = 0; i < entitiesNewData.length; i++) {
                    var entity = editor.call('entities:get', entitiesNewData[i].resource_id);
                    if (! entity)
                        continue;

                    removeEntity(entity);
                }

                // restore selection
                if (selectorType) {
                    var items = [ ];
                    for(var i = 0; i < selectorItems.length; i++) {
                        var item;

                        if (selectorItems[i].type === 'entity') {
                            item = editor.call('entities:get', selectorItems[i].id);
                        } else if (selectorItems[i].type === 'asset') {
                            item = editor.call('assets:get', selectorItems[i].id);
                        } else if (selectorItems[i].type === 'script') {
                            item = editor.call('sourcefiles:get', selectorItems[i].id);
                        }

                        if (! item)
                            continue;

                        items.push(item);
                    }

                    if (items.length) {
                        editor.call('selector:history', false);
                        editor.call('selector:set', selectorType, items);
                        editor.once('selector:change', function() {
                            editor.call('selector:history', true);
                        });
                    }
                }
            },
            redo: function() {
                var entities = [ ];

                for(var i = 0; i < entitiesNewData.length; i++) {
                    var id = entitiesNewData[i].resource_id;
                    var meta = entitiesNewMeta[id];
                    if (! meta)
                        continue;

                    var parent = editor.call('entities:get', meta.parentId);
                    if (! parent)
                        continue;

                    var entity = new Observer(entitiesNewData[i]);
                    childToParent[id] = meta.parentId;
                    addEntity(entity, parent, true, meta.ind + 1);

                    entities.push(entity);
                }

                if (entities.length) {
                    setTimeout(function() {
                        editor.call('selector:history', false);
                        editor.call('selector:set', 'entity', entities);
                        editor.once('selector:change', function() {
                            editor.call('selector:history', true);
                        });
                    }, 0);
                }
            }
        });
    });

    // delete entity
    editor.method('entities:delete', function (items) {
        var records = [ ];
        var itemsToDelete = [ ];

        // index items
        var itemsIds = { };
        for(var i = 0; i < items.length; i++) {
            itemsIds[items[i].get('resource_id')] = items[i];
        }

        // find out if item has ancestor
        for(var i = 0; i < items.length; i++) {
            var child = false;
            var parent = childToParent[items[i].get('resource_id')];
            while(! child && parent) {
                if (itemsIds[parent]) {
                    child = true;
                } else {
                    parent = childToParent[parent]
                }
            }

            if (! child)
                itemsToDelete.push(items[i]);
        }

        // delete only non-childed items
        items = itemsToDelete;

        for(var i = 0; i < items.length; i++) {
            var resourceId = items[i].get('resource_id');
            var parentId = childToParent[resourceId];
            var ind;
            if (parentId) {
                var parent = editor.call('entities:get', parentId);
                if (parent)
                    ind = parent.get('children').indexOf(resourceId);
            }

            records.push({
                resourceId: resourceId,
                parentId: parentId,
                ind: ind,
                data: items[i].json()
            });
        }

        // Build a map of representing all entity reference properties in the graph. This is
        // effectively a snapshot of the entity references as they were at the point of deletion,
        // so that they can be re-constituted later if the deletion is undone.
        var entityReferencesMap = {};
        recursivelySearchForEntityReferences(editor.call('entities:root'), entityReferencesMap);

        for(var i = 0; i < items.length; i++) {
            removeEntity(items[i], entityReferencesMap);
        }

        // sort records by index
        // so that items are re-added
        // in the correct order in undo
        records.sort(function (a, b) {
            return a.ind - b.ind;
        });

        editor.call('history:add', {
            name: 'delete entities',
            undo: function() {
                var items = [ ];
                for (var i = 0, len = records.length; i < len; i++) {
                    var parent = editor.call('entities:get', records[i].parentId);
                    if (! parent)
                        return;

                    var entity = new Observer(records[i].data);
                    items.push(entity);
                    childToParent[entity.get('resource_id')] = parent.get('resource_id');
                    addEntity(entity, parent, false, records[i].ind, entityReferencesMap);
                }

                setTimeout(function() {
                    editor.call('selector:history', false);
                    editor.call('selector:set', 'entity', items);
                    editor.once('selector:change', function() {
                        editor.call('selector:history', true);
                    });
                }, 0);
            },
            redo: function() {
                for(var i = 0, len = records.length; i < len; i++) {
                    var entity = editor.call('entities:get', records[i].resourceId);
                    if (! entity)
                        return;

                    removeEntity(entity, entityReferencesMap);
                }
            }
        });
    });

    // copy entity to local storage
    editor.method('entities:copy', function (entities) {
        var settings = editor.call('settings:project');

        var data = {
            project: config.project.id,
            legacy_scripts: settings.get('useLegacyScripts'),
            hierarchy: {},
            assets: {}
        };

        // store asset path in data by converting the array of
        // folder ids to an array of folder names
        var storeAssetPath = function (assetId) {
            if (! assetId || data.assets[assetId])
                return;

            var asset = editor.call('assets:get', assetId);
            if (! asset)
                return;

            var parts = [];

            var path = asset.get('path');
            if (path && path.length) {
                for (var i = 0; i < path.length; i++) {
                    var a = editor.call('assets:get', path[i]);
                    if (! a) continue;

                    parts.push(a.get('name'));
                }
            }

            parts.push(asset.get('name'));

            data.assets[assetId] = {
                path: parts,
                type: asset.get('type')
            };
        };

        var componentAssetPaths = editor.call('components:assetPaths');

        var containsStar = /\.\*\./;

        // gather all dependencies of this entity
        var gatherDependencies = function (entity) {
            // store entity json
            var resourceId = entity.get('resource_id');
            if (! data.hierarchy[resourceId]) {
                data.hierarchy[resourceId] = entity.json();
            }

            // gather all asset references from the entity
            // and store their path + name
            for (var i = 0; i < componentAssetPaths.length; i++) {
                var path = componentAssetPaths[i];

                // handle paths that contain a '*' as a wildcard
                if (containsStar.test(path)) {
                    var parts = path.split('.*.');
                    if (! entity.has(parts[0])) continue;

                    var obj = entity.get(parts[0]);
                    if (! obj) continue;

                    for (var key in obj) {
                        var fullKey = parts[0] + '.' + key + '.' + parts[1];
                        if (! entity.has(fullKey))
                            continue;

                        var assets = entity.get(fullKey);
                        if (! assets) continue;
                        if (assets instanceof Array) {
                            assets.forEach(storeAssetPath);
                        } else {
                            storeAssetPath(assets);
                        }
                    }
                } else if (entity.has(path)) {
                    // handle path without '*'
                    var assets = entity.get(path);
                    if (! assets) continue;

                    if (assets instanceof Array) {
                        assets.forEach(storeAssetPath);
                    } else {
                        storeAssetPath(assets);
                    }
                }
            }

            // gather script attributes
            if (entity.has('components.script.scripts')) {
                var scripts = entity.get('components.script.scripts');
                if (scripts) {
                    // legacy scripts
                    if (settings.get('useLegacyScripts')) {
                        for (var i = 0, len = scripts.length; i < len; i++) {
                            var script = scripts[i];
                            if (! script.attributes) continue;
                            for (var name in script.attributes) {
                                var attr = script.attributes[name];
                                if (! attr) continue;
                                if (attr.type === 'asset') {
                                    if (attr.value) {
                                        if (attr.value.length) {
                                            attr.value.forEach(storeAssetPath);
                                        } else {
                                            storeAssetPath(attr.value);
                                        }
                                    }

                                    if (attr.defaultValue) {
                                        if (attr.defaultValue.length) {
                                            attr.defaultValue.forEach(storeAssetPath);
                                        } else {
                                            storeAssetPath(attr.defaultValue);
                                        }
                                    }

                                }
                            }
                        }
                    } else {
                        // scripts 2.0
                        for (var key in scripts) {
                            var scriptData = scripts[key];
                            if (! scriptData || ! scriptData.attributes) continue;

                            var asset = editor.call('assets:scripts:assetByScript', key);
                            if (! asset) continue;

                            // search for asset script attributes in script asset
                            var assetData = asset.get('data.scripts.' + key + '.attributes');
                            if (!assetData) continue;

                            for (var name in assetData) {
                                if (assetData[name].type === 'asset' && scriptData.attributes[name]) {
                                    if (assetData[name].array) {
                                        scriptData.attributes[name].forEach(storeAssetPath);
                                    } else {
                                        storeAssetPath(scriptData.attributes[name]);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            var children = entity.get('children');
            for (var i = 0; i < children.length; i++) {
                gatherDependencies(editor.call('entities:get', children[i]));
            }
        };

        // build index
        var selection = {};
        for (var i = 0, len = entities.length; i < len; i++) {
            selection[entities[i].get('resource_id')] = entities[i];
        }


        // sort entities by their index in their parent's children list
        entities.sort(function (a, b) {
            var pA = a.get('parent');
            if (! pA)
                return -1;

            pA = editor.call('entities:get', pA);
            if (! pA)
                return -1;

            var indA = pA.get('children').indexOf(a.get('resource_id'));

            var pB = b.get('parent');
            if (! pB)
                return 1;

            pB = editor.call('entities:get', pB);
            if (! pB)
                return -1;

            var indB = pB.get('children').indexOf(b.get('resource_id'));

            return indA - indB;
        });

        for (var i = 0, len = entities.length; i < len; i++) {
            var e = entities[i];

            var p = childToParent[e.get('resource_id')];
            var isParentSelected = false;
            while (p) {
                if (selection[p]) {
                    isParentSelected = true;
                    break;
                }

                p = childToParent[p];
            }

            // if parent is also selected then skip child
            // and only add parent to copied entities
            if (isParentSelected) {
                // remove entity from selection
                // since its parent is selected
                delete selection[e.get('resource_id')];
                continue;
            }

            // add entity to clipboard if not already added as a child of
            // a higher level entity
            gatherDependencies(e)
        }

        for (var key in selection) {
            // set parent of each copied entity to null
            if (data.hierarchy[key])
                data.hierarchy[key].parent = null;
        }

        // save to local storage
        editor.call('entities:clipboard:set', data);
    });

    // paste entity in local storage under parent
    editor.method('entities:paste', function (parent) {
        // parse data from local storage
        var data = editor.call('entities:clipboard:get');
        if (! data)
            return;

        // paste on root if no parent specified
        if (! parent)
            parent = editor.call('entities:root');

        var settings = editor.call('settings:project');
        var legacy_scripts = settings.get('useLegacyScripts');

        var componentAssetPaths = editor.call('components:assetPaths');
        var containsStar = /\.\*\./;

        // try to find asset id in this project
        // from path of asset in old project
        var remapAsset = function (assetId) {
            if (! assetId) return null;

            // return the old asset id if not found
            var result = parseInt(assetId, 10);

            var assetData = data.assets[assetId];
            if (! assetData)
                return result;

            var len = assetData.path.length;
            var name = assetData.path[len-1];
            var type = assetData.type;

            var pathToId = [];

            var assets = editor.call('assets:list');
            var assetLen = assets.length;

            // change path names to folder ids
            for (var i = 0; i < len - 1; i++) {
                var folder = null;

                for (var j = 0; j < assetLen; j++) {
                    var asset = assets[j];
                    if (asset.get('name') === assetData.path[i] && asset.get('type') === 'folder') {
                        folder = asset;
                        break;
                    }
                }

                if (!folder)
                    return result;

                pathToId.push(parseInt(folder.get('id'), 10));
            }

            var pathToIdLen = pathToId.length;

            // search for asset of same name, type
            // and path as original
            for (var i = 0; i < assetLen; i++) {
                var asset = assets[i];

                if (asset.get('name') === name &&
                    asset.get('type') === type &&
                    !asset.get('source')) {
                    var path = asset.get('path');
                    var pathLen = path && path.length;
                    if (path && pathLen === pathToIdLen) {
                        var pathsEqual = true;
                        for (var j = 0; j < pathLen; j++) {
                            if (path[j] !== pathToId[j]) {
                                pathsEqual = false;
                                break;
                            }
                        }

                        if (! pathsEqual)
                            continue;
                    }

                    result = parseInt(asset.get('id'), 10);
                    break;
                }
            }

            return result;
        };

        // remap assets
        if (data.assets) {
            for (var key in data.assets) {
                data.assets[key] = remapAsset(key);
            }
        }

        // change resource ids
        var mapping = {};
        for (var resourceId in data.hierarchy) {
            mapping[resourceId] = pc.guid.create();
        }

        var remapResourceIds = function (entity) {
            var resourceId = entity.get('resource_id');

            var newResourceId = mapping[resourceId];
            entity.set('resource_id', newResourceId);

            // set new resource id for parent
            var parentId = entity.get('parent');
            if (parentId) {
                entity.set('parent', mapping[parentId]);
            } else {
                entity.set('parent', parent.get('resource_id'));
            }

            childToParent[newResourceId] = entity.get('parent');

            // set children to empty array because these
            // are going to get added later on
            entity.set('children', []);

            // remap assets and entities
            if (data.project !== config.project.id) {
                for (var i = 0; i < componentAssetPaths.length; i++) {
                    var path = componentAssetPaths[i];
                    if (containsStar.test(path)) {
                        var parts = path.split('.*.');
                        if (! entity.has(parts[0])) continue;

                        var obj = entity.get(parts[0]);
                        if (! obj) continue;

                        for (var key in obj) {
                            var fullKey = parts[0] + '.' + key + '.' + parts[1];
                            if (! entity.has(fullKey)) continue;

                            var assets = entity.get(fullKey);
                            if (! assets) continue;

                            if (assets instanceof Array) {
                                for (var j = 0; j < assets.length; j++) {
                                    assets[j] = data.assets[assets[j]];
                                }
                                entity.set(fullKey, assets);
                            } else {
                                entity.set(fullKey, data.assets[assets]);
                            }
                        }
                    }
                    else if (entity.has(path)) {
                        var assets = entity.get(path);
                        if (! assets) continue;

                        if (assets instanceof Array) {
                            for (var j = 0; j < assets.length; j++) {
                                assets[j] = data.assets[assets[j]];
                            }
                            entity.set(path, assets);
                        } else {
                            entity.set(path, data.assets[assets]);
                        }
                    }
                }
            }

            // remap script asset attributes
            if (entity.has('components.script.scripts')) {
                if (entity.has('components.script')) {
                    // remove script component if legacy scripts flag is different between the two projects
                    if (legacy_scripts !== data.legacy_scripts) {
                        entity.unset('components.script');
                    } else {
                        var scripts = entity.get('components.script.scripts');
                        // legacy scripts
                        if (legacy_scripts) {
                            for (var i = 0, len = scripts.length; i < len; i++) {
                                var script = scripts[i];
                                if (! script.attributes) continue;

                                for (var name in script.attributes) {
                                    var attr = script.attributes[name];
                                    if (! attr) continue;

                                    if (attr.type === 'asset' && data.project !== config.project.id) {
                                        if (attr.value) {
                                            if (attr.value instanceof Array) {
                                                for (var j = 0; j < attr.value.length; j++) {
                                                    entity.set('components.script.scripts.' + i + '.attributes.' + name + '.value.' + j, data.assets[attr.value[j]])
                                                }
                                            } else {
                                                entity.set('components.script.scripts.' + i + '.attributes.' + name + '.value', data.assets[attr.value]);
                                            }
                                        }

                                        if (attr.defaultValue) {
                                            if (attr.defaultValue instanceof Array) {
                                                for (var j = 0; j < attr.defaultValue.length; j++) {
                                                    entity.set('components.script.scripts.' + i + '.attributes.' + name + '.defaultValue.' + j, data.assets[attr.value[j]])
                                                }
                                            } else {
                                                entity.set('components.script.scripts.' + i + '.attributes.' + name + '.defaultValue', data.assets[attr.value]);
                                            }
                                        }
                                    } else if (attr.type === 'entity') {
                                        if (mapping[attr.value])
                                            entity.set('components.script.scripts.' + i + '.attributes.' + name + '.value', mapping[attr.value]);
                                        if (mapping[attr.defaultValue])
                                            entity.set('components.script.scripts.' + i + '.attributes.' + name + '.defaultValue', mapping[attr.defaultValue]);
                                    }
                                }
                            }
                        } else {
                            // scripts 2.0
                            if (scripts) {
                                for(var script in scripts) {
                                    var asset = editor.call('assets:scripts:assetByScript', script);
                                    if (! asset) continue;

                                    var attrs = scripts[script].attributes;
                                    if (! attrs) continue;

                                    for (var key in attrs) {
                                        var attrData = asset.get('data.scripts.' + script + '.attributes.' + key);
                                        if (attrData) {
                                            if (attrData.type === 'asset' && data.project !== config.project.id) {
                                                // remap asset ids
                                                if (attrData.array) {
                                                    for (var j = 0; j < attrs[key].length; j++) {
                                                        entity.set('components.script.scripts.' + script + '.attributes.' + key + '.' + j, data.assets[attrs[key][j]]);
                                                    }
                                                } else {
                                                    entity.set('components.script.scripts.' + script + '.attributes.' + key, data.assets[attrs[key]]);
                                                }
                                            } else if (attrData.type === 'entity') {
                                                // try to remap entities
                                                if (mapping[attrs[key]]) {
                                                    entity.set('components.script.scripts.' + script + '.attributes.' + key, mapping[attrs[key]]);
                                                }
                                            }

                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            }
        };

        // add all entities with different resource ids
        var newEntities = [];
        var selectedEntities = [];

        for (var resourceId in data.hierarchy) {
            // create new entity
            var entity = new Observer(data.hierarchy[resourceId]);

            // select the entity if its parent is not selected
            var select = !data.hierarchy[entity.get('parent')];

            // change resource ids
            remapResourceIds(entity);

            // sharedb
            editor.call('realtime:scene:op', {
                p: [ 'entities', entity.get('resource_id') ],
                oi: entity.json()
            });

            // add it
            editor.call('entities:add', entity);
            newEntities.push(entity);

            if (select)
                selectedEntities.push(entity);
        }

        // reparent children after they're all added
        for (var i = 0; i < newEntities.length; i++) {
            var entity = newEntities[i];
            var parentEntity = editor.call('entities:get', entity.get('parent'));

            // this is necessary for the entity to be added to the tree view
            parentEntity.history.enabled = false;
            parentEntity.insert('children', entity.get('resource_id'));
            parentEntity.history.enabled = true;
        }

        // select pasted entities
        setTimeout(function() {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', selectedEntities);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });
        }, 0);

        // add history
        editor.call('history:add', {
            name: 'paste entities',
            undo: function() {
                for (var i = selectedEntities.length - 1; i >= 0; i--) {
                    var entity = editor.call('entities:get', selectedEntities[i].get('resource_id'));
                    if (! entity) continue;

                    removeEntity(entity);
                }

                var selectorType = editor.call('selector:type');
                var selectorItems = editor.call('selector:items');
                if (selectorType === 'entity' && selectorItems.length) {
                    var items = [ ];
                    for(var i = 0; i < selectorItems.length; i++) {
                        var item = editor.call('entities:get', selectorItems[i]);
                        if (item)
                            items.push(item);
                    }

                    if (items.length) {
                        editor.call('selector:history', false);
                        editor.call('selector:set', selectorType, items);
                        editor.once('selector:change', function() {
                            editor.call('selector:history', true);
                        });
                    }
                }
            },
            redo: function() {
                var newParent = editor.call('entities:get', parent.get('resource_id'));
                if (! newParent) return;

                var numChildren = newParent.get('children').length;

                var entities = [];
                // re-add entities
                for (var i = 0; i < selectedEntities.length; i++) {
                    var fromCache = deletedCache[selectedEntities[i].get('resource_id')];
                    if (! fromCache) continue;
                    var e = new Observer(fromCache);
                    addEntity(e, newParent, false, numChildren + i);
                    entities.push(e);
                }

                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', entities);
                editor.once('selector:change', function() {
                    editor.call('selector:history', true);
                });
            }
        });
    });

    editor.method('entities:addComponent', function (entities, component) {
        var componentData = editor.call('components:getDefault', component);
        var records = [ ];

        for(var i = 0; i < entities.length; i++) {
            if (entities[i].has('components.' + component))
                continue;

            records.push({
                get: entities[i].history._getItemFn,
                value: componentData
            });

            entities[i].history.enabled = false;
            entities[i].set('components.' + component, componentData);
            entities[i].history.enabled = true;
        }

        // if it's a collision or rigidbody component then enable physics
        if (component === 'collision' || component === 'rigidbody') {
            var settings = editor.call('settings:project');
            var history = settings.history.enabled;
            settings.history.enabled = false;
            settings.set('use3dPhysics', true);
            settings.history.enabled = history;
        }

        editor.call('history:add', {
            name: 'entities.' + component,
            undo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;
                    item.history.enabled = false;
                    item.unset('components.' + component);
                    item.history.enabled = true;
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;
                    item.history.enabled = false;
                    item.set('components.' + component, records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    });
});
