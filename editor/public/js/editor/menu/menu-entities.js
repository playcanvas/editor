editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    var newEntity = function () {
        var parent = editor.call('entities:selectedFirst');
        editor.call('entities:new', parent);
    };

    var duplicateEntity = function () {
        var entity = editor.call('entities:selectedFirst');
        if (entity)
            editor.call('entities:duplicate', entity);
    };

    var deleteEntity = function () {
        var entity = editor.call('entities:selectedFirst');
        if (entity)
            editor.call('entities:delete', entity);
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
        if (e.target && e.target.tagName.toLowerCase() === 'input' || ! editor.call('permissions:write'))
            return;

        // Ctrl+D
        if (e.keyCode === 68 && e.ctrlKey) {
            duplicateEntity();
        }
    });

});
