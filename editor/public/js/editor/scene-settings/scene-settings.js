editor.once('load', function() {
    'use strict';

    var sceneSettings = new Observer();

    // get scene settings
    editor.method('sceneSettings', function() {
        return sceneSettings;
    });


    // loaded scene
    editor.on('scene:raw', function(data) {
        var sync = sceneSettings.sync ? sceneSettings.sync.enabled : false;
        if (sync)
            sceneSettings.sync.enabled = false;

        var history = sceneSettings.history ? sceneSettings.history.enabled : false;
        if (history)
            sceneSettings.history.enabled = false;

        if (data.settings.priority_scripts === undefined)
            data.settings.priority_scripts = [];

        sceneSettings.patch(data.settings);

        if (history)
            sceneSettings.history.enabled = true;

        if (sync)
            sceneSettings.sync.enabled = sync;

        editor.emit('sceneSettings:load', sceneSettings);
    });

    editor.on('scene:unload', function () {
        if (sceneSettings.history)
            sceneSettings.history.enabled = false;
        if (sceneSettings.sync)
            sceneSettings.sync.enabled = false;

        sceneSettings.set('render.skybox', null);

        if (sceneSettings.history)
            sceneSettings.history.enabled = true;
        if (sceneSettings.sync)
            sceneSettings.sync.enabled = true;
    });
});
