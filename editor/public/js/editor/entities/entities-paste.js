editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:project');
    var legacy_scripts = settings.get('useLegacyScripts');
    var componentAssetPaths = editor.call('components:assetPaths');
    var containsStar = /\.\*\./;

    // try to find asset id in this project
    // from path of asset in old project
    /**
     * Try to find an assetId in this project that
     * corresponds to the specified assetId that may come from
     * a different project.
     * @param {Number} assetId The asset id we are trying to remap
     * @param {Object} assetsIndex The assets index stored in localStorage that contains paths of assets
     * @returns {Number} The asset id in this project
     */
    var remapAsset = function (assetId, assetsIndex) {
        if (!assetId) return null;

        // return the old asset id if not found
        var result = parseInt(assetId, 10);

        var assetData = assetsIndex[assetId];
        if (!assetData)
            return result;

        var len = assetData.path.length;
        var name = assetData.path[len - 1];
        var type = assetData.type;

        var pathToId = [];

        var assets = editor.call('assets:list');
        var assetLen = assets.length;

        var i, j, asset;

        // change path names to folder ids
        for (i = 0; i < len - 1; i++) {
            var folder = null;

            for (j = 0; j < assetLen; j++) {
                asset = assets[j];
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
        for (i = 0; i < assetLen; i++) {
            asset = assets[i];

            if (asset.get('name') === name &&
                asset.get('type') === type &&
                !asset.get('source')) {
                var path = asset.get('path');
                var pathLen = path && path.length;
                if (path && pathLen === pathToIdLen) {
                    var pathsEqual = true;
                    for (j = 0; j < pathLen; j++) {
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

    /**
     * Remaps the resource ids of the entities and their entity references in localStorage
     * with new resource ids
     * @param {Observer} entity The entity we are remapping
     * @param {Observer} parent The parent of the pasted entity
     * @param {Object} data The data in localStorage
     * @param {Object} mapping An index that maps old resource ids to new resource ids
     */
    var remapResourceIds = function (entity, parent, data, mapping) {
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

        // if this is a template instance remap template_ent_ids
        const templateEntIds = entity.get('template_ent_ids');
        if (templateEntIds) {
            const newTemplateEntIds = {};
            for (const oldId in templateEntIds) {
                if (mapping[oldId]) {
                    newTemplateEntIds[mapping[oldId]] = templateEntIds[oldId];
                }
            }
            entity.set('template_ent_ids', newTemplateEntIds);
        }

        editor.call('entities:updateChildToParentIndex', newResourceId, entity.get('parent'));

        // set children to empty array because these
        // are going to get added later on
        entity.set('children', []);

        var i, j, key, assets;

        // remap assets and entities
        if (data.project !== config.project.id) {
            for (i = 0; i < componentAssetPaths.length; i++) {
                var path = componentAssetPaths[i];
                if (containsStar.test(path)) {
                    var parts = path.split('.*.');
                    if (!entity.has(parts[0])) continue;

                    var obj = entity.get(parts[0]);
                    if (!obj) continue;

                    for (key in obj) {
                        var fullKey = parts[0] + '.' + key + '.' + parts[1];
                        if (!entity.has(fullKey)) continue;

                        assets = entity.get(fullKey);
                        if (!assets) continue;

                        if (assets instanceof Array) {
                            for (j = 0; j < assets.length; j++) {
                                assets[j] = data.assets[assets[j]];
                            }
                            entity.set(fullKey, assets);
                        } else {
                            entity.set(fullKey, data.assets[assets]);
                        }
                    }
                }
                else if (entity.has(path)) {
                    assets = entity.get(path);
                    if (!assets) continue;

                    if (assets instanceof Array) {
                        for (j = 0; j < assets.length; j++) {
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
                        for (i = 0, len = scripts.length; i < len; i++) {
                            var script = scripts[i];
                            if (!script.attributes) continue;

                            for (var name in script.attributes) {
                                var attr = script.attributes[name];
                                if (!attr) continue;

                                if (attr.type === 'asset' && data.project !== config.project.id) {
                                    if (attr.value) {
                                        if (attr.value instanceof Array) {
                                            for (j = 0; j < attr.value.length; j++) {
                                                entity.set('components.script.scripts.' + i + '.attributes.' + name + '.value.' + j, data.assets[attr.value[j]])
                                            }
                                        } else {
                                            entity.set('components.script.scripts.' + i + '.attributes.' + name + '.value', data.assets[attr.value]);
                                        }
                                    }

                                    if (attr.defaultValue) {
                                        if (attr.defaultValue instanceof Array) {
                                            for (j = 0; j < attr.defaultValue.length; j++) {
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

                                for (key in attrs) {
                                    var attrData = asset.get('data.scripts.' + script + '.attributes.' + key);
                                    if (attrData) {
                                        if (attrData.type === 'asset' && data.project !== config.project.id) {
                                            // remap asset ids
                                            if (attrData.array) {
                                                for (j = 0; j < attrs[key].length; j++) {
                                                    entity.set('components.script.scripts.' + script + '.attributes.' + key + '.' + j, data.assets[attrs[key][j]]);
                                                }
                                            } else {
                                                entity.set('components.script.scripts.' + script + '.attributes.' + key, data.assets[attrs[key]]);
                                            }
                                        } else if (attrData.type === 'entity') {
                                            // try to remap entities
                                            if (attrData.array) {
                                                for (j = 0; j < attrs[key].length; j++) {
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
        const components = entity.get('components');
        Object.entries(components).forEach(([componentName, component]) => {
            const entityFields = editor.call('components:getFieldsOfType', componentName, 'entity');

            entityFields.forEach(fieldName => {
                const oldEntityId = component[fieldName];
                const newEntityId = mapping[oldEntityId];
                if (newEntityId) {
                    entity.set('components.' + componentName + '.' + fieldName, newEntityId);
                }
            });
        });
    };

    /**
     * Pastes entities in localStore under the specified parent
     * @param {Observer} parent The parent entity
     */
    editor.method('entities:paste', function (parent) {
        // parse data from local storage
        var data = editor.call('entities:clipboard:get');
        if (!data)
            return;

        // paste on root if no parent specified
        if (!parent)
            parent = editor.call('entities:root');


        // remap assets
        if (data.assets) {
            for (var key in data.assets) {
                data.assets[key] = remapAsset(key, data.assets);
            }
        }

        // change resource ids
        var mapping = {};
        for (var guid in data.hierarchy) {
            mapping[guid] = pc.guid.create();
        }

        // add all entities with different resource ids
        var newEntities = [];
        var selectedEntities = [];

        var entity;

        for (var resourceId in data.hierarchy) {
            // create new entity
            entity = new Observer(data.hierarchy[resourceId]);

            // select the entity if its parent is not selected
            var select = !data.hierarchy[entity.get('parent')];

            // change resource ids
            remapResourceIds(entity, parent, data, mapping);

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
            entity = newEntities[i];
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
                var i;
                for (i = selectedEntities.length - 1; i >= 0; i--) {
                    var entity = editor.call('entities:get', selectedEntities[i].get('resource_id'));
                    if (!entity) continue;

                    editor.call('entities:removeEntity', entity);
                }

                var selectorType = editor.call('selector:type');
                var selectorItems = editor.call('selector:items');
                if (selectorType === 'entity' && selectorItems.length) {
                    var items = [];
                    for (i = 0; i < selectorItems.length; i++) {
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
                    var fromCache = editor.call('entities:getFromDeletedCache', selectedEntities[i].get('resource_id'));
                    if (!fromCache) continue;

                    var e = new Observer(fromCache);
                    editor.call('entities:addEntity', e, newParent, false, numChildren + i);
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
});
