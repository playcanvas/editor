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
                    texturePot: true,
                    textureDefaultToAtlas: false,
                    searchRelatedAssets: true,
                    preserveMapping: false,
                    overwriteModel: true,
                    overwriteAnimation: true,
                    overwriteMaterial: false,
                    overwriteTexture: true
                }
            },
            branch: null
        },
        userId: config.self.id
    });

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        getItemFn: function () {return settings;}
    });

    // record history
    settings.history.on('record', function(action, data) {
        editor.call('history:' + action, data);
    });

    // migrations
    editor.on('settings:projectUser:load', function () {
        setTimeout(function () {
            var history = settings.history.enabled;
            settings.history.enabled = false;

            if (! settings.has('editor.pipeline'))
                settings.set('editor.pipeline', {});

            if (! settings.has('editor.pipeline.texturePot'))
                settings.set('editor.pipeline.texturePot', true);

            if (! settings.has('editor.pipeline.searchRelatedAssets'))
                settings.set('editor.pipeline.searchRelatedAssets', true);

            if (! settings.has('editor.pipeline.preserveMapping'))
                settings.set('editor.pipeline.preserveMapping', false);

            if (! settings.has('editor.pipeline.textureDefaultToAtlas'))
                settings.set('editor.pipeline.textureDefaultToAtlas', false);

            if (! settings.has('editor.pipeline.overwriteModel'))
                settings.set('editor.pipeline.overwriteModel', true);

            if (! settings.has('editor.pipeline.overwriteAnimation'))
                settings.set('editor.pipeline.overwriteAnimation', true);

            if (! settings.has('editor.pipeline.overwriteMaterial'))
                settings.set('editor.pipeline.overwriteMaterial', false);

            if (! settings.has('editor.pipeline.overwriteTexture'))
                settings.set('editor.pipeline.overwriteTexture', true);

            if (! settings.get('branch')) {
                settings.set('branch', config.project.masterBranch);
            }

            settings.history.enabled = history;
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
                settings.history.enabled = true;
                reload();
            }
        } else {
            // unset private settings
            if (settings.sync) {
                settings.disconnect();
                settings.history.enabled = false;
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
