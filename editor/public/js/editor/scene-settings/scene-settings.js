editor.once('load', function() {
    'use strict';

    var sceneSettings = new Observer();

    // get scene settings
    editor.method('sceneSettings', function() {
        return sceneSettings;
    });


    // loaded scene
    editor.on('scene:raw', function(data) {
        var sync = sceneSettings.sync ? sceneSettings.sync.enabled : false;
        if (sync)
            sceneSettings.sync.enabled = false;

        var history = sceneSettings.history ? sceneSettings.history.enabled : false;
        if (history)
            sceneSettings.history.enabled = false;

        sceneSettings.patch(data.settings);

        if (data.settings.priority_scripts === undefined && sceneSettings.has('priority_scripts'))
            sceneSettings.unset('priority_scripts');

        if (sync)
            sceneSettings.sync.enabled = sync;

        if (history)
            sceneSettings.history.enabled = true;

        editor.emit('sceneSettings:load', sceneSettings);
    });

    // migrations
    editor.on('sceneSettings:ready', function() {
        // lightmapSizeMultiplier
        if (! sceneSettings.has('render.lightmapSizeMultiplier'))
            sceneSettings.set('render.lightmapSizeMultiplier', 16);

        // lightmapMaxResolution
        if (! sceneSettings.has('render.lightmapMaxResolution'))
            sceneSettings.set('render.lightmapMaxResolution', 2048);

        // lightmapMode
        if (! sceneSettings.has('render.lightmapMode'))
            sceneSettings.set('render.lightmapMode', 0);

        // skyboxIntensity
        if (! sceneSettings.has('render.skyboxIntensity'))
            sceneSettings.set('render.skyboxIntensity', 1);

        // skyboxMip
        if (! sceneSettings.has('render.skyboxMip'))
            sceneSettings.set('render.skyboxMip', 0);
    });

    var onUnload = function() {
        if (sceneSettings.history)
            sceneSettings.history.enabled = false;
        if (sceneSettings.sync)
            sceneSettings.sync.enabled = false;

        sceneSettings.set('render.skybox', null);

        if (sceneSettings.history)
            sceneSettings.history.enabled = true;
        if (sceneSettings.sync)
            sceneSettings.sync.enabled = true;
    };

    editor.on('realtime:disconnected', onUnload);
    editor.on('scene:unload', onUnload);
});
