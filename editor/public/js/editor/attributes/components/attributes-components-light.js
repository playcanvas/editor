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
        panel.class.add('component');
        // reference
        editor.call('attributes:reference:light:attach', panel, panel.headerElement);

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
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.light.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.light');
        });
        panel.headerAppend(fieldRemove);


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
        // reference
        editor.call('attributes:reference:light:type:attach', fieldType.parent.innerElement.firstChild.ui);


        // color
        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            link: entity,
            path: 'components.light.color'
        });
        // reference
        editor.call('attributes:reference:light:color:attach', fieldColor.parent.innerElement.firstChild.ui);


        // intensity
        var fieldIntensity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Intensity',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            max: 32,
            link: entity,
            path: 'components.light.intensity'
        });
        fieldIntensity.style.width = '32px';
        // reference
        editor.call('attributes:reference:light:intensity:attach', fieldIntensity.parent.innerElement.firstChild.ui);

        // intensity slider
        var fieldIntensitySlider = new ui.Slider({
            min: 0,
            max: 32,
            precision: 2
        });
        fieldIntensitySlider.flexGrow = 4;
        fieldIntensitySlider.link(entity, 'components.light.intensity');
        fieldIntensity.parent.append(fieldIntensitySlider);


        // range
        var fieldRange = editor.call('attributes:addField', {
            parent: panel,
            name: 'Range',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: entity,
            path: 'components.light.range'
        });
        fieldRange.parent.hidden = entity.get('components.light.type') === 'directional';
        fieldType.on('change', function(value) {
            fieldRange.parent.hidden = value === 'directional';
        });
        // reference
        editor.call('attributes:reference:light:range:attach', fieldRange.parent.innerElement.firstChild.ui);


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
        fieldFalloffMode.parent.hidden = entity.get('components.light.type') === 'directional';
        fieldType.on('change', function(value) {
            fieldFalloffMode.parent.hidden = value === 'directional';
        });
        // reference
        editor.call('attributes:reference:light:falloffMode:attach', fieldFalloffMode.parent.innerElement.firstChild.ui);


        // innerConeAngle
        var fieldInnerConeAngle = editor.call('attributes:addField', {
            parent: panel,
            name: 'Cone Angles',
            placeholder: 'Inner',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            max: 90,
            link: entity,
            path: 'components.light.innerConeAngle'
        });
        fieldInnerConeAngle.style.width = '32px';
        // reference
        editor.call('attributes:reference:light:coneAngles:attach', fieldInnerConeAngle.parent.innerElement.firstChild.ui);


        fieldInnerConeAngle.parent.hidden = entity.get('components.light.type') !== 'spot';
        fieldType.on('change', function(value) {
            fieldInnerConeAngle.parent.hidden = value !== 'spot';
        });


        // outerConeAngle
        var fieldOuterConeAngle = new ui.NumberField({
            precision: 2,
            step: 1,
            min: 0,
            max: 90
        });
        fieldOuterConeAngle.placeholder = 'Outer';
        fieldOuterConeAngle.style.width = '32px';
        fieldOuterConeAngle.flexGrow = 1;
        fieldOuterConeAngle.link(entity, 'components.light.outerConeAngle');
        fieldInnerConeAngle.parent.append(fieldOuterConeAngle);



        // castShadows
        var fieldCastShadows = editor.call('attributes:addField', {
            parent: panel,
            name: 'Cast Shadows',
            type: 'checkbox',
            link: entity,
            path: 'components.light.castShadows'
        });
        // reference
        editor.call('attributes:reference:light:castShadows:attach', fieldCastShadows.parent.innerElement.firstChild.ui);


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
            precision: 2,
            step: 1,
            min: 0,
            link: entity,
            path: 'components.light.shadowDistance'
        });
        fieldShadowDistance.parent.hidden = entity.get('components.light.type') !== 'directional';
        fieldType.on('change', function(value) {
            fieldShadowDistance.parent.hidden = value !== 'directional';
        });
        // reference
        editor.call('attributes:reference:light:shadowDistance:attach', fieldShadowDistance.parent.innerElement.firstChild.ui);


        // shadowResolution
        var fieldShadowResolution = editor.call('attributes:addField', {
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
        // reference
        editor.call('attributes:reference:light:shadowResolution:attach', fieldShadowResolution.parent.innerElement.firstChild.ui);


        // shadowBias
        var fieldShadowBias = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Shadow Bias',
            type: 'number',
            precision: 3,
            step: .001,
            min: 0,
            max: 1,
            link: entity,
            path: 'components.light.shadowBias'
        });
        fieldShadowBias.style.width = '32px';
        // reference
        editor.call('attributes:reference:light:shadowBias:attach', fieldShadowBias.parent.innerElement.firstChild.ui);


        // normalOffsetBias
        var fieldShadowBiasNormalOffset = new ui.NumberField({
            precision: 3,
            step: .001,
            min: 0,
            max: 1
        });
        fieldShadowBiasNormalOffset.placeholder = 'Normal Offset';
        fieldShadowBiasNormalOffset.style.width = '32px';
        fieldShadowBiasNormalOffset.flexGrow = 2;
        fieldShadowBiasNormalOffset.link(entity, 'components.light.normalOffsetBias');
        fieldShadowBias.parent.append(fieldShadowBiasNormalOffset);
    });
});
