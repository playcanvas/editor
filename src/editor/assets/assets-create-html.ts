editor.once('load', () => {
    editor.method('assets:create:html', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const parent = (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder');
        const folder = parent?.apiAsset ?? parent ?? undefined;

        editor.api.globals.assets.createHtml({
            folder
        }).catch((err) => {
            editor.call('status:error', err);
        });
    });
});
