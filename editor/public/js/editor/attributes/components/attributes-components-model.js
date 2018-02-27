editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        var events = [ ];

        var projectSettings = editor.call('settings:project');

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Model',
            name: 'model',
            entities: entities
        });


        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                '': '...',
                'asset': 'Asset',
                'box': 'Box',
                'capsule': 'Capsule',
                'sphere': 'Sphere',
                'cylinder': 'Cylinder',
                'cone': 'Cone',
                'plane': 'Plane'
            },
            link: entities,
            path: 'components.model.type'
        });
        fieldType.on('change', function(value) {
            fieldAsset.parent.hidden = value !== 'asset';
            fieldMaterial.parent.hidden = value === 'asset';
            toggleMaterials();
        });
        // reference
        editor.call('attributes:reference:attach', 'model:type', fieldType.parent.innerElement.firstChild.ui);


        // asset
        var fieldAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Model',
            type: 'asset',
            kind: 'model',
            link: entities,
            path: 'components.model.asset'
        });
        fieldAsset.parent.hidden = fieldType.value !== 'asset';
        // reference
        editor.call('attributes:reference:attach', 'model:asset', fieldAsset._label);

        var changingAsset = false;

        // if the assets changes then remove material overrides
        fieldAsset.on('beforechange', function (value) {
            var resourceIds = [];
            var mappings = {};

            entities.forEach(function (entity) {
                if (entity.has('components.model.mapping') && entity.get('components.model.asset') !== parseInt(value, 10)) {
                    resourceIds.push(entity.get('resource_id'));
                    mappings[entity.get('resource_id')] = entity.get('components.model.mapping');
                }
            });

            fieldAsset.once('change', function (value) {
                if (changingAsset) return;

                changingAsset = true;

                // modify last history action to include changing
                // the mapping
                var lastHistoryAction = editor.call('history:list')[editor.call('history:current')];
                var lastUndo = lastHistoryAction.undo;
                var lastRedo = lastHistoryAction.redo;

                resourceIds.forEach(function (id) {
                    var entity = editor.call('entities:get', id);
                    if (! entity) return;
                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.unset('components.model.mapping');
                    entity.history.enabled = history;
                });

                lastHistoryAction.undo = function () {
                    changingAsset = true;

                    // execute last actions undo first
                    lastUndo();

                    // do this in a timeout so that the
                    // 'change' event of fieldAsset is fired first
                    setTimeout(function () {
                        resourceIds.forEach(function (id) {
                            var entity = editor.call('entities:get', id);
                            if (! entity) return;

                            var history = entity.history.enabled;
                            entity.history.enabled = false;
                            entity.set('components.model.mapping', mappings[id]);
                            entity.history.enabled = history;
                        });

                        changingAsset = false;
                    });
                };

                lastHistoryAction.redo = function () {
                    changingAsset = true;

                    // execute last actions redo first
                    lastRedo();

                    // do this in a timeout so that the
                    // 'change' event of fieldAsset is fired first
                    setTimeout(function () {
                        resourceIds.forEach(function (id) {
                            var entity = editor.call('entities:get', id);
                            if (! entity) return;

                            var history = entity.history.enabled;
                            entity.history.enabled = false;
                            entity.unset('components.model.mapping');
                            entity.history.enabled = history;
                        });

                        changingAsset = false;
                    });
                };

                changingAsset = false;
            });
        });

        // material
        var fieldMaterial = editor.call('attributes:addField', {
            parent: panel,
            name: 'Material',
            type: 'asset',
            kind: 'material',
            link: entities,
            path: 'components.model.materialAsset'
        });
        fieldMaterial.class.add('material-asset');
        fieldMaterial.parent.hidden = fieldType.value === 'asset';
        // reference
        editor.call('attributes:reference:attach', 'model:materialAsset', fieldMaterial._label);


        // castShadows
        var fieldCastShadows = editor.call('attributes:addField', {
            parent: panel,
            type: 'checkbox',
            name: 'Shadows',
            link: entities,
            path: 'components.model.castShadows'
        });
        // label
        var label = new ui.Label({ text: 'Cast' });
        label.class.add('label-infield');
        label.style.paddingRight = '8px';
        fieldCastShadows.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'model:castShadows', label);


        // castShadowsLightmap
        var fieldCastShadowsLightmap = editor.call('attributes:addField', {
            panel: fieldCastShadows.parent,
            type: 'checkbox',
            link: entities,
            path: 'components.model.castShadowsLightmap'
        });
        // label
        var labelCastShadowsLightmap = new ui.Label({ text: 'Cast Lightmap' });
        labelCastShadowsLightmap.class.add('label-infield');
        labelCastShadowsLightmap.style.paddingRight = '8px';
        labelCastShadowsLightmap.style.whiteSpace = 'nowrap';
        fieldCastShadows.parent.append(labelCastShadowsLightmap);
        // reference
        editor.call('attributes:reference:attach', 'model:castShadowsLightmap', labelCastShadowsLightmap);


        // receiveShadows
        var fieldReceiveShadows = editor.call('attributes:addField', {
            panel: fieldCastShadows.parent,
            type: 'checkbox',
            link: entities,
            path: 'components.model.receiveShadows'
        });
        // label
        var label = new ui.Label({ text: 'Receive' });
        label.class.add('label-infield');
        fieldCastShadows.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'model:receiveShadows', label);


        // lightmapped
        var fieldIsStatic = editor.call('attributes:addField', {
            parent: panel,
            name: 'States',
            type: 'checkbox',
            link: entities,
            path: 'components.model.isStatic'
        });
        // label
        var label = new ui.Label({ text: 'Static' });
        label.class.add('label-infield');
        fieldIsStatic.parent.append(label);
        label.style.paddingRight = '12px';
        // reference
        editor.call('attributes:reference:attach', 'model:isStatic', label);


        // lightmapped
        var fieldLightmapped = editor.call('attributes:addField', {
            parent: fieldIsStatic.parent,
            type: 'checkbox',
            link: entities,
            path: 'components.model.lightmapped'
        });
        // label
        var label = new ui.Label({ text: 'Lightmapped' });
        label.class.add('label-infield');
        fieldIsStatic.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'model:lightmapped', label);
        // uv1 is missing
        var label = new ui.Label({ text: 'UV1 is missing' });
        label.class.add('label-infield');
        label.style.color = '#f66';
        fieldIsStatic.parent.append(label);

        var checkUV1Missing = function() {
            var missing = false;
            for(var i = 0; i < entities.length; i++) {
                var e = entities[i];
                if (! e.has('components.model') || ! e.get('components.model.lightmapped') || e.get('components.model.type') !== 'asset' || ! e.get('components.model.asset'))
                    continue;

                var assetId = e.get('components.model.asset');
                var asset = editor.call('assets:get', assetId);
                if (! asset)
                    continue;

                if (! asset.has('meta.attributes.texCoord1')) {
                    missing = true;
                    break;
                }
            }

            label.hidden = ! missing;
        };
        checkUV1Missing();
        fieldLightmapped.on('change', function() {
            checkUV1Missing();
            collectResolutions();
        });


        // resolution
        var fieldResolution = editor.call('attributes:addField', {
            parent: panel,
            name: 'Lightmap Size',
            value: '?'
        });
        fieldResolution.style.marginBottom = '5px';
        fieldResolution.style.paddingLeft = '0px';
        fieldResolution.style.minWidth = '32px';
        fieldResolution.flexGrow = 0;
        fieldResolution.flexShrink = 0;
        // show/hide
        fieldResolution.parent.hidden = ! fieldLightmapped.value && ! fieldLightmapped.class.contains('null');
        fieldLightmapped.on('change', function() {
            fieldResolution.parent.hidden = ! fieldLightmapped.value && ! fieldLightmapped.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'model:resolution', fieldResolution.parent.innerElement.firstChild.ui);

        // calculate resolutions for lightmap
        var collectResolutions = function() {
            var lightmapper = app.lightmapper;
            var min = Infinity;
            var max = -Infinity;

            for(var i = 0; i < entities.length; i++) {
                if (! entities[i].get('components.model.lightmapped') || ! entities[i].entity.model || (! entities[i].entity.model.asset && entities[i].entity.type === 'asset') || (entities[i].entity.model.asset && ! app.assets.get(entities[i].entity.model.asset)))
                    continue;

                var size = lightmapper.calculateLightmapSize(entities[i].entity);

                if (size > max)
                    max = size;

                if (size < min)
                    min = size;
            }

            if (min) {
                fieldResolution.value = (min !== max) ? (min + ' - ' + max) : min;
            } else {
                fieldResolution.value = '?';
            }
        };
        collectResolutions();


        // lightmapSizeMultiplier
        var fieldLightmapSizeMultiplier = editor.call('attributes:addField', {
            panel: fieldResolution.parent,
            placeholder: 'Size Multiplier',
            type: 'number',
            min: 0,
            link: entities,
            path: 'components.model.lightmapSizeMultiplier'
        });
        fieldLightmapSizeMultiplier.on('change', function() {
            collectResolutions();
        });
        // reference
        editor.call('attributes:reference:attach', 'model:lightmapSizeMultiplier', fieldLightmapSizeMultiplier);

        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panel.append(divider);


        // batch group
        var batchGroups = projectSettings.get('batchGroups');
        var batchEnum = {
            '': '...',
            'NaN': 'None'
        };
        for (var key in batchGroups) {
            batchEnum[key] = batchGroups[key].name;
        }

        var fieldBatchGroup = editor.call('attributes:addField', {
            parent: panel,
            name: 'Batch Group',
            type: 'number',
            enum: batchEnum,
            link: entities,
            path: 'components.model.batchGroupId'
        });

        var btnAddGroup = document.createElement('li');
        btnAddGroup.classList.add('add-batch-group');
        btnAddGroup.innerHTML = 'Add Group';
        fieldBatchGroup.elementOptions.appendChild(btnAddGroup);

        // reference
        editor.call('attributes:reference:attach', 'model:batchGroupId', fieldBatchGroup.parent.innerElement.firstChild.ui);

        // Create new batch group, assign it to the selected entities and focus on it in the settings panel
        btnAddGroup.addEventListener('click', function () {
            var group = editor.call('editorSettings:batchGroups:create');
            batchEnum[group] = projectSettings.get('batchGroups.' + group + '.name');
            fieldBatchGroup._updateOptions(batchEnum);
            fieldBatchGroup.value = group;
            editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
            setTimeout(function () {
                editor.call('editorSettings:batchGroups:focus', group);
            });
        });

        // layers
        var layers = projectSettings.get('layers');
        var layersEnum = {
            '': ''
        };
        for (var key in layers) {
            layersEnum[key] = layers[key].name;
        }

        var fieldLayers = editor.call('attributes:addField', {
            parent: panel,
            name: 'Layers',
            type: 'tags',
            tagType: 'number',
            enum: layersEnum,
            placeholder: 'Add Layer',
            link: entities,
            path: 'components.model.layers',
            tagToString: function (tag) {
                return projectSettings.get('layers.' + tag + '.name') || 'Missing';
            }
        });


        panel.on('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });


        // gather all mappings for all selected entities
        var allMappings = {};
        for (var i = 0, len = entities.length; i < len; i++) {
            var mapping = entities[i].get('components.model.mapping');
            if (mapping) {
                for (var key in mapping) {
                    if (!allMappings[key])
                        allMappings[key] = [entities[i].get('resource_id')];
                    else
                        allMappings[key].push(entities[i].get('resource_id'));
                }
            }
        }

        var panelMaterialButtons = editor.call('attributes:addPanel');
        panelMaterialButtons.class.add('flex', 'component', 'override-material');
        panel.append(panelMaterialButtons);

        var panelMaterials = editor.call('attributes:addPanel');
        panelMaterials.class.add('component', 'override-material');
        panel.append(panelMaterials);

        // check if we should show the override button
        // mainly if all entities have a model component
        // and are referencing an asset
        var toggleMaterials = function ()  {
            var referencedModelAsset = entities[0].get('components.model.asset');
            for (var i = 0, len = entities.length; i < len; i++) {
                if (entities[i].get('components.model.type') !== 'asset' ||
                    entities[i].get('components.model.asset') !== referencedModelAsset) {
                    panelMaterials.hidden = true;
                    panelMaterialButtons.hidden = true;
                    return;
                }
            }

            panelMaterials.hidden = false;
            panelMaterialButtons.hidden = false;
        };

        // turn override panel off / on
        toggleMaterials();

        var assetMaterials = new ui.Button({
            text: 'Asset Materials'
        });
        assetMaterials.disabled = ! editor.call('assets:get', entities[0].get('components.model.asset'));
        events.push(entities[0].on('components.model.asset:set', function(value) {
            assetMaterials.disabled = entityMaterials.disabled = ! value || ! editor.call('assets:get', value);
        }));

        assetMaterials.class.add('override-material');
        panelMaterialButtons.append(assetMaterials);
        assetMaterials.on('click', function () {
            var modelAsset = editor.call('assets:get', entities[0].get('components.model.asset'));
            editor.call('selector:set', 'asset', [modelAsset]);
        });

        // add button to add material override
        var entityMaterials = new ui.Button({
            text: 'Entity Materials'
        });
        entityMaterials.disabled = assetMaterials.disabled;
        entityMaterials.class.add('override-material');
        panelMaterialButtons.append(entityMaterials);

        entityMaterials.on('click', function () {
            editor.call('picker:node', entities);
        });

        // get one of the Entities to use for finding the mesh instances names
        var engineEntity = app.root.findByGuid(entities[0].get('resource_id'));

        var removeOverride = function (index) {
            var resourceIds = [];
            var previous = [];

            entities.forEach(function (entity) {
                resourceIds.push(entity.get('resource_id'));
                var history = entity.history.enabled;
                entity.history.enabled = false;
                previous.push(entity.has('components.model.mapping.' + index) ? entity.get('components.model.mapping.' + index) : undefined);
                entity.unset('components.model.mapping.' + index);
                entity.history.enabled = history;
            });

            editor.call('history:add', {
                name: 'entities.' + (resourceIds.length > 1 ? '*' : resourceIds[0]) + '.components.model.mapping',
                undo: function() {
                    for(var i = 0; i < resourceIds.length; i++) {
                        var item = editor.call('entities:get', resourceIds[i]);
                        if (! item)
                            continue;

                        var history = item.history.enabled;
                        item.history.enabled = false;
                        if (previous[i] === undefined)
                            item.unset('components.model.mapping.' + index);
                        else
                            item.set('components.model.mapping.' + index, previous[i]);

                        item.history.enabled = history;
                    }
                },
                redo: function() {
                    for(var i = 0; i < resourceIds.length; i++) {
                        var item = editor.call('entities:get', resourceIds[i]);
                        if (! item)
                            continue;

                        var history = item.history.enabled;
                        item.history.enabled = false;
                        item.unset('components.model.mapping.' + index);
                        item.history.enabled = history;
                    }
                }
            });
        };

        var addOverride = function (index) {
            var valuesBefore;

            if (! engineEntity.model)
                return;

            var meshInstances = engineEntity.model.meshInstances || [ ];

            var field = editor.call('attributes:addField', {
                parent: panelMaterials,
                type: 'asset',
                kind: 'material',
                name: meshInstances[index] ? meshInstances[index].node.name : 'node ' + index,
                link: entities,
                path: 'components.model.mapping.' + index,
                over: function(type, data) {
                    valuesBefore = entities.map(function (entity) {
                        var path = 'components.model.mapping.' + index;
                        return entity.has(path) ? entity.get(path) : undefined;
                    });

                    entities.forEach(function (entity) {
                        var engineEntity = app.root.findByGuid(entity.get('resource_id'));
                        if (engineEntity) {
                            var mapping = engineEntity.model.mapping;
                            if (engineEntity.model.mapping && engineEntity.model.mapping[index] !== undefined) {
                                mapping[index] = parseInt(data.id, 10);
                                engineEntity.model.mapping = mapping;
                            }
                        }
                    });

                    editor.call('viewport:render');
                },
                leave: function() {
                    if (!valuesBefore) return;

                    entities.forEach(function (entity, i) {
                        var engineEntity = app.root.findByGuid(entity.get('resource_id'));
                        if (engineEntity) {
                            var mapping = engineEntity.model.mapping;
                            if (! mapping) return;

                            if (valuesBefore[i] === undefined) {
                                delete mapping[index];
                            } else {
                                mapping[index] = valuesBefore[i] === null ? null : parseInt(valuesBefore[i], 10);
                            }

                            engineEntity.model.mapping = mapping;
                        }
                    });

                    editor.call('viewport:render');
                }
            });

            field.parent.class.add('node-' + index);

            field.parent.on('click', function () {
                field.parent.class.remove('active');
            });

            // button to remove mapping entry
            var removeButton = new ui.Button({
                text: '&#57636;'
            });
            removeButton.style.fontWeight = 200;
            removeButton.class.add('remove');
            field.parent.append(removeButton);

            removeButton.on('click', function () {
                removeOverride(index);
            });
        };

        // add field for each mapping
        for (var key in allMappings) {
            addOverride(key);
        }

        // subscribe to mapping change events
        entities.forEach(function (entity) {
            events.push(entity.on('*:set', function (path) {
                if (! /^components.model.mapping/.test(path)) return;

                var value = entity.get('components.model.mapping');

                if (! value) value = {};

                var resourceId = entity.get('resource_id');

                // remove deleted overrides
                for (var key in allMappings) {
                    if (value[key] === undefined) {
                        var ind = allMappings[key].indexOf(resourceId);
                        if (ind !== -1) {
                            allMappings[key].splice(ind, 1);
                            if (allMappings[key].length === 0) {
                                var field = panelMaterials.element.querySelector('.field-asset.node-' + key);
                                if (field)
                                    field.parentElement.removeChild(field);

                                delete allMappings[key];
                            }
                        }
                    }
                }


                // add new
                for (var key in value) {
                    if (!allMappings[key]) {
                        allMappings[key] = [resourceId];
                        addOverride(key);
                    }
                    else {
                        if (allMappings[key].indexOf(resourceId) === -1)
                            allMappings[key].push(resourceId);
                    }
                }

            }));

            events.push(entity.on('*:unset', function (path, value) {
                if (! /^components.model.mapping/.test(path)) return;

                var parts = path.split('.');
                var index = parts[parts.length-1];
                if (!allMappings[index]) return;

                var resourceId = entity.get('resource_id');

                var ind = allMappings[index].indexOf(resourceId);
                if (ind === -1) return;

                allMappings[index].splice(ind, 1);
                if (allMappings[index].length) return;

                delete allMappings[index];

                var field = panelMaterials.element.querySelector('.field-asset.node-' + index);
                if (field)
                    field.parentElement.removeChild(field);

            }));
        });
    });
});
