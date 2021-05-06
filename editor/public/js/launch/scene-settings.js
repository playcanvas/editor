editor.once('load', function () {
    'use strict';

    var sceneSettings = new Observer();

    editor.once('scene:raw', function (data) {
        sceneSettings.patch(data.settings);

        editor.emit("sceneSettings:load", sceneSettings);
    });

    editor.method('sceneSettings', function () {
        return sceneSettings;
    });
});
