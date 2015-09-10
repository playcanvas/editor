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
            toggleOverrides();
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
                    allMappings[key] = true;
                }
            }
        }

        var panelMaterials = editor.call('attributes:addPanel');
        panelMaterials.class.add('component', 'override-material');
        panel.append(panelMaterials);

        // check if we should show the override button
        // mainly if all entities have a model component
        // and are referencing an asset
        var toggleOverrides = function ()  {
            var referencedModelAsset = entities[0].get('components.model.asset');
            for (var i = 0, len = entities.length; i < len; i++) {
                if (entities[i].get('components.model.type') !== 'asset' ||
                    entities[i].get('components.model.asset') !== referencedModelAsset) {
                    panelMaterials.hidden = true;
                    return;
                }
            }

            panelMaterials.hidden = false;
        };

        // turn override panel off / on
        toggleOverrides();

        // add button to add material override
        var overrideBtn = new ui.Button({
            text: 'Materials'
        });
        overrideBtn.class.add('override-material');
        panelMaterials.append(overrideBtn);

        overrideBtn.on('click', function () {
            editor.call('picker:node', entities);
        });

        var framework = editor.call('viewport:framework');

        // get one of the Entities to use for finding the mesh instances names
        var engineEntity = framework.root.findByGuid(entities[0].get('resource_id'));

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
                            mapping[index] = parseInt(data.id, 10);
                            engineEntity.model.mapping = mapping;
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
                text: '&#58657;'
            });
            removeButton.class.add('remove');
            field.parent.append(removeButton);

            removeButton.on('click', function () {
                entities.forEach(function (entity) {
                    entity.unset('components.model.mapping.' + index);
                });
            });
        };

        // add field for each mapping
        for (var key in allMappings) {
            addOverride(key);
        }

        // subscribe to mapping change events
        entities.forEach(function (entity) {
            events.push(entity.on('components.model.mapping:set', function (value) {
                if (! value) value = {};

                // remove deleted overrides
                for (var key in allMappings) {
                    if (value[key] === undefined) {
                        var field = panelMaterials.element.querySelector('.field-asset.node-' + key);
                        if (field)
                            field.parentElement.removeChild(field);

                        delete allMappings[key];
                    }
                }

                // add new
                for (var key in value) {
                    if (allMappings[key] === undefined) {
                        allMappings[key] = true;
                        addOverride(key);
                    }
                }

            }));

            events.push(entity.on('*:unset', function (path, value) {
                if (path.indexOf('components.model.mapping') !== 0) return;

                var parts = path.split('.');
                var index = parts[parts.length-1];
                var field = panelMaterials.element.querySelector('.field-asset.node-' + index);
                if (field)
                    field.parentElement.removeChild(field);

                delete allMappings[index];
            }));
        });
    });
});
