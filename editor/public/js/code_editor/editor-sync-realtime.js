editor.once('load', function() {
    'use strict';

    // do nothing if we're editing a script instead
    // of an asset.
    // TODO: Remove this when scripts are assets
    if (! config.asset)
        return;

    var RECONNECT_INTERVAL = 5;

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
        hasError = true;
        editor.emit('permissions:writeState', false);
        editor.emit('realtime:error', err);
    };

    editor.method('document:isDirty', function () {
        return isDirty;
    });

    editor.method('editor:canSave', function () {
        return !hasError && editor.call('editor:isDirty') && ! editor.call('editor:isReadonly') && ! isSaving && isConnected;
    });

    editor.method('editor:isLoading', function () {
        return isLoading;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
    });

    editor.method('editor:loadAssetFile', function (fn) {
        if (! assetDocument)
            return fn(new Error("Asset not loaded"));

        var filename = assetDocument.getSnapshot().file.filename;

        (new AjaxRequest({
            url: '{{url.api}}/assets/{{asset.id}}/file/' + filename + '?access_token={{accessToken}}',
            notJson: true
        }))
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

        // wait a bit so that the sharejs document is flushed
        setTimeout(function () {
            editor.call('realtime:send', 'doc:save:', parseInt(config.asset.id, 10));
        }, 200);
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
        var reconnectAttempts = 0;
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
            if (reconnectAttempts > 8) {
                editor.emit('realtime:cannotConnect');
                return;
            }

            isLoading = true;
            var lastHearbeat = Date.now();
            var interval = 3000;
            var heartbeatTimeoutRef;

            // holds messages arriving from C3 before we receive
            // the 'auth' message
            var beforeAuthMessages = [];

            reconnectAttempts++;
            editor.emit('realtime:connecting', reconnectAttempts);

            // create new socket...
            socket = new SockJS(config.url.realtime.http);

            // This handler first handles the authentication message
            // After we receive the message we then create a proper sharejs connection.
            // We wait for authentication first because on re-connections sharejs sends ops
            // to the server before the server has finished authenticating the client
            socket.onmessage = function (msg) {
                try {
                    if (msg.data.startsWith('auth')) {
                        auth = true;
                        editor.emit('realtime:authenticated');

                        // now erase onmessage and create a sharejs connection
                        socket.onmessage = null;
                        createConnection();
                    } else {
                        // the 'init' message from sharejs might come before the 'auth'
                        // message so remember any sharejs messages for when we have a
                        // real sharejs connection
                        beforeAuthMessages.push(msg);
                    }
                } catch (e) {
                    onError(e);
                }
            };

            // handler for errors that happen before we have a real sharejs connection
            socket.onerror = function (e) {
                onError(e);
            };

            // when the socket is opened send 'auth' message
            socket.onopen = function () {
                socket.send('auth' + JSON.stringify({
                    accessToken: config.accessToken
                }));
            };


            var createConnection = function () {
                // if the connection does not exist
                // then create a new sharejs connection
                if (! connection) {
                    connection = new sharejs.Connection(socket);

                    connection.on('connected', function() {
                        reconnectAttempts = 0;
                        reconnectInterval = RECONNECT_INTERVAL;

                        isConnected = true;

                        editor.emit('realtime:connected');

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
                    });

                    connection.on('error', onError);
                } else {
                    // we are reconnecting so use existing connection
                    // but bind it to new socket
                    connection.bindToSocket(socket);
                }

                // handle any messages that have arrived before
                var sharejsMessage = connection.socket.onmessage;
                beforeAuthMessages.forEach(sharejsMessage);

                connection.socket.onmessage = function(msg) {
                    try {
                        if (msg.data.startsWith('whoisonline:')) {
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

                    if (heartbeatTimeoutRef) {
                        clearTimeout(heartbeatTimeoutRef);
                        heartbeatTimeoutRef = null;
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

                    reconnectInterval++;
                };
            };

            // set up heartbeat handlers to know when the connection no longer exists
            var heartbeatTimeout = function () {
                heartbeatTimeoutRef = null;

                if (Date.now() - lastHearbeat > interval) {
                    connection.socket.close();
                } else {
                    heartbeatTimeoutRef = setTimeout(heartbeatTimeout, interval);
                }
            };

            socket.onheartbeat = function () {
                if (heartbeatTimeoutRef) {
                    clearTimeout(heartbeatTimeoutRef);
                }

                lastHearbeat = Date.now();
                heartbeatTimeoutRef = setTimeout(heartbeatTimeout, interval);
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
