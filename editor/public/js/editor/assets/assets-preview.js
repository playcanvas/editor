editor.once('load', function () {

    // canvas user to render the preview
    var canvas = document.createElement('canvas');

    // set up graphics
    var device = new pc.GraphicsDevice(canvas);

    // create resource loader and asset registry
    var loader = new pc.ResourceLoader();
    var assets = new pc.AssetRegistry(loader, '/api');

    loader.addHandler("model", new pc.ModelHandler(device));
    loader.addHandler("material", new pc.MaterialHandler(assets));
    loader.addHandler("texture", new pc.TextureHandler(device, assets, loader));
    loader.addHandler("cubemap", new pc.CubemapHandler(device, assets, loader));

    // bind asset registry to editor
    editor.call('assets:registry:bind', assets, ['texture', 'cubemap', 'material', 'model']);

    var renderTimeouts = {};

    editor.method('preview:render', function (asset) {
        editor.call('preview:render:' + asset.get('type'), asset, 128, function (canvas) {
            var url = canvas.toDataURL('image/png');
            editor.call('preview:setThumbnail', asset, url);
            // editor.call('preview:setThumbnail', asset, 'thumbnails.m', url);
            // editor.call('preview:setThumbnail', asset, 'thumbnails.l', url);
            // editor.call('preview:setThumbnail', asset, 'thumbnails.xl', url);
        });
    });


    // renders preview for specified asset after a delay
    editor.method('preview:delayedRender', function (asset, delay) {
        var id = asset.get('id');
        if (renderTimeouts[id])
            clearTimeout(renderTimeouts[id]);

        renderTimeouts[id] = setTimeout(function () {
            editor.call('preview:render', asset);
            delete renderTimeouts[id];
        }, delay || 100);
    });

    // sets thumbnail to specified asset without syncing or recording history
    editor.method('preview:setThumbnail', function (asset, value) {
        var sync = asset.sync;
        asset.sync = false;

        var history = asset.history.enabled;
        asset.history.enabled = false;

        if (value) {
            asset.set('has_thumbnail', true);
            asset.set('thumbnails', {
                's': value,
                'm': value,
                'l': value,
                'xl': value
            });
        } else {
            asset.set('has_thumbnail', false);
            asset.unset('thumbnails');
        }

        asset.history.enabled = history;
        asset.sync = sync;
    });

    // Gets asset registry
    editor.method('preview:assetRegistry', function () {
        return assets;
    });

    editor.method('preview:device', function () {
        return device;
    });

    // Get necessary objects for a new preview scene
    editor.method('preview:prepare', function () {
        return {
            canvas: canvas,
            assets: assets,
            scene: new pc.Scene(),
            renderer: new pc.ForwardRenderer(device),
            device: device
        };
    });

});
