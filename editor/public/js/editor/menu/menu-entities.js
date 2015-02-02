editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

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

    var newEntity = function () {
        var parent = getEntitySelection();
        editor.call('entities:new', parent);
    };

    var duplicateEntity = function () {
        var entity = getEntitySelection();
        if (entity) {
            editor.call('entities:duplicate', entity);
        }
    };

    var deleteEntity = function () {
        var entity = getEntitySelection();
        if (entity) {
            editor.call('entities:delete', entity);
        }
    };

    [{
        text: 'New Entity',
        handler: newEntity
    }, {
        text: 'Duplicate Entity',
        handler: duplicateEntity
    }, {
        text: 'Delete Entity',
        handler: deleteEntity
    }].forEach(function (item) {
        // Duplicate Entity button
        var button = new ui.Button({
            text: item.text
        });
        header.append(button);

        button.on('click', item.handler);
    });


    // shortcuts
    window.addEventListener('keyup', function (e) {
        // D key
        if (e.keyCode === 68) {
            duplicateEntity();
        }
    });

});
