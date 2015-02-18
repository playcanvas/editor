editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var framework = editor.call('viewport:framework');
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
        editor.call('viewport:render');
    };

    // on settings change
    sceneSettings.on('*:set', queueApplySettings);
});
