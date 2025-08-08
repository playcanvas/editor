editor.once('load', () => {
    let currentRoom;
    let relayEnabled = true;

    editor.on('relay:disconnected', () => {
        currentRoom = null;
    });

    editor.on('relay:connected', () => {
        if (config.scene.uniqueId && editor.api.globals.realtime.connection.authenticated) {
            onSceneLoad(config.scene.uniqueId);
        }
    });

    editor.on('realtime:disconnected', () => {
        if (currentRoom) {
            onSceneUnload(currentRoom);
        }
    });

    editor.on('relay:room:join', (data) => {
        if (!data.name.startsWith('scene-')) {
            return;
        }

        if (data.name !== `scene-${config.scene.uniqueId}`) {
            onSceneUnload(data.name.substring('scene-').length);
            return;
        }

        if (config.scene.uniqueId && data.name !== `scene-${config.scene.uniqueId}`) {
            return;
        }

        if (data.users) {
            editor.call('whoisonline:set', data.users);
        } else {
            editor.call('whoisonline:add', data.userId);
        }
    });

    editor.on('relay:room:leave', (data) => {
        if (!data.name.startsWith('scene-')) {
            return;
        }

        if (config.scene.uniqueId && data.name !== `scene-${config.scene.uniqueId}`) {
            return;
        }

        if (data.userId === config.self.id) {
            editor.call('whoisonline:set', []);
        } else {
            editor.call('whoisonline:remove', data.userId);
        }
    });

    function onSceneLoad(uniqueId) {
        if (!relayEnabled) {
            return;
        }
        if (currentRoom === uniqueId) {
            return;
        }

        currentRoom = config.scene.uniqueId;
        editor.call('relay:joinRoom', `scene-${uniqueId}`);
    }

    function onSceneUnload(uniqueId) {
        editor.call('relay:leaveRoom', `scene-${uniqueId}`);
        if (currentRoom === uniqueId) {
            currentRoom = null;
        }
    }

    editor.on('scene:load', (id, uniqueId) => {
        if (editor.call('relay:isConnected')) {
            onSceneLoad(uniqueId);
        }
    });

    editor.on('scene:unload', (id, uniqueId) => {
        if (!relayEnabled) {
            return;
        }
        if (editor.call('relay:isConnected')) {
            onSceneUnload(uniqueId);
        }
    });

    editor.method('whoisonline:scene:enabled', (enabled) => {
        relayEnabled = enabled;
    });
});
