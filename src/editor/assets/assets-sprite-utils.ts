editor.once('load', () => {
    // Creates new texture atlas asset from texture asset
    editor.method('assets:textureToAtlas', (asset, callback) => {
        if (asset.get('type') !== 'texture' || asset.get('source')) {
            return;
        }

        editor.api.globals.rest.assets.assetDuplicate(asset.get('id'), {
            type: 'textureatlas',
            branchId: config.self.branch.id
        })
        .on('load', (status, res) => {
            if (callback) {
                callback(null, res.id);
            }
        })
        .on('error', (status, res) => {
            if (callback) {
                callback(status);
            } else {
                log.error('error', status, res);
            }
        });
    });

    // Creates new Sprite Asset from Texture Atlas Asset
    editor.method('assets:atlasToSprite', (args) => {
        const asset = args && args.asset;
        if (!asset || asset.get('type') !== 'textureatlas' || asset.get('source')) {
            return;
        }

        const sliced = args && args.sliced;

        // create a frame that covers the full atlas unless such a frame already exists
        const frames = asset.getRaw('data.frames')._data;
        const count = Object.keys(frames).length;
        let frame = null;

        const width = asset.get('meta.width') || 1;
        const height = asset.get('meta.height') || 1;

        if (count) {
            for (const key in frames) {
                // search for existing frame that covers the entire atlas
                if (frames[key]._data.rect[0] <= 0 &&
                    frames[key]._data.rect[1] <= 0 &&
                    frames[key]._data.rect[2] >= width &&
                    frames[key]._data.rect[3] >= height) {

                    frame = key;
                    break;
                }
            }
        }

        if (frame === null) {
            let maxKey = 1;
            for (const key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            frame = maxKey;

            // default border to 10% of dimensions if sliced otherwise set to 0
            const horBorder = sliced ? Math.floor(0.1 * Math.max(width, height)) || 0 : 0;
            const verBorder = sliced ? Math.floor(0.1 * Math.max(width, height)) || 0 : 0;

            const history = asset.history.enabled;
            asset.history.enabled = false;
            asset.set(`data.frames.${maxKey}`, {
                name: `Frame ${maxKey}`,
                rect: [0, 0, width, height],
                pivot: [0.5, 0.5],
                border: [horBorder, verBorder, horBorder, verBorder]
            });
            asset.history.enabled = history;
        }

        // rendermode: 1 - sliced, 0 - simple
        const renderMode = sliced ? 1 : 0;
        // default ppu to 1 if we're using sliced mode otherwise default to
        // 100 which is better for world-space sprites
        const ppu = sliced ? 1 : 100;

        // get atlas asset name without extension
        let name = asset.get('name');
        const lastDot = name.lastIndexOf('.');
        if (lastDot > 0) {
            name = name.substring(0, lastDot);
        }

        const folder = editor.call('assets:panel:currentFolder');

        editor.api.globals.assets.createSprite({
            name: name,
            pixelsPerUnit: ppu,
            renderMode: renderMode,
            frameKeys: [frame],
            textureAtlas: asset.apiAsset,
            folder: folder && folder.apiAsset
        })
        .then((sprite) => {
            editor.api.globals.selection.set([sprite]);
        })
        .catch((err) => {
            editor.call('status:error', err);
        });
    });

});
