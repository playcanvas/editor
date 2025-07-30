editor.once('start', () => {
    const realtime = editor.api.globals.realtime;
    realtime.on('cannotConnect', () => {
        editor.emit('realtime:cannotConnect');
    });

    realtime.on('connecting', (attempts) => {
        editor.emit('realtime:connecting', attempts);
    });

    realtime.on('nextAttempt', (interval) => {
        editor.emit('realtime:nextAttempt', interval);
    });

    realtime.on('connected', () => {
        editor.emit('realtime:connected');
    });

    realtime.on('error', (err) => {
        editor.emit('realtime:error', err);
    });

    realtime.on('error:bs', (err) => {
        editor.call('status:error', err);
    });

    realtime.on('error:scene', (err) => {
        editor.emit('realtime:scene:error', err);
    });

    realtime.on('error:asset', (err) => {
        editor.emit('realtime:asset:error', err);
    });

    realtime.on('disconnect', (reason) => {
        editor.emit('realtime:disconnected', reason);
    });

    realtime.on('authenticated', () => {
        editor.emit('realtime:authenticated');

        if (config.scene.uniqueId) {
            realtime.scenes.load(config.scene.uniqueId);
        }
    });

    realtime.on('whoisonline', (op, data) => {
        editor.call(`whoisonline:${op}`, data);
    });

    realtime.on('chat:typing', (data) => {
        editor.call('chat:sync:typing', data);
    });

    realtime.on('chat:msg', (data) => {
        editor.call('chat:sync:msg', data);
    });

    realtime.on('selection', (data) => {
        editor.emit('selector:sync:raw', data);
    });

    realtime.on('fs:paths', (data) => {
        editor.call('assets:fs:paths:patch', data);
    });

    realtime.on('scene:op', (path, op) => {
        editor.emit(`realtime:scene:op:${path}`, op);
    });

    realtime.on('asset:op', (op, uniqueId) => {
        editor.emit('realtime:op:assets', op, uniqueId);
    });

    realtime.on('load:scene', (scene) => {
        editor.emit('scene:load', scene.id, scene.uniqueId);
        editor.emit('scene:raw', scene.data);
    });

    editor.method('realtime:connection', () => {
        return realtime.connection.sharedb;
    });

    editor.method('realtime:loadScene', (uniqueId) => {
        realtime.scenes.load(uniqueId);
    });

    // write scene operations
    editor.method('realtime:scene:op', (op) => {
        if (!editor.call('permissions:write') || !realtime.scenes.current) {
            return;
        }

        realtime.scenes.current.submitOp(op);
    });

    editor.method('realtime:send', (name, data) => {
        realtime.connection.sendMessage(name, data);
    });

    editor.method('realtime:scene', () => {
        return realtime.scenes.current;
    });

    editor.on('realtime:disconnected', () => {
        editor.emit('permissions:writeState', false);
    });

    editor.on('realtime:connected', () => {
        editor.emit('permissions:writeState', editor.call('permissions:write'));
    });

    editor.on('scene:unload', (id, uniqueId) => {
        realtime.scenes.unload(uniqueId);
    });

    if (editor.call('visibility')) {
        realtime.connection.connect(config.url.realtime.http);
    } else {
        editor.once('visible', () => {
            realtime.connection.connect(config.url.realtime.http);
        });
    }
});
