editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    var codePanel = editor.call('layout.code');

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
            return editor.call('permissions:write') &&
                   editor.call('files:contextmenu:selected').length &&
                   ! editor.call('errors:hasRealtime');
        },
        select: function () {
            editor.call('assets:delete:picker', editor.call('files:contextmenu:selected'));
        }
    }));

    // hotkeys
    editor.call('hotkey:register', 'delete-files', {
        key: 'delete',
        callback: function (e) {
            if (! codePanel.element.contains(e.target))
                editor.call('editor:command:deleteSelected');
        }
    });

    editor.call('hotkey:register', 'delete-files', {
        key: 'backspace',
        ctrl: true,
        callback: function (e) {
            if (! codePanel.element.contains(e.target))
                editor.call('editor:command:deleteSelected');
        }
    });

    // True if you can delete selected files
    editor.method('editor:command:can:deleteSelected', function () {
        return editor.call('permissions:write') &&
               editor.call('assets:selected').length &&
               ! editor.call('errors:hasRealtime');
    });

    // Delete selected files
    editor.method('editor:command:deleteSelected', function () {
        if (! editor.call('permissions:write')) return;

        var selected = editor.call('assets:selected');
        if (selected.length)
            editor.call('assets:delete:picker', selected);

    });

});