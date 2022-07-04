editor.once('load', function () {
    'use strict';

    editor.once('start', function () {
        editor.realtime.on('cannotConnect', () => {
            editor.emit('realtime:cannotConnect');
        });

        editor.realtime.on('connecting', (attempts) => {
            editor.emit('realtime:connecting', attempts);
        });

        editor.realtime.on('nextAttempt', interval => {
            editor.emit('realtime:nextAttempt', interval);
        });

        editor.realtime.on('connected', () => {
            editor.emit('realtime:connected');
        });

        editor.realtime.on('error', err => {
            editor.emit('realtime:error', err);
        });

        editor.realtime.on('error:bs', err => {
            editor.call('status:error', err);
        });

        editor.realtime.on('error:scene', err => {
            editor.emit('realtime:scene:error', err);
        });

        editor.realtime.on('error:asset', err => {
            editor.emit('realtime:asset:error', err);
        });

        editor.realtime.on('disconnect', reason => {
            editor.emit('realtime:disconnected', reason);
        });

        editor.realtime.on('authenticated', () => {
            editor.emit('realtime:authenticated');

            if (config.scene.uniqueId) {
                editor.realtime.scenes.load(config.scene.uniqueId);
            }
        });

        editor.realtime.on('whoisonline', (op, data) => {
            editor.call('whoisonline:' + op, data);
        });

        editor.realtime.on('chat:typing', data => {
            editor.call('chat:sync:typing', data);
        });

        editor.realtime.on('chat:msg', data => {
            editor.call('chat:sync:msg', data);
        });

        editor.realtime.on('selection', data => {
            editor.emit('selector:sync:raw', data);
        });

        editor.realtime.on('fs:paths', data => {
            editor.call('assets:fs:paths:patch', data);
        });

        editor.realtime.on('scene:op', (path, op) => {
            editor.emit('realtime:scene:op:' + path, op);
        });

        editor.realtime.on('asset:op', (op, uniqueId) => {
            editor.emit('realtime:op:assets', op, uniqueId);
        });

        editor.realtime.on('load:scene', scene => {
            editor.emit('scene:load', scene.id, scene.uniqueId);
            editor.emit('scene:raw', scene.data);
        });

        editor.method('realtime:connection', function () {
            return editor.realtime.connection.sharedb;
        });

        editor.method('realtime:loadScene', function (uniqueId) {
            editor.realtime.scenes.load(uniqueId);
        });

        // write scene operations
        editor.method('realtime:scene:op', function (op) {
            if (!editor.call('permissions:write') || !editor.realtime.scenes.current)
                return;

            editor.realtime.scenes.current.submitOp(op);
        });

        editor.method('realtime:send', function (name, data) {
            editor.realtime.connection.sendMessage(name, data);
        });

        editor.method('realtime:scene', function () {
            return editor.realtime.scenes.current;
        });

        editor.on('realtime:disconnected', function () {
            editor.emit('permissions:writeState', false);
        });

        editor.on('realtime:connected', function () {
            editor.emit('permissions:writeState', editor.call('permissions:write'));
        });

        editor.on('scene:unload', function (id, uniqueId) {
            editor.realtime.scenes.unload(uniqueId);
        });

        if (editor.call('visibility')) {
            editor.realtime.connection.connect(config.url.realtime.http);
        } else {
            editor.once('visible', () => {
                editor.realtime.connection.connect(config.url.realtime.http);
            });
        }
    });
});
