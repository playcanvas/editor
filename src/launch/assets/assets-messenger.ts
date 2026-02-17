editor.once('load', () => {
    const validRuntimeAssets = new Set([
        'animation', 'container', 'cubemap', 'css', 'gsplat', 'html', 'json', 'material',
        'model', 'render', 'scene', 'script', 'sprite', 'text', 'texture', 'textureatlas'
    ]);

    const create = (data: { asset: { id: number; source?: boolean; type: string; status?: string } }) => {
        const { asset } = data;

        // ignore if not a runtime asset, or source asset, or not yet complete
        if (asset.source || !validRuntimeAssets.has(asset.type) || (asset.status && asset.status !== 'complete')) {
            return;
        }

        const uniqueId = Number(asset.id);
        if (!uniqueId) {
            return;
        }

        editor.call('loadAsset', uniqueId);
    };

    // create or update
    editor.on('messenger:asset.new', create);

    // remove
    editor.on('messenger:asset.delete', (data: { asset: { id: number } }) => {
        const asset = editor.call('assets:getUnique', data.asset.id);
        if (asset) {
            editor.call('assets:remove', asset);
        }
    });

    // remove multiple
    editor.on('messenger:assets.delete', (data: { assets: Array<string | number> }) => {
        data.assets.forEach((id: string | number) => {
            const asset = editor.call('assets:getUnique', Number(id));
            if (asset) {
                editor.call('assets:remove', asset);
            }
        });
    });
});
