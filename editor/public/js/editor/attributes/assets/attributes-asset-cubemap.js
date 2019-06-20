editor.once('load', function() {
    'use strict';


    editor.on('attributes:inspect[asset]', function(assets) {
        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'cubemap')
                return;
        }

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' CubeMaps');

        var root = editor.call('attributes.rootPanel');

        if (assets.length === 1) {
            var previewContainer = new pcui.Container();
            previewContainer.class.add('asset-preview-container');

            var preview = document.createElement('canvas');
            var ctx = preview.getContext('2d');
            preview.width = 256;
            preview.height = 256;
            preview.classList.add('asset-preview', 'flipY');
            previewContainer.append(preview);

            var mipLevel = 0;

            var mipSelector = new ui.SelectField({
                type: 'number',
                options: [
                    { v: 0, t: '1' },
                    { v: 1, t: '2' },
                    { v: 2, t: '3' },
                    { v: 3, t: '4' },
                    { v: 4, t: '5' }
                ]
            });
            mipSelector.value = 0;
            mipSelector.class.add('cubeMapMipLevel');
            previewContainer.append(mipSelector);
            mipSelector.parent = panelParams;
            mipSelector.hidden = ! assets[0].get('file');

            mipSelector.on('change', function(value) {
                mipLevel = value;
                queueRender();
            });

            var sx = 0, sy = 0, x = 0, y = 0, nx = 0, ny = 0;
            var dragging = false;
            var previewRotation = [ 0, 0 ];

            preview.addEventListener('mousedown', function(evt) {
                if (evt.button !== 0)
                    return;

                evt.preventDefault();
                evt.stopPropagation();

                sx = x = evt.clientX;
                sy = y = evt.clientY;

                dragging = true;
            }, false);

            var onMouseMove = function(evt) {
                if (! dragging)
                    return;

                nx = x - evt.clientX;
                ny = y - evt.clientY;
                x = evt.clientX;
                y = evt.clientY;

                queueRender();
            };

            var onMouseUp = function(evt) {
                if (! dragging)
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
                    rotation: [ Math.max(-90, Math.min(90, previewRotation[0] + (sy - y) * 0.3)), previewRotation[1] + (sx - x) * 0.3 ],
                    mipLevel: mipLevel
                });
            };
            renderPreview();

            // queue up the rendering to prevent too oftern renders
            var queueRender = function() {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            // render on resize
            var evtPanelResize = root.on('resize', queueRender);
            var evtSceneSettings = editor.on('preview:scene:changed', queueRender);

            // cubemap textures loaded
            var cubemapWatch = editor.call('assets:cubemap:watch', {
                asset: assets[0],
                autoLoad: true,
                callback: queueRender
            });
        }


        // properties panel
        var panelParams = editor.call('attributes:addPanel', {
            name: 'CubeMap'
        });
        panelParams.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:cubemap:asset', panelParams, panelParams.headerElement);

        if (assets.length === 1) {
            panelParams.on('destroy', function() {
                root.class.remove('asset-preview');

                editor.call('assets:cubemap:unwatch', assets[0], cubemapWatch);

                evtSceneSettings.unbind();
                evtPanelResize.unbind();

                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            });
        }


        // filtering
        var fieldFiltering = editor.call('attributes:addField', {
            parent: panelParams,
            name: 'Filtering',
            type: 'string',
            enum: {
                '': '...',
                'nearest': 'Point',
                'linear': 'Linear'
            }
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:texture:filtering', fieldFiltering.parent.innerElement.firstChild.ui);

        var isPrefiltered = false;
        for(var i = 0; i < assets.length; i++) {
            if (!! assets[i].get('file')) {
                isPrefiltered = true;
                break;
            }
        }

        var changingFiltering = false;

        var updateFiltering = function() {
            var value = '';
            var valueDifferent = false;
            var filter = assets[0].get('data.minFilter') + '_' + assets[0].get('data.magFilter');

            for(var i = 1; i < assets.length; i++) {
                if (filter !== (assets[i].get('data.minFilter') + '_' + assets[i].get('data.magFilter'))) {
                    valueDifferent = true;
                    break;
                }
            }

            if (! valueDifferent) {
                if (assets[0].get('data.minFilter') === 5 && assets[0].get('data.magFilter') === 1) {
                    value = 'linear';
                } else if (assets[0].get('data.minFilter') === 2 && assets[0].get('data.magFilter') === 0) {
                    value = 'nearest';
                }
            }

            if (! valueDifferent && value) {
                fieldFiltering.optionElements[''].style.display = 'none';
            } else {
                fieldFiltering.optionElements[''].style.display = '';
            }

            changingFiltering = true;
            fieldFiltering.value = value;
            changingFiltering = false;
        };
        updateFiltering();

        fieldFiltering.on('change', function(value) {
            if (changingFiltering)
                return;

            var values = [ ];
            var valueMin = value === 'nearest' ? 2 : 5;
            var valueMag = value === 'nearest' ? 0 : 1;

            changingFiltering = true;
            for(var i = 0; i < assets.length; i++) {
                values.push({
                    id: assets[i].get('id'),
                    valueMin: assets[i].get('data.minFilter'),
                    valueMag: assets[i].get('data.magFilter')
                });
                assets[i].history.enabled = false;
                assets[i].set('data.minFilter', valueMin);
                assets[i].set('data.magFilter', valueMag);
                assets[i].history.enabled = true;
            }
            changingFiltering = false;

            fieldFiltering.optionElements[''].style.display = 'none';

            // history
            editor.call('history:add', {
                name: 'assets.filtering',
                undo: function() {
                    for(var i = 0; i < values.length; i++) {
                        var asset = editor.call('assets:get', values[i].id);
                        if (! asset)
                            continue;

                        asset.history.enabled = false;
                        asset.set('data.minFilter', values[i].valueMin);
                        asset.set('data.magFilter', values[i].valueMag);
                        asset.history.enabled = true;
                    }
                },
                redo: function() {
                    for(var i = 0; i < values.length; i++) {
                        var asset = editor.call('assets:get', values[i].id);
                        if (! asset)
                            continue;

                        asset.history.enabled = false;
                        asset.set('data.minFilter', valueMin);
                        asset.set('data.magFilter', valueMag);
                        asset.history.enabled = true;
                    }
                }
            });
        });

        var eventsFiltering = [ ];
        var changingQueued = false;
        var changedFiltering = function() {
            if (changingQueued || changingFiltering)
                return;

            changingQueued = true;
            setTimeout(function() {
                changingQueued = false;
                updateFiltering();
            }, 0);
        };
        for(var i = 0; i < assets.length; i++) {
            eventsFiltering.push(assets[i].on('data.minFilter:set', changedFiltering));
            eventsFiltering.push(assets[i].on('data.magFilter:set', changedFiltering));
        }
        fieldFiltering.once('destroy', function() {
            for(var i = 0; i < eventsFiltering.length; i++) {
                eventsFiltering[i].unbind();
            }
        });



        // anisotropy
        var fieldAnisotropy = editor.call('attributes:addField', {
            parent: panelParams,
            name: 'Anisotropy',
            type: 'number',
            link: assets,
            path: 'data.anisotropy'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:cubemap:anisotropy', fieldAnisotropy.parent.innerElement.firstChild.ui);


        if (assets.length === 1) {
            // preview
            var previewPanel = editor.call('attributes:addPanel', {
                name: 'Faces'
            });
            previewPanel.class.add('cubemap-viewport', 'component');
            // reference
            editor.call('attributes:reference:attach', 'asset:cubemap:slots', previewPanel, previewPanel.headerElement);


            var downloadButton = previewPanel.parent.dom.querySelector('.ui-panel.buttons > .content > .ui-button.download-asset');
            if (downloadButton)
                downloadButton = downloadButton.ui;

            // error
            var labelError = new ui.Label({
                text: 'error'
            });
            labelError.class.add('asset-loading-error');
            labelError.hidden = true;
            editor.call('attributes.rootPanel').append(labelError);


            // faces
            var sides = {
                2: 'top',
                1: 'left',
                4: 'front',
                0: 'right',
                5: 'back',
                3: 'bottom'
            };
            var side = [ 2, 1, 4, 0, 5, 3 ];
            var faces = [ ];

            var checkValid = function() {
                var invalid = invalidFaces();

                if (invalid)
                    labelError.text = invalid;

                labelError.hidden = ! invalid;

                if (downloadButton) {
                    downloadButton.disabled = !! invalid;
                    downloadButton.prevent = !! invalid;
                }
            };

            var invalidFaces = function() {
                var faces = assets[0].get('data.textures');

                if (! (faces instanceof Array))
                    return 'missing faces information';

                for(var i = 0; i < 6; i++) {
                    if (! faces[i])
                        return 'set face textures';
                }

                var width = 0;
                var height = 0;

                for(var i = 0; i < 6; i++) {
                    var asset = editor.call('assets:get', faces[i]);
                    if (! asset)
                        return 'missing face asset';

                    if (! asset.has('meta.width') || ! asset.has('meta.height'))
                        return 'no texture resolution data available';

                    var w = asset.get('meta.width');
                    var h = asset.get('meta.height');

                    if ((w & (w - 1)) !== 0 || (h & (h - 1)) !== 0)
                        return 'face textures should have power of two resolution';

                    if (w !== h)
                        return 'face textures should have square resolution';

                    if (i === 0) {
                        width = w;
                        height = h;
                    } else {
                        if (width !== w || height !== h)
                            return 'face textures should have same resolution';
                    }
                }

                return false;
            };

            var watchingAssets = [ null, null, null, null, null, null ];

            var makeThumbnailUrl = function(asset) {
                var url = config.url.home + '/' + (asset.get('thumbnails.l') || asset.get('file.url'));
                url = url.appendQuery('t=' + asset.get('file.hash'));
                return url;
            };

            // set face texture
            var setTexture = function(face, assetId) {
                if (watchingAssets[face.ind]) {
                    watchingAssets[face.ind].unbind();
                    watchingAssets[face.ind] = null;
                }

                if (! assetId) {
                    face.style.backgroundImage = '';
                    face.classList.add('empty');
                } else {
                    var texture = editor.call('assets:get', assetId);

                    if (texture && texture.get('type') === 'texture' && ! texture.get('source')) {
                        watchingAssets[face.ind] = texture.on('thumbnails:set', function() {
                            face.classList.remove('empty');
                            face.style.backgroundImage = 'url("' + makeThumbnailUrl(texture) + '")';
                        });
                    }

                    if (texture && texture.get('type') === 'texture' && (texture.get('thumbnails.l') || texture.get('file.url'))) {
                        face.classList.remove('empty');
                        face.style.backgroundImage = 'url("' + makeThumbnailUrl(texture) + '")';
                    } else {
                        face.classList.add('empty');
                        face.style.backgroundImage = '';
                    }
                }
            };

            var setAssetFace = function (face, texture) {
                var prevFace = assets[0].get('data.textures.' + face);
                var assetId = assets[0].get('id');
                var textureId = texture ? parseInt(texture.get('id'), 10) : null;

                var setRgbmIfNeeded = function (asset) {
                    var allHdr = true;
                    var textures = asset.get('data.textures');
                    for (var i = 0; i < textures.length; i++) {
                        if (textures[i] >= 0) {
                            var texture = editor.call('assets:get', textures[i]);
                            if (texture && !texture.get('data.rgbm')) {
                                allHdr = false;
                                break;
                            }
                        }
                    }

                    if (allHdr)  {
                        asset.set('data.rgbm', true);
                    } else {
                        asset.unset('data.rgbm');
                    }
                };

                var action = {
                    name: 'asset.' + assetId + '.face.' + face,
                    combine: false,
                    undo: function () {
                        var a = editor.call('assets:get', assetId);
                        if (!a) return;

                        var history = a.history.enabled;
                        a.history.enabled = false;
                        a.set('data.textures.' + face, prevFace);
                        setRgbmIfNeeded(a);
                        a.history.enabled = history;
                    },
                    redo: function () {
                        var a = editor.call('assets:get', assetId);
                        if (!a) return;

                        var history = a.history.enabled;
                        a.history.enabled = false;
                        a.set('data.textures.' + face, textureId);
                        // invalidate prefiltered data
                        // if (a.get('file')) a.set('file', null)
                        setRgbmIfNeeded(a);
                        a.history.enabled = history;
                    }
                };

                action.redo();

                assets[0].history.emit('record', 'add', action);
            };

            // create eface
            var createFace = function(ind) {
                // create face element
                var face = faces[ind] = document.createElement('div');
                face.ind = ind;
                face.classList.add('face', 'face-' + sides[ind]);
                previewPanel.append(face);

                var name = document.createElement('div');
                name.classList.add('face-name');
                name.innerHTML = sides[ind];
                face.appendChild(name);

                // on face click
                face.addEventListener('click', function() {
                    if (! editor.call('permissions:write'))
                        return;

                    var texture = editor.call('assets:get', assets[0].get('data.textures.' + ind));
                    editor.call('picker:asset', {
                        type: 'texture',
                        currentAsset: texture
                    });

                    var evtPick = editor.once('picker:asset', function(texture) {
                        // clear prefiltered data
                        setAssetFace(ind, texture);
                        evtPick = null;
                    });

                    editor.once('picker:asset:close', function() {
                        if (evtPick) {
                            evtPick.unbind();
                            evtPick = null;
                        }
                    });
                }, false);

                var dropRef = editor.call('drop:target', {
                    ref: face,
                    type: 'asset.texture',
                    drop: function(type, data) {
                        if (type !== 'asset.texture')
                            return;

                        var asset = editor.call('assets:get', parseInt(data.id, 10));

                        // try matching patterns of texture names
                        // to autoset  all 6 faces for empty cubemaps
                        try {
                            var empty = true;
                            var faces = assets[0].get('data.textures');
                            for(var i = 0; i < faces.length; i++) {
                                if (faces[i]) {
                                    empty = false;
                                    break;
                                }
                            }

                            if (empty) {
                                var name = asset.get('name');
                                var check = /((neg|pos)(x|y|z)|(right|left|top|up|bottom|down|front|forward|back|backward)|[0-6])(\.|$)/i;
                                var match = name.match(check);

                                if (match != null) {
                                    match = match.index;

                                    var part = '';
                                    if (match) part = name.slice(0, match).toLowerCase();
                                    var i = name.indexOf('.', match);
                                    if (i > 0) part += name.slice(i);

                                    var sort = {
                                        '0': 0,
                                        'posx': 0,
                                        'right': 0,

                                        '1': 1,
                                        'negx': 1,
                                        'left': 1,

                                        '2': 2,
                                        'posy': 2,
                                        'top': 2,
                                        'up': 2,

                                        '3': 3,
                                        'negy': 3,
                                        'bottom': 3,
                                        'down': 3,

                                        '4': 4,
                                        'posz': 4,
                                        'front': 4,
                                        'forward': 4,

                                        '5': 5,
                                        'negz': 5,
                                        'back': 5,
                                        'backward': 5,

                                        '6': 6,
                                    };
                                    var faceAssets = editor.call('assets:find', function(a) {
                                        if (a.get('source') || a.get('type') !== 'texture')
                                            return;

                                        if (! a.get('path').equals(asset.get('path')))
                                            return;

                                        if (a.get('meta.width') !== asset.get('meta.width') || a.get('meta.height') !== asset.get('meta.height'))
                                            return;

                                        var name = a.get('name').toLowerCase();
                                        var m = name.match(check);

                                        if (m === null)
                                            return;

                                        m = m.index;

                                        var p = '';
                                        if (m) p = name.slice(0, m).toLowerCase();
                                        var i = name.indexOf('.', m);
                                        if (i > 0) p += name.slice(i);

                                        return p === part;
                                    });

                                    if (faceAssets.length === 6) {
                                        var allFaces = [ ];

                                        for(var i = 0; i < faceAssets.length; i++) {
                                            var p = faceAssets[i][1].get('name').toLowerCase();
                                            if (match) p = p.slice(match);
                                            var m = p.indexOf('.');
                                            if (m > 0) p = p.slice(0, m);

                                            faceAssets[i] = {
                                                asset: faceAssets[i][1],
                                                face: sort[p]
                                            }
                                        }

                                        faceAssets.sort(function(a, b) {
                                            return a.face - b.face;
                                        });


                                        for(var i = 0; i < faceAssets.length; i++)
                                            setAssetFace(i, faceAssets[i].asset);

                                        return;
                                    }
                                }
                            }
                        } catch(ex) {
                            console.error(ex.message);
                            console.error(ex.stack);
                        }

                        setAssetFace(ind, asset);
                    }
                });
                previewPanel.on('destroy', function() {
                    for(var i = 0; i < watchingAssets.length; i++) {
                        if (! watchingAssets[i])
                            continue;

                        watchingAssets[i].unbind();
                        watchingAssets[i] = null;
                    }
                    dropRef.unregister();
                });

                // clear button
                var faceClear = document.createElement('div');
                faceClear.classList.add('clear');
                face.appendChild(faceClear);

                // on clear click
                faceClear.addEventListener('click', function(evt) {
                    if (! editor.call('permissions:write'))
                        return;

                    evt.stopPropagation();
                    setAssetFace(ind, null);
                    face.classList.add('empty');
                }, false);

                // load texture asset
                setTexture(face, assets[0].get('data.textures.' + ind));

                // bind to changes
                face.evt = assets[0].on('data.textures.' + ind + ':set', function(value) {
                    clearPrefiltered();
                    setTexture(face, value);
                    prefilterPanel.hidden = !! invalidFaces();
                    checkValid();
                });
            };

            // create all faces
            for(var i = 0; i < side.length; i++)
                createFace(side[i]);

            // on destroy
            previewPanel.on('destroy', function() {
                // unbind events
                for(var i = 0; i < faces.length; i++)
                    faces[i].evt.unbind();
            });


            // prefiltering
            var prefilterPanel = editor.call('attributes:addPanel', {
                name: 'Prefiltering'
            });
            prefilterPanel.class.add('component');
            // reference
            editor.call('attributes:reference:attach', 'asset:cubemap:prefilter', prefilterPanel, prefilterPanel.headerElement);

            // prefilter button
            var prefilterBtn = new ui.Button({
                text: 'Prefilter',
            });

            prefilterPanel.append(prefilterBtn);

            prefilterBtn.on('click', function () {
                // disable while prefiltering
                prefilterBtn.disabled = true;
                editor.call('assets:cubemaps:prefilter', assets[0], function (err) {
                    // re-enable button
                    if (err)
                        return editor.call('status:error', err);

                    prefilterBtn.disabled = true;
                });
            });

            // delete prefiltered data button
            var clearPrefilteredBtn = new ui.Button({
                text: 'Delete Prefiltered Data',
            });

            prefilterPanel.append(clearPrefilteredBtn);

            var clearPrefiltered = function () {
                editor.call('realtime:send', 'cubemap:clear:', parseInt(assets[0].get('uniqueId'), 10));
            };

            clearPrefilteredBtn.on('click', clearPrefiltered);

            var evtFileChange = assets[0].on('file:set', function (value) {
                prefilterBtn.disabled = false;

                if (mipSelector)
                    mipSelector.hidden = ! value;

                if (queueRender)
                    queueRender();

                togglePrefilterFields(!! value);
            });

            prefilterPanel.once('destroy', function () {
                evtFileChange.unbind();
            });


            // show prefilter button or clear prefiltering button depending
            // on current cubemap 'file' field
            var togglePrefilterFields = function (isPrefiltered) {
                prefilterPanel.hidden = !! invalidFaces();
                prefilterBtn.hidden = isPrefiltered;
                prefilterBtn.disabled = !! assets[0].get('task');
                clearPrefilteredBtn.hidden = ! isPrefiltered;
            };

            togglePrefilterFields(!!assets[0].get('file'));
            checkValid();
        }
    });
});
