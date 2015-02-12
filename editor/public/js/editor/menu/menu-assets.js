editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    // new material button
    var button = new ui.Button({
        text: 'New Material'
    });
    header.append(button);

    button.on('click', function() {
        editor.call('assets:createMaterial');
    });

    // new cubemap button
    button = new ui.Button({
        text: 'New Cubemap'
    });
    header.append(button);

    button.on('click', function() {
        editor.call('assets:createCubemap');
    });
});
