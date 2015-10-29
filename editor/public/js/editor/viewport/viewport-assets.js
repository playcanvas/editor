editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');
    if (! framework) return;

    var assets = framework.assets;

    editor.call('assets:registry:bind', assets);

    // add assets to asset registry
    editor.on('assets:add', function (asset) {
        // do only for target assets
        if (asset.get('source'))
            return;

        // when data is changed
        asset.on('*:set', function (path, value) {
            editor.call('viewport:render');
        });

        var assetEngine = assets.get(asset.get('id'));
        // render on asset load
        assetEngine.on('load', function() {
            editor.call('viewport:render');
        });
        // render on asset data change
        assetEngine.on('change', function() {
            editor.call('viewport:render');
        });

        // render
        editor.call('viewport:render');
    });

    // remove assets from asset registry
    editor.on('assets:remove', function (asset) {
        // re-render
        editor.call('viewport:render');
    });

    // patch update for materials to re-render the viewport
    var update = pc.PhongMaterial.prototype.update;
    pc.PhongMaterial.prototype.update = function () {
        update.call(this);
        editor.call('viewport:render');
    };
});
