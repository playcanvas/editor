editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    // create menu item
    menu.append(menu.createItem('close', {
        title: 'Close File',
        filter: function () {
            return editor.call('editor:command:can:close');
        },
        select: function () {
            return editor.call('editor:command:close');
        }
    }));

    // True if you can close
    editor.method('editor:command:can:close', function () {
        return !!editor.call('documents:getFocused');
    });

    // Close focused document
    editor.method('editor:command:close', function () {
        var focused = editor.call('documents:getFocused');
        if (focused) {
            editor.emit('documents:close', focused);
        }
    });

});