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


        // model.enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.model.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.on('destroy', function() {
            fieldEnabled.destroy();
        });

        // model.type
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
            if (value !== 'asset')
                fieldAsset.value = null;
        });

        // model.asset
        var fieldAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Asset',
            type: 'number',
            link: entity,
            path: 'components.model.asset'
        });
        fieldAsset.parent.hidden = entity.get('components.model.type') !== 'asset';


        // model.shadows
        var fieldShadowOptions = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Shadows',
            type: 'element',
            element: fieldShadowOptions
        });

        // model.castShadows
        var fieldShadowCast = new ui.Checkbox();
        fieldShadowCast.link(entity, 'components.model.castShadows');
        fieldShadowOptions.append(fieldShadowCast);
        // label
        var label = new ui.Label('Cast');
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        fieldShadowOptions.append(label);

        // model.receiveShadows
        var fieldShadowReceive = new ui.Checkbox();
        fieldShadowReceive.link(entity, 'components.model.receiveShadows');
        fieldShadowOptions.append(fieldShadowReceive);
        // label
        var label = new ui.Label('Receive');
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        fieldShadowOptions.append(label);
    });
});
