editor.once('load', () => {
    editor.method('assets:create:script', (args: { filename?: string; parent?: unknown } = {}, callback: (asset: unknown) => void = () => {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const {
            filename = 'script.js',
            parent = editor.call('assets:selected:folder')
        } = args;

        editor.api.globals.assets.createScript({
            filename: filename,
            folder: parent
        }).then((asset: unknown) => {
            callback(asset);
        }).catch((err: unknown) => {
            editor.call('status:error', err);
        });
    });
});
