editor.once('load', () => {

    // Copy the asset data into local storage
    editor.method('assets:copy', (assets) => {
        var clipboard = editor.call('clipboard');

        clipboard.value = {
            type: 'asset',
            projectId: config.project.id,
            branchId: config.self.branch.id,
            assets: assets.map(asset => asset.get('id'))
        };

        editor.call('status:text', 'Copied assets to clipboard');
    });
});