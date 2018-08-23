editor.once('load', function () {
    'use strict';

    // An index where the key is the guid
    // of a child entity and the value is the guid of
    // a parent entity
    var childToParent = {};


    // An index where the key is the guid of
    // a deleted entity and the value is the JSON
    // representation of the entity at the time when
    // it was deleted. Used to re-create entities from
    // this cache instead of re-creating it from scratch
    var deletedCache = {};

    // project settings
    var settings = editor.call('settings:project');

    // Attach event listeners on a new entity.
    // Maintains the childToParent index
    editor.on('entities:add', function (entity) {
        var children = entity.get('children');
        for (var i = 0; i < children.length; i++)
            childToParent[children[i]] = entity.get('resource_id');

        entity.on('children:insert', function (value) {
            childToParent[value] = entity.get('resource_id');
        });
        entity.on('children:remove', function (value) {
            delete childToParent[value];
        });
    });

    /**
     * Updates entity references to the old entity to point to the new entity (which could also be null)
     * @param {Object} entityReferencesMap See addEntity
     * @param {String} oldValue The resource id that we want to replace
     * @param {String} newValue The new resource id that we want our references to point to
     */
    var updateEntityReferenceFields = function (entityReferencesMap, oldValue, newValue) {
        var referencesToThisEntity = entityReferencesMap[oldValue];
        if (! referencesToThisEntity) return;

        referencesToThisEntity.forEach(function (reference) {
            var sourceEntity = editor.call('entities:get', reference.sourceEntityGuid);
            if (! sourceEntity) return;

            var prevHistory = sourceEntity.history.enabled;
            sourceEntity.history.enabled = false;
            sourceEntity.set('components.' + reference.componentName + '.' + reference.fieldName, newValue);
            sourceEntity.history.enabled = prevHistory;
        });
    };

    /**
     * Adds an entity to the scene.
     * @param {Observer} entity The entity
     * @param {Observer} parent The parent of the entity
     * @param {Boolean} select Whether to select the new entity after it's added
     * @param {Number} ind The index in the parent's children array where we want to insert the entity
     * @param {Object} entityReferencesMap A dictionary holding references to entities
     * that need to be updated if we undo adding this entity. The format of this object looks like so:
     * targetResourceId: {
     *   sourceEntityGuid: GUID,
     *   componentName: String,
     *   fieldName: String
     * }
     */
    var addEntity = function (entity, parent, select, ind, entityReferencesMap) {
        entityReferencesMap = entityReferencesMap || {};

        childToParent[entity.get('resource_id')] = parent.get('resource_id');

        var children = entity.get('children');
        if (children.length)
            entity.set('children', []);

        // call add event
        editor.call('entities:add', entity);

        // shareDb
        editor.call('realtime:scene:op', {
            p: ['entities', entity.get('resource_id')],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        if (select) {
            setTimeout(function () {
                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', [entity]);
                editor.once('selector:change', function () {
                    editor.call('selector:history', true);
                });
            }, 0);
        }

        // add children too
        children.forEach(function (childIdOrData) {
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
            addEntity(child, entity, undefined, undefined, entityReferencesMap);
        });

        // Hook up any entity references which need to be pointed to this newly created entity
        // (happens when addEntity() is being called during the undoing of a deletion). In order
        // to force components to respond to the setter call even when they are running in other
        // tabs or in the Launch window, we unfortunately have to use a setTimeout() hack :(
        var guid = entity.get('resource_id');

        // First set all entity reference fields targeting this guid to null
        updateEntityReferenceFields(entityReferencesMap, guid, null);
        setTimeout(function () {
            // Then update the same fields to target the guid again
            updateEntityReferenceFields(entityReferencesMap, guid, guid);
        }, 0);

        if (entity.get('__postCreationCallback')) {
            entity.get('__postCreationCallback')(entity);
        }
    };

    /**
     * Removes an entity from the scene
     * @param {Observer} entity The entity
     * @param {Object} entityReferencesMap Holds references to entities that need to be updated when
     * this entity is removed. See addEntity for more.
     */
    var removeEntity = function (entity, entityReferencesMap) {
        entityReferencesMap = entityReferencesMap || {};
        deletedCache[entity.get('resource_id')] = entity.json();

        // Nullify any entity references which currently point to this guid
        updateEntityReferenceFields(entityReferencesMap, entity.get('resource_id'), null);

        // remove children
        entity.get('children').forEach(function (child) {
            var entity = editor.call('entities:get', child);
            if (!entity)
                return;

            removeEntity(entity, entityReferencesMap);
        });

        if (editor.call('selector:type') === 'entity' && editor.call('selector:items').indexOf(entity) !== -1) {
            editor.call('selector:history', false);
            editor.call('selector:remove', entity);
            editor.once('selector:change', function () {
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
            p: ['entities', entity.get('resource_id')],
            od: {}
        });
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
        childToParent[entity.get('resource_id')] = parent.get('resource_id');
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

    // paste entity in local storage under parent
    editor.method('entities:paste', function (parent) {
        // parse data from local storage
        var data = editor.call('entities:clipboard:get');
        if (!data)
            return;

        // paste on root if no parent specified
        if (!parent)
            parent = editor.call('entities:root');

        var legacy_scripts = settings.get('useLegacyScripts');

        var componentAssetPaths = editor.call('components:assetPaths');
        var containsStar = /\.\*\./;

        // try to find asset id in this project
        // from path of asset in old project
        var remapAsset = function (assetId) {
            if (!assetId) return null;

            // return the old asset id if not found
            var result = parseInt(assetId, 10);

            var assetData = data.assets[assetId];
            if (!assetData)
                return result;

            var len = assetData.path.length;
            var name = assetData.path[len - 1];
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

                        if (!pathsEqual)
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
                        if (!entity.has(parts[0])) continue;

                        var obj = entity.get(parts[0]);
                        if (!obj) continue;

                        for (var key in obj) {
                            var fullKey = parts[0] + '.' + key + '.' + parts[1];
                            if (!entity.has(fullKey)) continue;

                            var assets = entity.get(fullKey);
                            if (!assets) continue;

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
                        if (!assets) continue;

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
                                if (!script.attributes) continue;

                                for (var name in script.attributes) {
                                    var attr = script.attributes[name];
                                    if (!attr) continue;

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
                                for (var script in scripts) {
                                    var asset = editor.call('assets:scripts:assetByScript', script);
                                    if (!asset) continue;

                                    var attrs = scripts[script].attributes;
                                    if (!attrs) continue;

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
                                                if (attrData.array) {
                                                    for (var j = 0; j < attrs[key].length; j++) {
                                                        if (attrs[key][j] && mapping[attrs[key][j]]) {
                                                            entity.set('components.script.scripts.' + script + '.attributes.' + key + '.' + j, mapping[attrs[key][j]]);
                                                        }
                                                    }
                                                } else {
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

            }

            // remap entity references in components
            var components = entity.get('components');
            for (var componentName in components) {
                var component = components[componentName];
                var entityFields = editor.call('components:getFieldsOfType', componentName, 'entity');

                entityFields.forEach(function (fieldName) {
                    var oldEntityId = component[fieldName];
                    if (mapping[oldEntityId]) {
                        var newEntityId = mapping[oldEntityId];

                        if (newEntityId) {
                            entity.set('components.' + componentName + '.' + fieldName, newEntityId);
                        }
                    }
                });
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
                p: ['entities', entity.get('resource_id')],
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
        setTimeout(function () {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', selectedEntities);
            editor.once('selector:change', function () {
                editor.call('selector:history', true);
            });
        }, 0);

        // add history
        editor.call('history:add', {
            name: 'paste entities',
            undo: function () {
                for (var i = selectedEntities.length - 1; i >= 0; i--) {
                    var entity = editor.call('entities:get', selectedEntities[i].get('resource_id'));
                    if (!entity) continue;

                    removeEntity(entity);
                }

                var selectorType = editor.call('selector:type');
                var selectorItems = editor.call('selector:items');
                if (selectorType === 'entity' && selectorItems.length) {
                    var items = [];
                    for (var i = 0; i < selectorItems.length; i++) {
                        var item = editor.call('entities:get', selectorItems[i]);
                        if (item)
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
                var newParent = editor.call('entities:get', parent.get('resource_id'));
                if (!newParent) return;

                var numChildren = newParent.get('children').length;

                var entities = [];
                // re-add entities
                for (var i = 0; i < selectedEntities.length; i++) {
                    var fromCache = deletedCache[selectedEntities[i].get('resource_id')];
                    if (!fromCache) continue;
                    var e = new Observer(fromCache);
                    addEntity(e, newParent, false, numChildren + i);
                    entities.push(e);
                }

                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', entities);
                editor.once('selector:change', function () {
                    editor.call('selector:history', true);
                });
            }
        });
    });

    // Expose methods
    editor.method('entities:addEntity', addEntity);
    editor.method('entities:removeEntity', removeEntity);
    editor.method('entities:duplicateEntity', duplicateEntity);

    /**
     * Gets the resource id of the parent of the entityh with the specified resource id.
     * @param {String} childResourceId The resource id of an entity
     * @returns {String} The resource id of the entity's parent
     */
    editor.method('entities:getParentResourceId', function (childResourceId) {
        return childToParent[childResourceId];
    });
});
