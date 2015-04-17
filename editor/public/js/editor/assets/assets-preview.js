editor.once('load', function () {

    // canvas user to render the preview
    var canvas = document.createElement('canvas');

    // set up graphics
    var device = new pc.GraphicsDevice(canvas);

    // create resource loader and asset registry
    var loader = new pc.resources.ResourceLoader();
    var assets = new pc.asset.AssetRegistry(loader, '/api');

    // register resource handlers
    loader.registerHandler(pc.resources.TextureRequest, new pc.resources.TextureResourceHandler(device, assets));
    loader.registerHandler(pc.resources.CubemapRequest, new pc.resources.CubemapResourceHandler(device, assets));
    loader.registerHandler(pc.resources.MaterialRequest, new pc.resources.MaterialResourceHandler(device, assets));
    loader.registerHandler(pc.resources.ModelRequest, new pc.resources.ModelResourceHandler(device, assets));

    // bind asset registry to editor
    editor.call('assets:registry:bind', assets, ['texture', 'cubemap', 'material', 'model']);

    var renderTimeouts = {};

    editor.method('preview:render', function (asset) {
        editor.call('preview:render:' + asset.get('type'), asset, 128, function (canvas) {
            var url = canvas.toDataURL();
            setThumbnail(asset, 'thumbnails.s', url);
            setThumbnail(asset, 'thumbnails.m', url);
            setThumbnail(asset, 'thumbnails.l', url);
            setThumbnail(asset, 'thumbnails.xl', url);
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
    var setThumbnail = function (asset, path, value) {
        var sync = asset.sync;
        asset.sync = false;

        var history = asset.history.enabled;
        asset.history.enabled = false;

        asset.set('has_thumbnail', true);
        asset.set(path, value);

        asset.history.enabled = history;
        asset.sync = sync;
    };

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
