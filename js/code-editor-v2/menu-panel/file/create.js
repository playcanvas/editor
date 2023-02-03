import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:file');

    // create menu items
    let item = new MenuItem({
        class: 'create-new',
        text: 'Create New',
        onIsEnabled: () => {
            return editor.call('editor:command:can:create');
        },
        onSelect: () => {
            return editor.call('editor:command:create', 'script');
        }
    });
    menu.append(item);

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
        item.append(new MenuItem({
            class: 'no-bottom-border',
            text: titles[index],
            onIsEnabled: () => {
                return editor.call('editor:command:can:create');
            },
            onSelect: () => {
                return editor.call('editor:command:create', type);
            }
        }));
    });


    // context menu
    const ctxMenu = editor.call('files:contextmenu');

    item = new MenuItem({
        class: ['create-new', 'no-bottom-border'],
        text: 'Create New',
        onIsEnabled: () => {
            const selection = editor.call('files:contextmenu:selected');
            if (selection.length <= 1)
                return editor.call('editor:command:can:create', selection[0]);
        },
        onSelect: () => {
            const selection = editor.call('files:contextmenu:selected');
            if (selection.length <= 1)
                return editor.call('editor:command:create', 'script', selection[0]);
        }
    });
    ctxMenu.append(item);

    types.forEach(function (type, index) {
        item.append(new MenuItem({
            class: 'no-bottom-border',
            text: titles[index],
            onIsEnabled: () => {
                const selection = editor.call('files:contextmenu:selected');
                if (selection.length <= 1)
                    return editor.call('editor:command:can:create', selection[0]);
            },
            onSelect: () => {
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
