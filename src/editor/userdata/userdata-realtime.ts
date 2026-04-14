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
                if (ops[i].p[0]) {
                    editor.emit(`realtime:userdata:${userId}:op:${ops[i].p[0]}`, ops[i]);
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

        // subscribe for realtime events
        data.subscribe();

        if (data.data) {
            editor.emit(`userdata:${userId}:raw`, data.data);
        }

        return data;
    });

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
            userData.destroy();
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
