editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:file');

    // create menu items
    let item = menu.createItem('revert', {
        title: 'Revert File',
        filter: function () {
            return editor.call('editor:command:can:revert');
        },
        select: function () {
            return editor.call('editor:command:revert');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    item = menu.createItem('revert-selected', {
        title: 'Revert Selected Files',
        filter: function () {
            return editor.call('editor:command:can:revertSelected');
        },
        select: function () {
            return editor.call('editor:command:revertSelected');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    menu.append(menu.createItem('revert-all', {
        title: 'Revert All Files',
        filter: function () {
            return editor.call('editor:command:can:revertAll');
        },
        select: function () {
            return editor.call('editor:command:revertAll');
        }
    }));

    const revert = function (id) {
        const asset = editor.call('assets:get', id);
        if (!asset) return;

        editor.call('assets:loadFile', asset, function (err, content) {
            if (err) {
                return editor.call('status:error', 'Could not revert "' + asset.get('name') + '". Try again later.');
            }

            const view = editor.call('views:get', id);
            if (!view) return;

            view.setValue(content);

            // save result
            editor.call('editor:command:save', id);
        });
    };

    const ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(ctxMenu.createItem('revert', {
        title: 'Revert',
        filter: function () {
            const selected = editor.call('files:contextmenu:selected');
            for (let i = 0; i < selected.length; i++) {
                if (editor.call('editor:command:can:revert', selected[i].get('id')))
                    return true;
            }
        },
        select: function () {
            const selected = editor.call('files:contextmenu:selected');
            for (let i = 0; i < selected.length; i++) {
                if (editor.call('editor:command:can:revert', selected[i].get('id'))) {
                    revert(selected[i].get('id'));
                }
            }
        }
    }));


    // True if you can revert
    editor.method('editor:command:can:revert', function (id) {
        if (editor.call('editor:command:can:save', id)) {
            const focused = id || editor.call('documents:getFocused');
            if (editor.call('assets:get', focused) && editor.call('views:get', focused)) {
                return true;
            }
        }

        return false;
    });

    // Load asset file and set document content to be the same
    // as the asset file - then save
    editor.method('editor:command:revert', function () {
        if (!editor.call('editor:command:can:revert')) return;

        const focused = editor.call('documents:getFocused');
        revert(focused);
    });

    editor.method('editor:command:can:revertSelected', function () {
        const selected = editor.call('assets:selected');
        for (let i = 0; i < selected.length; i++) {
            const id = selected[i].get('id');
            if (editor.call('editor:command:can:revert', id)) {
                return true;
            }
        }

        return false;
    });

    editor.method('editor:command:revertSelected', function () {
        const selected = editor.call('assets:selected');
        for (let i = 0; i < selected.length; i++) {
            const id = selected[i].get('id');
            if (editor.call('editor:command:can:revert', id))
                revert(id);
        }
    });

    editor.method('editor:command:can:revertAll', function () {
        const open = editor.call('documents:list');
        for (let i = 0; i < open.length; i++) {
            const id = open[i];
            if (editor.call('editor:command:can:revert', id)) {
                return true;
            }
        }

        return false;
    });

    editor.method('editor:command:revertAll', function () {
        const open = editor.call('documents:list');
        for (let i = 0; i < open.length; i++) {
            const id = open[i];
            if (editor.call('editor:command:can:revert', id)) {
                revert(id);
            }
        }
    });
});
