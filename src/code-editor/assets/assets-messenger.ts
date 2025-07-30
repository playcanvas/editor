editor.once('load', () => {
    const validTypes = [
        'css',
        'folder',
        'html',
        'json',
        'script',
        'shader',
        'text'
    ];

    // create new asset
    editor.on('messenger:asset.new', (data) => {
        if (data.asset.branchId !== config.self.branch.id) return;

        const uniqueId = data.asset.id;

        if (data.asset.source === false && data.asset.status && data.asset.status !== 'complete') {
            return;
        }

        if (validTypes.indexOf(data.asset.type) === -1) {
            return;
        }

        const asset = editor.call('assets:getUnique', uniqueId);
        if (!asset) {
            editor.call('assets:loadOne', uniqueId);
        }
    });

    // remove
    editor.on('messenger:asset.delete', (data) => {
        const asset = editor.call('assets:getUnique', data.asset.id);
        if (!asset) return;
        editor.call('assets:remove', asset);
    });

    // remove multiple
    editor.on('messenger:assets.delete', (data) => {
        for (let i = 0; i < data.assets.length; i++) {
            const asset = editor.call('assets:getUnique', parseInt(data.assets[i], 10));
            if (!asset) continue;
            editor.call('assets:remove', asset);
        }
    });
});
