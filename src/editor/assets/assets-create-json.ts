editor.once('load', () => {
    editor.method('assets:create:json', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const parent = (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder');
        const folder = parent?.apiAsset ?? parent ?? undefined;

        let json: object | undefined;
        if (args.json !== undefined) {
            json = typeof args.json === 'string' ? JSON.parse(args.json) : args.json;
        }

        editor.api.globals.assets.createJson({
            name: args.name,
            json,
            spaces: args.spaces,
            folder
        }).then((asset) => {
            if (!args.noSelect) {
                editor.api.globals.selection.set([asset]);
            }
            if (args.callback) {
                args.callback(null, asset.get('id'));
            }
        }).catch((err) => {
            editor.call('status:error', err);
            if (args.callback) {
                args.callback(err);
            }
        });
    });
});
