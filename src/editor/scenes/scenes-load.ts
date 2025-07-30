editor.once('load', () => {
    let pushState = true;
    const deletedScenes = {};

    let realtimeAuthenticated = false;

    editor.on('realtime:authenticated', () => {
        realtimeAuthenticated = true;
    });

    editor.on('realtime:disconnected', () => {
        realtimeAuthenticated = false;
    });

    let evtLoadOnAuthenticated = null;

    // Change URL to project, unload current scene and open scene picker
    const goToProject = function () {
        history.replaceState(null, 'Editor', `/editor/project/${config.project.id}${window.location.search}`);
        editor.call('scene:unload');
        editor.call('picker:scene');
    };

    // Load scene with specified id. If isNew is true
    // then scene settings will open right after loading the new scene
    editor.method('scene:load', (uniqueId, isNew) => {
        if (config.scene.id) {
            editor.call('scene:unload');
        }

        if (evtLoadOnAuthenticated) {
            evtLoadOnAuthenticated.unbind();
        }

        // if we have not been authenticated with shareDb yet
        // then defer loading until we are authenticated
        if (!realtimeAuthenticated) {
            evtLoadOnAuthenticated = editor.once('realtime:authenticated', () => {
                evtLoadOnAuthenticated = null;
                editor.call('scene:load', uniqueId, isNew);
            });

            return;
        }

        editor.emit('scene:beforeload', uniqueId);

        editor.call('realtime:loadScene', uniqueId);

        if (isNew) {
            editor.once('entities:load', () => {
                editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
            });
        }
    });

    // When scene is loaded
    editor.on('scene:load', (id, uniqueId) => {
        // set config
        config.scene.id = id.toString();
        config.scene.uniqueId = uniqueId.toString();

        // add history state
        if (pushState) {
            if (history.length === 1 && window.location.pathname.startsWith('/editor/scene/')) {
                history.replaceState(null, 'Editor', `/editor/scene/${id}${window.location.search}`);
            } else {
                history.pushState(null, 'Editor', `/editor/scene/${id}${window.location.search}`);
            }
        }

        pushState = true;

        // clear history in a timeout
        // otherwise some select events might remain
        setTimeout(() => {
            const history = editor.api.globals.history;
            if (history) {
                history.clear();
            }
        });
    });

    // Unload current scene
    editor.method('scene:unload', () => {
        const id = config.scene.id;
        const uniqueId = config.scene.uniqueId;
        config.scene.id = null;
        config.scene.uniqueId = null;

        editor.emit('scene:unload', id, uniqueId);
    });

    // When history state changes make sure we load the
    // correct scene based on the new URL
    window.addEventListener('popstate', (e) => {
        const location = window.location.href;

        // close scene picker
        editor.call('picker:scene:close');

        // if this is a scene URL
        if (/scene/.test(location)) {
            const parts = location.split('/');
            const sceneId = parts[parts.length - 1];
            // if this is not the current scene
            if (parseInt(sceneId, 10) !== parseInt(config.scene.id, 10)) {
                // if the current scene has been deleted then don't load it
                // but rather make the current URL a project URL so that the scene picker opens
                if (deletedScenes[sceneId]) {
                    goToProject();
                } else {
                    // unload current scene
                    if (config.scene.id) {
                        editor.call('scene:unload');
                    }
                    // get scene from the API to get the unique id
                    editor.call('scenes:get', sceneId, (err, scene) => {
                        if (err) {
                            goToProject();
                        } else {
                            // load scene but don't add it to the history
                            pushState = false;
                            editor.call('scene:load', scene.uniqueId);
                        }
                    });
                }
            }
        } else {
            // if this is not a scene URL then
            // unload current scene and show scene picker
            editor.call('scene:unload');
            editor.call('picker:scene');
        }
    });

    // subscribe to messenger scene.delete
    editor.on('messenger:scene.delete', (data) => {
        if (data.scene.branchId !== config.self.branch.id) return;

        // add scene to deleted so that we don't try to reopen it
        // on the 'popstate' event
        deletedScenes[data.scene.id] = true;

        // if the current scene has been deleted then change URL to project URL
        if (parseInt(config.scene.id, 10) === parseInt(data.scene.id, 10)) {
            goToProject();
        }
    });
});
