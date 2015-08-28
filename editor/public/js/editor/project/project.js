editor.once('load', function() {
    'use strict';

    var project = new Observer();

    var loadedProject = false;

    // Loads current project from the server
    editor.method('project:load', function (callback) {
        Ajax.get('{{url.api}}/projects/{{project.id}}?access_token={{accessToken}}')
        .on('load', function (status, data) {
            project.patch(data.response[0]);

            loadedProject = true;
            if (callback)
                callback(project);
        });
    });

    // Saves specified data to server
    editor.method('project:save', function (data, success, error) {
        Ajax.put('{{url.api}}/projects/{{project.id}}?access_token={{accessToken}}', data)
        .on('load', function () {
            if (success)
                success();
        })
        .on('error', function () {
            if (error)
                error();
        });
    });

    var loadAndExecute = function (fn) {
        if (!loadedProject)
            editor.call('project:load', fn);
        else
            fn();
    };

    // Adds the physics library to the project and updates db
    editor.method('project:enablePhysics', function (callback) {
        loadAndExecute(function () {
            var libraries = project.getRaw('settings.libraries');
            if (libraries.indexOf('physics-engine-3d') < 0) {
                project.insert('settings.libraries', 'physics-engine-3d', libraries.length - 1);

                var data = {
                    name: project.get('name'),
                    settings: project.get('settings')
                };

                editor.call('project:save', data, callback, function (err) {
                    // remove physics from libraries on error
                    project.removeValue('settings.libraries', 'physics-engine-3d');
                });
            }
        });
    });

    editor.method('project:setLoadingScreenScript', function (script, callback) {
        loadAndExecute(function () {
            project.set('settings.loading_screen_script', script);

            var data = {
                name: project.get('name'),
                settings: project.get('settings')
            };

            editor.call('project:save', data, callback, function (err) {
                // remove physics from libraries on error
                project.unset('settings.loading_screen_script');
            });
        });
    });

    editor.method('project:getLoadingScreenScript', function (callback) {
        loadAndExecute(function () {
            callback(project.get('settings.loading_screen_script'));
        });
    });


    editor.method('project:setPrimaryScene', function (sceneId, callback) {
        loadAndExecute(function () {
            var prevPrimary = config.project.primaryScene;
            config.project.primaryScene = parseInt(sceneId, 10);
            project.set('primary_pack', parseInt(sceneId, 10));
            editor.call('project:save', {
                name: project.get('name'),
                primary_pack: config.project.primaryScene
            }, callback, function (err) {
                project.set('primary_pack', prevPrimary);
                config.project.primaryScene = prevPrimary;
            });
        });
    });

    editor.on('messenger:project.primary_pack', function (data) {
        var primaryScene = parseInt(data.project.primary_pack, 10);
        if (loadedProject)
            project.set('primary_pack', primaryScene);

        var prev = config.project.primaryScene;
        config.project.primaryScene = primaryScene;

        editor.emit('project:primaryScene', primaryScene, prev);
    });
});
