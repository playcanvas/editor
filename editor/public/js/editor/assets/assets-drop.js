editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel.element,
        type: 'files',
        drop: function(type, data) {
            if (type !== 'files')
                return;

            for(var i = 0; i < data.length; i++) {
                editor.call('assets:uploadFile', data[i], data[i].name);
            }
        }
    });

    dropRef.element.classList.add('assets-drop-area');
});
