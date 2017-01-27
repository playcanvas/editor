editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    // create save menu
    menu.append(menu.createItem('save', {
        title: 'Save File (' + editor.call('hotkey:ctrl:string') + '-S)',
        filter: function () {
            return editor.call('editor:command:can:save');
        },
        select: function () {
            return editor.call('editor:command:save');
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

    // ids that are waiting to be saved when we reconnect
    var saveQueue = [];

    // Returns true if we can save
    editor.method('editor:command:can:save', function () {
        if (editor.call('permissions:write') && editor.call('realtime:isConnected')) {
            var focused = editor.call('documents:getFocused');

            return focused &&
                   !savingIndex[focused] &&
                   !editor.call('documents:isLoading', focused) &&
                   editor.call('documents:isDirty', focused);
        }


        return false;
    });

    // Save focused
    editor.method('editor:command:save', function () {
        if (! editor.call('permissions:write') || ! editor.call('realtime:isConnected'))
            return;

        var focused = editor.call('documents:getFocused');
        if (! focused || ! editor.call('documents:isDirty', focused) || editor.call('documents:isLoading', focused))
            return;

        if (savingIndex[focused]) return;

        savingIndex[focused] = true;

        editor.emit('editor:command:save:start', focused);

        if (! editor.call('realtime:isConnected')) {
            saveQueue.push(focused);
            return;
        }

        var doc = editor.call('documents:get', focused);

        if (doc.hasPending()) {
            // wait for pending data to be sent and
            // acknowledged by the server before saving
            doc.once('nothing pending', function () {
                editor.call('realtime:send', 'doc:save:', parseInt(doc.name, 10));
            });
        } else {
            editor.call('realtime:send', 'doc:save:', parseInt(doc.name, 10));
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