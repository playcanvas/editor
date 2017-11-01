editor.once('load', function () {
    'use strict';

    var isConnected = false;

    var settings = editor.call('settings:create', {
        name: 'projectUser',
        scopeType: 'project',
        scopeId: config.project.id,
        deferLoad: true,
        data: {
            editor: {
                cameraNearClip: 0.1,
                cameraFarClip: 1000,
                cameraClearColor: [
                    0.118,
                    0.118,
                    0.118,
                    1
                ],
                gridDivisions: 8,
                gridDivisionSize: 1,
                snapIncrement: 1,
                localServer: 'http://localhost:51000',
                launchDebug: true,
                pipeline: {
                    autoRun: true,
                    texturePot: true,
                    searchRelatedAssets: true,
                    preserveMapping: false,
                    overwriteModel: true,
                    overwriteAnimation: true,
                    overwriteMaterial: false,
                    overwriteTexture: true
                }
            }
        },
        userId: config.self.id
    });

    // add history
    settings.history = true;
    settings.on('*:set', function(path, value, oldValue) {
        if (! settings.history)
            return;

        editor.call('history:add', {
            name: 'project user settings:' + path,
            undo: function() {
                settings.history = false;
                settings.set(path, oldValue);
                settings.history = true;
            },
            redo: function() {
                settings.history = false;
                settings.set(path, value);
                settings.history = true;
            }
        });
    });

    // migrations
    editor.on('settings:projectUser:load', function () {
        setTimeout(function () {
            var history = settings.history;
            settings.history = false;

            if (! settings.has('editor.pipeline'))
                settings.set('editor.pipeline', {});

            if (! settings.has('editor.pipeline.autoRun'))
                settings.set('editor.pipeline.autoRun', true);

            if (! settings.has('editor.pipeline.texturePot'))
                settings.set('editor.pipeline.texturePot', true);

            if (! settings.has('editor.pipeline.searchRelatedAssets'))
                settings.set('editor.pipeline.searchRelatedAssets', true);

            if (! settings.has('editor.pipeline.preserveMapping'))
                settings.set('editor.pipeline.preserveMapping', false);

            if (! settings.has('editor.pipeline.overwriteModel'))
                settings.set('editor.pipeline.overwriteModel', true);

            if (! settings.has('editor.pipeline.overwriteAnimation'))
                settings.set('editor.pipeline.overwriteAnimation', true);

            if (! settings.has('editor.pipeline.overwriteMaterial'))
                settings.set('editor.pipeline.overwriteMaterial', false);

            if (! settings.has('editor.pipeline.overwriteTexture'))
                settings.set('editor.pipeline.overwriteTexture', true);

            settings.history = history;
        });
    });

    var reload = function () {
        if (isConnected && editor.call('permissions:read')) {
            settings.reload(settings.scopeId);
        }
    };

    // handle permission changes
    editor.on('permissions:set:' + config.self.id, function (accesslevel) {
        if (editor.call('permissions:read')) {
            // reload settings
            if (! settings.sync) {
                settings.history = true;
                reload();
            }
        } else {
            // unset private settings
            if (settings.sync) {
                settings.disconnect();
                settings.history = false;
            }
        }
    });

    editor.on('realtime:authenticated', function () {
        isConnected = true;
        reload();
    });

    editor.on('realtime:disconnected', function () {
        isConnected = false;
    });
});
