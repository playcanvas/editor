editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    // create save menu
    var item = menu.createItem('save', {
        title: 'Save File (' + editor.call('hotkey:ctrl:string') + '-S)',
        filter: function () {
            return editor.call('editor:command:can:save');
        },
        select: function () {
            return editor.call('editor:command:save');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    item = menu.createItem('save-selected', {
        title: 'Save Selected Files',
        filter: function () {
            return editor.call('editor:command:can:saveSelected');
        },
        select: function () {
            return editor.call('editor:command:saveSelected');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    menu.append(menu.createItem('save-all', {
        title: 'Save All Files',
        filter: function () {
            return editor.call('editor:command:can:saveAll');
        },
        select: function () {
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

    // documents currently being saved
    var savingIndex = {};

    // Returns true if we can save
    editor.method('editor:command:can:save', function (id) {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected')) {
            var focused = id || editor.call('documents:getFocused');

            return focused &&
                   !savingIndex[focused] &&
                   !editor.call('documents:isLoading', focused) &&
                   editor.call('documents:isDirty', focused);
        }


        return false;
    });

    // Save
    editor.method('editor:command:save', function (id) {
        if (! editor.call('editor:command:can:save', id))
            return;

        save(id || editor.call('documents:getFocused'));
    });

    editor.method('editor:command:can:saveSelected', function () {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected')) {
            var selected = editor.call('assets:selected');
            var hasDirty = false;
            for (var i = 0; i < selected.length; i++) {
                var id = selected[i].get('id');
                if (!savingIndex[id] && editor.call('documents:isDirty', id)) {
                    hasDirty = true;
                    break;
                }
            }

            return hasDirty;
        }


        return false;
    });

    editor.method('editor:command:saveSelected', function () {
        if (! editor.call('editor:command:can:saveSelected'))
            return;

        var selected = editor.call('assets:selected');
        for (var i = 0; i < selected.length; i++) {
            var id = selected[i].get('id');
            if (savingIndex[id] || ! editor.call('documents:isDirty', id))
                continue;

            save(id);
        }
    });

    editor.method('editor:command:can:saveAll', function () {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected')) {
            var open = editor.call('documents:list');
            var hasDirty = false;
            for (var i = 0; i < open.length; i++) {
                var id = open[i];
                if (!savingIndex[id] && editor.call('documents:isDirty', id)) {
                    hasDirty = true;
                    break;
                }
            }

            return hasDirty;
        }


        return false;
    });

    editor.method('editor:command:saveAll', function () {
        if (! editor.call('editor:command:can:saveAll'))
            return;

        var open = editor.call('documents:list');
        for (var i = 0; i < open.length; i++) {
            var id = open[i];
            if (savingIndex[id] || ! editor.call('documents:isDirty', id))
                continue;

            save(id);
        }
    });

    // When a document stops being dirty
    // it means it was saved so check for pending save requests
    // and end them
    editor.on('documents:dirty', function (id, dirty) {
        if (dirty) return;

        if (savingIndex[id]) {
            delete savingIndex[id];
            editor.emit('editor:command:save:end', id);
        }
    });

    // Save document
    var save = function (id) {
        savingIndex[id] = true;

        editor.emit('editor:command:save:start', id);

        var doc = editor.call('documents:get', id);

        if (doc.hasPending()) {
            // wait for pending data to be sent and
            // acknowledged by the server before saving
            doc.once('nothing pending', function () {
                editor.call('realtime:send', 'doc:save:', parseInt(doc.name, 10));
            });
        } else {
            editor.call('realtime:send', 'doc:save:', parseInt(doc.name, 10));
        }
    };


    editor.on('editor:command:save:start', function (id) {
        var asset = editor.call('assets:get', id);
        editor.call('status:log', 'Saving "' + asset.get('name') + '"...');
    });

    editor.on('editor:command:save:end', function (id) {
        var asset = editor.call('assets:get', id);
        editor.call('status:log', 'Saved "' + asset.get('name') + '"');
    });

    editor.on('editor:command:save:cancel', function (id) {
        var asset = editor.call('assets:get', id);
        editor.call('status:clear');
    });

});