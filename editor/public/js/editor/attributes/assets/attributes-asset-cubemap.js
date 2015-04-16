editor.once('load', function() {
    'use strict';


    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'cubemap')
            return;

        var asset = assets[0];


        // properties panel
        var paramsPanel = editor.call('attributes:addPanel', {
            name: 'Properties'
        });
        paramsPanel.class.add('component');


        // minFilter
        var fieldMinFilter = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'number',
            enum: {
                0: 'Nearest',
                1: 'Linear'
            },
            name: 'Min Filter'
        });
        fieldMinFilter.renderChanges = false;


        // mipFilter
        var fieldMipFilter = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'number',
            enum: {
                0: 'None',
                1: 'Nearest',
                2: 'Linear'
            },
            name: 'Mip Filter'
        });
        fieldMipFilter.renderChanges = false;

        // data > ui
        var evtUpdateMinMip = asset.on('data.minFilter:set', function(value) {
            fieldMinFilter.value = [ 1, 4, 5 ].indexOf(value) === -1 ? 0 : 1;
            fieldMipFilter.value = (value < 2) ? 0 : (value % 2 + 1);
        });
        evtUpdateMinMip.call(asset.get('data.minFilter'));

        // ui > data
        var updateAssetMinMip = function() {
            var a = fieldMinFilter.value;
            var b = fieldMipFilter.value;
            asset.set('data.minFilter', (a && b) ? (2 + a + b) : (b ? (1 + b) : a));
        };
        fieldMinFilter.on('change', updateAssetMinMip);
        fieldMipFilter.on('change', updateAssetMinMip);

        fieldMinFilter.renderChanges = true;
        fieldMipFilter.renderChanges = true;


        // magFilter
        var fieldMagFilter = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'number',
            enum: {
                0: 'Nearest',
                1: 'Linear'
            },
            name: 'Mag Filter',
            link: asset,
            path: 'data.magFilter'
        });


        // anisotropy
        var fieldAnisotropy = editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Anisotropy',
            type: 'number',
            link: asset,
            path: 'data.anisotropy'
        });


        // preview
        var previewPanel = editor.call('attributes:addPanel', {
            name: 'Preview'
        });
        previewPanel.class.add('cubemap-viewport', 'component');


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
                if (texture && texture.get('type') === 'texture' && texture.get('file.url')) {
                    face.classList.remove('empty');
                    face.style.backgroundImage = 'url("' + config.url.home + '/' + texture.get('file.url') + '")';
                } else {
                    face.classList.add('empty');
                    face.style.backgroundImage = '';
                }
            }
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

                var texture = editor.call('assets:get', asset.get('data.textures.' + ind));
                editor.call('picker:asset', 'texture', texture);

                var evtPick = editor.once('picker:asset', function(texture) {
                    // clear prefiltered data
                    asset.set('data.textures.' + ind, texture.get('id'));
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

                    // clear prefiltered data
                    asset.set('data.textures.' + ind, data.id);
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
                asset.set('data.textures.' + ind, null);
                face.classList.add('empty');
            }, false);

            // load texture asset
            setTexture(face, asset.get('data.textures.' + ind));

            // bind to changes
            face.evt = asset.on('data.textures.' + ind + ':set', function(value) {
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

        // prefilter button
        var prefilterBtn = new ui.Button({
            text: 'Prefilter',
        });

        prefilterPanel.append(prefilterBtn);

        prefilterBtn.on('click', function () {
            // disable while prefiltering
            prefilterBtn.disabled = true;
            editor.call('assets:cubemaps:prefilter', asset, function () {
                // re-enable button
                prefilterBtn.disabled = false;
            });
        });

        // delete prefiltered data button
        var clearPrefilteredBtn = new ui.Button({
            text: 'Delete Prefiltered Data',
        });

        prefilterPanel.append(clearPrefilteredBtn);

        var clearPrefiltered = function () {
            var history = asset.history.enabled;
            asset.history.enabled = false;
            asset.set('file', null);
            asset.history.enabled = history;
        };

        clearPrefilteredBtn.on('click', clearPrefiltered);

        var evtFileChange = asset.on('file:set', function (value) {
            togglePrefilterFields(!!value);
        });

        prefilterPanel.once('destroy', function () {
            evtFileChange.unbind();
        });

        var hasAllTextures = function () {
            var textures = asset.get('data.textures');
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

            fieldMinFilter.disabled = isPrefiltered;
            fieldMipFilter.disabled = isPrefiltered;
            fieldMagFilter.disabled = isPrefiltered;
            fieldAnisotropy.disabled = isPrefiltered;
        };

        togglePrefilterFields(!!asset.get('file'));

    });
});
