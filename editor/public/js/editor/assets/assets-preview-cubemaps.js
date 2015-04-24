editor.once('load', function () {

    var canvas = document.createElement('canvas');

    var placeHolderLoaded = false;
    var placeholder = document.createElement('img');
    placeholder.addEventListener('load', function () {
        placeHolderLoaded = true;
    });
    placeholder.src = '/editor/scene/img/asset-placeholder-texture.png';

    var assets = editor.call('preview:assetRegistry');

    editor.method('preview:render:cubemap', function (asset, size, callback) {
        var textures = asset.get('data.textures');

        // make sure placeholder image is loaded
        if (!placeHolderLoaded) {
            editor.call('preview:delayedRender', asset);
            return;
        }

        var images = [];
        var loadedImages = 0;

        var onLoaded = function () {
            if (canvas.width !== size) {
                canvas.width = size;
                canvas.height = size;
            }

            var width = size / 4;
            var height = size / 4;
            var offset = (size - height * 3) / 2;

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // left
            ctx.drawImage(images[1], 0, offset + height, width, height);
            // front
            ctx.drawImage(images[4], width, offset + height, width, height);
            // right
            ctx.drawImage(images[0], 2*width, offset + height, width, height);
            // back
            ctx.drawImage(images[5], 3*width, offset + height, width, height);
            // top
            ctx.drawImage(images[2], width, offset, width, height);
            // bottom
            ctx.drawImage(images[3], width, offset + 2*height, width, height);

            callback(canvas);

            images = null;
        };

        var onImageLoaded = function () {
            loadedImages++;
            if (loadedImages === 6) {
                onLoaded();
            }
        };

        for (var i = 0; i < textures.length; i++) {
            faceImagesLoaded = 0;
            var img = placeholder;

            var texture = editor.call('assets:get', textures[i]);

            if (texture && (texture.get('thumbnails.s') || texture.get('file.url'))) {
                img = new Image();
                img.addEventListener('load', onImageLoaded);

                // use small thumbnail or file if thumbnail not there
                img.src = (texture.get('thumbnails.s') || texture.get('file.url'));

                if (!texture.get('thumbnails.s')) {
                    // if thumbnail not there yet then re-render when it's ready
                    texture.once('thumbnails.s:set', function () {
                        editor.call('preview:delayedRender', asset);
                    });
                };
            }

            images.push(img);

            if (img === placeholder) {
                onImageLoaded();
            }
        }

    });

    editor.on('assets:add', function (asset) {
        if (asset.get('type') !== 'cubemap') return;

        // do this in a timeout to wait for all
        // assets to be added to the asset registry first
        setTimeout(function () {
            editor.call('preview:render', asset);
        }, 100);

        asset.on('*:set', function (path) {
            if (path.indexOf('data') === 0) {
                editor.call('preview:delayedRender', asset);
            }
        });
    });
});
