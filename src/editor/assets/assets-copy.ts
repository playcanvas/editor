editor.once('load', () => {

    // Copy the asset data into local storage
    editor.method('assets:copy', (assets) => {
        const clipboard = editor.call('clipboard');

        clipboard.value = {
            type: 'asset',
            projectId: config.project.id,
            branchId: config.self.branch.id,
            assets: assets.map(asset => asset.get('id'))
        };

        const assetClipboardIds = assets.reduce((ids, asset) => {
            if (asset.get('type') === 'folder') {
                return ids;
            }
            ids.push(asset.get('id'));
            return ids;
        }, []);

        if (assetClipboardIds.length) {
            clipboard.value.value = assetClipboardIds.length > 1 ? assetClipboardIds : assetClipboardIds[0];
        }

        editor.call('status:text', 'Copied assets to clipboard');
    });
});
