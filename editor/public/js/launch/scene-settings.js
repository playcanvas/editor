app.once('load', function() {
    'use strict';

    var sceneSettings = new Observer();

    app.once('scene:raw', function(data) {
        sceneSettings.patch(data.settings);

        app.emit("sceneSettings:load", sceneSettings);
    });

    app.method('sceneSettings', function () {
        return sceneSettings;
    });
});
