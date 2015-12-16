editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        // if (entities.length !== 1)
        //     return;

        // var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Light',
            name: 'light',
            entities: entities
        });


        // type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: {
                '': '...',
                'directional': 'Directional',
                'spot': 'Spot',
                'point': 'Point'
            },
            link: entities,
            path: 'components.light.type'
        });
        // reference
        editor.call('attributes:reference:light:type:attach', fieldType.parent.innerElement.firstChild.ui);


        // mode
        var fieldMode = editor.call('attributes:addField', {
            parent: panel,
            name: 'Mode',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Full' },
                { v: 1, t: 'Dynamic' },
                { v: 2, t: 'Bake' }
            ],
            link: entities,
            path: 'components.light.mode'
        });
        // reference
        editor.call('attributes:reference:light:mode:attach', fieldMode.parent.innerElement.firstChild.ui);


        // color
        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            link: entities,
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
            link: entities,
            path: 'components.light.intensity'
        });
        fieldIntensity.style.width = '32px';
        // reference
        editor.call('attributes:reference:light:intensity:attach', fieldIntensity.parent.innerElement.firstChild.ui);

        // intensity slider
        var fieldIntensitySlider = editor.call('attributes:addField', {
            panel: fieldIntensity.parent,
            precision: 2,
            step: .1,
            min: 0,
            max: 32,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.light.intensity'
        });
        fieldIntensitySlider.flexGrow = 4;


        // range
        var fieldRange = editor.call('attributes:addField', {
            parent: panel,
            name: 'Range',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: entities,
            path: 'components.light.range'
        });
        fieldRange.parent.hidden = ! (fieldType.value === '' || fieldType.value !== 'directional');
        fieldType.on('change', function(value) {
            fieldRange.parent.hidden = ! (value === '' || value !== 'directional');
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
            link: entities,
            path: 'components.light.falloffMode'
        });
        fieldFalloffMode.parent.hidden = ! (fieldType.value === '' || fieldType.value !== 'directional');
        fieldType.on('change', function(value) {
            fieldFalloffMode.parent.hidden = ! (value === '' || value !== 'directional');
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
            link: entities,
            path: 'components.light.innerConeAngle'
        });
        fieldInnerConeAngle.style.width = '32px';
        fieldInnerConeAngle.parent.hidden = ! (fieldType.value === '' || fieldType.value === 'spot');
        fieldType.on('change', function(value) {
            fieldInnerConeAngle.parent.hidden = ! (value === '' || value === 'spot');
        });
        // reference
        editor.call('attributes:reference:light:coneAngles:attach', fieldInnerConeAngle.parent.innerElement.firstChild.ui);


        // outerConeAngle
        var fieldOuterConeAngle = editor.call('attributes:addField', {
            panel: fieldInnerConeAngle.parent,
            placeholder: 'Outer',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            max: 90,
            link: entities,
            path: 'components.light.outerConeAngle'
        });
        fieldOuterConeAngle.style.width = '32px';


        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panel.append(divider);


        // castShadows
        var fieldCastShadows = editor.call('attributes:addField', {
            parent: panel,
            name: 'Shadows',
            type: 'checkbox',
            link: entities,
            path: 'components.light.castShadows'
        });
        // reference
        editor.call('attributes:reference:light:castShadows:attach', fieldCastShadows.parent.innerElement.firstChild.ui);


        // shadows panel
        var panelShadows = editor.call('attributes:addPanel', {
            parent: panel
        });
        panelShadows.hidden = ! fieldCastShadows.value && ! fieldCastShadows.class.contains('null');
        fieldCastShadows.on('change', function(value) {
            panelShadows.hidden = ! value && ! this.class.contains('null');
        });


        // shadowDistance
        var fieldShadowDistance = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Distance',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: entities,
            path: 'components.light.shadowDistance'
        });
        fieldShadowDistance.parent.hidden = ! (fieldType.value === '' || fieldType.value === 'directional');
        fieldType.on('change', function(value) {
            fieldShadowDistance.parent.hidden = ! (value === '' || value === 'directional');
        });
        // reference
        editor.call('attributes:reference:light:shadowDistance:attach', fieldShadowDistance.parent.innerElement.firstChild.ui);


        // shadowResolution
        var fieldShadowResolution = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Resolution',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 128, t: '128 x 128' },
                { v: 256, t: '256 x 256' },
                { v: 512, t: '512 x 512' },
                { v: 1024, t: '1024 x 1024' },
                { v: 2048, t: '2048 x 2048' }
            ],
            link: entities,
            path: 'components.light.shadowResolution'
        });
        // reference
        editor.call('attributes:reference:light:shadowResolution:attach', fieldShadowResolution.parent.innerElement.firstChild.ui);


        // shadowBias
        var fieldShadowBias = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Bias',
            type: 'number',
            precision: 3,
            step: .001,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.light.shadowBias'
        });
        fieldShadowBias.style.width = '32px';
        // reference
        editor.call('attributes:reference:light:shadowBias:attach', fieldShadowBias.parent.innerElement.firstChild.ui);


        // normalOffsetBias
        var fieldShadowBiasNormalOffset = editor.call('attributes:addField', {
            panel: fieldShadowBias.parent,
            type: 'number',
            placeholder: 'Normal Offset',
            precision: 3,
            step: .001,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.light.normalOffsetBias'
        });
        fieldShadowBiasNormalOffset.style.width = '32px';
        fieldShadowBiasNormalOffset.flexGrow = 2;
    });
});
