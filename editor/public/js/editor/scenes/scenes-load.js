editor.once('load', function () {
    'use strict';

    var pushState = true;

    var deletedScenes = {};

    editor.method('scene:load', function (id, isNew) {
        if (config.scene.id)
            editor.call('scene:unload');

        editor.emit('scene:beforeload', id);

        editor.call('realtime:loadScene', id);

        if (isNew)
            editor.once('entities:load', function () {
                editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
            });
    });

    editor.on('scene:load', function (id) {
        // set config
        config.scene.id = id.toString();
        Ajax.param('scene.id', config.scene.id);

        if (pushState) {
            history.pushState(null, 'Editor', '/editor/scene/' + id);
        }

        pushState = true;

        // clear history in a timeout
        // otherwise some select events might remain
        setTimeout(function () {
            editor.call('history:clear');
        });
    });

    editor.method('scene:unload', function () {
        var id = config.scene.id;
        config.scene.id = null;

        editor.emit('scene:unload', id);
    });

    window.addEventListener('popstate', function (e) {
        var location = e.path[0].location.pathname;

        editor.call('picker:scene:close');

        if (/scene/.test(location)) {
            var parts = location.split('/');
            var sceneId = parts[parts.length-1];
            if (parseInt(sceneId, 10) !== parseInt(config.scene.id)) {
                if (deletedScenes[sceneId]) {
                    history.replaceState(null, 'Editor', '/editor/project/' + config.project.id);
                    editor.call('scene:unload');
                    editor.call('picker:scene');
                } else {
                    pushState = false;
                    editor.call('scene:load', sceneId);
                }
            }
        } else {
            editor.call('scene:unload');
            editor.call('picker:scene');
        }
    });

     // subscribe to messenger pack.delete
    editor.on('messenger:pack.delete', function (data) {
        deletedScenes[data.pack.id] = true;

        if (parseInt(config.scene.id, 10) === parseInt(data.pack.id, 10)) {
            history.replaceState(null, 'Editor', '/editor/project/' + config.project.id);
            editor.call('scene:unload');
            editor.call('picker:scene');
        }
    });
});