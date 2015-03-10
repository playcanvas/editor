app.once('load', function() {
    'use strict';

    app.on('sceneSettings:load', function (sceneSettings) {
        var framework = app.call('viewport');
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
            framework._linkUpdatePackSettings(sceneSettings.json());
        };

        // on settings change
        sceneSettings.on('*:set', queueApplySettings);
    });

});
