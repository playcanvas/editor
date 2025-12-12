import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:file');

    const settings = editor.call('editor:settings');
    const ctrl = editor.call('hotkey:ctrl:string');

    // create save menu
    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Save File',
        shortcut: formatShortcut(`${ctrl}+S`),
        onIsEnabled: () => {
            return editor.call('editor:command:can:save');
        },
        onSelect: () => {
            return editor.call('editor:command:save');
        }
    });
    menu.append(item);

    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Save Selected Files',
        onIsEnabled: () => {
            return editor.call('editor:command:can:saveSelected');
        },
        onSelect: () => {
            return editor.call('editor:command:saveSelected');
        }
    });
    menu.append(item);

    menu.append(new MenuItem({
        text: 'Save All Files',
        onIsEnabled: () => {
            return editor.call('editor:command:can:saveAll');
        },
        onSelect: () => {
            return editor.call('editor:command:saveAll');
        }
    }));

    // hotkeys
    editor.call('hotkey:register', 'save', {
        key: 's',
        ctrl: true,
        callback: function () {
            editor.call('editor:command:save');
        }
    });

    const ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(new MenuItem({
        text: 'Save',
        onIsEnabled: () => {
            const selected = editor.call('files:contextmenu:selected');
            for (const doc of selected) {
                const id = doc.get('id');
                if (editor.call('editor:command:can:save', id)) {
                    return true;
                }
            }
        },
        onSelect: () => {
            const selected = editor.call('files:contextmenu:selected');
            for (const doc of selected) {
                const id = doc.get('id');
                if (editor.call('editor:command:can:save', id)) {
                    editor.call('editor:command:save', id);
                }
            }
        }
    }));

    // documents currently being saved
    const savingIndex = {};

    // Returns true if we can save
    editor.method('editor:command:can:save', (id) => {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected') && !editor.call('errors:hasRealtime')) {
            const focused = id || editor.call('documents:getFocused');

            return focused &&
                   !savingIndex[focused] &&
                   !editor.call('documents:isLoading', focused) &&
                   editor.call('documents:isDirty', focused);
        }


        return false;
    });

    // Actions before saving
    function beforeSave() {
        if (settings.get('ide.formatOnSave')) {
            editor.call('editor:monaco').trigger(null, 'editor.action.formatDocument');
        }
    }

    // Save document
    const save = function (id) {
        beforeSave();

        savingIndex[id] = true;

        editor.emit('editor:command:save:start', id);

        const doc = editor.call('documents:get', id);

        const uniqueId = parseInt(doc.id, 10);

        function doSave() {
            const asset = editor.call('assets:get', id);
            if (!asset) {
                return;
            }

            // check if file is different first
            editor.call('assets:contents:get', asset, (err, content) => {
                if (err) {
                    console.error(err);
                    editor.emit('documents:save:error', uniqueId);
                    return;
                }

                if (doc.data === content) {
                    // if file is the same then do not send save message
                    editor.emit('documents:dirty', id, false);
                    editor.emit('documents:save:success', uniqueId);
                } else {
                    // file is different so send save message
                    editor.call('realtime:send', 'doc:save:', uniqueId);
                }
            });
        }

        if (doc.hasPending()) {
            // wait for pending data to be sent and
            // acknowledged by the server before saving
            doc.once('nothing pending', doSave);
        } else {
            doSave();
        }
    };

    // Save
    editor.method('editor:command:save', (id) => {
        if (!editor.call('editor:command:can:save', id)) {
            return;
        }

        save(id || editor.call('documents:getFocused'));
    });

    editor.method('editor:command:can:saveSelected', () => {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected') && !editor.call('errors:hasRealtime')) {
            let hasDirty = false;
            const selected = editor.call('assets:selected');
            for (const doc of selected) {
                const id = doc.get('id');
                if (!savingIndex[id] && editor.call('documents:isDirty', id)) {
                    hasDirty = true;
                    break;
                }
            }

            return hasDirty;
        }


        return false;
    });

    editor.method('editor:command:saveSelected', () => {
        if (!editor.call('editor:command:can:saveSelected')) {
            return;
        }

        const selected = editor.call('assets:selected');
        for (const doc of selected) {
            const id = doc.get('id');
            if (savingIndex[id] || !editor.call('documents:isDirty', id)) {
                continue;
            }

            save(id);
        }
    });

    editor.method('editor:command:can:saveAll', () => {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected') && !editor.call('errors:hasRealtime')) {
            let hasDirty = false;
            const open = editor.call('documents:list');
            for (const id of open) {
                if (!savingIndex[id] && editor.call('documents:isDirty', id)) {
                    hasDirty = true;
                    break;
                }
            }

            return hasDirty;
        }


        return false;
    });

    editor.method('editor:command:saveAll', () => {
        if (!editor.call('editor:command:can:saveAll')) {
            return;
        }

        const open = editor.call('documents:list');
        for (const id of open) {
            if (savingIndex[id] || !editor.call('documents:isDirty', id)) {
                continue;
            }

            save(id);
        }
    });

    // Handle save success
    editor.on('documents:save:success', (uniqueId) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        editor.call('status:log', `Saved "${asset.get('name')}"`);

        delete savingIndex[asset.get('id')];
    });

    // Handle save error
    editor.on('documents:save:error', (uniqueId) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        editor.call('status:error', `Could not save "${asset.get('name')}"`);

        delete savingIndex[asset.get('id')];
    });

    // When a document is marked as clean
    // we should delete any saving locks since it's fine
    // to re-save
    editor.on('documents:dirty', (id, dirty) => {
        if (!dirty) {
            if (savingIndex[id]) {
                delete savingIndex[id];
                editor.call('status:clear');
            }
        }
    });

    // if a document is loaded it either means it's loaded for the first time
    // or it's reloaded. In either case make sure we can save the document again
    // if we got disconnected in the meantime
    editor.on('documents:load', (doc, asset, docEntry) => {
        const id = asset.get('id');
        if (savingIndex[id]) {
            delete savingIndex[id];
            editor.call('status:clear');
        }
    });

    // when we close a document remove it's saving status
    editor.on('documents:close', (id) => {
        if (savingIndex[id]) {
            delete savingIndex[id];
            editor.call('status:clear');
        }
    });

    editor.on('editor:command:save:start', (id) => {
        const asset = editor.call('assets:get', id);
        editor.call('status:log', `Saving "${asset.get('name')}"...`);
    });
});
