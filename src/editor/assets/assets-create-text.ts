editor.once('load', () => {
    editor.method('assets:create:text', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const parent = (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder');
        const folder = parent?.apiAsset ?? parent ?? undefined;

        editor.api.globals.assets.createText({
            folder
        }).catch((err) => {
            editor.call('status:error', err);
        });
    });
});
