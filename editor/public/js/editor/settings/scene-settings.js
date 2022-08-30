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

        const renderDefaults = {
            lightmapSizeMultiplier: 16,
            lightmapMaxResolution: 2048,
            lightmapMode: 0,
            skyboxIntensity: 1,
            skyboxMip: 0,
            skyboxRotation: [0, 0, 0],
            lightmapFilterEnabled: false,
            lightmapFilterRange: 10,
            lightmapFilterSmoothness: 0.2,
            ambientBake: false,
            ambientBakeNumSamples: 1,
            ambientBakeSpherePart: 0.4,
            ambientBakeOcclusionBrightness: 0,
            ambientBakeOcclusionContrast: 0,
            clusteredLightingEnabled: true,
            lightingCells: [10, 3, 10],
            lightingMaxLightsPerCell: 255,
            lightingCookieAtlasResolution: 2048,
            lightingShadowAtlasResolution: 2048,
            lightingShadowType: 0,
            lightingCookiesEnabled: false,
            lightingAreaLightsEnabled: false,
            lightingShadowsEnabled: true
        };

        for (const key in renderDefaults) {
            const path = `render.${key}`;
            if (!sceneSettings.has(path)) {
                sceneSettings.set(path, renderDefaults[key]);
            }
        }
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
