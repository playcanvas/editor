editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var framework = editor.call('viewport:framework');
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
        framework.updateSceneSettings(sceneSettings.json());
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
    });
});
