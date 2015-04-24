editor.once('load', function () {

    var canvas = document.createElement('canvas');

    var placeholder = document.createElement('img');
    placeholder.src = '/editor/scene/img/asset-placeholder-texture.png';

    var assets = editor.call('preview:assetRegistry');

    editor.method('preview:render:cubemap', function (asset, size, callback) {
        var textures = asset.get('data.textures');

        var images = [];
        var requests = [];

        for (var i = 0; i < textures.length; i++) {
            var id = parseInt(textures[i], 10);
            var img = placeholder;
            if (id >= 0) {
                var textureAsset = assets.getAssetById(id);
                if (textureAsset) {
                    if (textureAsset.resource) {
                        img = textureAsset.resource.getSource();
                    } else {
                        requests.push(textureAsset);
                        img = null;
                    }
                }
            }

            images.push(img);
        }

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
        };

        if (requests.length) {
            assets.load(requests).then(function (resources) {
                var j = 0;
                for (var i = 0; i < images.length; i++) {
                    if (images[i] === null) {
                        images[i] = resources[j++].getSource();
                    }
                }

                onLoaded();
            });
        } else {
            onLoaded();
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
