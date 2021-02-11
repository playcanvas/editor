editor.once('load', function () {
    'use strict';

    var syncPaths = [
        'antiAlias',
        'batchGroups',
        'fillMode',
        'resolutionMode',
        'height',
        'width',
        'use3dPhysics',
        'preferWebGl2',
        'powerPreference',
        'preserveDrawingBuffer',
        'scripts',
        'transparentCanvas',
        'useDevicePixelRatio',
        'useLegacyScripts',
        'useKeyboard',
        'useMouse',
        'useGamepads',
        'useTouch',
        'vr',
        'loadingScreenScript',
        'externalScripts',
        'plugins',
        'layers',
        'layerOrder',
        'i18nAssets',
        'useLegacyAmmoPhysics',
        'useLegacyAudio',
        'maxAssetRetries'
    ];

    var data = {};
    for (let i = 0; i < syncPaths.length; i++)
        data[syncPaths[i]] = config.project.settings.hasOwnProperty(syncPaths[i]) ? config.project.settings[syncPaths[i]] : null;

    var settings = editor.call('settings:create', {
        name: 'project',
        id: config.project.settings.id,
        data: data
    });

    if (! settings.get('useLegacyScripts')) {
        pc.script.legacy = false;
    } else {
        pc.script.legacy = true;
    }

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.call('editor:history')
    });

    settings.on('*:set', function (path, value) {
        var parts = path.split('.');
        var obj = config.project.settings;
        for (let i = 0; i < parts.length - 1; i++) {
            if (! obj.hasOwnProperty(parts[i]))
                obj[parts[i]] = {};

            obj = obj[parts[i]];
        }

        // this is limited to simple structures for now
        // so take care
        if (value instanceof Object) {
            var path = parts[parts.length - 1];
            obj[path] = {};
            for (var key in value) {
                obj[path][key] = value[key];
            }
        } else {
            obj[parts[parts.length - 1]] = value;
        }
    });

    settings.on('*:unset', function (path) {
        var parts = path.split('.');
        var obj = config.project.settings;
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }

        delete obj[parts[parts.length - 1]];
    });

    settings.on('*:insert', function (path, value, index) {
        var parts = path.split('.');
        var obj = config.project.settings;
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }

        var arr = obj[parts[parts.length - 1]];
        if (Array.isArray(arr)) {
            arr.splice(index, 0, value);
        }
    });

    settings.on('*:remove', function (path, value, index) {
        var parts = path.split('.');
        var obj = config.project.settings;
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }

        var arr = obj[parts[parts.length - 1]];
        if (Array.isArray(arr)) {
            arr.splice(index, 1);
        }
    });

    // migrations
    editor.on('settings:project:load', function () {
        var history = settings.history.enabled;
        var sync = settings.sync.enabled;

        settings.history.enabled = false;
        settings.sync.enabled = editor.call('permissions:write');

        if (! settings.get('batchGroups')) {
            settings.set('batchGroups', {});
        }
        if (! settings.get('layers')) {
            settings.set('layers', {
                0: {
                    name: 'World',
                    opaqueSortMode: 2,
                    transparentSortMode: 3
                },
                1: {
                    name: 'Depth',
                    opaqueSortMode: 2,
                    transparentSortMode: 3
                },
                2: {
                    name: 'Skybox',
                    opaqueSortMode: 0,
                    transparentSortMode: 3
                },
                3: {
                    name: 'Immediate',
                    opaqueSortMode: 0,
                    transparentSortMode: 3
                },
                4: {
                    name: 'UI',
                    opaqueSortMode: 1,
                    transparentSortMode: 1
                }
            });

            settings.set('layerOrder', []);
            settings.insert('layerOrder', {
                layer: LAYERID_WORLD,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_DEPTH,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_SKYBOX,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_WORLD,
                transparent: true,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_IMMEDIATE,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_IMMEDIATE,
                transparent: true,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_UI,
                transparent: true,
                enabled: true
            });
        }

        if (settings.get('useKeyboard') === null) {
            settings.set('useKeyboard', true);
        }
        if (settings.get('useMouse') === null) {
            settings.set('useMouse', true);
        }
        if (settings.get('useTouch') === null) {
            settings.set('useTouch', true);
        }
        if (settings.get('useGamepads') === null) {
            settings.set('useGamepads', !!settings.get('vr'));
        }

        if (!settings.get('i18nAssets')) {
            settings.set('i18nAssets', []);
        }

        if (!settings.get('externalScripts')) {
            settings.set('externalScripts', []);
        }

        if (settings.get('powerPreference') === null) {
            settings.set('powerPreference', 'default');
        }

        if (settings.get('maxAssetRetries') === null) {
            settings.set('maxAssetRetries', 0);
        }

        settings.history.enabled = history;
        settings.sync.enabled = sync;
    });
});
