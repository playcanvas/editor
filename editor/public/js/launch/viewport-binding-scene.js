editor.once('load', function() {
    'use strict';

    editor.on('sceneSettings:load', function (sceneSettings) {
        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        var updating;

        // queue settings apply
        var queueApplySettings = function() {
            if (updating)
                return;

            updating = true;

            setTimeout(applySettings, 1000 / 30);
        };

        // apply settings
        var applySettings = function() {
            updating = false;

            app.applySceneSettings(sceneSettings.json());
        };

        // on settings change
        sceneSettings.on('*:set', queueApplySettings);

        // initialize
        queueApplySettings();
    });

});
