editor.once('load', function () {
    const app = editor.call('viewport:app');
    if (!app) return;

    const assets = app.assets;

    editor.call('assets:registry:bind', assets);

    const regexFrameUpdate = /^data\.frames\.(\d+)/;
    const regexFrameRemove = /^data\.frames\.(\d+)$/;
    const regexI18n = /^i18n\.[^\.]+?$/;

    // add assets to asset registry
    editor.on('assets:add', function (asset) {
        // do only for target assets
        if (asset.get('source'))
            return;

        const assetEngine = assets.get(asset.get('id'));
        // render on asset load
        assetEngine.on('load', function () {
            editor.call('viewport:render');
        });
        // render on asset data change
        assetEngine.on('change', function () {
            editor.call('viewport:render');
        });

        // when data is changed
        asset.on('*:set', function (path, value) {

            // handle i18n changes
            if (regexI18n.test(path)) {
                const parts = path.split('.');
                assetEngine.addLocalizedAssetId(parts[1], value);

            } else if (asset.get('type') === 'textureatlas') {
                // handle frame changes for texture atlas
                const match = path.match(regexFrameUpdate);
                if (match) {
                    const frameKey = match[1];
                    const frame = asset.get('data.frames.' + frameKey);

                    if (assetEngine.resource) {
                        if (frame) {
                            assetEngine.resource.setFrame(frameKey, {
                                rect: new pc.Vec4(frame.rect),
                                pivot: new pc.Vec2(frame.pivot),
                                border: new pc.Vec4(frame.border)
                            });
                        }
                    }

                    if (!assetEngine.data.frames) {
                        assetEngine.data.frames = {};
                    }
                    assetEngine.data.frames[frameKey] = frame;
                }
            }

            editor.call('viewport:render');
        });

        asset.on('*:unset', function (path) {
            if (regexI18n.test(path)) {
                const parts = path.split('.');
                assetEngine.removeLocalizedAssetId(parts[1]);

                editor.call('viewport:render');
            } else if (asset.get('type') === 'textureatlas') {
                const match = path.match(regexFrameRemove);
                if (match) {
                    const frameKey = match[1];

                    if (assetEngine.resource) {
                        assetEngine.resource.removeFrame(frameKey);
                    }

                    if (assetEngine.frames && assetEngine.frames[frameKey]) {
                        delete assetEngine.frames;
                    }

                    editor.call('viewport:render');
                }
            }
        });

        if (asset.get('type') === 'sprite') {
            const updateFrameKeys = function () {
                if (assetEngine.resource) {
                    assetEngine.resource.frameKeys = asset.get('data.frameKeys');
                }

                assetEngine.data.frameKeys = asset.get('data.frameKeys');

                editor.call('viewport:render');
            };

            asset.on('data.frameKeys:set', updateFrameKeys);
            asset.on('data.frameKeys:insert', updateFrameKeys);
            asset.on('data.frameKeys:remove', updateFrameKeys);
            asset.on('data.frameKeys:move', updateFrameKeys);
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
    const update = pc.StandardMaterial.prototype.update;
    pc.StandardMaterial.prototype.update = function () {
        update.call(this);
        editor.call('viewport:render');
    };
});
