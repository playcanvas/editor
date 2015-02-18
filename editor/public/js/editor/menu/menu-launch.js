editor.once('load', function() {
    'use strict';

    var panelMenu = editor.call('layout.header');

    // undo
    var button = new ui.Button({
        text: 'launch'
    });
    panelMenu.append(button);

    button.on('click', function() {
        console.log('launch')
    });
});
