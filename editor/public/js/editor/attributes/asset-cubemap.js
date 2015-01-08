editor.once('load', function() {
    'use strict';


    var canvas = document.createElement('canvas');
    // previewPanel.append(canvas);

    canvas.style.backgroundColor = '#000';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.minHeight = '32px';

    var imageSize = 32;

    var canvasResize = function() {
        imageSize = Math.floor(canvas.clientWidth / 4);
        canvas.width = imageSize * 4;
        canvas.height = imageSize * 3;
    };

    var ctx = canvas.getContext('2d');
    var images = [ ];

    var draw = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(var i = 0; i < 6; i++) {
            ctx.drawImage(images[i], positions[i][0] * imageSize, positions[i][1] * imageSize, imageSize, imageSize);
        }
    };

    for(var i = 0; i < 6; i++) {
        images[i] = new Image();
        images[i].onload = draw;
    }

    var positions = {
        0: [ 2, 1 ],
        1: [ 0, 1 ],
        2: [ 1, 0 ],
        3: [ 1, 2 ],
        4: [ 1, 1 ],
        5: [ 3, 1 ]
    };

    var canvasLoadImages = function(asset) {
        for(var i = 0; i < 6; i++) {
            var id = asset.get('data.textures.' + i);
            if (! id) continue;

            var texture = editor.call('assets:get', id);
            if (! texture || texture.type !== 'texture' || ! texture.get('file.url'))
                continue;

            images[i].src = config.url.api + '/' + texture.get('file.url');
        }
    };

    var canvasReloadImage = function(i, id) {
        images[i].src = '';
        var texture = editor.call('assets:get', id);
        if (! texture || texture.type !== 'texture' || ! texture.get('file.url'))
            return;
        images[i].src = config.url.api + '/' + texture.get('file.url');
    };


    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'cubemap')
            return;

        var asset = assets[0];


        // properties panel
        var paramsPanel = editor.call('attributes:addPanel');


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

        console.log(asset.data.minFilter);

        // data > ui
        var updateMinMip = function(value) {
            fieldMinFilter.value = [ 1, 4, 5 ].indexOf(value) === -1 ? 0 : 1;
            fieldMipFilter.value = (value < 2) ? 0 : (value % 2 + 1);
        };
        asset.on('data.minFilter:set', updateMinMip);
        updateMinMip(asset.data.minFilter);

        // ui > data
        var updateAssetMinMip = function() {
            var a = fieldMinFilter.value;
            var b = fieldMipFilter.value;
            asset.data.minFilter = (a && b) ? (2 + a + b) : (b ? (1 + b) : a);
        };
        fieldMinFilter.on('change', updateAssetMinMip);
        fieldMipFilter.on('change', updateAssetMinMip);

        // clear binding
        paramsPanel.on('destroy', function() {
            asset.unbind('data.minFilter:set', updateMinMip);
        });


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


        // textures
        var texturesPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Textures'
        });


        // pos_x
        var fieldPosX = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Right',
            link: asset,
            path: 'data.textures.0'
        });

        // neg_x
        var fieldNegX = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Left',
            link: asset,
            path: 'data.textures.1'
        });

        // pos_y
        var fieldPosY = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Top',
            link: asset,
            path: 'data.textures.2'
        });

        // pos_x
        var fieldNegY = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Bottom',
            link: asset,
            path: 'data.textures.3'
        });

        // pos_z
        var fieldPosZ = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Front',
            link: asset,
            path: 'data.textures.4'
        });

        // neg_z
        var fieldNegZ = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Back',
            link: asset,
            path: 'data.textures.5'
        });


        // preview
        var previewPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Preview'
        });


        previewPanel.on('destroy', function() {
            asset.unbind('*:set', reloadImage);

            if (! canvas.parentNode)
                return;

            canvas.parentNode.removeChild(canvas);
        });

        previewPanel.append(canvas);
        canvasResize();
        canvasLoadImages(asset);
        draw();

        var reloadImage = function(path, value) {
            if (path.indexOf('data.textures.') !== 0)
                return;

            var ind = parseInt(path.slice('data.textures.'.length), 10);
            canvasReloadImage(ind, value);
            draw();
        };
        asset.on('*:set', reloadImage);




        // var posX = asset.get('data.textures.0');
        // if (posX) {
        //     assetPosX = editor.call('assets:get', posX);
        //     if (assetPosX) {
        //         var url = assetPosX.get('file.url');
        //         var imgPosX =
        //     }
        // }



        // // preview
        // var image = editor.call('attributes:addField', {
        //     parent: previewPanel,
        //     type: 'image',
        //     src: config.url.api + '/' + asset.file.url
        // });

        // image.style.backgroundImage = 'url("/editor/img/asset-placeholder-texture.png")';
        // image.style.backgroundRepeat = 'repeat';
        // image.style.margin = '0 auto';

        // image.onload = function() {
        //     fieldDimensions.text = image.naturalWidth + ' x ' + image.naturalHeight;
        // };

        // pos_x
        // neg_x
        // pos_y
        // neg_y
        // pos_z
        // neg_z
    });
});
