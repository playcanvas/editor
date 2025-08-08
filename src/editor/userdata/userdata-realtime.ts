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
        data.on('error', (err) => {
            editor.emit('realtime:userdata:error', err);
        });

        // ready to sync
        data.on('load', () => {
            // notify of operations
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

            // notify of scene load
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
    editor.method('realtime:userdata:op', (op) => {
        if (!editor.call('permissions:read') || !userData) {
            return;
        }

        // console.trace();
        // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
        // console.log(op)

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
