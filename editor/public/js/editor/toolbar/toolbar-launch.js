editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    // undo
    var button = new ui.Button({
        text: 'launch'
    });
    toolbar.append(button);

    button.on('click', function() {
        console.log('launch')
    });
});
