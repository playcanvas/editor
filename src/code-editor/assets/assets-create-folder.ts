editor.once('load', () => {
    editor.method('assets:create:folder', (args?: { parent?: any }) => {
        if (!editor.call('permissions:write')) {
            return;
        }
        args = args || {};
        const parent = (args.parent !== undefined) ? args.parent : editor.call('assets:selected:folder');
        const folder = parent?.apiAsset ?? parent ?? undefined;

        editor.api.globals.assets.createFolder({ folder }).catch((err: unknown) => {
            editor.call('status:error', err);
        });
    });
});
