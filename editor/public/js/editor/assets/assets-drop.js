editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel.element,
        type: 'files',
        drop: function(files) {
            console.log(files);
        }
    });
    dropRef.element.classList.add('assets-drop-area');
});
