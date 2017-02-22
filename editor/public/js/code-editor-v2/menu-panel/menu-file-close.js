editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    var item = menu.createItem('close', {
        title: 'Close File',
        filter: function () {
            return editor.call('editor:command:can:close');
        },
        select: function () {
            return editor.call('editor:command:close');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Alt+W');
    menu.append(item);

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

    item = menu.createItem('close-all', {
        title: 'Close All Files',
        filter: function () {
            return editor.call('editor:command:can:closeAll');
        },
        select: function () {
            return editor.call('editor:command:closeAll');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Alt+Shift+W');
    menu.append(item);

    // hotkeys
    editor.call('hotkey:register', 'close-selected', {
        key: 'w',
        alt: true,
        callback: function () {
            editor.call('editor:command:close');
        }
    });

    editor.call('hotkey:register', 'close-all', {
        key: 'w',
        alt: true,
        shift: true,
        callback: function () {
            editor.call('editor:command:closeAll');
        }
    });

    var ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(ctxMenu.createItem('close', {
        title: 'Close',
        filter: function () {
            var selected = editor.call('files:contextmenu:selected');
            for (var i = 0; i < selected.length; i++) {
                if (editor.call('documents:get', selected[i].get('id'))) {
                    return true;
                }
            }
        },
        select: function () {
            var selected = editor.call('files:contextmenu:selected');
            for (var i = 0; i < selected.length; i++) {
                if (editor.call('documents:get', selected[i].get('id'))) {
                    editor.emit('documents:close', selected[i].get('id'));
                }
            }

        }
    }));

    // True if you can close focused file
    editor.method('editor:command:can:close', function () {
        return editor.call('tabs:focused');
    });

    // Close focused
    editor.method('editor:command:close', function () {
        var tab = editor.call('tabs:focused');
        if (tab)
            editor.call('tabs:close', tab.id);
    });


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
        return editor.call('tabs:list').length;
    });

    // Close all
    editor.method('editor:command:closeAll', function () {
        var tabs = editor.call('tabs:list');
        editor.call('tabs:batchClose:start');
        var i = tabs.length;
        while (i--) {
            editor.call('tabs:close', tabs[i].id);
        }
        editor.call('tabs:batchClose:end');
    });

});