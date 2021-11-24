editor.once('load', function () {
    'use strict';


    // get scene settings
    editor.method('sceneSettings', function () {
        return editor.settings.scene._observer;
    });

    // when settings are loaded...
    editor.settings.scene.on('load', () => {
        const settings = editor.settings.scene;
        const sync = settings._observer.sync && settings._observer.sync.enabled;
        if (sync) {
            settings._observer.sync.enabled = false;
        }

        // remove priority_scripts
        if (editor.realtime.scenes.current.data.settings.priority_scripts === undefined &&
            settings.has('priority_scripts')) {
            settings._observer.unset('priority_scripts');
        }

        if (sync) {
            settings._observer.sync.enabled = true;
        }

        editor.emit('sceneSettings:load', settings._observer);
    });

    // migrations
    editor.on('sceneSettings:ready', function () {
        const sceneSettings = editor.settings.scene._observer;

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

        // skyboxRotation
        if (! sceneSettings.has('render.skyboxRotation'))
            sceneSettings.set('render.skyboxRotation', [0, 0, 0]);
    });

    var onUnload = function () {
        const sceneSettings = editor.settings.scene._observer;

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
