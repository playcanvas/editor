editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // light
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Light'
        });
        if (! entity.get('components.light')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.light:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.light:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });

        // enabled
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Enabled',
            type: 'checkbox',
            link: entity,
            path: 'components.light.enabled'
        });

        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                'directional': 'Directional',
                'spot': 'Spot',
                'point': 'Point'
            },
            link: entity,
            path: 'components.light.type'
        });

        // color
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            link: entity,
            path: 'components.light.color'
        });

        // intensity
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Intensity',
            type: 'number',
            link: entity,
            path: 'components.light.intensity'
        });

        // range
        var fieldRange = editor.call('attributes:addField', {
            parent: panel,
            name: 'Range',
            type: 'number',
            link: entity,
            path: 'components.light.range'
        });
        fieldRange.parent.hidden = entity.get('components.light.type') === 'directional';
        fieldType.on('change', function(value) {
            fieldRange.parent.hidden = value === 'directional';
        });

        // falloffMode
        var fieldFalloffMode = editor.call('attributes:addField', {
            parent: panel,
            name: 'Falloff Mode',
            type: 'number',
            enum: {
                0: 'Linear',
                1: 'Inverse Squared'
            },
            link: entity,
            path: 'components.light.falloffMode'
        });
        fieldFalloffMode.hidden = entity.get('components.light.type') === 'directional';
        fieldType.on('change', function(value) {
            fieldFalloffMode.parent.hidden = value === 'directional';
        });

        // light inner/outer cone
        var panelClip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Inner/Outer Cone Angles'
        });

        var label = panelClip;
        panelClip = panelClip.parent;
        label.destroy();

        panelClip.hidden = entity.get('components.light.type') !== 'spot';
        fieldType.on('change', function(value) {
            panelClip.hidden = value !== 'spot';
        });

        // innerConeAngle
        var fieldInnerConeAngle = new ui.NumberField();
        fieldInnerConeAngle.style.width = '32px';
        fieldInnerConeAngle.flexGrow = 1;
        fieldInnerConeAngle.link(entity, 'components.camera.innerConeAngle');
        panelClip.append(fieldInnerConeAngle);

        // outerConeAngle
        var fieldOuterConeAngle = new ui.NumberField();
        fieldOuterConeAngle.style.width = '32px';
        fieldOuterConeAngle.flexGrow = 1;
        fieldOuterConeAngle.link(entity, 'components.camera.outerConeAngle');
        panelClip.append(fieldOuterConeAngle);


        // castShadows
        var fieldCastShadows = editor.call('attributes:addField', {
            parent: panel,
            name: 'Cast Shadows',
            type: 'checkbox',
            link: entity,
            path: 'components.light.castShadows'
        });

        // shadows panel
        var panelShadows = editor.call('attributes:addPanel', {
            parent: panel
        });
        panelShadows.hidden = ! entity.get('components.light.castShadows');
        fieldCastShadows.on('change', function(value) {
            panelShadows.hidden = ! value;
        });

        // shadowDistance
        var fieldShadowDistance = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Shadow Distance',
            type: 'number',
            link: entity,
            path: 'components.light.shadowDistance'
        });
        fieldShadowDistance.parent.hidden = entity.get('components.light.type') !== 'directional';
        fieldType.on('change', function(value) {
            fieldShadowDistance.parent.hidden = value !== 'directional';
        });

        // shadowResolution
        editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Shadow Resolution',
            type: 'number',
            enum: {
                128: '128 x 128',
                256: '256 x 256',
                512: '512 x 512',
                1024: '1024 x 1024',
                2048: '2048 x 2048'
            },
            link: entity,
            path: 'components.light.shadowResolution'
        });

        // shadowBias
        editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Shadow Bias',
            type: 'number',
            link: entity,
            path: 'components.light.shadowBias'
        });

        // normalOffsetBias
        editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Normal Offset Shadow Bias',
            type: 'number',
            link: entity,
            path: 'components.light.normalOffsetBias'
        });

    });
});
