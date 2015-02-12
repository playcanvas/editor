editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    // settings button
    var button = new ui.Button({
        text: 'New Material'
    });
    header.append(button);

    button.on('click', function() {
        editor.call('assets:createMaterial');
    });
});
