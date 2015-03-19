editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // model
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Model'
        });
        panel.class.add('component');

        if (! entity.get('components.model')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.model:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.model:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.model.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.model');
        });
        panel.headerAppend(fieldRemove);


        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                'asset': 'Asset',
                'box': 'Box',
                'capsule': 'Capsule',
                'sphere': 'Sphere',
                'cylinder': 'Cylinder',
                'cone': 'Cone',
                'plane': 'Plane'
            },
            link: entity,
            path: 'components.model.type'
        });
        fieldType.on('change', function(value) {
            fieldAsset.parent.hidden = value !== 'asset';
            if (fieldAsset.parent.hidden)
                fieldAsset.value = null;

            fieldMaterial.parent.hidden = value === 'asset';
            if (fieldMaterial.parent.hidden)
                fieldMaterial.value = null;
        });


        // asset
        var fieldAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Asset',
            type: 'asset',
            kind: 'model',
            link: entity,
            path: 'components.model.asset'
        });
        fieldAsset.parent.hidden = entity.get('components.model.type') !== 'asset';


        // material
        var fieldMaterial = editor.call('attributes:addField', {
            parent: panel,
            name: 'Material',
            type: 'asset',
            kind: 'material',
            link: entity,
            path: 'components.model.materialAsset'
        });
        fieldMaterial.class.add('material-asset');
        fieldMaterial.parent.hidden = entity.get('components.model.type') === 'asset';


        // castShadows
        var fieldCastShadows = editor.call('attributes:addField', {
            parent: panel,
            type: 'checkbox',
            name: 'Shadows',
            link: entity,
            path: 'components.model.castShadows'
        });
        // label
        var label = new ui.Label({ text: 'Cast' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        fieldCastShadows.parent.append(label);


        // receiveShadows
        var fieldReceiveShadows = new ui.Checkbox();
        fieldReceiveShadows.link(entity, 'components.model.receiveShadows');
        fieldCastShadows.parent.append(fieldReceiveShadows);
        // label
        var label = new ui.Label({ text: 'Receive' });
        label.class.add('label-infield');
        fieldCastShadows.parent.append(label);
    });
});
