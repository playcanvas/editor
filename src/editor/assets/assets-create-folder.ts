editor.once('load', () => {
    editor.method('assets:create:folder', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const parent = (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder');
        const folder = parent?.apiAsset ?? parent ?? undefined;

        editor.api.globals.assets.createFolder({
            name: args.name,
            folder
        }).then((asset) => {
            if (!args.noSelect) {
                editor.api.globals.selection.set([asset]);
            }
            if (args.fn) {
                args.fn(null, asset.get('id'));
            }
        }).catch((err) => {
            editor.call('status:error', err);
            if (args.fn) {
                args.fn(err);
            }
        });
    });
});
