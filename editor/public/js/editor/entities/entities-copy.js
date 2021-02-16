editor.once('load', function () {
    'use strict';

    var componentAssetPaths = editor.call('components:assetPaths');
    var settings = editor.call('settings:project');

    // Gets the parent resource if of the entity with the specified resource id
    var getParent = function (childResourceId) {
        return editor.call('entities:getParentResourceId', childResourceId);
    };

    // Stores asset paths in the assets dictionary by converting the array of
    // folder ids to an array of folder names
    var storeAssetPaths = function (assetIds, assets) {
        if (! Array.isArray(assetIds)) {
            assetIds = [assetIds];
        }

        for (let i = 0; i < assetIds.length; i++) {
            var assetId = assetIds[i];
            if (! assetId || assets[assetId]) continue;

            var asset = editor.call('assets:get', assetId);
            if (!asset) return;

            var parts = [];

            var path = asset.get('path');
            if (path && path.length) {
                for (var j = 0; j < path.length; j++) {
                    var a = editor.call('assets:get', path[j]);
                    if (!a) continue;

                    parts.push(a.get('name'));
                }
            }

            parts.push(asset.get('name'));

            assets[assetId] = {
                path: parts,
                type: asset.get('type')
            };
        }
    };

    // Gathers all dependencies for this entity
    var gatherDependencies = function (entity, data) {
        var i;
        var key;
        var containsStar = /\.\*\./;

        // store entity json
        var resourceId = entity.get('resource_id');
        if (!data.hierarchy[resourceId]) {
            data.hierarchy[resourceId] = entity.json();
        }

        // gather all asset references from the entity
        // and store their path + name
        for (i = 0; i < componentAssetPaths.length; i++) {
            var path = componentAssetPaths[i];
            var assets;

            // handle paths that contain a '*' as a wildcard
            if (containsStar.test(path)) {
                var parts = path.split('.*.');
                if (!entity.has(parts[0])) continue;

                var obj = entity.get(parts[0]);
                if (!obj) continue;

                for (key in obj) {
                    var fullKey = parts[0] + '.' + key + '.' + parts[1];
                    if (!entity.has(fullKey))
                        continue;

                    assets = entity.get(fullKey);
                    if (!assets) continue;

                    storeAssetPaths(assets, data.assets);
                }
            } else if (entity.has(path)) {
                // handle path without '*'
                assets = entity.get(path);
                if (!assets) continue;

                storeAssetPaths(assets, data.assets);
            }
        }

        // gather script attributes
        if (entity.has('components.script.scripts')) {
            var scripts = entity.get('components.script.scripts');
            var name;

            if (scripts) {
                // legacy scripts
                if (settings.get('useLegacyScripts')) {
                    for (i = 0, len = scripts.length; i < len; i++) {
                        var script = scripts[i];
                        if (!script.attributes) continue;
                        for (name in script.attributes) {
                            var attr = script.attributes[name];
                            if (!attr) continue;
                            if (attr.type === 'asset') {
                                if (attr.value) {
                                    storeAssetPaths(attr.value, data.assets);
                                }

                                if (attr.defaultValue) {
                                    storeAssetPaths(attr.defaultValue, data.assets);
                                }

                            }
                        }
                    }
                } else {
                    // scripts 2.0
                    for (key in scripts) {
                        var scriptData = scripts[key];
                        if (!scriptData || !scriptData.attributes) continue;

                        var asset = editor.call('assets:scripts:assetByScript', key);
                        if (!asset) continue;

                        // search for asset script attributes in script asset
                        var assetData = asset.get('data.scripts.' + key + '.attributes');
                        if (!assetData) continue;

                        for (name in assetData) {
                            const componentAttribute = scriptData.attributes[name];
                            if (!componentAttribute) continue;

                            if (assetData[name].type === 'asset') {
                                storeAssetPaths(componentAttribute, data.assets);
                            } else if (assetData[name].type === 'json') {
                                const schema = assetData[name].schema;
                                if (Array.isArray(schema)) {
                                    for (let i = 0; i < schema.length; i++) {
                                        const field = schema[i];
                                        if (field.type === 'asset') {
                                            if (Array.isArray(componentAttribute)) {
                                                for (let j = 0; j < componentAttribute.length; j++) {
                                                    if (componentAttribute[j] && componentAttribute[j][field.name]) {
                                                        storeAssetPaths(componentAttribute[j][field.name], data.assets);
                                                    }
                                                }
                                            } else if (componentAttribute[field.name]) {
                                                storeAssetPaths(componentAttribute[field.name], data.assets);
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

        var children = entity.get('children');
        for (i = 0; i < children.length; i++) {
            gatherDependencies(editor.call('entities:get', children[i]), data);
        }
    };

    /**
     * Copies the specified entities into localStorage
     *
     * @param {Observer[]} entities - The entities to copy
     */
    editor.method('entities:copy', function (entities) {
        var data = {
            project: config.project.id,
            scene: config.scene.uniqueId,
            branch: config.self.branch.id,
            legacy_scripts: settings.get('useLegacyScripts'),
            hierarchy: {},
            assets: {},
            type: 'entity'
        };

        var i, len;

        // build index
        var selection = {};
        for (i = 0, len = entities.length; i < len; i++) {
            selection[entities[i].get('resource_id')] = entities[i];
        }

        // sort entities by their index in their parent's children list
        entities.sort(function (a, b) {
            var pA = a.get('parent');
            if (!pA)
                return -1;

            pA = editor.call('entities:get', pA);
            if (!pA)
                return -1;

            var indA = pA.get('children').indexOf(a.get('resource_id'));

            var pB = b.get('parent');
            if (!pB)
                return 1;

            pB = editor.call('entities:get', pB);
            if (!pB)
                return -1;

            var indB = pB.get('children').indexOf(b.get('resource_id'));

            return indA - indB;
        });

        for (i = 0, len = entities.length; i < len; i++) {
            var e = entities[i];

            var p = getParent(e.get('resource_id'));
            var isParentSelected = false;
            while (p) {
                if (selection[p]) {
                    isParentSelected = true;
                    break;
                }

                p = getParent(p);
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
            gatherDependencies(e, data);
        }

        for (const key in selection) {
            // set parent of each copied entity to null
            if (data.hierarchy[key])
                data.hierarchy[key].parent = null;
        }

        // save to local storage
        editor.call('clipboard:set', data);
    });
});
