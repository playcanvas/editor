editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var projectSettings = editor.call('project:settings');

    editor.method('designerSettings:panel:unfold', function(panel) {
        var element = editor.call('layout.right').innerElement.querySelector('.ui-panel.component.foldable.' + panel);
        if (element && element.ui)
            element.ui.folded = false;
    });

    var foldStates = {
        'physics': true,
        'rendering': true,
        'lightmapping': true,
        'loading': true,
        'audio': true
    };

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


        // physics
        var physicsPanel = editor.call('attributes:addPanel', {
            name: 'Physics'
        });
        physicsPanel.foldable = true;
        physicsPanel.folded = foldStates['physics'];
        physicsPanel.on('fold', function() { foldStates['physics'] = true; });
        physicsPanel.on('unfold', function() { foldStates['physics'] = false; });
        physicsPanel.class.add('component');

        var projectSettings = editor.call('project:settings');

        // enable 3d physics
        var fieldPhysics = editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Enable',
            type: 'checkbox'
        });
        editor.call('attributes:reference:attach', 'settings:project:physics', fieldPhysics.parent.innerElement.firstChild.ui);

        var changing = false;
        fieldPhysics.value = projectSettings.get('libraries').indexOf('physics-engine-3d') !== -1;
        fieldPhysics.on('change', function (value) {
            if (changing) return;
            changing = true;
            if (value) {
                projectSettings.set('libraries', ['physics-engine-3d']);
            } else {
                projectSettings.set('libraries', []);
            }
            changing = false;
        });

        var evtPhysicsChange = projectSettings.on('*:set', function (path, value, oldValue) {
            if (path === 'libraries') {
                if (changing) return;
                changing = true;
                fieldPhysics.value = value.indexOf('physics-engine-3d') !== -1;
                changing = false;
            }
        });

        physicsPanel.on('destroy', function () {
            evtPhysicsChange.unbind();
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
        // reference
        editor.call('attributes:reference:attach', 'settings:gravity', fieldGravity[0].parent.innerElement.firstChild.ui);


        // environment
        var panelRendering = editor.call('attributes:addPanel', {
            name: 'Rendering'
        });
        panelRendering.foldable = true;
        panelRendering.folded = foldStates['rendering'];
        panelRendering.on('fold', function() { foldStates['rendering'] = true; });
        panelRendering.on('unfold', function() { foldStates['rendering'] = false; });
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
        }
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
            max: 32,
            link: sceneSettings,
            path: 'render.skyboxIntensity'
        });
        fieldSkyboxIntensity.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'settings:skyboxIntensity', fieldSkyboxIntensity.parent.innerElement.firstChild.ui);

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
                1: 'Filmic'
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
            max: 32,
            link: sceneSettings,
            path: 'render.exposure'
        });
        fieldExposure.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'settings:exposure', fieldExposure.parent.innerElement.firstChild.ui);


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
            parent: panelRendering,
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
            path: 'resolution_mode'
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
            path: 'fill_mode'
        });
        editor.call('attributes:reference:attach', 'settings:project:fillMode', fieldFillMode.parent.innerElement.firstChild.ui);

        var fieldPixelRatio = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Device Pixel Ratio',
            type: 'checkbox',
            link: projectSettings,
            path: 'use_device_pixel_ratio'
        });
        fieldPixelRatio.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:pixelRatio', fieldPixelRatio.parent.innerElement.firstChild.ui);


        var fieldTransparentCanvas = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Transparent Canvas',
            type: 'checkbox',
            link: projectSettings,
            path: 'transparent_canvas'
        });
        fieldTransparentCanvas.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:transparentCanvas', fieldTransparentCanvas.parent.innerElement.firstChild.ui);

        // value not migrated so show it as 'true' by default
        if (! projectSettings.has('transparent_canvas')) {
            projectSettings.sync = false;
            projectSettings.history = false;
            projectSettings.set('transparent_canvas', true);
            projectSettings.sync = true;
            projectSettings.history = true;
        }

        var fieldPreserveDrawingBuffer = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Preserve Drawing Buffer',
            type: 'checkbox',
            link: projectSettings,
            path: 'preserve_drawing_buffer'
        });
        fieldPreserveDrawingBuffer.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:preserveDrawingBuffer', fieldPreserveDrawingBuffer.parent.innerElement.firstChild.ui);

        filter();

        // filter fields when scene settings change
        var evtFilter = sceneSettings.on('*:set', filter);

        // clean up filter event when one of the panels is destroyed
        physicsPanel.on('destroy', function () {
            evtFilter.unbind();
        });

        if (projectSettings.has('use_legacy_audio')) {

            var panelAudio = editor.call('attributes:addPanel', {
                name: 'Audio'
            });
            panelAudio.foldable = true;
            panelAudio.folded = foldStates['audio'];
            panelAudio.on('fold', function() { foldStates['audio'] = true; });
            panelAudio.on('unfold', function() { foldStates['audio'] = false; });
            panelAudio.class.add('component', 'audio');

            var fieldLegacyAudio = editor.call('attributes:addField', {
                parent: panelAudio,
                name: 'Use Legacy Audio',
                type: 'checkbox',
                link: projectSettings,
                path: 'use_legacy_audio'
            });
            fieldLegacyAudio.parent.innerElement.firstChild.style.width = 'auto';
            editor.call('attributes:reference:attach', 'settings:project:useLegacyAudio', fieldLegacyAudio.parent.innerElement.firstChild.ui);
        }



        // lightmapping
        var panelLightmapping = editor.call('attributes:addPanel', {
            name: 'Lightmapping'
        });
        panelLightmapping.foldable = true;
        panelLightmapping.folded = foldStates['lightmapping'];
        panelLightmapping.on('fold', function() { foldStates['lightmapping'] = true; });
        panelLightmapping.on('unfold', function() { foldStates['lightmapping'] = false; });
        panelLightmapping.class.add('component', 'lightmapping');

        // lightmapSizeMultiplier
        var fieldLightmapSizeMultiplier = editor.call('attributes:addField', {
            parent: panelLightmapping,
            name: 'Size Multiplier',
            type: 'number',
            min: 0,
            link: sceneSettings,
            path: 'render.lightmapSizeMultiplier'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:lightmapSizeMultiplier', fieldLightmapSizeMultiplier.parent.innerElement.firstChild.ui);

        // lightmapMaxResolution
        var fieldLightmapMaxResolution = editor.call('attributes:addField', {
            parent: panelLightmapping,
            name: 'Max Resolution',
            type: 'number',
            min: 2,
            link: sceneSettings,
            path: 'render.lightmapMaxResolution'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:lightmapMaxResolution', fieldLightmapMaxResolution.parent.innerElement.firstChild.ui);



        // loading screen
        if (projectSettings.get('use_legacy_scripts')) {
            var panelLoadingScreen = editor.call('attributes:addPanel', {
                name: 'Loading Screen'
            });
            panelLoadingScreen.foldable = true;
            panelLoadingScreen.folded = foldStates['loading'];
            panelLoadingScreen.on('fold', function() { foldStates['loading'] = true; });
            panelLoadingScreen.on('unfold', function() { foldStates['loading'] = false; });
            panelLoadingScreen.class.add('component', 'loading-screen');

            // custom loading screen script
            if (editor.call("users:isSuperUser") || config.owner.plan.type === 'org' || config.owner.plan.type === 'organization') {
                var panelButtons = new ui.Panel();
                panelButtons.class.add('flex', 'component');
                panelLoadingScreen.append(panelButtons);

                var btnDefaultScript = new ui.Button({
                    text: 'Create default'
                });
                btnDefaultScript.class.add('add');
                btnDefaultScript.class.add('loading-screen');

                var repositories = editor.call('repositories');
                // disable create button for non directory repos
                btnDefaultScript.disabled = repositories.get('current') !== 'directory';

                panelButtons.append(btnDefaultScript);

                var tooltipText = 'Create a default loading screen script.';
                if (btnDefaultScript.disabled) {
                    tooltipText += '<br/><small><em>(Disabled because you are synced to an external code repository)</em></small>';
                }
                Tooltip.attach({
                    target: btnDefaultScript.element,
                    html:  tooltipText,
                    align: 'right',
                    root: root
                });

                btnDefaultScript.on('click', function () {
                    editor.call('selector:enabled', false);
                    editor.call('sourcefiles:new', editor.call('sourcefiles:loadingScreen:skeleton'));
                    var evtNew = editor.once('sourcefiles:add', function (file) {
                        setLoadingScreen(file.get('filename'));
                        evtNew = null;
                    });

                    editor.once('sourcefiles:new:close', function () {
                        editor.call('selector:enabled', true);
                        if (evtNew) {
                            evtNew.unbind();
                            evtNew = null;
                        }
                    });
                });

                var btnSelectScript = new ui.Button({
                    text: 'Select existing'
                });
                btnSelectScript.class.add('loading-screen');
                panelButtons.append(btnSelectScript);

                btnSelectScript.on('click', function () {
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

                Tooltip.attach({
                    target: btnSelectScript.element,
                    text: 'Select an existing loading screen script',
                    align: 'bottom',
                    root: root
                });

                var fieldScriptPicker = editor.call('attributes:addField', {
                    parent: panelLoadingScreen,
                    name: 'Script',
                    type: 'button'
                });

                fieldScriptPicker.style['font-size'] = '11px';
                fieldScriptPicker.parent.hidden = true;

                var btnRemove = new ui.Button();
                btnRemove.class.add('remove');
                fieldScriptPicker.parent.append(btnRemove);
                btnRemove.on("click", function () {
                    setLoadingScreen(null);
                });

                var setLoadingScreen = function (filename) {
                    projectSettings.set('loading_screen_script', filename);
                    fieldScriptPicker.text = filename ? filename : 'Select loading screen script';
                    if (filename) {
                        btnRemove.class.remove('not-visible');
                    } else {
                        btnRemove.class.add('not-visible');
                    }
                };

                var onLoadingScreen = function (filename) {
                    if (filename) {
                        fieldScriptPicker.text = filename;
                        fieldScriptPicker.parent.hidden = false;
                        panelButtons.hidden = true;
                    } else {
                        fieldScriptPicker.parent.hidden = true;
                        panelButtons.hidden = false;
                    }
                };

                var evtLoadingScreen = projectSettings.on('loading_screen_script:set', onLoadingScreen);

                panelLoadingScreen.on('destroy', function () {
                    evtLoadingScreen.unbind();
                });

                onLoadingScreen(projectSettings.get('loading_screen_script'));

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
                editor.call('attributes:reference:attach', 'settings:loadingScreenScript', fieldScriptPicker.parent.innerElement.firstChild.ui);

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

            } else {
                var labelUpgrade = new ui.Label({
                    text: 'This is an ORGANIZATION account feature. <a href="/upgrade?plan=organization&account=' + config.owner.username + '" target="_blank">UPGRADE</a> to create custom loading screens.'
                });
                labelUpgrade.style.fontSize = '12px';
                labelUpgrade.style.color = '#fff';
                panelLoadingScreen.append(labelUpgrade);
            }
        }
    });
});
