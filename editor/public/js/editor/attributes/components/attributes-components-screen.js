editor.once('load', function () {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function (entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [];

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Screen',
            name: 'screen',
            entities: entities
        });

        // Screenspace
        var fieldScreenspace = editor.call('attributes:addField', {
            parent: panel,
            name: 'Screen Space',
            type: 'checkbox',
            link: entities,
            path: 'components.screen.screenSpace',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'screen:screenSpace', fieldScreenspace.parent.innerElement.firstChild.ui);

        // Resolution
        var fieldResolution = editor.call('attributes:addField', {
            parent: panel,
            name: 'Resolution',
            placeholder: ['Width', 'Height'],
            type: 'vec2',
            link: entities,
            path: 'components.screen.resolution',
            canOverrideTemplate: true
        });

        fieldResolution[0].parent.hidden = !!fieldScreenspace.value;

        // reference
        editor.call('attributes:reference:attach', 'screen:resolution', fieldResolution[0].parent.innerElement.firstChild.ui);

        // Reference Resolution
        var fieldRefResolution = editor.call('attributes:addField', {
            parent: panel,
            name: 'Ref Resolution',
            placeholder: ['Width', 'Height'],
            type: 'vec2',
            link: entities,
            path: 'components.screen.referenceResolution',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'screen:referenceResolution', fieldRefResolution[0].parent.innerElement.firstChild.ui);

        // scale mode
        var fieldScaleMode = editor.call('attributes:addField', {
            parent: panel,
            name: 'Scale Mode',
            type: 'string',
            enum: [
                { v: '', t: '...' },
                { v: 'none', t: 'None' },
                { v: 'blend', t: 'Blend' }
            ],
            link: entities,
            path: 'components.screen.scaleMode',
            canOverrideTemplate: true
        });

        fieldScaleMode.parent.hidden = !fieldScreenspace.value;

        // hide ref resolution if necessary
        fieldRefResolution[0].parent.hidden = fieldScaleMode.value === 'none' || !fieldScreenspace.value;

        // reference
        editor.call('attributes:reference:attach', 'screen:scaleMode', fieldScaleMode.parent.innerElement.firstChild.ui);

        // scale blend
        var fieldScaleBlend = editor.call('attributes:addField', {
            parent: panel,
            name: 'Scale Blend',
            type: 'number',
            min: 0,
            max: 1,
            precision: 2,
            step: 0.1,
            link: entities,
            path: 'components.screen.scaleBlend',
            canOverrideTemplate: true
        });

        fieldScaleBlend.style.width = '32px';
        fieldScaleBlend.parent.hidden = fieldScaleMode.value !== 'blend' || ! fieldScreenspace.value;
        events.push(fieldScaleMode.on('change', function (value) {
            fieldScaleBlend.parent.hidden = value !== 'blend' || ! fieldScreenspace.value;
            fieldRefResolution[0].parent.hidden = value === 'none' || !fieldScreenspace.value;
        }));

        var fieldScaleBlendSlider = editor.call('attributes:addField', {
            panel: fieldScaleBlend.parent,
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.screen.scaleBlend'
        });
        fieldScaleBlendSlider.flexGrow = 4;

        // reference
        editor.call('attributes:reference:attach', 'screen:scaleBlend', fieldScaleBlend.parent.innerElement.firstChild.ui);

        // on screenspace change
        events.push(fieldScreenspace.on('change', function (value) {
            fieldResolution[0].parent.hidden = !!value;
            fieldRefResolution[0].parent.hidden = fieldScaleMode.value === 'none' || !value;
            fieldScaleMode.parent.hidden = !value;
            fieldScaleBlend.parent.hidden = !value;
        }));

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });

    });
});
