editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var projectSettings = editor.call('settings:project');

    var folded = true;

    editor.on('attributes:inspect[editorSettings]', function() {
        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        var filteredFields = [ ];

        var addFiltered = function (field, filter) {
            filteredFields.push({
                element: field.length ? field[0].parent : field.parent,
                filter: filter
            });
            return field;
        };

        var filter = function () {
            filteredFields.forEach(function (f) {
                f.element.hidden = !f.filter();
            });
        };

        // environment
        var panelRendering = editor.call('attributes:addPanel', {
            name: 'Rendering'
        });
        panelRendering.foldable = true;
        panelRendering.folded = folded;
        panelRendering.on('fold', function() { folded = true; });
        panelRendering.on('unfold', function() { folded = false; });
        panelRendering.class.add('component', 'rendering');

        // ambient
        var fieldGlobalAmbient = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Ambient Color',
            type: 'rgb',
            link: sceneSettings,
            path: 'render.global_ambient'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:ambientColor', fieldGlobalAmbient.parent.innerElement.firstChild.ui);


        // skyboxHover
        var skyboxOld = null;
        var hoverSkybox = null;
        var setSkybox = function() {
            if (! hoverSkybox)
                return;

            app.scene.setSkybox(hoverSkybox.resources);
            editor.call('viewport:render');
        };

        // skybox
        var fieldSkybox = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Skybox',
            type: 'asset',
            kind: 'cubemap',
            link: sceneSettings,
            path: 'render.skybox',
            over: function(type, data) {
                skyboxOld = app.assets.get(sceneSettings.get('render.skybox')) || null;

                hoverSkybox = app.assets.get(parseInt(data.id, 10));
                if (hoverSkybox) {
                    if (sceneSettings.get('render.skyboxMip') === 0)
                        hoverSkybox.loadFaces = true;

                    app.assets.load(hoverSkybox);
                    hoverSkybox.on('load', setSkybox);
                    setSkybox();
                }
            },
            leave: function() {
                if (skyboxOld) {
                    app.scene.setSkybox(skyboxOld.resources)
                    skyboxOld = null;
                    editor.call('viewport:render');
                }
                if (hoverSkybox) {
                    hoverSkybox.off('load', setSkybox);
                    hoverSkybox = null;
                }
            }
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:skybox', fieldSkybox._label);


        // skyboxIntensity
        var fieldSkyboxIntensity = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Intensity',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            link: sceneSettings,
            path: 'render.skyboxIntensity'
        });
        fieldSkyboxIntensity.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'settings:skyboxIntensity', fieldSkyboxIntensity.parent.innerElement.firstChild.ui);

        // skyboxIntensity slider
        var fieldExposureSlider = new ui.Slider({
            min: 0,
            max: 8,
            precision: 3
        });
        fieldExposureSlider.flexGrow = 4;
        fieldExposureSlider.link(sceneSettings, 'render.skyboxIntensity');
        fieldSkyboxIntensity.parent.append(fieldExposureSlider);


        // skyboxMip
        var fieldSkyboxMip = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Mip',
            type: 'number',
            enum: {
                0: '1',
                1: '2',
                2: '3',
                3: '4',
                4: '5'
            },
            link: sceneSettings,
            path: 'render.skyboxMip'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:skyboxMip', fieldSkyboxMip.parent.innerElement.firstChild.ui);


        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panelRendering.append(divider);


        // tonemapping
        var fieldTonemapping = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Tonemapping',
            type: 'number',
            enum: {
                0: 'Linear',
                1: 'Filmic',
                2: 'Hejl',
                3: 'ACES'
            },
            link: sceneSettings,
            path: 'render.tonemapping'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:toneMapping', fieldTonemapping.parent.innerElement.firstChild.ui);


        // exposure
        var fieldExposure = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Exposure',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: sceneSettings,
            path: 'render.exposure'
        });
        fieldExposure.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'settings:exposure', fieldExposure.parent.innerElement.firstChild.ui);


        // exposure slider
        var fieldExposureSlider = new ui.Slider({
            min: 0,
            max: 8,
            precision: 2
        });
        fieldExposureSlider.flexGrow = 4;
        fieldExposureSlider.link(sceneSettings, 'render.exposure');
        fieldExposure.parent.append(fieldExposureSlider);


        // gamma correction
        var fieldGammaCorrection = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Gamma',
            type: 'number',
            enum: {
                0: '1.0',
                1: '2.2'
            },
            link: sceneSettings,
            path: 'render.gamma_correction'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:gammaCorrection', fieldGammaCorrection.parent.innerElement.firstChild.ui);


        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panelRendering.append(divider);


        // fog type
        var fieldFogType = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Fog',
            type: 'string',
            enum: {
                'none': 'None',
                'linear': 'Linear',
                'exp': 'Exponential',
                'exp2': 'Exponential Squared'
            },
            link: sceneSettings,
            path: 'render.fog'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:fog', fieldFogType.parent.innerElement.firstChild.ui);


        // fog density
        var fieldFogDensity = addFiltered(editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Density',
            type: 'number',
            precision: 3,
            step: .01,
            min: 0,
            link: sceneSettings,
            path: 'render.fog_density'
        }), function () {
            return /^exp/.test(sceneSettings.get('render.fog'));
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:fogDensity', fieldFogDensity.parent.innerElement.firstChild.ui);


        // fog distance near
        var fieldFogDistance = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Distance',
            placeholder: 'Start',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: sceneSettings,
            path: 'render.fog_start'
        });
        fieldFogDistance.style.width = '32px';
        addFiltered(fieldFogDistance, function () {
            return sceneSettings.get('render.fog') === 'linear';
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:fogDistance', fieldFogDistance.parent.innerElement.firstChild.ui);


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
        fieldFogDistance.parent.append(fieldFogEnd);

        // fog color
        var fieldFogColor = addFiltered(editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Color',
            type: 'rgb',
            link: sceneSettings,
            path: 'render.fog_color'
        }), function () {
            return sceneSettings.get('render.fog') !== 'none';
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:fogColor', fieldFogColor.parent.innerElement.firstChild.ui);

        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panelRendering.append(divider);

        // Resolution related
        var fieldWidth = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Resolution',
            placeholder: 'w',
            type: 'number',
            link: projectSettings,
            path: 'width',
            precision: 0,
            min: 1
        });

        editor.call('attributes:reference:attach', 'settings:project:width', fieldWidth);

        var fieldHeight = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            placeholder: 'h',
            type: 'number',
            link: projectSettings,
            path: 'height',
            precision: 0,
            min: 1
        });
        editor.call('attributes:reference:attach', 'settings:project:height', fieldHeight);

        var fieldResolutionMode = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            type: 'string',
            enum: {
                'FIXED': 'Fixed',
                'AUTO': 'Auto'
            },
            link: projectSettings,
            path: 'resolutionMode'
        });
        editor.call('attributes:reference:attach', 'settings:project:resolutionMode', fieldResolutionMode);


        var fieldFillMode = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Fill mode',
            type: 'string',
            enum: {
                'NONE': 'None',
                'KEEP_ASPECT': 'Keep aspect ratio',
                'FILL_WINDOW': 'Fill window',
            },
            link: projectSettings,
            path: 'fillMode'
        });
        editor.call('attributes:reference:attach', 'settings:project:fillMode', fieldFillMode.parent.innerElement.firstChild.ui);


        var fieldPreferWebGl2 = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Prefer WebGL 2.0',
            type: 'checkbox',
            link: projectSettings,
            path: 'preferWebGl2'
        });
        fieldPreferWebGl2.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:preferWebGl2', fieldPreferWebGl2.parent.innerElement.firstChild.ui);


        var fieldAntiAlias = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Anti-Alias',
            type: 'checkbox',
            link: projectSettings,
            path: 'antiAlias'
        });
        fieldAntiAlias.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:antiAlias', fieldAntiAlias.parent.innerElement.firstChild.ui);

        var fieldPixelRatio = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Device Pixel Ratio',
            type: 'checkbox',
            link: projectSettings,
            path: 'useDevicePixelRatio'
        });
        fieldPixelRatio.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:pixelRatio', fieldPixelRatio.parent.innerElement.firstChild.ui);


        var fieldTransparentCanvas = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Transparent Canvas',
            type: 'checkbox',
            link: projectSettings,
            path: 'transparentCanvas'
        });
        fieldTransparentCanvas.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:transparentCanvas', fieldTransparentCanvas.parent.innerElement.firstChild.ui);

        var fieldPreserveDrawingBuffer = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Preserve Drawing Buffer',
            type: 'checkbox',
            link: projectSettings,
            path: 'preserveDrawingBuffer'
        });
        fieldPreserveDrawingBuffer.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:preserveDrawingBuffer', fieldPreserveDrawingBuffer.parent.innerElement.firstChild.ui);

        filter();

        // filter fields when scene settings change
        var evtFilter = sceneSettings.on('*:set', filter);

        // clean up filter event when one of the panels is destroyed
        panelRendering.on('destroy', function () {
            evtFilter.unbind();
        });

    });
});
