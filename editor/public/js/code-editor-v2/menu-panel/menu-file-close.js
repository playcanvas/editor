editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    var item = menu.createItem('close-selected', {
        title: 'Close Selected Files',
        filter: function () {
            return editor.call('editor:command:can:closeSelected');
        },
        select: function () {
            return editor.call('editor:command:closeSelected');
        }
    });
    item.class.add('noBorder');

    menu.append(item);

    menu.append(menu.createItem('close-all', {
        title: 'Close All Files',
        filter: function () {
            return editor.call('editor:command:can:closeAll');
        },
        select: function () {
            return editor.call('editor:command:closeAll');
        }
    }));


    // True if you can close selected files
    editor.method('editor:command:can:closeSelected', function () {
        return editor.call('assets:selected').length;
    });

    // Close selected
    editor.method('editor:command:closeSelected', function () {
        var selected = editor.call('assets:selected');
        for (var i = 0; i < selected.length; i++) {
            if (selected[i].get('type') !== 'folder') {
                editor.emit('documents:close', selected[i].get('id'));
            }
        }
    });

    // True if you can close all files
    editor.method('editor:command:can:closeAll', function () {
        return editor.call('documents:list').length;
    });

    // Close all
    editor.method('editor:command:closeAll', function () {
        var open = editor.call('documents:list');
        for (var i = 0; i < open.length; i++) {
            editor.emit('documents:close', open[i]);
        }
    });

});