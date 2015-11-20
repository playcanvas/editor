editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

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
            fieldMaterial.parent.hidden = value === 'asset' || value === '';
            toggleMaterials();
        });
        // reference
        editor.call('attributes:reference:model:type:attach', fieldType.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:model:asset:attach', fieldAsset._label);

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
                var lastHistoryAction = editor.call('history:current');
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
        fieldMaterial.parent.hidden = fieldType.value === 'asset' || fieldType.value === '';
        // reference
        editor.call('attributes:reference:model:materialAsset:attach', fieldMaterial._label);


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
        label.style.paddingRight = '12px';
        fieldCastShadows.parent.append(label);
        // reference
        editor.call('attributes:reference:model:castShadows:attach', label);


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
        editor.call('attributes:reference:model:receiveShadows:attach', label);

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
        entityMaterials.class.add('override-material');
        panelMaterialButtons.append(entityMaterials);

        entityMaterials.on('click', function () {
            editor.call('picker:node', entities);
        });

        var framework = editor.call('viewport:framework');

        // get one of the Entities to use for finding the mesh instances names
        var engineEntity = framework.root.findByGuid(entities[0].get('resource_id'));

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

            var meshInstances = engineEntity.model.model.meshInstances;

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
                        var engineEntity = framework.root.findByGuid(entity.get('resource_id'));
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
                        var engineEntity = framework.root.findByGuid(entity.get('resource_id'));
                        if (engineEntity) {
                            var mapping = engineEntity.model.mapping;
                            if (! mapping) return;

                            if (valuesBefore[i] === undefined)
                                delete mapping[index];
                            else
                                mapping[index] = valuesBefore[i] === null ? null : parseInt(valuesBefore[i], 10);

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
