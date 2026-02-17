editor.once('load', () => {
    // cache
    const loaded = {};
    let sceneLoadingCount = 0;
    const loadScene = function (id: string, callback?: (err: Error | null, data?: { uniqueId?: number }) => void, settingsOnly?: boolean) {
        if (loaded[id]) {
            if (callback) {
                callback(null, loaded[id].data);
            }

            return;
        }

        ++sceneLoadingCount;

        const connection = editor.call('realtime:connection');
        const scene = connection.get('scenes', `${id}`);

        // error
        scene.on('error', (err: unknown) => {
            if (callback) {
                callback(new Error(err));
            }

            --sceneLoadingCount;
        });

        // ready to sync
        scene.on('load', () => {
            // cache loaded scene for any subsequent load requests
            loaded[id] = scene;

            // notify of operations
            scene.on('op', (ops: Array<{ p: string[] }>, local: boolean) => {
                if (local) {
                    return;
                }

                for (let i = 0; i < ops.length; i++) {
                    const op = ops[i];

                    // console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));

                    if (op.p[0]) {
                        editor.emit(`realtime:op:${op.p[0]}`, op);
                    }
                }
            });

            // notify of scene load
            const snapshot = scene.data;
            if (settingsOnly !== true) {
                editor.emit('scene:raw', snapshot);
            }
            if (callback) {
                callback(null, snapshot);
            }

            --sceneLoadingCount;
        });

        // subscribe for realtime events
        scene.subscribe();
    };

    editor.method('loadScene', loadScene);
    editor.method('isLoadingScene', () => {
        return sceneLoadingCount > 0;
    });

    editor.on('realtime:authenticated', () => {
        let startedLoading = false;

        // if we are reconnecting try to reload
        // all scenes that we've already loaded
        for (const id in loaded) {
            startedLoading = true;
            loaded[id].destroy();
            delete loaded[id];

            editor.call('loadScene', id);
        }

        // if no scenes have been loaded at
        // all then we are initializing
        // for the first time so load the main scene
        if (!startedLoading) {
            editor.call('loadScene', config.scene.uniqueId);
        }
    });
});
