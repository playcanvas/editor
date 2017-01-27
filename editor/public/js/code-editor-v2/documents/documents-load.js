editor.once('load', function () {
    'use strict';

    var connection = editor.call('realtime:connection');

    var documentsIndex = {};
    var assetsIndex = {};

    // the last document id the
    // user requested to focus
    var lastFocusedId = null;

    // Load asset from C3
    var loadAsset = function (asset) {
        var id = asset.get('id');

        var assetDoc = connection.get('assets', id);

        // store index entry
        var entry = {
            doc: assetDoc,
            isSaving: false,
            fileContent: null
        };

        assetsIndex[id] = entry;

        // listen to "after op" in order to check if the asset
        // file has been saved. When the file changes this means that the
        // save operation has finished
        assetDoc.on('after op', function (ops, local) {
            if (local) return;

            for (var i = 0; i < ops.length; i++) {
                if (ops[i].p.length === 1 && ops[i].p[0] === 'file') {
                    entry.isSaving = false;

                    var docEntry = documentsIndex[id];
                    if (docEntry && docEntry.isDirty) {
                        docEntry.isDirty = false;
                    }

                    editor.emit('documents:dirty', id, false);

                    break;
                }
            }
        });

        // Every time the 'subscribe' event is fired on the asset document
        // reload the asset content and check if it's different than the document content in
        // order to activate the REVERT button
        assetDoc.on('subscribe', function () {
            // load asset file to check if it has different contents
            // than the sharejs document
            editor.call('assets:loadFile', asset, function (err, data) {
                if (err) {
                    entry.fileContent = null;
                    return;
                }

                entry.fileContent = data;
                checkIfDirty(id);
            });
        });

        assetDoc.subscribe();
    };

    // Checks if a document with the specified id
    // is dirty
    var checkIfDirty = function (id) {
        var assetDoc = assetsIndex[id];
        if (! assetDoc || assetDoc.fileContent === null) return;

        var doc = documentsIndex[id];
        if (! doc || doc.content === null) return;

        var dirty = assetDoc.fileContent !== doc.content;

        // clear contents to save memory
        assetDoc.fileContent = null;
        doc.content = null;

        if (doc.isDirty !== dirty) {
            doc.isDirty = dirty;
            editor.emit('documents:dirty', id, dirty);
        }
    }

    // Loads the editable document that corresponds to the specified asset id
    var loadDocument = function (asset) {
        var id = asset.get('id');

        var doc = connection.get('documents', id);

        // add index entry
        var entry = {
            doc: doc,
            error: null,
            content: null,
            isLoading: true,
            isDirty: false
        };

        documentsIndex[id] = entry;

        // handle errors
        doc.on('error', function (err) {
            document.emit('documents:error', id, err);
        });

        // mark document as dirty on every
        // op
        doc.on('after op', function (ops, local) {
            if (!entry.isDirty) {
                entry.isDirty = true;
                editor.emit('documents:dirty', id, true);
            }
        });

        // every time we subscribe to the document
        // (so on reconnects too) listen for the 'ready' event
        // and when ready check if the document content is different
        // than the asset content in order to activate the REVERT button
        doc.on('subscribe', function () {
            // ready to sync
            doc.whenReady(function () {

                // var debugDuration = 1000;
                // setTimeout(function () {
                    entry.isLoading = false;
                    entry.content = doc.getSnapshot();

                    // load event
                    editor.emit('documents:load', doc, asset);
                    // focus doc if necessary
                    if (lastFocusedId === id)
                        editor.emit('documents:focus', id);

                    // check if it's diry
                    checkIfDirty(id);
                // }, debugDuration);



            });
        });

        // subscribe for realtime events
        doc.subscribe();
    };

    // Load document for the specified asset if not loaded already
    // and focus it
    editor.on('select:asset', function (asset) {
        if (asset.get('type') === 'folder') return;

        var id = asset.get('id')
        lastFocusedId = id;

        // if already loaded just focus it
        if (documentsIndex[id]) {
            editor.emit('documents:focus', id);
            return;
        }

        loadDocument(asset);

        // load asset if necessary
        if (! assetsIndex[id]) {
            loadAsset(asset);
        }
    });

    // Unload document
    editor.on('documents:close', function (id) {
        var entry = assetsIndex[id];
        if (entry) {
            entry.doc.destroy();
            delete assetsIndex[id];
        }

        entry = documentsIndex[id];
        if (entry) {
            entry.doc.destroy();
            delete documentsIndex[id];
        }
    });

    // Document error
    editor.on('documents:error', function (id, err) {
        console.error(err);

        var entry = documentsIndex[id];
        if (! entry) return;

        entry.error = err;
        var asset = editor.call('assets:get', id);
        editor.call('status:error', 'Realtime error for document ' + asset.get('name') + ': ' + err);
    });

    // Check if document content differs from asset file contents
    editor.method('documents:isDirty', function (id) {
        var entry = documentsIndex[id];
        return entry ? entry.isDirty : false;
    });

    // Returns true if the document hasn't finished loading yet
    editor.method('documents:isLoading', function (id) {
        var entry = documentsIndex[id];
        return entry ? entry.isLoading : false;
    });

    // handle disconnections
    editor.on('realtime:disconnected', function () {
        // pause all documents otherwise
        // the documents will attempt to sync to the server
        // as soon as we reconnect before we manage to re-authenticate first
        for (var id in documentsIndex) {
            documentsIndex[id].doc.pause();
        }
    });

    // handle reconnections
    editor.on('realtime:authenticated', function () {
        for (var id in documentsIndex) {
            // send doc:reconnect for each document
            // that was loaded before we disconnected in order
            // to fetch the document and its asset in C3
            connection.socket.send('doc:reconnect:' + id);
            documentsIndex[id].doc.resume();
        }
    });

    editor.method('documents:getFocused', function () {
        return lastFocusedId;
    });

    // get an array with all the ids of open documents
    editor.method('documents:list', function () {
        return Object.keys(documentsIndex);
    });

    // get a sharejs document
    editor.method('documents:get', function (id) {
        return documentsIndex[id].doc;
    });

});