import { config } from '@/editor/config';

editor.once('load', () => {
    let userData = null;

    const loadUserData = function () {
        if (!userData && config.scene.id) {
            userData = editor.call('realtime:subscribe:userdata', config.scene.uniqueId, config.self.id);
        }
    };

    editor.method('realtime:subscribe:userdata', (sceneId, userId) => {
        const connection = editor.call('realtime:connection');
        const data = connection.get('user_data', `${sceneId}_${userId}`);

        // error
        data.on('error', (err: unknown) => {
            editor.emit('realtime:userdata:error', err);
        });

        // register op listener once (outside load to avoid duplicates on re-fetch)
        data.on('op', (ops, local) => {
            if (local) {
                return;
            }

            for (let i = 0; i < ops.length; i++) {
                const op = ops[i];
                if (op.p[0]) {
                    editor.emit(`realtime:userdata:${userId}:op:${op.p[0]}`, op);
                }
            }
        });

        // ready to sync
        data.on('load', () => {
            if (!data.type) {
                return;
            }

            editor.emit(`userdata:${userId}:raw`, data.data);
        });

        // subscribe for realtime events. the server rejects user data for a scene it has not loaded,
        // and the relay can report who is online before our own scene doc loads, so wait for that
        if (editor.call('realtime:scene')?.loaded) {
            data.subscribe();
        } else {
            const evt = editor.once('scene:raw', () => data.subscribe());
            data.once('destroy', () => evt.unbind());
        }

        if (data.data) {
            editor.emit(`userdata:${userId}:raw`, data.data);
        }

        return data;
    });

    // destroy user data when the connection drops. sharedb keeps a subscribe or op that was still in
    // flight, resends it on reconnect before the scene has loaded, and only finishes the destroy after
    // that, so take a doc with anything pending off the connection now
    const destroyDisconnected = (data) => {
        data.destroy();
        if (data.hasPending()) {
            data.connection._destroyDoc(data);
        }
    };

    editor.method('realtime:userdata:destroy:disconnected', destroyDisconnected);

    // write userdata operations
    editor.method('realtime:userdata:op', (op: unknown) => {
        if (!editor.call('permissions:read') || !userData || !userData.type) {
            return;
        }

        userData.submitOp([op]);
    });

    // subscribe to permission changes for userdata
    editor.on(`permissions:set:${config.self.id}`, () => {
        if (editor.call('permissions:read') && config.scene.id) {
            loadUserData();
        } else {
            if (userData) {
                userData.destroy();
                userData = null;
            }
        }
    });

    editor.on('realtime:disconnected', () => {
        if (userData) {
            destroyDisconnected(userData);
            userData = null;
        }
    });

    editor.on('scene:unload', () => {
        if (userData) {
            userData.destroy();
            userData = null;
        }
    });

    editor.on('scene:raw', () => {
        if (editor.call('permissions:read')) {
            loadUserData();
        }
    });
});
