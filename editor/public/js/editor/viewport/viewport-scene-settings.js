editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var app = editor.call('viewport:framework');
    var assetsLoaded = false;
    var updating;

    // queue settings apply
    var queueApplySettings = function() {
        if (updating || !assetsLoaded)
            return;

        updating = true;

        setTimeout(applySettings, 1000 / 30);
    };

    // apply settings
    var applySettings = function() {
        updating = false;
        app.applySceneSettings(sceneSettings.json());
        editor.call('viewport:render');
    };

    // on settings change
    sceneSettings.on('*:set', queueApplySettings);

    editor.on('assets:load', function () {
        assetsLoaded = true;
        queueApplySettings();
    });

    editor.once('sceneSettings:load', function () {
        queueApplySettings();

        // apply scene settings
        app.applySceneSettings(sceneSettings.json());

        // need to update all materials on scene settings change
        for(var i = 0; i < app.assets._assets.length; i++) {
            if (app.assets._assets[i].type !== 'material')
                continue;

            app.assets._assets[i].resource.update();
        }
    });
});
