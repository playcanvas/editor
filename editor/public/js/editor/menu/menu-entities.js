editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    // New Entity button
    var button = new ui.Button({
        text: 'New Entity'
    });
    header.append(button);

    button.on('click', function() {
        var parent;
        var selection = editor.call('selector:items');
        if (selection && selection.length) {
            parent = selection[0];
        }

        editor.call('entities:new', parent);
    });

    // Delete Entity button
    button = new ui.Button({
        text: 'Delete Entity'
    });
    header.append(button);

    button.on('click', function() {
        var selection = editor.call('selector:items');
        if (selection && selection.length) {
            editor.call('entities:delete', selection[0]);
        }
    });

});
