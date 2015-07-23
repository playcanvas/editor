editor.once('load', function() {
    'use strict';

    // do nothing if we're editing a script instead
    // of an asset.
    // TODO: Remove this when scripts are assets
    if (!config.asset)
        return;


    var isSaving;

    editor.method('editor:canSave', function () {
        return editor.call('editor:isDirty') && !editor.call('editor:isReadonly') && !isSaving;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
    });

    // check job.update messages
    // which will be sent when a 'save' job
    // is completed
    editor.on('messenger:job.update', function (data) {
        var jobId = data.job.id;
        Ajax({
            url: '/api/jobs/' + jobId,
            method: 'GET',
            query: {
                'access_token': '{{accessToken}}'
            },
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .on('load', function (status, data) {
            var job = data.response[0];

            if (job.data.asset_id === config.asset.id) {
                isSaving = false;
                if (job.status === 'complete') {
                    editor.emit('editor:save:success');
                } else if (job.status === 'error') {
                    editor.emit('editor:save:error', job.messages[0]);
                }

            }
        })
        .on('error', function (status, data) {
            console.error('Could not get job');
            editor.emit('editor:save:error', status);
        });
    });

    editor.method('editor:save', function () {
        if (! editor.call('editor:canSave')) return;

        isSaving = true;

        editor.emit('editor:save:start');

        var content = editor.call('editor:content');

        var data = {
            url: '/api/assets/{{asset.id}}',
            method: 'PUT',
            query: {
                'access_token': '{{accessToken}}'
            },
            data: {
                name: config.asset.name,
                scope: config.asset.scope,
                content: content
            },
            ignoreContentType: true,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        };

        Ajax(data)
        .on('error', function(status, data) {
            isSaving = false;
            editor.emit('editor:save:error', status);
        });
    });

    editor.method('editor:isReadonly', function () {
        return !editor.call('permissions:write');
    });

    editor.once('start', function() {
        var auth = false;
        var socket = new SockJS(config.url.realtime.http);
        var connection = new sharejs.Connection(socket);
        var textDocument = null;
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

        var connect = function () {
            if (reconnectAttempts > 8) {
                editor.emit('realtime:cannotConnect');
                return;
            }

            reconnectAttempts++;
            editor.emit('realtime:connecting', reconnectAttempts);

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
                        }
                    } else if (msg.data.startsWith('whoisonline:')) {
                        data = msg.data.slice('whoisonline:'.length);
                        var ind = data.indexOf(':');
                        if (ind !== -1) {
                            var op = data.slice(0, ind);
                            if (op === 'set') {
                                data = data.slice(ind + 1).split(',');
                            } else if (op === 'add' || op === 'remove') {
                                data = parseInt(data.slice(ind + 1), 10);
                            }
                            editor.call('whoisonline:' + op, data);
                        } else {
                            sharejsMessage(msg);
                        }
                    }  else {
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

                editor.emit('realtime:connected');
            });

            connection.on('error', function(msg) {
                editor.emit('realtime:error', msg);
            });

            var onConnectionClosed = connection.socket.onclose;
            connection.socket.onclose = function (reason) {
                auth = false;

                if (textDocument) {
                    textDocument.destroy();
                    textDocument = null;
                }

                editor.emit('realtime:disconnected', reason);
                onConnectionClosed(reason);

                // try to reconnect after a while
                editor.emit('realtime:nextAttempt', reconnectInterval);

                setTimeout(reconnect, reconnectInterval * 1000);

                reconnectInterval++;
            };
        };

        var reconnect = function () {
            // create new socket...
            socket = new SockJS(config.url.realtime.http);
            // ... and new sharejs connection
            connection = new sharejs.Connection(socket);
            // connect again
            connect();
        };

        connect();

        var loadDocument = function() {
            textDocument = connection.get('documents', '' + config.asset.id);

            // error
            textDocument.on('error', function(err) {
                editor.emit('realtime:error', err);
            });

            // ready to sync
            textDocument.on('ready', function() {
                // notify of scene load
                editingContext = textDocument.createContext();
                editor.emit('editor:loadScript', textDocument.getSnapshot());
            });

            // subscribe for realtime events
            textDocument.subscribe();
        };

        editor.on('realtime:disconnected', function () {
            editor.emit('permissions:writeState', false);
        });

        editor.on('realtime:connected', function () {
            editor.emit('permissions:writeState', editor.call('permissions:write'));
        });
    });
});
