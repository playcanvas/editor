editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var projectSettings = editor.call('settings:project');

    editor.method('editorSettings:panel:unfold', function(panel) {
        var element = editor.call('layout.right').innerElement.querySelector('.ui-panel.component.foldable.' + panel);
        if (element && element.ui) {
            element.ui.folded = false;
        }
    });

    var foldStates = {
        'physics': true,
        'rendering': true,
        'lightmapping': true,
        'batchGroups': true,
        'loading': true,
        'audio': true
    };

    editor.on('attributes:inspect[editorSettings]', function() {
        editor.call('attributes:header', 'Settings');

        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

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

        // enable 3d physics
        var fieldPhysics = editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Enable',
            type: 'checkbox',
            link: projectSettings,
            path: 'use3dPhysics'
        });
        editor.call('attributes:reference:attach', 'settings:project:physics', fieldPhysics.parent.innerElement.firstChild.ui);

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

        var fieldVr = editor.call('attributes:addField', {
            parent: panelRendering,
            name: 'Enable VR',
            type: 'checkbox',
            link: projectSettings,
            path: 'vr'
        });
        fieldVr.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:project:vr', fieldVr.parent.innerElement.firstChild.ui);

        filter();

        // filter fields when scene settings change
        var evtFilter = sceneSettings.on('*:set', filter);

        // clean up filter event when one of the panels is destroyed
        physicsPanel.on('destroy', function () {
            evtFilter.unbind();
        });

        if (projectSettings.has('useLegacyAudio')) {

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
                path: 'useLegacyAudio'
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


        // lightmapMode
        var fieldLightmapMode = editor.call('attributes:addField', {
            parent: panelLightmapping,
            name: 'Mode',
            type: 'number',
            enum: {
                0: "Color Only",
                1: "Color and Direction"
            },
            link: sceneSettings,
            path: 'render.lightmapMode'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:lightmapMode', fieldLightmapMode.parent.innerElement.firstChild.ui);


        // batch groups
        var panelBatchGroups = editor.call('attributes:addPanel', {
            name: 'Batch Groups'
        });
        panelBatchGroups.foldable = true;
        panelBatchGroups.folded = foldStates['batchGroups'];
        panelBatchGroups.on('fold', function () { foldStates['batchGroups'] = true; });
        panelBatchGroups.on('unfold', function () { foldStates['batchGroups'] = false; });
        panelBatchGroups.class.add('component', 'batching');

        var batchGroupPanels = {};

        var createBatchGroupPanel = function (group) {
            var groupId = group.id || group.get('id');

            var panelGroup = new ui.Panel(group.name || group.get('name'));
            panelGroup.element.id = 'batchgroup-panel-' + groupId;
            panelGroup.class.add('batch-group');
            panelGroup.foldable = true;
            panelGroup.folded = true;

            // button to remove batch group
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panelGroup.headerElement.appendChild(btnRemove.element);

            // remove batch group and clear entity references
            btnRemove.on('click', function () {
                var oldValue = projectSettings.get('batchGroups.' + groupId);
                var affectedModels = [];
                var affectedElements = [];

                var redo = function () {
                    var settingsHistory = projectSettings.history.enabled;
                    projectSettings.history.enabled = false;
                    projectSettings.unset('batchGroups.' + groupId);
                    projectSettings.history.enabled = settingsHistory;

                    var entities = editor.call('entities:list');
                    for (var i = 0, len = entities.length; i < len; i++) {
                        var entity = entities[i];

                        if (entity.get('components.model.batchGroupId') === groupId) {
                            var history = entity.history.enabled;
                            entity.history.enabled = false;
                            affectedModels.push(entity.get('resource_id'));
                            entity.set('components.model.batchGroupId', -1);
                            entity.history.enabled = history;
                        }

                        if (entity.get('components.element.batchGroupId') === groupId) {
                            var history = entity.history.enabled;
                            entity.history.enabled = false;
                            affectedElements.push(entity.get('resource_id'));
                            entity.set('components.element.batchGroupId', -1);
                            entity.history.enabled = history;
                        }
                    }
                };

                var undo = function () {
                    var settingsHistory = projectSettings.history.enabled;
                    projectSettings.history.enabled = false;
                    projectSettings.set('batchGroups.' + groupId, oldValue);
                    projectSettings.history.enabled = settingsHistory;

                    for (var i = 0, len = affectedModels.length; i < len; i++) {
                        var entity = editor.call('entities:get', affectedModels[i]);
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('components.model.batchGroupId', groupId);
                        entity.history.enabled = history;
                    }
                    affectedModels.length = 0;

                    for (var i = 0, len = affectedElements.length; i < len; i++) {
                        var entity = editor.call('entities:get', affectedElements[i]);
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('components.element.batchGroupId', groupId);
                        entity.history.enabled = history;
                    }
                    affectedElements.length = 0;
                };

                editor.call('history:add', {
                    name: 'projectSettings.batchGroups.' + groupId,
                    undo: undo,
                    redo: redo
                });

                redo();
            });

            // group name
            var fieldName = editor.call('attributes:addField', {
                parent: panelGroup,
                name: 'Name',
                type: 'string'
            });
            fieldName.class.add('field-batchgroup-name');

            fieldName.value = panelGroup.header;

            var suspendEvents = false;
            var evtName = projectSettings.on('batchGroups.' + groupId + '.name:set', function (value) {
                suspendEvents = true;
                fieldName.value = value;
                panelGroup.header = value;
                suspendEvents = false;
            });

            fieldName.on('change', function (value) {
                if (suspendEvents) return;

                if (! value) {
                    fieldName.class.add('error');
                    fieldName.focus();
                    return;
                } else {
                    var batchGroups = projectSettings.get('batchGroups');
                    for (var key in batchGroups) {
                        if (batchGroups[key].name === value) {
                            fieldName.class.add('error');
                            fieldName.focus();
                            return;
                        }
                    }

                    fieldName.class.remove('error');
                    projectSettings.set('batchGroups.' + groupId + '.name', value);
                }
            });

            // dynamic
            var fieldDynamic = editor.call('attributes:addField', {
                parent: panelGroup,
                name: 'Dynamic',
                type: 'checkbox',
                link: projectSettings,
                path: 'batchGroups.' + groupId + '.dynamic'
            });

            // max aabb size
            var fieldMaxAabb = editor.call('attributes:addField', {
                parent: panelGroup,
                name: 'Max AABB',
                type: 'number',
                min: 0,
                link: projectSettings,
                path: 'batchGroups.' + groupId + '.maxAabbSize'
            });

            var prevKey = null;
            var batchGroups = projectSettings.get('batchGroups');
            for (var key in batchGroups) {
                if (parseInt(key, 10) === groupId) {
                    batchGroupPanels[key] = panelGroup;

                    if (prevKey) {
                        panelBatchGroups.appendAfter(panelGroup, batchGroupPanels[prevKey]);
                    } else {
                        panelBatchGroups.prepend(panelGroup);
                    }

                    break;
                } else if (batchGroups[key]) {
                    prevKey = key;
                }
            }

            panelGroup.on('destroy', function () {
                evtName.unbind();
            });
        };

        var removeBatchGroupPanel = function (id) {
            var panel = batchGroupPanels[id];
            if (panel) {
                panel.destroy();
            }

            delete batchGroupPanels[id];
        };

        var evtNewBatchGroup = projectSettings.on('*:set', function (path, value) {
            if (/^batchGroups\.\d+$/.test(path)) {
                if (value) {
                    createBatchGroupPanel(value);
                } else {
                    var parts = path.split('.');
                    removeBatchGroupPanel(parts[parts.length - 1]);
                }
            }
        });

        var evtDeleteBatchGroup = projectSettings.on('*:unset', function (path, value) {
            if (/^batchGroups\.\d+$/.test(path)) {
                removeBatchGroupPanel(value.id);
            }
        });

        panelBatchGroups.on('destroy', function () {
            evtNewBatchGroup.unbind();
            evtDeleteBatchGroup.unbind();
        });

        // existing batch groups
        var batchGroups = projectSettings.get('batchGroups') || {};
        for (var id in batchGroups) {
            createBatchGroupPanel(batchGroups[id]);
        }

        // new batch group button
        var btnAddBatchGroup = new ui.Button({
            text: 'ADD GROUP'
        });
        btnAddBatchGroup.class.add('add-batch-group');
        panelBatchGroups.append(btnAddBatchGroup);
        btnAddBatchGroup.on('click', function () {
            var id = editor.call('editorSettings:batchGroups:create');
            editor.call('editorSettings:batchGroups:focus', id);
        });

        // loading screen
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

            panelButtons.append(btnDefaultScript);

            var tooltipText = 'Create a default loading screen script.';

            if (projectSettings.get('useLegacyScripts')) {
                var repositories = editor.call('repositories');
                // disable create button for non directory repos
                btnDefaultScript.disabled = repositories.get('current') !== 'directory';

                if (btnDefaultScript.disabled) {
                    tooltipText += '<br/><small><em>(Disabled because you are synced to an external code repository)</em></small>';
                }

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

                var setLoadingScreen = function (data) {
                    var loadingScreen = data && data.get ? data.get('filename') : data;
                    projectSettings.set('loadingScreenScript', loadingScreen);
                    fieldScriptPicker.text = loadingScreen ? loadingScreen : 'Select loading screen script';
                    if (loadingScreen) {
                        btnRemove.class.remove('not-visible');
                    } else {
                        btnRemove.class.add('not-visible');
                    }
                };
            } else {

                var setLoadingScreen = function (asset) {
                    if (asset) {
                        if (! asset.get('data.loading'))
                            return;

                        asset.set('preload', false);
                    }

                    projectSettings.set('loadingScreenScript', asset ? asset.get('id') : null);
                    fieldScriptPicker.text = asset ? asset.get('name') : 'Select loading screen script';
                    if (asset) {
                        btnRemove.class.remove('not-visible');
                    } else {
                        btnRemove.class.add('not-visible');
                    }
                };

                btnDefaultScript.on('click', function () {
                    // editor.call('selector:enabled', false);

                    editor.call('picker:script-create', function(filename) {
                        editor.call('assets:create:script', {
                            filename: filename,
                            content: editor.call('sourcefiles:loadingScreen:skeleton'),
                            callback: function (err, asset) {
                                if (err)
                                    return;

                                setLoadingScreen(asset);
                            }
                        });

                    });

                });
            }

            Tooltip.attach({
                target: btnDefaultScript.element,
                html:  tooltipText,
                align: 'right',
                root: root
            });

            var btnSelectScript = new ui.Button({
                text: 'Select existing'
            });
            btnSelectScript.class.add('loading-screen');
            panelButtons.append(btnSelectScript);

            btnSelectScript.on('click', function () {
                var evtPick = editor.once("picker:asset", function (asset) {
                    setLoadingScreen(asset);
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
            fieldScriptPicker.class.add('script-picker');

            fieldScriptPicker.style['font-size'] = '11px';
            fieldScriptPicker.parent.hidden = true;

            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            fieldScriptPicker.parent.append(btnRemove);
            btnRemove.on("click", function () {
                setLoadingScreen(null);
            });


            var onLoadingScreen = function (loadingScreen) {
                var text;
                var missing = false;
                if (projectSettings.get('useLegacyScripts')) {
                    text = loadingScreen;
                } else if (loadingScreen) {
                    var asset = editor.call('assets:get', loadingScreen);
                    if (asset) {
                        text = asset.get('name');
                    } else {
                        missing = true;
                        text = 'Missing';
                    }
                }

                if (text) {
                    fieldScriptPicker.text = text;
                    fieldScriptPicker.parent.hidden = false;
                    panelButtons.hidden = true;
                } else {
                    fieldScriptPicker.parent.hidden = true;
                    panelButtons.hidden = false;
                }

                if (missing) {
                    fieldScriptPicker.class.add('error');
                } else {
                    fieldScriptPicker.class.remove('error');
                }
            };

            var evtLoadingScreen = projectSettings.on('loadingScreenScript:set', onLoadingScreen);

            panelLoadingScreen.on('destroy', function () {
                evtLoadingScreen.unbind();
            });

            onLoadingScreen(projectSettings.get('loadingScreenScript'));

            fieldScriptPicker.on('click', function () {
                var evtPick = editor.once("picker:asset", function (asset) {
                    setLoadingScreen(asset);
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
                    if (type === 'asset.script' && rectB.top > rectA.top && rectB.bottom < rectA.bottom) {

                        if (projectSettings.get('useLegacyScripts')) {
                            return data.filename !== fieldScriptPicker.text;
                        } else {
                            var asset = editor.call('assets:get', data.id);
                            return asset && asset.get('data.loading');
                        }
                    }

                    return false;
                },
                drop: function(type, data) {
                    if (type !== 'asset.script')
                        return;

                    if (projectSettings.get('useLegacyScripts')) {
                        setLoadingScreen(data.filename);
                    } else {
                        var asset = editor.call('assets:get', data.id);
                        if (asset && asset.get('data.loading'))
                            setLoadingScreen(asset);
                    }
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
    });

    editor.method('editorSettings:batchGroups:create', function () {
        var batchGroups = projectSettings.get('batchGroups');

        // calculate id of new group and new name
        var id = 100000;
        for (var key in batchGroups) {
            id = Math.max(parseInt(key, 10) + 1, id);
        }

        projectSettings.set('batchGroups.' + id, {
            id: id,
            name: 'New Batch Group',
            maxAabbSize: 100,
            dynamic: true
        });

        return id;
    });

    editor.method('editorSettings:batchGroups:focus', function (groupId) {
        var element = document.getElementById('batchgroup-panel-' + groupId);
        if (! element) return;

        editor.call('editorSettings:panel:unfold', 'batching');
        element.ui.folded = false;
        element.querySelector('.field-batchgroup-name > input').focus();
    });
});
