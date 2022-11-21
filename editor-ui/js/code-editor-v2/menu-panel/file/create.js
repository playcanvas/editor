editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:file');

    // create menu items
    let group = menu.createItem('create', {
        title: 'Create New',
        filter: function () {
            return editor.call('editor:command:can:create');
        },
        select: function () {
            return editor.call('editor:command:create', 'script');
        }
    });
    group.class.add('create-new');
    menu.append(group);

    const types = [
        'script',
        'css',
        'html',
        'json',
        'shader',
        'text',
        'folder'
    ];

    const titles = [
        'Script Asset',
        'CSS Asset',
        'HTML Asset',
        'JSON Asset',
        'Shader Asset',
        'Text Asset',
        'Folder'
    ];

    types.forEach(function (type, index) {
        group.append(menu.createItem('create-' + type, {
            title: titles[index],
            filter: function () {
                return editor.call('editor:command:can:create');
            },
            select: function () {
                return editor.call('editor:command:create', type);
            }
        }));
    });


    // context menu
    const ctxMenu = editor.call('files:contextmenu');

    group = ctxMenu.createItem('create', {
        title: 'Create New',
        filter: function () {
            const selection = editor.call('files:contextmenu:selected');
            if (selection.length <= 1)
                return editor.call('editor:command:can:create', selection[0]);
        },
        select: function () {
            const selection = editor.call('files:contextmenu:selected');
            if (selection.length <= 1)
                return editor.call('editor:command:create', 'script', selection[0]);
        }
    });
    group.class.add('noBorder');
    ctxMenu.append(group);

    types.forEach(function (type, index) {
        group.append(menu.createItem('create-' + type, {
            title: titles[index],
            filter: function () {
                const selection = editor.call('files:contextmenu:selected');
                if (selection.length <= 1)
                    return editor.call('editor:command:can:create', selection[0]);
            },
            select: function () {
                const selection = editor.call('files:contextmenu:selected');
                if (selection.length <= 1)
                    return editor.call('editor:command:create', type, selection[0]);
            }
        }));
    });


    editor.method('editor:command:can:create', function (folder) {
        return !editor.call('editor:resolveConflictMode') &&
                editor.call('permissions:write') &&
               (!folder || folder.get('type') === 'folder') &&
               !editor.call('errors:hasRealtime');
    });

    editor.method('editor:command:create', function (type, folder) {
        folder = folder || editor.call('assets:selected:folder');
        if (!editor.call('editor:command:can:create', folder)) return;

        if (type === 'script') {
            editor.call('picker:script-create', function (filename) {
                editor.call('assets:create:script', {
                    filename: filename,
                    boilerplate: true,
                    parent: folder
                });
            });
        } else {
            editor.call('assets:create:' + type, {
                parent: folder
            });
        }
    });
});
