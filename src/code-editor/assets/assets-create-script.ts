editor.once('load', () => {
    editor.method('assets:create:script', (args = {}, callback = (asset) => {}) => {
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
        }).then((asset) => {
            callback(asset);
        }).catch((err) => {
            editor.call('status:error', err);
        });
    });
});
