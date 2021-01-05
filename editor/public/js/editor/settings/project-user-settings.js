editor.once('load', function () {
    'use strict';

    var isConnected = false;

    var settings = editor.call('settings:create', {
        name: 'projectUser',
        id: 'project_' + config.project.id + '_' + config.self.id,
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
                launchMinistats: false,
                locale: 'en-US',
                pipeline: {
                    texturePot: true,
                    textureDefaultToAtlas: false,
                    searchRelatedAssets: true,
                    preserveMapping: false,
                    overwriteModel: true,
                    overwriteAnimation: true,
                    overwriteMaterial: false,
                    overwriteTexture: true,
                    useGlb: false,
                    useContainers: false,
                    defaultAssetPreload: true,
                    animSampleRate: 10,
                    animCurveTolerance: 0,
                    animEnableCubic: false
                }
            },
            branch: config.self.branch.id,
            favoriteBranches: null
        },
        userId: config.self.id
    });

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.call('editor:history')
    });

    // migrations
    editor.on('settings:projectUser:load', function () {
        setTimeout(function () {
            var history = settings.history.enabled;
            settings.history.enabled = false;

            var sync = settings.sync.enabled;
            settings.sync.enabled = editor.call('permissions:read'); // read permissions enough for project user settings

            if (!settings.has('editor.launchMinistats')) {
                settings.set('editor.launchMinistats', false);
            }

            if (! settings.has('editor.pipeline'))
                settings.set('editor.pipeline', {});

            if (! settings.has('editor.pipeline.texturePot'))
                settings.set('editor.pipeline.texturePot', false);

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

            if (! settings.has('editor.locale')) {
                settings.set('editor.locale', 'en-US');
            }

            if (! settings.has('editor.renameDuplicatedEntities')) {
                settings.set('editor.renameDuplicatedEntities', false);
            }

            if (!settings.get('favoriteBranches')) {
                if (config.project.masterBranch) {
                    settings.set('favoriteBranches', [config.project.masterBranch]);
                } else {
                    settings.set('favoriteBranches', []);
                }
            }

            if (!settings.has('editor.pipeline.useGlb')) {
                settings.set('editor.pipeline.useGlb', false);
            }
            if (!settings.has('editor.pipeline.useContainers')) {
                settings.set('editor.pipeline.useContainers', false);
            }

            if (!settings.has('editor.pipeline.defaultAssetPreload')) {
                settings.set('editor.pipeline.defaultAssetPreload', true);
            }

            if (!settings.has('editor.pipeline.animSampleRate')) {
                settings.set('editor.pipeline.animSampleRate', 10);
            }

            if (!settings.has('editor.pipeline.animCurveTolerance')) {
                settings.set('editor.pipeline.animCurveTolerance', 0);
            }

            if (!settings.has('editor.pipeline.animEnableCubic')) {
                settings.set('editor.pipeline.animEnableCubic', false);
            }

            settings.history.enabled = history;
            settings.sync.enabled = sync;
        });
    });

    var reload = function () {
        // config.project.hasReadAccess is only for the launch page
        if (isConnected && (editor.call('permissions:read') || config.project.hasReadAccess)) {
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
