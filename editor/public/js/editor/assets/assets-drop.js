editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel,
        type: 'files',
        drop: function (type, data) {
            if (type !== 'files')
                return;

            editor.call('assets:upload:files', data);
        }
    });

    dropRef.class.add('assets-drop-area');
});
