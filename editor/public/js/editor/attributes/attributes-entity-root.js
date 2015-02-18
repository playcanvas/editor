editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        // not root
        if (entity.get('parent'))
            return;

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        var filteredFields = [ ];

        var addFiltered = function (field, filter) {
            filteredFields.push({
                element: field.length ? field[0].parent : field.parent,
                filter: filter
            });
        };

        var filter = function () {
            filteredFields.forEach(function (f) {
                f.element.hidden = !f.filter();
            });
        };

        var fogFilter = function () {
            return sceneSettings.get('render') && sceneSettings.get('render.fog') !== 'none';
        };


        // physics settings
        var physicsPanel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Physics Settings'
        });

        // gravity
        var fieldGravity = editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Gravity',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: .1,
            type: 'vec3',
            link: sceneSettings,
            path: 'physics.gravity'
        });


        // environment
        var panelEnvironment = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Environment'
        });

        // ambient
        var fieldGlobalAmbient = editor.call('attributes:addField', {
            parent: panelEnvironment,
            name: 'Ambient Color',
            type: 'rgb',
            link: sceneSettings,
            path: 'render.global_ambient'
        });

        // skybox
        editor.call('attributes:addField', {
            parent: panelEnvironment,
            name: 'Skybox',
            type: 'asset',
            kind: 'cubemap',
            link: sceneSettings,
            path: 'render.skybox'
        });


        // camera
        var panelCamera = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Camera'
        });

        // tonemapping
        editor.call('attributes:addField', {
            parent: panelCamera,
            name: 'Tonemapping',
            type: 'number',
            enum: {
                0: 'Linear',
                1: 'Filmic'
            },
            link: sceneSettings,
            path: 'render.tonemapping'
        });

        // exposure
        var fieldExposure = editor.call('attributes:addField', {
            parent: panelCamera,
            name: 'Exposure',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            max: 1024,
            link: sceneSettings,
            path: 'render.exposure'
        });
        fieldExposure.style.width = '32px';

        // exposure slider
        var fieldExposureSlider = new ui.Slider({
            min: 0,
            max: 1024,
            precision: 2
        });
        fieldExposureSlider.flexGrow = 4;
        fieldExposureSlider.link(sceneSettings, 'render.exposure');
        fieldExposure.parent.append(fieldExposureSlider);

        // gamma correction
        var fieldGammaCorrection = editor.call('attributes:addField', {
            parent: panelCamera,
            name: 'Gamma Correction',
            type: 'checkbox',
            link: sceneSettings,
            path: 'render.gamma_correction'
        });
        fieldGammaCorrection.parent.innerElement.childNodes[0].style.width = 'auto';


        // fog
        var panelFog = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Fog'
        });


        // fog type
        editor.call('attributes:addField', {
            parent: panelFog,
            name: 'Type',
            type: 'string',
            enum: {
                'none': 'None',
                'linear': 'Linear',
                'exp': 'Exp',
                'exp2': 'Exp2'
            },
            link: sceneSettings,
            path: 'render.fog'
        });


        // fog density
        addFiltered(editor.call('attributes:addField', {
            parent: panelFog,
            name: 'Density',
            type: 'number',
            precision: 3,
            step: .01,
            min: 0,
            link: sceneSettings,
            path: 'render.fog_density',
        }), fogFilter);


        // fog distance near
        var fieldFogStart = editor.call('attributes:addField', {
            parent: panelFog,
            name: 'Distance',
            placeholder: 'Start',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: sceneSettings,
            path: 'render.fog_start',
        });
        fieldFogStart.style.width = '32px';
        addFiltered(fieldFogStart, fogFilter);


        // fog dinstance far
        var fieldFogEnd = new ui.NumberField({
            precision: 2,
            step: 1,
            min: 0
        });
        fieldFogEnd.placeholder = 'End';
        fieldFogEnd.style.width = '32px';
        fieldFogEnd.flexGrow = 1;
        fieldFogEnd.link(sceneSettings, 'render.fog_end');
        fieldFogStart.parent.append(fieldFogEnd);

        // fog color
        addFiltered(editor.call('attributes:addField', {
            parent: panelFog,
            name: 'Color',
            type: 'rgb',
            link: sceneSettings,
            path: 'render.fog_color'
        }), fogFilter);


        filter();

        // filter fields when scene settings change
        var evtFilter = sceneSettings.on('*:set', filter);

        // clean up filter event when one of the panels is destroyed
        physicsPanel.on('destroy', function () {
            evtFilter.unbind();
        });
    });
});
