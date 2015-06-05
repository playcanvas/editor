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
    });
});
