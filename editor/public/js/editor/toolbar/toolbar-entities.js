editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

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
        icon: '&#57873;',
        tooltip: 'New Entity',
        handler: newEntity
    }, {
        icon: '&#57908;',
        tooltip: 'Duplicate',
        handler: duplicateEntity
    }, {
        icon: '&#58657;',
        tooltip: 'Delete',
        handler: deleteEntity
    }].forEach(function (item) {
        // Duplicate Entity button
        var button = new ui.Button({
            text: item.icon
        });
        button.class.add('icon');
        button.element.title = item.tooltip;
        toolbar.append(button);

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
