editor.once('load', () => {
    const watchThumbnailRegen = (asset) => {
        asset.on('data.rgbm:set', () => {
            asset.set('has_thumbnail', false, true);
            editor.call('realtime:send', 'pipeline', {
                name: 'thumbnails',
                data: {
                    target: asset.get('id')
                }
            });
        });
    };

    editor.call('assets:list').forEach(watchThumbnailRegen);
    editor.on('assets:add', watchThumbnailRegen);
});
