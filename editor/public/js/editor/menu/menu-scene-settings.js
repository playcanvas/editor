editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    // settings button
    var button = new ui.Button({
        text: 'Scene Settings'
    });
    button.disabled = true;
    header.append(button);

    button.on('click', function() {
        editor.call('selector:set', 'sceneSettings', [ editor.call('sceneSettings') ]);
    });

    editor.on('attributes:inspect[sceneSettings]', function() {
        editor.call('attributes.rootPanel').folded = false;
    });

    editor.once('sceneSettings:load', function() {
        button.enabled = true;
    });
});
