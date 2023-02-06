editor.once('load', function () {
    if (!editor.call('users:hasFlag', 'hasRecompressFlippedTextures')) return;

    if (!editor.call('permissions:write')) return;

    const variants = ['etc1', 'etc2', 'pvr', 'dxt', 'basis'];

    let sceneLoaded = false;
    editor.once('scene:load', () => {
        sceneLoaded = true;
    });

    editor.once('assets:load', () => {
        let timeout;

        function checkForRecompress() {
            clearTimeout(timeout);

            if (!sceneLoaded || editor.call('picker:isOpen')) {
                timeout = setTimeout(checkForRecompress, 1000);
                return;
            }

            const toRecompress = [];

            editor.call('assets:list').forEach((asset) => {
                if (asset.get('source')) return;

                const type = asset.get('type');
                if (type !== 'texture' && type !== 'textureatlas') return;

                if (asset.get('task') === 'running') return;

                for (let i = 0; i < variants.length; i++) {
                    const variant = variants[i];
                    if (!asset.has(`file.variants.${variant}`)) continue;
                    if (!asset.get(`file.variants.${variant}.noFlip`)) {
                        toRecompress.push(asset);
                        break;
                    }
                }
            });

            if (!toRecompress.length) return;

            editor.call('picker:confirm', 'This project contains textures which must be recompressed due to a non-backwards compatible engine change. These textures will appear upside down if they aren\'t recompressed.', () => {
                recompress(toRecompress);
            }, {
                yesText: 'Recompress now',
                noText: 'Recompress later',
                noDismiss: true
            });
        }

        setTimeout(checkForRecompress, 1000);
    });

    function recompress(toRecompress) {
        pcui.TextureCompressor.compress(toRecompress, variants);
    }
});
