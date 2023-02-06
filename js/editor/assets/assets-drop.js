editor.once('load', function () {
    var assetsPanel = editor.call('layout.assets');

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel,
        type: 'files',
        filter: (type) => {
            if (type !== 'files' || !editor.call('permissions:write')) {
                return false;
            }

            return true;
        },
        drop: (type, data) => {
            if (type !== 'files' || !editor.call('permissions:write')) {
                return;
            }

            editor.call('assets:upload:files', data);
        }
    });

    dropRef.class.add('assets-drop-area');
});
