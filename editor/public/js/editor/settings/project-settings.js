editor.once('load', function () {
    'use strict';

    var syncPaths = [
        'antiAlias',
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
        'plugins'
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
    settings.history = true;
    settings.on('*:set', function(path, value, oldValue) {
        // update config.project.settings
        config.project.settings[path] = value;

        if (! settings.history)
            return;

        editor.call('history:add', {
            name: 'project settings:' + path,
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
});
