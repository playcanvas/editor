editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('scene-settings');

    // inspecting
    editor.on('attributes:inspect[sceneSettings]', function() {
        var filteredFields = [];

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
            return sceneSettings.render.fog !== 'none';
        };

        // physics settings
        var physicsPanel = editor.call('attributes:addPanel', {
            name: 'Physics Settings'
        });

        // gravity
        editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Gravity',
            type: 'vec3',
            link: sceneSettings,
            path: 'physics.gravity'
        });

        // render settings
        var renderPanel = editor.call('attributes:addPanel', {
            name: 'Render Settings'
        });

        // global ambient
        editor.call('attributes:addField', {
            parent: renderPanel,
            name: 'Global Ambient',
            type: 'vec3',
            link: sceneSettings,
            path: 'render.global_ambient'
        });

        // fog type
        editor.call('attributes:addField', {
            parent: renderPanel,
            name: 'Fog Type',
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
            parent: renderPanel,
            name: 'Fog Density',
            type: 'number',
            link: sceneSettings,
            path: 'render.fog_density',
        }), fogFilter);

        // fog start
        addFiltered(editor.call('attributes:addField', {
            parent: renderPanel,
            name: 'Fog Start',
            type: 'number',
            link: sceneSettings,
            path: 'render.fog_start'
        }), fogFilter);

        // fog end
        addFiltered(editor.call('attributes:addField', {
            parent: renderPanel,
            name: 'Fog End',
            type: 'number',
            link: sceneSettings,
            path: 'render.fog_end'
        }), fogFilter);

        // fog color
        addFiltered(editor.call('attributes:addField', {
            parent: renderPanel,
            name: 'Fog Color',
            type: 'vec3',
            link: sceneSettings,
            path: 'render.fog_color'
        }), fogFilter);

        // gamma correction
        editor.call('attributes:addField', {
            parent: renderPanel,
            name: 'Gamma Correction',
            type: 'checkbox',
            link: sceneSettings,
            path: 'render.gamma_correction'
        });

        // tonemapping
        editor.call('attributes:addField', {
            parent: renderPanel,
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
            parent: renderPanel,
            name: 'Exposure',
            type: 'number',
            min: 0,
            link: sceneSettings,
            path: 'render.exposure'
        });

        // skybox
        editor.call('attributes:addField', {
            parent: renderPanel,
            name: 'Skybox',
            type: 'number',
            link: sceneSettings,
            path: 'render.skybox'
        });

        filter();

        sceneSettings.on('*:set', filter);
    });
});
