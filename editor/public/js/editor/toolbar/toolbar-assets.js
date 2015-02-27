editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    // new material button
    var button = new ui.Button({
        text: 'New Material'
    });
    toolbar.append(button);

    button.on('click', function() {
        editor.call('assets:createMaterial');
    });

    // new cubemap button
    button = new ui.Button({
        text: 'New Cubemap'
    });
    toolbar.append(button);

    button.on('click', function() {
        editor.call('assets:createCubemap');
    });
});
