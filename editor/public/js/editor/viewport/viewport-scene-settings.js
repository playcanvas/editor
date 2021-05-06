editor.once('load', function () {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var assetsLoaded = false;
    var sceneSettingsLoaded = false;
    var updating;

    // apply settings
    var applySettings = function () {
        if (! app) return;

        updating = false;

        // apply scene settings
        app.applySceneSettings(sceneSettings.json());

        // need to update all materials on scene settings change
        for (let i = 0; i < app.assets._assets.length; i++) {
            if (app.assets._assets[i].type !== 'material' || !app.assets._assets[i].resource)
                continue;

            app.assets._assets[i].resource.update();
        }

        editor.call('viewport:render');
    };

    // queue settings apply
    var queueApplySettings = function () {
        if (! sceneSettingsLoaded || updating || ! assetsLoaded)
            return;

        updating = true;

        editor.call('viewport:render');
        editor.once('viewport:update', applySettings);
    };

    // on settings change
    sceneSettings.on('*:set', queueApplySettings);

    editor.on('assets:load', function () {
        assetsLoaded = true;
        queueApplySettings();
    });

    editor.on('sceneSettings:load', function () {
        sceneSettingsLoaded = true;
        queueApplySettings();
    });
});
