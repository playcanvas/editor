editor.once('load', function () {
    'use strict';

    var documentsIndex = {};

    // load requests that have been
    // queued for after an asset file
    // becomes available for example
    var queuedLoad = {};

    // the last document id the
    // user requested to focus
    var lastFocusedId = null;

    // Checks if a document with the specified id
    // is dirty
    var checkIfDirty = function (id) {
        var asset = editor.call('assets:get', id);
        if (! asset) return;

        var assetContent = asset.get('content');
        if (assetContent === null) return;

        var doc = documentsIndex[id];
        if (! doc || doc.content === null) return;

        var dirty = assetContent !== doc.content;

        // clear contents to save memory
        asset.set('content', null);
        doc.content = null;

        if (doc.isDirty !== dirty) {
            doc.isDirty = dirty;
            editor.emit('documents:dirty', id, dirty);
        }
    }

    // update dirty flag when asset content changes
    editor.on('assets:add', function (asset) {
        asset.on('content:set', function (content) {
            if (content !== null)
                checkIfDirty(asset.get('id'));
        });
    });

    // Loads the editable document that corresponds to the specified asset id
    var loadDocument = function (asset) {
        var id = asset.get('id');
        var connection = editor.call('realtime:connection');
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
            editor.emit('documents:error', id, err);
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
            // check if already closed by the user
            if (! documentsIndex[id])
                return;

            // ready to sync
            doc.whenReady(function () {
                // check if closed by the user
                if (! documentsIndex[id]) {
                    return;
                }

                entry.isLoading = false;
                entry.content = doc.getSnapshot();

                // load event
                editor.emit('documents:load', doc, asset);

                // focus doc if necessary
                if (lastFocusedId === id) {
                    editor.emit('documents:focus', id);
                }

                // check if it's diry
                if (asset.get('content') !== null) {
                    checkIfDirty(id);
                } else {
                    // re-load asset content
                    // which will set the content and re-trigger
                    // dirty check
                    editor.call('assets:loadFile', asset);
                }
            });
        });

        // subscribe for realtime events
        doc.subscribe();
    };

    // Load document for the specified asset if not loaded already
    // and focus it
    editor.on('select:asset', function (asset) {
        if (asset.get('type') === 'folder') {
            return;
        };

        var id = asset.get('id')
        lastFocusedId = id;

        // if already loaded just focus it
        if (documentsIndex[id]) {
            editor.emit('documents:focus', id);
            return;
        }

        // if we have a global error do not load it
        if (editor.call('errors:hasRealtime'))
            return;

        // if the asset has a file
        // load it
        if (asset.get('file.filename') && editor.call('realtime:isConnected')) {
            loadDocument(asset);
        } else {
            // wait until the asset's file is ready
            // or when we are reconnected and load it then
            if (! queuedLoad[asset.get('id')]) {
                var evtLoad = asset.once('file.filename:set', function () {
                    delete queuedLoad[asset.get('id')];
                    loadDocument(asset);
                });

                queuedLoad[asset.get('id')] = evtLoad;
            }

        }
    });

    // Unload document
    editor.on('documents:close', function (id) {
        var entry = documentsIndex[id];
        if (entry) {
            entry.doc.destroy();
            delete documentsIndex[id];

            // send close message to update whoisonline for document
            var connection = editor.call('realtime:connection');
            connection.socket.send('close:document:' + id);
        }

        // stop any queued load events
        if (queuedLoad[id]) {
            queuedLoad[id].unbind();
            delete queuedLoad[id];
        }
    });

    // unload document if asset is removed
    editor.on('assets:remove', function (asset) {
        editor.emit('documents:close', asset.get('id'));
    });

    // Document error
    editor.on('documents:error', function (id, err) {
        console.error(err);

        var entry = documentsIndex[id];
        if (! entry) return;

        entry.error = err;
        var asset = editor.call('assets:get', id);
        editor.call('status:error', 'Realtime error for document "' + asset.get('name') + '": ' + err + '. Please reload this document.');
    });

    // Check if document content differs from asset file contents
    editor.method('documents:isDirty', function (id) {
        var entry = documentsIndex[id];
        return entry ? entry.isDirty : false;
    });

    // Update dirty status
    editor.on('documents:dirty', function (id, dirty) {
        var entry = documentsIndex[id];
        if (entry)
            entry.isDirty = dirty;
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
        var connection = editor.call('realtime:connection');

        // resume docs
        for (var id in documentsIndex) {
            documentsIndex[id].doc.resume();
        }

        // load any queued documents
        for (var id in queuedLoad) {
            var asset = editor.call('assets:get', id);
            if (! asset || asset.get('file.filename')) {
                queuedLoad[id].unbind();
                delete queuedLoad[id];

                if (asset) {
                    loadDocument(asset);
                }
            }
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
        return documentsIndex[id] ? documentsIndex[id].doc : null;
    });

    // returns true if the document has an error
    editor.method('documents:hasError', function (id) {
        return documentsIndex[id] && !!documentsIndex[id].error;
    });
});