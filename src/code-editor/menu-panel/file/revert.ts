import { MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const menu = editor.call('menu:file');

    // create menu items
    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Revert File',
        onIsEnabled: () => {
            return editor.call('editor:command:can:revert');
        },
        onSelect: () => {
            return editor.call('editor:command:revert');
        }
    });
    menu.append(item);

    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Revert Selected Files',
        onIsEnabled: () => {
            return editor.call('editor:command:can:revertSelected');
        },
        onSelect: () => {
            return editor.call('editor:command:revertSelected');
        }
    });
    menu.append(item);

    menu.append(new MenuItem({
        text: 'Revert All Files',
        onIsEnabled: () => {
            return editor.call('editor:command:can:revertAll');
        },
        onSelect: () => {
            return editor.call('editor:command:revertAll');
        }
    }));

    const revert = function (id) {
        const asset = editor.call('assets:get', id);
        if (!asset) return;

        editor.call('assets:loadFile', asset, (err, content) => {
            if (err) {
                return editor.call('status:error', `Could not revert "${asset.get('name')}". Try again later.`);
            }

            const view = editor.call('views:get', id);
            if (!view) return;

            view.setValue(content);

            // save result
            editor.call('editor:command:save', id);
        });
    };

    const ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(new MenuItem({
        text: 'Revert',
        onIsEnabled: () => {
            const selected = editor.call('files:contextmenu:selected');
            for (const doc of selected) {
                if (editor.call('editor:command:can:revert', doc.get('id'))) {
                    return true;
                }
            }
        },
        onSelect: () => {
            const selected = editor.call('files:contextmenu:selected');
            for (const doc of selected) {
                if (editor.call('editor:command:can:revert', doc.get('id'))) {
                    revert(doc.get('id'));
                }
            }
        }
    }));


    // True if you can revert
    editor.method('editor:command:can:revert', (id) => {
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
    editor.method('editor:command:revert', () => {
        if (!editor.call('editor:command:can:revert')) return;

        const focused = editor.call('documents:getFocused');
        revert(focused);
    });

    editor.method('editor:command:can:revertSelected', () => {
        const selected = editor.call('assets:selected');
        for (const doc of selected) {
            const id = doc.get('id');
            if (editor.call('editor:command:can:revert', id)) {
                return true;
            }
        }

        return false;
    });

    editor.method('editor:command:revertSelected', () => {
        const selected = editor.call('assets:selected');
        for (const doc of selected) {
            const id = doc.get('id');
            if (editor.call('editor:command:can:revert', id)) {
                revert(id);
            }
        }
    });

    editor.method('editor:command:can:revertAll', () => {
        const open = editor.call('documents:list');
        for (const id of open) {
            if (editor.call('editor:command:can:revert', id)) {
                return true;
            }
        }

        return false;
    });

    editor.method('editor:command:revertAll', () => {
        const open = editor.call('documents:list');
        for (const id of open) {
            if (editor.call('editor:command:can:revert', id)) {
                revert(id);
            }
        }
    });
});
