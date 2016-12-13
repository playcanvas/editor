editor.once('load', function() {
    'use strict';

    // do nothing if we're editing a script instead
    // of an asset.
    // TODO: Remove this when scripts are assets
    if (! config.asset)
        return;

    var RECONNECT_INTERVAL = 1;

    var isLoading = false;
    var isSaving;
    var isDirty = false;
    var isConnected = false;
    var loadedScriptOnce = false;
    var hasError = false;

    var textDocument = null;
    var assetDocument = null;
    var editingContext = null;

    var onError = function (err) {
        console.error(err);
        hasError = true;
        editor.emit('permissions:writeState', false);
        editor.emit('realtime:error', err);
    };

    editor.method('document:isDirty', function () {
        return isDirty;
    });

    editor.method('editor:canSave', function () {
        return !hasError &&
                editor.call('editor:isDirty') &&
                !editor.call('editor:isReadonly') &&
                !isSaving &&
                isConnected;
    });

    editor.method('editor:isLoading', function () {
        return isLoading;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
    });

    editor.method('editor:isConnected', function () {
        return isConnected;
    });

    editor.method('editor:loadAssetFile', function (fn) {
        if (! assetDocument)
            return fn(new Error("Asset not loaded"));

        var filename = assetDocument.getSnapshot().file.filename;

        Ajax({
            url: '{{url.api}}/assets/{{asset.id}}/file/' + filename,
            auth: true,
            notJson: true
        })
        .on('load', function(status, data) {
            fn(null, data);
        })
        .on('error', function (err) {
            fn(err);
        });
    });

    editor.method('editor:save', function () {
        if (! editor.call('editor:canSave'))
            return;

        isSaving = true;
        editor.emit('editor:save:start');

        if (textDocument.hasPending()) {
            // wait for pending data to be sent and
            // acknowledged by the server before saving
            textDocument.once('nothing pending', function () {
                editor.call('realtime:send', 'doc:save:', parseInt(config.asset.id, 10));
            });
        } else {
            editor.call('realtime:send', 'doc:save:', parseInt(config.asset.id, 10));
        }
    });

    // revert loads the asset file
    // and sets the document content to be the same as the asset file
    editor.method('editor:revert', function () {
        editor.call('editor:loadAssetFile', function (err, data) {
            if (err) {
                onError('Could not revert, try again later.');
                return;
            }

            var cm = editor.call('editor:codemirror');

            // force merge ops so that
            // otherwise the user will have to undo 2 times to get to the previous result
            editor.call('editor:realtime:mergeOps', true);
            cm.setValue(data);
            editor.call('editor:realtime:mergeOps', false);

            cm.focus();

            editor.call('editor:save');
        });
    });

    editor.method('editor:isReadonly', function () {
        return ! editor.call('permissions:write');
    });

    editor.once('start', function() {
        var auth = false;
        var socket;
        var connection;
        var data;
        var reconnectInterval = RECONNECT_INTERVAL;
        var documentContent = null;
        var assetContent = null;

        editor.method('realtime:connection', function () {
            return connection;
        });

        editor.method('realtime:context', function () {
            return editingContext;
        });

        editor.method('realtime:document', function () {
            return textDocument;
        });

        var reconnect = function () {
            isLoading = true;
            editor.emit('realtime:connecting');

            // create new socket...
            socket = new WebSocket(config.url.realtime.http);

            // if the connection does not exist
            // then create a new sharejs connection
            if (! connection) {
                connection = new sharejs.Connection(socket);

                connection.on('connected', function() {
                    reconnectInterval = RECONNECT_INTERVAL;

                    this.socket.send('auth' + JSON.stringify({
                        accessToken: config.accessToken
                    }));

                    isConnected = true;

                    editor.emit('realtime:connected');
                });

                connection.on('error', onError);
            } else {
                // we are reconnecting so use existing connection
                // but bind it to new socket
                connection.bindToSocket(socket);
            }

            var sharejsMessage = connection.socket.onmessage;

            connection.socket.onmessage = function(msg) {
                try {
                    if (msg.data.startsWith('auth')) {
                        if (!auth) {
                            auth = true;
                            data = JSON.parse(msg.data.slice(4));

                            editor.emit('realtime:authenticated');

                            // load document
                            if (! textDocument) {
                                loadDocument();
                            } else {
                                // send doc:reconnect in order for C3 to
                                // fetch the document and its asset again
                                socket.send('doc:reconnect:' + config.asset.id);
                                textDocument.resume();
                            }

                            if (! assetDocument)
                                loadAsset();
                        }
                    } else if (msg.data.startsWith('whoisonline:')) {
                        data = msg.data.slice('whoisonline:'.length);
                        var ind = data.indexOf(':');
                        if (ind !== -1) {
                            var op = data.slice(0, ind);
                            if (op === 'set') {
                                data = JSON.parse(data.slice(ind + 1));
                            } else if (op === 'add' || op === 'remove') {
                                data = parseInt(data.slice(ind + 1), 10);
                            }
                            editor.call('whoisonline:' + op, data);
                        } else {
                            sharejsMessage(msg);
                        }
                    } else {
                        sharejsMessage(msg);
                    }
                } catch (e) {
                    onError(e);
                }

            };


            var onConnectionClosed = connection.socket.onclose;
            connection.socket.onclose = function (reason) {
                onConnectionClosed(reason);

                auth = false;

                if (textDocument) {
                    // pause document and resume it
                    // after we have reconnected and re-authenticated
                    // otherwise the document will attempt to sync to the server
                    // as soon as we reconnect (before authentication) causing
                    // forbidden errors
                    textDocument.pause();
                }

                isLoading = false;
                isConnected = false;
                isDirty = false;

                // if we were in the middle of saving cancel that..
                isSaving = false;
                editor.emit('editor:save:cancel');

                // disconnected event
                editor.emit('realtime:disconnected', reason);

                // try to reconnect after a while
                editor.emit('realtime:nextAttempt', reconnectInterval);

                setTimeout(reconnect, reconnectInterval * 1000);

                if (reconnectInterval < 5) {
                    reconnectInterval++;
                }
            };
        };

        reconnect();

        var checkIfDirty = function () {
            isDirty = false;
            if (documentContent !== null && assetContent !== null) {
                isDirty = documentContent !== assetContent;

                documentContent = null;
                assetContent = null;
            }

            if (isDirty) {
                editor.emit('editor:dirty');
            }
        };

        var loadDocument = function() {
            textDocument = connection.get('documents', '' + config.asset.id);

            // error
            textDocument.on('error', onError);

            // every time we subscribe to the document
            // (so on reconnects too) listen for the 'ready' event
            // and when ready check if the document content is different
            // than the asset content in order to activate the REVERT button
            textDocument.on('subscribe', function () {
                // if we have a permanent error we need to reload the page
                // so don't continue
                if (hasError)
                    return;

                // ready to sync
                textDocument.whenReady(function () {
                    // notify of scene load
                    isLoading = false;

                    if (! editingContext) {
                        editingContext = textDocument.createContext();
                    }

                    documentContent = textDocument.getSnapshot();

                    if (! loadedScriptOnce) {
                        editor.emit('editor:loadScript', documentContent);
                        loadedScriptOnce = true;
                    } else {
                        editor.emit('editor:reloadScript', documentContent);
                    }

                    checkIfDirty();
                });
            });

            // subscribe for realtime events
            textDocument.subscribe();
        };

        var loadAsset = function() {
            // load asset document too
            assetDocument = connection.get('assets', '' + config.asset.id);

            // listen to "after op" in order to check if the asset
            // file has been saved. When the file changes this means that the
            // save operation has finished
            assetDocument.on('after op', function(ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    if (ops[i].p.length === 1 && ops[i].p[0] === 'file') {
                        isSaving = false;
                        isDirty = false;
                        editor.emit('editor:save:end');
                    }
                }
            });

            // Every time the 'subscribe' event is fired on the asset document
            // reload the asset content and check if it's different than the document content in
            // order to activate the REVERT button
            assetDocument.on('subscribe', function () {
                if (hasError)
                    return;

                assetDocument.whenReady(function() {
                    // load asset file to check if it has different contents
                    // than the sharejs document, so that we can enable the
                    // SAVE button if that is the case.
                    editor.call('editor:loadAssetFile', function (err, data) {
                        if (err) {
                            onError('Could not load asset file - please try again later.');
                            return;
                        }

                        assetContent = data;
                        checkIfDirty();
                    });
                });
            });

            assetDocument.subscribe();
        };

        editor.method('realtime:send', function(name, data) {
            socket.send(name + JSON.stringify(data));
        });


        // editor.on('realtime:disconnected', function () {
        //     editor.emit('permissions:writeState', false);
        // });

        var onLoadScript = function () {
            editor.emit('permissions:writeState', editor.call('permissions:write'));
        };

        editor.on('editor:loadScript', onLoadScript);
        editor.on('editor:reloadScript', onLoadScript);
    });
});
