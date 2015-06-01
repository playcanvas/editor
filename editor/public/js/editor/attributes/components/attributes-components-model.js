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
        panel.class.add('component', 'entity', 'model');
        // reference
        editor.call('attributes:reference:model:attach', panel, panel.headerElementTitle);

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


        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.model');
        });
        panel.headerAppend(fieldRemove);

        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.model.enabled');
        panel.headerAppend(fieldEnabled);

        // toggle-label
        var labelEnabled = new ui.Label();
        labelEnabled.renderChanges = false;
        labelEnabled.class.add('component-toggle-label');
        panel.headerAppend(labelEnabled);
        labelEnabled.text = fieldEnabled.value ? 'On' : 'Off';
        fieldEnabled.on('change', function(value) {
            labelEnabled.text = value ? 'On' : 'Off';
        });


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
        // reference
        editor.call('attributes:reference:model:type:attach', fieldType.parent.innerElement.firstChild.ui);


        // asset
        var fieldAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Model',
            type: 'asset',
            kind: 'model',
            link: entity,
            path: 'components.model.asset'
        });
        fieldAsset.parent.hidden = entity.get('components.model.type') !== 'asset';
        // reference
        editor.call('attributes:reference:model:asset:attach', fieldAsset._label);


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
        // reference
        editor.call('attributes:reference:model:materialAsset:attach', fieldMaterial._label);


        // castShadows
        var fieldCastShadows = editor.call('attributes:addField', {
            parent: panel,
            type: 'checkbox',
            name: 'Shadows',
            link: entity,
            path: 'components.model.castShadows'
        });
        fieldCastShadows.class.add('tick');
        // label
        var label = new ui.Label({ text: 'Cast' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        fieldCastShadows.parent.append(label);
        // reference
        editor.call('attributes:reference:model:castShadows:attach', label);


        // receiveShadows
        var fieldReceiveShadows = new ui.Checkbox();
        fieldReceiveShadows.class.add('tick');
        fieldReceiveShadows.link(entity, 'components.model.receiveShadows');
        fieldCastShadows.parent.append(fieldReceiveShadows);
        // label
        var label = new ui.Label({ text: 'Receive' });
        label.class.add('label-infield');
        fieldCastShadows.parent.append(label);
        // reference
        editor.call('attributes:reference:model:receiveShadows:attach', label);
    });
});
