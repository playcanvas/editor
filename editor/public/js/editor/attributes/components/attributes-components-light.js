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
        editor.call('attributes:reference:attach', 'light:type', fieldType.parent.innerElement.firstChild.ui);


        // bake
        var fieldLightMap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Lightmap',
            type: 'checkbox',
            link: entities,
            path: 'components.light.bake'
        });
        // label
        var label = new ui.Label({ text: 'Bake' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        fieldLightMap.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'light:bake', label);


        // affectDynamic
        var fieldAffectDynamic = editor.call('attributes:addField', {
            parent: panel,
            name: 'Affect',
            type: 'checkbox',
            link: entities,
            path: 'components.light.affectDynamic'
        });
        // label
        var label = new ui.Label({ text: 'Dynamic' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        fieldAffectDynamic.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'light:affectDynamic', label);


        // affectLightmapped
        var fieldAffectLightmapped = editor.call('attributes:addField', {
            panel: fieldAffectDynamic.parent,
            type: 'checkbox',
            link: entities,
            path: 'components.light.affectLightmapped'
        });
        // label
        var labelBaked = new ui.Label({ text: 'Lightmapped' });
        labelBaked.class.add('label-infield');
        fieldAffectDynamic.parent.append(labelBaked);
        // reference
        editor.call('attributes:reference:attach', 'light:affectLightmapped', labelBaked);
        // disable/enable affectLightmapped flag
        fieldAffectLightmapped.disabled = labelBaked.disabled = !! fieldLightMap.value;
        fieldLightMap.on('change', function() {
            fieldAffectLightmapped.disabled = labelBaked.disabled = !! fieldLightMap.value;
        });


        // color
        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            link: entities,
            path: 'components.light.color'
        });
        // reference
        editor.call('attributes:reference:attach', 'light:color', fieldColor.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'light:intensity', fieldIntensity.parent.innerElement.firstChild.ui);

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
        editor.call('attributes:reference:attach', 'light:range', fieldRange.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'light:falloffMode', fieldFalloffMode.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'light:coneAngles', fieldInnerConeAngle.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'light:castShadows', fieldCastShadows.parent.innerElement.firstChild.ui);


        // shadows panel
        var panelShadows = editor.call('attributes:addPanel', {
            parent: panel
        });
        panelShadows.hidden = ! fieldCastShadows.value && ! fieldCastShadows.class.contains('null');
        fieldCastShadows.on('change', function(value) {
            panelShadows.hidden = ! value && ! this.class.contains('null');
        });


        // shadowUpdateMode
        var fieldShadowUpdateMode = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Update Mode',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: pc.SHADOWUPDATE_THISFRAME, t: 'Once' },
                { v: pc.SHADOWUPDATE_REALTIME, t: 'Realtime' }
            ],
            link: entities,
            path: 'components.light.shadowUpdateMode'
        });
        // reference
        editor.call('attributes:reference:attach', 'light:shadowUpdateMode', fieldShadowUpdateMode.parent.innerElement.firstChild.ui);

        var updateFieldShadowUpdateMode = function() {
            fieldShadowUpdateMode.parent.hidden = fieldLightMap.value && ! fieldAffectDynamic.value && ! fieldLightMap.class.contains('null') && ! fieldAffectDynamic.class.contains('null');
        };
        fieldLightMap.on('change', updateFieldShadowUpdateMode);
        fieldAffectDynamic.on('change', updateFieldShadowUpdateMode);


        // updateShadow button
        var btnUpdateShadow = new ui.Button({
            text: '&#57640;'
        });
        btnUpdateShadow.class.add('shadowUpdate');
        btnUpdateShadow.hidden = fieldShadowUpdateMode.value !== pc.SHADOWUPDATE_THISFRAME && !! fieldShadowUpdateMode.value;
        fieldShadowUpdateMode.parent.append(btnUpdateShadow);
        fieldShadowUpdateMode.on('change', function() {
            btnUpdateShadow.hidden = fieldShadowUpdateMode.value !== pc.SHADOWUPDATE_THISFRAME && !! fieldShadowUpdateMode.value;
        });
        btnUpdateShadow.on('click', function() {
            for(var i = 0; i < entities.length; i++) {
                if (entities[i].entity && entities[i].entity.light && entities[i].entity.light.shadowUpdateMode === pc.SHADOWUPDATE_THISFRAME)
                    entities[i].entity.light.shadowUpdateMode = pc.SHADOWUPDATE_THISFRAME;
            }
            editor.call('viewport:render');
        });


        // shadowResolution
        var fieldShadowResolution = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Resolution',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 16, t: '16 x 16' },
                { v: 32, t: '32 x 32' },
                { v: 64, t: '64 x 64' },
                { v: 128, t: '128 x 128' },
                { v: 256, t: '256 x 256' },
                { v: 512, t: '512 x 512' },
                { v: 1024, t: '1024 x 1024' },
                { v: 2048, t: '2048 x 2048' },
                { v: 4096, t: '4096 x 4096' }
            ],
            link: entities,
            path: 'components.light.shadowResolution'
        });
        // reference
        editor.call('attributes:reference:attach', 'light:shadowResolution', fieldShadowResolution.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:attach', 'light:shadowDistance', fieldShadowDistance.parent.innerElement.firstChild.ui);


        // shadowType
        var fieldShadowType = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Shadow Type',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Shadow Map' },
                { v: 1, t: 'Variance Shadow Map (8bit)' },
                { v: 2, t: 'Variance Shadow Map (16bit)' },
                { v: 3, t: 'Variance Shadow Map (32bit)' }
            ],
            link: entities,
            path: 'components.light.shadowType'
        });
        // reference
        editor.call('attributes:reference:attach', 'light:shadowType', fieldShadowType.parent.innerElement.firstChild.ui);

        // vsmBlurMode
        var fieldShadowVsmBlurMode = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'VSM Blur Mode',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Box' },
                { v: 1, t: 'Gaussian' }
            ],
            link: entities,
            path: 'components.light.vsmBlurMode'
        });
        // reference
        editor.call('attributes:reference:attach', 'light:vsmBlurMode', fieldShadowVsmBlurMode.parent.innerElement.firstChild.ui);
        //
        fieldShadowVsmBlurMode.parent.hidden = fieldShadowType.value === 0;
        fieldShadowType.on('change', function() {
            fieldShadowVsmBlurMode.parent.hidden = fieldShadowType.value === 0;
        });

        // vsmBlurSize
        var fieldShadowVsmBlurSize = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'VSM Blur Size',
            type: 'number',
            min: 1,
            max: 25,
            link: entities,
            path: 'components.light.vsmBlurSize'
        });
        fieldShadowVsmBlurSize.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'light:vsmBlurSize', fieldShadowVsmBlurSize.parent.innerElement.firstChild.ui);
        //
        fieldShadowVsmBlurSize.parent.hidden = fieldShadowType.value === 0;
        fieldShadowType.on('change', function() {
            fieldShadowVsmBlurSize.parent.hidden = fieldShadowType.value === 0;
        });
        // intensity slider
        var fieldShadowVsmBlurSizeSlider = editor.call('attributes:addField', {
            panel: fieldShadowVsmBlurSize.parent,
            precision: 0,
            step: 1,
            min: 1,
            max: 25,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.light.vsmBlurSize'
        });
        fieldShadowVsmBlurSizeSlider.flexGrow = 4;


        // vsmBias
        var fieldVsmBias = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'VSM Bias',
            type: 'number',
            precision: 4,
            step: .001,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.light.vsmBias'
        });
        // reference
        editor.call('attributes:reference:attach', 'light:vsmBias', fieldVsmBias.parent.innerElement.firstChild.ui);
        //
        fieldVsmBias.parent.hidden = fieldShadowType.value === 0;
        fieldShadowType.on('change', function() {
            fieldVsmBias.parent.hidden = fieldShadowType.value === 0;
        });


        // shadowBias
        var fieldShadowBias = editor.call('attributes:addField', {
            parent: panelShadows,
            name: 'Bias',
            type: 'number',
            precision: 4,
            step: .001,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.light.shadowBias'
        });
        fieldShadowBias.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'light:shadowBias', fieldShadowBias.parent.innerElement.firstChild.ui);
        //
        fieldShadowBias.parent.hidden = fieldShadowType.value !== 0;
        fieldShadowType.on('change', function() {
            fieldShadowBias.parent.hidden = fieldShadowType.value !== 0;
        });


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
        // reference
        editor.call('attributes:reference:attach', 'light:normalOffsetBias', fieldShadowBiasNormalOffset);
    });
});
