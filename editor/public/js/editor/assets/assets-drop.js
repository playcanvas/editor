editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel.element,
        type: 'files',
        drop: function(type, data) {
            if (type !== 'files')
                return;

            if (!editor.call('assets:canUploadFiles', data)) {
                var msg = 'Disk allowance exceeded. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
                editor.call('status:error', msg);
                return;
            }

            for(var i = 0; i < data.length; i++) {
                editor.call('assets:uploadFile', data[i], data[i].name);
            }
        }
    });

    dropRef.element.classList.add('assets-drop-area');
});
