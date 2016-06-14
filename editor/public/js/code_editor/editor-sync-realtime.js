editor.once('load', function() {
    'use strict';

    // do nothing if we're editing a script instead
    // of an asset.
    // TODO: Remove this when scripts are assets
    if (! config.asset)
        return;

    var isLoading = false;
    var isSaving;
    var isConnected = false;
    var loadedScriptOnce = false;

    editor.method('editor:canSave', function () {
        return editor.call('editor:isDirty') && ! editor.call('editor:isReadonly') && ! isSaving && isConnected;
    });

    editor.method('editor:isLoading', function () {
        return isLoading;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
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

    editor.method('editor:isReadonly', function () {
        return ! editor.call('permissions:write');
    });

    editor.once('start', function() {
        var auth = false;
        var socket;
        var connection;
        var textDocument = null;
        var assetDocument = null;
        var editingContext = null;
        var data;
        var reconnectAttempts = 0;
        var reconnectInterval = 1;

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
            reconnectAttempts++;
            editor.emit('realtime:connecting', reconnectAttempts);

            // create new socket...
            socket = new SockJS(config.url.realtime.http);

            var lastHearbeat = Date.now();
            var interval = 3000;
            var heartbeatTimeoutRef;

            var heartbeatTimeout = function () {
                heartbeatTimeoutRef = null;

                if (Date.now() - lastHearbeat > interval) {
                    connection.disconnect();
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

            // ... and new sharejs connection
            connection = new sharejs.Connection(socket);

            var sharejsMessage = connection.socket.onmessage;

            connection.socket.onmessage = function(msg) {
                try {
                    if (msg.data.startsWith('auth')) {
                        if (!auth) {
                            auth = true;
                            data = JSON.parse(msg.data.slice(4));

                            editor.emit('realtime:authenticated');

                            // load document
                            if (! textDocument)
                                loadDocument();

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
                    console.error(e);
                }

            };

            connection.on('connected', function() {
                reconnectAttempts = 0;
                reconnectInterval = 1;

                this.socket.send('auth' + JSON.stringify({
                    accessToken: config.accessToken
                }));

                isConnected = true;

                editor.emit('realtime:connected');
            });

            connection.on('error', function(msg) {
                editor.emit('realtime:error', msg);
            });

            var onConnectionClosed = connection.socket.onclose;
            connection.socket.onclose = function (reason) {
                onConnectionClosed(reason);

                auth = false;

                if (textDocument) {
                    textDocument.destroy();
                    textDocument = null;
                }

                if (assetDocument) {
                    assetDocument.destroy();
                    assetDocument = null;
                }

                if (editingContext) {
                    editingContext.destroy();
                    editingContext = null;
                }

                if (heartbeatTimeoutRef) {
                    clearTimeout(heartbeatTimeoutRef);
                    heartbeatTimeoutRef = null;
                }

                isLoading = false;
                isConnected = false;

                // if we were in the middle of saving cancel that..
                isSaving = false;
                editor.emit('editor:save:end');

                // disconnected event
                editor.emit('realtime:disconnected', reason);

                // try to reconnect after a while
                editor.emit('realtime:nextAttempt', reconnectInterval);

                setTimeout(reconnect, reconnectInterval * 1000);

                reconnectInterval++;
            };
        };

        reconnect();

        var loadDocument = function() {
            textDocument = connection.get('documents', '' + config.asset.id);

            // error
            textDocument.on('error', function(err) {
                editor.emit('realtime:error', err);
            });

            // ready to sync
            textDocument.on('ready', function() {
                // notify of scene load
                isLoading = false;
                editingContext = textDocument.createContext();

                if (! loadedScriptOnce) {
                    editor.emit('editor:loadScript', textDocument.getSnapshot());
                    loadedScriptOnce = true;
                } else {
                    editor.emit('editor:reloadScript', textDocument.getSnapshot());
                }
            });

            // subscribe for realtime events
            textDocument.subscribe();
        };

        var loadAsset = function() {
            // load asset document too
            assetDocument = connection.get('assets', '' + config.asset.id);

            assetDocument.on('ready', function() {
                assetDocument.on('after op', function(ops, local) {
                    if (local) return;

                    for (var i = 0; i < ops.length; i++) {
                        if (ops[i].p.length === 1 && ops[i].p[0] === 'file') {
                            isSaving = false;
                            editor.emit('editor:save:end');
                        }
                    }
                });
            });

            assetDocument.subscribe();
        };

        editor.method('realtime:send', function(name, data) {
            socket.send(name + JSON.stringify(data));
        });

        editor.on('realtime:disconnected', function () {
            editor.emit('permissions:writeState', false);
        });

        editor.on('realtime:connected', function () {
            editor.emit('permissions:writeState', editor.call('permissions:write'));
        });
    });
});
