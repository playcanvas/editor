editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    // settings button
    var button = new ui.Button({
        text: 'Designer Settings'
    });
    header.append(button);

    button.on('click', function() {
        editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
    });

    editor.on('attributes:inspect[designerSettings]', function() {
        editor.call('attributes.rootPanel').folded = false;
    });
});
