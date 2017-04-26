editor.once('load', function () {
    'use strict';

    var pushState = true;
    var sceneSelected = false;
    var deletedScenes = {};

    var realtimeAuthenticated = false;

    editor.on('realtime:authenticated', function () {
        realtimeAuthenticated = true;
    });

    editor.on('realtime:disconnected', function () {
        realtimeAuthenticated = false;
    });

    var evtLoadOnAuthenticated = null;

    // Load scene with specified id. If isNew is true
    // then scene settings will open right after loading the new scene
    editor.method('scene:load', function (id, isNew) {
        if (config.scene.id)
            editor.call('scene:unload');

        if (evtLoadOnAuthenticated) {
            evtLoadOnAuthenticated.unbind();
        }

        // if we have not been authenticated with sharejs yet
        // then defer loading until we are authenticated
        if (! realtimeAuthenticated) {
            evtLoadOnAuthenticated = editor.once('realtime:authenticated', function () {
                evtLoadOnAuthenticated = null;
                editor.call('scene:load', id, isNew);
            });

            return;
        }

        editor.emit('scene:beforeload', id);

        editor.call('realtime:loadScene', id);

        if (isNew) {
            editor.once('entities:load', function () {
                editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
            });
        }
    });

    // When scene is loaded
    editor.on('scene:load', function (id) {
        // set config
        config.scene.id = id.toString();
        Ajax.param('scene.id', config.scene.id);

        // add history state
        if (pushState) {
            if (history.length === 1 && window.location.pathname.startsWith('/editor/scene/')) {
                history.replaceState(null, 'Editor', '/editor/scene/' + id + window.location.search);
            } else {
                history.pushState(null, 'Editor', '/editor/scene/' + id + window.location.search);
            }
        }

        pushState = true;

        // clear history in a timeout
        // otherwise some select events might remain
        setTimeout(function () {
            editor.call('history:clear');
        });
    });

    // Unload current scene
    editor.method('scene:unload', function () {
        var id = config.scene.id;
        config.scene.id = null;

        editor.emit('scene:unload', id);
    });

    // When history state changes make sure we load the
    // correct scene based on the new URL
    window.addEventListener('popstate', function (e) {
        var location = window.location.href;

        // close scene picker
        editor.call('picker:scene:close');

        // if this is a scene URL
        if (/scene/.test(location)) {
            var parts = location.split('/');
            var sceneId = parts[parts.length-1];
            // if this is not the current scene
            if (parseInt(sceneId, 10) !== parseInt(config.scene.id)) {
                // if the current scene has been deleted then don't load it
                // but rather make the current URL a project URL so that the scene picker opens
                if (deletedScenes[sceneId]) {
                    history.replaceState(null, 'Editor', '/editor/project/' + config.project.id + window.location.search);
                    // unload current scene
                    editor.call('scene:unload');
                    // open scene picker
                    editor.call('picker:scene');
                } else {
                    // load scene but don't add it to the history
                    pushState = false;
                    editor.call('scene:load', sceneId);
                }
            }
        } else {
            // if this is not a scene URL then
            // unload current scene and show scene picker
            editor.call('scene:unload');
            editor.call('picker:scene');
        }
    });

    // subscribe to messenger pack.delete
    editor.on('messenger:pack.delete', function (data) {
        // add scene to deleted so that we don't try to reopen it
        // on the 'popstate' event
        deletedScenes[data.pack.id] = true;

        // if the current scene has been deleted then change URL to project URL
        if (parseInt(config.scene.id, 10) === parseInt(data.pack.id, 10)) {
            history.replaceState(null, 'Editor', '/editor/project/' + config.project.id + window.location.search);
            editor.call('scene:unload');
            editor.call('picker:scene');
        }
    });
});
