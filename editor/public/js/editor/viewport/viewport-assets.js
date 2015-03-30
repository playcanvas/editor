editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');
    var assetRegistry = framework.assets;

    editor.call('assets:registry:bind', assetRegistry);

    // add assets to asset registry
    editor.on('assets:add', function (asset) {
        // do only for target assets
        if (asset.get('source'))
            return;

        // re-render
        asset.on('*:set', function (path, value) {
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

    // patch cubemap setSource re-render the viewport
    var setSource = pc.Texture.prototype.setSource;
    pc.Texture.prototype.setSource = function () {
        setSource.apply(this, arguments);

        if (this._cubemap) {
            editor.call('viewport:render');
        }
    };

});
