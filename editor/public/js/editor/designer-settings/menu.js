editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    // settings button
    var button = new ui.Button({
        text: 'Designer Settings'
    });
    header.append(button);

    button.on('click', function() {
        editor.call('selector:clear');
        editor.call('attributes:inspect', 'designerSettings', editor.call('designerSettings'));
    });
});
