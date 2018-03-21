editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return;

    var assets = app.assets;

    editor.call('assets:registry:bind', assets);

    var regexFrameUpdate = /^data\.frames\.(\d+)/;
    var regexFrameRemove = /^data\.frames\.(\d+)$/;

    // add assets to asset registry
    editor.on('assets:add', function (asset) {
        // do only for target assets
        if (asset.get('source'))
            return;

        var assetEngine = assets.get(asset.get('id'));
        // render on asset load
        assetEngine.on('load', function() {
            editor.call('viewport:render');
        });
        // render on asset data change
        assetEngine.on('change', function() {
            editor.call('viewport:render');
        });

        // when data is changed
        asset.on('*:set', function (path, value) {

            // handle frame changes for texture atlas
            if (asset.get('type') === 'textureatlas' && assetEngine.resource) {
                var match = path.match(regexFrameUpdate);
                if (match) {
                    var frameKey = match[1];
                    var frame = asset.get('data.frames.' + frameKey);
                    if (frame) {
                        assetEngine.resource.setFrame(frameKey, {
                            rect: new pc.Vec4(frame.rect),
                            pivot: new pc.Vec2(frame.pivot),
                            border: new pc.Vec4(frame.border)
                        });
                    }
                }
            }

            editor.call('viewport:render');
        });

        if (asset.get('type') === 'textureatlas') {
            asset.on('*:unset', function (path) {
                if (! assetEngine.resource) return;
                var match = path.match(regexFrameRemove);
                if (match) {
                    var frameKey = match[1];
                    assetEngine.resource.removeFrame(frameKey);

                    editor.call('viewport:render');
                }
            });
        } else if (asset.get('type') === 'sprite') {
            asset.on('data.frameKeys:insert', function (value, index) {
                if (! assetEngine.resource) return;
                assetEngine.resource.frameKeys = asset.get('data.frameKeys');
                editor.call('viewport:render');
            });

            asset.on('data.frameKeys:remove', function (value, index) {
                if (! assetEngine.resource) return;
                assetEngine.resource.frameKeys = asset.get('data.frameKeys');
                editor.call('viewport:render');
            });

            asset.on('data.frameKeys:move', function (value, newIndex, oldIndex) {
                if (! assetEngine.resource) return;
                assetEngine.resource.frameKeys = asset.get('data.frameKeys');
                editor.call('viewport:render');
            });
        }

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
