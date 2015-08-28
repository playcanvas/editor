editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var app = editor.call('viewport:framework');
    var viewportLoaded = false;
    var assetsLoaded = false;
    var updating;

    editor.once('viewport:load', function () {
        viewportLoaded = true;
        queueApplySettings();
    });

    // queue settings apply
    var queueApplySettings = function() {
        if (updating || !assetsLoaded || !viewportLoaded)
            return;

        updating = true;

        setTimeout(applySettings, 1000 / 30);
    };

    // apply settings
    var applySettings = function() {
        updating = false;
        app.applySceneSettings(sceneSettings.json());

        // apply scene settings
        app.applySceneSettings(sceneSettings.json());

        // need to update all materials on scene settings change
        for(var i = 0; i < app.assets._assets.length; i++) {
            if (app.assets._assets[i].type !== 'material' || !app.assets._assets[i].resource)
                continue;

            app.assets._assets[i].resource.update();
        }

        editor.call('viewport:render');
    };

    // on settings change
    sceneSettings.on('*:set', queueApplySettings);

    editor.on('assets:load', function () {
        assetsLoaded = true;
        queueApplySettings();
    });

    editor.on('sceneSettings:load', function () {
        queueApplySettings();
    });
});
