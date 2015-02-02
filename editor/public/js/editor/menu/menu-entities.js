editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    // New Entity button
    var button = new ui.Button({
        text: 'New Entity'
    });
    header.append(button);

    var getEntitySelection = function () {
        var entity = null;
        var selection = editor.call('selector:items');
        if (selection) {
            for (var i = 0; i < selection.length; i++) {
                if (selection[i].components) {
                    entity = selection[i];
                    break;
                }
            }
        }

        return entity;
    };

    button.on('click', function() {
        var parent = getEntitySelection();
        editor.call('entities:new', parent);
    });

    // Duplicate Entity button
    button = new ui.Button({
        text: 'Duplicate Entity'
    });
    header.append(button);

    button.on('click', function() {
        var entity = getEntitySelection();
        if (entity) {
            editor.call('entities:duplicate', entity);
        }
    });

    // Delete Entity button
    button = new ui.Button({
        text: 'Delete Entity'
    });
    header.append(button);

    button.on('click', function() {
        var entity = getEntitySelection();
        if (entity) {
            editor.call('entities:delete', entity);
        }
    });

});
