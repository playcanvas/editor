import type { Observer } from '@playcanvas/observer';
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
    const saving: Set<string> = new Set();

    // documents that need to be saved after the current save completes
    const pendingSave: Set<string> = new Set();

    // Returns true if we can save
    editor.method('editor:command:can:save', (id?: string) => {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected') && !editor.call('errors:hasRealtime')) {
            const focused = id || editor.call('documents:getFocused');

            return focused &&
                   !saving.has(focused) &&
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
    const save = function (id: string) {
        beforeSave();

        saving.add(id);

        editor.emit('editor:command:save:start', id);

        const doc = editor.call('documents:get', id);

        const uniqueId = parseInt(doc.id, 10);

        function doSave() {
            const asset = editor.call('assets:get', id);
            if (!asset) {
                return;
            }

            // check if file is different first
            editor.call('assets:contents:get', asset, (err: unknown, content: string) => {
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
    editor.method('editor:command:save', (id?: string) => {
        const docId = id || editor.call('documents:getFocused');

        // If a save is already in progress for this document, mark it as pending
        // so we save again after the current save completes
        if (docId && saving.has(docId)) {
            pendingSave.add(docId);
            return;
        }

        if (!editor.call('editor:command:can:save', id)) {
            return;
        }

        save(docId);
    });

    editor.method('editor:command:can:saveSelected', () => {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected') && !editor.call('errors:hasRealtime')) {
            let hasDirty = false;
            const selected = editor.call('assets:selected');
            for (const doc of selected) {
                const id = doc.get('id');
                if (!saving.has(id) && editor.call('documents:isDirty', id)) {
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
            if (saving.has(id) || !editor.call('documents:isDirty', id)) {
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
                if (!saving.has(id) && editor.call('documents:isDirty', id)) {
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
            if (saving.has(id) || !editor.call('documents:isDirty', id)) {
                continue;
            }

            save(id);
        }
    });

    // Handle save completion (success or error)
    function onSaveComplete(id: string) {
        saving.delete(id);

        // If a save was requested while we were saving, trigger it now
        if (pendingSave.has(id)) {
            pendingSave.delete(id);
            // Use setTimeout to allow the current save to fully complete before starting a new one
            setTimeout(() => {
                editor.call('editor:command:save', id);
            }, 0);
        }
    }

    editor.on('documents:save:success', (uniqueId: string) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        editor.call('status:log', `Saved "${asset.get('name')}"`);
        onSaveComplete(asset.get('id'));
    });

    editor.on('documents:save:error', (uniqueId: string) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        editor.call('status:error', `Could not save "${asset.get('name')}"`);
        onSaveComplete(asset.get('id'));
    });

    // When a document is marked as clean
    // we should delete any saving locks since it's fine
    // to re-save
    editor.on('documents:dirty', (id: string, dirty: boolean) => {
        if (!dirty) {
            if (saving.has(id)) {
                saving.delete(id);
                editor.call('status:clear');
            }
            // Clear pending save since the document is now clean
            pendingSave.delete(id);
        }
    });

    // if a document is loaded it either means it's loaded for the first time
    // or it's reloaded. In either case make sure we can save the document again
    // if we got disconnected in the meantime
    editor.on('documents:load', (_doc: unknown, asset: Observer, _docEntry?: unknown) => {
        const id = asset.get('id');
        if (saving.has(id)) {
            saving.delete(id);
            editor.call('status:clear');
        }
        // Clear pending save since the document was reloaded
        pendingSave.delete(id);
    });

    // when we close a document remove its saving status
    editor.on('documents:close', (id: string) => {
        if (saving.has(id)) {
            saving.delete(id);
            editor.call('status:clear');
        }
        pendingSave.delete(id);
    });

    editor.on('editor:command:save:start', (id: string) => {
        const asset = editor.call('assets:get', id);
        editor.call('status:log', `Saving "${asset.get('name')}"...`);
    });
});
