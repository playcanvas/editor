import { config } from '@/editor/config';

editor.once('start', () => {
    const realtime = editor.api.globals.realtime;
    realtime.on('cannotConnect', () => {
        editor.emit('realtime:cannotConnect');
    });

    realtime.on('connecting', (attempts: number) => {
        editor.emit('realtime:connecting', attempts);
    });

    realtime.on('nextAttempt', (interval: number) => {
        editor.emit('realtime:nextAttempt', interval);
    });

    realtime.on('connected', () => {
        console.log('realtime connected');
        editor.emit('realtime:connected');
    });

    realtime.on('error', (err: unknown) => {
        console.error('realtime error', err);
        editor.emit('realtime:error', err);
    });

    realtime.on('error:bs', (err: string) => {
        editor.call('status:error', err);
    });

    realtime.on('error:scene', (err: unknown) => {
        editor.emit('realtime:scene:error', err);
    });

    realtime.on('error:asset', (err: unknown) => {
        editor.emit('realtime:asset:error', err);
    });

    realtime.on('disconnect', (reason: string) => {
        console.log('realtime disconnected', reason);
        editor.emit('realtime:disconnected', reason);
    });

    realtime.on('authenticated', () => {
        editor.emit('realtime:authenticated');

        if (config.scene.uniqueId) {
            realtime.scenes.load(config.scene.uniqueId);
        }
    });

    realtime.on('whoisonline', (op: string, data: unknown) => {
        editor.call(`whoisonline:${op}`, data);
    });

    realtime.on('chat:typing', (data: unknown) => {
        editor.call('chat:sync:typing', data);
    });

    realtime.on('chat:msg', (data: unknown) => {
        editor.call('chat:sync:msg', data);
    });

    realtime.on('selection', (data: unknown) => {
        editor.emit('selector:sync:raw', data);
    });

    realtime.on('fs:paths', (data: unknown) => {
        editor.call('assets:fs:paths:patch', data);
    });

    realtime.on('scene:op', (path: string, op: unknown) => {
        editor.emit(`realtime:scene:op:${path}`, op);
    });

    realtime.on('asset:op', (op: unknown, uniqueId: string) => {
        editor.emit('realtime:op:assets', op, uniqueId);
    });

    realtime.on('load:scene', (scene: { id: string; uniqueId: string; data: unknown }) => {
        editor.emit('scene:load', scene.id, scene.uniqueId);
        editor.emit('scene:raw', scene.data);
    });

    editor.method('realtime:connection', () => {
        return realtime.connection.sharedb;
    });

    editor.method('realtime:loadScene', (uniqueId: string) => {
        realtime.scenes.load(uniqueId);
    });

    // write scene operations
    editor.method('realtime:scene:op', (op: unknown) => {
        if (!editor.call('permissions:write') || !realtime.scenes.current) {
            return;
        }

        realtime.scenes.current.submitOp(op);
    });

    editor.method('realtime:send', (name: string, data: unknown) => {
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

    editor.on('scene:unload', (_id: string, uniqueId: string) => {
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
