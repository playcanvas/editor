editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');

    editor.on('attributes:inspect[designerSettings]', function() {
        editor.call('attributes:header', 'Settings');

        var app = editor.call('viewport:framework');
        var root = editor.call('layout.root');

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

        var fogFilter = function () {
            return sceneSettings.get('render') && sceneSettings.get('render.fog') !== 'none';
        };


        // physics settings
        var physicsPanel = editor.call('attributes:addPanel', {
            name: 'Physics Settings'
        });
        physicsPanel.class.add('component');

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
        // reference
        editor.call('attributes:reference:settings:gravity:attach', fieldGravity[0].parent.innerElement.firstChild.ui);


        // environment
        var panelEnvironment = editor.call('attributes:addPanel', {
            name: 'Environment'
        });
        panelEnvironment.class.add('component');


        // ambient
        var fieldGlobalAmbient = editor.call('attributes:addField', {
            parent: panelEnvironment,
            name: 'Ambient Color',
            type: 'rgb',
            link: sceneSettings,
            path: 'render.global_ambient'
        });
        // reference
        editor.call('attributes:reference:settings:ambientColor:attach', fieldGlobalAmbient.parent.innerElement.firstChild.ui);


        // skyboxHover
        var skyboxOld = null;
        var hoverSkybox = null;
        var setSkybox = function() {
            if (! hoverSkybox)
                return;

            app.scene.setSkybox(hoverSkybox.resources);
            editor.call('viewport:render');
        }
        // skybox
        var fieldSkybox = editor.call('attributes:addField', {
            parent: panelEnvironment,
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
        editor.call('attributes:reference:settings:skybox:attach', fieldSkybox._label);


        // skyboxIntensity
        var fieldSkyboxIntensity = editor.call('attributes:addField', {
            parent: panelEnvironment,
            name: 'Intensity',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 32,
            link: sceneSettings,
            path: 'render.skyboxIntensity'
        });
        fieldSkyboxIntensity.style.width = '32px';
        // reference
        editor.call('attributes:reference:settings:skyboxIntensity:attach', fieldSkyboxIntensity.parent.innerElement.firstChild.ui);

        // skyboxIntensity slider
        var fieldExposureSlider = new ui.Slider({
            min: 0,
            max: 32,
            precision: 3
        });
        fieldExposureSlider.flexGrow = 4;
        fieldExposureSlider.link(sceneSettings, 'render.skyboxIntensity');
        fieldSkyboxIntensity.parent.append(fieldExposureSlider);


        // skyboxMip
        var fieldSkyboxIntensity = editor.call('attributes:addField', {
            parent: panelEnvironment,
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
        editor.call('attributes:reference:settings:skyboxMip:attach', fieldSkyboxIntensity.parent.innerElement.firstChild.ui);


        // camera
        var panelCamera = editor.call('attributes:addPanel', {
            name: 'Camera'
        });
        panelCamera.class.add('component');


        // tonemapping
        var fieldTonemapping = editor.call('attributes:addField', {
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
        // reference
        editor.call('attributes:reference:settings:toneMapping:attach', fieldTonemapping.parent.innerElement.firstChild.ui);


        // exposure
        var fieldExposure = editor.call('attributes:addField', {
            parent: panelCamera,
            name: 'Exposure',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            max: 32,
            link: sceneSettings,
            path: 'render.exposure'
        });
        fieldExposure.style.width = '32px';
        // reference
        editor.call('attributes:reference:settings:exposure:attach', fieldExposure.parent.innerElement.firstChild.ui);


        // exposure slider
        var fieldExposureSlider = new ui.Slider({
            min: 0,
            max: 32,
            precision: 2
        });
        fieldExposureSlider.flexGrow = 4;
        fieldExposureSlider.link(sceneSettings, 'render.exposure');
        fieldExposure.parent.append(fieldExposureSlider);


        // gamma correction
        var fieldGammaCorrection = editor.call('attributes:addField', {
            parent: panelCamera,
            name: 'Gamma',
            type: 'number',
            enum: {
                0: '1.0',
                1: '2.2',
                2: '2.2 Fast'
            },
            link: sceneSettings,
            path: 'render.gamma_correction'
        });
        // reference
        editor.call('attributes:reference:settings:gammaCorrection:attach', fieldGammaCorrection.parent.innerElement.firstChild.ui);


        // fog
        var panelFog = editor.call('attributes:addPanel', {
            name: 'Fog'
        });
        panelFog.class.add('component');


        // fog type
        var fieldFogType = editor.call('attributes:addField', {
            parent: panelFog,
            name: 'Type',
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
        editor.call('attributes:reference:settings:fog:attach', fieldFogType.parent.innerElement.firstChild.ui);


        // fog density
        var fieldFogDensity = addFiltered(editor.call('attributes:addField', {
            parent: panelFog,
            name: 'Density',
            type: 'number',
            precision: 3,
            step: .01,
            min: 0,
            link: sceneSettings,
            path: 'render.fog_density',
        }), fogFilter);
        // reference
        editor.call('attributes:reference:settings:fogDensity:attach', fieldFogDensity.parent.innerElement.firstChild.ui);


        // fog distance near
        var fieldFogDistance = editor.call('attributes:addField', {
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
        fieldFogDistance.style.width = '32px';
        addFiltered(fieldFogDistance, fogFilter);
        // reference
        editor.call('attributes:reference:settings:fogDistance:attach', fieldFogDistance.parent.innerElement.firstChild.ui);


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
            parent: panelFog,
            name: 'Color',
            type: 'rgb',
            link: sceneSettings,
            path: 'render.fog_color'
        }), fogFilter);
        // reference
        editor.call('attributes:reference:settings:fogColor:attach', fieldFogColor.parent.innerElement.firstChild.ui);


        filter();

        // filter fields when scene settings change
        var evtFilter = sceneSettings.on('*:set', filter);

        // clean up filter event when one of the panels is destroyed
        physicsPanel.on('destroy', function () {
            evtFilter.unbind();
        });


        // custom loading screen script
        if (config.owner.superUser || config.owner.plan.type === 'org') {
            // loading screen
            var panelLoadingScreen = editor.call('attributes:addPanel', {
                name: 'Loading Screen'
            });
            panelLoadingScreen.class.add('component', 'loading-screen');

            var fieldScriptPicker = editor.call('attributes:addField', {
                parent: panelLoadingScreen,
                name: 'Script',
                type: 'button'
            });

            fieldScriptPicker.style['font-size'] = '11px';

            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            fieldScriptPicker.parent.append(btnRemove);
            btnRemove.on("click", function () {
                editor.call('project:setLoadingScreenScript', null);
                fieldScriptPicker.text = "Click to select script";
                btnRemove.class.add('not-visible');
            });

            editor.call('project:getLoadingScreenScript', function (value) {
                if (value) {
                    fieldScriptPicker.text = value;
                } else {
                    fieldScriptPicker.text = "Click to select script";
                    btnRemove.class.add('not-visible');
                }
            });

            var setLoadingScreen = function (filename) {
                editor.call('project:setLoadingScreenScript', filename);
                fieldScriptPicker.text = filename;
                btnRemove.class.remove('not-visible');
            };

            fieldScriptPicker.on('click', function () {
                var evtPick = editor.once("picker:asset", function (asset) {
                    setLoadingScreen(asset.get('filename'));
                    evtPick = null;
                });

                // show asset picker
                editor.call("picker:asset", "script", null);

                editor.once('picker:asset:close', function () {
                    if (evtPick) {
                        evtPick.unbind();
                        evtPick = null;
                    }
                });
            });

            // reference
            editor.call('attributes:reference:settings:loadingScreenScript:attach', fieldScriptPicker.parent.innerElement.firstChild.ui);

            // drag drop
            var dropRef = editor.call('drop:target', {
                ref: panelLoadingScreen.element,
                filter: function(type, data) {
                    var rectA = root.innerElement.getBoundingClientRect();
                    var rectB = panelLoadingScreen.element.getBoundingClientRect();
                    return type === 'asset.script' && data.filename !== fieldScriptPicker.text && rectB.top > rectA.top && rectB.bottom < rectA.bottom;
                },
                drop: function(type, data) {
                    if (type !== 'asset.script')
                        return;

                    setLoadingScreen(data.filename);
                }
            });

        }

    });
});
