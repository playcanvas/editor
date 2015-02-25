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
        editor.call('attributes:addField', {
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
        previewPanel.class.add('cubemap-viewport');


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

            // on face click
            face.addEventListener('click', function() {

                var texture = asset.get('data.textures.' + ind);
                editor.call('picker:asset', 'texture', texture);

                var evtPick = editor.once('picker:asset', function(texture) {
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

            // clear button
            var faceClear = document.createElement('div');
            faceClear.classList.add('clear');
            face.appendChild(faceClear);

            // on clear click
            faceClear.addEventListener('click', function(evt) {
                evt.stopPropagation();
                asset.set('data.textures.' + ind, null);
                face.classList.add('empty');
            }, false);

            // load texture asset
            setTexture(face, asset.get('data.textures.' + ind));

            // bind to changes
            face.evt = asset.on('data.textures.' + ind + ':set', function(value) {
                setTexture(face, value);
            });
        }

        // create all faces
        for(var i = 0; i < side.length; i++)
            createFace(side[i]);

        // on destroy
        previewPanel.on('destroy', function() {
            // unbind events
            for(var i = 0; i < faces.length; i++)
                faces[i].evt.unbind();
        });
    });
});
