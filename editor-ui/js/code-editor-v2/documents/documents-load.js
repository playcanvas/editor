editor.once('load', function () {
    'use strict';

    const documentsIndex = {};

    // load requests that have been
    // queued for after an asset file
    // becomes available for example
    const queuedLoad = {};

    // the last document id the
    // user requested to focus
    let lastFocusedId = null;

    // Loads the editable document that corresponds to the specified asset id
    const loadDocument = function (asset) {
        const id = asset.get('id').toString();
        const uniqueId = asset.get('uniqueId').toString();
        const connection = editor.call('realtime:connection');
        const doc = connection.get('documents', uniqueId);

        // add index entry
        const entry = {
            id: id,
            uniqueId: uniqueId,
            doc: doc,
            error: null,
            isLoading: true,
            isDirty: false,
            hasLocalChanges: false
        };

        documentsIndex[id] = entry;

        // handle errors
        doc.on('error', function (err) {
            editor.emit('documents:error', id, err);
        });

        // ready to sync
        doc.on('load', function () {
            // check if closed by the user
            if (!documentsIndex[id]) {
                return;
            }

            entry.isLoading = false;

            // load event
            editor.emit('documents:load', doc, asset, entry);

            // focus doc if necessary
            if (lastFocusedId === id) {
                editor.emit('documents:focus', id);
            }

            // check if it's dirty
            editor.call('assets:contents:get', asset, function (err, content) {
                // re-check if we haven't closed the file
                if (!documentsIndex[id] || err) return;

                const dirty = doc.data !== content;
                if (entry.isDirty !== dirty) {
                    entry.isDirty = dirty;
                    editor.emit('documents:dirty', id, dirty);
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
        }

        const id = asset.get('id');
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
            if (!queuedLoad[asset.get('id')]) {
                const evtLoad = asset.once('file.filename:set', function () {
                    delete queuedLoad[asset.get('id')];
                    loadDocument(asset);
                });

                queuedLoad[asset.get('id')] = evtLoad;
            }

        }
    });

    // Unload document
    editor.on('documents:close', function (id) {
        const entry = documentsIndex[id];
        if (entry) {
            entry.doc.unsubscribe();
            entry.doc.destroy();
            delete documentsIndex[id];

            // send close message to update whoisonline for document
            const connection = editor.call('realtime:connection');
            connection.socket.send('close:document:' + entry.uniqueId);
        }

        // stop any queued load events
        if (queuedLoad[id]) {
            queuedLoad[id].unbind();
            delete queuedLoad[id];
        }

        if (lastFocusedId === id)
            lastFocusedId = null;
    });

    // unfocus
    editor.on('documents:unfocus', function () {
        lastFocusedId = null;
    });

    // unload document if asset is removed
    editor.on('assets:remove', function (asset) {
        editor.emit('documents:close', asset.get('id'));
    });

    // Document error
    editor.on('documents:error', function (id, err) {
        log.error(err);

        const entry = documentsIndex[id];
        if (!entry) return;

        entry.error = err;
        const asset = editor.call('assets:get', id);
        editor.call('status:error', 'Realtime error for document "' + asset.get('name') + '": ' + err + '. Please reload this document.');
    });

    // Check if document content differs from asset file contents
    editor.method('documents:isDirty', function (id) {
        const entry = documentsIndex[id];
        return entry ? entry.isDirty : false;
    });

    // Update dirty status
    editor.on('documents:dirty', function (id, dirty) {
        const entry = documentsIndex[id];
        if (entry)
            entry.isDirty = dirty;
    });

    // Returns true if the document hasn't finished loading yet
    editor.method('documents:isLoading', function (id) {
        const entry = documentsIndex[id];
        return entry ? entry.isLoading : false;
    });

    // handle disconnections
    editor.on('realtime:disconnected', function () {
        // pause all documents otherwise
        // the documents will attempt to sync to the server
        // as soon as we reconnect before we manage to re-authenticate first
        for (const id in documentsIndex) {
            documentsIndex[id].doc.pause();
        }
    });

    // handle reconnections
    editor.on('realtime:authenticated', function () {
        // resume docs
        for (const id in documentsIndex) {
            const doc = documentsIndex[id].doc;
            if (!doc.subscribed) {
                doc.subscribe();
            }
            doc.resume();
        }

        // load any queued documents
        for (const id in queuedLoad) {
            const asset = editor.call('assets:get', id);
            if (!asset || asset.get('file.filename')) {
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
