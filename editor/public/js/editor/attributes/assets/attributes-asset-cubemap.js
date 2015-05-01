editor.once('load', function() {
    'use strict';


    editor.on('attributes:inspect[asset]', function(assets) {
        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'cubemap')
                return;
        }

        // properties panel
        var paramsPanel = editor.call('attributes:addPanel', {
            name: 'CubeMap'
        });
        paramsPanel.class.add('component');
        // reference
        editor.call('attributes:reference:asset:cubemap:asset:attach', paramsPanel, paramsPanel.headerElement);



        // filtering
        var fieldFiltering = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Filtering',
            type: 'string',
            enum: {
                '': '...',
                'nearest': 'Point',
                'linear': 'Linear'
            }
        });
        // reference
        editor.call('attributes:reference:asset:texture:filtering:attach', fieldFiltering.parent.innerElement.firstChild.ui);

        var isPrefiltered = false;
        for(var i = 0; i < assets.length; i++) {
            if (!! assets[i].get('file')) {
                isPrefiltered = true;
                break;
            }
        }
        if (isPrefiltered)
            fieldFiltering.disabled = true;

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
            parent: paramsPanel,
            name: 'Anisotropy',
            type: 'number',
            link: assets,
            path: 'data.anisotropy'
        });
        if (isPrefiltered)
            fieldAnisotropy.disabled = true;
        // reference
        editor.call('attributes:reference:asset:cubemap:anisotropy:attach', fieldAnisotropy.parent.innerElement.firstChild.ui);



        if (assets.length === 1) {
            // preview
            var previewPanel = editor.call('attributes:addPanel', {
                name: 'Preview'
            });
            previewPanel.class.add('cubemap-viewport', 'component');
            // reference
            editor.call('attributes:reference:asset:cubemap:slots:attach', previewPanel, previewPanel.headerElement);


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

            // set face texture
            var setTexture = function(face, assetId) {
                if (! assetId) {
                    face.style.backgroundImage = '';
                    face.classList.add('empty');
                } else {
                    var texture = editor.call('assets:get', assetId);
                    if (texture && texture.get('type') === 'texture' && (texture.get('thumbnails.l') || texture.get('file.url'))) {
                        face.classList.remove('empty');
                        face.style.backgroundImage = 'url("' + config.url.home + '/' + (texture.get('thumbnails.l') || texture.get('file.url')) + '")';
                    } else {
                        face.classList.add('empty');
                        face.style.backgroundImage = '';
                    }
                }
            };

            var setAssetFace = function (face, texture) {
                var prevFace = assets[0].get('data.textures.' + face);
                var assetId = assets[0].get('id');
                var textureId = texture ? texture.get('id') : null;

                var setRgbmIfNeeded = function (asset) {
                    var hdrTextures = asset.get('data.textures').filter(function (id) {
                        var texture = editor.call('assets:get', id);
                        return texture && texture.get('data.rgbm');
                    });

                    if (hdrTextures.length === 6) {
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
                    editor.call('picker:asset', 'texture', texture);

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

                        setAssetFace(ind, editor.call('assets:get', data.id));
                    }
                });
                previewPanel.on('destroy', function() {
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
                    prefilterPanel.hidden = !hasAllTextures();
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
            editor.call('attributes:reference:asset:cubemap:prefilter:attach', prefilterPanel, prefilterPanel.headerElement);

            // prefilter button
            var prefilterBtn = new ui.Button({
                text: 'Prefilter',
            });

            prefilterPanel.append(prefilterBtn);

            prefilterBtn.on('click', function () {
                // disable while prefiltering
                prefilterBtn.disabled = true;
                editor.call('assets:cubemaps:prefilter', assets[0], function () {
                    // re-enable button
                    prefilterBtn.disabled = false;
                }, function (error) {
                    prefilterBtn.disabled = false;
                    editor.call('status:error', error);
                });
            });

            // delete prefiltered data button
            var clearPrefilteredBtn = new ui.Button({
                text: 'Delete Prefiltered Data',
            });

            prefilterPanel.append(clearPrefilteredBtn);

            var clearPrefiltered = function () {
                var history = assets[0].history.enabled;
                assets[0].history.enabled = false;
                assets[0].set('file', null);
                assets[0].history.enabled = history;
            };

            clearPrefilteredBtn.on('click', clearPrefiltered);

            var evtFileChange = assets[0].on('file:set', function (value) {
                togglePrefilterFields(!!value);
            });

            prefilterPanel.once('destroy', function () {
                evtFileChange.unbind();
            });

            var hasAllTextures = function () {
                var textures = assets[0].get('data.textures');
                if (textures && textures.length === 6) {
                    for (var i = 0; i < 6; i++) {
                        if (isNaN(parseInt(textures[i], 10) )) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            };

            // show prefilter button or clear prefiltering button depending
            // on current cubemap 'file' field
            var togglePrefilterFields = function (isPrefiltered) {
                prefilterPanel.hidden = !hasAllTextures();
                prefilterBtn.hidden = isPrefiltered;
                clearPrefilteredBtn.hidden = !isPrefiltered;

                fieldFiltering.disabled = isPrefiltered;
                fieldAnisotropy.disabled = isPrefiltered;
            };

            togglePrefilterFields(!!assets[0].get('file'));
        }
    });
});
