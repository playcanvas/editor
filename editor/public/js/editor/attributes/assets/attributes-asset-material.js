editor.once('load', function () {
    'use strict';

    var mappingMaps = [
        'diffuse',
        'specular',
        'emissive',
        'normal',
        'metalness',
        'gloss',
        'opacity',
        'height',
        'ao',
        'light'
    ];

    var panelsStates = {};
    var panelsStatesDependencies = {
        'offset': ['diffuseMapOffset', 'diffuseMapTiling'],
        'ao': ['aoMap'],
        'diffuse': ['diffuseMap'],
        'specular': ['specularMap', 'metalnessMap', 'glossMap'],
        'emissive': ['emissiveMap'],
        'opacity': ['opacityMap'],
        'normals': ['normalMap'],
        'height': ['heightMap'],
        'environment': ['sphereMap', 'cubeMap'],
        'light': ['lightMap'],
        'states': []
    };

    var currentPreviewModel = 'sphere';

    // Contains paths in this form: id.data.property
    // Holds material properties that are not in the db.
    // Used to set initial values for offsets and tilings
    // to avoid sharedb errors.
    var missingPaths = {};

    editor.method('material:rememberMissingFields', function (asset) {
        // check missing tilings / offsets
        mappingMaps.forEach(function (map) {
            var path = 'data.' + map + 'MapTiling';
            if (asset.get(path) === null)
                missingPaths[asset.get('id') + '.' + path] = true;

            path = 'data.' + map + 'MapOffset';
            if (asset.get(path) === null)
                missingPaths[asset.get('id') + '.' + path] = true;
        });
    });

    editor.on('attributes:inspect[asset]', function (assets) {
        var i, key;
        for (i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'material') {
                return;
            }
        }

        var app = editor.call('viewport:app');
        if (!app) return; // webgl not available

        if (assets.length > 1) {
            editor.call('attributes:header', assets.length + ' Materials');
        }

        var root = editor.call('attributes.rootPanel');

        var ids = [];

        for (i = 0; i < assets.length; i++) {
            ids.push(assets[i].get('id'));
        }

        ids = ids.sort(function (a, b) {
            return a - b;
        }).join(',');

        var panelState = panelsStates[ids];
        var panelStateNew = false;

        if (!panelState) {
            panelStateNew = true;
            panelState = panelsStates[ids] = {};

            for (key in panelsStatesDependencies) {
                var fields = panelsStatesDependencies[key];
                panelState[key] = true;

                for (var n = 0; n < fields.length; n++) {
                    var type = editor.call('schema:material:getType', fields[n]);
                    switch (type) {
                        case 'vec2':
                            for (i = 0; i < assets.length; i++) {
                                var value = assets[i].get('data.' + fields[n]);
                                var defaultValue = editor.call('schema:material:getDefaultValueForField', fields[n]);
                                if (value && value[0] !== defaultValue[0] || value && value[1] !== defaultValue[1]) {
                                    panelState[key] = false;
                                    break;
                                }
                            }
                            break;
                        case 'asset':
                            for (i = 0; i < assets.length; i++) {
                                if (assets[i].get('data.' + fields[n])) {
                                    panelState[key] = false;
                                    break;
                                }
                            }
                            break;
                    }
                }
            }
        }

        var previewTexturesHover = null;

        // preview
        if (assets.length === 1) {
            previewTexturesHover = {};

            var previewContainer = new pcui.Container();
            previewContainer.class.add('asset-preview-container');

            var preview = document.createElement('canvas');
            var ctx = preview.getContext('2d');
            preview.width = 256;
            preview.height = 256;
            preview.classList.add('asset-preview', 'flipY');
            previewContainer.append(preview);

            var modelSphere = new ui.Button({
                text: '&#58121;'
            });
            modelSphere.class.add('sphere');
            if (currentPreviewModel === 'sphere')
                modelSphere.class.add('active');
            previewContainer.append(modelSphere.element);
            modelSphere.parent = panelParams;

            modelSphere.on('click', function () {
                if (currentPreviewModel === 'sphere')
                    return;

                currentPreviewModel = 'sphere';
                modelBox.class.remove('active');
                modelSphere.class.add('active');

                queueRender();
            });

            var modelBox = new ui.Button({
                text: '&#57735;'
            });
            modelBox.class.add('box');
            if (currentPreviewModel === 'box')
                modelBox.class.add('active');
            previewContainer.append(modelBox.element);
            modelBox.parent = panelParams;

            modelBox.on('click', function () {
                if (currentPreviewModel === 'box')
                    return;

                currentPreviewModel = 'box';
                modelSphere.class.remove('active');
                modelBox.class.add('active');

                queueRender();
            });

            var sx = 0, sy = 0, x = 0, y = 0, nx = 0, ny = 0;
            var dragging = false;
            var previewRotation = [0, 0];

            preview.addEventListener('mousedown', function (evt) {
                if (evt.button !== 0)
                    return;

                evt.preventDefault();
                evt.stopPropagation();

                sx = x = evt.clientX;
                sy = y = evt.clientY;

                dragging = true;
            }, false);

            var onMouseMove = function (evt) {
                if (!dragging)
                    return;

                nx = x - evt.clientX;
                ny = y - evt.clientY;
                x = evt.clientX;
                y = evt.clientY;

                queueRender();
            };

            var onMouseUp = function (evt) {
                if (!dragging)
                    return;

                if ((Math.abs(sx - x) + Math.abs(sy - y)) < 8) {
                    if (root.class.contains('large')) {
                        root.class.remove('large');
                    } else {
                        root.class.add('large');
                    }
                }

                previewRotation[0] = Math.max(-90, Math.min(90, previewRotation[0] + ((sy - y) * 0.3)));
                previewRotation[1] += (sx - x) * 0.3;
                sx = sy = x = y = 0;

                dragging = false;

                queueRender();
            };

            window.addEventListener('mousemove', onMouseMove, false);
            window.addEventListener('mouseup', onMouseUp, false);


            root.class.add('asset-preview');
            root.prepend(previewContainer);

            // rendering preview
            var renderQueued;

            var renderPreview = function () {
                if (renderQueued)
                    renderQueued = false;

                // render
                editor.call('preview:render', assets[0], previewContainer.width, previewContainer.height, preview, {
                    rotation: [Math.max(-90, Math.min(90, previewRotation[0] + (sy - y) * 0.3)), previewRotation[1] + (sx - x) * 0.3],
                    model: currentPreviewModel,
                    params: previewTexturesHover
                });
            };

            // queue up the rendering to prevent too oftern renders
            var queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            renderPreview();

            // render on resize
            var evtPanelResize = root.on('resize', queueRender);
            var evtSceneSettings = editor.on('preview:scene:changed', queueRender);

            // material textures loaded
            var materialWatch = editor.call('assets:material:watch', {
                asset: assets[0],
                autoLoad: true,
                callback: queueRender
            });
        }

        var handleTextureHover = function (path) {
            var valueOld = null;
            var events = [];

            return {
                over: function (type, data) {
                    var i;

                    if (previewTexturesHover !== null)
                        previewTexturesHover[path] = parseInt(data.id, 10);

                    var texture = app.assets.get(parseInt(data.id, 10));
                    app.assets.load(texture);

                    var attachTexture = function (ind) {
                        var engineAsset = app.assets.get(parseInt(assets[ind].get('id'), 10));
                        app.assets.load(engineAsset);

                        if (engineAsset && engineAsset.resource) {
                            valueOld[ind] = engineAsset.resource[path];

                            if (texture.resource) {
                                engineAsset.resource[path] = texture.resource;
                                engineAsset.resource.update();
                            } else {
                                var evt = {
                                    asset: texture,
                                    fn: function () {
                                        engineAsset.resource[path] = texture.resource;
                                        engineAsset.resource.update();
                                    }
                                };
                                events.push(evt);
                                texture.once('load', evt.fn);
                            }
                        }
                    };

                    valueOld = [];
                    for (i = 0; i < assets.length; i++)
                        attachTexture(i);

                    editor.call('viewport:render');

                    if (queueRender)
                        queueRender();
                },
                leave: function () {
                    var i;
                    if (previewTexturesHover !== null)
                        previewTexturesHover = {};

                    if (queueRender)
                        queueRender();

                    if (valueOld === null) return;

                    for (i = 0; i < events.length; i++)
                        events[i].asset.off('load', events[i].fn);
                    events = [];

                    for (i = 0; i < assets.length; i++) {
                        var engineAsset = app.assets.get(parseInt(assets[i].get('id'), 10));
                        app.assets.load(engineAsset);

                        if (engineAsset && engineAsset.resource) {
                            engineAsset.resource[path] = valueOld[i];
                            engineAsset.resource.update();
                        }
                    }
                    editor.call('viewport:render');
                    valueOld = null;
                }
            };
        };


        // properties panel
        var panelParams = editor.call('attributes:addPanel', {
            name: 'Material'
        });
        panelParams.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:material:asset', panelParams, panelParams.headerElement);
        // clean preview
        if (assets.length === 1) {
            panelParams.on('destroy', function () {
                root.class.remove('asset-preview');

                editor.call('assets:material:unwatch', assets[0], materialWatch);

                evtSceneSettings.unbind();
                evtPanelResize.unbind();

                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            });
        }


        // model
        var fieldShader = editor.call('attributes:addField', {
            parent: panelParams,
            type: 'string',
            enum: {
                '': '...',
                'phong': 'Phong',
                'blinn': 'Physical'
            },
            name: 'Shading',
            link: assets,
            path: 'data.shader'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:shadingModel', fieldShader.parent.innerElement.firstChild.ui);
        // fresnelMode
        var evtFresnelModel = [];
        for (i = 0; i < assets.length; i++) {
            evtFresnelModel.push(assets[i].on('data.shader:set', function (value) {
                var state = this.history.enabled;
                this.history.enabled = false;
                this.set('data.fresnelModel', value === 'blinn' ? 2 : 0);
                this.history.enabled = state;
            }));
        }
        fieldShader.once('destroy', function () {
            for (var i = 0; i < evtFresnelModel.length; i++)
                evtFresnelModel[i].unbind();
        });

        // TODO
        // make sure changes by history or to individual
        // offset/tiling fields affects state of global fields

        // tiling & offsets
        var tilingOffsetsChanging = false;
        var offset = assets[0].get('data.' + mappingMaps[0] + 'MapOffset');
        var tiling = assets[0].get('data.' + mappingMaps[0] + 'MapTiling');
        var checkTilingOffsetDifferent = function () {
            var offset = assets[0].get('data.' + mappingMaps[0] + 'MapOffset');
            var tiling = assets[0].get('data.' + mappingMaps[0] + 'MapTiling');

            for (var i = 0; i < assets.length; i++) {
                for (var m = 0; m < mappingMaps.length; m++) {
                    if (i === 0 && m === 0)
                        continue;

                    if (!offset.equals(assets[i].get('data.' + mappingMaps[m] + 'MapOffset')) || !tiling.equals(assets[i].get('data.' + mappingMaps[m] + 'MapTiling'))) {
                        return true;
                    }
                }
            }

            return false;
        }
        var different = checkTilingOffsetDifferent();

        if (different && panelStateNew)
            panelState['offset'] = true;

        var panelTiling = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['offset'],
            name: 'Offset & Tiling'
        });
        panelTiling.class.add('component');
        panelTiling.on('fold', function () { panelState['offset'] = true; });
        panelTiling.on('unfold', function () { panelState['offset'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:offsetTiling', panelTiling, panelTiling.headerElement);

        var tilingOffsetFields = [];

        // all maps
        var fieldTilingOffset = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'checkbox',
            name: 'Apply to all Maps',
            value: !different
        });
        fieldTilingOffset.element.previousSibling.style.width = 'auto';
        fieldTilingOffset.on('change', function (value) {
            var i;

            if (tilingOffsetsChanging)
                return;

            fieldOffset[0].parent.hidden = !value;
            fieldTiling[0].parent.hidden = !value;

            for (i = 0; i < tilingOffsetFields.length; i++) {
                tilingOffsetFields[i].element.hidden = tilingOffsetFields[i].filter();
            }

            if (value) {
                var valueOffset = [fieldOffset[0].value, fieldOffset[1].value];
                var valueTiling = [fieldTiling[0].value, fieldTiling[1].value];
                var items = [];
                tilingOffsetsChanging = true;
                for (i = 0; i < assets.length; i++) {
                    for (var m = 0; m < mappingMaps.length; m++) {
                        items.push({
                            get: assets[i].history._getItemFn,
                            path: 'data.' + mappingMaps[m] + 'Map',
                            valueOffset: assets[i].get('data.' + mappingMaps[m] + 'MapOffset'),
                            valueTiling: assets[i].get('data.' + mappingMaps[m] + 'MapTiling')
                        });
                        assets[i].history.enabled = false;
                        assets[i].set('data.' + mappingMaps[m] + 'MapOffset', valueOffset);
                        assets[i].set('data.' + mappingMaps[m] + 'MapTiling', valueTiling);
                        assets[i].history.enabled = true;
                    }
                }
                tilingOffsetsChanging = false;
                // history
                editor.call('history:add', {
                    name: 'assets.materials.tiling-offset',
                    undo: function () {
                        for (var i = 0; i < items.length; i++) {
                            var item = items[i].get();
                            if (!item)
                                continue;

                            item.history.enabled = false;
                            item.set(items[i].path + 'Offset', items[i].valueOffset);
                            item.set(items[i].path + 'Tiling', items[i].valueTiling);
                            item.history.enabled = true;
                        }
                    },
                    redo: function () {
                        for (var i = 0; i < items.length; i++) {
                            var item = items[i].get();
                            if (!item)
                                continue;

                            item.history.enabled = false;
                            item.set(items[i].path + 'Offset', valueOffset);
                            item.set(items[i].path + 'Tiling', valueTiling);
                            item.history.enabled = true;
                        }
                    }
                });
            }
        });

        // offset
        var fieldOffset = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V']
        });
        fieldOffset[0].parent.hidden = !fieldTilingOffset.value;
        // reference
        editor.call('attributes:reference:attach', 'asset:material:offset', fieldOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldTiling = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V']
        });
        fieldTiling[0].parent.hidden = !fieldTilingOffset.value;
        // reference
        editor.call('attributes:reference:attach', 'asset:material:tiling', fieldTiling[0].parent.innerElement.firstChild.ui);

        if (different) {
            fieldTilingOffset.value = false;

            if (panelStateNew && !panelState['offset'])
                panelState['offset'] = true;
        }

        fieldOffset[0].value = offset[0];
        fieldOffset[1].value = offset[1];
        fieldTiling[0].value = tiling[0];
        fieldTiling[1].value = tiling[1];

        var updateAllTilingOffsetFields = function (input, type, field, value, valueOld) {
            if (!fieldTilingOffset.value || tilingOffsetsChanging)
                return;

            var items = [];

            tilingOffsetsChanging = true;
            for (var i = 0; i < assets.length; i++) {
                assets[i].history.enabled = false;
                for (var m = 0; m < mappingMaps.length; m++) {
                    var path = 'data.' + mappingMaps[m] + 'Map' + type;
                    // set initial value for tiling / offset if it was missing
                    if (missingPaths[assets[i].get('id') + '.' + path]) {
                        assets[i].set(path, [input[0].value, input[1].value]);
                        delete missingPaths[assets[i].get('id') + '.' + path];
                    }

                    var fullpath = path + '.' + field;
                    items.push({
                        get: assets[i].history._getItemFn,
                        path: fullpath,
                        value: assets[i].get(fullpath)
                    });
                    assets[i].set(fullpath, value);
                }
                assets[i].history.enabled = true;
            }
            tilingOffsetsChanging = false;

            // history
            editor.call('history:add', {
                name: 'assets.materials.' + type + '.' + field,
                undo: function () {
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i].get();
                        if (!item)
                            continue;

                        item.history.enabled = false;
                        item.set(items[i].path, items[i].value);
                        item.history.enabled = true;
                    }
                },
                redo: function () {
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i].get();
                        if (!item)
                            continue;

                        item.history.enabled = false;
                        item.set(items[i].path, value);
                        item.history.enabled = true;
                    }
                }
            });
        };

        fieldOffset[0].on('change', function (value, valueOld) {
            updateAllTilingOffsetFields(fieldOffset, 'Offset', 0, value);
        });
        fieldOffset[1].on('change', function (value, valueOld) {
            updateAllTilingOffsetFields(fieldOffset, 'Offset', 1, value);
        });
        fieldTiling[0].on('change', function (value, valueOld) {
            updateAllTilingOffsetFields(fieldTiling, 'Tiling', 0, value);
        });
        fieldTiling[1].on('change', function (value, valueOld) {
            updateAllTilingOffsetFields(fieldTiling, 'Tiling', 1, value);
        });

        var queuedOffsetsCheck = null;
        var queueOffsetsCheck = function () {
            if (queuedOffsetsCheck)
                return;

            queuedOffsetsCheck = setTimeout(function () {
                queuedOffsetsCheck = null;

                if (!fieldTilingOffset.value)
                    return;

                var offset = assets[0].get('data.diffuseMapOffset');
                var tiling = assets[0].get('data.diffuseMapTiling');

                tilingOffsetsChanging = true;

                fieldOffset[0].value = offset[0];
                fieldOffset[1].value = offset[1];

                fieldTiling[0].value = tiling[0];
                fieldTiling[1].value = tiling[1];

                tilingOffsetsChanging = false;
            });
        };

        for (i = 0; i < assets.length; i++) {
            for (var m = 0; m < mappingMaps.length; m++) {
                assets[i].on('data.' + mappingMaps[m] + 'MapOffset.0:set', queueOffsetsCheck);
                assets[i].on('data.' + mappingMaps[m] + 'MapOffset.1:set', queueOffsetsCheck);
                assets[i].on('data.' + mappingMaps[m] + 'MapTiling.0:set', queueOffsetsCheck);
                assets[i].on('data.' + mappingMaps[m] + 'MapTiling.1:set', queueOffsetsCheck);
            }
        }

        panelTiling.once('destroy', function () {
            if (queuedOffsetsCheck)
                clearTimeout(queuedOffsetsCheck);
        });

        var rgxExtension = /\.[a-z]+$/;
        var textureFields = {};
        var texturePanels = {};
        var bulkSlots = {
            'ao': ['a', 'ao', 'ambient', 'ambientocclusion', 'gma', 'gmat', 'gmao', 'gmaa', 'rma', 'rmat', 'rmao', 'rmaa'],
            'diffuse': ['d', 'diff', 'diffuse', 'albedo', 'color', 'rgb', 'rgba'],
            'specular': ['s', 'spec', 'specular'],
            'metalness': ['m', 'met', 'metal', 'metalness', 'gma', 'gmat', 'gmao', 'gmaa', 'rma', 'rmat', 'rmao', 'rmaa'],
            'gloss': ['g', 'gloss', 'glossiness', 'gma', 'gmat', 'gmao', 'gmaa', 'rma', 'rmat', 'rmao', 'rmaa'],
            'emissive': ['e', 'emissive'],
            'opacity': ['o', 't', 'opacity', 'alpha', 'transparency', 'gmat', 'gmao', 'gmaa', 'rgba', 'rmat', 'rmao', 'rmaa'],
            'normal': ['n', 'norm', 'normal', 'normals'],
            'height': ['p', 'h', 'height', 'parallax', 'bump'],
            'light': ['l', 'lm', 'light', 'lightmap']
        };

        var postfixToSlot = {};
        for (key in bulkSlots) {
            for (i = 0; i < bulkSlots[key].length; i++) {
                postfixToSlot[bulkSlots[key][i]] = postfixToSlot[bulkSlots[key][i]] || [];
                postfixToSlot[bulkSlots[key][i]].push(key);
            }
        }

        var tokenizeFilename = function (filename) {
            filename = filename.trim().toLowerCase();

            if (!filename)
                return;

            // drop extension
            var ext = filename.match(rgxExtension);
            if (ext) filename = filename.slice(0, -ext[0].length);

            if (!filename)
                return;

            var parts = filename.split(/(\-|_|\.)/g);
            var tokens = [];

            for (var i = 0; i < parts.length; i++) {
                if (parts[i] === '-' || parts[i] === '_' || parts[i] === '.')
                    continue;

                tokens.push(parts[i]);
            }

            if (!tokens.length)
                return;

            if (tokens.length === 1)
                return ['', tokens[0]];

            var left = tokens.slice(0, -1).join('');
            var right = tokens[tokens.length - 1];

            return [left, right];
        };

        var getFilenameLeftPart = function (name) {
            var parts = asset.get('name').trim().replace(/\.[a-z]+$/i, '').split(/(\-|_|\.)/g);
            if (parts.length < 3)
                return '';

            var first = parts.slice(0, -1).join('').toLowerCase();
        };

        var onTextureBulkSet = function (asset, oldValues, slot) {
            var tokens = tokenizeFilename(asset.get('name'));
            if (!tokens)
                return;

            if (bulkSlots[slot].indexOf(tokens[1]) == -1)
                return;

            var path = asset.get('path');
            var textures = editor.call('assets:find', function (texture) {
                return texture.get('type') === 'texture' && !texture.get('source') && texture.get('path').equals(path);
            });

            var candidates = {};
            for (var i = 0; i < textures.length; i++) {
                var t = tokenizeFilename(textures[i][1].get('name'));

                if (!t || t[0] !== tokens[0] || !postfixToSlot[t[1]])
                    continue;

                for (var s = 0; s < postfixToSlot[t[1]].length; s++) {
                    if (postfixToSlot[t[1]][s] === slot)
                        continue;

                    candidates[postfixToSlot[t[1]][s]] = {
                        texture: textures[i][1],
                        postfix: t[1]
                    };
                }
            }

            if (!Object.keys(candidates).length)
                return;

            var records = [];

            for (var a = 0; a < assets.length; a++) {
                if (oldValues[assets[a].get('id')])
                    continue;

                var history = assets[a].history.enabled;
                assets[a].history.enabled = false;

                for (var s in candidates) {
                    var key = 'data.' + s + 'Map';

                    if (assets[a].get(key))
                        continue;

                    var panel = texturePanels[s];
                    if (panel) panel.folded = false;

                    var id = parseInt(candidates[s].texture.get('id'), 10);
                    assets[a].set(key, id);

                    records.push({
                        id: assets[a].get('id'),
                        key: key,
                        value: id,
                        old: null
                    });

                    if (s === 'ao') {
                        // ao can be in third color channel
                        if (/^(g|r)ma/.test(candidates[s].postfix)) {
                            var channel = assets[a].get('data.aoMapChannel');
                            if (channel !== 'b') {
                                assets[a].set('data.aoMapChannel', 'b');

                                records.push({
                                    id: assets[a].get('id'),
                                    key: 'data.aoMapChannel',
                                    value: 'b',
                                    old: channel
                                });
                            }
                        }
                    } else if (s === 'metalness') {
                        // use metalness
                        if (!assets[a].get('data.useMetalness')) {
                            assets[a].set('data.useMetalness', true);

                            records.push({
                                id: assets[a].get('id'),
                                key: 'data.useMetalness',
                                value: true,
                                old: false
                            });
                        }

                        // metalness to maximum
                        var metalness = assets[a].get('data.metalness');
                        if (metalness !== 1) {
                            assets[a].set('data.metalness', 1.0);

                            records.push({
                                id: assets[a].get('id'),
                                key: 'data.metalness',
                                value: 1.0,
                                old: metalness
                            });
                        }

                        // metalness can be in second color channel
                        if (/^(g|r)ma/.test(candidates[s].postfix)) {
                            var channel = assets[a].get('data.metalnessMapChannel');
                            if (channel !== 'g') {
                                assets[a].set('data.metalnessMapChannel', 'g');

                                records.push({
                                    id: assets[a].get('id'),
                                    key: 'data.metalnessMapChannel',
                                    value: 'g',
                                    old: channel
                                });
                            }
                        }
                    } else if (s === 'gloss') {
                        // gloss to maximum
                        var shininess = assets[a].get('data.shininess');
                        if (shininess !== 100) {
                            assets[a].set('data.shininess', 100.0);

                            records.push({
                                id: assets[a].get('id'),
                                key: 'data.shininess',
                                value: 100.0,
                                old: shininess
                            });
                        }

                        // gloss shall be in first color channel
                        var channel = assets[a].get('data.glossMapChannel');
                        if (channel !== 'r') {
                            assets[a].set('data.glossMapChannel', 'r');

                            records.push({
                                id: assets[a].get('id'),
                                key: 'data.glossMapChannel',
                                value: 'r',
                                old: channel
                            });
                        }
                    } else if (s === 'opacity') {
                        // opacity can be in fourth color channel
                        if (/^(gma|rma|rgb)(t|o|a)$/.test(candidates[s].postfix)) {
                            var channel = assets[a].get('data.opacityMapChannel');
                            if (channel !== 'a') {
                                assets[a].set('data.opacityMapChannel', 'a');

                                records.push({
                                    id: assets[a].get('id'),
                                    key: 'data.opacityMapChannel',
                                    value: 'a',
                                    old: channel
                                });
                            }
                        }
                    }
                }

                assets[a].history.enabled = history;
            }

            if (records.length) {
                editor.call('history:add', {
                    name: 'material textures auto-bind',
                    undo: function () {
                        for (var i = 0; i < records.length; i++) {
                            var asset = editor.call('assets:get', records[i].id);
                            if (!asset)
                                continue;

                            var history = asset.history.enabled;
                            asset.history.enabled = false;
                            asset.set(records[i].key, records[i].old);
                            asset.history.enabled = history;
                        }
                    },
                    redo: function () {
                        for (var i = 0; i < records.length; i++) {
                            var asset = editor.call('assets:get', records[i].id);
                            if (!asset)
                                continue;

                            var history = asset.history.enabled;
                            asset.history.enabled = false;
                            asset.set(records[i].key, records[i].value);
                            asset.history.enabled = history;
                        }
                    }
                });
            }
        };



        // ambient
        var panelAmbient = texturePanels.ao = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['ao'],
            name: 'Ambient'
        });
        panelAmbient.class.add('component');
        panelAmbient.on('fold', function () { panelState['ao'] = true; });
        panelAmbient.on('unfold', function () { panelState['ao'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:ambientOverview', panelAmbient, panelAmbient.headerElement);


        // map
        var fieldAmbientMapHover = handleTextureHover('aoMap');
        var fieldAmbientMap = textureFields.ao = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'asset',
            kind: 'texture',
            name: 'Ambient Occlusion',
            link: assets,
            path: 'data.aoMap',
            over: fieldAmbientMapHover.over,
            leave: fieldAmbientMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'ao');
            }
        });
        fieldAmbientMap.parent.class.add('channel');
        fieldAmbientMap.on('change', function (value) {
            fieldAmbientOffset[0].parent.hidden = filterAmbientOffset();
            fieldAmbientTiling[0].parent.hidden = filterAmbientTiling();
            fieldOccludeSpecular.parent.hidden = !fieldAmbientMap.value && !fieldAmbientMap.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:aoMap', fieldAmbientMap._label);

        // map uv
        var fieldAmbientMapUV = editor.call('attributes:addField', {
            panel: fieldAmbientMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.aoMapUv'
        });
        fieldAmbientMapUV.flexGrow = 0;
        fieldAmbientMapUV.element.parentNode.removeChild(fieldAmbientMapUV.element);
        fieldAmbientMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldAmbientMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:aoMapUv', fieldAmbientMapUV);

        // map channel
        var fieldAmbientMapChannel = editor.call('attributes:addField', {
            panel: fieldAmbientMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A'
            },
            link: assets,
            path: 'data.aoMapChannel'
        });
        fieldAmbientMapChannel.element.parentNode.removeChild(fieldAmbientMapChannel.element);
        fieldAmbientMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldAmbientMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:aoMapChannel', fieldAmbientMapChannel);

        // offset
        var fieldAmbientOffset = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.aoMapOffset'
        });
        var filterAmbientOffset = function () {
            return (!fieldAmbientMap.value && !fieldAmbientMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldAmbientOffset[0].parent,
            offset: fieldAmbientOffset,
            filter: filterAmbientOffset,
            path: 'data.aoMapOffset'
        });
        fieldAmbientOffset[0].parent.hidden = filterAmbientOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:aoMapOffset', fieldAmbientOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldAmbientTiling = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.aoMapTiling'
        });
        var filterAmbientTiling = function () {
            return (!fieldAmbientMap.value && !fieldAmbientMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldAmbientTiling[0].parent,
            tiling: fieldAmbientTiling,
            filter: filterAmbientTiling,
            path: 'data.aoMapTiling'
        });
        fieldAmbientTiling[0].parent.hidden = filterAmbientTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:aoMapTiling', fieldAmbientTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldAmbientVertexColor = editor.call('attributes:addField', {
            parent: panelAmbient,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.aoMapVertexColor'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:aoMapVertexColor', fieldAmbientVertexColor.parent.innerElement.firstChild.ui);

        // occludeSpecular
        var fieldOccludeSpecular = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Off' },
                { v: 1, t: 'Multiply' },
                { v: 2, t: 'Gloss Based' }
            ],
            name: 'Occlude Specular',
            link: assets,
            path: 'data.occludeSpecular'
        });
        fieldOccludeSpecular.parent.hidden = !fieldAmbientMap.value && !fieldAmbientMap.class.contains('null');
        // reference
        editor.call('attributes:reference:attach', 'asset:material:occludeSpecular', fieldOccludeSpecular.parent.innerElement.firstChild.ui);

        // color
        var fieldAmbientColor = editor.call('attributes:addField', {
            parent: panelAmbient,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.ambient'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:ambient', fieldAmbientColor.parent.innerElement.firstChild.ui);


        // tint
        var fieldAmbientTint = editor.call('attributes:addField', {
            panel: fieldAmbientColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.ambientTint'
        });
        // label
        var labelAmbientTint = new ui.Label({ text: 'Tint' });
        labelAmbientTint.style.verticalAlign = 'top';
        labelAmbientTint.style.paddingRight = '12px';
        labelAmbientTint.style.fontSize = '12px';
        labelAmbientTint.style.lineHeight = '24px';
        fieldAmbientColor.parent.append(labelAmbientTint);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:ambientTint', labelAmbientTint);


        // diffuse
        var panelDiffuse = texturePanels.diffuse = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['diffuse'],
            name: 'Diffuse'
        });
        panelDiffuse.class.add('component');
        panelDiffuse.on('fold', function () { panelState['diffuse'] = true; });
        panelDiffuse.on('unfold', function () { panelState['diffuse'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseOverview', panelDiffuse, panelDiffuse.headerElement);

        // diffuse map
        var fieldDiffuseMapHover = handleTextureHover('diffuseMap');
        var fieldDiffuseMap = textureFields.diffuse = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'asset',
            kind: 'texture',
            name: 'Diffuse',
            link: assets,
            path: 'data.diffuseMap',
            over: fieldDiffuseMapHover.over,
            leave: fieldDiffuseMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'diffuse');
            }
        });
        fieldDiffuseMap.parent.class.add('channel');
        fieldDiffuseMap.on('change', function (value) {
            fieldDiffuseOffset[0].parent.hidden = filterDiffuseOffset();
            fieldDiffuseTiling[0].parent.hidden = filterDiffuseTiling();
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseMap', fieldDiffuseMap._label);

        // map uv
        var fieldDiffuseMapUV = editor.call('attributes:addField', {
            panel: fieldDiffuseMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.diffuseMapUv'
        });
        fieldDiffuseMapUV.flexGrow = 0;
        fieldDiffuseMapUV.element.parentNode.removeChild(fieldDiffuseMapUV.element);
        fieldDiffuseMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldDiffuseMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseMapUv', fieldDiffuseMapUV);

        // map channel
        var fieldDiffuseMapChannel = editor.call('attributes:addField', {
            panel: fieldDiffuseMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.diffuseMapChannel'
        });
        fieldDiffuseMapChannel.element.parentNode.removeChild(fieldDiffuseMapChannel.element);
        fieldDiffuseMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldDiffuseMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseMapChannel', fieldDiffuseMapChannel);

        // offset
        var fieldDiffuseOffset = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.diffuseMapOffset'
        });
        var filterDiffuseOffset = function () {
            return (!fieldDiffuseMap.value && !fieldDiffuseMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldDiffuseOffset[0].parent,
            offset: fieldDiffuseOffset,
            filter: filterDiffuseOffset,
            path: 'data.diffuseMapOffset'
        });
        fieldDiffuseOffset[0].parent.hidden = filterDiffuseOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseMapOffset', fieldDiffuseOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldDiffuseTiling = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.diffuseMapTiling'
        });
        var filterDiffuseTiling = function () {
            return (!fieldDiffuseMap.value && !fieldDiffuseMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldDiffuseTiling[0].parent,
            tiling: fieldDiffuseTiling,
            filter: filterDiffuseTiling,
            path: 'data.diffuseMapTiling'
        });
        fieldDiffuseTiling[0].parent.hidden = filterDiffuseTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseMapTiling', fieldDiffuseTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldDiffuseVertexColor = editor.call('attributes:addField', {
            parent: panelDiffuse,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.diffuseMapVertexColor'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseMapVertexColor', fieldDiffuseVertexColor.parent.innerElement.firstChild.ui);

        // color
        var fieldDiffuseColor = editor.call('attributes:addField', {
            parent: panelDiffuse,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.diffuse'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuse', fieldDiffuseColor.parent.innerElement.firstChild.ui);

        // tint
        var fieldDiffuseTint = editor.call('attributes:addField', {
            panel: fieldDiffuseColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.diffuseMapTint'
        });
        // label
        var labelDiffuseTint = new ui.Label({ text: 'Tint' });
        labelDiffuseTint.style.verticalAlign = 'top';
        labelDiffuseTint.style.paddingRight = '12px';
        labelDiffuseTint.style.fontSize = '12px';
        labelDiffuseTint.style.lineHeight = '24px';
        fieldDiffuseColor.parent.append(labelDiffuseTint);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:diffuseMapTint', labelDiffuseTint);



        // specular
        var panelSpecular = texturePanels.specular = texturePanels.metalness = texturePanels.gloss = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['specular'],
            name: 'Specular'
        });
        panelSpecular.class.add('component');
        panelSpecular.on('fold', function () { panelState['specular'] = true; });
        panelSpecular.on('unfold', function () { panelState['specular'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularOverview', panelSpecular, panelSpecular.headerElement);

        // use metalness
        var fieldUseMetalness = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'checkbox',
            name: 'Use Metalness',
            link: assets,
            path: 'data.useMetalness'
        });
        fieldUseMetalness.on('change', function (value) {
            panelSpecularWorkflow.hidden = value || fieldUseMetalness.class.contains('null');
            panelMetalness.hidden = !value || fieldUseMetalness.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:useMetalness', fieldUseMetalness.parent.innerElement.firstChild.ui);

        var panelMetalness = editor.call('attributes:addPanel');
        panelMetalness.hidden = !fieldUseMetalness.value || fieldUseMetalness.class.contains('null');
        panelSpecular.append(panelMetalness);

        // metalness map
        var fieldMetalnessMapHover = handleTextureHover('metalnessMap');
        var fieldMetalnessMap = textureFields.metalness = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'asset',
            kind: 'texture',
            name: 'Metalness',
            link: assets,
            path: 'data.metalnessMap',
            over: fieldMetalnessMapHover.over,
            leave: fieldMetalnessMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'metalness');
            }
        });
        fieldMetalnessMap.parent.class.add('channel');
        fieldMetalnessMap.on('change', function (value) {
            fieldMetalnessOffset[0].parent.hidden = filterMetalnessOffset();
            fieldMetalnessTiling[0].parent.hidden = filterMetalnessTiling();
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:metalnessMap', fieldMetalnessMap._label);

        // map uv
        var fieldMetalnessMapUV = editor.call('attributes:addField', {
            panel: fieldMetalnessMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.metalnessMapUv'
        });
        fieldMetalnessMapUV.flexGrow = 0;
        fieldMetalnessMapUV.element.parentNode.removeChild(fieldMetalnessMapUV.element);
        fieldMetalnessMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldMetalnessMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:metalnessMapUv', fieldMetalnessMapUV);

        // map channel
        var fieldMetalnessMapChannel = editor.call('attributes:addField', {
            panel: fieldMetalnessMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
            },
            link: assets,
            path: 'data.metalnessMapChannel'
        });
        fieldMetalnessMapChannel.element.parentNode.removeChild(fieldMetalnessMapChannel.element);
        fieldMetalnessMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldMetalnessMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:metalnessMapChannel', fieldMetalnessMapChannel);

        // offset
        var fieldMetalnessOffset = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.metalnessMapOffset'
        });
        var filterMetalnessOffset = function () {
            return (!fieldMetalnessMap.value && !fieldMetalnessMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldMetalnessOffset[0].parent,
            offset: fieldMetalnessOffset,
            filter: filterMetalnessOffset,
            path: 'data.metalnessMapOffset'
        });
        fieldMetalnessOffset[0].parent.hidden = filterMetalnessOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:metalnessMapOffset', fieldMetalnessOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldMetalnessTiling = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.metalnessMapTiling'
        });
        var filterMetalnessTiling = function () {
            return (!fieldMetalnessMap.value && !fieldMetalnessMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldMetalnessTiling[0].parent,
            tiling: fieldMetalnessTiling,
            filter: filterMetalnessTiling,
            path: 'data.metalnessMapTiling'
        });
        fieldMetalnessTiling[0].parent.hidden = filterMetalnessTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:metalnessMapTiling', fieldMetalnessTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldMetalnessVertexColor = editor.call('attributes:addField', {
            parent: panelMetalness,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.metalnessMapVertexColor'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:metalnessMapVertexColor', fieldMetalnessVertexColor.parent.innerElement.firstChild.ui);


        // metalness
        var fieldMetalness = editor.call('attributes:addField', {
            parent: panelMetalness,
            precision: 3,
            step: 0.05,
            min: 0,
            max: 1,
            type: 'number',
            name: 'Metalness',
            link: assets,
            path: 'data.metalness'
        });
        fieldMetalness.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'asset:material:metalness', fieldMetalness.parent.innerElement.firstChild.ui);

        // metalness slider
        var fieldMetalnessSlider = editor.call('attributes:addField', {
            panel: fieldMetalness.parent,
            precision: 3,
            step: 0.05,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.metalness'
        });
        fieldMetalnessSlider.flexGrow = 4;


        // specular
        var panelSpecularWorkflow = editor.call('attributes:addPanel');
        panelSpecularWorkflow.hidden = fieldUseMetalness.value || fieldUseMetalness.class.contains('null');
        panelSpecular.append(panelSpecularWorkflow);

        // specular map
        var fieldSpecularMapHover = handleTextureHover('specularMap');
        var fieldSpecularMap = textureFields.specular = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'asset',
            kind: 'texture',
            name: 'Specular',
            link: assets,
            path: 'data.specularMap',
            over: fieldSpecularMapHover.over,
            leave: fieldSpecularMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'specular');
            }
        });
        fieldSpecularMap.parent.class.add('channel');
        fieldSpecularMap.on('change', function (value) {
            fieldSpecularOffset[0].parent.hidden = filterSpecularOffset();
            fieldSpecularTiling[0].parent.hidden = filterSpecularTiling();
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularMap', fieldSpecularMap._label);

        // map uv
        var fieldSpecularMapUV = editor.call('attributes:addField', {
            panel: fieldSpecularMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.specularMapUv'
        });
        fieldSpecularMapUV.flexGrow = 0;
        fieldSpecularMapUV.element.parentNode.removeChild(fieldSpecularMapUV.element);
        fieldSpecularMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldSpecularMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularMapUv', fieldSpecularMapUV);

        // map channel
        var fieldSpecularMapChannel = editor.call('attributes:addField', {
            panel: fieldSpecularMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.specularMapChannel'
        });
        fieldSpecularMapChannel.element.parentNode.removeChild(fieldSpecularMapChannel.element);
        fieldSpecularMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldSpecularMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularMapChannel', fieldSpecularMapChannel);


        // offset
        var fieldSpecularOffset = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.specularMapOffset'
        });
        var filterSpecularOffset = function () {
            return (!fieldSpecularMap.value && !fieldSpecularMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldSpecularOffset[0].parent,
            offset: fieldSpecularOffset,
            filter: filterSpecularOffset,
            path: 'data.specularMapOffset'
        });
        fieldSpecularOffset[0].parent.hidden = filterSpecularOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularMapOffset', fieldSpecularOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldSpecularTiling = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.specularMapTiling'
        });
        var filterSpecularTiling = function () {
            return (!fieldSpecularMap.value && !fieldSpecularMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldSpecularTiling[0].parent,
            tiling: fieldSpecularTiling,
            filter: filterSpecularTiling,
            path: 'data.specularMapTiling'
        });
        fieldSpecularTiling[0].parent.hidden = filterSpecularTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularMapTiling', fieldSpecularTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldSpecularVertexColor = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.specularMapVertexColor'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularMapVertexColor', fieldSpecularVertexColor.parent.innerElement.firstChild.ui);

        // color
        var fieldSpecularColor = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.specular'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specular', fieldSpecularColor.parent.innerElement.firstChild.ui);

        // tint
        var fieldSpecularTint = editor.call('attributes:addField', {
            panel: fieldSpecularColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.specularMapTint'
        });
        // label
        var labelSpecularTint = new ui.Label({ text: 'Tint' });
        labelSpecularTint.style.verticalAlign = 'top';
        labelSpecularTint.style.paddingRight = '12px';
        labelSpecularTint.style.fontSize = '12px';
        labelSpecularTint.style.lineHeight = '24px';
        fieldSpecularColor.parent.append(labelSpecularTint);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:specularMapTint', labelSpecularTint);


        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panelSpecular.append(divider);


        // map (gloss)
        var fieldGlossMapHover = handleTextureHover('glossMap');
        var fieldGlossMap = textureFields.gloss = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'asset',
            kind: 'texture',
            name: 'Glossiness',
            link: assets,
            path: 'data.glossMap',
            over: fieldGlossMapHover.over,
            leave: fieldGlossMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'gloss');
            }
        });
        fieldGlossMap.parent.class.add('channel');
        fieldGlossMap.on('change', function (value) {
            fieldGlossOffset[0].parent.hidden = filterGlossOffset();
            fieldGlossTiling[0].parent.hidden = filterGlossTiling();
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:glossMap', fieldGlossMap._label);

        // map uv
        var fieldGlossMapUV = editor.call('attributes:addField', {
            panel: fieldGlossMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.glossMapUv'
        });
        fieldGlossMapUV.flexGrow = 0;
        fieldGlossMapUV.element.parentNode.removeChild(fieldGlossMapUV.element);
        fieldGlossMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldGlossMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:glossMapUv', fieldGlossMapUV);

        // map channel
        var fieldGlossMapChannel = editor.call('attributes:addField', {
            panel: fieldGlossMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A'
            },
            link: assets,
            path: 'data.glossMapChannel'
        });
        fieldGlossMapChannel.element.parentNode.removeChild(fieldGlossMapChannel.element);
        fieldGlossMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldGlossMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:glossMapChannel', fieldGlossMapChannel);


        // offset
        var fieldGlossOffset = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.glossMapOffset'
        });
        var filterGlossOffset = function () {
            return (!fieldGlossMap.value && !fieldGlossMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldGlossOffset[0].parent,
            offset: fieldGlossOffset,
            filter: filterGlossOffset,
            path: 'data.glossMapOffset'
        });
        fieldGlossOffset[0].parent.hidden = filterGlossOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:glossMapOffset', fieldGlossOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldGlossTiling = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.glossMapTiling'
        });
        var filterGlossTiling = function () {
            return (!fieldGlossMap.value && !fieldGlossMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldGlossTiling[0].parent,
            tiling: fieldGlossTiling,
            filter: filterGlossTiling,
            path: 'data.glossMapTiling'
        });
        fieldGlossTiling[0].parent.hidden = filterGlossTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:glossMapTiling', fieldGlossTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldGlossVertexColor = editor.call('attributes:addField', {
            parent: panelSpecular,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.glossMapVertexColor'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:glossMapVertexColor', fieldGlossVertexColor.parent.innerElement.firstChild.ui);

        // shininess
        var fieldShininess = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'number',
            precision: 2,
            step: 0.5,
            min: 0,
            max: 100,
            name: 'Glossiness',
            link: assets,
            path: 'data.shininess'
        });
        fieldShininess.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'asset:material:shininess', fieldShininess.parent.innerElement.firstChild.ui);

        // shininess slider
        var fieldShininessSlider = editor.call('attributes:addField', {
            panel: fieldShininess.parent,
            precision: 2,
            step: 0.5,
            min: 0,
            max: 100,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.shininess'
        });
        fieldShininessSlider.flexGrow = 4;


        // emissive
        var panelEmissive = texturePanels.emissive = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['emissive'],
            name: 'Emissive'
        });
        panelEmissive.class.add('component');
        panelEmissive.on('fold', function () { panelState['emissive'] = true; });
        panelEmissive.on('unfold', function () { panelState['emissive'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveOverview', panelEmissive, panelEmissive.headerElement);

        // map
        var fieldEmissiveMapHover = handleTextureHover('emissiveMap');
        var fieldEmissiveMap = textureFields.emissive = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'asset',
            kind: 'texture',
            name: 'Emissive',
            link: assets,
            path: 'data.emissiveMap',
            over: fieldEmissiveMapHover.over,
            leave: fieldEmissiveMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'emissive');
            }
        });
        fieldEmissiveMap.parent.class.add('channel');
        fieldEmissiveMap.on('change', function (value) {
            fieldEmissiveOffset[0].parent.hidden = filterEmissiveOffset();
            fieldEmissiveTiling[0].parent.hidden = filterEmissiveTiling();
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveMap', fieldEmissiveMap._label);

        // map uv
        var fieldEmissiveMapUV = editor.call('attributes:addField', {
            panel: fieldEmissiveMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.emissiveMapUv'
        });
        fieldEmissiveMapUV.flexGrow = 0;
        fieldEmissiveMapUV.element.parentNode.removeChild(fieldEmissiveMapUV.element);
        fieldEmissiveMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldEmissiveMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveMapUv', fieldEmissiveMapUV);

        // map channel
        var fieldEmissiveMapChannel = editor.call('attributes:addField', {
            panel: fieldEmissiveMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.emissiveMapChannel'
        });
        fieldEmissiveMapChannel.element.parentNode.removeChild(fieldEmissiveMapChannel.element);
        fieldEmissiveMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldEmissiveMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveMapChannel', fieldEmissiveMapChannel);


        // offset
        var fieldEmissiveOffset = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.emissiveMapOffset'
        });
        var filterEmissiveOffset = function () {
            return (!fieldEmissiveMap.value && !fieldEmissiveMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldEmissiveOffset[0].parent,
            offset: fieldEmissiveOffset,
            filter: filterEmissiveOffset,
            path: 'data.emissiveMapOffset'
        });
        fieldEmissiveOffset[0].parent.hidden = filterEmissiveOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveMapOffset', fieldEmissiveOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldEmissiveTiling = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.emissiveMapTiling'
        });
        var filterEmissiveTiling = function () {
            return (!fieldEmissiveMap.value && !fieldEmissiveMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldEmissiveTiling[0].parent,
            tiling: fieldEmissiveTiling,
            filter: filterEmissiveTiling,
            path: 'data.emissiveMapTiling'
        });
        fieldEmissiveTiling[0].parent.hidden = filterEmissiveTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveMapTiling', fieldEmissiveTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldEmissiveVertexColor = editor.call('attributes:addField', {
            parent: panelEmissive,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.emissiveMapVertexColor'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveMapVertexColor', fieldEmissiveVertexColor.parent.innerElement.firstChild.ui);

        // color
        var fieldEmissiveColor = editor.call('attributes:addField', {
            parent: panelEmissive,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.emissive'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissive', fieldEmissiveColor.parent.innerElement.firstChild.ui);

        // tint
        var fieldEmissiveTint = editor.call('attributes:addField', {
            panel: fieldEmissiveColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.emissiveMapTint'
        });
        // label
        var labelEmissiveTint = new ui.Label({ text: 'Tint' });
        labelEmissiveTint.style.verticalAlign = 'top';
        labelEmissiveTint.style.paddingRight = '12px';
        labelEmissiveTint.style.fontSize = '12px';
        labelEmissiveTint.style.lineHeight = '24px';
        fieldEmissiveColor.parent.append(labelEmissiveTint);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveMapTint', labelEmissiveTint);



        // emissiveIntensity
        var fieldEmissiveIntensity = editor.call('attributes:addField', {
            parent: panelEmissive,
            name: 'Intensity',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: assets,
            path: 'data.emissiveIntensity'
        });
        fieldEmissiveIntensity.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'asset:material:emissiveIntensity', fieldEmissiveIntensity.parent.innerElement.firstChild.ui);

        // emissiveIntensity slider
        var fieldEmissiveIntensitySlider = editor.call('attributes:addField', {
            panel: fieldEmissiveIntensity.parent,
            precision: 2,
            step: .1,
            min: 0,
            max: 10,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.emissiveIntensity'
        });
        fieldEmissiveIntensitySlider.flexGrow = 4;


        // opacity
        var panelOpacity = texturePanels.opacity = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['opacity'],
            name: 'Opacity'
        });
        panelOpacity.class.add('component');
        panelOpacity.on('fold', function () { panelState['opacity'] = true; });
        panelOpacity.on('unfold', function () { panelState['opacity'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacityOverview', panelOpacity, panelOpacity.headerElement);

        var filterBlendFields = function (value) {
            fieldOpacityIntensity.parent.hidden = !(fieldBlendType.value === '' || [2, 4, 6].indexOf(fieldBlendType.value) !== -1);
            fieldOpacityOffset[0].parent.hidden = filterOpacityOffset();
            fieldOpacityTiling[0].parent.hidden = filterOpacityTiling();
            fieldAlphaTest.parent.hidden = !(fieldOpacityMap.class.contains('null') || fieldOpacityMap.value) && !(fieldOpacityVertexColor.value || fieldOpacityVertexColor.class.contains('null'));
        };

        // blend type
        var fieldBlendType = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 3, t: 'None' },
                { v: 2, t: 'Alpha' },
                { v: 1, t: 'Additive' },
                { v: 6, t: 'Additive Alpha' },
                { v: 8, t: 'Screen' },
                { v: 4, t: 'Premultiplied Alpha' },
                { v: 5, t: 'Multiply' },
                { v: 7, t: 'Modulate 2x' },
                { v: 9, t: 'Min (Partial Support)' },
                { v: 10, t: 'Max (Partial Support)' },
            ],
            name: 'Blend Type',
            link: assets,
            path: 'data.blendType'
        });
        fieldBlendType.on('change', filterBlendFields);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:blendType', fieldBlendType.parent.innerElement.firstChild.ui);

        // map
        var fieldOpacityMapHover = handleTextureHover('opacityMap');
        var fieldOpacityMap = textureFields.opacity = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'asset',
            kind: 'texture',
            name: 'Opacity',
            link: assets,
            path: 'data.opacityMap',
            over: fieldOpacityMapHover.over,
            leave: fieldOpacityMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'opacity');
            }
        });
        fieldOpacityMap.parent.class.add('channel');
        fieldOpacityMap.on('change', filterBlendFields);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacityMap', fieldOpacityMap._label);

        // map uv
        var fieldOpacityMapUV = editor.call('attributes:addField', {
            panel: fieldOpacityMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.opacityMapUv'
        });
        fieldOpacityMapUV.flexGrow = 0;
        fieldOpacityMapUV.element.parentNode.removeChild(fieldOpacityMapUV.element);
        fieldOpacityMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldOpacityMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacityMapUv', fieldOpacityMapUV);

        // map channel
        var fieldOpacityMapChannel = editor.call('attributes:addField', {
            panel: fieldOpacityMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A'
            },
            link: assets,
            path: 'data.opacityMapChannel'
        });
        fieldOpacityMapChannel.element.parentNode.removeChild(fieldOpacityMapChannel.element);
        fieldOpacityMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldOpacityMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacityMapChannel', fieldOpacityMapChannel);

        // offset
        var fieldOpacityOffset = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.opacityMapOffset'
        });
        var filterOpacityOffset = function () {
            return fieldOpacityMap.parent.hidden || (!fieldOpacityMap.value && !fieldOpacityMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldOpacityOffset[0].parent,
            offset: fieldOpacityOffset,
            filter: filterOpacityOffset,
            path: 'data.opacityMapOffset'
        });
        fieldOpacityOffset[0].parent.hidden = filterOpacityOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacityMapOffset', fieldOpacityOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldOpacityTiling = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.opacityMapTiling'
        });
        var filterOpacityTiling = function () {
            return fieldOpacityMap.parent.hidden || (!fieldOpacityMap.value && !fieldOpacityMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldOpacityTiling[0].parent,
            tiling: fieldOpacityTiling,
            filter: filterOpacityTiling,
            path: 'data.opacityMapTiling'
        });
        fieldOpacityTiling[0].parent.hidden = filterOpacityTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacityMapTiling', fieldOpacityTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldOpacityVertexColor = editor.call('attributes:addField', {
            parent: panelOpacity,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.opacityMapVertexColor'
        });
        fieldOpacityVertexColor.on('change', filterBlendFields);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacityMapVertexColor', fieldOpacityVertexColor.parent.innerElement.firstChild.ui);

        // intensity
        var fieldOpacityIntensity = editor.call('attributes:addField', {
            parent: panelOpacity,
            name: 'Intensity',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 1,
            link: assets,
            path: 'data.opacity'
        });
        fieldOpacityIntensity.style.width = '32px';
        fieldOpacityIntensity.flexGrow = 1;
        // reference
        editor.call('attributes:reference:attach', 'asset:material:opacity', fieldOpacityIntensity.parent.innerElement.firstChild.ui);

        // intensity slider
        var fieldOpacityIntensitySlider = editor.call('attributes:addField', {
            panel: fieldOpacityIntensity.parent,
            precision: 3,
            step: .05,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.opacity'
        });
        fieldOpacityIntensitySlider.flexGrow = 4;

        // alphaTest
        var fieldAlphaTest = editor.call('attributes:addField', {
            parent: panelOpacity,
            name: 'Alpha Test',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 1,
            link: assets,
            path: 'data.alphaTest'
        });
        fieldAlphaTest.style.width = '32px';
        fieldAlphaTest.flexGrow = 1;
        // reference
        editor.call('attributes:reference:attach', 'asset:material:alphaTest', fieldAlphaTest.parent.innerElement.firstChild.ui);

        // alphaTest slider
        var fieldAlphaTestSlider = editor.call('attributes:addField', {
            panel: fieldAlphaTest.parent,
            precision: 3,
            step: .05,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.alphaTest'
        });
        fieldAlphaTestSlider.flexGrow = 4;

        filterBlendFields();


        // alphaToCoverage
        var fieldAlphaToCoverage = editor.call('attributes:addField', {
            parent: panelOpacity,
            name: 'Alpha To Coverage',
            type: 'checkbox',
            link: assets,
            path: 'data.alphaToCoverage'
        });
        fieldAlphaToCoverage.element.previousSibling.style.width = 'auto';
        // reference
        editor.call('attributes:reference:attach', 'asset:material:alphaToCoverage', fieldAlphaToCoverage.parent.innerElement.firstChild.ui);


        // normals
        var panelNormal = texturePanels.normal = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['normals'],
            name: 'Normals'
        });
        panelNormal.class.add('component');
        panelNormal.on('fold', function () { panelState['normals'] = true; });
        panelNormal.on('unfold', function () { panelState['normals'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:normalOverview', panelNormal, panelNormal.headerElement);

        // map (normals)
        var fieldNormalMapHover = handleTextureHover('normalMap');
        var fieldNormalMap = textureFields.normal = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'asset',
            kind: 'texture',
            name: 'Normals',
            link: assets,
            path: 'data.normalMap',
            over: fieldNormalMapHover.over,
            leave: fieldNormalMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'normal');
            }
        });
        fieldNormalMap.on('change', function (value) {
            fieldNormalsOffset[0].parent.hidden = filterNormalOffset();
            fieldNormalsTiling[0].parent.hidden = filterNormalTiling();
            fieldBumpiness.parent.hidden = !value && !this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:normalMap', fieldNormalMap._label);

        // map uv
        var fieldNormalMapUV = editor.call('attributes:addField', {
            panel: fieldNormalMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.normalMapUv'
        });
        fieldNormalMapUV.flexGrow = 0;
        fieldNormalMapUV.element.parentNode.removeChild(fieldNormalMapUV.element);
        fieldNormalMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldNormalMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:normalMapUv', fieldNormalMapUV);


        // offset
        var fieldNormalsOffset = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.normalMapOffset'
        });
        var filterNormalOffset = function () {
            return (!fieldNormalMap.value && !fieldNormalMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldNormalsOffset[0].parent,
            offset: fieldNormalsOffset,
            filter: filterNormalOffset,
            path: 'data.normalMapOffset'
        });
        fieldNormalsOffset[0].parent.hidden = filterNormalOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:normalMapOffset', fieldNormalsOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldNormalsTiling = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.normalMapTiling'
        });
        var filterNormalTiling = function () {
            return (!fieldNormalMap.value && !fieldNormalMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldNormalsTiling[0].parent,
            tiling: fieldNormalsTiling,
            filter: filterNormalTiling,
            path: 'data.normalMapTiling'
        });
        fieldNormalsTiling[0].parent.hidden = filterNormalTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:normalMapTiling', fieldNormalsTiling[0].parent.innerElement.firstChild.ui);


        // bumpiness
        var fieldBumpiness = editor.call('attributes:addField', {
            parent: panelNormal,
            name: 'Bumpiness',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            link: assets,
            path: 'data.bumpMapFactor'
        });
        fieldBumpiness.parent.hidden = !fieldNormalMap.value && !fieldNormalMap.class.contains('null');
        fieldBumpiness.style.width = '32px';
        fieldBumpiness.flexGrow = 1;
        // reference
        editor.call('attributes:reference:attach', 'asset:material:bumpiness', fieldBumpiness.parent.innerElement.firstChild.ui);

        // bumpiness slider
        var fieldBumpinessSlider = editor.call('attributes:addField', {
            panel: fieldBumpiness.parent,
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.bumpMapFactor'
        });
        fieldBumpinessSlider.flexGrow = 4;


        // parallax
        var panelParallax = texturePanels.height = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['height'],
            name: 'Parallax'
        });
        panelParallax.class.add('component');
        panelParallax.on('fold', function () { panelState['height'] = true; });
        panelParallax.on('unfold', function () { panelState['height'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:parallaxOverview', panelParallax, panelParallax.headerElement);

        // height map
        var fieldHeightMapHover = handleTextureHover('heightMap');
        var fieldHeightMap = textureFields.height = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'asset',
            kind: 'texture',
            name: 'Heightmap',
            link: assets,
            path: 'data.heightMap',
            over: fieldHeightMapHover.over,
            leave: fieldHeightMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'height');
            }
        });
        fieldHeightMap.parent.class.add('channel');
        fieldHeightMap.on('change', function (value) {
            fieldHeightMapOffset[0].parent.hidden = filterHeightMapOffset();
            fieldHeightMapTiling[0].parent.hidden = filterHeightMapTiling();
            fieldHeightMapFactor.parent.hidden = !value;
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:heightMap', fieldHeightMap._label);

        // map uv
        var fieldHeightMapUV = editor.call('attributes:addField', {
            panel: fieldHeightMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.heightMapUv'
        });
        fieldHeightMapUV.flexGrow = 0;
        fieldHeightMapUV.element.parentNode.removeChild(fieldHeightMapUV.element);
        fieldHeightMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldHeightMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:heightMapUv', fieldHeightMapUV);

        // map channel
        var fieldHeightMapChannel = editor.call('attributes:addField', {
            panel: fieldHeightMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A'
            },
            link: assets,
            path: 'data.heightMapChannel'
        });
        fieldHeightMapChannel.element.parentNode.removeChild(fieldHeightMapChannel.element);
        fieldHeightMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldHeightMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:heightMapChannel', fieldHeightMapChannel);


        // offset
        var fieldHeightMapOffset = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.heightMapOffset'
        });
        var filterHeightMapOffset = function () {
            return fieldHeightMap.parent.hidden || (!fieldHeightMap.value && !fieldHeightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldHeightMapOffset[0].parent,
            offset: fieldHeightMapOffset,
            filter: filterHeightMapOffset,
            path: 'data.heightMapOffset'
        });
        fieldHeightMapOffset[0].parent.hidden = filterHeightMapOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:heightMapOffset', fieldHeightMapOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldHeightMapTiling = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.heightMapTiling'
        });
        var filterHeightMapTiling = function () {
            return fieldHeightMap.parent.hidden || (!fieldHeightMap.value && !fieldHeightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldHeightMapTiling[0].parent,
            tiling: fieldHeightMapTiling,
            filter: filterHeightMapTiling,
            path: 'data.heightMapTiling'
        });
        fieldHeightMapTiling[0].parent.hidden = filterHeightMapTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:heightMapTiling', fieldHeightMapTiling[0].parent.innerElement.firstChild.ui);


        // heightMapFactor
        var fieldHeightMapFactor = editor.call('attributes:addField', {
            parent: panelParallax,
            name: 'Strength',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            link: assets,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactor.parent.hidden = fieldHeightMap.parent.hidden;
        fieldHeightMapFactor.style.width = '32px';
        fieldHeightMapFactor.flexGrow = 1;
        // reference
        editor.call('attributes:reference:attach', 'asset:material:bumpiness', fieldHeightMapFactor.parent.innerElement.firstChild.ui);

        // heightMapFactor slider
        var fieldHeightMapFactorSlider = editor.call('attributes:addField', {
            panel: fieldHeightMapFactor.parent,
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactorSlider.flexGrow = 4;


        // reflection
        var panelReflection = texturePanels.reflection = texturePanels.refraction = texturePanels.sphere = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['environment'],
            name: 'Environment'
        });
        panelReflection.class.add('component');
        panelReflection.on('fold', function () { panelState['environment'] = true; });
        panelReflection.on('unfold', function () { panelState['environment'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:environmentOverview', panelReflection, panelReflection.headerElement);
        // filter
        var filterReflectionMaps = function () {
            fieldReflectionCubeMap.parent.hidden = !fieldReflectionCubeMap.value && !fieldReflectionCubeMap.class.contains('null') && (fieldReflectionSphere.value || fieldReflectionSphere.class.contains('null'));
            fieldReflectionSphere.parent.hidden = !fieldReflectionSphere.value && !fieldReflectionSphere.class.contains('null') && (fieldReflectionCubeMap.value || fieldReflectionCubeMap.class.contains('null'));
        };
        // spheremap
        var fieldReflectionSphereHover = handleTextureHover('sphereMap');
        var fieldReflectionSphere = textureFields.sphere = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'asset',
            kind: 'texture',
            name: 'Sphere Map',
            link: assets,
            path: 'data.sphereMap',
            over: fieldReflectionSphereHover.over,
            leave: fieldReflectionSphereHover.leave
        });
        fieldReflectionSphere.on('change', filterReflectionMaps);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:sphereMap', fieldReflectionSphere._label);

        // cubemap
        var fieldReflectionCubeMap = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'asset',
            kind: 'cubemap',
            name: 'Cube Map',
            link: assets,
            path: 'data.cubeMap'
        });
        fieldReflectionCubeMap.on('change', filterReflectionMaps);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:cubeMap', fieldReflectionCubeMap._label);

        // reflectivity
        var fieldReflectionStrength = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            name: 'Reflectivity',
            link: assets,
            path: 'data.reflectivity'
        });
        fieldReflectionStrength.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'asset:material:reflectivity', fieldReflectionStrength.parent.innerElement.firstChild.ui);

        // reflectivity slider
        var fieldReflectionStrengthSlider = editor.call('attributes:addField', {
            panel: fieldReflectionStrength.parent,
            precision: 3,
            step: .01,
            min: 0,
            max: 8,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.reflectivity'
        });
        fieldReflectionStrengthSlider.flexGrow = 4;


        // refraction
        var fieldRefraction = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Refraction',
            link: assets,
            path: 'data.refraction'
        });
        fieldRefraction.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'asset:material:refraction', fieldRefraction.parent.innerElement.firstChild.ui);

        // reflectivity slider
        var fieldRefractionSlider = editor.call('attributes:addField', {
            panel: fieldRefraction.parent,
            precision: 3,
            step: .01,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.refraction'
        });
        fieldRefractionSlider.flexGrow = 4;


        // refractionIndex
        var fieldRefractionIndex = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Index of Refraction',
            link: assets,
            path: 'data.refractionIndex'
        });
        fieldRefractionIndex.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'asset:material:refractionIndex', fieldRefractionIndex.parent.innerElement.firstChild.ui);

        // reflectivity slider
        var fieldRefractionIndexSlider = editor.call('attributes:addField', {
            panel: fieldRefractionIndex.parent,
            precision: 3,
            step: .01,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.refractionIndex'
        });
        fieldRefractionIndexSlider.flexGrow = 4;


        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panelReflection.append(divider);


        // cubemap projection
        var fieldReflectionCubeMapProjection = editor.call('attributes:addField', {
            parent: panelReflection,
            name: 'Projection',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Normal' },
                { v: 1, t: 'Box' }
            ],
            link: assets,
            path: 'data.cubeMapProjection'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:cubeMapProjection', fieldReflectionCubeMapProjection.parent.innerElement.firstChild.ui);

        // cubemap projection center
        var fieldReflectionCubeMapProjectionBoxCenter = editor.call('attributes:addField', {
            parent: panelReflection,
            placeholder: ['x', 'y', 'z'],
            name: 'Center',
            type: 'vec3',
            link: assets,
            path: 'data.cubeMapProjectionBox.center'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:cubeMapProjectionBoxCenter', fieldReflectionCubeMapProjectionBoxCenter[0].parent.innerElement.firstChild.ui);

        // cubemap projection halfExtents
        var fieldReflectionCubeMapProjectionBoxHalfExtents = editor.call('attributes:addField', {
            parent: panelReflection,
            placeholder: ['w', 'h', 'd'],
            name: 'Half Extents',
            type: 'vec3',
            link: assets,
            path: 'data.cubeMapProjectionBox.halfExtents'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:cubeMapProjectionBoxHalfExtents', fieldReflectionCubeMapProjectionBoxHalfExtents[0].parent.innerElement.firstChild.ui);


        var onCubemapProjectionCheck = function () {
            fieldReflectionCubeMapProjection.parent.hidden = !fieldReflectionCubeMap.value;
            fieldReflectionCubeMapProjectionBoxCenter[0].parent.hidden = fieldReflectionCubeMapProjection.parent.hidden || fieldReflectionCubeMapProjection.value === 0 || fieldReflectionCubeMapProjection.class.contains('null');
            fieldReflectionCubeMapProjectionBoxHalfExtents[0].parent.hidden = fieldReflectionCubeMapProjectionBoxCenter[0].parent.hidden;
        };
        onCubemapProjectionCheck();
        fieldReflectionCubeMapProjection.on('change', onCubemapProjectionCheck);
        fieldReflectionCubeMap.on('change', onCubemapProjectionCheck);

        filterReflectionMaps();


        // lightmap
        var panelLightMap = texturePanels.light = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['light'],
            name: 'LightMap'
        });
        panelLightMap.class.add('component');
        panelLightMap.on('fold', function () { panelState['light'] = true; });
        panelLightMap.on('unfold', function () { panelState['light'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:lightMapOverview', panelLightMap, panelLightMap.headerElement);

        // map
        var fieldLightMapHover = handleTextureHover('lightMap');
        var fieldLightMap = textureFields.light = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'asset',
            kind: 'texture',
            name: 'Lightmap',
            link: assets,
            path: 'data.lightMap',
            over: fieldLightMapHover.over,
            leave: fieldLightMapHover.leave,
            onSet: function (asset, oldValues) {
                onTextureBulkSet(asset, oldValues, 'light');
            }
        });
        fieldLightMap.parent.class.add('channel');
        fieldLightMap.on('change', function (value) {
            fieldLightMapOffset[0].parent.hidden = filterLightMapOffset();
            fieldLightMapTiling[0].parent.hidden = filterLightMapTiling();
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:lightMap', fieldLightMap._label);

        // map uv
        var fieldLightMapUV = editor.call('attributes:addField', {
            panel: fieldLightMap.parent,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'UV0' },
                { v: 1, t: 'UV1' }
            ],
            link: assets,
            path: 'data.lightMapUv'
        });
        fieldLightMapUV.flexGrow = 0;
        fieldLightMapUV.element.parentNode.removeChild(fieldLightMapUV.element);
        fieldLightMap.parent.innerElement.querySelector('.top > .controls').appendChild(fieldLightMapUV.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:lightMapUv', fieldLightMapUV);

        // map channel
        var fieldLightMapChannel = editor.call('attributes:addField', {
            panel: fieldLightMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.lightMapChannel'
        });
        fieldLightMapChannel.element.parentNode.removeChild(fieldLightMapChannel.element);
        fieldLightMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldLightMapChannel.element);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:lightMapChannel', fieldLightMapChannel);


        // offset
        var fieldLightMapOffset = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'vec2',
            name: 'Offset',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.lightMapOffset'
        });
        var filterLightMapOffset = function () {
            return fieldLightMap.parent.hidden || (!fieldLightMap.value && !fieldLightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldLightMapOffset[0].parent,
            offset: fieldLightMapOffset,
            filter: filterLightMapOffset,
            path: 'data.lightMapOffset'
        });
        fieldLightMapOffset[0].parent.hidden = filterLightMapOffset();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:lightMapOffset', fieldLightMapOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldLightMapTiling = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'vec2',
            name: 'Tiling',
            placeholder: ['U', 'V'],
            link: assets,
            path: 'data.lightMapTiling'
        });
        var filterLightMapTiling = function () {
            return fieldLightMap.parent.hidden || (!fieldLightMap.value && !fieldLightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldLightMapTiling[0].parent,
            tiling: fieldLightMapTiling,
            filter: filterLightMapTiling,
            path: 'data.lightMapTiling'
        });
        fieldLightMapTiling[0].parent.hidden = filterLightMapTiling();
        // reference
        editor.call('attributes:reference:attach', 'asset:material:lightMapTiling', fieldLightMapTiling[0].parent.innerElement.firstChild.ui);

        // vertex color
        var fieldLightVertexColor = editor.call('attributes:addField', {
            parent: panelLightMap,
            name: 'Vertex Color',
            type: 'checkbox',
            link: assets,
            path: 'data.lightMapVertexColor'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:lightMapVertexColor', fieldLightVertexColor.parent.innerElement.firstChild.ui);

        // render states
        var panelRenderStates = texturePanels.states = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['states'],
            name: 'Other'
        });
        panelRenderStates.class.add('component');
        panelRenderStates.on('fold', function () { panelState['states'] = true; });
        panelRenderStates.on('unfold', function () { panelState['states'] = false; });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:other', panelRenderStates, panelRenderStates.headerElement);


        // depth
        var fieldDepthTest = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'checkbox',
            name: 'Depth',
            link: assets,
            path: 'data.depthTest'
        });
        // label
        var label = new ui.Label({ text: 'Test' });
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldDepthTest.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:depthTest', label);


        // depthWrite
        var fieldDepthWrite = editor.call('attributes:addField', {
            panel: fieldDepthTest.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.depthWrite'
        })
        // label
        var label = new ui.Label({ text: 'Write' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldDepthTest.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:depthWrite', label);


        // culling
        var fieldCull = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'None' },
                { v: 1, t: 'Back Faces' },
                { v: 2, t: 'Front Faces' }
            ],
            name: 'Cull Mode',
            link: assets,
            path: 'data.cull'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:material:cull', fieldCull.parent.innerElement.firstChild.ui);


        // useFog
        var fieldUseFog = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'checkbox',
            name: 'Use',
            link: assets,
            path: 'data.useFog'
        });
        // label
        var label = new ui.Label({ text: 'Fog' });
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldUseFog.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:useFog', fieldUseFog.parent.innerElement.firstChild.ui);

        // useLighting
        var fieldUseLighting = editor.call('attributes:addField', {
            panel: fieldUseFog.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.useLighting'
        });
        // label
        var label = new ui.Label({ text: 'Lighting' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldUseLighting.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:useLighting', fieldUseLighting.parent.innerElement.firstChild.ui);


        // useSkybox
        var fieldUseLighting = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'checkbox',
            name: ' ',
            link: assets,
            path: 'data.useSkybox'
        });
        // label
        var label = new ui.Label({ text: 'Skybox' });
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldUseLighting.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:useSkybox', fieldUseLighting.parent.innerElement.firstChild.ui);

        // useGammaTonemap
        var fieldUseGammaTonemap = editor.call('attributes:addField', {
            panel: fieldUseLighting.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.useGammaTonemap'
        });
        // label
        var label = new ui.Label({ text: 'Gamma & Tonemap' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldUseGammaTonemap.parent.append(label);
        // reference
        editor.call('attributes:reference:attach', 'asset:material:useGammaTonemap', fieldUseGammaTonemap.parent.innerElement.firstChild.ui);


        // attach change event on tiling / offset fields
        // to set initial value if it doesn't exist
        tilingOffsetFields.forEach(function (item) {
            var field = item.tiling || item.offset;
            var onChange = function () {
                var path = item.path;
                for (var i = 0, len = assets.length; i < len; i++) {
                    if (missingPaths[assets[i].get('id') + '.' + path]) {
                        assets[i].set(path, [field[0].value, field[1].value]);
                        delete missingPaths[assets[i].get('id') + '.' + path];
                    }
                }
            };

            // make sure our change event is first otherwise
            // sharedb will complain that we can't insert a value on
            // a list that does not exist
            field[0]._events.change.splice(0, 0, onChange);
            field[1]._events.change.splice(0, 0, onChange);
        });
    });
});
