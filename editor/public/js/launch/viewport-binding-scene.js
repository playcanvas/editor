editor.once('load', function() {
    'use strict';

    editor.on('sceneSettings:load', function (sceneSettings) {
        var framework = editor.call('viewport');
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

            framework.applySceneSettings(sceneSettings.json());
        };

        // on settings change
        sceneSettings.on('*:set', queueApplySettings);

        // initialize
        queueApplySettings();
    });

});
