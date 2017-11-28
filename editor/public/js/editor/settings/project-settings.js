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
        'preserveDrawingBuffer',
        'scripts',
        'transparentCanvas',
        'useDevicePixelRatio',
        'useLegacyScripts',
        'vr',
        'loadingScreenScript',
        'plugins',
        'useModelV2'
    ];

    var data = {};
    for (var i = 0; i < syncPaths.length; i++)
        data[syncPaths[i]] = config.project.settings.hasOwnProperty(syncPaths[i]) ? config.project.settings[syncPaths[i]] : null;

    var settings = editor.call('settings:create', {
        name: 'project',
        scopeType: 'project',
        scopeId: config.project.id,
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
        getItemFn: function () {return settings;}
    });

    // record history
    settings.history.on('record', function(action, data) {
        editor.call('history:' + action, data);
    });

    settings.on('*:set', function (path, value) {
        var parts = path.split('.');
        var obj = config.project.settings;
        for (var i = 0; i < parts.length - 1; i++) {
            if (! obj.hasOwnProperty(parts[i]))
                obj[parts[i]] = {};

            obj = obj[parts[i]];
        }

        // this is limited to simple structures for now
        // so take care
        if (value instanceof Object) {
            var path = parts[parts.length-1];
            obj[path] = {};
            for (var key in value) {
                obj[path][key] = value[key];
            }
        } else {
            obj[parts[parts.length-1]] = value;
        }

    });

    settings.on('*:unset', function (path) {
        var parts = path.split('.');
        var obj = config.project.settings;
        for (var i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }

        delete obj[parts[parts.length-1]];
    });

    // migrations
    editor.on('settings:project:load', function () {
        var history = settings.history.enabled;
        settings.history.enabled = false;
        if (! settings.get('batchGroups')) {
            settings.set('batchGroups', {});
        }
        settings.history.enabled = history;
    });
});
