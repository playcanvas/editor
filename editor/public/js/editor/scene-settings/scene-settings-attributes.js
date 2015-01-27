editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');

    // inspecting
    editor.on('attributes:inspect[sceneSettings]', function() {
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
            return sceneSettings.render && sceneSettings.render.fog !== 'none';
        };


        // physics settings
        var physicsPanel = editor.call('attributes:addPanel', {
            name: 'Physics Settings'
        });

        // gravity
        var fieldGravity = editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Gravity',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: sceneSettings,
            path: 'physics.gravity'
        });


        // environment
        var panelEnvironment = editor.call('attributes:addPanel', {
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
            type: 'number',
            link: sceneSettings,
            path: 'render.skybox'
        });


        // camera
        var panelCamera = editor.call('attributes:addPanel', {
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
        editor.call('attributes:addField', {
            parent: panelCamera,
            name: 'Exposure',
            type: 'number',
            min: 0,
            link: sceneSettings,
            path: 'render.exposure'
        });

        // gamma correction
        var fieldGammaCorrection = editor.call('attributes:addField', {
            parent: panelCamera,
            name: ' ',
            type: 'checkbox',
            link: sceneSettings,
            path: 'render.gamma_correction'
        });

        var label = new ui.Label({ text: 'Gamma Correction' });
        label.style.fontSize = '12px';
        fieldGammaCorrection.parent.append(label);
        // fieldGammaCorrection.parent.innerElement.childNodes[0].style.width = 'auto';


        // fog
        var panelFog = editor.call('attributes:addPanel', {
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
            link: sceneSettings,
            path: 'render.fog_density',
        }), fogFilter);

        // fog distance
        var panelFogDistance = editor.call('attributes:addField', {
            parent: panelFog,
            name: 'Distance'
        });
        addFiltered(panelFogDistance, fogFilter);

        var label = panelFogDistance;
        panelFogDistance = panelFogDistance.parent;
        label.destroy();

        var fieldFogStart = new ui.NumberField();
        fieldFogStart.placeholder = 'Start';
        fieldFogStart.style.width = '32px';
        fieldFogStart.flexGrow = 1;
        fieldFogStart.link(sceneSettings, 'render.fog_start');
        panelFogDistance.append(fieldFogStart);

        var fieldFogEnd = new ui.NumberField();
        fieldFogEnd.placeholder = 'End';
        fieldFogEnd.style.width = '32px';
        fieldFogEnd.flexGrow = 1;
        fieldFogEnd.link(sceneSettings, 'render.fog_end');
        panelFogDistance.append(fieldFogEnd);

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
