editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    menu.append(menu.createItem('delete-selected', {
        title: 'Delete Selected Files',
        filter: function () {
            return editor.call('editor:command:can:deleteSelected');
        },
        select: function () {
            return editor.call('editor:command:deleteSelected');
        }
    }));

    var ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(ctxMenu.createItem('delete', {
        title: 'Delete',
        filter: function () {
            return editor.call('permissions:write') && editor.call('files:contextmenu:selected').length;
        },
        select: function () {
            editor.call('assets:delete:picker', editor.call('files:contextmenu:selected'));
        }
    }));

    // True if you can delete selected files
    editor.method('editor:command:can:deleteSelected', function () {
        return editor.call('permissions:write') && editor.call('assets:selected').length;
    });

    // Delete selected files
    editor.method('editor:command:deleteSelected', function () {
        if (! editor.call('permissions:write')) return;

        var selected = editor.call('assets:selected');
        if (selected.length)
            editor.call('assets:delete:picker', selected);

    });

});